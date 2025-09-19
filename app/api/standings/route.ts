// app/api/standings/route.ts
import { NextResponse } from 'next/server';
import { getSheetsClient } from '@/lib/sheets';

type TeamRow = {
  team: string;
  gp: number; w: number; l: number; t: number;
  pts: number; gf: number; ga: number; diff: number;
};

function parseRows(values: any[][] | null | undefined): TeamRow[] {
  if (!values || values.length < 2) return [];
  return values.slice(1).map((r) => {
    const [team, gp, w, l, t, pts, gf, ga, diff] = r ?? [];
    const n = (x: any) => (x === '' || x == null ? 0 : Number(x));
    return {
      team: String(team ?? ''),
      gp: n(gp), w: n(w), l: n(l), t: n(t),
      pts: n(pts), gf: n(gf), ga: n(ga),
      diff: diff === '' || diff == null ? n(gf) - n(ga) : n(diff),
    };
  });
}

export const revalidate = 300; // cache 5 min on Vercel/Azure SWA runtime

export async function GET() {
  try {
    const sheets = getSheetsClient();
    const spreadsheetId = process.env.SHEETS_STANDINGS_SPREADSHEET_ID!;
    const div1 = process.env.SHEETS_STANDINGS_DIV1_SHEET!;
    const div2 = process.env.SHEETS_STANDINGS_DIV2_SHEET!;

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
    console.error('standings error', err?.message || err);
    return NextResponse.json({ error: 'Failed to load standings' }, { status: 500 });
  }
}
