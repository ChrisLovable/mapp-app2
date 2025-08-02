import React from 'react';

interface ImageChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGalleryUpload: () => void;
  onCameraCapture: () => void;
}

const ImageChoiceModal: React.FC<ImageChoiceModalProps> = ({
  isOpen,
  onClose,
  onGalleryUpload,
  onCameraCapture
}) => {


  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[9999]"
        onClick={onClose}
        style={{ animation: 'fadeInUp 0.3s ease-out' }}
      >
        <div 
          className="rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw]"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: 'rgba(0, 0, 0, 0.9)',
            border: '2px solid rgba(255, 255, 255, 0.4)',
            boxShadow: '0 10px 30px rgba(0, 0, 0, 0.5)',
            transition: 'all 0.3s ease'
          }}
        >
          <div 
            className="relative mb-6 px-4 py-3 rounded-xl glassy-btn"
            style={{ 
              background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
              border: '2px solid rgba(255, 255, 255, 0.4)',
              boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
              backdropFilter: 'blur(10px)',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
              filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
              transform: 'translateZ(5px)',
              width: 'calc(100% - 20px)',
              margin: '0 auto 24px auto'
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
              Choose Image Source
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
          
          <div className="space-y-4 px-4">
            <button
              onClick={() => {
                onClose();
                onCameraCapture();
              }}
              className="w-full p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 border-0 animated-white-border"
              style={{ background: '#111', fontSize: '1rem' }}
            >
              Use Camera
            </button>
            <button
              onClick={() => {
                onClose();
                onGalleryUpload();
              }}
              className="w-full p-3 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 border-0 animated-white-border"
              style={{ background: '#111', fontSize: '1rem' }}
            >
              Select from Gallery
            </button>
          </div>
        </div>
      </div>
      

    </>
  );
};

export default ImageChoiceModal; 