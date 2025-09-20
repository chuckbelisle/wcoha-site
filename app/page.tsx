'use client';

import { useState,useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Newspaper, Trophy, ExternalLink, MapPin } from 'lucide-react';


function toGCalDate(isoLike: string): string {
  // Accepts "2025-10-09T19:00:00-04:00" or "2025-10-09T23:00:00Z" and converts to UTC YYYYMMDDTHHMMSSZ
  const d = new Date(isoLike);
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = d.getUTCFullYear();
  const m = pad(d.getUTCMonth() + 1);
  const day = pad(d.getUTCDate());
  const hh = pad(d.getUTCHours());
  const mm = pad(d.getUTCMinutes());
  const ss = pad(d.getUTCSeconds());
  return `${y}${m}${day}T${hh}${mm}${ss}Z`;
}

function buildGoogleCalHref(item: {
  title: string;
  eventStart: string;
  eventEnd: string;
  details?: string;
  location?: string;
}): string {
  const text = encodeURIComponent(item.title);
  const dates = `${toGCalDate(item.eventStart)}/${toGCalDate(item.eventEnd)}`;
  const details = encodeURIComponent(item.details ?? '');
  const location = encodeURIComponent(item.location ?? '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${text}&dates=${dates}&details=${details}&location=${location}`;
}

const InstagramIcon = (props: React.SVGProps<SVGSVGElement>) => (
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

function Logo({ className = 'h-20 w-auto' }: { className?: string }) {
  return <img src="/wcoha-logo-v2.png" alt="WCOHA logo" className={`${className} object-contain`} />;
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
    company: ''   // honeypot (leave empty)
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
        phone: phoneE164,                 // Backend/Sheet
        phoneDisplay,                     // Pretty version too
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
        : 'Submission failed. Please try again or email web@wcoha.ca.';
      setJoinError(msg);
    } finally {
      clearTimeout(timeoutId);
      setJoinSubmitting(false);
    }
  }

  // ---------- News (with optional calendar) ----------
  type NewsItem = {
    id: number
    title: string
    blurb: string
    href?: string
    eventStart?: string  // ISO w/ timezone or Z, e.g. "2025-10-09T19:00:00-04:00"
    eventEnd?: string    // ISO w/ timezone or Z, e.g. "2025-10-09T21:00:00-04:00"
    location?: string
    details?: string
  }

  const news: NewsItem[] = [
    {
      id: 1,
      title: '2025–26 Registration Now Open',
      blurb: 'Secure your spot for the upcoming season.',
      href: '#join',
    },
    {
      id: 2,
      title: 'Draft day is October 9th 2025 @ 7pm',
      blurb:
        'Join us for a social night where everyone is welcome and you get to see the draft live and meet your team captain and your teammates for the 25/26 season!',
      // Local time in Ottawa/Toronto (EDT, UTC-4 on Oct 9, 2025)
      eventStart: '2025-10-09T19:00:00-04:00',
      eventEnd:   '2025-10-09T21:00:00-04:00',
      location: 'Carp Arena',
      details: 'League draft night and social.',
    },
    {
      id: 3,
      title: 'We have an Instagram account!!',
      blurb: 'Follow the league & tag us in your posts.',
      href: 'https://www.instagram.com/wcoha_league/',
    },
  ]
  // Standings hook to sheets
  const [standings, setStandings] = useState<{ elford: any[]; stevenard: any[] } | null>(null);
  const [stErr, setStErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('/api/standings', { cache: 'no-store' });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.error || 'Failed');
        if (!cancelled) setStandings(data);
      } catch (e) {
        if (!cancelled) setStErr('Unable to load standings right now.');
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ---------------------------------------------------

  return (
    <div className="min-h-screen bg-[#0f1722] text-white">

      {/* Hero */}
      <section className="bg-gradient-to-b from-[#1d3557] to-[#152238]">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20 grid md:grid-cols-[1.2fr,0.8fr] gap-8 items-center">
          <div>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Community. Competition. Camaraderie.
            </h1>
            <p className="mt-4 text-white/80 md:text-lg">
              West Carleton’s 35+ men’s hockey league—friendly rivalry, organized seasons, and post-game laughs.
            </p>
            <div className="mt-6 flex gap-3">
              <Button className="rounded-2xl px-5 py-5 text-base bg-[#e63946] hover:bg-[#c92c39]"><a href="#join">Join the League</a></Button>
            </div>
            <div className="mt-6 flex items-center gap-4 text-xs text-white/70">
              <div className="flex items-center gap-2"><Trophy size={16} /> Recreational tiers</div>
              <div className="flex items-center gap-2"><Users size={16} /> 12 teams • 2 divisions • 32-game season</div>
              <div className="flex items-center gap-2"><MapPin size={16} /> Carp & Kinburn rinks</div>
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

      {/* News */}
      <section id="news" className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-end justify-between mb-4">
          <h2 className="text-2xl font-bold">League News</h2>
          <a href="#" className="text-sm text-white/80 hover:text-white">All news →</a>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {news.map((n) => {
            const showCalendar = Boolean(n.eventStart && n.eventEnd);
            const calHref = showCalendar
              ? buildGoogleCalHref({
                title: n.title,
                eventStart: n.eventStart!,
                eventEnd: n.eventEnd!,
                details: n.blurb,
                location: n.location,
              })
              : undefined;

            return (
              <Card key={n.id} className="rounded-2xl bg-white/5 border-white/10">
                <CardContent className="p-5">
                  <h3 className="font-semibold">{n.title}</h3>
                  <p className="text-sm text-white/70 mt-1">
                    {n.blurb}{' '}
                    {showCalendar ? (
                      <a
                        href={calHref}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-white"
                      >
                        Add to Calendar
                      </a>
                    ) : n.href ? (
                      <a href={n.href} className="underline hover:text-white inline-flex items-center gap-1">
                        Read more <ExternalLink size={14} />
                      </a>
                    ) : null}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
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
            <input value={joinData.fullName} onChange={e => updateJoin('fullName', e.target.value)} type="text" className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" required />
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input value={joinData.email} onChange={e => updateJoin('email', e.target.value)} type="email" className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" required />
            </div>
            <div>
              <label className="block text-sm mb-1">Phone</label>
              <input
                value={joinData.phone}
                onChange={e => updateJoin('phone', formatPhoneDisplay(e.target.value))}
                type="tel"
                inputMode="tel"
                className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" />
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm mb-1">Player's Age</label>
              <input value={joinData.age} onChange={e => updateJoin('age', e.target.value)} type="number" min={35} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" placeholder="35+" required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm mb-1">Current Level of Hockey</label>
              <select value={joinData.currentLevel} onChange={e => updateJoin('currentLevel', e.target.value)} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white">
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
              <select value={joinData.position} onChange={e => updateJoin('position', e.target.value)} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white">
                <option>Forward</option>
                <option>Defense</option>
                <option>Goalie</option>
                <option>Flexible</option>
              </select>
            </div>
            <div className="flex items-center gap-6 pt-6 text-sm">
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[#e63946]" checked={joinData.goalie} onChange={e => updateJoin('goalie', e.target.checked)} /> Goalie</label>
              <label className="inline-flex items-center gap-2"><input type="checkbox" className="accent-[#e63946]" checked={joinData.spareOnly} onChange={e => updateJoin('spareOnly', e.target.checked)} /> Spare-only</label>
            </div>
          </div>

          <div>
            <label className="block text-sm mb-1">Notes (optional)</label>
            <textarea value={joinData.notes} onChange={e => updateJoin('notes', e.target.value)} rows={4} className="w-full rounded-xl px-3 py-2 bg-white/10 border border-white/20 text-white" placeholder="Any previous leagues, injuries, buddy requests, availability notes, etc." />
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
            autoComplete="off" />
        </form>
      </section>

      {/* Standings */}
      <section id="standings" className="max-w-6xl mx-auto px-4 py-10">
      <h2 className="text-2xl font-bold">Elford division Standings</h2>
      {stErr && <p className="text-sm text-red-400 mt-2">{stErr}</p>}
      {!standings ? (
        <p className="text-white/70 mt-2 text-sm">Loading…</p>
      ) : (
        <div style={{ marginBottom: '20px' }} className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>{['Team','GP','W','L','T','PTS','GF','GA','DIFF'].map(h => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {standings.elford.map((r, i) => (
                <tr key={i} className="odd:bg-white/[0.03]">
                  <td className="px-4 py-2">{r.team}</td>
                  <td className="px-4 py-2">{r.gp}</td>
                  <td className="px-4 py-2">{r.w}</td>
                  <td className="px-4 py-2">{r.l}</td>
                  <td className="px-4 py-2">{r.t}</td>
                  <td className="px-4 py-2">{r.pts}</td>
                  <td className="px-4 py-2">{r.gf}</td>
                  <td className="px-4 py-2">{r.ga}</td>
                  <td className="px-4 py-2">{r.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <h2 className="text-2xl font-bold">Stevenard division Standings</h2>
      {!standings ? (
        <p className="text-white/70 mt-2 text-sm">Loading…</p>
      ) : (
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10">
          <table className="min-w-full text-sm">
            <thead className="bg-white/5">
              <tr>{['Team','GP','W','L','T','PTS','GF','GA','DIFF'].map(h => <th key={h} className="text-left px-4 py-2">{h}</th>)}</tr>
            </thead>
            <tbody>
              {standings.stevenard.map((r, i) => (
                <tr key={i} className="odd:bg-white/[0.03]">
                  <td className="px-4 py-2">{r.team}</td>
                  <td className="px-4 py-2">{r.gp}</td>
                  <td className="px-4 py-2">{r.w}</td>
                  <td className="px-4 py-2">{r.l}</td>
                  <td className="px-4 py-2">{r.t}</td>
                  <td className="px-4 py-2">{r.pts}</td>
                  <td className="px-4 py-2">{r.gf}</td>
                  <td className="px-4 py-2">{r.ga}</td>
                  <td className="px-4 py-2">{r.diff}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
    </div>
  );
}
