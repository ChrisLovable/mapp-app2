require('dotenv').config(); // Load environment variables from .env
// For DeepInfra SDXL Turbo image generation
const express = require('express');
const fetch = require('node-fetch');
const cors = require('cors');
const app = express();
app.use(cors());
app.use(express.json());

const DEEPINFRA_KEY = "fTn3sFCNC14FalAhSKmZA5j9ST2ZLDqj";

app.post('/api/generate-image', async (req, res) => {
  console.log("Received request to /api/generate-image");
  try {
    const { prompt } = req.body;
    const response = await fetch('https://api.deepinfra.com/v1/inference/stabilityai/sdxl-turbo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPINFRA_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        input: { prompt }
      })
    });
    const data = await response.json();
    console.log("DeepInfra response status:", response.status);
    console.log("DeepInfra response body:", data);
    res.status(response.status).json(data);
  } catch (err) {
    console.error("Proxy error:", err);
    res.status(500).json({ error: err.toString() });
  }
});

app.listen(3001, () => {
  console.log('Proxy server running on http://localhost:3001');
}); 