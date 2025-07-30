export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { q } = req.query;
  
  if (!q) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }

  try {
    console.log('🔍 Search Proxy: Searching for:', q);
    
    // For now, use a simple mock response to test the flow
    // This will help us identify if the issue is with the API endpoint or the search service
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
    
    res.status(200).json({
      organic_results: mockResults,
      total_results: mockResults.length,
      source: 'test_mock'
    });

  } catch (error) {
    console.error('❌ Search proxy error:', error);
    res.status(500).json({ 
      error: 'Search service unavailable',
      details: error.message 
    });
  }
} 