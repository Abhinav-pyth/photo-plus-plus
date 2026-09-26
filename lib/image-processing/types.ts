/**
 * Shared types for the client-side image processing pipeline.
 * This module is imported by BOTH the main thread and the Web Worker,
 * so it must stay free of any DOM dependencies.
 */

export interface EnhanceParams {
  /** -100..100 */ brightness: number;
  /** -100..100 */ contrast: number;
  /** -100..100 */ saturation: number;
  /** -100..100 */ warmth: number;
  /**  0..100   */ sharpness: number;
  /** 0..100    */ clarity: number;
  /** -100..100 */ highlights: number;
  /** -100..100 */ shadows: number;
  /**  0..100   */ noiseReduction: number;
}

export const DEFAULT_PARAMS: EnhanceParams = {
  brightness: 0,
  contrast: 0,
  saturation: 0,
  warmth: 0,
  sharpness: 0,
  clarity: 0,
  highlights: 0,
  shadows: 0,
  noiseReduction: 0,
};

export interface RawImagePayload {
  width: number;
  height: number;
  /** RGBA pixel data (byteLength === width * height * 4) */
  buffer: ArrayBuffer;
}

export type WorkerRequest = {
  type: 'enhance';
  payload: RawImagePayload;
  params: EnhanceParams;
};

export type WorkerResponse =
  | { type: 'result'; payload: RawImagePayload }
  | { type: 'progress'; value: number }
  | { type: 'error'; message: string };
