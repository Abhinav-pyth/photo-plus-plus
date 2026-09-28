'use client';

/**
 * Hero demo: a synthetic "mountain photo" rendered entirely on-device with
 * Canvas 2D — one pass flat/dull (ORIGINAL), one pass enhanced (vivid,
 * contrasty, warm). A divider sweeps automatically to show the difference.
 * No image files, no network, fully deterministic.
 */

import { useEffect, useRef } from 'react';

const W = 720;
const H = 480;

type Pass = 'original' | 'enhanced';

function drawScene(ctx: CanvasRenderingContext2D, pass: Pass) {
  const enhanced = pass === 'enhanced';

  // Sky gradient
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.62);
  if (enhanced) {
    sky.addColorStop(0, '#1e3a8a');
    sky.addColorStop(0.5, '#7c3aed');
    sky.addColorStop(0.8, '#f97316');
    sky.addColorStop(1, '#fbbf24');
  } else {
    sky.addColorStop(0, '#6b7a99');
    sky.addColorStop(0.7, '#9aa7bd');
    sky.addColorStop(1, '#c3b8ae');
  }
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  // Sun
  const sunX = W * 0.68, sunY = H * 0.34;
  const glow = ctx.createRadialGradient(sunX, sunY, 4, sunX, sunY, enhanced ? 150 : 110);
  glow.addColorStop(0, enhanced ? '#fff7d6' : '#f5efe2');
  glow.addColorStop(0.25, enhanced ? 'rgba(255,214,110,0.9)' : 'rgba(230,220,200,0.55)');
  glow.addColorStop(1, 'rgba(255,200,100,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);
  ctx.beginPath();
  ctx.arc(sunX, sunY, enhanced ? 30 : 26, 0, Math.PI * 2);
  ctx.fillStyle = enhanced ? '#fef3c7' : '#e7e2d5';
  ctx.fill();

  // Clouds
  ctx.fillStyle = enhanced ? 'rgba(255,255,255,0.32)' : 'rgba(255,255,255,0.22)';
  for (const [cx, cy, r] of [[120, 90, 34], [170, 100, 26], [520, 70, 30], [560, 84, 22]] as const) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, r * 2.1, r * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Far mountains
  ctx.beginPath();
  ctx.moveTo(0, H * 0.56);
  ctx.lineTo(W * 0.18, H * 0.34);
  ctx.lineTo(W * 0.34, H * 0.52);
  ctx.lineTo(W * 0.52, H * 0.3);
  ctx.lineTo(W * 0.74, H * 0.5);
  ctx.lineTo(W * 0.9, H * 0.38);
  ctx.lineTo(W, H * 0.52);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  const far = ctx.createLinearGradient(0, H * 0.3, 0, H);
  if (enhanced) {
    far.addColorStop(0, '#4c1d95');
    far.addColorStop(0.4, '#312e81');
    far.addColorStop(1, '#1e1b4b');
  } else {
    far.addColorStop(0, '#8b93a7');
    far.addColorStop(1, '#6d7484');
  }
  ctx.fillStyle = far;
  ctx.fill();

  // Snow caps
  ctx.fillStyle = enhanced ? 'rgba(255,255,255,0.92)' : 'rgba(255,255,255,0.55)';
  cap(ctx, W * 0.18, H * 0.34, 26);
  cap(ctx, W * 0.52, H * 0.3, 30);
  cap(ctx, W * 0.9, H * 0.38, 22);

  // Near hills
  ctx.beginPath();
  ctx.moveTo(0, H * 0.72);
  ctx.quadraticCurveTo(W * 0.25, H * 0.58, W * 0.5, H * 0.7);
  ctx.quadraticCurveTo(W * 0.78, H * 0.82, W, H * 0.66);
  ctx.lineTo(W, H);
  ctx.lineTo(0, H);
  ctx.closePath();
  const near = ctx.createLinearGradient(0, H * 0.6, 0, H);
  if (enhanced) {
    near.addColorStop(0, '#14532d');
    near.addColorStop(1, '#052e16');
  } else {
    near.addColorStop(0, '#77807a');
    near.addColorStop(1, '#565d58');
  }
  ctx.fillStyle = near;
  ctx.fill();

  // Lake reflection band
  ctx.fillStyle = enhanced ? 'rgba(56,189,248,0.16)' : 'rgba(200,210,220,0.14)';
  ctx.fillRect(0, H * 0.78, W, H * 0.06);

  // Trees silhouettes
  ctx.fillStyle = enhanced ? '#041f10' : '#4a514c';
  for (let i = 0; i < 14; i++) {
    const x = 24 + i * 52 + ((i * 37) % 23);
    const h = 26 + ((i * 53) % 30);
    tree(ctx, x, H * 0.9 - (h / 60) * 8, h);
  }

  // Birds
  ctx.strokeStyle = enhanced ? 'rgba(255,255,255,0.75)' : 'rgba(60,60,60,0.4)';
  ctx.lineWidth = 2;
  bird(ctx, 200, 120); bird(ctx, 240, 105); bird(ctx, 268, 128);

  // Post-processing differences
  if (!enhanced) {
    // Dull wash: lift blacks, flatten contrast, slight haze
    ctx.fillStyle = 'rgba(190,195,205,0.28)';
    ctx.fillRect(0, 0, W, H);
  } else {
    // Vignette + warm bloom
    const v = ctx.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, H * 0.85);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,5,30,0.4)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
}

