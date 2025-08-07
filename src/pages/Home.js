import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
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
const StyledNotification = ({ message, type, onClose }) => {
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
    return (_jsx("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]", style: { animation: 'fadeInUp 0.3s ease-out' }, children: _jsx("div", { className: `glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ${colors.ring} ring-opacity-60`, style: {
                background: `linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), ${colors.bg})`,
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                filter: `drop-shadow(0 0 10px ${colors.ring.includes('green') ? 'rgba(34, 197, 94, 0.5)' : colors.ring.includes('red') ? 'rgba(239, 68, 68, 0.5)' : 'rgba(59, 130, 246, 0.5)'})`,
                transform: 'translateZ(30px) perspective(1000px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }, children: _jsxs("div", { className: "flex items-center gap-4", children: [_jsx("div", { className: "text-3xl", style: {
                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                            textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                            transform: 'translateZ(10px)'
                        }, children: getIcon() }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-white font-bold text-lg", style: {
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                transform: 'translateZ(5px)'
                            }, children: message }) }), _jsx("button", { onClick: onClose, className: "w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button", style: {
                            border: '1px solid rgba(255, 255, 255, 0.4)',
                            background: 'rgba(0, 0, 0, 0.6)',
                            backdropFilter: 'blur(10px)',
                            fontSize: '15px'
                        }, children: "\u00D7" })] }) }) }));
};
const availableLanguages = [
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
export default function Home({ onShowAuth }) {
    const { user, loading } = useAuth();
    const [message, setMessage] = useState('');
    const [language, setLanguage] = useState('en-US');
    const [_languages, setLanguages] = useState([]);
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
    const [_excelFile, _setExcelFile] = useState(null); // Changed type to any
    const [_selectedModel, _setSelectedModel] = useState('openai/gpt-4o');
    const [notification, setNotification] = useState(null);
    const [showRealtimeConfirmation, setShowRealtimeConfirmation] = useState(false);
    const [pendingQuestion, setPendingQuestion] = useState('');
    const [realtimeMatchedTriggers, setRealtimeMatchedTriggers] = useState([]);
    const [isProcessingAI, setIsProcessingAI] = useState(false);
    const [uploadedImage, setUploadedImage] = useState(null);
    const [showImageChoice, setShowImageChoice] = useState(false);
    const [installPromptEvent, setInstallPromptEvent] = useState(null);
    const [showInstallPrompt, setShowInstallPrompt] = useState(false);
    const [isAppInstalled, setIsAppInstalled] = useState(false);
    // AI Processing Functions
    const processAIQuestion = async (question) => {
        setIsProcessingAI(true);
        try {
            console.log('🤖 Processing AI question:', question);
            console.log('📷 Uploaded image:', uploadedImage ? 'Yes' : 'No');
            // Send question with image if available
            const result = await AskMeLogic.sendQuestionToAI(question, uploadedImage?.file);
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
            }
            else {
                setNotification({
                    message: result.error || 'Failed to get AI response',
                    type: 'error'
                });
                setTimeout(() => setNotification(null), 5000);
            }
        }
        catch (error) {
            console.error('❌ Error processing AI question:', error);
            setNotification({
                message: 'Failed to process AI question. Please try again.',
                type: 'error'
            });
            setTimeout(() => setNotification(null), 5000);
        }
        finally {
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
        }
        else {
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
        window.triggerAskAI = handleAskAI;
        return () => {
            delete window.triggerAskAI;
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
        const galleryInput = document.querySelector('input[type="file"]:not([capture])');
        if (galleryInput) {
            galleryInput.click();
        }
    };
    const handleCameraCapture = () => {
        setShowImageChoice(false);
        // Trigger the MessageBox's camera input
        const cameraInput = document.querySelector('input[type="file"][capture]');
        if (cameraInput) {
            cameraInput.click();
        }
    };
    // Language change handler
    const handleLanguageChange = (newLanguage) => {
        setLanguage(newLanguage);
    };
    // Initialize languages on component mount
    useEffect(() => {
        setLanguages(availableLanguages);
    }, []);
    useEffect(() => {
        const handler = (e) => {
            e.preventDefault();
            setInstallPromptEvent(e);
            setShowInstallPrompt(true);
        };
        window.addEventListener('beforeinstallprompt', handler);
        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);
    // Detect if app is installed (standalone mode)
    useEffect(() => {
        const checkInstalled = () => {
            const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
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
            // Do not hide the prompt if dismissed; only hide if installed
        }
    };
    if (loading) {
        return (_jsx("div", { className: "h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black", children: _jsx("div", { className: "text-white text-xl", children: "Loading..." }) }));
    }
    if (!user) {
        return (_jsx("div", { className: "h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 to-black text-white", children: _jsxs("div", { className: "text-center", children: [_jsx("h1", { className: "text-2xl mb-4", children: "Please sign in to continue" }), _jsx("button", { onClick: onShowAuth, className: "px-6 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors", children: "Sign In" })] }) }));
    }
    return (_jsxs("div", { className: "min-h-screen bg-black relative", children: [_jsx("div", { className: "fixed top-4 left-1/2 transform -translate-x-1/2 z-40", children: _jsx("button", { onClick: handleGabbyChatClick, className: "relative w-16 h-16 rounded-full transition-all duration-300 hover:scale-110 shadow-2xl", style: {
                        background: 'transparent',
                        border: '2px solid #808080',
                        boxShadow: 'none',
                        filter: 'none',
                        transform: 'none'
                    }, children: _jsx("div", { className: "absolute inset-0 rounded-full overflow-hidden", children: _jsx("img", { src: "/Gabby.jpg", alt: "Gabby Chat", className: "w-full h-full object-cover" }) }) }) }), _jsxs("div", { className: "pt-20 pb-8 px-4", children: [_jsx(Header, { onDashboardClick: () => { }, onAdminDashboardClick: () => setIsAdminDashboardOpen(true) }), _jsxs("div", { className: "max-w-4xl mx-auto", children: [_jsx(MessageBox, { value: message, onChange: (e) => setMessage(e.target.value), uploadedImage: uploadedImage, setUploadedImage: setUploadedImage, onShowImageChoice: handleShowImageChoice, onGalleryUpload: handleGalleryUpload, onCameraCapture: handleCameraCapture, language: language, onLanguageChange: handleLanguageChange }), _jsx(CommandButtons, { message: message, setMessage: setMessage }), _jsx("div", { className: "w-full flex justify-end mb-2", children: _jsxs("span", { className: "text-xs text-gray-400 bg-black/60 px-2 py-1 rounded shadow", children: ["Build: ", __BUILD_TIMESTAMP__] }) }), showInstallPrompt && !isAppInstalled && (_jsx("div", { className: "fixed top-6 right-6 z-[9999]", children: _jsxs("div", { className: "glassy-btn neon-grid-btn rounded-2xl border-0 p-4 min-w-[220px] max-w-[90vw] ring-2 ring-blue-400 ring-opacity-60 shadow-xl flex items-center gap-3 animate-bounce", children: [_jsx("span", { className: "text-2xl", children: "\uD83D\uDCF2" }), _jsx("span", { className: "text-base font-semibold text-white", children: "Install Gabby to Home Screen" }), _jsx("button", { className: "ml-4 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow transition", onClick: handleInstallClick, children: "Install" })] }) })), _jsx(AppGrid, { onAskAIClick: handleAskAI, onTranslateClick: handleTranslateClick, onRewriteClick: handleRewriteClick, onDiaryClick: () => setIsDiaryModalOpen(true), onCalendarClick: () => setIsCalendarModalOpen(true), onExpenseClick: handleExpenseClick, onTodoClick: handleTodoClick, onShoppingClick: handleShoppingListClick, onImageToTextClick: handleImageToTextClick, onPdfReaderClick: handlePdfReaderClick, onMeetingMinutesClick: () => { }, onSmartMeetingRecorderClick: handleSmartMeetingRecorderClick, onImageGeneratorClick: () => setIsImageGeneratorModalOpen(true), onExpenseJournalClick: () => { }, onTokenDashboardClick: () => { }, onAdminDashboardClick: () => setIsAdminDashboardOpen(true) })] })] }), _jsxs(_Fragment, { children: [_jsx(TranslateModal, { isOpen: isTranslateModalOpen, onClose: () => setIsTranslateModalOpen(false), currentText: message }), _jsx(RewriteModal, { isOpen: isRewriteModalOpen, onClose: () => setIsRewriteModalOpen(false), currentText: message, onTextChange: setMessage }), _jsx(ImageToTextModal, { isOpen: isImageToTextModalOpen, onClose: () => setIsImageToTextModalOpen(false) }), _jsx(PdfReaderModal, { isOpen: isPdfReaderModalOpen, onClose: () => setIsPdfReaderModalOpen(false) }), _jsx(TodoModal, { isOpen: isTodoModalOpen, onClose: () => setIsTodoModalOpen(false), initialInput: "" }), _jsx(ShoppingListModal, { isOpen: isShoppingListModalOpen, onClose: () => setIsShoppingListModalOpen(false), currentLanguage: language }), _jsx(ExpenseModal, { isOpen: isExpenseModalOpen, onClose: () => setIsExpenseModalOpen(false), currentLanguage: language }), _jsx(SmartMeetingRecorder, { isOpen: isSmartMeetingRecorderOpen, onClose: () => setIsSmartMeetingRecorderOpen(false) }), _jsx(CalendarModal, { isOpen: isCalendarModalOpen, onClose: () => setIsCalendarModalOpen(false) }), _jsx(DiaryModal, { isOpen: isDiaryModalOpen, onClose: () => setIsDiaryModalOpen(false), currentText: message }), _jsx(GabbyChatModal, { isOpen: isGabbyChatModalOpen, onClose: () => setIsGabbyChatModalOpen(false), language: language }), _jsx(ImageGeneratorModal, { isOpen: isImageGeneratorModalOpen, onClose: () => setIsImageGeneratorModalOpen(false) }), _jsx(AdminDashboard, { isOpen: isAdminDashboardOpen, onClose: () => setIsAdminDashboardOpen(false) }), _jsx(RealtimeConfirmationModal, { isOpen: showRealtimeConfirmation, onConfirm: handleRealtimeConfirm, onCancel: handleRealtimeCancel, matchedTriggers: realtimeMatchedTriggers }), isProcessingAI && (_jsx("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9998]", style: { animation: 'fadeInUp 0.3s ease-out' }, children: _jsxs("div", { className: "glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ring-blue-400 ring-opacity-60 text-center", style: {
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.2))',
                                backdropFilter: 'blur(20px)',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                                transform: 'translateZ(30px) perspective(1000px)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }, children: [_jsx("div", { className: "text-4xl mb-4 animate-spin", style: {
                                        filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                                        textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                                        transform: 'translateZ(10px)'
                                    }, children: "\uD83E\uDD16" }), _jsx("p", { className: "text-white font-bold text-lg", style: {
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                        transform: 'translateZ(5px)'
                                    }, children: "Processing your question..." }), _jsx("p", { className: "text-gray-300 text-sm mt-2", style: {
                                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.6)',
                                        filter: 'drop-shadow(0 0 1px rgba(255, 255, 255, 0.3))',
                                        transform: 'translateZ(2px)'
                                    }, children: "Please wait while I generate a response" })] }) })), notification && (_jsx(StyledNotification, { message: notification.message, type: notification.type, onClose: () => setNotification(null) })), _jsx(ImageChoiceModal, { isOpen: showImageChoice, onClose: handleCloseImageChoice, onGalleryUpload: handleGalleryUpload, onCameraCapture: handleCameraCapture })] })] }));
}
