const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ===== MIDDLEWARE =====
app.use(helmet()); // Security headers
app.use(compression()); // Gzip compression
app.use(morgan('combined')); // Logging
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ===== API KEYS =====
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
const AZURE_TTS_KEY = process.env.AZURE_TTS_KEY;

// Make REPLICATE_API_KEY optional for development
if (!REPLICATE_API_KEY) {
  console.log('⚠️  REPLICATE_API_KEY not set - image generation will be limited');
}

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: {
      search: !!RAPIDAPI_KEY,
      calendar: !!OPENAI_API_KEY,
      imageGeneration: !!REPLICATE_API_KEY,
      tts: !!AZURE_TTS_KEY
    },
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== SEARCH API =====
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  if (!RAPIDAPI_KEY) {
    return res.status(500).json({ error: 'Search API not configured' });
  }

  try {
    console.log('🔍 Search request:', q);
    
    const response = await fetch(`https://real-time-web-search.p.rapidapi.com/search?q=${encodeURIComponent(q)}&num=10&start=0&gl=us&hl=en&device=desktop&nfpr=0`, {
      headers: {
        'X-RapidAPI-Key': RAPIDAPI_KEY,
        'X-RapidAPI-Host': 'real-time-web-search.p.rapidapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.status}`);
    }

    const data = await response.json();
    console.log('✅ Search successful:', data.data?.length || 0, 'results');
    res.json(data);
  } catch (error) {
    console.error('❌ Search error:', error.message);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// ===== CALENDAR PARSING =====
function mapEventType(eventType) {
  const eventTypeMap = {
    'in-person-meeting': 'meeting',
    'conference-call': 'meeting',
    'appointment': 'personal',
    'reminder': 'reminder',
    'task': 'task',
    'personal': 'personal',
    'work': 'work',
    'health': 'health',
    'social': 'social'
  };
  return eventTypeMap[eventType] || 'meeting';
}

app.post('/api/parse-calendar-text', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OpenAI API not configured' });
  }

  try {
    console.log('📝 Parsing calendar text:', text);

    const prompt = `Parse the following text into calendar event fields. Return ONLY a JSON object with these exact fields:

{
  "title": "extracted title or blank if cannot determine",
  "date": "YYYY-MM-DD format date (intelligently calculate relative dates)", 
  "time": "HH:MM format time (24-hour format, e.g., 14:30 for 2:30 PM)",
  "duration": number in minutes (default to 60 if not specified),
  "location": "extracted location or blank if cannot determine",
  "attendees": "extracted attendees or blank if cannot determine",
  "description": "remaining text as description or blank if cannot determine",
  "eventType": "in-person-meeting|conference-call|appointment|reminder",
  "allDay": boolean
}

Text to parse: "${text}"

Rules for intelligent date parsing:
- "tomorrow" = tomorrow's date
- "next [day]" = next occurrence of that day (e.g., "next Tuesday" = next Tuesday)
- "this [day]" = this week's occurrence of that day
- "on [day]" = this week's occurrence of that day
- "in X days" = current date + X days
- "in X weeks" = current date + (X * 7) days
- "in X months" = current date + X months
- "next week" = next Monday
- "this weekend" = next Saturday
- "next month" = same day next month
- "in a month's time" = current date + 1 month
- "in 2 weeks" = current date + 14 days
- "next Friday" = next Friday
- "this Friday" = this week's Friday (if today is before Friday, otherwise next Friday)
- If no date is found, use today's date

Rules for time parsing:
- Convert all times to 24-hour format (2:30 PM = 14:30, 10:00 AM = 10:00)
- "morning" = 9:00 AM, "afternoon" = 2:00 PM, "evening" = 6:00 PM
- "noon" = 12:00, "midnight" = 00:00
- If no time is found, use current time

Other rules:
- If no duration is specified, use 60 minutes
- Extract the most likely title from the text
- Parse any location information (room, building, address, zoom links, etc.)
- Extract attendee names or email addresses
- Determine event type based on keywords
- Set allDay to true only if explicitly mentioned as "all day" or similar
- Return valid JSON only, no other text`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a calendar event parser. Extract structured data from natural language text and return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('🤖 OpenAI response:', content);

    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Enhanced intelligent date calculation FIRST
    const textLower = text.toLowerCase();
    const today = new Date();
    let calculatedDate = null;
    
    // Handle various relative date patterns
    if (textLower.includes('tomorrow')) {
      const tomorrow = new Date(today);
      tomorrow.setDate(today.getDate() + 1);
      calculatedDate = tomorrow.toISOString().split('T')[0];
    } else if (textLower.includes('next week')) {
      const nextMonday = new Date(today);
      const daysUntilMonday = (8 - today.getDay()) % 7;
      nextMonday.setDate(today.getDate() + daysUntilMonday);
      calculatedDate = nextMonday.toISOString().split('T')[0];
    } else if (textLower.includes('this weekend')) {
      const nextSaturday = new Date(today);
      const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
      nextSaturday.setDate(today.getDate() + daysUntilSaturday);
      calculatedDate = nextSaturday.toISOString().split('T')[0];
    } else if (textLower.includes('next month')) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      calculatedDate = nextMonth.toISOString().split('T')[0];
    } else if (textLower.includes("in a month's time") || textLower.includes('in a month')) {
      const nextMonth = new Date(today);
      nextMonth.setMonth(today.getMonth() + 1);
      calculatedDate = nextMonth.toISOString().split('T')[0];
    } else if (textLower.includes('in 2 weeks')) {
      const twoWeeksLater = new Date(today);
      twoWeeksLater.setDate(today.getDate() + 14);
      calculatedDate = twoWeeksLater.toISOString().split('T')[0];
    } else if (textLower.includes('in 3 weeks')) {
      const threeWeeksLater = new Date(today);
      threeWeeksLater.setDate(today.getDate() + 21);
      calculatedDate = threeWeeksLater.toISOString().split('T')[0];
    } else if (textLower.includes('next')) {
      // Handle "next [day]" patterns
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < daysOfWeek.length; i++) {
        if (textLower.includes(`next ${daysOfWeek[i]}`)) {
          const currentDay = today.getDay();
          const targetDay = i;
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd <= 0) daysToAdd += 7; // Next week
          const nextDate = new Date(today);
          nextDate.setDate(today.getDate() + daysToAdd);
          calculatedDate = nextDate.toISOString().split('T')[0];
          break;
        }
      }
    } else if (textLower.includes('this') || textLower.includes('on')) {
      // Handle "this [day]" and "on [day]" patterns
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      for (let i = 0; i < daysOfWeek.length; i++) {
        if (textLower.includes(`this ${daysOfWeek[i]}`) || textLower.includes(`on ${daysOfWeek[i]}`)) {
          const currentDay = today.getDay();
          const targetDay = i;
          let daysToAdd = targetDay - currentDay;
          if (daysToAdd < 0) daysToAdd += 7; // This week
          const thisWeekDate = new Date(today);
          thisWeekDate.setDate(today.getDate() + daysToAdd);
          calculatedDate = thisWeekDate.toISOString().split('T')[0];
          break;
        }
      }
    } else if (textLower.includes('in') && textLower.includes('days')) {
      // Handle "in X days" patterns
      const daysMatch = textLower.match(/in (\d+) days?/);
      if (daysMatch) {
        const daysToAdd = parseInt(daysMatch[1]);
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + daysToAdd);
        calculatedDate = futureDate.toISOString().split('T')[0];
      }
    } else if (textLower.includes('in') && textLower.includes('weeks')) {
      // Handle "in X weeks" patterns
      const weeksMatch = textLower.match(/in (\d+) weeks?/);
      if (weeksMatch) {
        const weeksToAdd = parseInt(weeksMatch[1]);
        const futureDate = new Date(today);
        futureDate.setDate(today.getDate() + (weeksToAdd * 7));
        calculatedDate = futureDate.toISOString().split('T')[0];
      }
    } else if (textLower.includes('in') && textLower.includes('months')) {
      // Handle "in X months" patterns
      const monthsMatch = textLower.match(/in (\d+) months?/);
      if (monthsMatch) {
        const monthsToAdd = parseInt(monthsMatch[1]);
        const futureDate = new Date(today);
        futureDate.setMonth(today.getMonth() + monthsToAdd);
        calculatedDate = futureDate.toISOString().split('T')[0];
      }
    }
    
    // Also handle time improvements
    let calculatedTime = null;
    if (textLower.includes('morning') && !parsedData.time) {
      calculatedTime = '09:00';
    } else if (textLower.includes('afternoon') && !parsedData.time) {
      calculatedTime = '14:00';
    } else if (textLower.includes('evening') && !parsedData.time) {
      calculatedTime = '18:00';
    } else if (textLower.includes('noon') && !parsedData.time) {
      calculatedTime = '12:00';
    } else if (textLower.includes('midnight') && !parsedData.time) {
      calculatedTime = '00:00';
    }

    // Validate and clean the response
    const cleanedData = {
      title: parsedData.title || '',
      date: calculatedDate || parsedData.date || new Date().toISOString().split('T')[0],
      time: calculatedTime || parsedData.time || new Date().toTimeString().slice(0, 5),
      duration: parseInt(parsedData.duration) || 60,
      location: parsedData.location || '',
      attendees: parsedData.attendees || '',
      description: parsedData.description || '',
      eventType: mapEventType(parsedData.eventType || 'in-person-meeting'),
      allDay: Boolean(parsedData.allDay)
    };

    console.log('✅ Parsed calendar data:', cleanedData);
    res.json(cleanedData);

  } catch (error) {
    console.error('❌ Error parsing calendar text:', error);
    res.status(500).json({ 
      error: 'Failed to parse calendar text',
      details: error.message
    });
  }
});

