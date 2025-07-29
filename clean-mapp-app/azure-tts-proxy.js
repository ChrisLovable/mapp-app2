import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = 4000;

// Enable CORS for common Vite dev ports
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://localhost:5181',
    'http://localhost:5182',
    'http://localhost:5183',
    'http://localhost:5184',
    'http://localhost:5185'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Add error handling middleware for JSON parsing errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next();
});

app.get('/api/azure-voices', async (req, res) => {
  // Use environment variable instead of hardcoded key
  const key = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION || 'eastus';
  
  if (!key) {
    console.error('Azure TTS key not found in environment variables');
    return res.status(500).json({ error: 'Azure TTS configuration missing' });
  }
  
  // Correct Azure TTS endpoint format for voices/list
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/voices/list`;

  // Debug logging (remove key logging for security)
  console.log('Azure TTS Region:', region);
  console.log('Azure TTS Endpoint:', endpoint);

  try {
    const azureRes = await fetch(endpoint, {
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/json',
      },
    });
    console.log('Azure response status:', azureRes.status, azureRes.statusText);
    if (!azureRes.ok) {
      const text = await azureRes.text();
      console.error('Azure API error:', azureRes.status, azureRes.statusText, text);
      return res.status(azureRes.status).json({ error: 'Azure API error', status: azureRes.status, statusText: azureRes.statusText, details: text });
    }
    const data = await azureRes.json();
    
    // Log available languages for debugging
    const languages = [...new Set(data.map(voice => voice.Locale))].sort();
    console.log('Available languages:', languages);
    console.log('Total voices available:', data.length);
    
    res.json(data);
  } catch (err) {
    console.error('Azure proxy error:', err);
    res.status(500).json({ error: 'Failed to fetch voices', details: err.message || err });
  }
});

// Azure TTS endpoint for text-to-speech
app.post('/api/azure-tts', async (req, res) => {
  const { text, language } = req.body;
  
  if (!text || !language) {
    return res.status(400).json({ error: 'Text and language are required' });
  }

  // Use environment variable instead of hardcoded key
  const key = process.env.AZURE_TTS_KEY;
  const region = process.env.AZURE_TTS_REGION || 'eastus';
  
  if (!key) {
    console.error('Azure TTS key not found in environment variables');
    return res.status(500).json({ error: 'Azure TTS configuration missing' });
  }
  
  const endpoint = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;

  try {
    // First, get available voices for the language
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
    const voice = voices.find((v) => v.Locale === language);
    
    if (!voice) {
      throw new Error(`No voice found for language: ${language}`);
    }

    // Generate speech using Azure TTS
    const ttsResponse = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': key,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-16khz-128kbitrate-mono-mp3',
      },
      body: `<speak version='1.0' xml:lang='${language}'><voice xml:lang='${language}' xml:gender='Female' name='${voice.ShortName}'>${text}</voice></speak>`
    });

    if (!ttsResponse.ok) {
      const errorText = await ttsResponse.text();
      console.error('Azure TTS error:', ttsResponse.status, errorText);
      throw new Error('Failed to generate speech');
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    res.set('Content-Type', 'audio/mpeg');
    res.send(Buffer.from(audioBuffer));
  } catch (err) {
    console.error('Azure TTS proxy error:', err);
    res.status(500).json({ error: 'Failed to generate speech', details: err.message });
  }
});



app.listen(PORT, () => {
  console.log(`Azure TTS proxy running on http://localhost:${PORT}`);
}); 