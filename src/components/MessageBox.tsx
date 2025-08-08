import React, { useState, useEffect, useRef } from 'react';
import EnhancedTouchDragSelect from './EnhancedTouchDragSelect';
import { TextToSpeechButton, LanguageToggleButton, ContinuousSpeechToTextButton } from './SpeechToTextButton';

import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { AskMeLogic } from '../lib/AskMeLogic';
import { apiUsageTracker } from '../lib/ApiUsageTracker';
import './GridButton.css';

/**
 * Real-time search functionality integrated into MessageBox
 * Automatically detects time-sensitive questions and uses SerpAPI for live results
 * Replaces the separate TimeSensitiveQuestion component
 */

// Real-time search keywords that trigger SerpAPI
const realTimeSearchKeywords = [
  // Time-based keywords
  'today', 'tomorrow', 'this week', 'this month', 'now', 'current', 'currently', 'right now',
  
  // Weather keywords
  'weather', 'temperature', 'forecast', 'rain', 'sunny', 'cloudy', 'storm', 'hot', 'cold',
  'weather like', 'weather in', 'temperature in', 'forecast for',
  
  // News and current events
  'news', 'headlines', 'latest news', 'breaking news', 'updates',
  
  // Finance and business
  'stocks', 'stock prices', 'market', 'currency', 'exchange', 'exchange rate', 'bitcoin', 'crypto',
  
  // Entertainment and media
  'movies', 'latest movies', 'trending', 'music', 'charts', 'music charts', 'videos', 'trending videos',
  'lyrics', 'song lyrics', 'concerts', 'events', 'showtimes',
  
  // Sports
  'sports', 'sport', 'score', 'scores', 'live scores', 'sports highlights', 'game results',
  
  // Technology and social media
  'ai', 'artificial intelligence', 'facebook', 'twitter', 'instagram', 'x', 'latest tech',
  
  // People and celebrities
  'elon musk', 'trump', 'celebrity', 'celebrity birthdays',
  
  // Travel and transport
  'flights', 'flight status', 'flight delays', 'hotels', 'hotel deals', 'traffic', 'traffic updates',
  'airports', 'buses', 'trains', 'bus schedule', 'train times', 'public transport times',
  
  // Local and location-based
  'restaurants', 'restaurants near me', 'nearby', 'nearby gyms', 'events near me', 
  'parking', 'parking spots', 'directions', 'gas prices',
  
  // Shopping and deals
  'shopping', 'shopping deals', 'deals', 'offers', 'latest offers', 'mobile deals', 'prices',
  
  // Health and safety
  'covid', 'covid updates', 'earthquake alert', 'alerts',
  
  // Work and education
  'jobs', 'jobs hiring', 'school closures',
  
  // Food and lifestyle
  'recipes', 'latest recipes', 'best coffee shops', 'delivery', 'package tracking',
  
  // General current info
  'trends', 'trending hashtags', 'research', 'latest research', 'status', 'live stream',
  'product availability', 'customer reviews', 'order status', 'tickets', 'closures',
  'schedules', 'books', 'best-selling books', 'online courses', 'memes', 'latest memes',
  'lottery', 'lottery results', 'games', 'latest games', 'real estate listings'
];

interface SearchResult {
  title: string;
  summary: string;
  source: string;
  url: string;
}

