/**
 * DOM-side image utilities: decoding files to raw pixels, painting pixels
 * back onto canvases, blob creation and downloads. All operations happen
 * inside the browser — nothing here ever touches the network.
 */

import type { RawImagePayload } from './types';

export const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
export const MAX_INPUT_PIXELS = 60_000_000; // ~60MP hard ceiling
export const PROCESS_MAX_DIM = 2400; // working resolution cap for interactive editing

export function isSupportedFile(file: File): boolean {
  return ACCEPTED_TYPES.includes(file.type.toLowerCase());
}

/**
 * Decode a File/Blob into raw RGBA pixels, optionally down-scaled so the
 * longest edge is at most `maxDim` (0 = no scaling).
 */
export async function fileToRawImage(file: File | Blob, maxDim = 0): Promise<RawImagePayload> {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    let { width, height } = img;
    if (width * height > MAX_INPUT_PIXELS) {
      throw new Error('IMAGE_TOO_LARGE');
    }
    if (maxDim > 0 && Math.max(width, height) > maxDim) {
      const scale = maxDim / Math.max(width, height);
      width = Math.max(1, Math.round(width * scale));
      height = Math.max(1, Math.round(height * scale));
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas is unavailable in this browser.');
    ctx.drawImage(img, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    return { width, height, buffer: imageData.data.buffer };
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('DECODE_FAILED'));
    img.src = src;
  });
}

/** Paint a raw payload onto a canvas element (used for preview + export). */
export function paintToCanvas(canvas: HTMLCanvasElement, payload: RawImagePayload): void {
  canvas.width = payload.width;
  canvas.height = payload.height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas is unavailable in this browser.');
  const data = new Uint8ClampedArray(payload.buffer.slice(0));
  ctx.putImageData(new ImageData(data, payload.width, payload.height), 0, 0);
}

/** Convert a raw payload to a Blob entirely in-browser via canvas.toBlob. */
export function rawToBlob(payload: RawImagePayload, mime: string, quality: number): Promise<Blob> {
  const canvas = document.createElement('canvas');
  paintToCanvas(canvas, payload);
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the image.'))),
      mime,
      mime === 'image/png' ? undefined : quality,
    );
  });
}

/** Trigger a browser download of a blob. No server involved. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Revoke on the next tick so Safari has time to start the download.
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export const OUTPUT_FORMATS = [
  { id: 'image/jpeg', ext: 'jpg', label: 'JPG' },
  { id: 'image/png', ext: 'png', label: 'PNG' },
  { id: 'image/webp', ext: 'webp', label: 'WEBP' },
] as const;

export type OutputFormatId = (typeof OUTPUT_FORMATS)[number]['id'];
