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

  return {
    answer: answer.trim(),
    confidence,
    timestamp,
    source: 'VIRL'
  };
}

// 🔁 RETRY + REDUNDANCY STRATEGY
async function callVIRLWithRetry(query, attempt = 0) {
  const config = attempt === 0 ? VIRL_CONFIG.primary : VIRL_CONFIG.fallback;
  
  try {
    console.log(`🚀 VIRL attempt ${attempt + 1}: ${config.url}`);
    
    const response = await axios.post(config.url, {
      messages: [
        {
          role: 'user',
          content: query
        }
      ],
      model: 'virl-real-time',
      max_tokens: 500,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${config.apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: config.timeout
    });

    return validateVIRLResponse(response);
    
  } catch (error) {
    console.error(`❌ VIRL attempt ${attempt + 1} failed:`, error.message);
    
    // 🔁 RETRY LOGIC: Try fallback if primary fails
    if (attempt < VIRL_CONFIG.retryAttempts - 1) {
      const delay = VIRL_CONFIG.retryDelays[attempt] || 1000;
      console.log(`⏳ Retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return callVIRLWithRetry(query, attempt + 1);
    }
    
    throw error;
  }
}

// 📦 CACHE MANAGEMENT
const responseCache = new Map();

function cacheResponse(query, response) {
  const cacheKey = query.toLowerCase().trim();
  responseCache.set(cacheKey, {
    ...response,
    cachedAt: Date.now()
  });
}

function getCachedResponse(query) {
  const cacheKey = query.toLowerCase().trim();
  const cached = responseCache.get(cacheKey);
  
  if (cached && (Date.now() - cached.cachedAt) < 5 * 60 * 1000) { // 5 minutes
    return {
      ...cached,
      warning: 'Answer may not be up to date.'
    };
  }
  
  return null;
}

// 📊 METRICS UPDATING
function updateMetrics(success, latency, errorReason = null) {
  metrics.requests++;
  metrics.avgLatency = (metrics.avgLatency + latency) / 2;
  
  if (!success) {
    metrics.failures++;
    if (errorReason) {
      metrics.failureReasons[errorReason] = (metrics.failureReasons[errorReason] || 0) + 1;
    }
  }
  
  metrics.lastUpdate = Date.now();
}

// 🛡️ INPUT VALIDATION
function validateInput(query) {
  if (!query || typeof query !== 'string') {
    throw new Error('Invalid query: must be a non-empty string');
  }
  
  const trimmed = query.trim();
  if (trimmed.length < 3) {
    throw new Error('Query too short: minimum 3 characters');
  }
  
  if (trimmed.length > 1000) {
    throw new Error('Query too long: maximum 1000 characters');
  }
  
  // 🧼 SANITIZE INPUT
  return trimmed
    .replace(/[<>]/g, '') // Remove potential HTML
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// 🚀 MAIN VIRL GATEWAY ENDPOINT
router.post('/virl-gateway', virlLimiter, async (req, res) => {
  const startTime = Date.now();
  
  try {
    // 🛡️ INPUT VALIDATION
    const { query } = req.body;
    const validatedQuery = validateInput(query);
    
    console.log('🔍 VIRL Gateway request:', {
      query: validatedQuery.substring(0, 100) + '...',
      timestamp: new Date().toISOString()
    });

    // 📦 CHECK CACHE FIRST
    const cached = getCachedResponse(validatedQuery);
    if (cached) {
      console.log('📦 Serving cached response');
      updateMetrics(true, Date.now() - startTime);
      return res.json({
        success: true,
        data: cached,
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
      data: result,
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
    const cached = getCachedResponse(req.body.query);
    if (cached) {
      console.log('📦 Serving cached fallback response');
      return res.json({
        success: true,
        data: cached,
        cached: true,
        warning: 'Using cached response due to VIRL error'
      });
    }

    res.status(500).json({
      success: false,
      error: errorReason,
      fallback: 'GPT'
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