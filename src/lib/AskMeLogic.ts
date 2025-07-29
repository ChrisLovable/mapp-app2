// AskMeLogic.ts - Service for handling Ask Me API calls
import { apiUsageTracker } from './ApiUsageTracker';

interface WebSearchResult {
  title: string;
  snippet: string;
  url: string;
}

interface GPTResponse {
  answer: string;
  model: string;
}

// Model suggestion type
export interface ModelSuggestion {
  modelId: string;
  modelName: string;
  confidence: number;
  reason: string;
}

// Intelligent model suggestion algorithm
export function getModelSuggestions(question: string): {
  primary: ModelSuggestion;
  alternatives: ModelSuggestion[];
} {
  const lowerQuestion = question.toLowerCase();
  let allSuggestions: ModelSuggestion[] = [];

  // Web Search Detection
  const timeSensitiveKeywords = [
    'latest', 'current', 'recent', 'today', 'yesterday', 'this week', 'this month',
    'financial results', 'earnings', 'stock price', 'news', 'breaking', 'update',
    '2025', '2024', 'this year', 'quarterly', 'annual report', 'market data',
    'live', 'real-time', 'now', 'happening', 'trending', 'viral'
  ];
  const timeSensitiveScore = timeSensitiveKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
  if (timeSensitiveScore >= 1) {
    allSuggestions.push({
      modelId: 'openai/gpt-4o',
      modelName: 'GPT-4o with SerpAPI',
      confidence: Math.min(0.9, 0.6 + (timeSensitiveScore * 0.1)),
      reason: 'Real-time web search for current information'
    });
  }

  // Reasoning & Analysis
  const reasoningKeywords = [
    'explain', 'analyze', 'compare', 'contrast', 'why', 'how', 'what if',
    'reasoning', 'logic', 'think', 'consider', 'evaluate', 'assess',
    'complex', 'detailed', 'comprehensive', 'thorough', 'deep dive',
    'breakdown', 'step by step', 'process', 'methodology'
  ];
  const reasoningScore = reasoningKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
  if (reasoningScore >= 1) {
    allSuggestions.push({
      modelId: 'anthropic/claude-3.5-sonnet',
      modelName: 'Claude 3.5 Sonnet',
      confidence: Math.min(0.95, 0.7 + (reasoningScore * 0.1)),
      reason: 'Detailed reasoning and analysis'
    });
  }

  // Creative Tasks
  const creativeKeywords = [
    'creative', 'imagine', 'story', 'write', 'poem', 'song', 'art',
    'design', 'brainstorm', 'ideas', 'innovative', 'unique', 'original',
    'fiction', 'narrative', 'character', 'plot', 'creative writing',
    'generate', 'create', 'invent', 'concept', 'vision'
  ];
  const creativeScore = creativeKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
  if (creativeScore >= 1) {
    allSuggestions.push({
      modelId: 'anthropic/claude-3.5-sonnet',
      modelName: 'Claude 3.5 Sonnet',
      confidence: Math.min(0.9, 0.6 + (creativeScore * 0.1)),
      reason: 'Creative tasks and content generation'
    });
  }

  // Coding & Technical
  const codingKeywords = [
    'code', 'programming', 'script', 'function', 'algorithm', 'bug',
    'debug', 'syntax', 'api', 'database', 'framework', 'library',
    'javascript', 'python', 'react', 'node', 'sql', 'html', 'css',
    'development', 'software', 'application', 'website', 'app'
  ];
  const codingScore = codingKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
  if (codingScore >= 1) {
    allSuggestions.push({
      modelId: 'openai/gpt-4o',
      modelName: 'GPT-4o',
      confidence: Math.min(0.9, 0.6 + (codingScore * 0.1)),
      reason: 'Coding and technical development'
    });
  }

  // General Knowledge
  const generalKeywords = [
    'what is', 'who is', 'where is', 'when', 'definition', 'meaning',
    'quick', 'fast', 'simple', 'basic', 'overview', 'summary',
    'fact', 'information', 'knowledge', 'learn', 'understand'
  ];
  const generalScore = generalKeywords.filter(keyword => lowerQuestion.includes(keyword)).length;
  if (generalScore >= 1) {
    allSuggestions.push({
      modelId: 'anthropic/claude-3-haiku',
      modelName: 'Claude Haiku',
      confidence: Math.min(0.8, 0.5 + (generalScore * 0.1)),
      reason: 'Quick, reliable information'
    });
  }

  // Budget-friendly option
  allSuggestions.push({
    modelId: 'openai/gpt-3.5-turbo',
    modelName: 'GPT-3.5 Turbo',
    confidence: 0.6,
    reason: 'Cost-effective for general questions'
  });

  // Sort by confidence
  allSuggestions.sort((a, b) => b.confidence - a.confidence);
  // Remove duplicates
  const uniqueSuggestions = allSuggestions.filter((suggestion, index, self) => 
    index === self.findIndex(s => s.modelId === suggestion.modelId)
  );

  // Safety check for allowed models
  const allowedModels = [
    'openai/gpt-4o',
    'openai/gpt-3.5-turbo',
    'anthropic/claude-3-haiku',
    'anthropic/claude-3.5-sonnet'
  ];

  // Validate primary model
  if (!allowedModels.includes(uniqueSuggestions[0]?.modelId)) {
    throw new Error(`⛔ Invalid model selected: ${uniqueSuggestions[0]?.modelId}`);
  }

  return {
    primary: uniqueSuggestions[0],
    alternatives: uniqueSuggestions.slice(1, 4)
  };
}

