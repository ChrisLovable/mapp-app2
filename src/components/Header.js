import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
// Temporary Overlay Component for UI Positioning
const TempOverlay = ({ isVisible, activeOverlay, playAudioAndShowOverlay }) => {
    if (!isVisible)
        return null;
    return (_jsxs("div", { className: "absolute inset-0 z-[9998] pointer-events-none", children: [_jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '-5px',
                    left: '10px',
                    width: '40px',
                    height: '40px',
                    border: '3px solid red',
                    borderRadius: '6px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/hamburger.mp3', 'hamburger') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '155px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '250px',
                    height: '40px',
                    border: '3px solid red',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/textboxbuttons.mp3', 'textinput') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '250px',
                    left: 'calc(50% - 110px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/AskAI.mp3', 'askai') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '250px',
                    left: 'calc(50% - 35px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/diaryfunction.mp3', 'diary') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '250px',
                    left: 'calc(50% + 40px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/calendarfunc.mp3', 'calendar') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '308px',
                    left: 'calc(50% - 110px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/expensefunctionality.mp3', 'expenses') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '308px',
                    left: 'calc(50% - 35px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/todo.mp3', 'todo') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '308px',
                    left: 'calc(50% + 40px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/shoppingfunctionality.mp3', 'shopping') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '366px',
                    left: 'calc(50% - 110px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/meetingfunctionality.mp3', 'smartrecorder') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '366px',
                    left: 'calc(50% - 35px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/rewritefunctionality.mp3', 'rewrite') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '366px',
                    left: 'calc(50% + 40px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/translatefunctionality.mp3', 'translate') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '424px',
                    left: 'calc(50% - 110px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/imagetotext.mp3', 'imagetotext') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '424px',
                    left: 'calc(50% - 35px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/pdffunctionality.mp3', 'readpdf') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '424px',
                    left: 'calc(50% + 40px)',
                    width: '70px',
                    height: '49px',
                    border: '3px solid red',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/aiimage.mp3', 'aiimage') }), _jsx("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                    top: '207px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '250px',
                    height: '40px',
                    border: '3px solid red',
                    borderRadius: '10px',
                    backgroundColor: 'rgba(255, 0, 0, 0.3)'
                }, onClick: () => playAudioAndShowOverlay('/copypaste.mp3', 'copypaste') })] }));
};
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
                            backdropFilter: 'blur(10px)'
                        }, children: "\u00D7" })] }) }) }));
};
// UI Interface Modal Component
const UIModal = ({ isOpen, onClose }) => {
    const [showOverlay, setShowOverlay] = useState(true);
    const [activeOverlay, setActiveOverlay] = useState(null);
    const [currentAudio, setCurrentAudio] = useState(null);
    const stopCurrentAudio = () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            setCurrentAudio(null);
        }
    };
    const playAudioAndShowOverlay = (audioSrc, overlayId) => {
        stopCurrentAudio();
        const audio = new Audio(audioSrc);
        audio.play().catch(e => console.log('Audio play failed:', e));
        setCurrentAudio(audio);
        setActiveOverlay(overlayId);
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[9999] flex items-start justify-center pt-4", style: {
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(10px)'
        }, onClick: onClose, children: _jsx("div", { className: "relative overflow-auto", onClick: (e) => e.stopPropagation(), style: {
                animation: 'fadeInUp 0.3s ease-out',
                width: '85vw',
                height: '90vh'
            }, children: _jsxs("div", { className: "rounded-2xl border-0 p-6 h-full", style: {
                    background: 'rgba(0, 0, 0, 0.9)',
                    border: '2px solid rgba(255, 255, 255, 0.8)',
                    boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                    transition: 'all 0.3s ease',
                    height: '100%'
                }, children: [_jsxs("div", { className: "absolute left-0 right-0 px-4 py-3 glassy-btn", style: {
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                            borderBottom: '2px solid rgba(255, 255, 255, 0.4)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(10px)',
                            textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                            filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                            transform: 'translateZ(5px) translateX(-50%)',
                            borderRadius: '10px',
                            top: '10px',
                            left: '50%',
                            width: '95%'
                        }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                                    textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                    filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                    transform: 'translateZ(3px)'
                                }, children: "\uD83D\uDCDA User Interface Guide" }), _jsx("button", { onMouseDown: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('X button clicked!');
                                    onClose();
                                }, onTouchStart: (e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    console.log('X button touched!');
                                    onClose();
                                }, className: "absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors z-[999999] pointer-events-auto", style: {
                                    background: 'rgba(0, 0, 0, 0.9)',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    pointerEvents: 'auto'
                                }, children: "\u00D7" })] }), currentAudio && (_jsx("div", { className: "fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]", style: { animation: 'fadeInUp 0.3s ease-out' }, children: _jsx("div", { className: "glassy-btn neon-grid-btn rounded-xl border-0 p-3 min-w-[120px] max-w-[90vw] ring-2 ring-blue-400 ring-opacity-60", style: {
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.2))',
                                backdropFilter: 'blur(20px)',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                                transform: 'translateZ(30px) perspective(1000px)',
                                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                            }, children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("div", { className: "text-lg", style: {
                                            filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                                            textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                                            transform: 'translateZ(10px)'
                                        }, children: "\u23F9\uFE0F" }), _jsx("div", { className: "flex-1", children: _jsx("p", { className: "text-white font-bold text-sm", style: {
                                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                                transform: 'translateZ(5px)'
                                            }, children: "Stop Audio" }) }), _jsx("button", { onClick: () => {
                                            if (currentAudio) {
                                                currentAudio.pause();
                                                currentAudio.currentTime = 0;
                                                setCurrentAudio(null);
                                            }
                                            setActiveOverlay(null);
                                        }, className: "w-6 h-6 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button text-sm", style: {
                                            border: '1px solid rgba(255, 255, 255, 0.4)',
                                            background: 'rgba(0, 0, 0, 0.6)',
                                            backdropFilter: 'blur(10px)'
                                        }, children: "\u00D7" })] }) }) })), _jsxs("div", { className: "pt-16", children: [_jsx("p", { className: "text-gray-300 text-sm mb-4 text-center", children: "Click on any button to play an audio file explaining its use and functionality" }), _jsxs("div", { className: "absolute cursor-pointer pointer-events-auto", style: {
                                    top: '205px',
                                    left: '50%',
                                    transform: 'translateX(-50%)',
                                    width: '80px',
                                    height: '80px',
                                    borderRadius: '50%',
                                    overflow: 'hidden',
                                    zIndex: 10000,
                                    backgroundColor: 'rgba(255, 255, 255, 0.2)'
                                }, onClick: () => playAudioAndShowOverlay('/gabbyintro.mp3', 'gabby'), children: [_jsx("img", { src: "/Gabby.jpg", alt: "Gabby", className: "w-full h-full object-cover", onError: (e) => {
                                            console.log('Image failed to load:', e);
                                            e.target.style.display = 'none';
                                        }, onLoad: () => console.log('Image loaded successfully') }), _jsx("div", { className: "absolute inset-0", style: {
                                            border: '3px solid red',
                                            backgroundColor: 'rgba(255, 0, 0, 0.3)',
                                            borderRadius: '50%'
                                        } })] }), _jsx("div", { className: "flex justify-center relative", children: _jsxs("div", { className: "relative", children: [_jsx("img", { src: "/userinterface.jpg", alt: "User Interface Guide", className: "max-w-full rounded-lg", style: {
                                                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5), 0 5px 15px rgba(0, 0, 0, 0.3)',
                                                border: '2px solid rgba(255, 255, 255, 0.2)',
                                                height: 'calc(90vh - 200px)',
                                                objectFit: 'contain'
                                            } }), _jsx(TempOverlay, { isVisible: true, activeOverlay: activeOverlay, playAudioAndShowOverlay: playAudioAndShowOverlay })] }) })] })] }) }) }));
};
const menuOptions = [
    { label: 'Instructions', icon: '📚', action: 'instructions' },
    { label: 'Dashboard', icon: '📊', action: 'admin' },
    { label: 'Personalization', icon: '🎨', action: 'personalization' },
    { label: 'User Preferences', icon: '⚙️', action: 'preferences' },
    { label: 'Log Out', icon: '🚪', action: 'logout' }
];
const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, children }) => {
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 z-[9999] flex items-center justify-center", style: { background: 'rgba(0, 0, 0, 0.8)', backdropFilter: 'blur(10px)' }, children: _jsxs("div", { className: "glassy-btn neon-grid-btn rounded-2xl border-0 p-6 w-full max-w-sm shadow-lg shadow-blue-500/50", style: {
                animation: 'fadeInUp 0.3s ease-out',
                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.95), rgba(0, 0, 0, 0.8), rgba(59, 130, 246, 0.2))',
                backdropFilter: 'blur(20px)',
                border: '2px solid rgba(255, 255, 255, 0.4)',
                boxShadow: '0 25px 50px rgba(0, 0, 0, 0.8), 0 15px 30px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.4), inset 0 2px 0 rgba(255, 255, 255, 0.3), inset 0 -2px 0 rgba(0, 0, 0, 0.4)',
                filter: 'drop-shadow(0 0 10px rgba(59, 130, 246, 0.5))',
                transform: 'translateZ(30px) perspective(1000px)',
                transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
            }, children: [_jsxs("div", { className: "flex items-center gap-4 mb-4", children: [_jsx("div", { className: "text-3xl", style: {
                                filter: 'drop-shadow(0 0 8px rgba(255, 255, 255, 0.6)) drop-shadow(0 0 16px rgba(255, 255, 255, 0.4))',
                                textShadow: '0 0 10px rgba(255, 255, 255, 0.8), 0 0 20px rgba(255, 255, 255, 0.6)',
                                transform: 'translateZ(10px)'
                            }, children: '❓' }), _jsx("h2", { className: "text-white text-xl font-bold", style: { textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))', transform: 'translateZ(5px)' }, children: title })] }), _jsx("div", { className: "text-gray-300 mb-6 text-center", children: children }), _jsxs("div", { className: "flex justify-end gap-4", children: [_jsx("button", { onClick: onClose, className: "px-4 py-2 rounded-lg glassy-btn neon-grid-btn text-white font-bold transition-colors border-0", style: { background: '#222', minWidth: 90 }, children: "Cancel" }), _jsx("button", { onClick: onConfirm, className: "px-4 py-2 rounded-lg glassy-btn neon-grid-btn text-white font-bold transition-colors border-0", style: { background: '#e11d48', minWidth: 90 }, children: "Confirm" })] })] }) }));
};
export default function Header({ onDashboardClick, onAdminDashboardClick }) {
    const { signOut } = useAuth();
    const [open, setOpen] = useState(false);
    const [showUIModal, setShowUIModal] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [showOverlay, setShowOverlay] = useState(false);
    const [notification, setNotification] = useState(null);
    const menuRef = useRef(null);
    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };
    const confirmLogout = async () => {
        await signOut();
        setShowLogoutConfirm(false);
        showNotification('You have been logged out.', 'info');
    };
    const showNotification = (message, type) => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000); // Auto-close after 3 seconds
    };
    const handleMenuClick = (action) => {
        setOpen(false);
        if (action === 'dashboard') {
            onDashboardClick();
        }
        else if (action === 'admin' && onAdminDashboardClick) {
            onAdminDashboardClick();
        }
        else if (action === 'preferences') {
            showNotification('This feature coming soon!', 'info');
        }
        else if (action === 'personalization') {
            showNotification('This feature coming soon!', 'info');
        }
        else if (action === 'instructions') {
            setShowUIModal(true);
        }
        else if (action === 'logout') {
            handleLogout();
        }
        // Add other actions as needed
    };
    // Handle clicking outside the menu to close it
    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setOpen(false);
            }
        }
        if (open) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        else {
            document.removeEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [open]);
    return (_jsxs("div", { className: "relative flex items-center justify-center", children: [_jsxs("div", { className: "absolute top-0 flex items-center h-full", ref: menuRef, style: { width: '80vw', left: '30px', top: '-50px' }, children: [_jsxs("button", { className: "glassy-btn neon-grid-btn p-2 rounded-lg border-0 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-blue-400 mt-4 active:scale-95 relative overflow-visible", style: {
                            border: '2px solid rgba(255, 255, 255, 0.4)',
                            position: 'relative',
                            zIndex: 2,
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.8))',
                            backdropFilter: 'blur(10px)',
                            boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                            filter: 'drop-shadow(0 0 10px rgba(30, 58, 138, 0.5))',
                            transform: 'translateZ(10px)'
                        }, onClick: () => setOpen((v) => !v), "aria-label": "Open menu", children: [_jsx("span", { className: "block w-5 h-0.5 mb-1 rounded", style: { background: 'white', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))' } }), _jsx("span", { className: "block w-5 h-0.5 mb-1 rounded", style: { background: 'white', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))' } }), _jsx("span", { className: "block w-5 h-0.5 rounded", style: { background: 'white', filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.8))' } })] }), open && (_jsx("div", { className: "absolute left-0 mt-64 w-48 bg-black/90 border border-white rounded-xl z-[1000] animate-fade-in", style: {
                            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.9), 0 10px 25px rgba(0, 0, 0, 0.7), 0 5px 15px rgba(0, 0, 0, 0.5), 0 0 0 2px rgba(59, 130, 246, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                            backdropFilter: 'blur(30px)',
                            background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.85), rgba(0, 0, 0, 0.65), rgba(59, 130, 246, 0.1))',
                            transform: 'perspective(1200px) rotateX(8deg) rotateY(-2deg)',
                            transformOrigin: 'top center',
                            border: '1px solid rgba(255, 255, 255, 0.2)',
                            borderRadius: '16px'
                        }, children: menuOptions.map((opt) => (_jsx("div", { children: _jsx("div", { className: "flex items-center justify-between gap-2 px-4 py-3 hover:bg-blue-600/30 cursor-pointer text-white text-sm rounded-xl transition-all", style: {
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.2)',
                                    border: '1px solid rgba(59, 130, 246, 0.3)',
                                    background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5), rgba(59, 130, 246, 0.1))',
                                    backdropFilter: 'blur(15px)',
                                    borderRadius: '12px',
                                    margin: '2px 4px',
                                    transform: 'translateZ(0)',
                                    transition: 'all 0.3s ease'
                                }, onClick: () => handleMenuClick(opt.action), children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-xl", style: {
                                                backgroundColor: opt.label === 'Dashboard' ? 'rgba(0, 0, 0, 0.8)' : 'transparent',
                                                borderRadius: opt.label === 'Dashboard' ? '4px' : '0',
                                                padding: opt.label === 'Dashboard' ? '2px' : '0'
                                            }, children: opt.icon }), _jsx("span", { children: opt.label })] }) }) }, opt.label))) }))] }), _jsx("div", { className: "w-full text-center font-bold text-2xl drop-shadow-md relative flex flex-col items-center justify-center" }), notification && (_jsx(StyledNotification, { message: notification.message, type: notification.type, onClose: () => setNotification(null) })), _jsx(UIModal, { isOpen: showUIModal, onClose: () => setShowUIModal(false) }), _jsx(ConfirmationModal, { isOpen: showLogoutConfirm, onClose: () => setShowLogoutConfirm(false), onConfirm: confirmLogout, title: "Confirm Log Out", children: "Are you sure you want to log out?" })] }));
}
