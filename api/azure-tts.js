const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export default async function handler(req, res) {
  const ELEVEN_API_KEY = process.env.ELEVENLABS_API_KEY;
  const ELEVEN_VOICE_ID_EN = process.env.ELEVENLABS_VOICE_ID_EN || 'kPzsL2i3teMYv0FxEYQ6'; // Brittney
  const ELEVEN_VOICE_ID_AF = process.env.ELEVENLABS_VOICE_ID_AF || 'R9JI6TuZ3IXlpRNVaYix'; // Chris
  const ELEVEN_MODEL = process.env.ELEVENLABS_MODEL || 'eleven_turbo_v2_5';

  if (req.method === 'POST') {
    try {
      const { text, language } = req.body || {};
      if (!text || typeof text !== 'string' || !text.trim()) {
        return res.status(400).json({ error: 'Text is required' });
      }
      if (!ELEVEN_API_KEY) {
        return res.status(500).json({ error: 'ELEVENLABS_API_KEY not configured' });
      }

      const isAfrikaans = String(language || '').toLowerCase().startsWith('af');
      const voiceId = isAfrikaans ? ELEVEN_VOICE_ID_AF : ELEVEN_VOICE_ID_EN;

      const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}?optimize_streaming_latency=2`;
      const ttsResp = await fetch(url, {
        method: 'POST',
        headers: {
          'xi-api-key': ELEVEN_API_KEY,
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: text.trim(),
          model_id: ELEVEN_MODEL,
          voice_settings: { stability: 0.5, similarity_boost: 0.7 }
        })
      });

      if (!ttsResp.ok) {
        const detail = await ttsResp.text().catch(() => '');
        return res.status(ttsResp.status).json({ error: 'ElevenLabs TTS failed', details: detail });
      }

      const buf = Buffer.from(await ttsResp.arrayBuffer());
      res.setHeader('Content-Type', 'audio/mpeg');
      res.setHeader('Cache-Control', 'no-store');
      return res.send(buf);
    } catch (err) {
      console.error('ElevenLabs TTS error:', err);
      return res.status(500).json({ error: 'TTS failed', details: err?.message || String(err) });
    }
  } else if (req.method === 'GET') {
    // Simple health/status endpoint
    return res.status(200).json({ elevenlabs: !!ELEVEN_API_KEY, model: ELEVEN_MODEL });
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
 