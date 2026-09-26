/**
 * Low-level pixel filters. Pure functions operating on Uint8ClampedArray RGBA
 * buffers — no DOM APIs here, so this file runs identically on the main
 * thread and inside a Web Worker.
 */

const clamp255 = (v: number) => (v < 0 ? 0 : v > 255 ? 255 : v);

/* ------------------------------------------------------------------ */
/* Pointwise tonal / colour adjustments (brightness, contrast,         */
/* saturation, warmth, tone curve for highlights/shadows)              */
/* ------------------------------------------------------------------ */

export function applyTonalAdjustments(
  data: Uint8ClampedArray,
  p: {
    brightness: number; // -100..100
    contrast: number; // -100..100
    saturation: number; // -100..100
    warmth: number; // -100..100
    highlights: number; // -100..100
    shadows: number; // -100..100
  },
): void {
  const brightAdd = p.brightness * 0.9; // -90..90
  const contrastF = Math.max(0.1, 1 + p.contrast * 0.011);
  const satF = Math.max(0, 1 + p.saturation * 0.012); // 0..2.2
  const warmR = 1 + p.warmth * 0.0016;
  const warmB = 1 - p.warmth * 0.0016;
  const hi = p.highlights;
  const sh = p.shadows;

  const needsCurve = hi !== 0 || sh !== 0;
  let curve: Float32Array | null = null;
  if (needsCurve) {
    // Pre-compute a 256-entry LUT for the highlight/shadow tone curve so the
    // per-pixel cost stays low even on very large images.
    curve = new Float32Array(256);
    for (let x = 0; x < 256; x++) {
      const t = x / 255;
      // Gaussian-ish weights centred on shadows (t≈0.22) and highlights (t≈0.78)
      const wHi = Math.exp(-((t - 0.78) ** 2) / (2 * 0.2 ** 2));
      const wSh = Math.exp(-((t - 0.22) ** 2) / (2 * 0.2 ** 2));
      const adj = (hi * 0.55 * wHi + sh * 0.55 * wSh) / 255;
      curve[x] = clamp255((t + adj) * 255);
    }
  }

  const n = data.length;
  for (let i = 0; i < n; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];

    // Brightness
    r += brightAdd;
    g += brightAdd;
    b += brightAdd;

    // Contrast around mid grey
    r = (r - 128) * contrastF + 128;
    g = (g - 128) * contrastF + 128;
    b = (b - 128) * contrastF + 128;

    // Warmth (channel gains)
    r *= warmR;
    b *= warmB;

    // Saturation via luminance blend
    if (satF !== 1) {
      const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      r = lum + (r - lum) * satF;
      g = lum + (g - lum) * satF;
      b = lum + (b - lum) * satF;
    }

    // Highlights / shadows tone curve
    if (curve) {
      r = curve[clamp255(r) | 0];
      g = curve[clamp255(g) | 0];
      b = curve[clamp255(b) | 0];
    }

    data[i] = clamp255(r);
    data[i + 1] = clamp255(g);
    data[i + 2] = clamp255(b);
  }
}

/* ------------------------------------------------------------------ */
/* Separable box blur (building block for unsharp mask & clarity)      */
/* ------------------------------------------------------------------ */

function boxBlurH(src: Float32Array, dst: Float32Array, w: number, h: number, radius: number): void {
  const div = radius * 2 + 1;
  for (let y = 0; y < h; y++) {
    const row = y * w;
    let sum = 0;
    for (let x = -radius; x <= radius; x++) sum += src[row + Math.min(w - 1, Math.max(0, x))];
    for (let x = 0; x < w; x++) {
      dst[row + x] = sum / div;
      const add = src[row + Math.min(w - 1, x + radius + 1)];
      const sub = src[row + Math.max(0, x - radius)];
      sum += add - sub;
    }
  }
}

function boxBlurV(src: Float32Array, dst: Float32Array, w: number, h: number, radius: number): void {
  const div = radius * 2 + 1;
  for (let x = 0; x < w; x++) {
    let sum = 0;
    for (let y = -radius; y <= radius; y++) sum += src[Math.min(h - 1, Math.max(0, y)) * w + x];
    for (let y = 0; y < h; y++) {
      dst[y * w + x] = sum / div;
      const add = src[Math.min(h - 1, y + radius + 1) * w + x];
      const sub = src[Math.max(0, y - radius) * w + x];
      sum += add - sub;
    }
  }
}

