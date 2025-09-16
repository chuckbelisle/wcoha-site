import { NextRequest, NextResponse } from 'next/server';

// Optional: small helper for safer string handling
const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => ({} as any));

    const name = s(data.name);
    const email = s(data.email);
    const message = s(data.message);
    const company = s(data.company);          // honeypot
    const phone = s(data.phone);
    const age = s(data.age);
    const currentLevel = s(data.currentLevel);
    const position = s(data.position);
    const goalie = Boolean(data.goalie);
    const spareOnly = Boolean(data.spareOnly);
    const notes = s(data.notes);

    // Honeypot + validation
    if (company) return new Response(null, { status: 204 }); // silently drop bots
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing name, email, or message' }, { status: 400 });
    }

    // --- 1) Send email via SendGrid ---
    const sgKey = process.env.SENDGRID_API_KEY;
    const to = process.env.CONTACT_TO;
    const from = process.env.CONTACT_FROM || 'no-reply@wcoha.ca';

    if (!sgKey || !to) {
      console.error('Missing SENDGRID_API_KEY or CONTACT_TO');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const composed = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'}`,
      `Age: ${age || '—'}`,
      `Level: ${currentLevel || '—'}`,
      `Position: ${position || '—'}`,
      `Goalie: ${goalie ? 'Yes' : 'No'}`,
      `Spare-only: ${spareOnly ? 'Yes' : 'No'}`,
      '',
      (notes || '') || '—',
      '',
      '--- Raw message ---',
      message
    ].join('\n');

    const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${sgKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject: `WCOHA Contact / Join: ${name}`,
        content: [{ type: 'text/plain', value: composed }]
      })
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text().catch(() => '');
      console.error('SendGrid error:', detail);
      return NextResponse.json({ error: 'Email send failed' }, { status: 502 });
    }

    // --- 2) Append to Google Sheet via Apps Script (server-side) ---
    const sheetEndpoint = process.env.SHEET_ENDPOINT; // e.g. https://script.google.com/macros/s/XXX/exec
    if (sheetEndpoint) {
      const rowPayload = {
        submittedAt: new Date().toISOString(),
        name, email, phone, age, currentLevel, position, goalie, spareOnly, notes, message
      };

      const sheetRes = await fetch(sheetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowPayload)
      });

      if (!sheetRes.ok) {
        const txt = await sheetRes.text().catch(() => '');
        console.warn('Sheets append failed:', txt);
        // We don’t fail the user if Sheets hiccups; flip to strict if you prefer.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}