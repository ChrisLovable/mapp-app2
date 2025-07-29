const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3002;

app.use(cors());
app.use(express.json());

// Load environment variables
require('dotenv').config();

// OpenAI API key from environment
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

if (!OPENAI_API_KEY) {
  console.error('OpenAI API key not found in environment variables');
  process.exit(1);
}

// Function to map event types to valid database values
function mapEventType(eventType) {
  const eventTypeMap = {
    'in-person-meeting': 'meeting',
    'conference-call': 'meeting',
    'appointment': 'personal',
    'reminder': 'reminder',
    'task': 'task',
    'personal': 'personal',
    'work': 'work',
    'health': 'health',
    'social': 'social'
  };
  
  return eventTypeMap[eventType] || 'meeting';
}

app.post('/api/parse-calendar-text', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  try {
    console.log('📝 Parsing calendar text:', text);

                   const prompt = `Parse the following text into calendar event fields. Return ONLY a JSON object with these exact fields:

{
  "title": "extracted title or blank if cannot determine",
  "date": "YYYY-MM-DD format date (intelligently calculate relative dates)", 
  "time": "HH:MM format time (24-hour format, e.g., 14:30 for 2:30 PM)",
  "duration": number in minutes (default to 60 if not specified),
  "location": "extracted location or blank if cannot determine",
  "attendees": "extracted attendees or blank if cannot determine",
  "description": "remaining text as description or blank if cannot determine",
  "eventType": "in-person-meeting|conference-call|appointment|reminder",
  "allDay": boolean
}

Text to parse: "${text}"

Rules for intelligent date parsing:
- "tomorrow" = tomorrow's date
- "next [day]" = next occurrence of that day (e.g., "next Tuesday" = next Tuesday)
- "this [day]" = this week's occurrence of that day
- "in X days" = current date + X days
- "in X weeks" = current date + (X * 7) days
- "in X months" = current date + X months
- "next week" = next Monday
- "this weekend" = next Saturday
- "next month" = same day next month
- "in a month's time" = current date + 1 month
- "in 2 weeks" = current date + 14 days
- "next Friday" = next Friday
- "this Friday" = this week's Friday (if today is before Friday, otherwise next Friday)
- If no date is found, use today's date

Rules for time parsing:
- Convert all times to 24-hour format (2:30 PM = 14:30, 10:00 AM = 10:00)
- "morning" = 9:00 AM, "afternoon" = 2:00 PM, "evening" = 6:00 PM
- "noon" = 12:00, "midnight" = 00:00
- If no time is found, use current time

Other rules:
- If no duration is specified, use 60 minutes
- Extract the most likely title from the text
- Parse any location information (room, building, address, zoom links, etc.)
- Extract attendee names or email addresses
- Determine event type based on keywords
- Set allDay to true only if explicitly mentioned as "all day" or similar
- Return valid JSON only, no other text`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a calendar event parser. Extract structured data from natural language text and return only valid JSON.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 500
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('🤖 OpenAI response:', content);

    // Parse the JSON response
    let parsedData;
    try {
      parsedData = JSON.parse(content);
    } catch (parseError) {
      console.error('❌ Failed to parse OpenAI response as JSON:', content);
      throw new Error('Invalid JSON response from OpenAI');
    }

         // Enhanced intelligent date calculation FIRST
            const textLower = text.toLowerCase();
            const today = new Date();
            let calculatedDate = null;
            
            // Handle various relative date patterns
            if (textLower.includes('tomorrow')) {
              const tomorrow = new Date(today);
              tomorrow.setDate(today.getDate() + 1);
              calculatedDate = tomorrow.toISOString().split('T')[0];
            } else if (textLower.includes('next week')) {
              const nextMonday = new Date(today);
              const daysUntilMonday = (8 - today.getDay()) % 7;
              nextMonday.setDate(today.getDate() + daysUntilMonday);
              calculatedDate = nextMonday.toISOString().split('T')[0];
            } else if (textLower.includes('this weekend')) {
              const nextSaturday = new Date(today);
              const daysUntilSaturday = (6 - today.getDay() + 7) % 7;
              nextSaturday.setDate(today.getDate() + daysUntilSaturday);
              calculatedDate = nextSaturday.toISOString().split('T')[0];
            } else if (textLower.includes('next month')) {
              const nextMonth = new Date(today);
              nextMonth.setMonth(today.getMonth() + 1);
              calculatedDate = nextMonth.toISOString().split('T')[0];
            } else if (textLower.includes("in a month's time") || textLower.includes('in a month')) {
              const nextMonth = new Date(today);
              nextMonth.setMonth(today.getMonth() + 1);
              calculatedDate = nextMonth.toISOString().split('T')[0];
            } else if (textLower.includes('in 2 weeks')) {
              const twoWeeksLater = new Date(today);
              twoWeeksLater.setDate(today.getDate() + 14);
              calculatedDate = twoWeeksLater.toISOString().split('T')[0];
            } else if (textLower.includes('in 3 weeks')) {
              const threeWeeksLater = new Date(today);
              threeWeeksLater.setDate(today.getDate() + 21);
              calculatedDate = threeWeeksLater.toISOString().split('T')[0];
            } else if (textLower.includes('next')) {
              // Handle "next [day]" patterns
              const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
              for (let i = 0; i < daysOfWeek.length; i++) {
                if (textLower.includes(`next ${daysOfWeek[i]}`)) {
                  const currentDay = today.getDay();
                  const targetDay = i;
                  let daysToAdd = targetDay - currentDay;
                  if (daysToAdd <= 0) daysToAdd += 7; // Next week
                  const nextDate = new Date(today);
                  nextDate.setDate(today.getDate() + daysToAdd);
                  calculatedDate = nextDate.toISOString().split('T')[0];
                  break;
                }
              }
                         } else if (textLower.includes('this') || textLower.includes('on')) {
               // Handle "this [day]" and "on [day]" patterns
               const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
               for (let i = 0; i < daysOfWeek.length; i++) {
                 if (textLower.includes(`this ${daysOfWeek[i]}`) || textLower.includes(`on ${daysOfWeek[i]}`)) {
                   const currentDay = today.getDay();
                   const targetDay = i;
                   let daysToAdd = targetDay - currentDay;
                   if (daysToAdd < 0) daysToAdd += 7; // This week
                   const thisWeekDate = new Date(today);
                   thisWeekDate.setDate(today.getDate() + daysToAdd);
                   calculatedDate = thisWeekDate.toISOString().split('T')[0];
                   break;
                 }
               }
            } else if (textLower.includes('in') && textLower.includes('days')) {
              // Handle "in X days" patterns
              const daysMatch = textLower.match(/in (\d+) days?/);
              if (daysMatch) {
                const daysToAdd = parseInt(daysMatch[1]);
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + daysToAdd);
                calculatedDate = futureDate.toISOString().split('T')[0];
              }
            } else if (textLower.includes('in') && textLower.includes('weeks')) {
              // Handle "in X weeks" patterns
              const weeksMatch = textLower.match(/in (\d+) weeks?/);
              if (weeksMatch) {
                const weeksToAdd = parseInt(weeksMatch[1]);
                const futureDate = new Date(today);
                futureDate.setDate(today.getDate() + (weeksToAdd * 7));
                calculatedDate = futureDate.toISOString().split('T')[0];
              }
            } else if (textLower.includes('in') && textLower.includes('months')) {
              // Handle "in X months" patterns
              const monthsMatch = textLower.match(/in (\d+) months?/);
              if (monthsMatch) {
                const monthsToAdd = parseInt(monthsMatch[1]);
                const futureDate = new Date(today);
                futureDate.setMonth(today.getMonth() + monthsToAdd);
                calculatedDate = futureDate.toISOString().split('T')[0];
              }
            }
            
            // Also handle time improvements
            let calculatedTime = null;
            if (textLower.includes('morning') && !parsedData.time) {
              calculatedTime = '09:00';
            } else if (textLower.includes('afternoon') && !parsedData.time) {
              calculatedTime = '14:00';
            } else if (textLower.includes('evening') && !parsedData.time) {
              calculatedTime = '18:00';
            } else if (textLower.includes('noon') && !parsedData.time) {
              calculatedTime = '12:00';
            } else if (textLower.includes('midnight') && !parsedData.time) {
              calculatedTime = '00:00';
            }

         // Validate and clean the response
     const cleanedData = {
       title: parsedData.title || '',
       date: calculatedDate || parsedData.date || new Date().toISOString().split('T')[0],
       time: calculatedTime || parsedData.time || new Date().toTimeString().slice(0, 5),
       duration: parseInt(parsedData.duration) || 60,
       location: parsedData.location || '',
       attendees: parsedData.attendees || '',
       description: parsedData.description || '',
       eventType: mapEventType(parsedData.eventType || 'in-person-meeting'),
              allDay: Boolean(parsedData.allDay)
     };

    console.log('✅ Parsed calendar data:', cleanedData);
    res.json(cleanedData);

  } catch (error) {
    console.error('❌ Error parsing calendar text:', error);
    console.error('🔑 OpenAI API Key configured:', OPENAI_API_KEY ? 'Yes' : 'No');
    console.error('🔑 OpenAI API Key starts with:', OPENAI_API_KEY ? OPENAI_API_KEY.substring(0, 10) + '...' : 'Not set');
    res.status(500).json({ 
      error: 'Failed to parse calendar text',
      details: error.message,
      apiKeyConfigured: !!OPENAI_API_KEY
    });
  }
});

app.listen(PORT, () => {
  console.log(`📅 Calendar text parser proxy running on http://localhost:${PORT}`);
  console.log(`🔑 OpenAI API Key configured: ${OPENAI_API_KEY ? 'Yes' : 'No'}`);
}); 