// ===== IMAGE GENERATION =====
app.post('/api/replicate/predictions', async (req, res) => {
  const { prompt, width = 512, height = 512, negative_prompt, reference_image } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  // For ChatGPT-style approach, reference image is optional
  // We'll use text-to-image with enhanced prompts

  if (!REPLICATE_API_KEY) {
    console.log('⚠️  REPLICATE_API_KEY not set - returning demo mode for image generation');
    const mockPrediction = {
      id: `demo-${Date.now()}`,
      status: 'starting',
      output: null
    };
    return res.json(mockPrediction);
  }

  try {
    console.log('🎨 Starting Replicate prediction with prompt:', prompt);
    
    // Prepare the input object for ChatGPT-style text-to-image
    let enhancedPrompt = prompt;
    
    // If reference image is provided, enhance the prompt with style info
    if (reference_image) {
      enhancedPrompt = `Create an image based on this reference photo, but in the style described: ${prompt}`;
    }
    
    const input = {
      prompt: enhancedPrompt,
      width: width,
      height: height,
      guidance_scale: 7.5, // How closely to follow the prompt
      negative_prompt: negative_prompt || 'blurry, low quality, distorted, deformed, ugly, bad anatomy, watermark, signature, text'
    };

    console.log('🔍 Debug - Input object:', {
      prompt: enhancedPrompt,
      hasImage: !!reference_image,
      imageLength: reference_image?.length || 0,
      width: input.width,
      height: input.height,
      guidance_scale: input.guidance_scale
    });
    
    // Start the prediction
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
              body: JSON.stringify({
          version: 'a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5', // SDXL for text-to-image
          input: input
        })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', response.status, response.statusText, errorText);
      
      // If it's a payment/credit error, return demo mode instead
      if (response.status === 402) {
        console.log('Payment required, switching to demo mode');
        const mockPrediction = {
          id: `demo-${Date.now()}`,
          status: 'starting',
          output: null
        };
        return res.json(mockPrediction);
      }
      
      return res.status(response.status).json({ 
        error: 'Replicate API error', 
        status: response.status, 
        statusText: response.statusText, 
        details: errorText 
      });
    }

    const prediction = await response.json();
    console.log('Prediction started:', prediction.id);
    
    res.json(prediction);
  } catch (err) {
    console.error('Replicate proxy error:', err);
    res.status(500).json({ error: 'Failed to start prediction', details: err.message || err });
  }
});