/** Three-pass box blur ≈ gaussian blur of similar sigma. */
export function blurChannel(channel: Float32Array, w: number, h: number, radius: number): Float32Array {
  if (radius < 1) return channel;
  const tmp1 = new Float32Array(channel.length);
  const tmp2 = new Float32Array(channel.length);
  let cur = new Float32Array(channel);
  for (let pass = 0; pass < 3; pass++) {
    boxBlurH(cur, tmp1, w, h, radius);
    boxBlurV(tmp1, tmp2, w, h, radius);
    cur = new Float32Array(tmp2);
  }
  return cur;
}

/* ------------------------------------------------------------------ */
/* Unsharp mask sharpening                                             */
/* ------------------------------------------------------------------ */

export function applySharpen(data: Uint8ClampedArray, w: number, h: number, amount: number, radius = 1): void {
  if (amount <= 0) return;
  const k = (amount / 100) * 1.6;
  const n = w * h;
  const lr = new Float32Array(n);
  const lg = new Float32Array(n);
  const lb = new Float32Array(n);
  for (let i = 0, j = 0; j < n; j++, i += 4) {
    lr[j] = data[i];
    lg[j] = data[i + 1];
    lb[j] = data[i + 2];
  }
  const br = blurChannel(lr, w, h, radius);
  const bg = blurChannel(lg, w, h, radius);
  const bb = blurChannel(lb, w, h, radius);
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    data[i] = clamp255(data[i] + k * (data[i] - br[j]));
    data[i + 1] = clamp255(data[i + 1] + k * (data[i + 1] - bg[j]));
    data[i + 2] = clamp255(data[i + 2] + k * (data[i + 2] - bb[j]));
  }
}

/* ------------------------------------------------------------------ */
/* Clarity: local-contrast boost (large-radius luminance unsharp)      */
/* ------------------------------------------------------------------ */

export function applyClarity(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  if (amount <= 0) return;
  const k = (amount / 100) * 0.9;
  const radius = Math.max(3, Math.round(Math.min(w, h) / 64));
  const n = w * h;
  const l = new Float32Array(n);
  for (let i = 0, j = 0; j < n; j++, i += 4) {
    l[j] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
  }
  const blurred = blurChannel(l, w, h, radius);
  for (let j = 0, i = 0; j < n; j++, i += 4) {
    const detail = l[j] - blurred[j];
    data[i] = clamp255(data[i] + k * detail);
    data[i + 1] = clamp255(data[i + 1] + k * detail);
    data[i + 2] = clamp255(data[i + 2] + k * detail);
  }
}

/* ------------------------------------------------------------------ */
/* Noise reduction: small bilateral-style filter                       */
/* (box blur weighted by luminance similarity → preserves edges)       */
/* ------------------------------------------------------------------ */

export function applyDenoise(data: Uint8ClampedArray, w: number, h: number, amount: number): void {
  if (amount <= 0) return;
  const strength = amount / 100; // 0..1
  const radius = 2;
  const sigmaLum = 14 + strength * 40; // edge sensitivity
  const n = w * h;
  const out = new Uint8ClampedArray(data.length);

  for (let j = 0; j < n; j++) {
    const x = j % w;
    const y = (j / w) | 0;
    const i = j * 4;
    const cr = data[i], cg = data[i + 1], cb = data[i + 2];
    const cl = 0.2126 * cr + 0.7152 * cg + 0.0722 * cb;
    let rs = 0, gs = 0, bs = 0, ws = 0;
    const y0 = Math.max(0, y - radius), y1 = Math.min(h - 1, y + radius);
    const x0 = Math.max(0, x - radius), x1 = Math.min(w - 1, x + radius);
    for (let yy = y0; yy <= y1; yy++) {
      for (let xx = x0; xx <= x1; xx++) {
        const ii = (yy * w + xx) * 4;
        const dl = Math.abs(cl - (0.2126 * data[ii] + 0.7152 * data[ii + 1] + 0.0722 * data[ii + 2]));
        const sw = 1 - ((Math.abs(xx - x) + Math.abs(yy - y)) / (radius * 2 + 1)) * 0.5;
        const rw = dl < sigmaLum ? 1 - dl / sigmaLum : 0;
        const ww = sw * rw * strength;
        if (ww > 0) {
          rs += data[ii] * ww;
          gs += data[ii + 1] * ww;
          bs += data[ii + 2] * ww;
          ws += ww;
        }
      }
    }
    if (ws > 0) {
      out[i] = clamp255(cr + (rs / ws - cr));
      out[i + 1] = clamp255(cg + (gs / ws - cg));
      out[i + 2] = clamp255(cb + (bs / ws - cb));
    } else {
      out[i] = cr; out[i + 1] = cg; out[i + 2] = cb;
    }
    out[i + 3] = data[i + 3];
  }
  data.set(out);
}
