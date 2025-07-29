import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Prediction ID is required' });
    }

    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    
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

    const response = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Replicate API error:', response.status, errorText);
      return res.status(response.status).json({ 
        error: `Replicate API error: ${response.status}`,
        details: errorText
      });
    }

    const prediction = await response.json();
    console.log('✅ Replicate prediction status:', prediction.id, prediction.status);
    
    res.json(prediction);
  } catch (error) {
    console.error('❌ Error checking replicate prediction:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 