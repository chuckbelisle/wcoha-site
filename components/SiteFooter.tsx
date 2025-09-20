'use client';

import Link from 'next/link';

function Logo({ className = 'h-8 w-auto' }: { className?: string }) {
  return <img src="/wcoha-logo-v2.png" alt="WCOHA logo" className={`${className} object-contain`} />;
}

export default function SiteFooter() {
  return (
    <footer id="about" className="border-t border-white/10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm text-white/70">
        <div>
          <div className="flex items-center gap-3">
            <Logo />
            <span className="font-semibold text-white">WCOHA</span>
          </div>
          <p className="mt-2">West Carleton Oldtimers Hockey Association. Community-run 35+ league since 1989.</p>
        </div>

        <div>
          <div className="font-semibold text-white">Quick Links</div>
          <ul className="mt-2 space-y-1">
            <li><Link href="/#join" className="hover:text-white">Join the League</Link></li>
            <li><Link href="/#standings" className="hover:text-white">Standings</Link></li>
            <li><Link href="/#news" className="hover:text-white">News</Link></li>
            <li>
              <a
                href="https://instagram.com/wcoha_league"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-white inline-flex items-center gap-1"
              >
                Instagram
              </a>
            </li>
          </ul>
        </div>

        <div>
          <div className="font-semibold text-white">Contact</div>
          <p className="mt-2">web@wcoha.ca<br/>Carp, Ontario</p>
        </div>
      </div>
      <div className="text-center text-xs text-white/50 pb-6">
        © {new Date().getFullYear()} WCOHA. All rights reserved.
      </div>
      <div className="text-center text-xs text-white/50 pb-6">
        Site designed by PL Cloud Solutions Inc
      </div>
    </footer>
  );
}
