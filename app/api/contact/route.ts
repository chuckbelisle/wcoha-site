import { NextRequest, NextResponse } from 'next/server';
import { EmailClient } from '@azure/communication-email';

export const runtime = 'nodejs';

let getSheetsClient: (() => any) | null = null;
try {
  getSheetsClient = require('@/lib/sheets').getSheetsClient;
} catch { /* lib/sheets may not exist locally; fine */ }

const s = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
const yesNo = (b: any) => (b ? 'Yes' : 'No');
const limit = (str: string, max = 2000) => (str || '').slice(0, max);

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
    const phoneDisplay = limit(s(data.phoneDisplay), 32);
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

    // --- Email via ACS ---
    const conn = process.env.ACS_EMAIL_CONNECTION_STRING;
    const from = process.env.CONTACT_FROM || 'no-reply@wcoha.ca';
    const to = process.env.CONTACT_TO;

    if (!conn || !to) {
      console.error('Missing ACS_EMAIL_CONNECTION_STRING or CONTACT_TO');
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const composed = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Phone: ${phone || '—'} (${phoneDisplay || '—'})`,
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

    const client = new EmailClient(conn);
    const poller = await client.beginSend({
      senderAddress: from,
      recipients: { to: [{ address: to }] },
      content: { subject: `WCOHA Contact / Join: ${name}`, plainText: composed },
      replyTo: email ? [{ address: email }] : undefined,
    });
    const result = await poller.pollUntilDone(); // default polling; no updateIntervalInMs

    if (result.status !== 'Succeeded') {
      console.warn('ACS email send did not succeed:', result);
      // Continue to Sheets append; or return 502 if you want to hard-fail
    }

    // --- Append to Sheets ---
    const submittedAt = new Date().toISOString();
    const useSheetsApi = process.env.USE_GOOGLE_SHEETS_API === 'true' && typeof getSheetsClient === 'function';

    if (useSheetsApi) {
      const spreadsheetId = process.env.SHEETS_JOIN_SPREADSHEET_ID;
      const sheet = process.env.SHEETS_JOIN_SHEET || 'JoinRequests';
      const emailSa = process.env.GOOGLE_SA_EMAIL;
      const keySa = process.env.GOOGLE_SA_KEY;

      if (!spreadsheetId || !emailSa || !keySa) {
        console.warn('Join append skipped: missing env for Sheets API');
      } else {
        try {
          const sheets = getSheetsClient!();
          const rows = [[
            submittedAt,
            name, email, phone, phoneDisplay,
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
          console.warn('Sheets API append failed:', (e as any)?.message || e);
          // Optional: return 502 if append must succeed
        }
      }
    } else {
      const sheetEndpoint = process.env.SHEET_ENDPOINT;
      if (!sheetEndpoint) {
        console.warn('Join append skipped: no SHEET_ENDPOINT and USE_GOOGLE_SHEETS_API is not true');
      } else {
        const rowPayload = {
          submittedAt, name, email, phone, phoneDisplay,
          age, currentLevel, position, goalie, spareOnly, notes, message,
        };
        let ok = false;
        for (let attempt = 1; attempt <= 2; attempt++) {
          try {
            const res = await postWithTimeout(sheetEndpoint, rowPayload, 8000);
            if (res.ok) { ok = true; break; }
            const txt = await res.text().catch(() => '');
            console.warn(`SHEET_ENDPOINT append attempt ${attempt} failed:`, txt || res.status);
          } catch (err) {
            console.warn(`SHEET_ENDPOINT append attempt ${attempt} error:`, (err as any)?.message || err);
          }
          await new Promise(r => setTimeout(r, 400 + Math.random() * 600));
        }
        if (!ok) console.warn('SHEET_ENDPOINT append ultimately failed');
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('contact route error:', err);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}