// Styled notification component
const StyledNotification: React.FC<{
  message: string;
  type: 'success' | 'error' | 'info';
  onClose: () => void;
}> = ({ message, type, onClose }) => {
  const getIcon = () => {
    switch (type) {
      case 'success': return '✅';
      case 'error': return '❌';
      case 'info': return 'ℹ️';
      default: return 'ℹ️';
    }
  };

  const getColors = () => {
    switch (type) {
      case 'success': return { ring: 'ring-green-400', bg: 'rgba(34, 197, 94, 0.2)' };
      case 'error': return { ring: 'ring-red-400', bg: 'rgba(239, 68, 68, 0.2)' };
      case 'info': return { ring: 'ring-blue-400', bg: 'rgba(59, 130, 246, 0.2)' };
      default: return { ring: 'ring-blue-400', bg: 'rgba(59, 130, 246, 0.2)' };
    }
  };

  const colors = getColors();

  return (
    <div 
      className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]"
      style={{ animation: 'fadeInUp 0.3s ease-out' }}
    >
      <div 
        className={`glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ${colors.ring} ring-opacity-60`}
        style={{
          background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), ${colors.bg})`,
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(255, 255, 255, 0.4)',
          boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
          filter: `drop-shadow(0 0 10px ${colors.ring.includes('green') ? 'rgba(34, 197, 94, 0.5)' : colors.ring.includes('red') ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'})`,
          transform: 'translateZ(30px) perspective(1000px)',
          transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <div className="flex items-center gap-4">
          <div 
            className="text-3xl"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
              textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
              transform: 'translateZ(10px)'
            }}
          >
            {getIcon()}
          </div>
          <div className="flex-1">
            <p 
              className="text-white font-bold text-lg"
              style={{
                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                transform: 'translateZ(5px)'
              }}
            >
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button"
            style={{
              border: '1px solid rgba(255, 255, 255, 0.4)',
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)'
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

// Test function to check database table structure
const testDatabaseConnection = async () => {
  try {
    console.log('=== TESTING DATABASE CONNECTION ===');
    
    // Test basic connection
    const { data: testData, error: testError } = await supabase
      .from('user_comments')
      .select('*')
      .limit(1);
    
    console.log('Connection test result:', { data: testData, error: testError });
    
    if (testError) {
      console.error('Database connection failed:', testError);
      return false;
    }
    
    console.log('Database connection successful');
    console.log('Table structure test passed');
    return true;
  } catch (error) {
    console.error('Database test failed:', error);
    return false;
  }
};

interface Props {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onTranslateClick?: () => void;
  onRewriteClick?: () => void;
  onAskAI?: () => void;
  uploadedImage: {
    file: File;
    previewUrl: string;
  } | null;
  setUploadedImage: (image: {
    file: File;
    previewUrl: string;
  } | null) => void;
  onShowImageChoice?: () => void;
  onGalleryUpload?: () => void;
  onCameraCapture?: () => void;
  language?: string;
  onLanguageChange?: (language: string) => void;
}

export default function MessageBox({ 
  value, 
  onChange, 
  onTranslateClick,
  onRewriteClick,
  onAskAI,
  uploadedImage,
  setUploadedImage,
  onShowImageChoice,
  onGalleryUpload,
  onCameraCapture,
  language = 'en-US',
  onLanguageChange
}: Props) {
  // Component rendered - EMERGENCY DEBUG
  console.log('📦 MessageBox: Props received - uploadedImage:', uploadedImage ? 'PRESENT' : 'NULL');
  console.log('📦 MessageBox: setUploadedImage function:', typeof setUploadedImage);
  
  // Component lifecycle tracking
  React.useEffect(() => {
    // Component mounted successfully
    return () => {
      // Component unmounting
    };
  }, []);
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isCorrecting, setIsCorrecting] = useState(false);
  const ownerIdRef = useRef<string>('message-box');

  const [thumbnailPosition, setThumbnailPosition] = useState({ x: 50, y: 50 });

  // Ensure thumbnail starts within textbox bounds when image is uploaded
  useEffect(() => {
    if (uploadedImage && thumbnailPosition.x === 50 && thumbnailPosition.y === 50) {
      // Set initial position within textbox bounds
      const bounds = getTextboxBounds();
      const initialPosition = constrainPosition(bounds.left + 10, bounds.top + 10);
      setThumbnailPosition(initialPosition);
    }
  }, [uploadedImage]);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const showNotification = (message: string, type: 'success' | 'error' | 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000); // Auto-close after 3 seconds
  };

  const handleImageUpload = () => {
    onShowImageChoice?.();
  };

  const handleGalleryUpload = () => {
    onGalleryUpload?.();
    fileInputRef.current?.click();
  };

  const handleCameraCapture = () => {
    onCameraCapture?.();
    // Create a camera input
    if (cameraInputRef.current) {
      cameraInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log('🖼️ File input changed:', event.target.files);
    const file = event.target.files?.[0];
    if (file) {
      console.log('📁 Selected file:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('❌ Invalid file type:', file.type);
        showNotification('Please select an image file', 'error');
        return;
      }
      
      // Validate file size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        console.error('❌ File too large:', file.size);
        showNotification('Image file must be smaller than 20MB', 'error');
        return;
      }
      
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      console.log('🎯 Created preview URL:', previewUrl);
      
      const imageData = { file, previewUrl };
      console.log('💾 Setting uploaded image state:', imageData);
      
      // Set the uploaded image state
      setUploadedImage(imageData);
      
      showNotification('Image uploaded successfully!', 'success');
    } else {
      console.warn('⚠️ No file selected');
    }
  };

  const handleRemoveImage = () => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage.previewUrl);
      setUploadedImage(null);
      showNotification('Image removed', 'info');
    }
  };

  // Track when uploaded image changes
  useEffect(() => {
    // Image state updated
  }, [uploadedImage]);

  // Get textbox boundaries
  const getTextboxBounds = () => {
    const textboxElement = document.querySelector('[style*="width: 85vw"]') as HTMLElement;
    if (textboxElement) {
      const rect = textboxElement.getBoundingClientRect();
      return {
        left: rect.left,
        top: rect.top,
        right: rect.right - 65, // Subtract thumbnail width
        bottom: rect.bottom - 65 // Subtract thumbnail height
      };
    }
    // Fallback bounds if textbox not found
    return {
      left: 10,
      top: 10,
      right: window.innerWidth - 75,
      bottom: window.innerHeight - 75
    };
  };

  // Constrain position within textbox bounds
  const constrainPosition = (x: number, y: number) => {
    const bounds = getTextboxBounds();
    return {
      x: Math.max(bounds.left, Math.min(x, bounds.right)),
      y: Math.max(bounds.top, Math.min(y, bounds.bottom))
    };
  };

  // Global mouse event listeners for dragging
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragOffset.x;
        const newY = e.clientY - dragOffset.y;
        const constrainedPosition = constrainPosition(newX, newY);
        console.log('🐁 Dragging to (constrained):', constrainedPosition);
        setThumbnailPosition(constrainedPosition);
      }
    };

    const handleMouseUp = () => {
      console.log('🐁 Mouse up - stop dragging');
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragOffset]);

  // Cleanup is now handled by the parent component (Home.tsx)
  // No cleanup needed here since MessageBox doesn't own the state
  const [isAskingAI, setIsAskingAI] = useState(false);

  // Test database connection on component mount
  React.useEffect(() => {
    testDatabaseConnection();
  }, []);

  const handleTextChange = (text: string) => {
    const syntheticEvent = {
      target: { value: text }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(syntheticEvent);
  };

  // STT dedupe, same approach as Schedule New Event and Image Generator
  const currentValueRef = React.useRef(value);
  useEffect(() => { currentValueRef.current = value; }, [value]);
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
  const handleMainSTTResult = (text: string) => {
    const curr = normalize(text);
    const prev = normalize(lastTranscriptRef.current);
    // Fast path
    let delta = '';
    if (curr.startsWith(prev)) {
      delta = curr.slice(prev.length);
    } else {
      // Longest common prefix fallback
      let i = 0;
      const max = Math.min(curr.length, prev.length);
      while (i < max && curr.charCodeAt(i) === prev.charCodeAt(i)) i++;
      delta = curr.slice(i);
    }
    delta = normalize(delta);
    if (!delta) return;
    const next = normalize((currentValueRef.current + ' ' + delta));
    const syntheticEvent = { target: { value: next } } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(syntheticEvent);
    lastTranscriptRef.current = curr;
  };

  const lastTranscriptRef = useRef('');

  // Mic handled by SpeechToTextButton (local hook) to avoid duplication

  const handleTTS = (text: string) => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    if (onLanguageChange) {
      onLanguageChange(newLanguage);
    }
  };

  // Detect if question requires real-time search
  const requiresRealTimeSearch = (question: string): boolean => {
    console.log('🔍 [SEARCH DEBUG] ===== REAL-TIME SEARCH DETECTION =====');
    console.log('🔍 [SEARCH DEBUG] Input question:', question);
    console.log('🔍 [SEARCH DEBUG] Question type:', typeof question);
    console.log('🔍 [SEARCH DEBUG] Question length:', question.length);
    
    if (!question || typeof question !== 'string') {
      console.log('🔍 [SEARCH DEBUG] Invalid question - not a string');
      return false;
    }
    
    const lowerQuestion = question.toLowerCase();
    console.log('🔍 [SEARCH DEBUG] Lowercase question:', lowerQuestion);
    
    const matchedKeywords = realTimeSearchKeywords.filter(keyword => {
      const matches = lowerQuestion.includes(keyword.toLowerCase());
      if (matches) {
        console.log('🔍 [SEARCH DEBUG] MATCHED KEYWORD:', keyword);
      }
      return matches;
    });
    
    const hasKeyword = matchedKeywords.length > 0;
    console.log('🔍 [SEARCH DEBUG] All matched keywords:', matchedKeywords);
    console.log('🔍 [SEARCH DEBUG] Total matches:', matchedKeywords.length);
    console.log('🔍 [SEARCH DEBUG] Final result - requires real-time search:', hasKeyword);
    console.log('🔍 [SEARCH DEBUG] ========================================');
    
    return hasKeyword;
  };

  // Perform real-time search using SerpAPI proxy
  const performRealTimeSearch = async (query: string): Promise<SearchResult[]> => {
    try {
      console.log('🔍 [SERPAPI PROXY] Making search request for:', query);
      
      // Use configured proxy server to avoid CORS issues
      const { SEARCH_PROXY_URL } = await import('../lib/config');
      const proxyUrl = `${SEARCH_PROXY_URL}?query=${encodeURIComponent(query)}`;
      console.log('🔍 [SERPAPI PROXY] Proxy URL:', proxyUrl);
      
      const response = await fetch(proxyUrl);
      
      if (!response.ok) {
        throw new Error(`SerpAPI Proxy error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('🔍 [SERPAPI PROXY] Response received:', data);
      
      if (data.error) {
        throw new Error(`SerpAPI Proxy error: ${data.error}`);
      }

      const results: SearchResult[] = [];
      
      // Process organic results
      if (data.organic_results && Array.isArray(data.organic_results)) {
        for (let i = 0; i < Math.min(3, data.organic_results.length); i++) {
          const result = data.organic_results[i];
          if (result.title && result.link) {
            results.push({
              title: result.title,
              summary: result.snippet || result.title,
              source: new URL(result.link).hostname,
              url: result.link
            });
          }
        }
      }

      console.log('🔍 [SERPAPI PROXY] Processed results:', results);
      return results.slice(0, 3); // Ensure max 3 results
    } catch (error) {
      console.error('🔍 [SERPAPI PROXY] Search error:', error);
      throw error;
    }
  };

  // Format search results for display
  const formatSearchResults = (results: SearchResult[]): string => {
    let formatted = '🔍 REAL-TIME SEARCH RESULTS:\n\n';
    
    results.forEach((result, index) => {
      formatted += `${index + 1}.\n`;
      formatted += `Summary: ${result.summary.length > 100 ? result.summary.substring(0, 100) + '...' : result.summary}\n`;
      formatted += `Source: ${result.source}\n`;
      formatted += `URL: ${result.url}\n`;
      formatted += `${'─'.repeat(50)}\n\n`;
    });
    
    return formatted;
  };

  const handleAskAI = async (question: string) => {
    console.log('🔍 [MESSAGE BOX] handleAskAI called with question:', question);
    
    if (!question.trim()) {
      showNotification('Please enter a question to ask the AI', 'info');
      return;
    }

    console.log('🔍 [MESSAGE BOX] Setting isAskingAI to true...');
    setIsAskingAI(true);
    
    try {
      let aiResponse;
      
      console.log('🔍 [MESSAGE BOX] About to check for real-time search...');
      console.log('🔍 [MESSAGE BOX] uploadedImage:', uploadedImage ? 'HAS IMAGE' : 'NO IMAGE');
      
      // Check if question requires real-time search (only for text questions without images)
      if (!uploadedImage && requiresRealTimeSearch(question)) {
        console.log('🔍 [MESSAGE BOX] Question requires real-time search, using SerpAPI...');
        showNotification('🔍 Real-time search detected! Using SerpAPI for current info...', 'info');
        
        try {
          const searchResults = await performRealTimeSearch(question);
          if (searchResults.length > 0) {
            aiResponse = formatSearchResults(searchResults);
            showNotification(`✅ Found ${searchResults.length} real-time results!`, 'success');
          } else {
            throw new Error('No search results found');
          }
        } catch (searchError) {
          console.error('🔍 [MESSAGE BOX] Search failed, falling back to AI:', searchError);
          showNotification('🔍 Search failed, using AI response instead...', 'error');
          
          // Fallback to regular AI
          const result = await AskMeLogic.sendQuestionToAI(question);
          if (result.success && result.response) {
            aiResponse = AskMeLogic.formatResponse(result.response);
          } else {
            throw new Error(result.error || 'Failed to get AI response');
          }
        }
      } else if (uploadedImage) {
        // Process with image using GPT-4 Vision
        console.log('🖼️ Processing AI question with image:', question);
        aiResponse = await processImageAndTextWithAI(question, uploadedImage);
      } else {
        // Process text-only using existing logic
        console.log('🤖 Processing AI question (text only):', question);
        showNotification('🤖 Using regular AI - no real-time keywords detected', 'info');
        const result = await AskMeLogic.sendQuestionToAI(question);
        
        if (result.success && result.response) {
          aiResponse = AskMeLogic.formatResponse(result.response);
        } else {
          throw new Error(result.error || 'Failed to get AI response');
        }
      }
      
      // Display question + answer in textbox
      const formattedResponse = `Q: ${question}\n\nA: ${aiResponse}`;
      const syntheticEvent = {
        target: { value: formattedResponse }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      
      console.log('✅ AI Response received and formatted');
    } catch (error) {
      console.error('❌ Error asking AI:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorResponse = `Q: ${question}\n\nA: ❌ Error: ${errorMessage}`;
      
      // Put error in textbox
      const syntheticEvent = {
        target: { value: errorResponse }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    } finally {
      setIsAskingAI(false);
    }
  };

  // New function to process image + text with GPT-4 Vision
  const processImageAndTextWithAI = async (question: string, imageData: { file: File; previewUrl: string }) => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
    
    if (!apiKey || apiKey === 'your_openai_api_key_here') {
      throw new Error('OpenAI API key not configured. Please create a .env file with VITE_OPENAI_API_KEY=your_actual_api_key');
    }

    // Convert image to base64
    const base64Image = await convertImageToBase64(imageData.file);
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // GPT-4 Vision model
        messages: [
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
                  url: `data:${imageData.file.type};base64,${base64Image}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.1
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content?.trim();

    if (!aiResponse) {
      throw new Error('No response received from OpenAI Vision API');
    }

    // Track API usage
    const inputTokens = data.usage?.prompt_tokens || 0;
    const outputTokens = data.usage?.completion_tokens || 0;
    apiUsageTracker.trackOpenAIUsage(
      'chat/completions',
      'gpt-4o',
      inputTokens,
      outputTokens,
      'Image + Text Q&A',
      true
    );

    return aiResponse;
  };

  // Helper function to convert image to base64
  const convertImageToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove the data URL prefix to get just the base64 string
        const base64 = result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  // DEBUG: Test function to help troubleshoot user questions
  React.useEffect(() => {
    console.log('🧪 [KEYWORD TEST] Available real-time keywords:', realTimeSearchKeywords);
    
    // Test common questions
    const testQuestions = [
      "what's the news today",
      "latest news",
      "stock prices",
      "bitcoin price", 
      "trending videos",
      "sports scores",
      "elon musk news",
      "flights to Cape Town",
      "restaurants near me",
      "covid updates",
      "latest movies"
    ];
    
    console.log('🧪 [KEYWORD TEST] Testing sample questions:');
    testQuestions.forEach(q => {
      const result = requiresRealTimeSearch(q);
      console.log(`🧪 [KEYWORD TEST] "${q}" → ${result ? '✅ REAL-TIME' : '❌ REGULAR AI'}`);
    });
    
    console.log('🧪 [KEYWORD TEST] Please try typing one of these questions to test real-time search!');
  }, []); // Run once on mount

  // Expose handleAskAI to parent component
  React.useEffect(() => {
    if (onAskAI) {
      // Replace the onAskAI callback with our internal handler
      (window as any).triggerAskAI = () => handleAskAI(value);
    }
  }, [onAskAI, value]);

  // Removed Enter key handling - AI questions are sent via ASK AI button only

  const handleCorrectGrammar = async () => {
    if (!value.trim()) {
      showNotification('Please enter some text to correct', 'info');
      return;
    }

    setIsCorrecting(true);
    try {
      // Check if OpenAI API key is configured
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please create a .env file with VITE_OPENAI_API_KEY=your_actual_api_key and restart the server.');
      }

      const languageName = language === 'en-US' ? 'English' : 'Afrikaans';
      const prompt = `Correct the grammar, punctuation, and capitalization of the following ${languageName} text. Do not change the wording, style, or meaning. Return only the corrected text, nothing else.

Text to correct: "${value}"`;

      // Call OpenAI API for grammar correction
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `You are a grammar correction assistant. Correct grammar, punctuation, and capitalization while preserving the original meaning, style, and tone. Return only the corrected text, nothing else.`
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error (${response.status}): ${errorData.error?.message || 'Unknown error'}`);
      }

      const data = await response.json();
      const correctedText = data.choices?.[0]?.message?.content?.trim() || value;
      
      // Track API usage
      const inputTokens = data.usage?.prompt_tokens || 50; // Estimate if not provided
      const outputTokens = data.usage?.completion_tokens || 50; // Estimate if not provided
      apiUsageTracker.trackOpenAIUsage(
        'chat/completions',
        'gpt-4o-mini', 
        inputTokens,
        outputTokens,
        'Grammar Fix',
        true
      );
      
      // Update the textbox with corrected text
      const syntheticEvent = {
        target: { value: correctedText }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      
      // Show success notification
      if (correctedText !== value) {
        showNotification('Text has been corrected!', 'success');
      } else {
        showNotification('No corrections needed - text looks good!', 'info');
      }
    } catch (error) {
      console.error('Error correcting grammar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Track failed API usage
      apiUsageTracker.trackOpenAIUsage(
        'chat/completions',
        'gpt-4o-mini', 
        0,
        0,
        'Grammar Fix',
        false,
        errorMessage
      );
      
      showNotification(`Fix failed: ${errorMessage}. Please check your OpenAI API key configuration.`, 'error');
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleSaveComment = async () => {
    if (!value.trim()) {
      showNotification('Please enter some text to save', 'info');
      return;
    }
    
    try {
      console.log('=== STARTING SAVE OPERATION ===');
      console.log('Text to save:', value);
      console.log('Current language:', language);
      
      // Get the current user
      const userId = user?.id || '00000000-0000-0000-0000-000000000000';
      
      console.log('User ID:', userId);
      console.log('Authenticated user:', user);
      
      if (!user) {
        console.log('No authenticated user found, using dummy user ID for testing');
      }
      
      // Save the user's comment to the database
      console.log('Saving user comment...');
      const { data: simpleData, error: simpleError } = await supabase
        .from('user_comments')
        .insert([
          {
            user_id: userId, // Use the authenticated user's ID
            comment_text: value, // Save only the user's input
            language: language,
            metadata: {
              device: navigator.userAgent.includes('Mobile') ? 'mobile' : 'desktop',
              browser: navigator.userAgent.includes('Chrome') ? 'chrome' : 
                      navigator.userAgent.includes('Firefox') ? 'firefox' : 
                      navigator.userAgent.includes('Safari') ? 'safari' : 'unknown',
              timestamp: new Date().toISOString()
            }
          },
        ])
        .select()
        .single();

      console.log('Simple insert result:', { data: simpleData, error: simpleError });

      if (simpleError) {
        console.error('Simple insert failed:', simpleError);
        
        // If simple insert fails, the table might not exist or RLS is blocking
        if (simpleError.message.includes('relation "user_comments" does not exist')) {
          throw new Error('The user_comments table does not exist in your database. Please run the user_comments_table.sql script in your Supabase SQL editor.');
        } else if (simpleError.message.includes('new row violates row-level security policy')) {
          throw new Error('Row Level Security is blocking the insert. You may need to disable RLS temporarily or create a proper user account.');
        } else {
          throw simpleError;
        }
      }

      console.log('Simple insert successful:', simpleData);
      console.log('Comment saved successfully:', simpleData);
      console.log('=== SAVE OPERATION COMPLETED SUCCESSFULLY ===');
      
      // Show success notification with styled message box
      showNotification('Comment successfully saved to database!', 'success');
      
      // Clear the textbox automatically
      const syntheticEvent = {
        target: { value: '' }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      
    } catch (error) {
      console.error('=== SAVE OPERATION FAILED ===');
      console.error('Error saving comment:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      showNotification(`Failed to save comment to database: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  const handleTextSelect = (selected: string, actions: any) => {
    console.log('Selected text:', selected);
    console.log('Available actions:', Object.keys(actions));



    actions.translate = () => {
      console.log('Opening Translate modal for:', selected);
      // Temporarily set the message to selected text and open Translate modal
      const syntheticEvent = {
        target: { value: selected }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      onTranslateClick?.();
    };

    actions.rewrite = () => {
      console.log('Opening Rewrite modal for:', selected);
      // Temporarily set the message to selected text and open Rewrite modal
      const syntheticEvent = {
        target: { value: selected }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      onRewriteClick?.();
    };
  };

  // Check mobile compatibility
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isHTTPS = window.location.protocol === 'https:';
  const hasSpeechRecognition = !!(window.SpeechRecognition || window.webkitSpeechRecognition);

  console.log('Mobile compatibility check:', {
    isMobile,
    isHTTPS,
    hasSpeechRecognition,
    userAgent: navigator.userAgent
  });

  return (
    <div className="textbox-container photo-frame-3d rounded-2xl overflow-hidden" style={{ 
      height: '210px', 
      width: '85vw', 
      margin: '0 auto'
    }}>

      <div className="relative w-full h-full">
        <EnhancedTouchDragSelect
          text={value}
          onChange={handleTextChange}
          onSelect={handleTextSelect}
          placeholder={isAskingAI ? "🤖 AI is thinking..." : "Type or record your message here..."}
          className="h-full resize-none p-3 pr-36
            text-black placeholder-gray-400 font-semibold shadow-inner text-lg"
          style={{
            backgroundColor: '#000000 !important',
            border: '2px solid white !important',
            borderRadius: '16px',
            fontSize: '25px !important',
            opacity: isAskingAI ? 0.7 : 1
          }}
          features={{
            showHandles: false,
            showActions: false,
            autoCopy: false,
            selectionMode: 'custom'
          }}
        />
        {/* Language Toggle and Speech Buttons */}
        <div className="absolute bottom-0 left-0 right-0 z-10 flex flex-row justify-between gap-4 py-2 px-4" style={{ height: 'auto' }}>
          {/* Language Toggle Button */}
          <LanguageToggleButton
            currentLanguage={language}
            onLanguageChange={onLanguageChange || handleLanguageChange}
            size="sm"
            variant="primary"
            className="shadow-lg glassy-btn neon-grid-btn"
          />
          {/* Speech-to-Text Button using continuous local STT */}
          <ContinuousSpeechToTextButton
            onResult={handleMainSTTResult}
            onError={(err) => showNotification(err, 'error')}
            onStart={() => { lastTranscriptRef.current = ''; currentValueRef.current = value; }}
            language={language}
            className="w-8 h-8 glassy-btn neon-grid-btn rounded-full border-0 flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-lg active:scale-95 relative overflow-visible"
            size="sm"
            variant="default"
          />
          {/* Text-to-Speech Button */}
          <TextToSpeechButton
            onSpeak={handleTTS}
            text={value || " "}
            language={language}
            size="sm"
            variant="primary"
            className="shadow-lg glassy-btn neon-grid-btn"
          />
          {/* Grammar Correction Button */}
                      <button
            onClick={handleCorrectGrammar}
            disabled={isCorrecting}
            className="w-8 h-8 glassy-btn neon-grid-btn rounded-full border-0 flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-lg active:scale-95 relative overflow-visible disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(34, 197, 94, 0.2))',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(34, 197, 94, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
                filter: 'drop-shadow(0 0 5px rgba(34, 197, 94, 0.5)) drop-shadow(0 0 10px rgba(34, 197, 94, 0.4)) drop-shadow(0 0 15px rgba(34, 197, 94, 0.3))',
                transform: 'translateZ(20px) perspective(1000px) rotateX(5deg)',
                borderRadius: '50%',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                aspectRatio: '1.15',
                minWidth: '32px',
                minHeight: '28px',
                width: '32px',
                height: '28px'
              }}
            title="Fix grammar, punctuation, and capitalization"
          >
            {isCorrecting ? '...' : 'Fix'}
          </button>
          {/* Image Upload Button */}
          <button
            onClick={handleImageUpload}
            className="w-8 h-8 glassy-btn neon-grid-btn rounded-full border-0 flex items-center justify-center text-xs font-bold transition-all duration-200 shadow-lg active:scale-95 relative overflow-visible"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(168, 85, 247, 0.2))',
              backdropFilter: 'blur(20px)',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4), 0 0 0 2px rgba(168, 85, 247, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.2)',
              filter: 'drop-shadow(0 0 5px rgba(168, 85, 247, 0.5)) drop-shadow(0 0 10px rgba(168, 85, 247, 0.4)) drop-shadow(0 0 15px rgba(168, 85, 247, 0.3))',
              transform: 'translateZ(20px) perspective(1000px) rotateX(5deg)',
              borderRadius: '50%',
              transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
              aspectRatio: '1.15',
              minWidth: '32px',
              minHeight: '28px',
              width: '32px',
              height: '28px'
            }}
            title="Upload image from gallery"
          >
            📷
          </button>
          {/* Save Comment Button (replaces old send button) */}
          <button
            onClick={handleSaveComment}
            className="glassy-btn neon-grid-btn px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95 relative overflow-visible"
            style={{
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.7))',
              color: '#fff',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), 0 4px 8px rgba(0, 0, 0, 0.3), inset 0 2px 0 rgba(59, 130, 246, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(20px)',
              minWidth: '120px',
              minHeight: '32px',
              fontSize: '1rem',
              fontWeight: 700
            }}
            title="Submit your comment or report"
          >
            Comment/Report
          </button>
        </div>
        
        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        

        
                 {/* Image Thumbnail Display */}

         
         {uploadedImage && (
           <div 
             className="mt-3 p-3 rounded-lg"
             onMouseDown={(e) => {
               console.log('🐁 Mouse down - start dragging');
               console.log('🐁 Click at:', e.clientX, e.clientY);
               console.log('🐁 Current position:', thumbnailPosition);
               setIsDragging(true);
               const newOffset = {
                 x: e.clientX - thumbnailPosition.x,
                 y: e.clientY - thumbnailPosition.y
               };
               console.log('🐁 Drag offset:', newOffset);
               setDragOffset(newOffset);
               e.preventDefault(); // Prevent text selection
             }}
             onTouchStart={(e) => {
               console.log('📱 Touch start - mobile dragging');
               const touch = e.touches[0];
               setIsDragging(true);
               setDragOffset({
                 x: touch.clientX - thumbnailPosition.x,
                 y: touch.clientY - thumbnailPosition.y
               });
               e.preventDefault();
             }}
             onTouchMove={(e) => {
               if (isDragging) {
                 const touch = e.touches[0];
                 const newX = touch.clientX - dragOffset.x;
                 const newY = touch.clientY - dragOffset.y;
                 const constrainedPosition = constrainPosition(newX, newY);
                 setThumbnailPosition(constrainedPosition);
                 e.preventDefault();
               }
             }}
             onTouchEnd={() => {
               console.log('📱 Touch end - stop mobile dragging');
               setIsDragging(false);
             }}
             style={{
               backgroundColor: 'rgba(0, 0, 0, 0.8)',
               border: '2px solid rgba(255, 255, 255, 0.3)',
               backdropFilter: 'blur(10px)',
               position: 'fixed',
               left: `${thumbnailPosition.x}px`,
               top: `${thumbnailPosition.y}px`,
               zIndex: 99999,
               width: '65px',
               height: '65px',
               padding: '2px',
               cursor: isDragging ? 'grabbing' : 'grab',
               userSelect: 'none',
               borderRadius: '8px',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center'
             }}>
                         <div className="relative w-full h-full">
               {/* Image filling the container */}
               <img
                 src={uploadedImage.previewUrl}
                 alt="Uploaded preview"
                 className="object-cover rounded border border-white/20"
                 style={{
                   width: '61px',
                   height: '61px',
                   boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
                   filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.2))'
                 }}
               />
               {/* Remove button positioned on top-right of container */}
               <button
                 onClick={handleRemoveImage}
                 className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500/80 hover:bg-red-500 text-white flex items-center justify-center transition-all duration-200 text-xs font-bold"
                 style={{
                   boxShadow: '0 1px 2px rgba(0, 0, 0, 0.3)',
                   backdropFilter: 'blur(5px)'
                 }}
                 title={`Remove ${uploadedImage.file.name}`}
               >
                 ×
               </button>
             </div>
          </div>
        )}
        
        
         
         {/* Debug info for mobile - REMOVED to fix border alignment */}
       </div>
      
      {/* Loading indicator for AI processing */}
      {isAskingAI && (
        <div className="mt-4 p-4 rounded-lg text-center" style={{
          backgroundColor: '#1a1a1a',
          border: '1px solid #333',
          color: '#fff'
        }}>
          <div className="flex items-center justify-center gap-2">
            <div className="animate-spin w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full"></div>
            <span className="text-blue-400">🤖 AI is processing your question...</span>
          </div>
        </div>
      )}
      
      {/* Styled notification */}
      {notification && (
        <StyledNotification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      

    </div>
  );
}
