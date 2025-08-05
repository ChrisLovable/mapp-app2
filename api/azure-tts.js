const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

export default async function handler(req, res) {
  // Your existing Express route logic here, adapted for serverless
  if (req.method === 'POST') {
    const { text, language, voice } = req.body;
  
    if (!text || !language) {
      return res.status(400).json({ error: 'Text and language are required' });
    }

    const key = process.env.AZURE_TTS_KEY;
    const region = process.env.AZURE_TTS_REGION || 'eastus';

    console.log(`[POST /api/azure-tts] Region: ${region}. Key is present: ${!!key}. Key length: ${key ? key.length : 0}.`);
  
    if (!key) {
      console.error('Azure TTS key not found in environment variables');
      return res.status(500).json({ error: 'Azure TTS configuration missing' });
    }
  
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

    try {
      const voicesResponse = await fetch(`https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`, {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/json',
        },
      });

      if (!voicesResponse.ok) {
        throw new Error('Failed to fetch voices');
      }

      const voices = await voicesResponse.json();
      
      let selectedVoice;
      if (voice) {
        selectedVoice = voices.find((v) => v.ShortName === voice);
      } else {
        if (language === 'en-US') {
          selectedVoice = voices.find((v) => v.ShortName === 'en-US-PhoebeNeural') ||
                        voices.find((v) => v.ShortName === 'en-US-JennyNeural') ||
                        voices.find((v) => v.ShortName === 'en-US-AriaNeural') ||
                        voices.find((v) => v.Locale === 'en-US' && v.Gender === 'Female');
        } else if (language === 'af-ZA') {
          selectedVoice = voices.find((v) => v.ShortName === 'af-ZA-AdriNeural');
          if (!selectedVoice) {
            selectedVoice = voices.find((v) => v.Locale === 'af-ZA' && v.Gender === 'Female');
          }
        } else {
          selectedVoice = voices.find((v) => v.Locale === language);
        }
      }
      
      if (!selectedVoice) {
        console.error(`Available voices for ${language}:`, voices.filter(v => v.Locale === language).map(v => v.ShortName));
        throw new Error(`No voice found for language: ${language}`);
      }

      console.log(`Using voice: ${selectedVoice.ShortName} for language: ${language}`);

      const ttsResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/ssml+xml',
          'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
        },
        body: `<speak version='1.0' xml:lang='${language}'><voice xml:lang='${language}' xml:gender='Female' name='${selectedVoice.ShortName}'>${text}</voice></speak>`
      });

      if (!ttsResponse.ok) {
        const errorText = await ttsResponse.text();
        console.error('Azure TTS error:', ttsResponse.status, errorText);
        throw new Error('Failed to generate speech');
      }

      const audioBuffer = await ttsResponse.arrayBuffer();
      res.setHeader('Content-Type', 'audio/mpeg');
      res.send(Buffer.from(audioBuffer));
    } catch (err) {
      console.error('Azure TTS proxy error:', err);
      res.status(500).json({ error: 'Failed to generate speech', details: err.message });
    }
  } else if (req.method === 'GET') {
    // Logic for GET request to /api/azure-voices
    const key = process.env.AZURE_TTS_KEY;
    const region = process.env.AZURE_TTS_REGION || 'eastus';
    
    console.log(`[GET /api/azure-tts] Region: ${region}. Key is present: ${!!key}. Key length: ${key ? key.length : 0}.`);

    if (!key) {
      console.error('Azure TTS key not found in environment variables');
      return res.status(500).json({ error: 'Azure TTS configuration missing' });
    }
    
    const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

    try {
      const azureRes = await fetch(endpoint, {
        headers: {
          'Ocp-Apim-Subscription-Key': key,
          'Content-Type': 'application/json',
        },
      });

      if (!azureRes.ok) {
        const text = await azureRes.text();
        return res.status(azureRes.status).json({ error: 'Azure API error', details: text });
      }

      const data = await azureRes.json();
      res.status(200).json(data);
    } catch (err) {
      console.error('Azure proxy error:', err);
      res.status(500).json({ error: 'Failed to fetch voices', details: err.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
 