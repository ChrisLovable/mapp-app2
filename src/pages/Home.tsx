import { useState, useEffect } from 'react';
import Header from '../components/Header';
import AppGrid from '../components/AppGrid';
import MessageBox from '../components/MessageBox';
import CommandButtons from '../components/CommandButtons';
import AskMeModal from '../components/AskMeModal';
import AskMeResponseModal from '../components/AskMeResponseModal';
import AIModelSelectorModal from '../components/AIModelSelectorModal';
import TranslateModal from '../components/TranslateModal';
import RewriteModal from '../components/RewriteModal';
import ImageToTextModal from '../components/ImageToTextModal';
import PdfReaderModal from '../components/PdfReaderModal';
import TodoModal from '../components/TodoModal';
import ShoppingListModal from '../components/ShoppingListModal';
import ExpenseModal from '../components/ExpenseModal';
import SmartMeetingRecorder from '../components/SmartMeetingRecorder';
import ImageGeneratorModal from '../components/ImageGeneratorModal';
import AdminDashboard from '../components/AdminDashboard';
import CalendarModal from '../components/CalendarModal';
import DiaryModal from '../components/CreateDiaryEntryModal';
import { getGPTAnswer, getRealTimeAnswer } from '../lib/AskMeLogic';
import { useAuth } from '../contexts/AuthContext';

// Animated Title Component
const AnimatedTitle = () => {
  return (
    <div className="absolute left-1/2 top-16 transform -translate-x-1/2 z-50 pointer-events-none">
      <h1 
        className="text-xs md:text-sm font-bold text-center"
        style={{
          background: 'linear-gradient(45deg, #ff0000, #ff8000, #ffff00, #80ff00, #00ff00, #00ff80, #00ffff, #0080ff, #0000ff, #8000ff, #ff00ff, #ff0080)',
          backgroundSize: '400% 400%',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          animation: 'rainbow 2s ease-in-out infinite, glow 2s ease-in-out infinite',
          textShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 20px rgba(255,255,255,0.6), 0 0 30px rgba(255,255,255,0.4)',
          filter: 'drop-shadow(0 0 8px rgba(255,255,255,0.6))'
        }}
      >
        myAIpartner.co.za
      </h1>
    </div>
  );
};

interface LanguageOption {
  code: string;
  name: string;
}

// Define the supported languages for Azure TTS
const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: 'en-GB', name: 'English' },
  { code: 'af-ZA', name: 'Afrikaans' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'zh-CN', name: 'Mandarin' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ru-RU', name: 'Russian' },
  { code: 'xh-ZA', name: 'Xhosa' },
  { code: 'zu-ZA', name: 'Zulu' },
  { code: 'st-ZA', name: 'Southern Sotho' }
];

interface HomeProps {
  onShowAuth: () => void;
}

