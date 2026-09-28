'use client';

/**
 * Realistic split-screen before/after comparison viewer.
 *
 *  - Draggable vertical divider (pointer + touch)
 *  - Before / After toggle buttons
 *  - Zoom (wheel / buttons), fit-to-screen, fullscreen, reset
 *
 * Both images are <canvas> elements painted from in-browser pixel buffers;
 * nothing is ever fetched from a server.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import type { RawImagePayload } from '@/lib/image-processing/types';
import { paintToCanvas } from '@/lib/image-processing/image-utils';

interface Props {
  original: RawImagePayload | null;
  enhanced: RawImagePayload | null;
}

type ViewMode = 'split' | 'before' | 'after';

export default function BeforeAfter({ original, enhanced }: Props) {
  const origRef = useRef<HTMLCanvasElement>(null);
  const enhRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const [position, setPosition] = useState(50); // %
  const [mode, setMode] = useState<ViewMode>('split');
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [animatingDivider, setAnimatingDivider] = useState(true);
  const isFullscreen = useRef(false);

  /* Paint canvases whenever payloads change */
  useEffect(() => {
    if (original && origRef.current) paintToCanvas(origRef.current, original);
  }, [original]);
  useEffect(() => {
    if (enhanced && enhRef.current) paintToCanvas(enhRef.current, enhanced);
    // A new result invites the user to look — run the divider sweep once.
    if (enhanced) {
      setAnimatingDivider(true);
    }
  }, [enhanced]);

  /* Gentle intro sweep of the divider until the user interacts */
  useEffect(() => {
    if (!animatingDivider || !enhanced) return;
    let raf = 0;
    const start = performance.now();
    const dur = 2600;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / dur);
      const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
      // sweep 30 -> 70 -> 50
      const pos = p < 0.5 ? 30 + 40 * (eased / easedAt(p)) : 70 - 20 * ((p - 0.5) / 0.5);
      setPosition(pos);
      if (p < 1) raf = requestAnimationFrame(tick);
      else setAnimatingDivider(false);
    };
    const easedAt = (p: number) => (p < 0.5 ? 2 * p * p : 1);
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [animatingDivider, enhanced]);

  /* Divider dragging */
  const updateFromPointer = useCallback((clientX: number) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.max(0, Math.min(100, pct)));
  }, []);

  const onHandleDown = (e: React.PointerEvent) => {
    e.preventDefault();
    setAnimatingDivider(false);
    setDragging(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };
  const onHandleMove = (e: React.PointerEvent) => {
    if (dragging) updateFromPointer(e.clientX);
  };
  const onHandleUp = () => setDragging(false);

  const onStageClick = (e: React.MouseEvent) => {
    if (!dragging) updateFromPointer(e.clientX);
  };

  /* Zoom & pan */
  const clampZoom = (z: number) => Math.max(1, Math.min(6, z));
  const applyZoom = useCallback(
    (next: number, center?: { x: number; y: number }) => {
      const z = clampZoom(next);
      if (z === 1) setPan({ x: 0, y: 0 });
      else if (center) {
        // keep point under cursor stable
        setPan((p) => ({ x: (p.x - center.x) * (z / zoom) + center.x, y: (p.y - center.y) * (z / zoom) + center.y }));
      }
      setZoom(z);
    },
    [zoom],
  );

  const onWheel = (e: React.WheelEvent) => {
    if (!enhanced && !original) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const cx = e.clientX - rect.left - rect.width / 2;
    const cy = e.clientY - rect.top - rect.height / 2;
    applyZoom(zoom * (e.deltaY < 0 ? 1.12 : 0.89), { x: cx, y: cy });
  };

  /* Pan by dragging the image when zoomed */
  const panState = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onImagePointerDown = (e: React.PointerEvent) => {
    if (zoom > 1) {
      panState.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    }
  };
  const onImagePointerMove = (e: React.PointerEvent) => {
    if (panState.current) {
      setPan({
        x: panState.current.x + (e.clientX - panState.current.px),
        y: panState.current.y + (e.clientY - panState.current.py),
      });
    }
  };
  const onImagePointerUp = () => (panState.current = null);

  /* Fullscreen */
  const toggleFullscreen = useCallback(async () => {
    const el = containerRef.current;
    if (!el) return;
    try {
      if (!document.fullscreenElement) {
        await el.requestFullscreen();
        isFullscreen.current = true;
      } else {
        await document.exitFullscreen();
        isFullscreen.current = false;
      }
    } catch {
      /* Fullscreen blocked by browser — ignore silently */
    }
  }, []);

  const resetView = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
    setPosition(50);
  };

  const hasImage = !!original;
  const showEnhanced = mode !== 'before' && !!enhanced;

  return (
    <div
      ref={containerRef}
      className={`relative flex h-full w-full items-center justify-center overflow-hidden bg-[#0d0f14] ${
        isFullscreen.current ? 'p-0' : ''
      }`}
    >
      {!hasImage ? (
        <div className="text-sm text-white/30">No image loaded</div>
      ) : (
        <>
          {/* Image stage */}
          <div
            ref={wrapperRef}
            className="relative max-h-full max-w-full overflow-hidden"
            style={{ touchAction: 'none' }}
            onWheel={onWheel}
            onPointerDown={onImagePointerDown}
            onPointerMove={onImagePointerMove}
            onPointerUp={onImagePointerUp}
          >
            <div
              ref={stageRef}
              onClick={onStageClick}
              className="relative select-none"
              style={{
                transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
                transformOrigin: 'center',
                transition: panState.current ? 'none' : 'transform 0.18s ease-out',
              }}
            >
              {/* Original (base layer) */}
              <canvas
                ref={origRef}
                className="block h-auto max-h-[calc(100vh-260px)] w-auto max-w-full"
                style={{ width: original ? `min(100%, ${original.width}px)` : undefined }}
                aria-label="Original photo"
              />
              {/* Enhanced overlay clipped to the right of the divider */}
              {showEnhanced && (
                <canvas
                  ref={enhRef}
                  className="absolute inset-0 h-full w-full"
                  style={{
                    clipPath:
                      mode === 'after'
                        ? 'inset(0 0 0 0)'
                        : `inset(0 0 0 ${position}%)`,
                    transition: dragging || animatingDivider ? 'none' : 'clip-path 0.12s ease-out',
                  }}
                  aria-label="Enhanced photo"
                />
              )}

              {/* Divider handle */}
              {mode === 'split' && (
                <div
                  className="absolute inset-y-0 z-10"
                  style={{ left: `${position}%`, width: 0 }}
                >
                  <div className="absolute -left-px top-0 h-full w-[2px] bg-white/90 shadow-[0_0_12px_rgba(0,0,0,0.5)]" />
                  <button
                    type="button"
                    aria-label="Drag to compare before and after"
                    onPointerDown={onHandleDown}
                    onPointerMove={onHandleMove}
                    onPointerUp={onHandleUp}
                    onPointerCancel={onHandleUp}
                    className={`absolute top-1/2 left-1/2 flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize items-center justify-center rounded-full bg-white text-gray-800 shadow-xl ring-1 ring-black/10 transition-transform hover:scale-105 active:scale-95 ${
                      dragging ? 'scale-110' : ''
                    }`}
                  >
                    <span className="text-xs font-bold tracking-tighter">◀▶</span>
                  </button>
                </div>
              )}

              {/* Labels */}
              <div className="pointer-events-none absolute left-3 top-3 z-20">
                <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white/90 backdrop-blur">
                  Original
                </span>
              </div>
              {showEnhanced && (
                <div className="pointer-events-none absolute right-3 top-3 z-20">
                  <span className="rounded-full bg-indigo-500/85 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-white backdrop-blur">
                    Enhanced
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Toolbar */}
          <div className="absolute bottom-4 left-1/2 z-30 flex -translate-x-1/2 items-center gap-1 rounded-full glass px-1.5 py-1.5 shadow-2xl">
            <ToolbarButton active={mode === 'before'} onClick={() => { setAnimatingDivider(false); setMode('before'); }} title="Show original (B)">
              Before
            </ToolbarButton>
            <ToolbarButton active={mode === 'split'} onClick={() => { setAnimatingDivider(false); setMode('split'); }} title="Split comparison">
              Split
            </ToolbarButton>
            <ToolbarButton active={mode === 'after'} onClick={() => { setAnimatingDivider(false); setMode('after'); }} title="Show enhanced (A)" disabled={!enhanced}>
              After
            </ToolbarButton>
            <div className="mx-1 h-5 w-px bg-white/15" />
            <IconBtn onClick={() => applyZoom(zoom * 0.8)} title="Zoom out (−)">−</IconBtn>
            <span className="w-12 text-center text-xs font-semibold text-white/70">{Math.round(zoom * 100)}%</span>
            <IconBtn onClick={() => applyZoom(zoom * 1.25)} title="Zoom in (+)">+</IconBtn>
            <IconBtn onClick={resetView} title="Fit to screen (0)">⤢ Fit</IconBtn>
            <IconBtn onClick={toggleFullscreen} title="Fullscreen (F)">⛶</IconBtn>
          </div>
        </>
      )}
    </div>
  );
}

function ToolbarButton({
  children,
  active,
  onClick,
  title,
  disabled,
}: {
  children: React.ReactNode;
  active?: boolean;
  onClick: () => void;
  title: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
        active
          ? 'bg-white text-gray-900 shadow'
          : 'text-white/70 hover:bg-white/10 hover:text-white'
      } ${disabled ? 'cursor-not-allowed opacity-40' : ''}`}
    >
      {children}
    </button>
  );
}

function IconBtn({ children, onClick, title }: { children: React.ReactNode; onClick: () => void; title: string }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className="flex h-8 items-center justify-center rounded-full px-2.5 text-sm font-semibold text-white/70 transition-colors hover:bg-white/10 hover:text-white active:scale-95"
    >
      {children}
    </button>
  );
}
