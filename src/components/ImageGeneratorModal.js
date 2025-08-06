import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import React, { useState, useRef, useEffect } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaDownload, FaSave, FaUpload, FaImage, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { SpeechToTextButton } from './SpeechToTextButton';
import { openAIImageService } from '../lib/OpenAIImageService';
// Style categories data
const styleCategories = [
    {
        id: 'none',
        name: 'No Style - User Description Only',
        description: 'Use only your text description without any specific style'
    },
    {
        id: 'photorealistic',
        name: 'Photorealistic',
        description: 'Ultra-realistic photographic styles',
        subcategories: [
            'Ultra Realistic',
            'Cinematic',
            'Film Noir',
            'Portrait Photography',
            'Fashion Photography',
            'Macro Photography',
            'HDR (High Dynamic Range)',
            'Vintage/Retro Photo'
        ]
    },
    {
        id: 'cartoon',
        name: 'Cartoon & Comic',
        description: 'Various cartoon and comic book styles',
        subcategories: [
            'Classic Cartoon',
            '3D Toon',
            'American Comic Book',
            'Manga',
            'Webtoon',
            'Chibi Style',
            'Sunday Newspaper Comic'
        ]
    },
    {
        id: 'anime',
        name: 'Anime',
        description: 'Japanese animation styles',
        subcategories: [
            'Modern Anime',
            'Classic 90s Anime',
            'Shonen (Action)',
            'Shojo (Romance)',
            'Ghibli-Inspired',
            'Mecha/Robot Anime',
            'Isekai Fantasy'
        ]
    },
    {
        id: 'filmnoir',
        name: 'Film Noir',
        description: 'Classic black and white film noir styles',
        subcategories: [
            'Classic Noir',
            'Neo-Noir',
            'Hardboiled Detective',
            'Femme Fatale',
            'Urban Night',
            'Shadow Play',
            'Mystery Thriller',
            'Gangster Noir'
        ]
    },
    {
        id: 'drawing',
        name: 'Drawing & Illustration',
        description: 'Sketch and illustration styles',
        subcategories: [
            'Pencil Sketch',
            'Charcoal Drawing',
            'Ink Illustration',
            'Line Art',
            'Digital Illustration',
            'Children\'s Book Style',
            'Tattoo Design'
        ]
    },
    {
        id: '3d',
        name: '3D & CGI',
        description: 'Three-dimensional and computer-generated styles',
        subcategories: [
            'Pixar Style 3D',
            'Realistic 3D Render',
            'Claymation',
            'Toy Photography',
            'Plasticine Style'
        ]
    },
    {
        id: 'fantasy',
        name: 'Fantasy & Sci-Fi',
        description: 'Fantasy and science fiction themes',
        subcategories: [
            'Medieval Fantasy',
            'High Fantasy',
            'Dark Fantasy',
            'Cyberpunk',
            'Space Opera',
            'Steampunk',
            'Mythological'
        ]
    },
    {
        id: 'surreal',
        name: 'Surreal & Dreamlike',
        description: 'Surreal and dream-inspired styles',
        subcategories: [
            'Dreamscape',
            'Vaporwave',
            'Dali/Surrealist',
            'Psychedelic',
            'Low Poly Art'
        ]
    },
    {
        id: 'popculture',
        name: 'Pop Culture & Fandom',
        description: 'Popular culture and fandom styles',
        subcategories: [
            'Superhero',
            'Retro Video Game Pixel Art',
            'Movie Poster',
            'Album Cover Art'
        ]
    },
    {
        id: 'minimalist',
        name: 'Minimalist & Graphic',
        description: 'Clean and minimal design styles',
        subcategories: [
            'Flat Design',
            'Minimalist',
            'Geometric Shapes',
            'Isometric Art',
            'Collage'
        ]
    },
    {
        id: 'vintage',
        name: 'Vintage & Historic',
        description: 'Historical and vintage art styles',
        subcategories: [
            'Renaissance Painting',
            'Baroque Art',
            'Victorian Illustration',
            'Art Deco',
            '80s Neon',
            '60s Psychedelic'
        ]
    },
    {
        id: 'nature',
        name: 'Nature & Landscape',
        description: 'Natural and landscape themes',
        subcategories: [
            'Mountain Scenery',
            'Ocean/Beach',
            'Forest Fantasy',
            'Desert Vibes',
            'Space/Astronomy'
        ]
    },
    {
        id: 'cute',
        name: 'Cute & Whimsical',
        description: 'Adorable and whimsical styles',
        subcategories: [
            'Kawaii',
            'Animal Mascots',
            'Plushie/Doll Style',
            'Whimsical Fairy Tale'
        ]
    },
    {
        id: 'picasso',
        name: 'Picasso',
        description: 'Cubist and Picasso-inspired styles',
        subcategories: [
            'Cubist Portrait',
            'Analytical Cubism',
            'Synthetic Cubism',
            'Blue Period',
            'Rose Period',
            'African Influenced',
            'Modern Cubist'
        ]
    },
    {
        id: 'lego',
        name: 'Lego',
        description: 'Lego brick and minifigure styles',
        subcategories: [
            'Lego Minifigure',
            'Lego City',
            'Lego Technic',
            'Lego Architecture',
            'Lego Star Wars',
            'Lego Friends',
            'Lego Creator'
        ]
    },
    {
        id: 'barbie',
        name: 'Barbie',
        description: 'Barbie doll and fashion styles',
        subcategories: [
            'Barbie Doll',
            'Barbie Fashion',
            'Barbie Dream House',
            'Barbie Movie Style',
            'Barbie Pink Aesthetic',
            'Barbie Glamour',
            'Barbie Fantasy'
        ]
    },
    {
        id: 'avatar',
        name: 'Avatar',
        description: 'Avatar - the movie style',
        subcategories: [
            'Avatar Movie',
            'Pandora World',
            'Na\'vi Style',
            'Sci-Fi Fantasy',
            'Alien Landscape',
            'Bioluminescent',
            'Futuristic Nature'
        ]
    }
];
export default function ImageGeneratorModal({ isOpen, onClose }) {
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState(null);
    const [referenceImage, setReferenceImage] = useState(null);
    const [selectedStyle, setSelectedStyle] = useState('none');
    const [selectedSubstyle, setSelectedSubstyle] = useState('');
    const [expandedCategories, setExpandedCategories] = useState(new Set());
    const [isGenerating, setIsGenerating] = useState(false);
    const [isThoughtForDayGenerating, setIsThoughtForDayGenerating] = useState(false);
    const [error, setError] = useState(null);
    const [progress, setProgress] = useState('');
    const [enlargedImage, setEnlargedImage] = useState(null);
    const [showTipsModal, setShowTipsModal] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const fileInputRef = useRef(null);
    const [selectedQuote, setSelectedQuote] = useState('');
    // Test image loading on component mount
    useEffect(() => {
        console.log('🔍 Testing Gabby image accessibility...');
        const testImages = [
            '/gabby_cartoon.jpg',
            '/gabby_anime.jpg',
            '/gabby_photo.jpg',
            '/Gabby.jpg'
        ];
        testImages.forEach(src => {
            const img = new Image();
            img.onload = () => console.log('✅ Image loaded successfully:', src);
            img.onerror = () => console.error('❌ Failed to load image:', src);
            img.src = src;
        });
    }, []);
    // Handle STT result
    const handleSTTResult = (text) => {
        setPrompt(text);
    };
    const generateImage = async () => {
        if (!prompt.trim())
            return;
        setIsGenerating(true);
        setIsThoughtForDayGenerating(prompt.includes('Thought for the Day'));
        setError('');
        setProgress('');
        setGeneratedImage(null);
        try {
            const finalPrompt = selectedStyle !== 'none'
                ? `${prompt} in ${getSelectedStyleText()} style`
                : prompt;
            const options = {
                prompt: finalPrompt,
                size: '1024x1024',
                quality: 'standard',
                style: 'vivid'
            };
            const result = await openAIImageService.generateImage(options);
            if (result.success && result.imageUrl) {
                setGeneratedImage(result.imageUrl);
            }
            else {
                throw new Error(result.error || 'Failed to generate image');
            }
        }
        catch (err) {
            console.error('Generation error:', err);
            setError(err instanceof Error ? err.message : 'Failed to generate image');
        }
        finally {
            setIsGenerating(false);
            setIsThoughtForDayGenerating(false);
        }
    };
    const downloadImage = async () => {
        if (!generatedImage)
            return;
        try {
            // Simple direct download approach to preserve image quality
            const a = document.createElement('a');
            a.href = generatedImage;
            a.download = `ai-generated-image-${Date.now()}.png`;
            a.target = '_blank';
            a.rel = 'noopener noreferrer';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        }
        catch (err) {
            console.error('Download error:', err);
            setError('Failed to download image');
        }
    };
    const saveToGallery = async () => {
        if (!generatedImage)
            return;
        try {
            // For mobile devices, we can use the Web Share API if available
            if (navigator.share) {
                // Try to fetch the image with proper headers
                const response = await fetch(generatedImage, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'image/*'
                    }
                });
                if (response.ok) {
                    const blob = await response.blob();
                    const file = new File([blob], `ai-image-${Date.now()}.png`, { type: 'image/png' });
                    await navigator.share({
                        title: 'AI Generated Image',
                        text: `Generated from prompt: ${prompt}`,
                        files: [file]
                    });
                }
                else {
                    // Fallback to direct download
                    downloadImage();
                }
            }
            else {
                // Fallback: trigger download
                downloadImage();
            }
        }
        catch (err) {
            console.error('Save to gallery error:', err);
            // Fallback to download
            downloadImage();
        }
    };
    const saveToPhoneGallery = async () => {
        if (!generatedImage)
            return;
        setIsSaving(true);
        try {
            // For mobile devices, try to use the Web Share API first
            if (navigator.share && /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
                // Try to fetch the image with proper headers
                const response = await fetch(generatedImage, {
                    mode: 'cors',
                    headers: {
                        'Accept': 'image/*'
                    }
                });
                if (response.ok) {
                    const blob = await response.blob();
                    const file = new File([blob], `gabby-ai-image-${Date.now()}.png`, { type: 'image/png' });
                    await navigator.share({
                        title: 'Gabby AI Generated Image',
                        text: `AI generated image: ${prompt}`,
                        files: [file]
                    });
                    // Show success message
                    setSaveSuccess(true);
                    setTimeout(() => setSaveSuccess(false), 3000);
                }
                else {
                    // Fallback to regular download
                    downloadImage();
                }
            }
            else {
                // For desktop or when Web Share API is not available
                downloadImage();
            }
        }
        catch (err) {
            console.error('Save to phone gallery error:', err);
            // Fallback to regular download
            downloadImage();
        }
        finally {
            setIsSaving(false);
        }
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (!isGenerating) {
                generateImage();
            }
        }
    };
    const handleImageUpload = (event) => {
        const file = event.target.files?.[0];
        if (file) {
            // Validate file type
            if (!file.type.startsWith('image/')) {
                setError('Please select a valid image file.');
                return;
            }
            // Validate file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                setError('Image file size must be less than 10MB.');
                return;
            }
            const reader = new FileReader();
            reader.onload = (e) => {
                setReferenceImage(e.target?.result);
                setError(null);
            };
            reader.readAsDataURL(file);
        }
    };
    const removeReferenceImage = () => {
        setReferenceImage(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };
    const triggerFileUpload = () => {
        fileInputRef.current?.click();
    };
    const showEnlargedImage = (imageSrc) => {
        setEnlargedImage(imageSrc);
        // Auto-close after 2 seconds
        setTimeout(() => {
            setEnlargedImage(null);
        }, 2000);
    };
    const closeEnlargedImage = () => {
        setEnlargedImage(null);
    };
    const handleStyleChange = (styleId) => {
        setSelectedStyle(styleId);
        setSelectedSubstyle('');
        if (styleId === 'none') {
            setExpandedCategories(new Set());
        }
        else {
            setExpandedCategories(new Set([styleId]));
        }
    };
    const handleSubstyleChange = (substyle) => {
        setSelectedSubstyle(substyle);
    };
    const toggleCategoryExpansion = (categoryId) => {
        const newExpanded = new Set(expandedCategories);
        if (newExpanded.has(categoryId)) {
            newExpanded.delete(categoryId);
        }
        else {
            newExpanded.add(categoryId);
        }
        setExpandedCategories(newExpanded);
    };
    const getSelectedStyleText = () => {
        const category = styleCategories.find(cat => cat.id === selectedStyle);
        if (!category)
            return '';
        if (selectedSubstyle && selectedSubstyle !== 'All') {
            return `${category.name} - ${selectedSubstyle}`;
        }
        return category.name;
    };
    const generateThoughtForTheDay = () => {
        const backgrounds = [
            'sunrise over mountains',
            'glowing forest',
            'peaceful beach at dawn',
            'golden meadow',
            'cozy sunlit home',
            'vibrant city morning',
            'tranquil lake',
            'radiant light streaming through clouds',
            'wildflowers',
            'gentle rain with sun rays',
            'majestic landscape'
        ];
        const quotes = [
            'Let your kindness be the sunshine that warms another\'s day.',
            'Grace is found in the quiet moments of faith.',
            'Lift others with your words and actions.',
            'Even the smallest light can break the deepest darkness.',
            'Start your day with hope and spread it generously.',
            'You are loved, chosen, and created with purpose.',
            'Find beauty in the ordinary and gratitude in every breath.',
            'Live with an open heart and watch the world change.',
            'Your presence is a gift to this world.',
            'Choose joy, spread love, and trust the journey.',
            'In every moment, there is beauty waiting to be discovered.',
            'You have the power to make someone\'s day brighter.',
            'Faith is the bridge between dreams and reality.',
            'Kindness is the language that everyone understands.',
            'Your potential is greater than any obstacle you face.'
        ];
        const randomBackground = backgrounds[Math.floor(Math.random() * backgrounds.length)];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        return `Create a beautiful "Thought for the Day" inspirational image with the following quote prominently displayed: "${randomQuote}"

Background: ${randomBackground}

Style requirements:
- High-resolution, vibrant, emotionally uplifting design
- The quote should be clearly visible and readable in elegant typography
- Use white text with subtle shadow or outline for readability
- Instagram story/post size format (vertical or square, e.g. 1080x1350 or 1084x1080)
- Professional quality suitable for social media sharing
- The quote should be the focal point, centered and well-positioned
- Beautiful, inspiring background that complements the message

The image should be designed to inspire and uplift, with the quote prominently displayed against a beautiful background.`;
    };
    const addTextOverlay = (imageUrl, quote) => {
        return new Promise((resolve, reject) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => {
                // Set canvas size to match image
                canvas.width = img.width;
                canvas.height = img.height;
                // Draw the background image
                ctx?.drawImage(img, 0, 0);
                if (ctx) {
                    // Set up text styling
                    ctx.font = 'bold 48px Arial, sans-serif';
                    ctx.fillStyle = 'white';
                    ctx.strokeStyle = 'black';
                    ctx.lineWidth = 3;
                    ctx.textAlign = 'center';
                    // Calculate text position (center of image)
                    const x = canvas.width / 2;
                    const y = canvas.height / 2;
                    // Split quote into lines (max 40 characters per line)
                    const words = quote.split(' ');
                    const lines = [];
                    let currentLine = '';
                    words.forEach(word => {
                        if ((currentLine + word).length <= 40) {
                            currentLine += (currentLine ? ' ' : '') + word;
                        }
                        else {
                            lines.push(currentLine);
                            currentLine = word;
                        }
                    });
                    if (currentLine)
                        lines.push(currentLine);
                    // Draw text with shadow effect
                    lines.forEach((line, index) => {
                        const lineY = y - (lines.length - 1) * 30 + index * 60;
                        // Draw stroke (outline)
                        ctx.strokeText(line, x, lineY);
                        // Draw fill
                        ctx.fillText(line, x, lineY);
                    });
                }
                // Convert to data URL
                const dataUrl = canvas.toDataURL('image/png');
                resolve(dataUrl);
            };
            img.onerror = () => {
                reject(new Error('Failed to load image for text overlay'));
            };
            img.src = imageUrl;
        });
    };
    if (!isOpen)
        return null;
    return (_jsxs("div", { className: "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5", children: [_jsxs("div", { className: "bg-[#111] rounded-2xl p-6 w-[90vw] max-h-[90vh] overflow-y-auto shadow-lg", style: { border: '2px solid white' }, children: [_jsx("input", { ref: fileInputRef, type: "file", accept: "image/*", onChange: handleImageUpload, className: "hidden" }), _jsxs("div", { className: "sticky top-0 z-10 mb-6 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                            background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
                            border: '2px solid rgba(255, 255, 255, 0.7)',
                            boxShadow: '0 4px 24px 0 rgba(30, 58, 138, 0.3), 0 1.5px 0 0 #fff',
                            backdropFilter: 'blur(12px)',
                            filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
                        }, children: [_jsx("h1", { className: "text-white font-bold text-lg text-center", style: {
                                    textShadow: '0 1px 4px rgba(30, 58, 138, 0.8)',
                                    margin: '0',
                                    padding: '0'
                                }, children: "AI Image Generator" }), _jsx("button", { onClick: onClose, className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: {
                                    background: '#000000',
                                    fontSize: '15px',
                                    border: '1px solid #666666'
                                }, "aria-label": "Close modal", children: _jsx(FaTimes, { size: 12 }) })] }), _jsxs("div", { className: "mb-6", children: [_jsx("label", { className: "block text-white mb-3 text-sm text-left", children: "Reference Image (Optional):" }), _jsx("div", { className: "flex gap-3 justify-center mx-auto", children: referenceImage ? (_jsxs("div", { className: "w-[300px] relative", children: [_jsx("img", { src: referenceImage, alt: "Reference", className: "w-[300px] h-auto object-cover rounded-xl border border-white" }), _jsx("button", { onClick: removeReferenceImage, className: "absolute -top-2 -right-2 glassy-btn neon-grid-btn bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 border-0", children: _jsx(FaTimes, { size: 10 }) })] })) : (_jsx("div", { className: "flex-1", children: _jsx("button", { onClick: triggerFileUpload, className: "w-full p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 border-0 animated-white-border", style: { background: '#111', fontSize: '1rem' }, children: "Upload Reference Image" }) })) })] }), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("label", { className: "block text-white text-[11px] text-left", children: "Describe your image (prompt):" }), _jsxs("div", { className: "flex gap-2", children: [_jsx(SpeechToTextButton, { onResult: handleSTTResult, onError: (error) => alert(error), size: "md", className: "px-4 py-3 border border-gray-500", interimResults: true, continuous: true }), _jsx("button", { onClick: () => setPrompt(''), className: "px-4 py-3 glassy-btn neon-grid-btn text-white rounded-lg transition-all border border-gray-500", style: { height: '40px' }, title: "Clear text", children: "Clear" })] })] }), _jsx("textarea", { value: prompt, onChange: (e) => {
                                    setPrompt(e.target.value);
                                    // Auto-resize the textarea
                                    e.target.style.height = 'auto';
                                    e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
                                }, onKeyPress: handleKeyPress, placeholder: "Speak or type your image description here...", className: "w-full p-4 bg-black border border-white rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--favourite-blue)] focus:ring-opacity-50", style: { minHeight: '60px', maxHeight: '200px', overflowY: 'auto' } }), _jsx("div", { className: "mt-2 text-xs text-gray-400 text-left", children: "\uD83D\uDCA1 Tip: Click the microphone button and speak to create your image description in real-time!" })] }), generatedImage && (_jsxs("div", { className: "mt-6 relative", children: [_jsx("img", { src: generatedImage, alt: "Generated AI Image", className: "w-full rounded-xl shadow-2xl" }), _jsxs("button", { onClick: saveToGallery, className: "absolute bottom-4 right-4 px-4 py-2 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm flex items-center justify-center gap-2 hover:scale-105 shadow-lg backdrop-blur-sm", children: [_jsx("svg", { className: "w-4 h-4", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: _jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" }) }), "Save to Gallery"] })] })), _jsxs("div", { className: "mb-6", children: [_jsxs("div", { className: "flex items-center justify-between mb-3", children: [_jsx("label", { className: "block text-white text-sm text-left", children: "Choose Image Style:" }), _jsx("button", { onClick: () => setShowTipsModal(true), className: "px-4 py-2 glassy-btn neon-grid-btn text-white rounded-lg transition-all border border-gray-500 text-sm", style: { height: '50px' }, title: "View prompt tips", children: "Prompt tips" })] }), _jsx("div", { className: "grid grid-cols-4 gap-0", children: styleCategories.map((category) => {
                                    return (_jsxs("button", { onClick: () => handleStyleChange(category.id), className: `w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all ${selectedStyle === category.id
                                            ? 'bg-gradient-to-r from-black to-blue-600'
                                            : ''}`, children: [category.id === 'photorealistic' ? (_jsx("img", { src: "/gabby_photo.jpg", alt: "Photorealistic Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_photo.jpg") })) : category.id === 'nature' ? (_jsx("img", { src: "/gabby_nature.jpg", alt: "Nature Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_nature.jpg") })) : category.id === 'photorealistic' ? (_jsx("img", { src: "/gabby_photo.jpg", alt: "Photorealistic Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_photo.jpg") })) : category.id === 'cartoon' ? (_jsx("img", { src: "/gabby_cartoon.jpg", alt: "Cartoon Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_cartoon.jpg") })) : category.id === 'anime' ? (_jsx("img", { src: "/gabby_anime.jpg", alt: "Anime Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_anime.jpg") })) : category.id === 'filmnoir' ? (_jsx("img", { src: "/gabby_filmnoir.jpg", alt: "Film Noir Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_filmnoir.jpg") })) : category.id === 'drawing' ? (_jsx("img", { src: "/gabby_drawing.jpg", alt: "Drawing Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_drawing.jpg") })) : category.id === '3d' ? (_jsx("img", { src: "/gabby_3dcartoon.jpg", alt: "3D Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_3dcartoon.jpg") })) : category.id === 'fantasy' ? (_jsx("img", { src: "/gabby_fantasy.jpg", alt: "Fantasy Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_fantasy.jpg") })) : category.id === 'surreal' ? (_jsx("img", { src: "/gabby_surreal.jpg", alt: "Surreal Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_surreal.jpg") })) : category.id === 'popculture' ? (_jsx("img", { src: "/gabby_pop.jpg", alt: "Pop Culture Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_pop.jpg") })) : category.id === 'minimalist' ? (_jsx("img", { src: "/gabby_minimalist.jpg", alt: "Minimalist Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_minimalist.jpg") })) : category.id === 'vintage' ? (_jsx("img", { src: "/gabby_vintage.jpg", alt: "Vintage Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_vintage.jpg") })) : category.id === 'nature' ? (_jsx("img", { src: "/gabby_nature.jpg", alt: "Nature Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_nature.jpg") })) : category.id === 'cute' ? (_jsx("img", { src: "/gabby_cute.jpg", alt: "Cute Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_cute.jpg") })) : category.id === 'picasso' ? (_jsx("img", { src: "/gabby_picasso.jpg", alt: "Picasso Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_picasso.jpg") })) : category.id === 'lego' ? (_jsx("img", { src: "/gabby_lego.jpg", alt: "Lego Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_lego.jpg") })) : category.id === 'barbie' ? (_jsx("img", { src: "/gabby_barbie.jpg", alt: "Barbie Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_barbie.jpg") })) : category.id === 'avatar' ? (_jsx("img", { src: "/gabby_avatar.jpg", alt: "Avatar Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_avatar.jpg") })) : category.id === 'none' ? (_jsx("img", { src: "/Gabby.jpg", alt: "No Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/Gabby.jpg") })) : (_jsx("img", { src: "/gabby_cartoon.jpg", alt: "Default Style", className: "w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80", onClick: () => showEnlargedImage("/gabby_cartoon.jpg") })), _jsx("span", { className: "text-[10px] text-white mt-0.5 font-medium truncate w-full text-center", children: category.id === 'none' ? 'None' : category.name.split(' ')[0] })] }, category.id));
                                }) }), _jsx("div", { className: "mt-4 flex justify-end", children: _jsxs("button", { onClick: async () => {
                                        const quotes = [
                                            'Let your kindness be the sunshine that warms another\'s day.',
                                            'Grace is found in the quiet moments of faith.',
                                            'Lift others with your words and actions.',
                                            'Even the smallest light can break the deepest darkness.',
                                            'Start your day with hope and spread it generously.',
                                            'You are loved, chosen, and created with purpose.',
                                            'Find beauty in the ordinary and gratitude in every breath.',
                                            'Live with an open heart and watch the world change.',
                                            'Your presence is a gift to this world.',
                                            'Choose joy, spread love, and trust the journey.',
                                            'In every moment, there is beauty waiting to be discovered.',
                                            'You have the power to make someone\'s day brighter.',
                                            'Faith is the bridge between dreams and reality.',
                                            'Kindness is the language that everyone understands.',
                                            'Your potential is greater than any obstacle you face.'
                                        ];
                                        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
                                        setSelectedQuote(randomQuote);
                                        setIsGenerating(true);
                                        setIsThoughtForDayGenerating(true);
                                        setError('');
                                        setProgress('');
                                        setGeneratedImage(null);
                                        try {
                                            // Generate prompt with the selected quote
                                            const thoughtPrompt = `Create a beautiful "Thought for the Day" inspirational image with the following quote prominently displayed: "${randomQuote}"

Background: ${['sunrise over mountains', 'glowing forest', 'peaceful beach at dawn', 'golden meadow', 'cozy sunlit home', 'vibrant city morning', 'tranquil lake', 'radiant light streaming through clouds', 'wildflowers', 'gentle rain with sun rays', 'majestic landscape'][Math.floor(Math.random() * 11)]}

Style requirements:
- High-resolution, vibrant, emotionally uplifting design
- The quote should be clearly visible and readable in elegant typography
- Use white text with subtle shadow or outline for readability
- Instagram story/post size format (vertical or square, e.g. 1080x1350 or 1084x1080)
- Professional quality suitable for social media sharing
- The quote should be the focal point, centered and well-positioned
- Beautiful, inspiring background that complements the message

The image should be designed to inspire and uplift, with the quote prominently displayed against a beautiful background.`;
                                            const options = {
                                                prompt: thoughtPrompt,
                                                size: '1024x1024',
                                                quality: 'standard',
                                                style: 'vivid'
                                            };
                                            const result = await openAIImageService.generateImage(options);
                                            if (result.success && result.imageUrl) {
                                                setGeneratedImage(result.imageUrl);
                                            }
                                            else {
                                                throw new Error(result.error || 'Failed to generate image');
                                            }
                                        }
                                        catch (err) {
                                            console.error('Generation error:', err);
                                            setError(err instanceof Error ? err.message : 'Failed to generate image');
                                        }
                                        finally {
                                            setIsGenerating(false);
                                            setIsThoughtForDayGenerating(false);
                                        }
                                    }, className: "px-3 py-2 glassy-btn neon-grid-btn text-black font-bold rounded-xl transition-all border-0 text-xs flex items-center justify-center gap-1 hover:scale-105 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg backdrop-blur-sm border border-yellow-300/50", children: [_jsx("span", { className: "text-xs", children: "\u2728" }), _jsx("span", { children: "Thought for the Day" })] }) }), selectedStyle !== 'none' ? (_jsx("div", { className: "mt-3 p-3 bg-[var(--favourite-blue)] bg-opacity-20 border border-white rounded-lg", children: _jsxs("p", { className: "text-white text-sm", children: [_jsx("span", { className: "font-bold", children: "Selected Style:" }), " ", getSelectedStyleText()] }) })) : (_jsx("div", { className: "mt-3 p-3 bg-gray-700 bg-opacity-20 border border-gray-600 rounded-lg", children: _jsxs("p", { className: "text-white text-sm", children: [_jsx("span", { className: "font-bold", children: "No style selected." }), " Your image will be based on your description only"] }) }))] }), _jsx("button", { onClick: generateImage, disabled: isGenerating || (selectedStyle === 'none' && !prompt.trim()), className: "w-full px-6 py-4 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border border-gray-500 text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105", children: isGenerating ? (_jsxs("div", { className: "flex items-center justify-center gap-3", children: [_jsx("div", { className: "animate-spin rounded-full h-6 w-6 border-b-2 border-white" }), _jsx("span", { children: isThoughtForDayGenerating ? 'Generating your inspiration for today!' : (progress || 'Generating...') })] })) : ('Generate Image') }), error && (_jsx("div", { className: "mb-4 p-4 bg-red-900 border border-red-500 rounded-xl text-red-200 font-medium", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-red-400", children: "\u26A0\uFE0F" }), _jsx("span", { children: error })] }) })), saveSuccess && (_jsx("div", { className: "mb-4 p-4 bg-green-900 border border-green-500 rounded-xl text-green-200 font-medium", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx("span", { className: "text-green-400", children: "\u2705" }), _jsx("span", { children: "Image saved to phone gallery successfully!" })] }) })), generatedImage && (_jsx("div", { className: "flex gap-3 mb-6", children: _jsx("button", { onClick: saveToPhoneGallery, disabled: isSaving, className: "flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm flex items-center justify-center gap-2 hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed", children: isSaving ? (_jsxs(_Fragment, { children: [_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" }), _jsx("span", { children: "Saving..." })] })) : (_jsxs(_Fragment, { children: [_jsx(FaSave, { size: 16 }), "Save to Phone Gallery"] })) }) }))] }), enlargedImage && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]", children: _jsx("div", { className: "relative", children: _jsx("img", { src: enlargedImage, alt: "Enlarged Style Preview", className: "w-[300px] h-[300px] rounded-lg border-2 border-white object-cover" }) }) })), showTipsModal && (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]", children: _jsxs("div", { className: "rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw]", style: {
                        background: 'rgba(0, 0, 0, 0.9)',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
                        transition: 'all 0.3s ease'
                    }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl glassy-btn", style: {
                                background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                                border: '2px solid rgba(255, 255, 255, 0.4)',
                                boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                                backdropFilter: 'blur(10px)',
                                textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                                filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                                transform: 'translateZ(5px)',
                                width: 'calc(100% - 20px)',
                                margin: '0 auto 24px auto'
                            }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                                        textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                        filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                        transform: 'translateZ(3px)'
                                    }, children: "\uD83D\uDCA1 Prompt Tips" }), _jsx("button", { onClick: () => setShowTipsModal(false), className: "absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] }), _jsxs("div", { className: "space-y-4 px-4", children: [_jsxs("div", { children: [_jsx("h3", { className: "font-bold text-white mb-3", children: "\uD83C\uDFA8 General Tips:" }), _jsxs("ul", { className: "list-disc list-inside space-y-2 text-gray-300", children: [_jsx("li", { children: "Choose a style category that matches your vision" }), _jsx("li", { children: "Be specific about colors, composition, and lighting" }), _jsx("li", { children: "Use the microphone for hands-free prompt creation" }), _jsx("li", { children: "Upload a reference image to transform it with your selected style" }), _jsx("li", { children: "Reference images work best with similar subjects or artistic styles" }), _jsx("li", { children: "Combine style selection with detailed descriptions for best results" }), _jsx("li", { children: "OpenAI DALL-E 3 generates high-quality 1024x1024 images" }), _jsx("li", { children: "Experiment with different styles to see various artistic interpretations" })] })] }), _jsxs("div", { className: "p-4 bg-blue-900 bg-opacity-20 border border-blue-500 rounded-xl", children: [_jsx("p", { className: "font-bold text-blue-200 text-base mb-2", children: "\uD83D\uDE80 AI Image Generation" }), _jsx("p", { className: "text-blue-100 text-sm", children: "Using OpenAI DALL-E 3 for high-quality image generation. Make sure your VITE_OPENAI_API_KEY is set in your .env file." })] })] })] }) }))] }));
}
