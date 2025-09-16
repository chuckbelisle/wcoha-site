// Node 18+ runtime (fetch available)
// Action order: 1) send email (SendGrid)  2) append row to Google Sheet (Apps Script)

export default async function (context, req) {
  const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const {
    name = '', email = '', message = '',
    phone = '', age = '', currentLevel = '', position = '',
    goalie = false, spareOnly = false, notes = '', company = '' // honeypot
  } = data;

  try {
    // Honeypot + basic validation
    if (company) return { status: 204 }; // silent drop for bots
    if (!name.trim() || !email.trim() || !message.trim()) {
      return { status: 400, jsonBody: { error: 'Missing name, email, or message' } };
    }

    // 1) Send email via SendGrid
    const sgKey = process.env.SENDGRID_API_KEY;
    const to = process.env.CONTACT_TO;
    const from = process.env.CONTACT_FROM || 'no-reply@wcoha.ca';

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
      (notes || '').trim(),
      '',
      '--- Raw message ---',
      message
    ].join('\n');

    const emailRes = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: { Authorization: `Bearer ${sgKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{ to: [{ email: to }] }],
        from: { email: from },
        subject: `WCOHA Contact / Join: ${name}`,
        content: [{ type: 'text/plain', value: composed }]
      })
    });

    if (!emailRes.ok) {
      const detail = await emailRes.text().catch(() => '');
      context.log('SendGrid error:', detail);
      return { status: 502, jsonBody: { error: 'Email send failed' } };
    }

    // 2) Append a row to Google Sheet via Apps Script Web App
    // Keep your existing Apps Script but call it from the server side now.
    const sheetEndpoint = process.env.SHEET_ENDPOINT; // e.g. https://script.google.com/macros/s/XXX/exec
    if (sheetEndpoint) {
      // Send a clean JSON row; adjust keys to match your Apps Script handler
      const rowPayload = {
        submittedAt: new Date().toISOString(),
        name, email, phone, age, currentLevel, position,
        goalie, spareOnly, notes, message
      };

      const sheetRes = await fetch(sheetEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(rowPayload)
      });

      if (!sheetRes.ok) {
        const txt = await sheetRes.text().catch(() => '');
        // Don’t fail the user-facing request if Sheets append hiccups—log it and continue.
        context.log('Sheets append failed:', txt);
      }
    }

    return { status: 200, jsonBody: { ok: true } };
  } catch (err) {
    context.log('Contact function error:', err);
    return { status: 500, jsonBody: { error: 'Server error' } };
  }
}
