require('dotenv').config();
const OpenAI = require('openai');

// This needs to be a var to be accessible in the handler
var fetch;

// API Cost constants (in USD)
const API_COSTS = {
  'gpt-4o': { input: 0.005, output: 0.015 }, // per 1K tokens
  'dall-e-3': { per_image: 0.040 } // per image (standard quality)
};

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function logApiUsage(apiName, tokensUsed, cost, status, operation) {
  try {
    const dashboardEndpoint = process.env.VITE_DASHBOARD_API_URL || 'http://localhost:3000/api/log-usage';
    
    const usageData = {
      apiName,
      tokensUsed,
      cost,
      status,
      operation,
      endpoint: operation,
      responseTimeMs: 500,
      user_id: '11111111-1111-1111-1111-111111111111',
    };

    // Use dynamic import for node-fetch
    if (!fetch) {
        fetch = (await import('node-fetch')).default;
    }

    fetch(dashboardEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(usageData)
    }).catch(error => {
      console.error('🔥 Dashboard logging failed:', error.message);
    });

  } catch (error) {
    console.error('🔥 Error within logApiUsage function:', error.message);
  }
}

export default async function handler(req, res) {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }
  
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  console.log('GPT-4o Vision-powered serverless function invoked!');
  try {
    const { prompt: userPrompt, image: base64Image } = req.body;

    if (!userPrompt || !base64Image) {
      return res.status(400).json({ error: 'Prompt and image are required.' });
    }

    // Step 1: Use GPT-4o Vision to generate a DALL-E 3 prompt
    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an AI Art Director. Analyze the image and user's request, then generate a new, detailed DALL-E 3 prompt. Describe the final desired image, but do not use words like "change" or "edit". Instead of "Change the background to a beach," write "A photorealistic portrait of a person smiling, with a vibrant, sunny beach and ocean in the background." Output ONLY the new DALL-E 3 prompt.`
        },
        {
          role: "user",
          content: [
            { type: "text", text: `User's desired edit: "${userPrompt}"` },
            { type: "image_url", image_url: { url: `data:image/png;base64,${base64Image}` } }
          ],
        },
      ],
      max_tokens: 300,
    });

    if (chatCompletion.usage) {
      const { prompt_tokens, completion_tokens } = chatCompletion.usage;
      const totalTokens = prompt_tokens + completion_tokens;
      const cost = 
        (prompt_tokens / 1000 * API_COSTS['gpt-4o'].input) + 
        (completion_tokens / 1000 * API_COSTS['gpt-4o'].output);
      
      console.log(`📊 GPT-4o Usage: ${totalTokens} tokens, Cost: $${cost.toFixed(5)}`);
      logApiUsage('GPT-4o Vision', totalTokens, cost, 'success', 'Image Analysis');
    }

    const dalle3Prompt = chatCompletion.choices[0].message.content;
    if (!dalle3Prompt) {
      throw new Error('GPT-4o failed to generate a DALL-E 3 prompt.');
    }
    console.log(`🎨 GPT-4o generated DALL-E 3 prompt: "${dalle3Prompt}"`);

    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: dalle3Prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
      response_format: "url",
    });

    const dalleCost = API_COSTS['dall-e-3'].per_image;
    console.log(`📊 DALL-E 3 Usage: 1 image, Cost: $${dalleCost.toFixed(3)}`);
    logApiUsage('DALL-E 3', 0, dalleCost, 'success', 'Image Generation');

    const imageUrl = imageResponse.data[0].url;
    if (!imageUrl) {
      throw new Error('No image URL returned from DALL-E 3');
    }

    return res.status(200).json({ success: true, imageUrl });

  } catch (error) {
    console.error('🔥 Error in /api/edit-image:', error.message);
    const errorMessage = error.response ? error.response.data.error.message : 'An error occurred';
    logApiUsage('Image Edit Service', 0, 0, 'failed', 'Image Edit Failed');
    return res.status(500).json({ error: `Failed to edit image: ${errorMessage}` });
  }
}
