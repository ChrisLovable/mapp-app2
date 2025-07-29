import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();
const PORT = 4001; // Same port as the Replicate proxy

// Enable CORS for common Vite dev ports
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:5174', 
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'http://localhost:5179',
    'http://localhost:5180',
    'http://localhost:5181',
    'http://localhost:5182',
    'http://localhost:5183',
    'http://localhost:5184',
    'http://localhost:5185',
    'http://localhost:5186',
    'http://localhost:5187',
    'http://localhost:5188'
  ],
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Add error handling middleware for JSON parsing errors
app.use((error, req, res, next) => {
  if (error instanceof SyntaxError && error.status === 400 && 'body' in error) {
    return res.status(400).json({ error: 'Invalid JSON in request body' });
  }
  next();
});

// Free image generation endpoint using a public API
app.post('/api/replicate/predictions', async (req, res) => {
  const { prompt, width = 512, height = 512, reference_image } = req.body;
  
  if (!prompt) {
    return res.status(400).json({ error: 'Prompt is required' });
  }

  try {
    console.log('Starting free image generation with prompt:', prompt);
    if (reference_image) {
      console.log('Reference image provided for style guidance');
    }
    
    // Use a free image generation service
    // For now, we'll return a placeholder image URL that represents the prompt
    // In a real implementation, you could use services like:
    // - Unsplash API for related photos
    // - Picsum for random images
    // - Or integrate with other free AI services
    
    // Simulate processing time (longer if reference image is provided)
    const processingTime = reference_image ? 3000 : 2000;
    await new Promise(resolve => setTimeout(resolve, processingTime));
    
    // Return a mock prediction response
    const prediction = {
      id: `free-gen-${Date.now()}`,
      status: 'succeeded',
      output: [
        `https://picsum.photos/${width}/${height}?random=${Date.now()}`
      ],
      created_at: new Date().toISOString(),
      urls: {
        get: `http://localhost:${PORT}/api/replicate/predictions/free-gen-${Date.now()}`
      }
    };
    
    console.log('Free image generation completed');
    res.json(prediction);
  } catch (err) {
    console.error('Free image generation error:', err);
    res.status(500).json({ error: 'Failed to generate image', details: err.message || err });
  }
});

// Poll prediction status endpoint (for compatibility)
app.get('/api/replicate/predictions/:id', async (req, res) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ error: 'Prediction ID is required' });
  }

  try {
    // For free generation, always return success
    const result = {
      id: id,
      status: 'succeeded',
      output: [
        `https://picsum.photos/512/512?random=${Date.now()}`
      ],
      created_at: new Date().toISOString()
    };
    
    console.log('Prediction status:', id, result.status);
    res.json(result);
  } catch (err) {
    console.error('Status check error:', err);
    res.status(500).json({ error: 'Failed to check prediction status', details: err.message || err });
  }
});

// Health check endpoint
app.get('/api/replicate/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    message: 'Free image generation proxy is running',
    service: 'Free Image Generation (Picsum)'
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Free Image Generation proxy server running on http://localhost:${PORT}`);
  console.log(`📝 Service: Using Picsum for free random images`);
  console.log(`💡 Note: This is a demo service. For real AI generation, add credit to Replicate.`);
}); 