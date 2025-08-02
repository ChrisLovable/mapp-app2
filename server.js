import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Test endpoint
app.get('/test', (req, res) => {
  console.log('✅ Test API endpoint called successfully');
  res.json({
    message: 'API is working!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url
  });
});

// Search endpoint
app.get('/search', async (req, res) => {
  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    console.log('🔍 Search API: Searching for:', q);
    
    // For now, use a simple mock response to test the flow
    const mockResults = [
      {
        title: `Search results for: ${q}`,
        snippet: `This is a test response for the query "${q}". The real search functionality is being tested.`,
        link: 'https://example.com'
      },
      {
        title: 'Test Result 2',
        snippet: 'This is a second test result to verify the search flow is working.',
        link: 'https://example.com/2'
      }
    ];
    
    console.log(`✅ Returning ${mockResults.length} test search results`);
    
    res.json({
      organic_results: mockResults,
      total_results: mockResults.length,
      source: 'test_mock'
    });

  } catch (error) {
    console.error('❌ Search API error:', error);
    res.status(500).json({ 
      error: 'Search service unavailable',
      details: error.message 
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 API Server running on http://localhost:${PORT}`);
  console.log(`🌐 Network accessible at http://192.168.101.105:${PORT}`);
  console.log('📋 Available endpoints:');
  console.log('  - GET /test');
  console.log('  - GET /search?q=query');
  console.log('  - GET /health');
  console.log('🔍 Environment Variables Check:');
  console.log('  - VITE_OPENROUTERAI_API_KEY:', process.env.VITE_OPENROUTERAI_API_KEY ? '✅ Found' : '❌ Missing');
  console.log('  - VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? '✅ Found' : '❌ Missing');
  console.log('  - VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? '✅ Found' : '❌ Missing');
}); 