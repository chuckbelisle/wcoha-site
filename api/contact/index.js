// Node 18+ (fetch available globally)
export default async function (context, req) {
  try {
    const data = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
    const name = (data.name || '').trim();
    const email = (data.email || '').trim();
    const message = (data.message || '').trim();
    const honeypot = (data.company || '').trim(); // hidden field on form

    // Basic validation + honeypot
    if (honeypot) return { status: 204 }; // silently drop bots
    if (!name || !email || !message) {
      return { status: 400, jsonBody: { error: 'Missing name, email, or message' } };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { status: 400, jsonBody: { error: 'Invalid email' } };
    }

    // Build email payload
    const body = {
      personalizations: [{ to: [{ email: process.env.CONTACT_TO }] }],
      from: { email: process.env.CONTACT_FROM || 'no-reply@wcoha.ca' },
      subject: `WCOHA Contact: ${name}`,
      content: [{
        type: 'text/plain',
        value: `From: ${name} <${email}>\n\n${message}`
      }]
    };

    const res = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });

    if (!res.ok) {
      const detail = await res.text();
      context.log('SendGrid error:', detail);
      return { status: 502, jsonBody: { error: 'Email send failed' } };
    }

    return { status: 200, jsonBody: { ok: true } };
  } catch (err) {
    context.log('Contact error:', err);
    return { status: 500, jsonBody: { error: 'Server error' } };
  }
}
