'use client';

import Link from 'next/link';
import { notFound } from 'next/navigation';
import sponsors from '@/data/sponsors.json';

type Sponsor = typeof sponsors[number];

export default function SponsorDetail({ params }: { params: { slug: string } }) {
  const sponsor = (sponsors as Sponsor[]).find(s => s.slug === params.slug);
  if (!sponsor) return notFound();

  return (
    <main className="min-h-screen bg-[#0f1722] text-white">

      <div className="max-w-4xl mx-auto px-4 py-10">
        <Link href="/sponsors" className="text-sm text-white/70 hover:text-white">← Back to Sponsors</Link>

        <div className="mt-6 grid md:grid-cols-[1fr,1.5fr] gap-8 items-start">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 grid place-items-center">
            <img src={sponsor.localSrc} alt={sponsor.name} className="w-full h-40 object-contain" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-extrabold">{sponsor.name}</h1>
            <p className="text-white/80 mt-3 leading-relaxed">{sponsor.blurb}</p>
            <div className="mt-5">
              {sponsor.website ? (
                <a href={sponsor.website} target="_blank" rel="noopener noreferrer" className="inline-block rounded-xl bg-white/10 border border-white/10 px-4 py-2 text-sm hover:bg-white/15 underline">
                  Visit official website
                </a>
              ) : (
                <span className="text-white/60 text-sm">Official website not available.</span>
              )}
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-semibold">About this sponsor</h2>
          <p className="text-sm text-white/70 mt-2">If you provide more details (services, address, contact, promo codes for WCOHA players, etc.), we can expand this section.</p>
        </section>
      </div>
    </main>
  );
}
