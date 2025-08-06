import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.VITE_OPENAI_API_KEY,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Text to parse is required.' });
  }

  try {
    const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format

    const prompt = `
      You are an intelligent assistant that parses unstructured text into a structured diary or calendar entry.
      Analyze the following text and extract the key components.
      The current date is ${today}. Infer dates and times relative to this.
      If a specific component is not mentioned, leave the corresponding JSON field as an empty string.
      
      The text to parse is: "${text}"

      Please return the output as a single, minified JSON object with the following keys: "title", "date", "chapter", "content".
      - "title": A concise title for the entry.
      - "date": The specific date for the entry in YYYY-MM-DD format. If no date is mentioned, use today's date: ${today}.
      - "chapter": A short category or chapter for the diary. If not specified, create a suitable one based on the content (e.g., "Work", "Personal", "Meeting").
      - "content": The main body of the entry, which should be the original text provided, perhaps slightly cleaned up for clarity.
      
      Example:
      Text: "meeting with John tomorrow at 10am to discuss the project"
      JSON output: {"title":"Meeting with John","date":"[tomorrow's date in YYYY-MM-DD]","chapter":"Meetings","content":"meeting with John tomorrow at 10am to discuss the project"}

      Now, parse the user's text.
    `;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      max_tokens: 250,
    });

    const parsedResult = response.choices[0].message.content.trim();
    
    // Clean the result to ensure it's valid JSON
    const jsonString = parsedResult.replace(/```json/g, '').replace(/```/g, '');

    const parsedJson = JSON.parse(jsonString);

    res.status(200).json(parsedJson);
  } catch (error) {
    console.error('Error parsing text with OpenAI:', error);
    res.status(500).json({ error: 'Failed to parse text using AI.' });
  }
}
