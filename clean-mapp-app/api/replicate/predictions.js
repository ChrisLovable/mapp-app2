import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { prompt, reference_image, style } = req.body;
    
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    const REPLICATE_API_KEY = process.env.REPLICATE_API_KEY;
    
    if (!REPLICATE_API_KEY) {
      console.log('⚠️  REPLICATE_API_KEY not set - returning demo mode for image generation');
      const mockPrediction = {
        id: `demo-${Date.now()}`,
        status: 'starting',
        output: null
      };
      return res.json(mockPrediction);
    }

    // Construct the prompt with style and reference image context
    let finalPrompt = prompt;
    if (style && style !== 'none') {
      finalPrompt = `${prompt}, ${style} style`;
    }
    if (reference_image) {
      finalPrompt = `${finalPrompt}, based on the reference image`;
    }

    const input = {
      prompt: finalPrompt,
      negative_prompt: "blurry, low quality, distorted, ugly, bad anatomy",
      num_inference_steps: 20,
      guidance_scale: 7.5,
      width: 512,
      height: 512
    };

    // Add image and strength for image-to-image if reference image provided
    if (reference_image) {
      input.image = reference_image;
      input.strength = 0.8;
    }

    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${REPLICATE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        version: 'a00d0b7dcbb9c3fbb34ba87d2d5b46c56969c84a628bf778a7fdaec30b1b99c5',
        input: input
      })
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
    console.log('✅ Replicate prediction created:', prediction.id);
    
    res.json(prediction);
  } catch (error) {
    console.error('❌ Error in replicate predictions:', error);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
} 