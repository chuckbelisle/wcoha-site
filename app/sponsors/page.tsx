'use client';

import { useState } from 'react';
import Link from 'next/link';
import sponsors from '@/data/sponsors.json';
import { ExternalLink } from 'lucide-react';

type Sponsor = typeof sponsors[number];

function Logo({ className = 'h-20 w-auto' }: { className?: string }) {
  return <img src="/wcoha-logo-v2.png" alt="WCOHA logo" className={`${className} object-contain`} />;
}

export default function SponsorsPage() {
  return (
    <main className="min-h-screen bg-[#0f1722] text-white">

      <div className="max-w-6xl mx-auto px-4 py-10">
        <h1 className="text-3xl md:text-5xl font-extrabold leading-tight mb-8">League Sponsors</h1>
        <p className="text-white/70 mb-10 text-sm max-w-2xl">We’re grateful for our community sponsors.</p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sponsors.map((s: Sponsor) => (
            <div
              key={s.slug}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 flex flex-col"
              data-testid={`sponsor-card-${s.slug}`}
            >
              <Link href={`/sponsors/${s.slug}`} className="block">
                <img src={s.localSrc || s.remoteUrl} alt={s.name} className="w-full h-28 object-contain" />
                <h3 className="mt-3 font-semibold">{s.name}</h3>
              </Link>
              <p className="text-sm text-white/70 mt-2 line-clamp-3">{s.blurb}</p>
              <div className="mt-auto pt-3 text-sm">
                {s.website ? (
                  <a
                    href={s.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline hover:text-white inline-flex items-center gap-1"
                  >
                    Visit website <ExternalLink size={14} />
                  </a>
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