export default function Home({ onShowAuth }: HomeProps) {
  const { user, loading } = useAuth();
  const [message, setMessage] = useState('');
  const [language, _setLanguage] = useState('en-GB');
  const [_languages, setLanguages] = useState<LanguageOption[]>([]);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [isAskMeModalOpen, setIsAskMeModalOpen] = useState(false);
  const [isAskMeResponseModalOpen, setIsAskMeResponseModalOpen] = useState(false);
  const [isAIModelSelectorModalOpen, setIsAIModelSelectorModalOpen] = useState(false);
  const [_isAlarmModalOpen, _setIsAlarmModalOpen] = useState(false);
  const [_isAlarmPopupOpen, _setIsAlarmPopupOpen] = useState(false);
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [isRewriteModalOpen, setIsRewriteModalOpen] = useState(false);
  const [_isDashboardModalOpen, _setIsDashboardModalOpen] = useState(false);
  const [_currentAlarm, _setCurrentAlarm] = useState<any | null>(null); // Changed type to any
  const [isLoading, setIsLoading] = useState(false);
  const [askMeResponse, setAskMeResponse] = useState('');
  const [askMeError, setAskMeError] = useState('');
  const [source, setSource] = useState<string>(''); // New state to track answer source

  const [isImageToTextModalOpen, setIsImageToTextModalOpen] = useState(false);
  const [isPdfReaderModalOpen, setIsPdfReaderModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [translateWarning, setTranslateWarning] = useState('');
  const [isSmartMeetingRecorderOpen, setIsSmartMeetingRecorderOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [_isMindGamesModalOpen, _setIsMindGamesModalOpen] = useState(false);
  const [isImageGeneratorModalOpen, setIsImageGeneratorModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [_isTokenDashboardOpen, _setIsTokenDashboardOpen] = useState(false);
  const [_excelFile, _setExcelFile] = useState<any | null>(null); // Changed type to any
  const [askMeWarning, setAskMeWarning] = useState('');
  const [_selectedModel, _setSelectedModel] = useState<string>('openai/gpt-4o');
  const [clearKey, _setClearKey] = useState<number>(0);

  useEffect(() => {
    setLanguages(SUPPORTED_LANGUAGES);
  }, []);

  // Set up alarm trigger callback
  useEffect(() => {
    // alarmManager.setAlarmTriggerCallback((alarm: Alarm) => { // This line is removed
    //   setCurrentAlarm(alarm);
    //   setIsAlarmPopupOpen(true);
    // });
  }, []);

  // Ensure video plays automatically with enhanced buffering and caching
  useEffect(() => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      // Set video properties for better playback
      videoElement.muted = true;
      videoElement.loop = true;
      videoElement.playsInline = true;
      videoElement.preload = 'auto';
      
      // Check if service worker is available for caching
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          console.log('✅ Service Worker ready for video caching');
        });
      }
      
      const playVideo = async () => {
        try {
          // Wait for video to be ready with more data
          if (videoElement.readyState >= 3) { // HAVE_FUTURE_DATA
            await videoElement.play();
            console.log('✅ Video autoplay successful (fully buffered)');
          } else if (videoElement.readyState >= 2) { // HAVE_CURRENT_DATA
            await videoElement.play();
            console.log('✅ Video autoplay successful (partially buffered)');
          } else {
            console.log('⏳ Video not ready yet, waiting for more data...');
            // Wait for video to load more data
            setTimeout(playVideo, 1000);
          }
        } catch (error) {
          console.log('❌ Autoplay failed, user interaction required:', error);
          
          // Add click listener to start video on first user interaction
          const handleFirstClick = async () => {
            try {
              await videoElement.play();
              console.log('✅ Video started on user interaction');
              document.removeEventListener('click', handleFirstClick);
            } catch (e) {
              console.log('❌ Still failed to play:', e);
            }
          };
          document.addEventListener('click', handleFirstClick);
        }
      };
      
      // Enhanced event listeners for better buffering
      const handleCanPlay = () => {
        console.log('🎬 Video can play, attempting autoplay...');
        playVideo();
      };
      
      const handleLoadedData = () => {
        console.log('📦 Video data loaded, attempting autoplay...');
        playVideo();
      };
      
      const handleCanPlayThrough = () => {
        console.log('🚀 Video can play through, attempting autoplay...');
        playVideo();
      };
      
      const handleProgress = () => {
        if (videoElement.buffered.length > 0) {
          const bufferedEnd = videoElement.buffered.end(videoElement.buffered.length - 1);
          const duration = videoElement.duration;
          const bufferedPercent = (bufferedEnd / duration) * 100;
          console.log(`📊 Video buffered: ${bufferedPercent.toFixed(1)}%`);
        }
      };
      
      videoElement.addEventListener('canplay', handleCanPlay);
      videoElement.addEventListener('loadeddata', handleLoadedData);
      videoElement.addEventListener('canplaythrough', handleCanPlayThrough);
      videoElement.addEventListener('progress', handleProgress);
      
      // Multiple retry attempts with increasing delays
      playVideo();
      setTimeout(playVideo, 2000);
      setTimeout(playVideo, 5000);
      setTimeout(playVideo, 10000); // Final attempt after 10 seconds
      
      return () => {
        videoElement.removeEventListener('canplay', handleCanPlay);
        videoElement.removeEventListener('loadeddata', handleLoadedData);
        videoElement.removeEventListener('canplaythrough', handleCanPlayThrough);
        videoElement.removeEventListener('progress', handleProgress);
      };
    }
  }, []);

  // Handler for Ask Me button
  const handleAskMeClick = async () => {
    if (!message.trim()) {
      setAskMeWarning('Please record or type your question in the text field above');
      setTimeout(() => setAskMeWarning(''), 3000);
      return;
    }
    // Always show the model selector modal, with suggestion
    setIsAIModelSelectorModalOpen(true);
  };

  const handleAIModelSubmit = async (model: string) => {
    _setSelectedModel(model);
    setIsAIModelSelectorModalOpen(false);
    try {
      setIsLoading(true);
      setAskMeError('');
      setAskMeResponse('');
      setIsAskMeResponseModalOpen(true);

      // Step 1: Check if this is a time-sensitive query that should use SerpAPI
      const triggerWords = ["latest", "currently", "now", "real-time", "today", "current", "recent", "news", "breaking", "2025", "2024"];
      const containsTriggerWords = triggerWords.some(word => message.toLowerCase().includes(word));
      
      // Step 2: Try real-time search first for time-sensitive queries
      if (containsTriggerWords && _selectedModel === 'openai/gpt-4o') {
        console.log('🔍 Detected time-sensitive query, trying SerpAPI first...');
        setSource('🕵️ Real-time Web Search');
        
        try {
          const realTimeResult = await getRealTimeAnswer(message, _selectedModel);
          console.log('✅ Using real-time result:', realTimeResult);
          setAskMeResponse(realTimeResult);
          return; // Exit early, don't fall back to GPT
        } catch (realTimeError) {
          console.error('❌ Real-time search failed, falling back to GPT:', realTimeError);
          // Continue to GPT fallback
        }
      }

      // Step 3: Fallback to regular GPT response
      setSource(`🤖 ${_selectedModel}`);
      const response = await getGPTAnswer(message, _selectedModel);
      setAskMeResponse(response);
      
    } catch (error) {
      console.error('Error getting AI response:', error);
      setAskMeWarning('Failed to get AI response. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handler for Translate button
  const handleTranslateClick = () => {
    if (!message.trim()) {
      setTranslateWarning('Please provide text to translate.');
      setTimeout(() => setTranslateWarning(''), 2000);
      return;
    }
    setIsTranslateModalOpen(true);
  };

  // Handler for Rewrite button
  const handleRewriteClick = () => {
    if (!message.trim()) return;
    setIsRewriteModalOpen(true);
  };

  // Handler for PDF Reader button
  const handlePdfReaderClick = () => {
    setIsPdfReaderModalOpen(true);
  };

  // Handler for Todo button
  const handleTodoClick = () => {
    setIsTodoModalOpen(true);
  };

  // Handler for Shopping List button
  const handleShoppingListClick = () => {
    setIsShoppingListModalOpen(true);
  };

  // Handler for Expense button
  const handleExpenseClick = () => {
    setIsExpenseModalOpen(true);
  };



  // Handler for Smart Meeting Recorder button
  const handleSmartMeetingRecorderClick = () => {
    setIsSmartMeetingRecorderOpen(true);
  };

  // Handler for MindGames button
  const handleMindGamesClick = () => {
    _setIsMindGamesModalOpen(true);
  };

  // Handler for Image Generator button
  const handleImageGeneratorClick = () => {
    setIsImageGeneratorModalOpen(true);
  };

  const handleAdminDashboardClick = () => {
    setIsAdminDashboardOpen(true);
  };

  const handleDashboardClick = () => {
    _setIsTokenDashboardOpen(true);
  };

  // Handler for text changes in RewriteModal
  const handleRewriteTextChange = (text: string) => {
    setMessage(text);
  };

  // Handler for Alarm/Calendar button (always open calendar)
  const handleAlarmClick = () => {
    setIsCalendarModalOpen(true);
  };

  // Handler for AskMeModal confirmation (for time-sensitive questions)
  const handleAskMeConfirm = async (questionData: string) => {
    // Close the modal first
    setIsAskMeModalOpen(false);
    
    try {
      // Try to parse as JSON (new format with search type)
      const parsed = JSON.parse(questionData);
      const { question, useRealTimeSearch } = parsed;
      
      setMessage(question);
      
      if (useRealTimeSearch) {
        // Use real-time search directly
        setIsLoading(true);
        setAskMeError('');
        setAskMeResponse('');
        setSource('🕵️ Real-time Web Search');
        setIsAskMeResponseModalOpen(true);
        
        try {
          const response = await getRealTimeAnswer(question, 'openai/gpt-4o');
          setAskMeResponse(response);
        } catch (error) {
          setAskMeError(error instanceof Error ? error.message : 'Failed to get real-time information');
        } finally {
          setIsLoading(false);
        }
      } else {
        // Use normal AI model selection
        setIsAIModelSelectorModalOpen(true);
      }
    } catch (error) {
      // Fallback to old format (just a string)
      setMessage(questionData);
      setIsAIModelSelectorModalOpen(true);
    }
  };

  const closeAskMeResponseModal = () => {
    setIsAskMeResponseModalOpen(false);
    setAskMeResponse('');
    setAskMeError('');
    setSource(''); // Clear the source when closing
  };



  return (
    <div className="w-full h-screen flex flex-col bg-black text-white overflow-hidden">
      {/* NEW: safe horizontal wrapper */}
      <div className="w-full max-w-screen-xl mx-auto px-0 flex flex-col h-full">
        {/* Authentication Check */}
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
              <p className="text-white">Loading...</p>
            </div>
          </div>
        ) : !user ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center max-w-md mx-auto p-6">
              <h1 className="text-3xl font-bold text-white mb-4">Welcome to myAIpartner</h1>
              <p className="text-gray-300 mb-6">
                Sign in to access all the AI-powered features and secure your data.
              </p>
              <button
                onClick={onShowAuth}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
              >
                Sign In / Sign Up
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Fixed top section */}
            <div className="flex-shrink-0 bg-black pt-2 pb-1 relative">
              <Header 
              onDashboardClick={handleDashboardClick} 
              onAdminDashboardClick={handleAdminDashboardClick}
            />
            

            
            {/* Video Title Container - Hologram MP4 */}
            <div className="flex justify-center mt-4 mb-1 px-12">
              <video 
                autoPlay 
                muted 
                loop 
                playsInline
                preload="auto"
                className="rounded-lg shadow-lg"
                style={{ 
                  width: '690px', 
                  height: '80px', 
                  objectFit: 'fill',
                  backgroundColor: '#000'
                }}
                onLoadStart={() => console.log('Video loading started')}
                onCanPlay={() => {
                  console.log('Video can play');
                  // Try to play again when it's ready
                  const video = document.querySelector('video');
                  if (video) {
                    video.play().catch(e => console.log('Play failed:', e));
                  }
                }}
                onPlay={() => console.log('Video started playing')}
                onPause={() => console.log('Video paused')}
                onEnded={(e) => {
                  console.log('Video ended, restarting...');
                  e.currentTarget.currentTime = 0;
                  e.currentTarget.play().catch(e => console.log('Restart failed:', e));
                }}
                onError={(e) => {
                  console.log('Video failed to load:', e);
                  console.log('Video error details:', e.currentTarget.error);
                }}
              >
                <source src="/hologram1.mp4" type="video/mp4" />
                <div style={{ 
                  width: '690px', 
                  height: '80px', 
                  backgroundColor: '#000', 
                  color: '#fff', 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  Video not found
                </div>
              </video>
            </div>
            
            <div className="mt-2">
              <MessageBox 
                value={message} 
                onChange={e => setMessage(e.target.value)}
                onAskMeClick={handleAskMeClick}
                onTranslateClick={handleTranslateClick}
                onRewriteClick={handleRewriteClick}
              />
              

              
              {/* Show warning if needed */}
              {translateWarning && (
                <div className="bg-yellow-700 text-yellow-100 p-3 rounded-lg mb-2 text-center font-medium animate-pulse">
                  {translateWarning}
                </div>
              )}
              {askMeWarning && (
                <div className="relative flex items-center p-3 rounded-3xl text-sm font-medium bg-green-600 text-black border-0 shadow-lg animate-pulse mx-auto max-w-sm" style={{ boxShadow: '0 2px 12px 2px #00ff99, 0 1.5px 6px #007a4d', background: 'linear-gradient(135deg, #00ff99 80%, #007a4d 100%)', fontWeight: 600, backdropFilter: 'blur(2px)' }}>
                  <span>{askMeWarning}</span>
                </div>
              )}
              <CommandButtons message={message} setMessage={setMessage} clearKey={clearKey} />
            </div>
          </div>
          
          {/* Grid section */}
          <div className="flex-1 min-h-0 pb-24 -mt-3">
            <AppGrid 
              onAskMeClick={handleAskMeClick}
              onTranslateClick={handleTranslateClick}
              onRewriteClick={handleRewriteClick}
              onDiaryClick={() => setIsDiaryModalOpen(true)}
              onCalendarClick={() => setIsCalendarModalOpen(true)}
              onExpenseClick={handleExpenseClick}
              onTodoClick={handleTodoClick}
              onShoppingClick={handleShoppingListClick}
              onImageToTextClick={() => setIsImageToTextModalOpen(true)}
              onPdfReaderClick={handlePdfReaderClick}
              onMeetingMinutesClick={() => {}}
              onSmartMeetingRecorderClick={handleSmartMeetingRecorderClick}
              onImageGeneratorClick={handleImageGeneratorClick}
              onExpenseJournalClick={() => {}}
              onTokenDashboardClick={() => {}}
              onAdminDashboardClick={handleAdminDashboardClick}
            />
          </div>
          </>
        )}
      </div>
      
      <DiaryModal
        isOpen={isDiaryModalOpen}
        onClose={() => setIsDiaryModalOpen(false)}
        currentText={message}
      />

      <AskMeModal
        isOpen={isAskMeModalOpen}
        onClose={() => setIsAskMeModalOpen(false)}
        question={message}
        onConfirm={handleAskMeConfirm}
      />

      <AIModelSelectorModal
        isOpen={isAIModelSelectorModalOpen}
        onClose={() => setIsAIModelSelectorModalOpen(false)}
        onSubmit={handleAIModelSubmit}
        question={message}
      />

      <AskMeResponseModal
        isOpen={isAskMeResponseModalOpen}
        onClose={closeAskMeResponseModal}
        question={message}
        answer={askMeResponse}
        isLoading={isLoading}
        error={askMeError}
        source={source} // Pass the source to the modal
      />

      <CalendarModal
        isOpen={isCalendarModalOpen}
        onClose={() => setIsCalendarModalOpen(false)}
        inputText={message}
      />

      <TranslateModal
        isOpen={isTranslateModalOpen}
        onClose={() => setIsTranslateModalOpen(false)}
        currentText={message}
      />

      <RewriteModal
        isOpen={isRewriteModalOpen}
        onClose={() => setIsRewriteModalOpen(false)}
        currentText={message}
        onTextChange={handleRewriteTextChange}
      />

      <ImageToTextModal
        isOpen={isImageToTextModalOpen}
        onClose={() => setIsImageToTextModalOpen(false)}
      />

      <PdfReaderModal
          isOpen={isPdfReaderModalOpen}
          onClose={() => setIsPdfReaderModalOpen(false)}
        />
        <TodoModal
          isOpen={isTodoModalOpen}
          onClose={() => setIsTodoModalOpen(false)}
          initialInput={message}
        />

        <ShoppingListModal
          isOpen={isShoppingListModalOpen}
          onClose={() => setIsShoppingListModalOpen(false)}
          initialInput={message}
        />

        <ExpenseModal
          isOpen={isExpenseModalOpen}
          onClose={() => setIsExpenseModalOpen(false)}
          currentLanguage={language}
        />


        <SmartMeetingRecorder
          isOpen={isSmartMeetingRecorderOpen}
          onClose={() => setIsSmartMeetingRecorderOpen(false)}
        />

        <ImageGeneratorModal
          isOpen={isImageGeneratorModalOpen}
          onClose={() => setIsImageGeneratorModalOpen(false)}
        />
        
        <AdminDashboard
          isOpen={isAdminDashboardOpen}
          onClose={() => setIsAdminDashboardOpen(false)}
        />

        {/* TokenDashboard - Hidden but data tracking remains active
        <TokenDashboard
          isOpen={isTokenDashboardOpen}
          onClose={() => setIsTokenDashboardOpen(false)}
        />
        */}

    </div>
  )
}
