// app/api/standings/route.ts
import { NextResponse } from 'next/server';

// Force Node runtime (googleapis doesn't work on Edge)
export const runtime = 'nodejs';
// optional: ensure it always runs server-side fresh
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Lazy import to avoid edge bundling mishaps if this file is touched elsewhere
async function getSheets() {
  const { google } = await import('googleapis');
  const clientEmail = process.env.GOOGLE_SA_EMAIL;
  const privateKey = (process.env.GOOGLE_SA_KEY || '').replace(/\\n/g, '\n');
  const spreadsheetId = process.env.SHEETS_STANDINGS_SPREADSHEET_ID;
  const div1 = process.env.SHEETS_STANDINGS_DIV1_SHEET;
  const div2 = process.env.SHEETS_STANDINGS_DIV2_SHEET;

  // Clear error if any env is missing
  const missing: string[] = [];
  if (!clientEmail) missing.push('GOOGLE_SA_EMAIL');
  if (!privateKey) missing.push('GOOGLE_SA_KEY');
  if (!spreadsheetId) missing.push('SHEETS_STANDINGS_SPREADSHEET_ID');
  if (!div1) missing.push('SHEETS_STANDINGS_DIV1_SHEET');
  if (!div2) missing.push('SHEETS_STANDINGS_DIV2_SHEET');

  if (missing.length) {
    throw new Error(`Missing env: ${missing.join(', ')}`);
  }

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });

  const sheets = google.sheets({ version: 'v4', auth: jwt });
  return { sheets, spreadsheetId, div1, div2 };
}

type TeamRow = {
  team: string;
  gp: number; w: number; l: number; t: number;
  pts: number; gf: number; ga: number; diff: number;
};

function parseRows(values: any[][] | null | undefined): TeamRow[] {
  if (!values || values.length < 2) return [];
  return values.slice(1).map((r = []) => {
    const [team, gp, w, l, t, pts, gf, ga, diff] = r;
    const n = (x: any) => (x === '' || x == null ? 0 : Number(x));
    const gfN = n(gf), gaN = n(ga);
    return {
      team: String(team ?? ''),
      gp: n(gp), w: n(w), l: n(l), t: n(t),
      pts: n(pts), gf: gfN, ga: gaN,
      diff: (diff === '' || diff == null) ? (gfN - gaN) : n(diff),
    };
  });
}

export async function GET() {
  try {
    const { sheets, spreadsheetId, div1, div2 } = await getSheets();

    const ranges = [`${div1}!A1:I200`, `${div2}!A1:I200`];

    const resp = await sheets.spreadsheets.values.batchGet({
      spreadsheetId,
      ranges,
      valueRenderOption: 'UNFORMATTED_VALUE',
    });

    const [v1, v2] = resp.data.valueRanges || [];
    const elford = parseRows(v1?.values);
    const stevenard = parseRows(v2?.values);

    return NextResponse.json({ elford, stevenard }, { status: 200 });
  } catch (err: any) {
    // Log server-side and return a useful error to the client
    console.error('GET /api/standings error:', err?.message || err);
    return NextResponse.json(
      { error: 'standings_failed', message: String(err?.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
