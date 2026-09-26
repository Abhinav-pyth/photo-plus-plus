'use client';

/**
 * Client-side processing engine abstraction.
 *
 *  - Spins up the Web Worker (workers/image-worker.ts) so heavy pixel math
 *    never blocks the UI thread; falls back to the identical pipeline on the
 *    main thread if workers are unavailable.
 *  - Debounces rapid slider changes and keeps only the latest request in
 *    flight — results for stale requests are discarded.
 *
 * PRIVACY: this module moves pixels between memory locations inside the
 * browser tab only. No fetch / XHR / sendBeacon anywhere — images physically
 * cannot leave the device through this code path.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { EnhanceParams, RawImagePayload, WorkerRequest, WorkerResponse } from '@/lib/image-processing/types';
import { enhancePixels, computeStats, autoEnhanceParams } from '@/lib/image-processing/enhance';

export interface EngineState {
  processing: boolean;
  progress: number; // 0..1
  result: RawImagePayload | null;
  error: string | null;
}

type Listener = (state: EngineState) => void;

const IDLE: EngineState = { processing: false, progress: 0, result: null, error: null };

class ProcessingEngine {
  private worker: Worker | null = null;
  private state: EngineState = IDLE;
  private listeners = new Set<Listener>();
  private source: RawImagePayload | null = null;
  private activeId = 0;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private busy = false;
  private queued: { params: EnhanceParams; id: number } | null = null;

  constructor() {
    if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
      try {
        this.worker = new Worker(new URL('@/workers/image-worker.ts', import.meta.url), { type: 'module' });
        this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => this.handleMessage(e.data);
        this.worker.onerror = () => {
          // Broken worker → silently fall back to main-thread processing.
          this.worker?.terminate();
          this.worker = null;
        };
      } catch {
        this.worker = null;
      }
    }
  }

  subscribe(fn: Listener): () => void {
    this.listeners.add(fn);
    fn(this.state);
    return () => {
      this.listeners.delete(fn);
    };
  }

  getState(): EngineState {
    return this.state;
  }

  setSource(payload: RawImagePayload | null): void {
    this.cancel();
    this.source = payload;
    this.setState(IDLE);
  }

  /** Schedule an enhancement with debounce (used for live slider drags). */
  requestEnhance(params: EnhanceParams): void {
    if (!this.source) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => this.startRun(params), 110);
  }

  /** Immediate run used by presets / Auto Enhance button. */
  enhanceNow(params: EnhanceParams): void {
    if (!this.source) return;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.startRun(params);
  }

  /** Analyse the image locally (histogram + gradients) and apply computed params. */
  autoEnhance(): EnhanceParams | null {
    if (!this.source) return null;
    const data = new Uint8ClampedArray(this.source.buffer.slice(0));
    const stats = computeStats(data, this.source.width, this.source.height);
    const params = autoEnhanceParams(stats);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.startRun(params);
    return params;
  }

  cancel(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.activeId++; // invalidate any in-flight result
    this.queued = null;
    this.setState({ ...this.state, processing: false, progress: 0 });
  }

  dispose(): void {
    this.cancel();
    this.worker?.terminate();
    this.worker = null;
    this.listeners.clear();
  }

  /* ------------------------------ internals ------------------------------ */

  private startRun(params: EnhanceParams) {
    if (!this.source) return;
    const id = ++this.activeId;
    this.setState({ ...this.state, processing: true, progress: 0, error: null });
    if (this.busy) {
      // A run is in flight: remember only the newest request.
      this.queued = { params, id };
      return;
    }
    this.execute(params, id);
  }

  private execute(params: EnhanceParams, id: number) {
    const source = this.source!;
    this.busy = true;
    if (this.worker) {
      const copy = source.buffer.slice(0);
      const req: WorkerRequest = { type: 'enhance', payload: { width: source.width, height: source.height, buffer: copy }, params };
      this.worker.postMessage(req, [copy]);
      this.currentRunId = id;
    } else {
      // Main-thread fallback: defer one frame so the spinner can paint first.
      this.currentRunId = id;
      setTimeout(() => {
        try {
          const src = new Uint8ClampedArray(source.buffer.slice(0));
          const res = enhancePixels(src, source.width, source.height, params, (v) => {
            if (id === this.currentRunId) this.setState({ ...this.state, progress: v });
          });
          this.complete({ width: res.width, height: res.height, buffer: res.buffer }, id);
        } catch (err) {
          this.fail(err instanceof Error ? err.message : 'Processing failed.', id);
        }
      }, 30);
    }
  }

  private currentRunId = 0;

  private handleMessage(msg: WorkerResponse) {
    if (msg.type === 'progress') {
      this.setState({ ...this.state, progress: msg.value });
    } else if (msg.type === 'result') {
      this.complete(msg.payload, this.currentRunId);
    } else if (msg.type === 'error') {
      this.fail(msg.message, this.currentRunId);
    }
  }

  private complete(payload: RawImagePayload, id: number) {
    this.busy = false;
    if (id !== this.currentRunId || !this.source) return; // stale
    this.setState({ processing: false, progress: 1, result: payload, error: null });
    if (this.queued) {
      const q = this.queued;
      this.queued = null;
      this.execute(q.params, q.id);
    }
  }

  private fail(message: string, id: number) {
    this.busy = false;
    if (id !== this.currentRunId) return;
    this.setState({ ...this.state, processing: false, error: message });
    if (this.queued) {
      const q = this.queued;
      this.queued = null;
      this.execute(q.params, q.id);
    }
  }

  private setState(s: EngineState) {
    this.state = s;
    this.listeners.forEach((l) => l(s));
  }
}

let singleton: ProcessingEngine | null = null;
function getEngine(): ProcessingEngine {
  if (!singleton) singleton = new ProcessingEngine();
  return singleton;
}

export function useProcessingEngine() {
  const engineRef = useRef<ProcessingEngine | null>(null);
  if (!engineRef.current) engineRef.current = getEngine();
  const [state, setState] = useState<EngineState>(IDLE);

  useEffect(() => engineRef.current!.subscribe(setState), []);

  const requestEnhance = useCallback((p: EnhanceParams) => engineRef.current!.requestEnhance(p), []);
  const enhanceNow = useCallback((p: EnhanceParams) => engineRef.current!.enhanceNow(p), []);
  const autoEnhance = useCallback(() => engineRef.current!.autoEnhance(), []);
  const setSource = useCallback((payload: RawImagePayload | null) => engineRef.current!.setSource(payload), []);

  return { state, requestEnhance, enhanceNow, autoEnhance, setSource };
}
