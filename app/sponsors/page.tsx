'use client';

import Link from 'next/link';
import sponsors from '@/data/sponsors.json';

type Sponsor = typeof sponsors[number];

function Header() {
  return (
    <header className="sticky top-0 z-40 backdrop-blur bg-[#0f1722]/90 border-b border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <img src="/wcoha-logo.png" alt="WCOHA logo" className="h-10 w-auto object-contain" />
          <div className="leading-tight">
            <div className="text-lg font-bold tracking-tight">West Carleton Oldtimers Hockey</div>
            <div className="text-xs text-white/70">35+ Men’s League • Since 1989</div>
          </div>
        </div>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <a className="hover:text-[#e63946] transition" href="/">Home</a>
          <a className="hover:text-[#e63946] transition" href="/#join">Join the League</a>
          <a className="hover:text-[#e63946] transition" href="/#standings">Standings</a>
          <a className="hover:text-[#e63946] transition" href="/sponsors">Sponsors</a>
          <a className="hover:text-[#e63946] transition" href="/#about">About</a>
        </nav>
      </div>
    </header>
  );
}

export default function SponsorsPage() {
  return (
    <main className="min-h-screen bg-[#0f1722] text-white">
      <Header />
      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-8">League Sponsors</h1>
        <p className="text-white/70 mb-10 text-sm max-w-2xl">We’re grateful for our community sponsors.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sponsors.map((s: Sponsor) => (
            <div key={s.slug} className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col" data-testid={`sponsor-card-${s.slug}`}>
              <Link href={`/sponsors/${s.slug}`} className="block">
                <img src={s.localSrc} alt={s.name} className="w-full h-28 object-contain" />
                <h3 className="mt-3 font-semibold">{s.name}</h3>
              </Link>
              <p className="text-sm text-white/70 mt-2 line-clamp-3">{s.blurb}</p>
              <div className="mt-auto pt-3 text-sm">
                {s.website ? (
                  <a href={s.website} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">Visit website</a>
                ) : (
                  <span className="text-white/50">Website coming soon</span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
