import React, { useState, useRef } from 'react';
import { FaMicrophone, FaMicrophoneSlash, FaDownload, FaSave, FaUpload, FaImage, FaTimes, FaChevronDown, FaChevronRight } from 'react-icons/fa';
import { SpeechToTextButton } from './SpeechToTextButton';
import { replicateImageService } from '../lib/ReplicateImageService';
import type { ReplicateImageOptions } from '../lib/ReplicateImageService';

interface ImageGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

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
  }
];

export default function ImageGeneratorModal({ isOpen, onClose }: ImageGeneratorModalProps) {
  const [prompt, setPrompt] = useState('');
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedStyle, setSelectedStyle] = useState<string>('none');
  const [selectedSubstyle, setSelectedSubstyle] = useState<string>('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [showTipsModal, setShowTipsModal] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle STT result
  const handleSTTResult = (text: string) => {
    setPrompt(text);
  };

  const generateImage = async () => {
    if (!prompt.trim() && selectedStyle === 'none') {
      setError('Please enter a prompt for image generation.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress('Initializing OpenAI DALL-E 3...');

    try {
      // Prepare the prompt
      let finalPrompt = prompt.trim();

      // If reference image is provided, create a transformation prompt
      if (referenceImage && selectedStyle !== 'none') {
        finalPrompt = `Take the reference image and convert it to ${getSelectedStyleText()} style. ${finalPrompt}`;
      } else if (referenceImage && selectedStyle === 'none') {
        finalPrompt = `Transform the reference image. ${finalPrompt}`;
      } else if (!referenceImage && selectedStyle !== 'none') {
        finalPrompt = `Create an image in ${getSelectedStyleText()} style. ${finalPrompt}`;
      }

      if (!finalPrompt) {
        throw new Error('Please enter a prompt or select a style for image generation.');
      }

      if (referenceImage) {
        setProgress('Transforming reference image with Replicate...');
      } else {
        setProgress('Generating image with Replicate...');
      }

      // Generate image using Replicate
      const options: ReplicateImageOptions = {
        prompt: finalPrompt,
        referenceImage: referenceImage || undefined,
        styleInfo: getSelectedStyleText(),
        strength: 0.7, // How much to follow the reference image
        guidance_scale: 7.5 // How closely to follow the prompt
      };

      console.log('=== IMAGE GENERATOR MODAL DEBUG ===');
      console.log('Final Prompt:', finalPrompt);
      console.log('Selected Style:', selectedStyle);
      console.log('Style Text:', getSelectedStyleText());
      console.log('Reference Image Present:', !!referenceImage);
      console.log('Options being sent to service:', JSON.stringify(options, null, 2));
      console.log('===================================');

      const result = await replicateImageService.generateImage(options);

      if (!result.success) {
        throw new Error(result.error || 'Failed to generate image');
      }

          setProgress('Generation complete!');
      setGeneratedImage(result.imageUrl!);
      
      // Log the type of operation performed
      if (referenceImage) {
        console.log('Image transformation completed using reference image');
      } else {
        console.log('New image generation completed');
      }
      
      console.log('Image generated successfully:', result.imageUrl);
      if (result.usage) {
        console.log('API usage:', result.usage);
      }

    } catch (err) {
      console.error('Generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  const downloadImage = async () => {
    if (!generatedImage) return;

    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = `ai-generated-image-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download error:', err);
      setError('Failed to download image');
    }
  };

  const saveToGallery = async () => {
    if (!generatedImage) return;

    try {
      // For mobile devices, we can use the Web Share API if available
      if (navigator.share) {
        const response = await fetch(generatedImage);
        const blob = await response.blob();
        const file = new File([blob], `ai-image-${Date.now()}.png`, { type: 'image/png' });
        
        await navigator.share({
          title: 'AI Generated Image',
          text: `Generated from prompt: ${prompt}`,
          files: [file]
        });
      } else {
        // Fallback: trigger download
        downloadImage();
      }
    } catch (err) {
      console.error('Save to gallery error:', err);
      // Fallback to download
      downloadImage();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!isGenerating) {
        generateImage();
      }
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
        setReferenceImage(e.target?.result as string);
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

  const showEnlargedImage = (imageSrc: string) => {
    setEnlargedImage(imageSrc);
  };

  const closeEnlargedImage = () => {
    setEnlargedImage(null);
  };

  const handleStyleChange = (styleId: string) => {
    setSelectedStyle(styleId);
    setSelectedSubstyle('');
    if (styleId === 'none') {
      setExpandedCategories(new Set());
    } else {
      setExpandedCategories(new Set([styleId]));
    }
  };

  const handleSubstyleChange = (substyle: string) => {
    setSelectedSubstyle(substyle);
  };

  const toggleCategoryExpansion = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId);
    } else {
      newExpanded.add(categoryId);
    }
    setExpandedCategories(newExpanded);
  };

  const getSelectedStyleText = () => {
    if (selectedStyle === 'none') return '';
    const category = styleCategories.find(cat => cat.id === selectedStyle);
    if (!category) return '';
    
    if (selectedSubstyle) {
      return `${category.name} - ${selectedSubstyle}`;
    }
    return category.name;
  };

  if (!isOpen) return null;

  return (
         <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-5">
      <div className="bg-[#111] rounded-2xl p-6 w-[90vw] max-h-[90vh] overflow-y-auto border-2 border-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 shadow-lg">
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          className="hidden"
        />
        {/* Page Title */}
                          <div className="mb-6 bg-blue-600 rounded-xl p-4 shadow-lg w-[calc(100%+40px)] -ml-5 relative">
           <h1 className="text-xl font-bold text-white text-center">AI Image Generator</h1>
          <button
            onClick={onClose}
             className="absolute -top-2 -right-2 bg-black text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold z-30"
          >
             <FaTimes size={12} />
          </button>
        </div>

        {/* Reference Image Upload Section */}
        <div className="mb-6">
          <label className="block text-white mb-3 text-sm text-left">Reference Image (Optional):</label>
                     <div className="flex gap-3 justify-center mx-auto">
            {referenceImage ? (
               <div className="w-[300px] relative">
                <img
                  src={referenceImage}
                  alt="Reference"
                   className="w-[300px] h-auto object-cover rounded-xl border border-[var(--favourite-blue)]"
                />
                <button
                  onClick={removeReferenceImage}
                  className="absolute -top-2 -right-2 glassy-btn neon-grid-btn bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold z-10 border-0"
                >
                  <FaTimes size={10} />
                </button>
              </div>
            ) : (
              <div className="flex-1">
                <button
                  onClick={triggerFileUpload}
                   className="w-[100px] h-24 border-2 border-dashed border-[var(--favourite-blue)] rounded-xl flex flex-col items-center justify-center text-white hover:bg-[var(--favourite-blue)] hover:bg-opacity-10 transition-colors"
                >
                  <FaUpload size={24} className="mb-2" />
                   <span className="text-xs font-medium text-center">Upload Reference Image</span>
                </button>
              </div>
            )}
          </div>
          
        </div>

        {/* Prompt Input Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
                         <label className="block text-white text-[11px] text-left">Describe your image (prompt):</label>
            <div className="flex gap-2">
              <SpeechToTextButton
                onResult={handleSTTResult}
                onError={(error) => alert(error)}
                size="md"
                className="px-4 py-3"
              />
            <button
                 onClick={() => setPrompt('')}
                 className="px-4 py-3 glassy-btn neon-grid-btn text-white rounded-lg transition-all border-0"
                 style={{ height: '40px' }}
                 title="Clear text"
               >
                 Clear
            </button>
            </div>
          </div>
                     <textarea
             value={prompt}
             onChange={(e) => {
               setPrompt(e.target.value);
               // Auto-resize the textarea
               e.target.style.height = 'auto';
               e.target.style.height = Math.min(e.target.scrollHeight, 200) + 'px';
             }}
             onKeyPress={handleKeyPress}
             placeholder=""
             className="w-full p-4 bg-black border border-[var(--favourite-blue)] rounded-xl text-white resize-none focus:outline-none focus:ring-2 focus:ring-[var(--favourite-blue)] focus:ring-opacity-50"
             style={{ minHeight: '60px', maxHeight: '200px', overflowY: 'auto' }}
           />
        </div>

        {/* Your Image Placeholder */}
        <div className="mb-6">
          <label className="block text-white mb-3 text-sm text-left">Your image:</label>
          <div className={`transition-all duration-500 ease-in-out ${
            generatedImage ? 'w-full' : 'w-24 h-24 mx-auto'
          }`}>
            {generatedImage ? (
              <div className="bg-black border border-[var(--favourite-blue)] rounded-xl p-4">
                <img
                  src={generatedImage}
                  alt="AI Generated"
                  className="w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            ) : (
                             <div className="w-24 h-24 border-2 border-dashed border-[var(--favourite-blue)] rounded-xl flex flex-col items-start justify-center text-white bg-black bg-opacity-50 p-2">
                 <span className="text-xs opacity-70 text-left">Generated image will appear here</span>
               </div>
            )}
          </div>
        </div>

        {/* Style Selector Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <label className="block text-white text-sm text-left">Choose Image Style:</label>
                                        <button
                 onClick={() => setShowTipsModal(true)}
                 className="px-3 py-1 glassy-btn neon-grid-btn text-white rounded-lg transition-all border-0 text-xs"
                 style={{ height: '40px' }}
                 title="View prompt tips"
               >
                 Prompt tips
               </button>
          </div>
                     <div className="grid grid-cols-4 gap-0">
            {styleCategories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleStyleChange(category.id)}
                                                  className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center transition-all ${
                   selectedStyle === category.id
                     ? 'bg-gradient-to-r from-red-500/20 via-yellow-500/20 via-green-500/20 via-blue-500/20 to-purple-500/20'
                     : ''
                 }`}
              >
                                  {category.id === 'anime' ? (
                    <img 
                      src="/gabby_anime.jpg" 
                      alt="Anime Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_anime.jpg")}
                    />
                                  ) : category.id === 'nature' ? (
                    <img 
                      src="/gabby_nature.jpg" 
                      alt="Nature Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_nature.jpg")}
                    />
                ) : category.id === 'picasso' ? (
                  <img 
                    src="/gabby_picasso.jpg" 
                    alt="Picasso Style" 
                    className="w-8 h-8 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                    onClick={() => showEnlargedImage("/gabby_picasso.jpg")}
                  />
                                  ) : category.id === 'surreal' ? (
                    <img 
                      src="/gabby_surreal.jpg" 
                      alt="Surreal Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_surreal.jpg")}
                    />
                                  ) : category.id === 'fantasy' ? (
                    <img 
                      src="/gabby_fantasy.jpg" 
                      alt="Fantasy Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_fantasy.jpg")}
                    />
                                                   ) : category.id === 'photorealistic' ? (
                    <img 
                      src="/gabby_photo.jpg" 
                      alt="Photorealistic Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_photo.jpg")}
                    />
                                  ) : category.id === 'cartoon' ? (
                    <img 
                      src="/gabby_cartoon.jpg" 
                      alt="Cartoon Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_cartoon.jpg")}
                    />
                                                   ) : category.id === 'filmnoir' ? (
                    <img 
                      src="/gabby_filmnoir.jpg" 
                      alt="Film Noir Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_filmnoir.jpg")}
                    />
                                  ) : category.id === 'drawing' ? (
                    <img 
                      src="/gabby_drawing.jpg" 
                      alt="Drawing Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_drawing.jpg")}
                    />
                                                   ) : category.id === '3d' ? (
                    <img 
                      src="/gabby_3dcartoon.jpg" 
                      alt="3D Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_3dcartoon.jpg")}
                    />
                                                   ) : category.id === 'popculture' ? (
                    <img 
                      src="/gabby_pop.jpg" 
                      alt="Pop Culture Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_pop.jpg")}
                    />
                                  ) : category.id === 'minimalist' ? (
                    <img 
                      src="/gabby_minimalist.jpg" 
                      alt="Minimalist Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_minimalist.jpg")}
                    />
                                  ) : category.id === 'vintage' ? (
                    <img 
                      src="/gabby_vintage.jpg" 
                      alt="Vintage Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_vintage.jpg")}
                    />
                                  ) : category.id === 'cute' ? (
                    <img 
                      src="/gabby_cute.jpg" 
                      alt="Cute Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_cute.jpg")}
                    />
                                                   ) : category.id === 'picasso' ? (
                    <img 
                      src="/gabby_picasso.jpg" 
                      alt="Picasso Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_picasso.jpg")}
                    />
                                                   ) : category.id === 'lego' ? (
                    <img 
                      src="/gabby_lego.jpg" 
                      alt="Lego Style" 
                      className="w-12 h-12 rounded border border-gray-600 object-cover cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage("/gabby_lego.jpg")}
                    />
                                  ) : (
                    <div 
                      className="w-12 h-12 bg-gray-700 rounded border border-gray-600 cursor-pointer hover:opacity-80"
                      onClick={() => showEnlargedImage(`/placeholder-${category.id}.jpg`)}
                    ></div>
                  )}
                                 <span className="text-[10px] text-white mt-0.5 font-medium truncate w-full text-center">
                   {category.id === 'none' ? 'None' : category.name.split(' ')[0]}
                 </span>
              </button>
            ))}
          </div>
          
          {/* Selected Style Display */}
           {selectedStyle !== 'none' ? (
            <div className="mt-3 p-3 bg-[var(--favourite-blue)] bg-opacity-20 border border-[var(--favourite-blue)] rounded-lg">
              <p className="text-white text-sm">
                <span className="font-bold">Selected Style:</span> {getSelectedStyleText()}
              </p>
            </div>
           ) : (
             <div className="mt-3 p-3 bg-gray-700 bg-opacity-20 border border-gray-600 rounded-lg">
               <p className="text-white text-sm">
                 <span className="font-bold">No style selected.</span> Your image will be based on your description only
              </p>
            </div>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={generateImage}
           disabled={isGenerating || (selectedStyle === 'none' && !prompt.trim())}
          className="w-full px-6 py-4 glassy-btn neon-grid-btn text-white font-bold rounded-2xl transition-all border-0 text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:scale-105"
        >
          {isGenerating ? (
            <div className="flex items-center justify-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
              <span>{progress || 'Generating...'}</span>
            </div>
          ) : (
             'Generate Image'
          )}
        </button>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-4 bg-red-900 border border-red-500 rounded-xl text-red-200 font-medium">
            <div className="flex items-center gap-2">
              <span className="text-red-400">⚠️</span>
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {generatedImage && (
          <div className="flex gap-3 mb-6">
              <button
                onClick={downloadImage}
                className="flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm flex items-center justify-center gap-2 hover:scale-105"
              >
                <FaDownload size={16} />
                Download
              </button>
              <button
                onClick={saveToGallery}
                className="flex-1 px-6 py-3 glassy-btn neon-grid-btn text-white font-bold rounded-xl transition-all border-0 text-sm flex items-center justify-center gap-2 hover:scale-105"
              >
                <FaSave size={16} />
                Save to Gallery
              </button>
            </div>
        )}
      </div>
      
      {/* Enlarged Image Modal */}
      {enlargedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="relative">
            <button
              onClick={closeEnlargedImage}
              className="absolute -top-4 -right-4 bg-red-600 hover:bg-red-700 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold z-10 border-0"
            >
              <FaTimes size={12} />
            </button>
            <img
              src={enlargedImage}
              alt="Enlarged Style Preview"
              className="w-[300px] h-[300px] rounded-lg border-2 border-white object-cover"
            />
            </div>
          </div>
        )}

      {/* Tips Modal */}
      {showTipsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[60]">
          <div className="bg-[#111] rounded-2xl p-6 w-[90vw] max-w-md max-h-[80vh] overflow-y-auto border-2 border-gradient-to-r from-red-500 via-yellow-500 via-green-500 via-blue-500 to-purple-500 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">💡 Prompt Tips</h2>
              <button
                onClick={() => setShowTipsModal(false)}
                className="text-white hover:text-gray-300 transition-colors"
              >
                <FaTimes size={20} />
              </button>
            </div>
            
            <div className="text-sm text-gray-300 space-y-4">
              <div>
                <h3 className="font-bold text-white mb-2">General Tips:</h3>
                <ul className="list-disc list-inside space-y-2">
            <li>Choose a style category that matches your vision</li>
            <li>Be specific about colors, composition, and lighting</li>
            <li>Use the microphone for hands-free prompt creation</li>
                                     <li>Upload a reference image to transform it with your selected style and description</li>
            <li>Reference images work best with similar subjects or artistic styles</li>
            <li>Combine style selection with detailed descriptions for best results</li>
                   <li>PyxlPro generates high-quality 1024x1024 images with true image-to-image transformation</li>
                   <li>PyxlPro can actually transform your reference image while applying the selected style</li>
          </ul>
              </div>
              
          <div className="p-4 bg-blue-900 border border-blue-500 rounded-xl">
                 <p className="font-bold text-blue-200 text-base mb-1">🎨 PyxlPro Image Generation</p>
                 <p className="text-blue-100 text-sm">Using PyxlPro for true image-to-image transformation. Make sure your VITE_PYXLPRO_API_KEY is set in your .env file.</p>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 