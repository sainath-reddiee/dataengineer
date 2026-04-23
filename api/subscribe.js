export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email } = req.body || {};

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ error: 'Valid email is required' });
  }

  const apiKey = process.env.BUTTONDOWN_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Newsletter service is not configured' });
  }

  try {
    const response = await fetch('https://api.buttondown.email/v1/subscribers', {
      method: 'POST',
      headers: {
        Authorization: `Token ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, type: 'regular' }),
    });

    if (response.ok) {
      return res.status(200).json({ success: true });
    }

    const data = await response.json().catch(() => ({}));

    if (response.status === 409 || (data.detail && data.detail.includes('already'))) {
      return res.status(200).json({ success: true, message: 'Already subscribed' });
    }

    return res.status(response.status).json({
      error: data.detail || data.message || 'Subscription failed',
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to connect to newsletter service' });
  }
}
