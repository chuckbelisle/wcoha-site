'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Newspaper, Trophy, ExternalLink, MapPin } from 'lucide-react';

/**
 * LeagueHomeV2 – Next.js App Router page
 * - Uses actual logo (public/wcoha-logo.png)
 * - Join form includes Player's Age + Current Level
 * - Google Sheets submission via Apps Script Web App endpoint
 */

function Logo({ className = 'h-20 w-auto' }: { className?: string }) {
  return <img src="/wcoha-logo.png" alt="WCOHA logo" className={`${className} object-contain`} />;
}

function formatPhoneDisplay(raw: string) {
  // Keep digits; allow optional leading 1 for North America
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('1')) d = d.slice(1);          // strip leading country code for display
  d = d.slice(0, 10);                              // cap to 10 local digits

  const parts = [d.slice(0,3), d.slice(3,6), d.slice(6,10)].filter(Boolean);
  if (d.length > 6) return `(${parts[0]}) ${parts[1]}-${parts[2]}`;
  if (d.length > 3)  return `(${parts[0]}) ${parts[1]}`;
  if (d.length > 0)  return `(${parts[0]}`;
  return '';
}

function toE164(raw: string) {
  // Returns +1XXXXXXXXXX when possible; else returns digits-only fallback
  let d = raw.replace(/\D/g, '');
  if (d.startsWith('1')) d = d.slice(1);
  d = d.slice(0, 10);
  return d.length === 10 ? `+1${d}` : d; // Canada/US
}

