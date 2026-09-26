'use client';

/**
 * Right-side editing panel: Auto Enhance, presets and the nine sliders.
 * Pure UI — all pixel work is delegated to the processing engine.
 */

import { useCallback } from 'react';
import type { EnhanceParams } from '@/lib/image-processing/types';
import { DEFAULT_PARAMS } from '@/lib/image-processing/types';
import { PRESETS } from '@/lib/image-processing/presets';

export interface SliderDef {
  key: keyof EnhanceParams;
  label: string;
  min: number;
  max: number;
  hint: string;
}

export const SLIDERS: SliderDef[] = [
  { key: 'sharpness', label: 'Sharpness', min: 0, max: 100, hint: 'Edge detail (unsharp mask)' },
  { key: 'clarity', label: 'Clarity', min: 0, max: 100, hint: 'Local contrast' },
  { key: 'contrast', label: 'Contrast', min: -100, max: 100, hint: 'Tonal spread around mid-grey' },
  { key: 'brightness', label: 'Brightness', min: -100, max: 100, hint: 'Overall exposure' },
  { key: 'saturation', label: 'Saturation', min: -100, max: 100, hint: 'Colour intensity' },
  { key: 'highlights', label: 'Highlights', min: -100, max: 100, hint: 'Brighten / recover highlights' },
  { key: 'shadows', label: 'Shadows', min: -100, max: 100, hint: 'Lift shadow detail' },
  { key: 'noiseReduction', label: 'Noise Reduction', min: 0, max: 100, hint: 'Edge-aware denoise' },
  { key: 'warmth', label: 'Warmth', min: -100, max: 100, hint: 'Colour temperature' },
];

interface Props {
  params: EnhanceParams;
  activePresetId: string | null;
  processing: boolean;
  disabled?: boolean;
  onChange: (next: EnhanceParams) => void;
  onAutoEnhance: () => void;
  onPreset: (id: string) => void;
  onReset: () => void;
}

export default function EnhancementControls({
  params,
  activePresetId,
  processing,
  disabled,
  onChange,
  onAutoEnhance,
  onPreset,
  onReset,
}: Props) {
  const setParam = useCallback(
    (key: keyof EnhanceParams, value: number) => onChange({ ...params, [key]: value }),
    [params, onChange],
  );

  const isDefault = SLIDERS.every((s) => params[s.key] === DEFAULT_PARAMS[s.key]);

  return (
    <div className={`space-y-6 ${disabled ? 'pointer-events-none opacity-50' : ''}`}>
      {/* ---------- AI Enhancement ---------- */}
      <section>
        <SectionTitle>AI Enhancement</SectionTitle>
        <button
          type="button"
          onClick={onAutoEnhance}
          disabled={processing}
          className="btn-primary relative flex w-full items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-bold text-white disabled:cursor-wait disabled:opacity-80"
        >
          {processing ? (
            <>
              <Spinner /> Enhancing your photo…
            </>
          ) : (
            <>✨ Auto Enhance</>
          )}
        </button>
        <p className="mt-2 text-xs leading-relaxed text-gray-500">
          Analyses your photo’s histogram &amp; detail <em>on-device</em>, then tunes every control for a balanced result.
        </p>
      </section>

      {/* ---------- Presets ---------- */}
      <section>
        <SectionTitle>Presets</SectionTitle>
        <div className="grid grid-cols-2 gap-2.5">
          {PRESETS.filter((p) => p.id !== 'auto').map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p.id)}
              title={p.description}
              className={`rounded-xl border p-3 text-left transition-all active:scale-[0.97] ${
                activePresetId === p.id
                  ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200'
                  : 'border-gray-200 bg-white hover:border-indigo-300 hover:bg-indigo-50/50'
              }`}
            >
              <span className="text-lg">{p.icon}</span>
              <span className="mt-1 block text-[13px] font-semibold leading-tight text-gray-900">{p.name}</span>
              <span className="mt-0.5 block text-[11px] leading-snug text-gray-500">{p.description}</span>
            </button>
          ))}
        </div>
      </section>

      {/* ---------- Sliders ---------- */}
      <section>
        <div className="flex items-center justify-between">
          <SectionTitle>Adjustments</SectionTitle>
          <button
            type="button"
            onClick={onReset}
            disabled={isDefault}
            className="rounded-full px-3 py-1 text-xs font-semibold text-indigo-600 transition-colors hover:bg-indigo-50 disabled:text-gray-300 disabled:hover:bg-transparent"
          >
            Reset
          </button>
        </div>
        <div className="space-y-4">
          {SLIDERS.map((s) => (
            <SliderRow key={s.key} def={s} value={params[s.key]} onChange={(v) => setParam(s.key, v)} />
          ))}
        </div>
      </section>

      {/* Keyboard hints */}
      <p className="rounded-xl bg-gray-50 px-4 py-3 text-[11px] leading-relaxed text-gray-500 ring-1 ring-gray-100">
        ⌨️ <b>Ctrl/Cmd+Z</b> undo · <b>Ctrl/Cmd+Shift+Z</b> redo · <b>B</b>/<b>A</b> before/after · <b>F</b> fullscreen
      </p>
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.18em] text-gray-400">{children}</h3>;
}

export function Spinner() {
  return (
    <span
      className="pb-spin inline-block h-4 w-4 rounded-full border-2 border-white/40 border-t-white"
      aria-hidden
    />
  );
}

function SliderRow({ def, value, onChange }: { def: SliderDef; value: number; onChange: (v: number) => void }) {
  const pct = ((value - def.min) / (def.max - def.min)) * 100;
  return (
    <div title={def.hint}>
      <div className="mb-1 flex items-baseline justify-between">
        <label className="text-[13px] font-medium text-gray-700">{def.label}</label>
        <span
          className={`min-w-[34px] rounded-md px-1.5 py-0.5 text-right font-mono text-[11px] font-semibold tabular-nums ${
            value === 0 ? 'text-gray-400' : 'bg-indigo-50 text-indigo-700'
          }`}
        >
          {value > 0 && def.min < 0 ? `+${value}` : value}
        </span>
      </div>
      <input
        type="range"
        className="pb-slider"
        style={{ ['--fill' as string]: `${pct}%` }}
        min={def.min}
        max={def.max}
        step={1}
        value={value}
        aria-label={def.label}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}
