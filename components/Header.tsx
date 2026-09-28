'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Sticky, subtle header. Transparent over the dark hero, frosted white on
 * light pages after scroll.
 */
export default function Header({ variant = 'landing' }: { variant?: 'landing' | 'editor' }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (variant !== 'landing') return;
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [variant]);

  const dark = variant === 'landing' && !scrolled;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-all duration-300 ${
        dark ? 'bg-transparent' : 'border-b border-gray-200/70 bg-white/80 backdrop-blur-xl'
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="group flex items-center gap-2.5">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 text-sm font-black text-white shadow-md shadow-indigo-500/30 transition-transform group-hover:scale-105">
            P
          </span>
          <span className={`text-[17px] font-bold tracking-tight ${dark ? 'text-white' : 'text-gray-900'}`}>
            PixelBoost
          </span>
        </Link>

        {variant === 'landing' ? (
          <nav className="hidden items-center gap-7 text-sm font-medium md:flex">
            {[
              { href: '/editor', label: 'Enhance' },
              { href: '/#features', label: 'Features' },
              { href: '/#how-it-works', label: 'How It Works' },
              { href: '/#privacy', label: 'Privacy' },
            ].map((l) => (
              <Link
                key={l.label}
                href={l.href}
                className={`${dark ? 'text-white/70 hover:text-white' : 'text-gray-600 hover:text-gray-900'} transition-colors`}
              >
                {l.label}
              </Link>
            ))}
          </nav>
        ) : (
          <nav className="hidden items-center gap-6 text-sm font-medium md:flex">
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1.5 text-emerald-700 ring-1 ring-emerald-200">
              🔒 Processed locally
            </span>
          </nav>
        )}

        <div className="flex items-center gap-3">
          {variant === 'landing' && (
            <span className={`hidden items-center gap-1.5 text-xs font-medium sm:flex ${dark ? 'text-white/60' : 'text-gray-500'}`}>
              🔒 100% Local Processing
            </span>
          )}
          <Link
            href="/editor"
            className="btn-primary rounded-full px-4 py-2 text-sm font-semibold text-white"
          >
            Enhance Photo
          </Link>
        </div>
      </div>
    </header>
  );
}
