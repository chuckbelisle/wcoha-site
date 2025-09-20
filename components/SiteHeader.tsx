'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ExternalLink } from 'lucide-react';

function InstagramIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={props.width ?? 16}
      height={props.height ?? 16}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
    </svg>
  );
}

export default function SiteHeader() {
  const [navOpen, setNavOpen] = useState(false);

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

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link className="hover:text-[#e63946] transition" href="/">Home</Link>
          <Link className="hover:text-[#e63946] transition" href="/#join">Join the League</Link>
          <Link className="hover:text-[#e63946] transition" href="/#standings">Standings</Link>
          <Link className="hover:text-[#e63946] transition" href="/sponsors">Sponsors</Link>
          <Link className="hover:text-[#e63946] transition" href="/#about">About</Link>
          <a
            className="hover:text-[#e63946] transition inline-flex items-center gap-1"
            href="https://instagram.com/wcoha_league"
            target="_blank"
            rel="noopener noreferrer"
          >
            <InstagramIcon /> Instagram
          </a>
        </nav>

        {/* Mobile toggle */}
        <button
          className="md:hidden inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5"
          onClick={() => setNavOpen((v) => !v)}
          aria-expanded={navOpen}
          aria-controls="mobile-nav"
        >
          Menu
        </button>
      </div>

      {/* Mobile nav */}
      {navOpen && (
        <div id="mobile-nav" className="md:hidden border-t border-white/10">
          <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-2 gap-3 text-sm">
            <Link href="/" className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10">Home</Link>
            <Link href="/#join" className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10">Join</Link>
            <Link href="/#standings" className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10">Standings</Link>
            <Link href="/sponsors" className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10">Sponsors</Link>
            <Link href="/#about" className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10">About</Link>
            <a
              href="https://instagram.com/wcoha_league"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10 inline-flex items-center gap-1"
            >
              <InstagramIcon /> Instagram
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