// Real-time web search using SerpAPI (Google search results)
export async function getRealTimeAnswer(question: string, model?: string): Promise<string> {
  try {
    console.log('🔍 Starting real-time search for:', question);
    
    // Check if this is a time-sensitive search (GPT-4o for time-sensitive queries)
    const isTimeSensitiveSearch = model === 'openai/gpt-4o' && 
                                 (question.toLowerCase().includes('latest') || 
                                  question.toLowerCase().includes('current') ||
                                  question.toLowerCase().includes('recent') ||
                                  question.toLowerCase().includes('today') ||
                                  question.toLowerCase().includes('news') ||
                                  question.toLowerCase().includes('breaking') ||
                                  question.toLowerCase().includes('2025') ||
                                  question.toLowerCase().includes('2024'));
    
    let searchResults: WebSearchResult[] = [];
    
    if (isTimeSensitiveSearch) {
      // Use RapidAPI for time-sensitive searches
      console.log('🔍 Using RapidAPI for time-sensitive search...');
      try {
        searchResults = await performRapidApiSearch(question);
        console.log('✅ RapidAPI search successful:', searchResults.length, 'results');
      } catch (rapidError) {
        console.error('❌ RapidAPI failed, falling back to regular web search:', rapidError);
        searchResults = await performWebSearch(question);
      }
    } else {
      // Use regular web search for non-time-sensitive queries
      searchResults = await performWebSearch(question);
    }
    
    if (searchResults.length === 0) {
      // Try one more time with a modified query
      console.log('🔄 No results found, trying with modified query...');
      const modifiedQuery = question + ' 2025 latest';
      
      let retryResults: WebSearchResult[] = [];
      if (isTimeSensitiveSearch) {
        try {
          retryResults = await performRapidApiSearch(modifiedQuery);
        } catch (rapidError) {
          console.error('❌ RapidAPI retry failed, falling back to regular web search:', rapidError);
          retryResults = await performWebSearch(modifiedQuery);
        }
      } else {
        retryResults = await performWebSearch(modifiedQuery);
      }
      
      if (retryResults.length === 0) {
        throw new Error('No search results found. Please try rephrasing your question.');
      }
      
      // Use retry results
      const answer = summarizeSearchResults(retryResults);
      const timestamp = new Date().toLocaleString();
      return `🕵️ Here's what I found from the web:\n\n${answer}\n\n*Searched at: ${timestamp}*`;
    }

    // Use the search results we found
    if (searchResults && searchResults.length > 0) {
      const answer = summarizeSearchResults(searchResults);
      const timestamp = new Date().toLocaleString();
      return `🕵️ Here's what I found from the web:\n\n${answer}\n\n*Searched at: ${timestamp}*`;
    }
    
    // This should never be reached, but just in case
    throw new Error('No search results found. Please try rephrasing your question.');
  } catch (error) {
    console.error('Error fetching real-time answer:', error);
    
    // Only fall back to GPT if absolutely no web results can be found
    console.log('🔄 All web search methods failed, falling back to AI with web context...');
    try {
      return await getGPTAnswerWithWebContext(question, model);
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      throw new Error('Failed to fetch real-time information. Please try again or use the general AI mode.');
    }
  }
}

// Helper function to summarize search results into readable content
function summarizeSearchResults(results: WebSearchResult[]): string {
  return results.slice(0, 3).map((r, i) => {
    return `${i + 1}. **${r.title}**\n${r.snippet}\n[Read more](${r.url})\n`;
  }).join("\n\n");
}

