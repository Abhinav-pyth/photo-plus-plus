'use client';

/**
 * Empty-state upload surface: drag & drop, click to browse, clipboard paste.
 * Files are converted with URL.createObjectURL + canvas decoding only.
 */

import { useCallback, useEffect, useRef, useState } from 'react';

interface Props {
  onFile: (file: File) => void;
  compact?: boolean;
}

export default function UploadZone({ onFile, compact = false }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      const file = files?.[0];
      if (file) onFile(file);
    },
    [onFile],
  );

  /* Clipboard paste support (Ctrl/Cmd+V) */
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type.startsWith('image/')) {
          const file = item.getAsFile();
          if (file) {
            onFile(file);
            break;
          }
        }
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [onFile]);

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label="Choose a photo to enhance"
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`group flex cursor-pointer flex-col items-center justify-center rounded-3xl border-2 border-dashed text-center transition-all duration-200 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300 ${
        compact ? 'p-8' : 'min-h-[420px] p-12'
      } ${
        dragOver
          ? 'scale-[1.01] border-indigo-500 bg-indigo-50/80 shadow-xl shadow-indigo-100'
          : 'border-gray-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/40'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          handleFiles(e.target.files);
          e.target.value = ''; // allow re-selecting the same file
        }}
      />

      <div
        className={`flex items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 ring-1 ring-indigo-200/60 transition-transform duration-300 group-hover:-translate-y-1 ${
          compact ? 'h-14 w-14 text-3xl' : 'h-24 w-24 text-5xl'
        } ${dragOver ? 'scale-110' : ''}`}
      >
        🖼️
      </div>

      {!compact && (
        <h3 className="mt-6 text-2xl font-bold tracking-tight text-gray-900">Drop your photo here</h3>
      )}
      {compact && <h3 className="mt-4 text-lg font-bold text-gray-900">Drop a new photo here</h3>}

      <p className="mt-1 text-sm text-gray-500">or</p>

      <span className="btn-primary mt-4 rounded-full px-6 py-2.5 text-sm font-semibold text-white">
        Choose Photo
      </span>

      <p className="mt-5 flex items-center gap-1.5 text-xs text-gray-400">
        JPG, PNG or WEBP • <span className="font-medium text-emerald-600">🔒 Processed locally</span>
      </p>
      {!compact && <p className="mt-1 text-xs text-gray-400">Tip: you can also paste an image with Ctrl/Cmd + V</p>}
    </div>
  );
}
