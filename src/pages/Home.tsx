import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import AppGrid from '../components/AppGrid';
import MessageBox from '../components/MessageBox';
import { SpeechProvider } from '../contexts/SpeechContext';
import CommandButtons from '../components/CommandButtons';
import ImageChoiceModal from '../components/ImageChoiceModal';

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
import RealtimeConfirmationModal from '../components/RealtimeConfirmationModal';
import VoiceOnlyChatModal from '../components/VoiceOnlyChatModal';

import { useAuth } from '../contexts/AuthContext';
import { AskMeLogic } from '../lib/AskMeLogic';

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
              backdropFilter: 'blur(10px)',
              fontSize: '15px'
            }}
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};



interface LanguageOption {
  code: string;
  name: string;
}

const availableLanguages: LanguageOption[] = [
  { code: 'en-GB', name: 'English (UK)' },
  { code: 'en-US', name: 'English (US)' },
  { code: 'es-ES', name: 'Spanish' },
  { code: 'fr-FR', name: 'French' },
  { code: 'de-DE', name: 'German' },
  { code: 'it-IT', name: 'Italian' },
  { code: 'pt-PT', name: 'Portuguese' },
  { code: 'nl-NL', name: 'Dutch' },
  { code: 'pl-PL', name: 'Polish' },
  { code: 'tr-TR', name: 'Turkish' },
  { code: 'ja-JP', name: 'Japanese' },
  { code: 'ko-KR', name: 'Korean' },
  { code: 'zh-CN', name: 'Chinese (Simplified)' },
  { code: 'zh-TW', name: 'Chinese (Traditional)' },
  { code: 'ar-SA', name: 'Arabic' },
  { code: 'hi-IN', name: 'Hindi' },
  { code: 'th-TH', name: 'Thai' },
  { code: 'vi-VN', name: 'Vietnamese' },
  { code: 'sv-SE', name: 'Swedish' },
  { code: 'da-DK', name: 'Danish' },
  { code: 'no-NO', name: 'Norwegian' },
  { code: 'fi-FI', name: 'Finnish' },
  { code: 'cs-CZ', name: 'Czech' },
  { code: 'sk-SK', name: 'Slovak' },
  { code: 'hu-HU', name: 'Hungarian' },
  { code: 'ro-RO', name: 'Romanian' },
  { code: 'bg-BG', name: 'Bulgarian' },
  { code: 'hr-HR', name: 'Croatian' },
  { code: 'sl-SI', name: 'Slovenian' },
  { code: 'et-EE', name: 'Estonian' },
  { code: 'lv-LV', name: 'Latvian' },
  { code: 'lt-LT', name: 'Lithuanian' },
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
  const [language, setLanguage] = useState('en-US');
  const [_languages, setLanguages] = useState<LanguageOption[]>([]);
  const [isDiaryModalOpen, setIsDiaryModalOpen] = useState(false);
  const [diaryPrefill, setDiaryPrefill] = useState<{ date?: Date; chapter?: string; content?: string }>({});
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [isRewriteModalOpen, setIsRewriteModalOpen] = useState(false);
  const [isImageToTextModalOpen, setIsImageToTextModalOpen] = useState(false);
  const [isPdfReaderModalOpen, setIsPdfReaderModalOpen] = useState(false);
  const [isTodoModalOpen, setIsTodoModalOpen] = useState(false);
  const [isShoppingListModalOpen, setIsShoppingListModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isSmartMeetingRecorderOpen, setIsSmartMeetingRecorderOpen] = useState(false);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);
  const [isImageGeneratorModalOpen, setIsImageGeneratorModalOpen] = useState(false);
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);
  const [isVoiceChatOpen, setIsVoiceChatOpen] = useState(false);
  // Excel feature removed

  const [_selectedModel, _setSelectedModel] = useState<string>('openai/gpt-4o');

  const [notification, setNotification] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);
  const [showRealtimeConfirmation, setShowRealtimeConfirmation] = useState(false);
  const [pendingQuestion, setPendingQuestion] = useState<string>('');
  const [realtimeMatchedTriggers, setRealtimeMatchedTriggers] = useState<string[]>([]);
  const [isProcessingAI, setIsProcessingAI] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<{
    file: File;
    previewUrl: string;
  } | null>(null);
  const [showImageChoice, setShowImageChoice] = useState(false);
  const [installPromptEvent, setInstallPromptEvent] = useState<any>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [showInstallingOverlay, setShowInstallingOverlay] = useState(false);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  // (Removed top STT button logic)

  // AI Processing Functions
  const processAIQuestion = async (question: string) => {
    setIsProcessingAI(true);
    try {
      console.log('🤖 Processing AI question:', question);
      console.log('📷 Uploaded image:', uploadedImage ? 'Yes' : 'No');
      
      // Send question with image if available
      const result = await AskMeLogic.sendQuestionToAI(
        question, 
        uploadedImage?.file
      );
      
      if (result.success && result.response) {
        // Put the AI response directly in the textbox
        let responseText = `${question}\n\nAI Response:\n${result.response}`;
        
        // Add note if image was analyzed
        if (uploadedImage) {
          responseText = `Question with image:\n${question}\n\nAI Response (including image analysis):\n${result.response}`;
        }
        
        setMessage(responseText);
        
        // Clear the uploaded image after processing
        setUploadedImage(null);
      } else {
        setNotification({
          message: result.error || 'Failed to get AI response',
          type: 'error'
        });
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error) {
      console.error('❌ Error processing AI question:', error);
      setNotification({
        message: 'Failed to process AI question. Please try again.',
        type: 'error'
      });
      setTimeout(() => setNotification(null), 5000);
    } finally {
      setIsProcessingAI(false);
    }
  };

  const handleAskAI = async () => {
    const question = message.trim();
    if (!question) {
      // Show beautiful notification message for 2 seconds
      setNotification({
        message: 'Please enter a question',
        type: 'info'
      });
      setTimeout(() => setNotification(null), 2000);
      
      return;
    }

    // Check if question requires real-time information
    const realtimeDetection = AskMeLogic.detectRealtimeQuestion(question);
    
    if (realtimeDetection.isRealtime) {
      // Show confirmation dialog for real-time questions
      setPendingQuestion(question);
      setRealtimeMatchedTriggers(realtimeDetection.matchedTriggers);
      setShowRealtimeConfirmation(true);
    } else {
      // Process question normally
      await processAIQuestion(question);
    }
  };

  const handleRealtimeConfirm = async () => {
    setShowRealtimeConfirmation(false);
    await processAIQuestion(pendingQuestion);
    setPendingQuestion('');
    setRealtimeMatchedTriggers([]);
  };

  const handleRealtimeCancel = () => {
    setShowRealtimeConfirmation(false);
    setPendingQuestion('');
    setRealtimeMatchedTriggers([]);
  };

  // Set up global triggerAskAI function
  useEffect(() => {
    (window as any).triggerAskAI = handleAskAI;
    return () => {
      delete (window as any).triggerAskAI;
    };
  }, [handleAskAI]); // Re-setup when handleAskAI changes

  // Track uploaded image state
  useEffect(() => {
    // Image state managed in parent component
  }, [uploadedImage]);

  // Translation handlers
  const handleTranslateClick = () => {
    setIsTranslateModalOpen(true);
  };

  const handleRewriteClick = () => {
    setIsRewriteModalOpen(true);
  };

  const handleImageToTextClick = () => {
    setIsImageToTextModalOpen(true);
  };

  const handlePdfReaderClick = () => {
    setIsPdfReaderModalOpen(true);
  };

  const handleTodoClick = () => {
    setIsTodoModalOpen(true);
  };

  const handleShoppingListClick = () => {
    setIsShoppingListModalOpen(true);
  };

  const handleExpenseClick = () => {
    setIsExpenseModalOpen(true);
  };

  const handleSmartMeetingRecorderClick = () => {
    setIsSmartMeetingRecorderOpen(true);
  };

  const handleGabbyChatClick = () => {
    setIsVoiceChatOpen(true);
  };

  // Image choice modal handlers
  const handleShowImageChoice = () => {
    setShowImageChoice(true);
  };

  const handleCloseImageChoice = () => {
    setShowImageChoice(false);
  };

  const handleGalleryUpload = () => {
    setShowImageChoice(false);
    // Trigger the MessageBox's gallery input
    const galleryInput = document.querySelector('input[type="file"]:not([capture])') as HTMLInputElement;
    if (galleryInput) {
      galleryInput.click();
    }
  };

  const handleCameraCapture = () => {
    setShowImageChoice(false);
    // Trigger the MessageBox's camera input
    const cameraInput = document.querySelector('input[type="file"][capture]') as HTMLInputElement;
    if (cameraInput) {
      cameraInput.click();
    }
  };

  // Language change handler
  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
  };

  // Initialize languages on component mount
  useEffect(() => {
    setLanguages(availableLanguages);
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setInstallPromptEvent(e);
      setShowInstallPrompt(true); // ensure visible immediately on first availability
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  // Expose a global to show installing overlay from Auth success
  useEffect(() => {
    (window as any).showInstallingOverlay = () => setShowInstallingOverlay(true);
    return () => { delete (window as any).showInstallingOverlay; };
  }, []);

  // Detect if app is installed (standalone mode)
  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone;
      setIsAppInstalled(isStandalone);
    };
    checkInstalled();
    window.addEventListener('appinstalled', checkInstalled);
    window.matchMedia('(display-mode: standalone)').addEventListener('change', checkInstalled);
    return () => {
      window.removeEventListener('appinstalled', checkInstalled);
      window.matchMedia('(display-mode: standalone)').removeEventListener('change', checkInstalled);
    };
  }, []);

  const handleInstallClick = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      // optional: reset so prompt can re-fire later if dismissed
      setInstallPromptEvent(null);
    }
  };

  // Simple diary text parser
  const parseDiaryFromText = (text: string): { date?: Date; chapter?: string; content?: string } => {
    let date: Date | undefined;
    let chapter: string | undefined;
    let content = text.trim();

    const isoMatch = text.match(/(20\d{2}-\d{2}-\d{2})/);
    if (isoMatch) {
      const d = new Date(isoMatch[1]);
      if (!isNaN(d.getTime())) {
        date = d;
        content = content.replace(isoMatch[1], '').trim();
      }
    } else {
      const dmyMatch = text.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
      if (dmyMatch) {
        const day = parseInt(dmyMatch[1], 10);
        const month = parseInt(dmyMatch[2], 10) - 1;
        const year = parseInt(dmyMatch[3], 10);
        const d = new Date(year, month, day);
        if (!isNaN(d.getTime())) {
          date = d;
          content = content.replace(dmyMatch[0], '').trim();
        }
      }
    }

    const bracket = text.match(/\[(.*?)\]/);
    if (bracket && bracket[1]) {
      chapter = bracket[1].trim();
      content = content.replace(bracket[0], '').trim();
    } else {
      const chapterColon = text.match(/(?:^|\s)Chapter\s*:\s*([^\n]+)/i);
      if (chapterColon && chapterColon[1]) {
        chapter = chapterColon[1].trim();
        content = content.replace(chapterColon[0], '').trim();
      }
    }

    return { date, chapter, content };
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  // Render main app UI regardless of auth status (sign-in removed)

  return (
    <SpeechProvider>
    <div className="min-h-screen bg-black relative">
      {/* Top Row: Hamburger, Gabby Image (center), Comment Button (all perfectly aligned) */}
      <div className="flex items-center justify-between w-full max-w-4xl mx-auto mb-6 relative z-40" style={{ minHeight: '64px', marginTop: '30px' }}>
        {/* Hamburger Menu (left) */}
        <div className="flex-shrink-0 flex items-center justify-start" style={{ minWidth: '64px', marginTop: '70px', marginLeft: '10px' }}>
          <Header />
        </div>
        {/* Gabby Image (center) */}
        <div className="flex-shrink-0 flex items-center justify-center" style={{ flex: 1, marginLeft: '30px' }}>
          <button
            onClick={handleGabbyChatClick}
            className="relative w-16 h-16 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl"
            style={{
              background: 'transparent',
              border: '2px solid #808080',
              boxShadow: 'none',
              filter: 'none',
              transform: 'none'
            }}
          >
            {/* Gabby Image Overlay */}
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <img src="/Gabby.jpg" alt="Gabby" className="w-full h-full object-cover" />
            </div>
          </button>
        </div>
        {/* Comment Button (right) */}
        <div className="flex-shrink-0 flex items-center justify-end" style={{ minWidth: '120px', marginRight: '20px' }}>
          <button
            onClick={async () => {
              const event = new CustomEvent('triggerSaveComment');
              window.dispatchEvent(event);
            }}
            className="glassy-btn neon-grid-btn px-4 py-2 rounded-lg text-sm font-bold flex items-center justify-center transition-all duration-200 shadow-lg active:scale-95"
            style={{
              minWidth: '100px',
              minHeight: '40px',
              fontSize: '18px',
              fontWeight: 700,
              background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
              border: '1px solid #888',
              color: 'white',
              marginRight: '20px'
            }}
          >
            Comment
          </button>
        </div>
      </div>
      {/* Main Content */}
      <div className="pt-20 pb-8 px-4 relative">
        {/* Comment/Report Button - top right of main content area, outside MessageBox and its container */}
        {/* This button is now floated to the top right */}
        <div className="relative w-full max-w-4xl mx-auto" style={{ marginTop: '-70px' }}>
          {/* Main Content */}
          <MessageBox 
            value={message} 
            onChange={(e) => setMessage(e.target.value)}
            uploadedImage={uploadedImage}
            setUploadedImage={setUploadedImage}
            onShowImageChoice={handleShowImageChoice}
            onGalleryUpload={handleGalleryUpload}
            onCameraCapture={handleCameraCapture}
            language={language}
            onLanguageChange={handleLanguageChange}
            showMic={true}
            onMicClick={() => {}}
          />
          {/* Remove StandaloneSttButton from here */}
          <CommandButtons 
            message={message} 
            setMessage={setMessage} 
          />

          {/* PWA Install Prompt (manual) */}
          {showInstallPrompt && !isAppInstalled && (
            <div className="fixed top-6 right-6 z-[9999]">
              <div className="glassy-btn neon-grid-btn rounded-2xl border-0 p-4 min-w-[220px] max-w-[90vw] ring-2 ring-blue-400 ring-opacity-60 shadow-xl flex items-center gap-3 animate-bounce">
                <span className="text-2xl">📲</span>
                <span className="text-base font-semibold text-white">Install Gabby to Home Screen</span>
                <button
                  className="ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition"
                  onClick={handleInstallClick}
                >
                  Install
                </button>
              </div>
            </div>
          )}

          {/* Installing overlay used right after signup */}
          {showInstallingOverlay && !isAppInstalled && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center">
              <div 
                className="glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[280px] max-w-[90vw] ring-2 ring-blue-400 ring-opacity-60 text-center"
                style={{
                  background: 'linear-gradient(135deg, rgba(0,0,0,0.95), rgba(0,0,0,0.85), rgba(59,130,246,0.2))',
                  backdropFilter: 'blur(20px)',
                  border: '2px solid rgba(255,255,255,0.4)'
                }}
              >
                <div className="text-4xl mb-3 animate-spin">📲</div>
                <div className="text-white font-bold">App installing…</div>
                <div className="text-gray-300 text-sm mt-1">Follow the browser prompt to add to your Home Screen</div>
              </div>
            </div>
          )}

          <AppGrid 
            onAskAIClick={handleAskAI}
            onTranslateClick={handleTranslateClick}
            onRewriteClick={handleRewriteClick}
            onDiaryClick={() => setIsDiaryModalOpen(true)}
            onCalendarClick={() => {
              if (message && message.trim().length > 0) {
                const parsed = parseDiaryFromText(message);
                setDiaryPrefill(parsed);
                setIsDiaryModalOpen(true);
              } else {
                setIsCalendarModalOpen(true);
              }
            }}
            onExpenseClick={handleExpenseClick}
            onTodoClick={handleTodoClick}
            onShoppingClick={handleShoppingListClick}
            onImageToTextClick={handleImageToTextClick}
            onPdfReaderClick={handlePdfReaderClick}
            onMeetingMinutesClick={() => {}}
            onSmartMeetingRecorderClick={handleSmartMeetingRecorderClick}
            onImageGeneratorClick={() => setIsImageGeneratorModalOpen(true)}
            onExpenseJournalClick={() => {}}
            onTokenDashboardClick={() => {}}
            onAdminDashboardClick={() => setIsAdminDashboardOpen(true)}
          />
        </div>
      </div>

      {/* Modals */}
      <>
        <TranslateModal 
          isOpen={isTranslateModalOpen} 
          onClose={() => setIsTranslateModalOpen(false)}
          currentText={message}
        />
        
        <RewriteModal 
          isOpen={isRewriteModalOpen} 
          onClose={() => setIsRewriteModalOpen(false)}
          currentText={message}
          onTextChange={setMessage}
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
          initialInput=""
        />
        
        <ShoppingListModal 
          isOpen={isShoppingListModalOpen} 
          onClose={() => setIsShoppingListModalOpen(false)}
          currentLanguage={language}
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
        
        <CalendarModal 
          isOpen={isCalendarModalOpen} 
          onClose={() => setIsCalendarModalOpen(false)}
        />
        
        <DiaryModal 
          isOpen={isDiaryModalOpen} 
          onClose={() => setIsDiaryModalOpen(false)}
          currentText={message}
          initialDate={diaryPrefill.date}
          initialChapter={diaryPrefill.chapter}
          initialContent={diaryPrefill.content}
        />
        
        <VoiceOnlyChatModal isOpen={isVoiceChatOpen} onClose={() => setIsVoiceChatOpen(false)} language={language} />
        
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
        
        {/* Real-time Confirmation Modal */}
        <RealtimeConfirmationModal
          isOpen={showRealtimeConfirmation}
          onConfirm={handleRealtimeConfirm}
          onCancel={handleRealtimeCancel}
          matchedTriggers={realtimeMatchedTriggers}
        />
        
        {/* AI Processing Indicator */}
        {isProcessingAI && (
          <div 
            className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9998]"
            style={{ animation: 'fadeInUp 0.3s ease-out' }}
          >
            <div 
              className="glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ring-blue-400 ring-opacity-60 text-center"
              style={{
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.2))',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                transform: 'translateZ(30px) perspective(1000px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
            >
              <div 
                className="text-4xl mb-4 animate-spin"
                style={{
                  filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                  textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                  transform: 'translateZ(10px)'
                }}
              >
                🤖
              </div>
              <p 
                className="text-white font-bold text-lg"
                style={{
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                  filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                  transform: 'translateZ(5px)'
                }}
              >
                Processing your question...
              </p>
              <p 
                className="text-gray-300 text-sm mt-2"
                style={{
                  textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                  filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.3))',
                  transform: 'translateZ(2px)'
                }}
              >
                Please wait while I generate a response
              </p>
            </div>
          </div>
        )}
        
        {/* Styled Notification */}
        {notification && (
          <StyledNotification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {/* Image Choice Modal */}
        <ImageChoiceModal
          isOpen={showImageChoice}
          onClose={handleCloseImageChoice}
          onGalleryUpload={handleGalleryUpload}
          onCameraCapture={handleCameraCapture}
        />
      </>

      </div>
    </SpeechProvider>

  );
}