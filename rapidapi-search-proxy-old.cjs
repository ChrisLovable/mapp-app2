const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
require('dotenv').config();

const app = express();
const PORT = 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// RapidAPI search proxy endpoint
app.get('/api/search', async (req, res) => {
  try {
    console.log('🔍 Full request query:', req.query);
    console.log('🔍 Request URL:', req.url);
    
    const { q: query, strategy = 'default' } = req.query;
    
    console.log('🔍 Received query:', query);
    console.log('🔍 Query type:', typeof query);
    
    if (!query || query.trim() === '') {
      console.log('❌ Query is empty or undefined');
      return res.status(400).json({ error: 'Query parameter is required' });
    }

    const apiKey = process.env.VITE_RAPIDAPI_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'RapidAPI key not configured' });
    }

    // Use Real-time Web Search API from RapidAPI
    const url = 'https://real-time-web-search.p.rapidapi.com/search?q=' + encodeURIComponent(query) + '&num=5';
    
    console.log(`🔍 Proxying search request to RapidAPI`);
    console.log(`📡 URL: ${url}`);

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'real-time-web-search.p.rapidapi.com'
      }
    });
    
    if (!response.ok) {
      throw new Error(`RapidAPI responded with status: ${response.status}`);
    }

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RapidAPI error: ${data.error}`);
    }

    console.log(`✅ Search successful: Found ${data.results?.length || 0} results`);
    
    // Transform RapidAPI response to match our expected format
    const transformedData = {
      organic_results: data.results?.map((result, index) => ({
        title: result.title || `Result ${index + 1}`,
        snippet: result.description || result.snippet || '',
        link: result.link || result.url || '#'
      })) || []
    };
    
    res.json(transformedData);
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
  console.log(`🚀 RapidAPI Search Proxy Server running on http://localhost:${PORT}`);
  console.log(`🔑 API Key configured: ${process.env.VITE_RAPIDAPI_KEY ? 'Yes' : 'No'}`);
}); 
