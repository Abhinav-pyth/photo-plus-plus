/**
 * Web Worker for CPU-heavy pixel processing. Receives raw RGBA buffers via
 * transferable objects (zero-copy) and returns enhanced pixels the same way.
 * The worker never performs network I/O — it can't: fetch/XHR are not used
 * anywhere in this file, and images only arrive as in-memory buffers.
 */

/// <reference lib="webworker" />

import type { WorkerRequest, WorkerResponse } from '../lib/image-processing/types';
import { enhancePixels } from '../lib/image-processing/enhance';

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  if (msg.type !== 'enhance') return;

  const post = (r: WorkerResponse, transfer: Transferable[] = []) =>
    (self as unknown as Worker).postMessage(r, transfer);

  try {
    const src = new Uint8ClampedArray(msg.payload.buffer);
    post({ type: 'progress', value: 0 });
    const result = enhancePixels(src, msg.payload.width, msg.payload.height, msg.params, (v) => {
      post({ type: 'progress', value: Math.min(1, v) });
    });
    post(
      { type: 'result', payload: { width: result.width, height: result.height, buffer: result.buffer } },
      [result.buffer],
    );
  } catch (err) {
    post({ type: 'error', message: err instanceof Error ? err.message : 'Processing failed.' });
  }
};
