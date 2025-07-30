const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// 🛡️ RATE LIMITING: Prevent abuse
const gptLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 15, // max 15 requests per minute (higher than VIRL)
  message: { error: 'Rate limited - too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🧠 GPT CONFIGURATION
const GPT_CONFIG = {
  url: 'https://openrouter.ai/api/v1/chat/completions',
  apiKey: process.env.VITE_OPENROUTERAI_API_KEY,
  model: 'openai/gpt-3.5-turbo',
  timeout: 10000,
  maxTokens: 500,
  temperature: 0.7,
  retryAttempts: 2,
  retryDelays: [1000, 2000], // milliseconds
  minAnswerLength: 20
};

// 📊 METRICS TRACKING
const metrics = {
  requests: 0,
  failures: 0,
  avgLatency: 0,
  lastUpdate: Date.now(),
  failureReasons: {}
};

// 🧪 ANSWER VALIDITY CHECKING
function looksGeneric(text) {
  const genericPhrases = [
    'i don\'t know',
    'i cannot provide',
    'i am unable to',
    'i don\'t have access',
    'i cannot answer',
    'i\'m sorry, but',
    'unfortunately, i',
    'i\'m not sure',
    'i don\'t have information',
    'i cannot find',
    'no information available',
    'data not available',
    'unable to provide',
    'cannot determine',
    'information not found'
  ];
  
  const lowerText = text.toLowerCase();
  return genericPhrases.some(phrase => lowerText.includes(phrase));
}

function validateGPTResponse(response) {
  // ✅ Check if response exists
  if (!response || !response.data) {
    throw new Error('Invalid GPT response structure');
  }

  const answer = response.data.choices?.[0]?.message?.content;

  // ✅ Check answer exists and has content
  if (!answer || typeof answer !== 'string') {
    throw new Error('Missing or invalid answer content');
  }

  // ✅ Check minimum length
  if (answer.length < GPT_CONFIG.minAnswerLength) {
    throw new Error(`Answer too short: ${answer.length} chars`);
  }

  // ✅ Check for generic responses
  if (looksGeneric(answer)) {
    throw new Error('Generic/unhelpful response detected');
  }

  return answer;
}

// 🔁 GPT CALL WITH RETRY
async function callGPTWithRetry(query, attempt = 0) {
  try {
    console.log(`🤖 GPT attempt ${attempt + 1}/${GPT_CONFIG.retryAttempts + 1}`);
    
    const response = await axios.post(GPT_CONFIG.url, {
      model: GPT_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant. Answer questions directly and factually. Do not give generic responses. Provide specific, informative answers to user questions.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: GPT_CONFIG.maxTokens,
      temperature: GPT_CONFIG.temperature
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GPT_CONFIG.apiKey}`
      },
      timeout: GPT_CONFIG.timeout
    });

    const answer = validateGPTResponse(response);
    
    console.log('✅ GPT call successful:', {
      answerLength: answer.length,
      attempt: attempt + 1
    });

    return {
      answer,
      confidence: 0.8,
      source: 'gpt',
      timestamp: Date.now()
    };

  } catch (error) {
    console.error(`❌ GPT attempt ${attempt + 1} failed:`, error.message);
    
    if (attempt < GPT_CONFIG.retryAttempts) {
      const delay = GPT_CONFIG.retryDelays[attempt] || 1000;
      console.log(`⏳ Retrying GPT in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callGPTWithRetry(query, attempt + 1);
    }
    
    throw error;
  }
}

// 📦 CACHE MANAGEMENT
const responseCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

function cacheResponse(query, response) {
  const key = query.toLowerCase().trim();
  responseCache.set(key, {
    ...response,
    cachedAt: Date.now()
  });
}

function getCachedResponse(query) {
  const key = query.toLowerCase().trim();
  const cached = responseCache.get(key);
  
  if (cached && (Date.now() - cached.cachedAt) < CACHE_TTL) {
    return cached;
  }
  
  if (cached) {
    responseCache.delete(key); // Remove expired cache
  }
  
  return null;
}

// 📊 METRICS UPDATE
function updateMetrics(success, latency, errorReason = null) {
  metrics.requests++;
  
  if (!success) {
    metrics.failures++;
    if (errorReason) {
      metrics.failureReasons[errorReason] = (metrics.failureReasons[errorReason] || 0) + 1;
    }
  }
  
  // Update average latency
  const totalLatency = metrics.avgLatency * (metrics.requests - 1) + latency;
  metrics.avgLatency = totalLatency / metrics.requests;
  
  metrics.lastUpdate = Date.now();
}

// 🛡️ INPUT VALIDATION
function validateInput(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid query: must be a non-empty string');
  }
  
  const trimmed = query.trim();
  if (trimmed.length === 0) {
    throw new Error('Invalid query: cannot be empty');
  }
  
  if (trimmed.length > 1000) {
    throw new Error('Invalid query: too long (max 1000 characters)');
  }
  
  return trimmed;
}

// 🚀 MAIN GPT ENDPOINT
router.post('/gpt', gptLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 🛡️ INPUT VALIDATION
    const { input } = req.body;
    const validatedQuery = validateInput(input);
    
    console.log('🤖 GPT Gateway request:', {
      query: validatedQuery.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // 📦 CHECK CACHE FIRST
    const cached = getCachedResponse(validatedQuery);
    if (cached) {
      console.log('📦 Serving cached GPT response');
      updateMetrics(true, Date.now() - startTime);
      return res.json({
        success: true,
        output: cached.answer,
        cached: true
      });
    }

    // 🔁 CALL GPT WITH RETRY
    const result = await callGPTWithRetry(validatedQuery);
    
    // 📦 CACHE SUCCESSFUL RESPONSE
    cacheResponse(validatedQuery, result);
    
    // 📊 UPDATE METRICS
    updateMetrics(true, Date.now() - startTime);
    
    console.log('✅ GPT Gateway success:', {
      confidence: result.confidence,
      answerLength: result.answer.length,
      latency: Date.now() - startTime
    });

    res.json({
      success: true,
      output: result.answer,
      cached: false
    });

  } catch (error) {
    const latency = Date.now() - startTime;
    const errorReason = error.message;
    
    console.error('❌ GPT Gateway error:', {
      error: errorReason,
      latency,
      timestamp: new Date().toISOString()
    });

    // 📊 UPDATE METRICS
    updateMetrics(false, latency, errorReason);

    // 📦 TRY CACHED RESPONSE AS FALLBACK
    const cached = getCachedResponse(req.body.input);
    if (cached) {
      console.log('📦 Serving cached GPT fallback response');
      return res.json({
        success: true,
        output: cached.answer,
        cached: true,
        warning: 'Using cached response due to GPT error'
      });
    }

    res.status(500).json({
      success: false,
      error: errorReason
    });
  }
});

// 📊 METRICS ENDPOINT
router.get('/gpt-metrics', (req, res) => {
  const uptime = Date.now() - metrics.lastUpdate;
  const successRate = metrics.requests > 0 ? 
    ((metrics.requests - metrics.failures) / metrics.requests * 100).toFixed(2) : 0;

  res.json({
    metrics: {
      ...metrics,
      successRate: `${successRate}%`,
      uptime: `${Math.round(uptime / 1000)}s`
    },
    config: {
      retryAttempts: GPT_CONFIG.retryAttempts,
      minAnswerLength: GPT_CONFIG.minAnswerLength,
      model: GPT_CONFIG.model
    }
  });
});

module.exports = router; 