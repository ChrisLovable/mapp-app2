import React, { useState, useRef } from 'react';
import { AiOutlineFileImage, AiOutlineQuestion } from 'react-icons/ai';

import { apiUsageTracker } from '../lib/ApiUsageTracker';
import heic2any from 'heic2any';

interface ImageToTextModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageToTextModal({ isOpen, onClose }: ImageToTextModalProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [isAnswering, setIsAnswering] = useState(false);
  const [error, setError] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [copyMessage, setCopyMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image file size must be less than 10MB');
      return;
    }

    setError('');
    setExtractedText('');
    setQuestion('');
    setAnswer('');

    try {
      let processedFile = file;
      
      // Handle HEIC/HEIF files
      if (file.type === 'image/heic' || file.type === 'image/heif' || 
          file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
        console.log('Converting HEIC/HEIF file to JPEG...');
        setIsConverting(true);
        processedFile = await convertHeicToJpeg(file);
        setIsConverting(false);
      } else if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file (JPEG, PNG, HEIC, HEIF, etc.)');
        return;
      }

      // Convert to base64
      const base64 = await fileToBase64(processedFile);
      setSelectedImage(base64);
      
      // Automatically extract text
      await extractTextFromImage(base64);
    } catch (err) {
      setError('Failed to process image. Please try again.');
      console.error('Image processing error:', err);
    }
  };

  const convertHeicToJpeg = async (file: File): Promise<File> => {
    try {
      const convertedBlob = await heic2any({
        blob: file,
        toType: 'image/jpeg',
        quality: 0.8
      });
      
      // Ensure convertedBlob is a single Blob, not an array
      const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;
      
      // Create a new File object from the converted blob
      const convertedFile = new File([blob], file.name.replace(/\.(heic|heif)$/i, '.jpg'), {
        type: 'image/jpeg',
        lastModified: file.lastModified
      });
      
      console.log('HEIC/HEIF file converted successfully');
      return convertedFile;
    } catch (error) {
      console.error('Error converting HEIC file:', error);
      throw new Error('Failed to convert HEIC/HEIF file. Please try a different image format.');
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const extractTextFromImage = async (base64Image: string) => {
    setIsExtracting(true);
    setError('');

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env file.');
      }

      // Remove data:image/jpeg;base64, prefix if present
      const base64Data = base64Image.split(',')[1] || base64Image;

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
              content: 'You are an OCR (Optical Character Recognition) specialist. Extract all text from the provided image, including any tables, numbers, dates, and structured data. Preserve the formatting and structure as much as possible. If you cannot read any text clearly, indicate that with [unreadable]. IMPORTANT: Respond with ONLY the extracted text. Do not add any introductory phrases like "Certainly, here is..." or "Here is the extracted text:". Just provide the raw extracted text directly.'
            },
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Extract all text from this image, including any tables, receipts, documents, or structured data. Be thorough and accurate. Respond with ONLY the extracted text, no introductions or explanations.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Data}`
                  }
                }
              ]
            }
          ],
          max_tokens: 2000,
          temperature: 0.1
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const extractedText = data.choices[0]?.message?.content;

      if (!extractedText) {
        throw new Error('No text extracted from image');
      }

      // Track API usage
      const inputTokens = data.usage?.prompt_tokens || 0;
      const outputTokens = data.usage?.completion_tokens || 0;
      apiUsageTracker.trackOpenAIUsage(
        'chat/completions',
        'gpt-4o',
        inputTokens,
        outputTokens,
        'Image OCR - Text Extraction',
        true
      );

      setExtractedText(extractedText);
      console.log('Text extracted successfully:', extractedText);

    } catch (error) {
      console.error('OCR Error:', error);
      setError(`Failed to extract text: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Track failed API usage
      apiUsageTracker.trackOpenAIUsage(
        'chat/completions',
        'gpt-4o',
        0,
        0,
        'Image OCR - Text Extraction',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!question.trim() || !extractedText.trim()) return;

    setIsAnswering(true);
    setError('');
    setAnswer('');

    try {
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env file.');
      }

      const prompt = `Based on the following extracted text from an image, please answer the user's question:

EXTRACTED TEXT:
${extractedText}

USER QUESTION: ${question}

Please provide a clear, accurate answer based only on the information in the extracted text. If the text doesn't contain information relevant to the question, state that clearly.`;

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
              content: 'You are a helpful assistant that answers questions based on extracted text from images. Only use the information provided in the extracted text.'
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
        'chat/completions',
        'gpt-4o-mini',
        inputTokens,
        outputTokens,
        'Image Q&A',
        true
      );

      setAnswer(answer);

    } catch (error) {
      console.error('Question answering error:', error);
      setError(`Failed to get answer: ${error instanceof Error ? error.message : 'Unknown error'}`);
      
      // Track failed API usage
      apiUsageTracker.trackOpenAIUsage(
        'chat/completions',
        'gpt-4o-mini',
        0,
        0,
        'Image Q&A',
        false,
        error instanceof Error ? error.message : 'Unknown error'
      );
    } finally {
      setIsAnswering(false);
    }
  };

  const selectFromGallery = () => {
    galleryInputRef.current?.click();
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    if (isListening) {
      // Stop listening
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Start listening
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setQuestion(transcript);
    };

    recognition.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    speechRecognitionRef.current = recognition;
    recognition.start();
  };

  const clearAll = () => {
    setSelectedImage(null);
    setExtractedText('');
    setQuestion('');
    setAnswer('');
    setError('');
    setIsConverting(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (galleryInputRef.current) {
      galleryInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4">
      <div className="rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col" style={{ boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }}>
        {/* Modal Header */}
        <div 
          className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
          style={{ 
            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
            backdropFilter: 'blur(10px)',
            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
            filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
            transform: 'translateZ(5px)'
          }}
        >
          <h2 
            className="text-white font-bold text-base text-center"
            style={{
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
              filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
              transform: 'translateZ(3px)'
            }}
          >
            Image to Text
          </h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
            style={{ background: '#000000', fontSize: '15px' }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="flex-1 px-4 pb-2 overflow-y-auto">
          <div className="space-y-6">
            {/* Image Upload */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
              />
              <input
                ref={galleryInputRef}
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={handleImageUpload}
              />
              
              {/* Upload Buttons */}
              <div className="space-y-4 mb-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 border-0 animated-white-border"
                  style={{ background: '#111', fontSize: '1rem' }}
                >
                  Use Camera
                </button>
                <button
                  onClick={() => galleryInputRef.current?.click()}
                  className="w-full p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 border-0 animated-white-border"
                  style={{ background: '#111', fontSize: '1rem' }}
                >
                  Select from Gallery
                </button>
              </div>
              
              {error && <div className="text-red-300 mt-2 text-sm">{error}</div>}
            </div>

            {/* Image Preview and Extracted Text */}
            {selectedImage && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Image Preview */}
                <div style={{ marginTop: '-25px' }}>
                  <label className="block text-white font-bold text-sm mb-2">
                    Image Preview
                  </label>
                  <div className="relative">
                    <img
                      src={selectedImage}
                      alt="Uploaded document"
                      className="w-full max-h-[150px] object-contain rounded-2xl border-2 border-white"
                    />
                    {isExtracting && (
                      <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center rounded-2xl">
                        <div className="flex items-center gap-2 text-white">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-300"></div>
                          <span>Extracting text...</span>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Question Input Section */}
                  <div className="mt-4">
                    <label className="block text-white font-bold text-sm mb-2">
                      Ask a question about the image:
                    </label>
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      className="w-full p-3 rounded-2xl bg-black border-2 border-white text-white text-sm focus:outline-none mb-3"
                      placeholder="e.g., What is this document about? What are the main items listed?"
                      disabled={isAnswering}
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={handleMicClick}
                        className={`px-4 py-3 rounded-2xl glassy-btn neon-grid-btn text-white font-bold transition-colors border-0 flex items-center justify-center ${isListening ? 'bg-red-600 animate-pulse' : ''}`}
                        style={{ background: isListening ? '#dc2626' : '#111' }}
                        disabled={isAnswering}
                      >
                        🎤
                      </button>
                      <button
                        onClick={() => setQuestion('')}
                        className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                        style={{ background: '#111' }}
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleAskQuestion}
                        disabled={!question.trim() || isAnswering}
                        className="px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                        style={{ background: '#111' }}
                      >
                        {isAnswering ? 'Asking...' : 'Submit'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Extracted Text */}
                <div>
                  <label className="block text-white font-bold text-sm mb-2">
                    Extracted Text
                  </label>
                  <div className="relative">
                    {selectedImage && (
                      <div 
                        className="absolute inset-0 bg-cover bg-center opacity-5 rounded-2xl"
                        style={{ backgroundImage: `url(${selectedImage})` }}
                      />
                    )}
                    <textarea
                      value={extractedText}
                      onChange={(e) => setExtractedText(e.target.value)}
                      className="relative w-full p-4 rounded-2xl bg-black border-2 border-white text-white text-xs h-[150px] resize-none focus:outline-none overflow-y-scroll touch-pan-y touch-manipulation overscroll-contain pdf-reader-textarea"
                      placeholder="Extracted text will appear here..."
                      readOnly={isExtracting}
                    />
                    <button
                      onClick={async () => {
                        if (!extractedText || extractedText.trim() === '') {
                          return;
                        }
                        try {
                          await navigator.clipboard.writeText(extractedText);
                        } catch (err) {
                          console.error('Failed to copy text:', err);
                        }
                      }}
                      disabled={!extractedText || extractedText.trim() === ''}
                      className="mt-3 p-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                      style={{ background: '#111', width: '120px' }}
                    >
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            )}



            {/* Answer Display */}
            {answer && (
              <div>
                <label className="block text-white font-bold text-sm mb-2">
                  AI Answer:
                </label>
                <textarea
                  value={answer}
                  readOnly
                  className="w-full p-4 rounded-2xl bg-black border-2 border-white text-white text-xs h-[150px] resize-none focus:outline-none overflow-y-scroll touch-pan-y touch-manipulation overscroll-contain pdf-reader-textarea"
                  placeholder="AI answer will appear here..."
                />
                <button
                  onClick={async () => {
                    if (!answer || answer.trim() === '') {
                      return;
                    }
                    try {
                      await navigator.clipboard.writeText(answer);
                    } catch (err) {
                      console.error('Failed to copy text:', err);
                    }
                  }}
                  disabled={!answer || answer.trim() === ''}
                  className="mt-3 p-3 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-colors border-0"
                  style={{ background: '#111', width: '120px' }}
                >
                  Copy
                </button>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
} 