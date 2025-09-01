export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const response = await fetch('https://api.veryfi.com/api/v8/partner/documents', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Client-Id': 'vrfNVLAahBk1YnNna8BtubLRTUBjzVJJVhTTvIL',
        'Authorization': 'apikey chrisdevries.personal:b21db4e417060b1ff31d3d2c369d8ad6',
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(500).json({ error: 'Proxy failed' });
  }
}
