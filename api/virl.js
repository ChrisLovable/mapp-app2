const express = require('express');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const router = express.Router();

// 🛡️ RATE LIMITING: Prevent abuse
const virlLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // max 10 requests per minute
  message: { error: 'Rate limited - too many requests' },
  standardHeaders: true,
  legacyHeaders: false,
});

// 🧠 VIRL CONFIGURATION
const VIRL_CONFIG = {
  primary: {
    url: process.env.VIRL_PRIMARY_URL || 'https://api.virl.com/v1/chat/completions',
    apiKey: process.env.VIRL_PRIMARY_API_KEY,
    timeout: 8000
  },
  fallback: {
    url: process.env.VIRL_FALLBACK_URL || 'https://api.virl.com/v1/chat/completions',
    apiKey: process.env.VIRL_FALLBACK_API_KEY,
    timeout: 8000
  },
  retryAttempts: 3,
  retryDelays: [500, 1000, 2000], // milliseconds
  maxAnswerAge: 10 * 1000, // 10 seconds
  minConfidence: 0.6,
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

function validateVIRLResponse(response) {
  // ✅ Check if response exists
  if (!response || !response.data) {
    throw new Error('Invalid VIRL response structure');
  }

  const answer = response.data.choices?.[0]?.message?.content;
  const confidence = response.data.confidence || 0;
  const timestamp = response.data.timestamp || Date.now();

  // ✅ Check answer exists and has content
  if (!answer || typeof answer !== 'string') {
    throw new Error('Missing or invalid answer content');
  }

  // ✅ Check minimum length
  if (answer.length < VIRL_CONFIG.minAnswerLength) {
    throw new Error(`Answer too short: ${answer.length} chars`);
  }

  // ✅ Check confidence threshold
  if (confidence < VIRL_CONFIG.minConfidence) {
    throw new Error(`Low confidence: ${confidence}`);
  }

  // ✅ Check for generic responses
  if (looksGeneric(answer)) {
    throw new Error('Generic/unhelpful response detected');
  }

  // ✅ Check data freshness
  const age = Date.now() - timestamp;
  if (age > VIRL_CONFIG.maxAnswerAge) {
    throw new Error(`Data too old: ${age}ms`);
  }

  return answer;
}

// 🔁 VIRL CALL WITH RETRY
async function callVIRLWithRetry(query, attempt = 0) {
  try {
    console.log(`🔍 VIRL attempt ${attempt + 1}/${VIRL_CONFIG.retryAttempts + 1}`);
    
    const config = attempt === 0 ? VIRL_CONFIG.primary : VIRL_CONFIG.fallback;
    
    const response = await axios.post(config.url, {
      model: 'virl-1.5',
      messages: [
        {
          role: 'system',
          content: 'You are a real-time search assistant. Provide current, factual information based on live web search results.'
        },
        {
          role: 'user',
          content: query
        }
      ],
      max_tokens: 500,
      temperature: 0.3
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.apiKey}`
      },
      timeout: config.timeout
    });

    const answer = validateVIRLResponse(response);
    
    console.log('✅ VIRL call successful:', {
      answerLength: answer.length,
      attempt: attempt + 1
    });

    return {
      answer,
      confidence: 0.7,
      source: 'virl',
      timestamp: Date.now()
    };

  } catch (error) {
    console.error(`❌ VIRL attempt ${attempt + 1} failed:`, error.message);
    
    if (attempt < VIRL_CONFIG.retryAttempts) {
      const delay = VIRL_CONFIG.retryDelays[attempt] || 1000;
      console.log(`⏳ Retrying VIRL in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callVIRLWithRetry(query, attempt + 1);
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

// 🚀 MAIN VIRL ENDPOINT
router.post('/virl', virlLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 🛡️ INPUT VALIDATION
    const { input } = req.body;
    const validatedQuery = validateInput(input);
    
    console.log('🔍 VIRL Gateway request:', {
      query: validatedQuery.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // 📦 CHECK CACHE FIRST
    const cached = getCachedResponse(validatedQuery);
    if (cached) {
      console.log('📦 Serving cached VIRL response');
      updateMetrics(true, Date.now() - startTime);
      return res.json({
        success: true,
        output: cached.answer,
        cached: true
      });
    }

    // 🔁 CALL VIRL WITH RETRY
    const result = await callVIRLWithRetry(validatedQuery);
    
    // 📦 CACHE SUCCESSFUL RESPONSE
    cacheResponse(validatedQuery, result);
    
    // 📊 UPDATE METRICS
    updateMetrics(true, Date.now() - startTime);
    
    console.log('✅ VIRL Gateway success:', {
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
    
    console.error('❌ VIRL Gateway error:', {
      error: errorReason,
      latency,
      timestamp: new Date().toISOString()
    });

    // 📊 UPDATE METRICS
    updateMetrics(false, latency, errorReason);

    // 📦 TRY CACHED RESPONSE AS FALLBACK
    const cached = getCachedResponse(req.body.input);
    if (cached) {
      console.log('📦 Serving cached VIRL fallback response');
      return res.json({
        success: true,
        output: cached.answer,
        cached: true,
        warning: 'Using cached response due to VIRL error'
      });
    }

    res.status(500).json({
      success: false,
      error: errorReason
    });
  }
});

// 📊 METRICS ENDPOINT
router.get('/virl-metrics', (req, res) => {
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
      retryAttempts: VIRL_CONFIG.retryAttempts,
      maxAnswerAge: VIRL_CONFIG.maxAnswerAge,
      minConfidence: VIRL_CONFIG.minConfidence,
      minAnswerLength: VIRL_CONFIG.minAnswerLength
    }
  });
});

module.exports = router; 