function cap(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  ctx.beginPath();
  ctx.moveTo(x - w / 2, y + w / 2.4);
  ctx.lineTo(x - w / 6, y + w / 6);
  ctx.lineTo(x, y);
  ctx.lineTo(x + w / 5, y + w / 5);
  ctx.lineTo(x + w / 2, y + w / 2.4);
  ctx.quadraticCurveTo(x, y + w / 1.6, x - w / 2, y + w / 2.4);
  ctx.closePath();
  ctx.fill();
}

function tree(ctx: CanvasRenderingContext2D, x: number, baseY: number, h: number) {
  ctx.beginPath();
  ctx.moveTo(x, baseY - h);
  ctx.lineTo(x + h * 0.28, baseY);
  ctx.lineTo(x - h * 0.28, baseY);
  ctx.closePath();
  ctx.fill();
}

function bird(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.beginPath();
  ctx.arc(x - 8, y, 8, Math.PI * 1.15, Math.PI * 1.85);
  ctx.arc(x + 8, y, 8, Math.PI * 1.15, Math.PI * 1.85);
  ctx.stroke();
}

export default function HeroDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posRef = useRef(50);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Pre-render both passes into offscreen canvases once.
    const make = (pass: Pass) => {
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d')!;
      drawScene(g, pass);
      return c;
    };
    const orig = make('original');
    const enh = make('enhanced');

    let raf = 0;
    const start = performance.now();
    const render = (t: number) => {
      const el = (t - start) / 1000;
      // Smooth ping-pong sweep between 25% and 75%
      const p = (Math.sin(el * 0.55) + 1) / 2;
      posRef.current = 25 + p * 50;
      const x = Math.round((posRef.current / 100) * W);

      ctx.drawImage(orig, 0, 0);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, 0, W - x, H);
      ctx.clip();
      ctx.drawImage(enh, 0, 0);
      ctx.restore();

      // Divider line
      ctx.fillStyle = 'rgba(255,255,255,0.95)';
      ctx.fillRect(x - 1, 0, 2, H);
      // Handle
      ctx.beginPath();
      ctx.arc(x, H / 2, 16, 0, Math.PI * 2);
      ctx.fillStyle = '#ffffff';
      ctx.fill();
      ctx.strokeStyle = 'rgba(15,23,42,0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = '#111827';
      ctx.font = 'bold 11px system-ui';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('◀▶', x, H / 2 + 0.5);

      raf = requestAnimationFrame(render);
    };
    raf = requestAnimationFrame(render);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10">
      <canvas ref={canvasRef} width={W} height={H} className="block h-auto w-full" aria-label="Before and after photo enhancement demonstration" />
      <span className="absolute left-3 top-3 rounded-full bg-black/60 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white/90 backdrop-blur">
        Original
      </span>
      <span className="absolute right-3 top-3 rounded-full bg-indigo-500/85 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white backdrop-blur">
        Enhanced
      </span>
      <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-black/55 px-3 py-1 text-[10px] font-medium text-emerald-300 ring-1 ring-emerald-400/30 backdrop-blur">
        🔒 Rendered live on your device
      </span>
    </div>
  );
}
