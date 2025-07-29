const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// SerpAPI proxy endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { query, strategy = 'default' } = req.query;
    
    console.log('🔍 Received query:', query);
    console.log('🔍 Query type:', typeof query);
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const apiKey = process.env.VITE_SERPAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'SerpAPI key not configured' });
    }

    // Define search strategies
    const strategies = {
      '24h': `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5&tbs=qdr:d&gl=us&hl=en`,
      'week': `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5&tbs=qdr:w&gl=us&hl=en`,
      'month': `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5&tbs=qdr:m&gl=us&hl=en`,
      'news': `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5&tbm=nws&gl=us&hl=en`,
      'default': `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&api_key=${apiKey}&num=5&gl=us&hl=en`
    };

    const url = strategies[strategy] || strategies.default;
    
    console.log(`🔍 Proxying search request: ${strategy} strategy`);
    console.log(`📡 URL: ${url.replace(apiKey, '[API_KEY_HIDDEN]')}`);

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`SerpAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`SerpAPI error: ${data.error}`);
    }

    console.log(`✅ Search successful: Found ${data.organic_results?.length || 0} results`);
    
    res.json(data);
  } catch (error) {
    console.error('❌ Search proxy error:', error.message);
    res.status(500).json({ 
      error: 'Search failed', 
      details: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 SerpAPI Proxy Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.VITE_SERPAPI_KEY ? 'Yes' : 'No'}`);
}); 