'use client';

import { useState } from 'react';

/**
 * Persistent privacy badge. Clicking reveals a plain-language explanation of
 * what "local processing" actually means.
 */
export default function PrivacyBadge({ compact = false }: { compact?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className={`flex items-center gap-2 rounded-full font-semibold transition-all ${
          compact
            ? 'bg-white/10 px-3 py-1.5 text-xs text-white/80 ring-1 ring-white/15 hover:bg-white/15'
            : 'glass px-4 py-2 text-sm text-white/90 hover:bg-white/10'
        }`}
      >
        <span aria-hidden>🔒</span>
        {compact ? 'Processed locally' : '100% Local Processing'}
        <span className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`} aria-hidden>
          ⌄
        </span>
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[min(92vw,340px)] animate-fade-up rounded-2xl bg-white p-5 text-left text-gray-800 shadow-2xl ring-1 ring-black/5">
          <p className="text-sm font-semibold text-gray-900">Your image is processed directly inside your browser.</p>
          <ul className="mt-3 space-y-2 text-sm text-gray-600">
            <li className="flex gap-2"><span className="text-emerald-500">✕</span> We don’t upload your photo.</li>
            <li className="flex gap-2"><span className="text-emerald-500">✕</span> We don’t store your photo.</li>
            <li className="flex gap-2"><span className="text-emerald-500">✕</span> We don’t send your photo to an AI server.</li>
          </ul>
          <p className="mt-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700">
            Your image remains on your device — always.
          </p>
        </div>
      )}
    </div>
  );
}
