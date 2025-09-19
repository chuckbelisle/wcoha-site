import { NextRequest, NextResponse } from 'next/server';
import { EmailClient } from '@azure/communication-email';

// Optional direct Sheets append if you’ve set up lib/sheets.ts and env vars
let getSheetsClient: (() => any) | null = null;
try {
  // soft import to avoid bundling error if lib doesn’t exist yet
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  getSheetsClient = require('@/lib/sheets').getSheetsClient;
} catch { /* noop */ }

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const yesNo = (b: any) => (b ? 'Yes' : 'No');

function limit(str: string, max = 2000) {
  return (str || '').slice(0, max);
}

async function postWithTimeout(url: string, body: any, ms = 8000): Promise<Response> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal
    });
  } finally {
    clearTimeout(t);
  }
}

export async function POST(req: NextRequest) {
  try {
    const data = await req.json().catch(() => ({} as any));

    const name = limit(s(data.name), 200);
    const email = limit(s(data.email), 200);
    const message = limit(s(data.message), 5000);
    const company = s(data.company); // honeypot

    const phone = limit(s(data.phone), 32);
    const age = limit(s(data.age), 8);
    const currentLevel = limit(s(data.currentLevel), 128);
    const position = limit(s(data.position), 64);
    const goalie = Boolean(data.goalie);
    const spareOnly = Boolean(data.spareOnly);
    const notes = limit(s(data.notes), 2000);

    // Honeypot + basic validation
    if (company) return new Response(null, { status: 204 });
    if (!name || !email || !message) {
      return NextResponse.json({ error: 'Missing name, email, or message' }, { status: 400 });
    }

    // --- Send email via Azure Communication Services ---
    const conn = process.env.ACS_EMAIL_CONNECTION_STRING;
    const from = process.env.CONTACT_FROM || 'no-reply@wcoha.ca'; // must be verified in ACS
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
      `Goalie: ${yesNo(goalie)}`,
      `Spare-only: ${yesNo(spareOnly)}`,
      '',
      (notes || '—'),
      '',
      '--- Raw message ---',
      message
    ].join('\n');

const poller = await client.beginSend({
  senderAddress: from,
  recipients: { to: [{ address: to }] },
  content: { subject: `WCOHA Contact / Join: ${name}`, plainText: composed },
  replyTo: email ? [{ address: email }] : undefined,
});

// optional timeout via AbortController
const ac = new AbortController();
const timeout = setTimeout(() => ac.abort(), 20000);

let result;
try {
  result = await poller.pollUntilDone({ abortSignal: ac.signal as any });
} finally {
  clearTimeout(timeout);
}

if (result.status !== 'Succeeded') {
  console.warn('ACS email send did not succeed:', result);
}

    // --- Append to Google Sheet ---
    const useSheetsApi = process.env.USE_GOOGLE_SHEETS_API === 'true' && typeof getSheetsClient === 'function';
    const submittedAt = new Date().toISOString();

    if (useSheetsApi) {
      try {
        const sheets = getSheetsClient!();
        const spreadsheetId = process.env.SHEETS_JOIN_SPREADSHEET_ID!;
        const sheet = process.env.SHEETS_JOIN_SHEET || 'JoinRequests';

        const rows = [[
          submittedAt,
          name, email, phone,
          (data.phoneDisplay ?? ''), // optional pretty phone if it passes
          age, currentLevel, position,
          yesNo(goalie), yesNo(spareOnly),
          notes
        ]];

        await sheets.spreadsheets.values.append({
          spreadsheetId,
          range: `${sheet}!A1`,
          valueInputOption: 'USER_ENTERED',
          requestBody: { values: rows },
        });
      } catch (e) {
        console.warn('Sheets API append failed:', e);
        // don’t fail the request for the user; log only
      }
    } else {
      const sheetEndpoint = process.env.SHEET_ENDPOINT;
      if (sheetEndpoint) {
        const rowPayload = {
          submittedAt,
          name, email, phone,
          phoneDisplay: data.phoneDisplay ?? '',
          age, currentLevel, position,
          goalie, spareOnly, notes, message
        };

        // one try w/ brief retry
        let ok = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const res = await postWithTimeout(sheetEndpoint, rowPayload, 8000);
            if (res.ok) { ok = true; break; }
            const txt = await res.text().catch(() => '');
            console.warn(`Sheets append attempt ${attempt} failed:`, txt || res.status);
          } catch (err) {
            console.warn(`Sheets append attempt ${attempt} error:`, (err as any)?.message || err);
          }
          await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
        }
        if (!ok) {
          // keep user success;
          console.warn('Sheets append ultimately failed');
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}