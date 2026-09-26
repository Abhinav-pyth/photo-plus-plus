/**
 * One-click enhancement presets. Each preset is a full parameter set that
 * the UI applies to the local processing pipeline.
 */

import type { EnhanceParams } from './types';

export interface Preset {
  id: string;
  icon: string;
  name: string;
  description: string;
  params: EnhanceParams;
}

export const PRESETS: Preset[] = [
  {
    id: 'auto',
    icon: '✨',
    name: 'Auto Enhance',
    description: 'Balanced improvement, tuned to your photo.',
    // Placeholder — the real values are computed from image statistics.
    params: {
      brightness: 6, contrast: 12, saturation: 10, warmth: 6,
      sharpness: 25, clarity: 18, highlights: -8, shadows: 14, noiseReduction: 8,
    },
  },
  {
    id: 'portrait',
    icon: '🧑',
    name: 'Portrait',
    description: 'Softer skin, brighter eyes, natural colour.',
    params: {
      brightness: 8, contrast: 6, saturation: 6, warmth: 8,
      sharpness: 12, clarity: 8, highlights: -6, shadows: 18, noiseReduction: 22,
    },
  },
  {
    id: 'landscape',
    icon: '🌄',
    name: 'Landscape',
    description: 'Deeper colour, more clarity and contrast.',
    params: {
      brightness: 2, contrast: 20, saturation: 22, warmth: 4,
      sharpness: 35, clarity: 34, highlights: -14, shadows: 22, noiseReduction: 6,
    },
  },
  {
    id: 'social',
    icon: '📱',
    name: 'Social Media',
    description: 'Punchy, vivid look for Instagram & friends.',
    params: {
      brightness: 10, contrast: 16, saturation: 18, warmth: 6,
      sharpness: 30, clarity: 22, highlights: -6, shadows: 16, noiseReduction: 4,
    },
  },
  {
    id: 'lowlight',
    icon: '🌙',
    name: 'Low Light',
    description: 'Rescue dark shots: lift shadows, calm noise.',
    params: {
      brightness: 26, contrast: 8, saturation: 10, warmth: 10,
      sharpness: 18, clarity: 14, highlights: -10, shadows: 38, noiseReduction: 34,
    },
  },
  {
    id: 'print',
    icon: '🖨️',
    name: 'Print',
    description: 'Maximum sharpness and clarity for prints.',
    params: {
      brightness: 3, contrast: 12, saturation: 8, warmth: 2,
      sharpness: 48, clarity: 30, highlights: -4, shadows: 10, noiseReduction: 12,
    },
  },
];
