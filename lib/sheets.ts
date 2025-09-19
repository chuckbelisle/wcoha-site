// lib/sheets.ts
import { google } from 'googleapis';

export function getSheetsClient() {
  const clientEmail = process.env.GOOGLE_SA_EMAIL!;
  const privateKey = (process.env.GOOGLE_SA_KEY || '').replace(/\\n/g, '\n');

  const jwt = new google.auth.JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });

  const sheets = google.sheets({ version: 'v4', auth: jwt });
  return sheets;
}