import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import AppGrid from '../components/AppGrid';
import MessageBox from '../components/MessageBox';
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
import GabbyChatModal from '../components/GabbyChatModal';

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

  const [_isAlarmModalOpen, _setIsAlarmModalOpen] = useState(false);
  const [_isAlarmPopupOpen, _setIsAlarmPopupOpen] = useState(false);
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
  const [isGabbyChatModalOpen, setIsGabbyChatModalOpen] = useState(false);
  const [_isTokenDashboardOpen, _setIsTokenDashboardOpen] = useState(false);
  const [_excelFile, _setExcelFile] = useState<any | null>(null); // Changed type to any

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
    setIsGabbyChatModalOpen(true);
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
      setShowInstallPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = () => {
    if (installPromptEvent) {
      installPromptEvent.prompt();
      installPromptEvent.userChoice.then(() => {
        setShowInstallPrompt(false);
        setInstallPromptEvent(null);
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white">
        <div className="text-center">
          <h1 className="text-2xl mb-4">Please sign in to continue</h1>
          <button 
            onClick={onShowAuth}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative">
      {/* Gabby Chat Button - Floating */}
      <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-40">
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
            <img 
              src="/Gabby.jpg"
              alt="Gabby Chat" 
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>





      {/* Main Content */}
      <div className="pt-20 pb-8 px-4">
        <Header onDashboardClick={() => {}} onAdminDashboardClick={() => setIsAdminDashboardOpen(true)} />
        
        <div className="max-w-4xl mx-auto">
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
          />
          <CommandButtons 
            message={message} 
            setMessage={setMessage} 
          />

          {/* Build timestamp above grid buttons */}
          <div className="w-full flex justify-end mb-2">
            <span className="text-xs text-gray-400 bg-black/60 px-2 py-1 rounded shadow">
              Build: {__BUILD_TIMESTAMP__}
            </span>
          </div>

          {/* PWA Install Prompt */}
          {showInstallPrompt && (
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

          <AppGrid 
            onAskAIClick={handleAskAI}
            onTranslateClick={handleTranslateClick}
            onRewriteClick={handleRewriteClick}
            onDiaryClick={() => setIsDiaryModalOpen(true)}
            onCalendarClick={() => setIsCalendarModalOpen(true)}
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
        />
        
        <GabbyChatModal 
          isOpen={isGabbyChatModalOpen} 
          onClose={() => setIsGabbyChatModalOpen(false)}
          language={language}
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

  );
}