// Perform web search using DuckDuckGo API (no CORS issues) with fallbacks
async function performWebSearch(query: string): Promise<WebSearchResult[]> {
  console.log('🔍 Starting web search for:', query);
  
  // Strategy 1: Try DuckDuckGo API (no CORS issues)
  try {
    console.log('🦆 Trying DuckDuckGo API...');
    const duckDuckGoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(query + ' 2025 latest')}&format=json&no_html=1&skip_disambig=1`;
    
    const response = await fetch(duckDuckGoUrl);
    if (response.ok) {
      const data = await response.json();
      console.log('📊 DuckDuckGo response:', data);
      
      const results: WebSearchResult[] = [];
      
      // Add abstract if available
      if (data.AbstractText) {
        results.push({
          title: data.Heading || 'Search Result',
          snippet: data.AbstractText,
          url: data.AbstractURL || '#'
        });
      }
      
      // Add related topics
      if (data.RelatedTopics && data.RelatedTopics.length > 0) {
        data.RelatedTopics.slice(0, 4).forEach((topic: any) => {
          if (topic.Text) {
            results.push({
              title: topic.Text.split(' - ')[0] || 'Related Topic',
              snippet: topic.Text,
              url: topic.FirstURL || '#'
            });
          }
        });
      }
      
      if (results.length > 0) {
        console.log('✅ DuckDuckGo successful: Found', results.length, 'results');
        return results;
      }
    }
  } catch (error) {
    console.error('❌ DuckDuckGo error:', error);
  }
  
  // Strategy 2: Try direct Google search via allorigins.win proxy
  try {
    console.log('🔍 Trying direct Google search via proxy...');
    const searchUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://www.google.com/search?q=${encodeURIComponent(query + ' 2025 latest')}`)}`;
    
    const response = await fetch(searchUrl);
    if (response.ok) {
      const data = await response.json();
      console.log('📊 Direct Google search response received');
      
      const html = data.contents;
      const results: WebSearchResult[] = [];
      
      // Parse Google search results from HTML
      const titleMatches = html.match(/<h3[^>]*>([^<]+)<\/h3>/g);
      const snippetMatches = html.match(/<div[^>]*class="[^"]*VwiC3b[^"]*"[^>]*>([^<]+)<\/div>/g);
      const urlMatches = html.match(/href="([^"]*)"[^>]*data-ved/g);
      
      if (titleMatches && snippetMatches) {
        for (let i = 0; i < Math.min(5, titleMatches.length, snippetMatches.length); i++) {
          const title = titleMatches[i].replace(/<[^>]*>/g, '').trim();
          const snippet = snippetMatches[i].replace(/<[^>]*>/g, '').trim();
          const url = urlMatches && urlMatches[i] ? urlMatches[i].match(/href="([^"]*)"/)?.[1] || '#' : '#';
          
          if (title && snippet) {
            results.push({ title, snippet, url });
          }
        }
      }
      
      if (results.length > 0) {
        console.log('✅ Direct Google search successful: Found', results.length, 'results');
        return results;
      }
    }
  } catch (error) {
    console.error('❌ Direct Google search error:', error);
  }
  
  // Strategy 3: Try DuckDuckGo with different query variations
  const queryVariations = [
    query + ' news 2025',
    query + ' recent latest',
    query + ' financial results 2025',
    query + ' current information'
  ];
  
  for (const variation of queryVariations) {
    try {
      console.log(`🦆 Trying DuckDuckGo variation: ${variation}`);
      const duckDuckGoUrl = `https://api.duckduckgo.com/?q=${encodeURIComponent(variation)}&format=json&no_html=1&skip_disambig=1`;
      
      const response = await fetch(duckDuckGoUrl);
      if (response.ok) {
        const data = await response.json();
        
        const results: WebSearchResult[] = [];
        
        if (data.AbstractText) {
          results.push({
            title: data.Heading || 'Search Result',
            snippet: data.AbstractText,
            url: data.AbstractURL || '#'
          });
        }
        
        if (data.RelatedTopics && data.RelatedTopics.length > 0) {
          data.RelatedTopics.slice(0, 3).forEach((topic: any) => {
            if (topic.Text) {
              results.push({
                title: topic.Text.split(' - ')[0] || 'Related Topic',
                snippet: topic.Text,
                url: topic.FirstURL || '#'
              });
            }
          });
        }
        
        if (results.length > 0) {
          console.log(`✅ DuckDuckGo variation successful: Found`, results.length, 'results');
          return results;
        }
      }
    } catch (error) {
      console.error(`❌ DuckDuckGo variation error:`, error);
    }
  }
  
  console.log('❌ All web search methods failed');
  return [];
}

