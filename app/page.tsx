import Link from 'next/link';
import Header from '@/components/Header';
import HeroDemo from '@/components/HeroDemo';
import PrivacyBadge from '@/components/PrivacyBadge';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      <Header variant="landing" />

      {/* ============================== HERO ============================== */}
      <section className="hero-bg relative overflow-hidden pb-24 pt-36 text-white sm:pt-40">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-4 sm:px-6 lg:grid-cols-[1.05fr_1fr]">
          <div>
            <div className="animate-fade-up mb-6 inline-flex items-center gap-2 rounded-full glass px-4 py-2 text-sm font-medium text-emerald-300 ring-1 ring-emerald-400/30">
              🔒 100% Private — Your photos never leave your device
            </div>
            <h1 className="animate-fade-up delay-1 text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
              Enhance Your Photos.
              <br />
              <span className="text-gradient">Keep Them Private.</span>
            </h1>
            <p className="animate-fade-up delay-2 mt-6 max-w-xl text-lg leading-relaxed text-white/65">
              Professional photo enhancement powered directly on your device. No uploads.
              No cloud storage. No compromise on privacy.
            </p>
            <div className="animate-fade-up delay-3 mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/editor"
                className="btn-primary pulse-ring rounded-full px-7 py-3.5 text-base font-semibold text-white"
              >
                Enhance a Photo →
              </Link>
              <a
                href="#how-it-works"
                className="rounded-full border border-white/20 px-7 py-3.5 text-base font-semibold text-white/85 transition-all hover:bg-white/10 active:scale-95"
              >
                See How It Works
              </a>
            </div>
            <div className="animate-fade-up delay-4 mt-8 flex flex-wrap items-center gap-4">
              <PrivacyBadge />
              <p className="text-sm text-white/45">
                Your photos stay on your device. Nothing is uploaded to our servers.
              </p>
            </div>
          </div>

          <div className="animate-fade-up delay-2 float-slow">
            <HeroDemo />
            <p className="mt-4 text-center text-xs uppercase tracking-[0.2em] text-white/35">
              Original → Enhanced · processed live in your browser
            </p>
          </div>
        </div>
      </section>

      {/* ========================= HOW IT WORKS ========================= */}
      <section id="how-it-works" className="scroll-mt-20 bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="How It Works"
            title="Three steps. Zero uploads."
            subtitle="From your camera roll to a polished photo — without a single byte leaving your device."
          />
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {[
              { n: '1', icon: '📁', title: 'Choose a photo', body: 'Drag & drop, browse or paste. JPG, PNG and WEBP are decoded right here in your browser.' },
              { n: '2', icon: '✨', title: 'Enhance locally', body: 'Auto Enhance analyses the image on-device and tunes sharpness, clarity, tone and colour — all in a Web Worker.' },
              { n: '3', icon: '⬇️', title: 'Download', body: 'Compare before & after, then export at full resolution as JPG, PNG or WEBP. The file goes straight to disk.' },
            ].map((s) => (
              <div key={s.n} className="card-shadow group relative rounded-2xl bg-white p-8 transition-transform hover:-translate-y-1">
                <span className="absolute right-6 top-6 text-5xl font-black text-gray-100 transition-colors group-hover:text-indigo-100">{s.n}</span>
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-50 text-2xl">{s.icon}</div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FEATURES ============================ */}
      <section id="features" className="scroll-mt-20 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Features"
            title="A studio-grade toolkit, on your laptop"
            subtitle="Every feature runs client-side. Premium results, private by architecture."
          />
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              { icon: '🧠', title: 'On-Device AI Enhancement', body: 'Histogram analysis, auto tone, local contrast and unsharp masking computed instantly on your hardware.' },
              { icon: '🎚️', title: 'Nine Precision Controls', body: 'Sharpness, clarity, contrast, brightness, saturation, highlights, shadows, noise reduction and warmth.' },
              { icon: '🖱️', title: 'Before / After Comparison', body: 'A buttery split slider with zoom, pan and fullscreen so you can inspect every pixel of the difference.' },
              { icon: '🏞️', title: 'High Resolution Export', body: 'Previews scale for speed; exports preserve your original resolution up to 60 megapixels.' },
              { icon: '🚫', title: 'No Uploads. Ever.', body: 'There is no upload endpoint in this application. Your pixels move between memory buffers, not networks.' },
              { icon: '👤', title: 'No Account Required', body: 'Open the page, enhance a photo, download it. No sign-up, no tracking of your images, no sessions.' },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-gray-100 bg-white p-7 card-shadow transition-all hover:border-indigo-200 hover:shadow-indigo-100">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ PRIVACY ============================= */}
      <section id="privacy" className="hero-bg scroll-mt-20 py-24 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="grid items-center gap-14 lg:grid-cols-2">
            <div>
              <SectionHeadingDark
                eyebrow="Privacy"
                title="Your Photos Stay Yours"
                subtitle="Privacy isn’t a setting in PixelBoost — it’s the architecture. The Node.js server only serves the app shell. Image data has nowhere to go."
              />
              <div className="mt-8 space-y-4">
                {[
                  ['No Uploads', 'Photos never leave your device.'],
                  ['No Cloud Storage', 'We don’t store your photos.'],
                  ['Local Processing', 'Enhancement happens inside your browser.'],
                  ['Private by Design', 'Your images aren’t sent to third-party APIs.'],
                ].map(([t, b]) => (
                  <div key={t} className="flex items-start gap-4 rounded-xl glass p-4">
                    <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-emerald-500/90 text-xs font-bold text-white">✓</span>
                    <div>
                      <p className="font-semibold">{t}</p>
                      <p className="text-sm text-white/60">{b}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-2xl glass p-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">The data path</p>
              <div className="mt-6 space-y-3 text-sm">
                {[
                  ['Your photo', 'selected on your device'],
                  ['Browser memory', 'URL.createObjectURL(file)'],
                  ['Web Worker', 'pixel math off the UI thread'],
                  ['Canvas preview', 'before / after comparison'],
                  ['Your disk', 'downloaded enhanced file'],
                ].map(([step, sub], i, arr) => (
                  <div key={step}>
                    <div className="flex items-center gap-3 rounded-lg bg-white/5 px-4 py-3 ring-1 ring-white/10">
                      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/30 text-[11px] font-bold text-indigo-200">{i + 1}</span>
                      <div>
                        <span className="font-semibold">{step}</span>
                        <span className="ml-2 text-white/50">{sub}</span>
                      </div>
                    </div>
                    {i < arr.length - 1 && <div className="ml-7 h-3 w-px bg-gradient-to-b from-indigo-400/60 to-transparent" />}
                  </div>
                ))}
              </div>
              <p className="mt-6 rounded-lg bg-emerald-500/10 px-4 py-3 text-xs font-medium text-emerald-300 ring-1 ring-emerald-400/20">
                ⛔ There is no step that touches a server. This app contains no upload API — by design.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =========================== USE CASES ============================ */}
      <section className="bg-gray-50 py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <SectionHeading
            eyebrow="Use Cases"
            title="Made for every kind of photo"
            subtitle="From family snapshots to client work — tuned presets for real situations."
          />
          <div className="mt-14 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {[
              ['🧑', 'Portraits'], ['📜', 'Old Photos'], ['✈️', 'Travel Photos'], ['📦', 'Product Photos'],
              ['📱', 'Social Media'], ['👨‍👩‍👧', 'Family Photos'], ['🏠', 'Real Estate'], ['📷', 'Professional Photography'],
            ].map(([icon, label]) => (
              <Link
                key={label}
                href="/editor"
                className="group flex flex-col items-center gap-3 rounded-2xl bg-white px-4 py-8 text-center card-shadow transition-all hover:-translate-y-1 hover:ring-2 hover:ring-indigo-200"
              >
                <span className="text-4xl transition-transform group-hover:scale-110">{icon}</span>
                <span className="text-sm font-semibold text-gray-800">{label}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ============================ FINAL CTA ============================ */}
      <section className="py-28">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
          <h2 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Ready to enhance your photo?
          </h2>
          <p className="mt-4 text-lg text-gray-600">
            Professional enhancement. Zero uploads. Your photo. Your device. Your privacy.
          </p>
          <Link
            href="/editor"
            className="btn-primary mt-9 inline-block rounded-full px-9 py-4 text-lg font-semibold text-white"
          >
            ✨ Enhance a Photo
          </Link>
          <p className="mt-5 text-sm text-gray-400">Free · No sign-up · Nothing leaves your device</p>
        </div>
      </section>

      {/* ============================= FOOTER ============================= */}
      <footer className="border-t border-gray-100 bg-white py-10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 text-sm text-gray-500 sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-indigo-500 to-purple-500 text-[11px] font-black text-white">P</span>
            <span className="font-bold text-gray-800">PixelBoost</span>
            <span className="text-gray-400">— Private AI Photo Enhancement</span>
          </div>
          <div className="flex items-center gap-6">
            <Link href="/#features" className="hover:text-gray-800">Features</Link>
            <Link href="/#privacy" className="hover:text-gray-800">Privacy</Link>
            <Link href="/editor" className="hover:text-gray-800">Enhance</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

function SectionHeading({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">{title}</h2>
      <p className="mt-4 text-gray-600">{subtitle}</p>
    </div>
  );
}

function SectionHeadingDark({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-[0.25em] text-indigo-300">{eyebrow}</p>
      <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h2>
      <p className="mt-4 leading-relaxed text-white/60">{subtitle}</p>
    </div>
  );
}
