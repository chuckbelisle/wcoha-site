import { NextRequest, NextResponse } from 'next/server';
import { EmailClient } from '@azure/communication-email';

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => ({} as any));

    const name = s(data.name);
    const email = s(data.email);
    const message = s(data.message);
    const company = s(data.company);
    const phone = s(data.phone);
    const age = s(data.age);
    const currentLevel = s(data.currentLevel);
    const position = s(data.position);
    const goalie = Boolean(data.goalie);
    const spareOnly = Boolean(data.spareOnly);
    const notes = s(data.notes);

    // Honeypot + basic validation
    if (company) return new Response(null, { status: 204 });
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing name, email, or message' }, { status: 400 });
    }

    // --- ACS Email (Azure-native) ---
    const conn = process.env.ACS_EMAIL_CONNECTION_STRING;
    const from = process.env.CONTACT_FROM || 'no-reply@wcoha.ca'; // must be a verified ACS sender
    const to = process.env.CONTACT_TO;

    if (!conn || !to) {
      console.error('Missing ACS_EMAIL_CONNECTION_STRING or CONTACT_TO');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const client = new EmailClient(conn);

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

    // Send email and poll briefly for status
    const poller = await client.beginSend({
      senderAddress: from,
      recipients: { to: [{ address: to }] },
      content: {
        subject: `WCOHA Contact / Join: ${name}`,
        plainText: composed
      }
    });

    const result = await poller.pollUntilDone(); // waits until Succeeded/Failed
    if (result.status !== 'Succeeded') {
      console.warn('ACS email send did not succeed:', result);
      return NextResponse.json({ error: 'Email send failed' }, { status: 502 });
    }

    // --- Append to Google Sheet (server-side, optional) ---
    const sheetEndpoint = process.env.SHEET_ENDPOINT;
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
        // Keep success for the user; flip to a 502 if you want this to be mandatory.
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