// Perform web search using RapidAPI (Google search results)
async function performRapidApiSearch(query: string): Promise<WebSearchResult[]> {
  // Clean up the query - remove quotes and special characters
  const cleanQuery = query.replace(/["""]/g, '').replace(/\?/g, '').trim();
  console.log('🔍 Calling RapidAPI proxy for query:', cleanQuery);
  
  // Use the proxy endpoint instead of calling RapidAPI directly
  const proxyUrl = `/api/search?q=${encodeURIComponent(cleanQuery)}`;
  console.log('🔍 Proxy URL:', proxyUrl);
  
  try {
    const response = await fetch(proxyUrl);
    console.log('🔍 Response status:', response.status);
    console.log('🔍 Response ok:', response.ok);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Proxy error response:', errorText);
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`RapidAPI proxy failed: ${errorData.error || response.statusText}`);
    }

    const data = await response.json();
    console.log('🔍 Proxy response data:', data);
    const organicResults = data.organic_results || [];

    console.log(`✅ RapidAPI proxy successful: Found ${organicResults.length} results`);

    const results: WebSearchResult[] = organicResults.slice(0, 5).map((r: any) => ({
      title: r.title,
      snippet: r.snippet || r.snippet_highlighted_words?.join(' ') || '',
      url: r.link
    }));

    return results;
  } catch (error) {
    console.error('❌ RapidAPI proxy error:', error);
    throw error;
  }
}

// Fallback to AI with web context if all web searches fail
async function getGPTAnswerWithWebContext(question: string, model?: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTERAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env file.');
    }

    const modelToUse = model || 'openai/gpt-4o';
    
    // Create a prompt that includes web search context
    const systemPrompt = `You are a helpful AI assistant with access to real-time information. 
    The user is asking a time-sensitive question that requires current information. 
    Provide a helpful response based on your knowledge, and mention that for the most up-to-date information, 
    they should check recent news sources or official websites.`;

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: `This is a time-sensitive question: "${question}". Please provide the most current information you have, and suggest where to find the latest updates.`
          }
        ],
        max_tokens: 600,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No response received from OpenAI');
    }

    // Track API usage
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    apiUsageTracker.trackOpenAIUsage(
      'https://openrouter.ai/api/v1/chat/completions',
      modelToUse,
      inputTokens,
      outputTokens,
      'Ask Me - Real-time with GPT Fallback',
      true
    );

    return `**AI Response for Time-Sensitive Question:**\n\n${answer}\n\n*Note: This response is based on the AI's training data. For the most current information, please check recent news sources.*`;
  } catch (error) {
    console.error('Error in GPT fallback:', error);
    throw error;
  }
}

// GPT response using OpenAI API
export async function getGPTAnswer(question: string, model?: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENROUTERAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env file.');
    }

    const modelToUse = model || 'openai/gpt-4o';
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
        // OpenRouter may require additional headers, e.g. 'HTTP-Referer' or 'X-Title', add if needed
      },
      body: JSON.stringify({
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant. Provide clear, informative, and engaging responses to user questions.'
          },
          {
            role: 'user',
            content: question
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No response received from OpenAI');
    }

    // Track API usage
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    apiUsageTracker.trackOpenAIUsage(
      'https://openrouter.ai/api/v1/chat/completions',
      modelToUse,
      inputTokens,
      outputTokens,
      'Ask Me - GPT Response',
      true
    );

    return answer;
  } catch (error) {
    console.error('Error fetching GPT answer:', error);
    
    // Track failed API usage
    apiUsageTracker.trackOpenAIUsage(
      'https://openrouter.ai/api/v1/chat/completions',
      model || 'openai/gpt-4o',
      0,
      0,
      'Ask Me - GPT Response',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    throw new Error(`Failed to get AI response: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Vision model for image analysis (if needed in the future)
export async function getVisionAnswer(question: string, imageUrl: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env file.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that can analyze images and answer questions about them.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: question
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.7
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No response received from OpenAI');
    }

    // Track API usage
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    apiUsageTracker.trackOpenAIUsage(
      'https://api.openai.com/v1/chat/completions',
      'gpt-4o',
      inputTokens,
      outputTokens,
      'Vision Analysis',
      true
    );

    return answer;
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Track failed API usage
    apiUsageTracker.trackOpenAIUsage(
      'https://api.openai.com/v1/chat/completions',
      'gpt-4o',
      0,
      0,
      'Image Analysis',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Vision model for image analysis with base64 image data
export async function askOpenAIVision(prompt: string, base64Image: string): Promise<string> {
  try {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env file.');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful AI assistant that can analyze images and extract structured data from them.'
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: prompt
              },
              {
                type: 'image_url',
                image_url: {
                  url: base64Image
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.3
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const answer = data.choices[0]?.message?.content;

    if (!answer) {
      throw new Error('No response received from OpenAI');
    }

    // Track API usage
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    apiUsageTracker.trackOpenAIUsage(
      'https://api.openai.com/v1/chat/completions',
      'gpt-4o',
      inputTokens,
      outputTokens,
      'Vision Analysis - Expense Parsing',
      true
    );

    return answer;
  } catch (error) {
    console.error('Error analyzing image:', error);
    
    // Track failed API usage
    apiUsageTracker.trackOpenAIUsage(
      'https://api.openai.com/v1/chat/completions',
      'gpt-4o',
      0,
      0,
      'Vision Analysis - Expense Parsing',
      false,
      error instanceof Error ? error.message : 'Unknown error'
    );
    
    throw new Error(`Failed to analyze image: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
} 