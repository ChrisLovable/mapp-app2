const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const fetch = require('node-fetch');
const { createClient } = require('@supabase/supabase-js');
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
const AZURE_TTS_KEY = process.env.AZURE_TTS_KEY;
const AZURE_TTS_REGION = process.env.AZURE_TTS_REGION;
const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Make OpenAI API key required
if (!OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is required. Please set it in your .env file.');
  process.exit(1);
}

// Check other API keys
if (!AZURE_TTS_KEY || !AZURE_TTS_REGION) {
  console.log('⚠️  Azure TTS not configured - text-to-speech will be limited');
}

if (!SERPAPI_KEY) {
  console.log('⚠️  SERPAPI_KEY not set - real-time search will be limited');
}

// API status for health check
const apiStatus = {
  openai: !!OPENAI_API_KEY,
  azureTTS: !!(AZURE_TTS_KEY && AZURE_TTS_REGION),
  serpapi: !!SERPAPI_KEY,
  imageGeneration: !!OPENAI_API_KEY,
};

// ===== SUPABASE SETUP =====
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

let supabase = null;
if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
  console.log('✅ Supabase connected successfully');
} else {
  console.log('⚠️  Supabase credentials not found - using mock data');
}

// ===== HEALTH CHECK =====
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    services: apiStatus,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ===== SEARCH API =====
app.get('/api/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter is required' });
  }

  if (!SERPAPI_KEY) {
    return res.status(500).json({ error: 'Search API not configured' });
  }

  try {
    console.log('🔍 Search request:', q);
    
    const response = await fetch(`https://serpapi.com/search?q=${encodeURIComponent(q)}&num=10&start=0&gl=us&hl=en&device=desktop&nfpr=0`, {
      headers: {
        'X-RapidAPI-Key': SERPAPI_KEY,
        'X-RapidAPI-Host': 'serpapi.com'
      }
    });

    if (!response.ok) {
      throw new Error(`SERPAPI error: ${response.status}`);
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
app.post('/api/openai/images/generations', async (req, res) => {
  console.log('🎨 Image generation request received');
  console.log('Request body:', JSON.stringify(req.body, null, 2));
  
  const { prompt, size = '1024x1024', quality = 'standard', style = 'vivid', reference_image } = req.body;
  
  if (!prompt) {
    console.log('❌ No prompt provided');
    return res.status(400).json({ error: 'Prompt is required' });
  }

  if (!OPENAI_API_KEY) {
    console.log('⚠️  OPENAI_API_KEY not set - returning demo mode for image generation');
    const mockResponse = {
      data: [{
        url: 'https://via.placeholder.com/1024x1024/cccccc/666666?text=Demo+Image'
      }],
      usage: {
        prompt_tokens: 10,
        completion_tokens: 0,
        total_tokens: 10
      }
    };
    return res.json(mockResponse);
  }

  try {
    console.log('🎨 Starting OpenAI DALL-E generation with prompt:', prompt);
    console.log('OpenAI API Key present:', !!OPENAI_API_KEY);
    
    // Prepare the request for OpenAI DALL-E
    let enhancedPrompt = prompt;
    
    // If reference image is provided, enhance the prompt
    if (reference_image) {
      enhancedPrompt = `Based on the reference image style and composition: ${prompt}`;
    }
    
    const requestBody = {
      model: 'dall-e-3',
      prompt: enhancedPrompt,
      n: 1,
      size: size,
      quality: quality,
      style: style
    };

    console.log('🔍 Debug - OpenAI request:', {
      prompt: enhancedPrompt,
      hasImage: !!reference_image,
      size: size,
      quality: quality,
      style: style
    });
    
    console.log('📡 Making request to OpenAI API...');
    
    // Call OpenAI DALL-E API
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    console.log('📡 OpenAI API response status:', response.status);
    console.log('📡 OpenAI API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const errorMessage = errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`;
      
      console.error('OpenAI API error:', errorMessage);
      console.error('Error data:', JSON.stringify(errorData, null, 2));
      
      // If it's a payment/credit error, return demo mode instead
      if (response.status === 402) {
        console.log('Payment required, switching to demo mode');
        const mockResponse = {
          data: [{
            url: 'https://via.placeholder.com/1024x1024/cccccc/666666?text=Demo+Image'
          }],
          usage: {
            prompt_tokens: 10,
            completion_tokens: 0,
            total_tokens: 10
          }
        };
        return res.json(mockResponse);
      }
      
      return res.status(response.status).json({ 
        error: 'OpenAI API error', 
        status: response.status, 
        statusText: response.statusText, 
        details: errorMessage 
      });
    }

    const data = await response.json();
    console.log('✅ OpenAI DALL-E generation successful:', data.data[0].url);
    
    res.json(data);
  } catch (err) {
    console.error('❌ OpenAI proxy error:', err);
    console.error('Error stack:', err.stack);
    res.status(500).json({ 
      error: 'Failed to generate image', 
      details: err.message || err,
      stack: err.stack 
    });
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

// ===== TOKEN TRACKING API WITH SUPABASE =====

// Today's session tracking - in-memory storage for this testing session
let todaysSession = {
  tokensAllocated: 100000,
  tokensUsed: 148,
  totalRequests: 4,
  totalCostUsd: 0.0114,
  usageHistory: [
    {
      id: 1,
      api: 'openai_gpt',
      endpoint: '/api/openai/chat',
      tokens: 45,
      cost: 0.0034,
      response_status: '200',
      response_time: 2340,
      time: new Date(Date.now() - 5 * 60000).toISOString(),
      status: 'success'
    },
    {
      id: 2,
      api: 'image_generation',
      endpoint: '/api/replicate/predictions',
      tokens: 23,
      cost: 0.0021,
      response_status: '200',
      response_time: 4567,
      time: new Date(Date.now() - 15 * 60000).toISOString(),
      status: 'success'
    },
    {
      id: 3,
      api: 'text_to_speech',
      endpoint: '/api/azure/tts',
      tokens: 12,
      cost: 0.0008,
      response_status: '200',
      response_time: 1234,
      time: new Date(Date.now() - 30 * 60000).toISOString(),
      status: 'success'
    },
    {
      id: 4,
      api: 'openai_gpt',
      endpoint: '/api/openai/chat',
      tokens: 67,
      cost: 0.0051,
      response_status: '500',
      response_time: 890,
      time: new Date(Date.now() - 45 * 60000).toISOString(),
      status: 'failed'
    }
  ],
  sessionStartTime: new Date().toISOString()
};

// Helper function to get current session data
const getCurrentSessionStats = () => {
  const tokensRemaining = Math.max(0, todaysSession.tokensAllocated - todaysSession.tokensUsed);
  
  // Calculate API usage breakdown
  const apiUsageMap = {};
  todaysSession.usageHistory.forEach(item => {
    if (!apiUsageMap[item.api]) {
      apiUsageMap[item.api] = { 
        name: item.api, 
        requests: 0, 
        tokensUsed: 0, 
        estimatedCost: 0, 
        successCount: 0, 
        failureCount: 0 
      };
    }
    apiUsageMap[item.api].requests++;
    apiUsageMap[item.api].tokensUsed += item.tokens || 0;
    apiUsageMap[item.api].estimatedCost += item.cost || 0;
    if (item.status === 'success') {
      apiUsageMap[item.api].successCount++;
    } else {
      apiUsageMap[item.api].failureCount++;
    }
  });

  return {
    tokensAllocated: todaysSession.tokensAllocated,
    tokensRemaining: tokensRemaining,
    tokensUsed: todaysSession.tokensUsed,
    totalRequests: todaysSession.totalRequests,
    totalCostUsd: todaysSession.totalCostUsd,
    apiUsage: Object.values(apiUsageMap),
    sessionStartTime: todaysSession.sessionStartTime
  };
};

const getFallbackStats = () => getCurrentSessionStats();
const getFallbackUsage = () => {
  return todaysSession.usageHistory.map(item => ({
    id: item.id,
    api: item.api,
    endpoint: item.endpoint,
    tokens: item.tokens,
    costUsd: item.cost,
    responseStatus: item.response_status || '200',
    responseTimeMs: item.response_time,
    timestamp: item.time,
    status: item.status
  }));
};

// Get token statistics
app.get('/api/token-stats', async (req, res) => {
  try {
    if (!supabase) {
      return res.json(getFallbackStats());
    }

    // Get usage data from Supabase
    const { data: usageData, error } = await supabase
      .from('dashboard_api_usage')
      .select('*')
      .order('time', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      return res.json(getFallbackStats());
    }

    // Calculate statistics from the data
    const totalRequests = usageData.length;
    const totalTokensUsed = usageData.reduce((sum, item) => sum + (item.tokens || 0), 0);
    const totalCost = usageData.reduce((sum, item) => sum + (item.cost || 0), 0);
    const tokensAllocated = 100000; // Today's allocation: 100,000 tokens
    const tokensRemaining = Math.max(0, tokensAllocated - totalTokensUsed);

    // Calculate API usage breakdown
    const apiUsageMap = {};
    usageData.forEach(item => {
      if (!apiUsageMap[item.api]) {
        apiUsageMap[item.api] = { 
          name: item.api, 
          requests: 0, 
          tokensUsed: 0, 
          estimatedCost: 0, 
          successCount: 0, 
          failureCount: 0 
        };
      }
      apiUsageMap[item.api].requests++;
      apiUsageMap[item.api].tokensUsed += item.tokens || 0;
      apiUsageMap[item.api].estimatedCost += item.cost || 0;
      if (item.status === 'success') {
        apiUsageMap[item.api].successCount++;
      } else {
        apiUsageMap[item.api].failureCount++;
      }
    });

    const stats = {
      tokensAllocated,
      tokensRemaining,
      tokensUsed: totalTokensUsed,
      totalRequests,
      totalCostUsd: totalCost,
      apiUsage: Object.values(apiUsageMap)
    };

    res.json(stats);
  } catch (error) {
    console.error('Error fetching token stats:', error);
    res.json(getFallbackStats());
  }
});

// Get usage history
app.get('/api/token-usage', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    
    if (!supabase) {
      return res.json(getFallbackUsage().slice(0, parseInt(limit)));
    }

    const { data, error } = await supabase
      .from('dashboard_api_usage')
      .select('*')
      .order('time', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      console.error('Supabase error:', error);
      return res.json(getFallbackUsage().slice(0, parseInt(limit)));
    }

    // Transform data to match expected format
    const formattedData = data.map(item => ({
      id: item.id,
      api: item.api,
      endpoint: `/api/${item.api}`,
      tokens: item.tokens,
      costUsd: item.cost,
      responseStatus: item.response_status || '200',
      responseTimeMs: item.response_time,
      timestamp: item.time,
      status: item.status
    }));

    res.json(formattedData);
  } catch (error) {
    console.error('Error fetching usage history:', error);
    res.json(getFallbackUsage().slice(0, parseInt(limit)));
  }
});

// Get live token data
app.get('/api/token-live', async (req, res) => {
  try {
    if (!supabase) {
      const fallback = getFallbackStats();
      return res.json({
        tokensRemaining: fallback.tokensRemaining,
        tokensUsed: fallback.tokensUsed,
        updatedAt: new Date().toISOString()
      });
    }

    // Get recent usage to calculate live data
    const { data, error } = await supabase
      .from('dashboard_api_usage')
      .select('tokens')
      .order('time', { ascending: false });

    if (error) {
      console.error('Supabase error:', error);
      const fallback = getFallbackStats();
      return res.json({
        tokensRemaining: fallback.tokensRemaining,
        tokensUsed: fallback.tokensUsed,
        updatedAt: new Date().toISOString()
      });
    }

    const totalTokensUsed = data.reduce((sum, item) => sum + (item.tokens || 0), 0);
    const tokensAllocated = 100000;
    const tokensRemaining = Math.max(0, tokensAllocated - totalTokensUsed);

    res.json({
      tokensRemaining,
      tokensUsed: totalTokensUsed,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching live token data:', error);
    const fallback = getFallbackStats();
    res.json({
      tokensRemaining: fallback.tokensRemaining,
      tokensUsed: fallback.tokensUsed,
      updatedAt: new Date().toISOString()
    });
  }
});

// Reset tokens
app.post('/api/reset-tokens', async (req, res) => {
  try {
    const { tokensAllocated = 100000 } = req.body;
    
    // Always reset today's session
    todaysSession = {
      tokensAllocated: parseInt(tokensAllocated),
      tokensUsed: 0,
      totalRequests: 0,
      totalCostUsd: 0.0000,
      usageHistory: [],
      sessionStartTime: new Date().toISOString()
    };
    
    if (!supabase) {
      return res.json({ 
        success: true, 
        message: `🔄 Session reset! New allocation: ${tokensAllocated.toLocaleString()} tokens` 
      });
    }

    // Clear all usage data from Supabase
    const { error } = await supabase
      .from('dashboard_api_usage')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

    if (error) {
      console.error('Error resetting tokens:', error);
      return res.status(500).json({ success: false, message: 'Failed to reset tokens' });
    }

    res.json({ success: true, message: 'Tokens reset successfully' });
  } catch (error) {
    console.error('Error resetting tokens:', error);
    res.status(500).json({ success: false, message: 'Failed to reset tokens' });
  }
});

// Log API usage
app.post('/api/log-usage', async (req, res) => {
  try {
    const { apiName, endpoint, tokensUsed, requestData, responseStatus, responseTimeMs, status, errorMessage } = req.body;
    
    // Always log to today's session for real-time tracking
    const newEntry = {
      id: todaysSession.usageHistory.length + 1,
      api: apiName,
      endpoint,
      tokens: tokensUsed,
      cost: tokensUsed * 0.0001, // Cost calculation
      response_status: responseStatus?.toString() || '200',
      response_time: responseTimeMs,
      status: status,
      error_message: errorMessage,
      time: new Date().toISOString(),
      user_id: '11111111-1111-1111-1111-111111111111'
    };
    
    // Add to session tracking
    todaysSession.usageHistory.unshift(newEntry);
    todaysSession.tokensUsed += tokensUsed;
    todaysSession.totalRequests += 1;
    todaysSession.totalCostUsd += newEntry.cost;
    
    if (!supabase) {
      return res.json({ 
        success: true, 
        message: `✅ Usage logged! Tokens used: ${tokensUsed}, Total used today: ${todaysSession.tokensUsed}/100,000`,
        data: newEntry 
      });
    }

    // Insert new usage record into Supabase
    const { data, error } = await supabase
      .from('dashboard_api_usage')
      .insert([
        {
          api: apiName,
          tokens: tokensUsed,
          cost: tokensUsed * 0.0001, // Mock cost calculation
          status: status,
          response_time: responseTimeMs,
          user_id: '11111111-1111-1111-1111-111111111111', // Default user for testing
          time: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error logging usage:', error);
      return res.status(500).json({ success: false, message: 'Failed to log usage' });
    }

    res.json({ success: true, message: 'Usage logged successfully', data });
  } catch (error) {
    console.error('Error logging usage:', error);
    res.status(500).json({ success: false, message: 'Failed to log usage' });
  }
});

// Export usage data
app.get('/api/export-usage', async (req, res) => {
  try {
    const { format = 'csv', days = 30 } = req.query;
    
    let usageData = [];
    
    if (supabase) {
      const { data, error } = await supabase
        .from('dashboard_api_usage')
        .select('*')
        .order('time', { ascending: false });
      
      if (error) {
        console.error('Error fetching usage data for export:', error);
        usageData = getFallbackUsage();
      } else {
        usageData = data;
      }
    } else {
      usageData = getFallbackUsage();
    }
    
    if (format === 'csv') {
      const csvContent = 'Time,API,Tokens,Cost,Status,Response Time\n' +
        usageData.map(entry => 
          `${new Date(entry.time || entry.timestamp).toLocaleString()},${entry.api},${entry.tokens},$${(entry.cost || entry.costUsd || 0).toFixed(4)},${entry.status},${entry.response_time || entry.responseTimeMs}ms`
        ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=usage-export-${new Date().toISOString().split('T')[0]}.csv`);
      res.send(csvContent);
    } else {
      res.json(usageData);
    }
  } catch (error) {
    console.error('Error exporting usage data:', error);
    res.status(500).json({ success: false, message: 'Failed to export usage data' });
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
  console.log(`   - Search: ${!!SERPAPI_KEY ? '✅' : '❌'}`);
  console.log(`   - Calendar: ${!!OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - Image Generation: ${!!OPENAI_API_KEY ? '✅' : '❌'}`);
  console.log(`   - TTS: ${!!AZURE_TTS_KEY ? '✅' : '❌'}`);
}); 