export default function Page() {
  const [navOpen, setNavOpen] = useState(false);

  const [joinData, setJoinData] = useState({
    fullName: '',
    email: '',
    phone: '',
    age: '', // Player's age (35+)
    currentLevel: 'Beer League (Rec)',
    position: 'Forward',
    goalie: false,
    spareOnly: false,
    notes: '',
    company: ''   // <-- honeypot (leave empty)
  });
  const [joinSubmitting, setJoinSubmitting] = useState(false);
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [joinError, setJoinError] = useState<string | null>(null);

  function updateJoin(key: keyof typeof joinData, value: any) {
    setJoinData(prev => ({ ...prev, [key]: value }));
  }

async function submitJoin(e: React.FormEvent) {
  e.preventDefault();
  if (joinSubmitting) return; // guard
  setJoinError(null);
  setJoinSuccess(null);

  // Trimmed copies for validation/payload
  const fullName = joinData.fullName.trim();
  const email = joinData.email.trim();
  const phone = (joinData.phone || '').trim();
  const ageStr = (joinData.age || '').trim();

  if (!fullName) return setJoinError('Please enter your full name.');
  if (!/^\S+@\S+\.[\w-]+$/.test(email)) return setJoinError('Please enter a valid email.');
  const ageNum = Number(ageStr);
  if (!ageNum || ageNum < 35) return setJoinError('This is a 35+ league.');

  setJoinSubmitting(true);

  // Abort after 15s to avoid hanging UI
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const composedMessage = [
      `Phone: ${phone || '—'}`,
      `Age: ${ageStr}`,
      `Level: ${joinData.currentLevel}`,
      `Position: ${joinData.position}`,
      `Goalie: ${joinData.goalie ? 'Yes' : 'No'}`,
      `Spare-only: ${joinData.spareOnly ? 'Yes' : 'No'}`,
      '',
      (joinData.notes || '').trim()
    ].join('\n');

    const phoneDisplay = (joinData.phone || '').trim();
    const phoneE164 = toE164(phoneDisplay);

    const payload = {
      name: fullName,
      email,
      message: composedMessage,
      company: (joinData as any).company || '',
      phone: phoneE164,                 // ← normalized for backend/Sheet
      phoneDisplay,                     // ← optional: keep pretty version too
      age: ageStr,
      currentLevel: joinData.currentLevel,
      position: joinData.position,
      goalie: joinData.goalie,
      spareOnly: joinData.spareOnly,
      notes: (joinData.notes || '').trim(),
      submittedAt: new Date().toISOString()
    };

    const res = await fetch('/api/contact', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controller.signal
    });

    if (!res.ok) {
      // Prefer text so we don’t throw on non-JSON errors
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `HTTP ${res.status}`);
    }

    setJoinSuccess("Thanks! You're on the list. We'll email you details soon.");
    setJoinData({
      fullName: '', email: '', phone: '', age: '',
      currentLevel: 'Beer League (Rec)', position: 'Forward',
      goalie: false, spareOnly: false, notes: '',
      company: '' // for honeypot
    });
  } catch (err: any) {
    const msg = err?.name === 'AbortError'
      ? 'Network timeout. Please try again.'
      : 'Submission failed. Please try again or email wcoha@example.org.';
    setJoinError(msg);
  } finally {
    clearTimeout(timeoutId);
    setJoinSubmitting(false);
  }
}

  const news = [
    { id: 1, title: '2025–26 Registration Now Open', blurb: 'Secure your spot for the upcoming season. Early-bird closes Sept 30.', href: '#' },
    { id: 2, title: 'Spares & Subs List Updated', blurb: 'New process for game‑day call‑ups. Make sure your contact info is current.', href: '#' },
    { id: 3, title: 'Sponsor Spotlight: Carp Local Market', blurb: 'Thanks to our community partners for supporting the league.', href: '#' },
  ];

  return (
    <div className="min-h-screen bg-[#0f1722] text-white">
      {/* Top Bar */}
      <header className="sticky top-0 z-40 backdrop-blur supports-[backdrop-filter]:bg-[#0f1722]/60 bg-[#0f1722]/90 border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo className="h-10 w-auto" />
            <div className="leading-tight">
              <div className="text-lg font-bold tracking-tight">West Carleton Oldtimers Hockey</div>
              <div className="text-xs text-white/70">35+ Men’s ice hockey League • Since 1989</div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <a className="hover:text-[#e63946] transition" href="#join">Join the League</a>
            <a className="hover:text-[#e63946] transition" href="#standings">Standings</a>
            <a className="hover:text-[#e63946] transition" href="#teams">Teams</a>
            {/*<a className="hover:text-[#e63946] transition" href="#registration">Registration</a>*/}
            <a className="hover:text-[#e63946] transition" href="#about">About</a>
          </nav>
          <button className="md:hidden inline-flex items-center gap-2 rounded-2xl border border-white/10 px-3 py-2 text-sm hover:bg-white/5" onClick={() => setNavOpen(!navOpen)}>
            Menu
          </button>
        </div>
        {navOpen && (
          <div className="md:hidden border-t border-white/10">
            <div className="max-w-6xl mx-auto px-4 py-3 grid grid-cols-2 gap-3 text-sm">
              {[
                ['Join', '#join'],
                ['Standings', '#standings'],
                ['Teams', '#teams'],
                /*['Registration', '#registration'],*/
                ['Spares', '#spares'],
                ['About', '#about'],
              ].map(([label, href]) => (
                <a key={label} href={href} className="rounded-xl bg-white/5 px-3 py-2 hover:bg-white/10">
                  {label}
                </a>
              ))}
            </div>
          </div>
        )}
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1d3557] to-[#152238]">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Community. Competition. Camaraderie.
            </h1>
            <p className="mt-4 text-white/80 md:text-lg">
              West Carleton’s 35+ men’s hockey league—friendly rivalry, organized seasons, and post‑game laughs.
            </p>
            <div className="mt-6 flex gap-3">
              <Button className="rounded-2xl px-5 py-5 text-base bg-[#e63946] hover:bg-[#c92c39]"><a href="#join">Join the League</a></Button>
              {/*<Button className="rounded-2xl px-5 py-5 text-base bg-white/10 hover:bg-white/15"><a href="#join">Join the League</a></Button>*/}
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-white/70">
              <div className="flex items-center gap-2"><Trophy size={16}/> Recreational tiers</div>
              <div className="flex items-center gap-2"><Users size={16}/> 12 teams • 2 divisions • 32‑game season</div>
              <div className="flex items-center gap-2"><MapPin size={16}/> Carp & Kinburn rinks</div>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 p-4 bg-white/5">
            <div className="rounded-2xl overflow-hidden grid place-items-center bg-[#0f1722]">
              <Logo className="w-full h-full" />
            </div>
            <div className="p-4">
              <h3 className="font-semibold">Proudly local since 1989</h3>
              <p className="text-sm text-white/70 mt-1">Run by volunteers for our community. Spares list available all season.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Links */}
      <section className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-4">
        {[
          { icon: Users, title: 'Join the League', text: 'Fill out our form to be added to the roster.', href: '#join' },
          { icon: Trophy, title: 'Standings & Stats', text: 'Live standings, goalies, and season leaders.', href: '#standings' },
          { icon: Newspaper, title: 'League News', text: 'Announcements, forms, and sponsor updates.', href: '#news' },
        ].map(({ icon: Icon, title, text, href }) => (
          <a key={title} href={href} className="group rounded-2xl border border-white/10 p-5 bg-white/5 hover:bg-white/10 transition block">
            <div className="flex items-center gap-3">
              <span className="rounded-xl bg-[#1d3557] p-2 border border-white/10"><Icon size={18}/></span>
              <h3 className="font-semibold">{title}</h3>
            </div>
            <p className="text-sm text-white/70 mt-2">{text}</p>
            <div className="text-xs mt-3 inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
              Open <ExternalLink size={14}/>
            </div>
          </a>
        ))}
      </section>

      {/* Join the League */}
      <section id="join" className="max-w-2xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold mb-4">Join the League</h2>
        <p className="text-white/70 mb-6 text-sm">Interested in playing? Fill out the form below and we’ll get back to you with details about registration, teams, and spare opportunities. Scheduling is handled in <span className="font-semibold">BenhApp</span>.</p>

        {joinSuccess && <div className="mb-4 rounded-xl border border-white/10 bg-white/10 px-4 py-3 text-sm">{joinSuccess}</div>}
        {joinError && <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">{joinError}</div>}

        <form className="space-y-4" onSubmit={submitJoin}>
          <div>
            <label className="block text-sm mb-1">Full Name</label>
            <input value={joinData.fullName} onChange={e=>updateJoin('fullName', e.target.value)} type="text" className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" required/>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input value={joinData.email} onChange={e=>updateJoin('email', e.target.value)} type="email" className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" required/>
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                value={joinData.phone}
                onChange={e => updateJoin('phone', formatPhoneDisplay(e.target.value))}
                type="tel"
                inputMode="tel"
                className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Player's Age</label>
              <input value={joinData.age} onChange={e=>updateJoin('age', e.target.value)} type="number" min={35} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" placeholder="35+" required/>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Current Level of Hockey</label>
              <select value={joinData.currentLevel} onChange={e=>updateJoin('currentLevel', e.target.value)} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white">
                <option>Beer League (Rec)</option>
                <option>Men's League A/B</option>
                <option>Pickup Only</option>
                <option>Former Competitive (Junior/College)</option>
                <option>Returning after long break</option>
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Preferred Position</label>
              <select value={joinData.position} onChange={e=>updateJoin('position', e.target.value)} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white">
                <option>Forward</option>
                <option>Defense</option>
                <option>Goalie</option>
                <option>Flexible</option>
              </select>
            </div>
            <div className="flex items-center gap-6 pt-6 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[#e63946]" checked={joinData.goalie} onChange={e=>updateJoin('goalie', e.target.checked)}/> Goalie</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[#e63946]" checked={joinData.spareOnly} onChange={e=>updateJoin('spareOnly', e.target.checked)}/> Spare‑only</label>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Notes (optional)</label>
            <textarea value={joinData.notes} onChange={e=>updateJoin('notes', e.target.value)} rows={4} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" placeholder="Any previous leagues, injuries, buddy requests, availability notes, etc."/>
          </div>

          <Button type="submit" disabled={joinSubmitting} className="rounded-xl bg-[#e63946] hover:bg-[#c92c39] px-5 py-2">
            {joinSubmitting ? 'Submitting…' : 'Submit'}
          </Button>

          <div className="text-xs text-white/60">After approval you’ll receive your BenhApp invite link by email. We never sell your data.</div>
        <input
          type="text"
          name="company"
          value={joinData.company}
          onChange={e => updateJoin('company', e.target.value)}
          style={{ display: 'none' }}
          tabIndex={-1}
          autoComplete="off"
        />
        </form>
      </section>

      {/* Standings placeholder */}
      <section id="standings" className="max-w-6xl mx-auto px-4 py-10">
        <h2 className="text-2xl font-bold">Standings</h2>
        <p className="text-white/70 mt-2 text-sm">Hook this table up to your data source (Google Sheet, LeagueTool, or custom DB).</p>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>
                {['Team','GP','W','L','T','PTS','GF','GA','DIFF'].map(h => (
                  <th key={h} className="text-left px-4 py-2">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[
                ['Blades', 6, 5, 1, 0, 10, 26, 14, +12],
                ['Wolves', 6, 4, 2, 0, 8, 21, 18, +3],
                ['Pioneers', 6, 3, 3, 0, 6, 17, 17, 0],
              ].map((row, i) => (
                <tr key={i} className="odd:bg-white/[0.03]">
                  {row.map((cell, j) => (
                    <td key={j} className="px-4 py-2">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* News */}
      <section id="news" className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">League News</h2>
          <a href="#" className="text-sm text-white/80 hover:text-white">All news →</a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {news.map(n => (
            <Card key={n.id} className="rounded-2xl bg-white/5 border-white/10">
              <CardContent className="p-5">
                <h3 className="font-semibold">{n.title}</h3>
                <p className="text-sm text-white/70 mt-1">{n.blurb}</p>
                <a href={n.href} className="text-sm inline-flex items-center gap-1 mt-3 hover:underline">Read more <ExternalLink size={14}/></a>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Sponsors */}
      <section className="bg-white/5">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-center font-semibold tracking-wide text-white/80 text-sm">League Sponsors</h2>
          <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
            {['Carp Local Market','Village Auto','Riverbend Diner','Kinburn Hardware'].map(s => (
              <div key={s} className="rounded-xl border border-white/10 p-4 text-center text-white/60">{s}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="about" className="border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-10 grid md:grid-cols-3 gap-6 text-sm text-white/70">
          <div>
            <div className="flex items-center gap-3">
              <Logo className="h-8 w-auto"/>
              <span className="font-semibold text-white">WCOHA</span>
            </div>
            <p className="mt-2">West Carleton Oldtimers Hockey Association. Community‑run 35+ league since 1989.</p>
          </div>
          <div>
            <div className="font-semibold text-white">Quick Links</div>
            <ul className="mt-2 space-y-1">
              <li><a href="#join" className="hover:text-white">Join the League</a></li>
              <li><a href="#spares" className="hover:text-white">Spares & Subs</a></li>
              <li><a href="#standings" className="hover:text-white">Standings</a></li>
              <li><a href="#news" className="hover:text-white">News</a></li>
            </ul>
          </div>
          <div>
            <div className="font-semibold text-white">Contact</div>
            <p className="mt-2">wcoha@example.org<br/>Carp, Ontario</p>
          </div>
        </div>
        <div className="text-center text-xs text-white/50 pb-6">© {new Date().getFullYear()} WCOHA. All rights reserved.</div>
      </footer>
    </div>
  );
}
