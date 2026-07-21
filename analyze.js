// api/analyze.js — Proxy serverless Vercel pour l'Analyse IA Stellar Academy
// La cle API est lue depuis la variable d'environnement ANTHROPIC_API_KEY (Vercel > Settings > Environment Variables)
// Elle n'est jamais exposee au navigateur ni dans le code.

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: { type: 'method_not_allowed', message: 'POST uniquement' } });
    return;
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: { type: 'missing_key', message: 'Variable ANTHROPIC_API_KEY absente sur Vercel' } });
    return;
  }

  try {
    const body = req.body && typeof req.body === 'object' ? req.body : JSON.parse(req.body || '{}');

    const upstream = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: body.model || 'claude-sonnet-4-6',
        max_tokens: body.max_tokens || 8000,
        messages: body.messages || []
      })
    });

    const data = await upstream.json();
    res.status(upstream.status).json(data);
  } catch (e) {
    res.status(500).json({ error: { type: 'proxy_error', message: e.message || 'Erreur proxy' } });
  }
};