app.get('/api/replicate/predictions/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Prediction ID is required' });
  }

  if (!REPLICATE_API_KEY) {
    console.log('⚠️  REPLICATE_API_KEY not set - returning demo mode for status check');
    // Demo mode - return mock results for demo predictions
    if (id.startsWith('demo-')) {
      console.log('Demo mode: Returning mock result');
      const mockResult = {
        id: id,
        status: 'succeeded',
        output: [
          'https://picsum.photos/512/512?random=' + Math.floor(Math.random() * 1000)
        ]
      };
      return res.json(mockResult);
    } else {
      return res.status(500).json({ error: 'Replicate API not configured' });
    }
  }

  // Demo mode - return mock results for demo predictions
  if (id.startsWith('demo-')) {
    console.log('Demo mode: Returning mock result');
    const mockResult = {
      id: id,
      status: 'succeeded',
      output: [
        'https://picsum.photos/512/512?random=' + Math.floor(Math.random() * 1000)
      ]
    };
    return res.json(mockResult);
  }

  try {
    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate status check error:', response.status, response.statusText, errorText);
      return res.status(response.status).json({ 
        error: 'Failed to check prediction status', 
        status: response.status, 
        statusText: response.statusText, 
        details: errorText 
      });
    }

    const result = await response.json();
    console.log('Prediction status:', id, result.status);
    
    res.json(result);
  } catch (err) {
    console.error('Replicate status check error:', err);
    res.status(500).json({ error: 'Failed to check prediction status', details: err.message || err });
  }
});

// ===== TEXT TO SPEECH =====
app.post('/api/azure-tts', async (req, res) => {
  const { text, voice = 'en-US-JennyNeural' } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  if (!AZURE_TTS_KEY) {
    return res.status(500).json({ error: 'Azure TTS API not configured' });
  }

  try {
    console.log('🗣️ TTS request:', text.substring(0, 50) + '...');
    
    // For demo purposes, return a mock response
    // In production, this would call Azure TTS API
    const mockResponse = {
      audioUrl: `https://picsum.photos/200/100?random=${Date.now()}`,
      duration: Math.floor(Math.random() * 10) + 5,
      text: text
    };
    
    console.log('✅ TTS response generated');
    res.json(mockResponse);
  } catch (error) {
    console.error('❌ TTS error:', error);
    res.status(500).json({ error: 'TTS failed', details: error.message });
  }
});

// ===== ERROR HANDLING =====
app.use((err, req, res, next) => {
  console.error('❌ Unhandled error:', err);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// ===== 404 HANDLER =====
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// ===== START SERVER =====
app.listen(PORT, () => {
  console.log(`🚀 Backend API Server running on http://localhost:${PORT}`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔑 Services configured:`);
  console.log(`   - Search: ${!!RAPIDAPI_KEY ? '✅' : '❌'}`);
  console.log(`   - Calendar: ${!!OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - Image Generation: ${!!REPLICATE_API_KEY ? '✅' : '❌'}`);
  console.log(`   - TTS: ${!!AZURE_TTS_KEY ? '✅' : '❌'}`);
}); 