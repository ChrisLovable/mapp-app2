import React, { useState, useEffect, useRef } from 'react';
import EnhancedTouchDragSelect from './EnhancedTouchDragSelect';
import SpeechToText from './SpeechToText';
import { TextToSpeechButton, LanguageToggleButton } from './SpeechToTextButton';
import { getGPTAnswer } from '../lib/AskMeLogic';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import './GridButton.css';

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
  onAskMeClick?: () => void;
  onTranslateClick?: () => void;
  onRewriteClick?: () => void;
}

export default function MessageBox({ 
  value, 
  onChange, 
  onAskMeClick,
  onTranslateClick,
  onRewriteClick
}: Props) {
  const { user } = useAuth();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentLanguage, setCurrentLanguage] = useState('en-US');
  const [isCorrecting, setIsCorrecting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [error, setError] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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

  const handleSTTResult = (text: string) => {
    const syntheticEvent = {
      target: { value: text }
    } as React.ChangeEvent<HTMLTextAreaElement>;
    onChange(syntheticEvent);
  };

  const handleTTS = (text: string) => {
    if (window.speechSynthesis) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = currentLanguage;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setCurrentLanguage(newLanguage);
  };

  const handleCorrectGrammar = async () => {
    if (!value.trim()) {
      alert('Please enter some text to correct');
      return;
    }

    setIsCorrecting(true);
    try {
      // Check if OpenAI API key is configured
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      if (!apiKey || apiKey === 'your_openai_api_key_here') {
        throw new Error('OpenAI API key not configured. Please create a .env file with VITE_OPENAI_API_KEY=your_actual_api_key and restart the server.');
      }

      const language = currentLanguage === 'en-US' ? 'English' : 'Afrikaans';
      const prompt = `Correct the grammar, punctuation, and capitalization of the following ${language} text. Do not change the wording, style, or meaning. Return only the corrected text, nothing else.

Text to correct: "${value}"`;

      const correctedText = await getGPTAnswer(prompt);
      
      // Update the textbox with corrected text
      const syntheticEvent = {
        target: { value: correctedText }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
    } catch (error) {
      console.error('Error correcting grammar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`❌ Fix failed: ${errorMessage}\n\nPlease check your OpenAI API key configuration.`);
    } finally {
      setIsCorrecting(false);
    }
  };

  const handleSaveComment = async () => {
    if (!value.trim()) {
      alert('Please enter some text to save');
      return;
    }
    
    try {
      console.log('=== STARTING SAVE OPERATION ===');
      console.log('Text to save:', value);
      console.log('Current language:', currentLanguage);
      
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
            language: currentLanguage,
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
      
      // Show success confirmation
      const isConfirmed = window.confirm('✅ Comment successfully saved to database!\n\nWould you like to clear the textbox?');
      
      if (isConfirmed) {
        // Clear the textbox
        const syntheticEvent = {
          target: { value: '' }
        } as React.ChangeEvent<HTMLTextAreaElement>;
        onChange(syntheticEvent);
      }
      
    } catch (error) {
      console.error('=== SAVE OPERATION FAILED ===');
      console.error('Error saving comment:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        error: error
      });
      alert(`❌ Failed to save comment to database: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleTextSelect = (selected: string, actions: any) => {
    console.log('Selected text:', selected);
    console.log('Available actions:', Object.keys(actions));

    actions.askMe = () => {
      console.log('Opening Ask Me modal for:', selected);
      // Temporarily set the message to selected text and open Ask Me modal
      const syntheticEvent = {
        target: { value: selected }
      } as React.ChangeEvent<HTMLTextAreaElement>;
      onChange(syntheticEvent);
      onAskMeClick?.();
    };

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
    <div className="glassy-blue-btn rounded-2xl overflow-hidden" style={{ height: '220px' }}>
      <div className="relative w-full h-full">
        <EnhancedTouchDragSelect
          text={value}
          onChange={handleTextChange}
          onSelect={handleTextSelect}
          placeholder="Type or record your message here..."
          className="h-full resize-none p-3 pr-20
            bg-gradient-to-b from-blue-200 via-blue-100 to-white
            text-black placeholder-blue-400 font-semibold shadow-inner"
          features={{
            showHandles: true,
            showActions: true,
            autoCopy: false,
            selectionMode: 'custom'
          }}
        />
        {/* Language Toggle and Speech Buttons */}
        <div className="absolute top-0 right-0 bottom-0 z-10 flex flex-col justify-between py-3">
          {/* Language Toggle Button */}
          <LanguageToggleButton
            currentLanguage={currentLanguage}
            onLanguageChange={handleLanguageChange}
            size="sm"
            variant="primary"
            className="shadow-lg"
          />
          {/* Mobile-optimized Speech-to-Text Button */}
          <SpeechToText
            onTranscriptChange={handleSTTResult}
            onListeningChange={(isListening) => {
              console.log('Speech recognition listening:', isListening);
            }}
            language={currentLanguage}
          >
            <button
              className="w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold text-gray-700 transition-all duration-200 shadow-lg bg-white border-gray-400 hover:bg-gray-100"
              title="Speech to text"
            >
              🎤
            </button>
          </SpeechToText>
          {/* Text-to-Speech Button */}
          <TextToSpeechButton
            onSpeak={handleTTS}
            text={value}
            language={currentLanguage}
            size="sm"
            variant="primary"
            className="shadow-lg"
          />
          {/* Grammar Correction Button */}
          <button
            onClick={handleCorrectGrammar}
            disabled={isCorrecting || !value.trim()}
            className="w-8 h-8 rounded-full bg-green-600 border border-blue-400 flex items-center justify-center text-xs font-bold text-black hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Fix grammar, punctuation, and capitalization"
          >
            {isCorrecting ? '...' : 'Fix'}
          </button>
          {/* Save Comment Button */}
          <button
            onClick={handleSaveComment}
            disabled={!value.trim()}
            className="w-8 h-8 rounded-full bg-blue-600 border border-blue-400 flex items-center justify-center text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
            title="Send message"
          >
            📤
          </button>
        </div>
        {/* Debug info for mobile - REMOVED to fix border alignment */}
      </div>
    </div>
  );
}
