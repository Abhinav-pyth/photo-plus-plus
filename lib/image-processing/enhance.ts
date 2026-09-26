/**
 * The enhancement pipeline. Given raw RGBA pixels + parameters, produces
 * enhanced pixels. Runs on the main thread OR inside a Web Worker — it has
 * zero DOM dependencies.
 */

import type { EnhanceParams } from './types';
import { applyTonalAdjustments, applySharpen, applyClarity, applyDenoise } from './filters';

export interface PipelineResult {
  buffer: ArrayBuffer;
  width: number;
  height: number;
}

/**
 * Apply all enabled enhancements to a copy of the input pixels.
 * `onProgress` receives values 0..1 at each stage so callers can animate a
 * progress bar without blocking.
 */
export function enhancePixels(
  src: Uint8ClampedArray,
  width: number,
  height: number,
  params: EnhanceParams,
  onProgress?: (v: number) => void,
): PipelineResult {
  // Work on a copy so the source stays pristine for before/after comparison.
  const out = new Uint8ClampedArray(src.length);
  out.set(src);

  report(onProgress, 0.05);

  // 1. Tonal adjustments (pointwise)
  applyTonalAdjustments(out, {
    brightness: params.brightness,
    contrast: params.contrast,
    saturation: params.saturation,
    warmth: params.warmth,
    highlights: params.highlights,
    shadows: params.shadows,
  });
  report(onProgress, 0.3);

  // 2. Noise reduction before sharpening so we don't amplify grain
  if (params.noiseReduction > 0) {
    applyDenoise(out, width, height, params.noiseReduction);
  }
  report(onProgress, 0.55);

  // 3. Clarity (local contrast)
  if (params.clarity > 0) {
    applyClarity(out, width, height, params.clarity);
  }
  report(onProgress, 0.78);

  // 4. Sharpening last so edges stay crisp after smoothing
  if (params.sharpness > 0) {
    applySharpen(out, width, height, params.sharpness);
  }
  report(onProgress, 1);

  return { buffer: out.buffer, width, height };
}

function report(cb: ((v: number) => void) | undefined, v: number) {
  if (cb) cb(v);
}

/* ------------------------------------------------------------------ */
/* Auto-enhance analysis: derive sensible parameters from image stats  */
/* ------------------------------------------------------------------ */

export interface ImageStats {
  meanLum: number; // 0..255
  stdLum: number;
  p5: number; // 5th percentile luminance
  p95: number;
  meanSat: number; // 0..1
  edgeEnergy: number; // 0..1 rough sharpness proxy
}

export function computeStats(data: Uint8ClampedArray, width: number, height: number): ImageStats {
  const n = width * height;
  const hist = new Uint32Array(256);
  let sum = 0, sumSq = 0, satSum = 0;
  for (let i = 0, j = 0; j < n; j++, i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    hist[l | 0]++;
    sum += l;
    sumSq += l * l;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    satSum += mx === 0 ? 0 : (mx - mn) / mx;
  }
  const meanLum = sum / n;
  const stdLum = Math.sqrt(Math.max(0, sumSq / n - meanLum * meanLum));
  const meanSat = satSum / n;

  // percentiles
  let acc = 0, p5 = 0, p95 = 0;
  const target5 = n * 0.05, target95 = n * 0.95;
  for (let x = 0; x < 256; x++) {
    acc += hist[x];
    if (!p5 && acc >= target5) p5 = x;
    if (!p95 && acc >= target95) p95 = x;
  }

  // Edge energy via simple gradient magnitude (sampled for speed)
  let grad = 0, samples = 0;
  const step = Math.max(1, Math.floor(n / 250000)) ;
  for (let y = 1; y < height - 1; y += step) {
    for (let x = 1; x < width - 1; x += step) {
      const i = (y * width + x) * 4;
      const gx = Math.abs(data[i + 4] - data[i - 4]);
      const gy = Math.abs(data[i + width * 4] - data[i - width * 4]);
      grad += gx + gy;
      samples++;
    }
  }
  const edgeEnergy = samples ? Math.min(1, grad / samples / 60) : 0.5;

  return { meanLum, stdLum, p5, p95, meanSat, edgeEnergy };
}

/**
 * Analyse the image and return auto-enhancement parameters — like a small
 * local "AI assistant", but 100% deterministic math on-device.
 */
export function autoEnhanceParams(stats: ImageStats): EnhanceParams {
  const base: EnhanceParams = {
    brightness: 0, contrast: 0, saturation: 0, warmth: 0,
    sharpness: 0, clarity: 0, highlights: 0, shadows: 0, noiseReduction: 0,
  };

  // Brightness: gently normalise mean luminance toward ~128
  const lumDelta = 126 - stats.meanLum;
  base.brightness = clamp(round(lumDelta * 0.22), -25, 30);

  // Contrast: boost low-contrast images, tame blown-out ones
  if (stats.stdLum < 55) base.contrast = clamp(round((55 - stats.stdLum) * 0.5), 0, 25);

  // Recover shadow / highlight detail
  if (stats.p5 > 12) base.shadows = clamp(round((stats.p5 - 12) * 0.8), 0, 30);
  if (stats.p95 < 240) base.highlights = clamp(round((240 - stats.p95) * 0.35), 0, 20);

  // Saturation: lift dull images, avoid overskinning vivid ones
  if (stats.meanSat < 0.28) base.saturation = clamp(round((0.28 - stats.meanSat) * 60), 0, 22);

  // Warmth: cool-looking photos get a subtle push toward warm
  base.warmth = 6;

  // Detail: soft images get sharpened/clarity; already-sharp images less
  if (stats.edgeEnergy < 0.55) {
    base.sharpness = clamp(round((0.55 - stats.edgeEnergy) * 90), 0, 45);
    base.clarity = clamp(round((0.55 - stats.edgeEnergy) * 55), 0, 28);
  } else {
    base.sharpness = 12;
    base.clarity = 8;
  }

  // Very dark images likely noisy → mild denoise
  if (stats.meanLum < 70) base.noiseReduction = 18;

  return base;
}

const round = Math.round;
const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, v));
