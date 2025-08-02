import React, { useState } from 'react';
import ThreeDComponent from './ThreeDComponent';

// Reusable Modal Header Component with consistent styling
const ModalHeader: React.FC<{ title: string; onClose?: () => void }> = ({ title, onClose }) => (
  <div
    className="relative mb-6 px-4 py-3 rounded-xl glassy-btn"
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
      {title}
    </h2>
    {onClose && (
      <button
        onClick={onClose}
        className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
        style={{ background: '#000000', fontSize: '15px' }}
        aria-label="Close modal"
      >
        ×
      </button>
    )}
  </div>
);

interface AddChapterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddChapter: (chapterName: string) => void;
}

const AddChapterModal: React.FC<AddChapterModalProps> = ({ isOpen, onClose, onAddChapter }) => {
  const [newChapterName, setNewChapterName] = useState('');
  const [addChapterStatus, setAddChapterStatus] = useState('');

  const handleAddChapter = async () => {
    if (newChapterName.trim()) {
      onAddChapter(newChapterName.trim());
      setNewChapterName('');
      setAddChapterStatus('Chapter successfully added!');
      setTimeout(() => {
        setAddChapterStatus('');
        onClose();
      }, 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] p-4">
      <div className="w-full flex items-center justify-center">
        <div className="rounded-2xl bg-black p-4 w-full flex flex-col border-0 transition-all duration-300 relative" style={{ boxSizing: 'border-box', border: '2px solid rgba(255, 255, 255, 0.8)', boxShadow: '0 0 8px rgba(255, 255, 255, 0.3)', width: '80vw' }}>
          <div className="overflow-y-auto">
            {/* Header */}
            <ModalHeader title="New Chapter" onClose={onClose} />
            
            <div className="space-y-4 px-4">
              <input
                type="text"
                value={newChapterName}
                onChange={(e) => setNewChapterName(e.target.value)}
                placeholder="Enter chapter name..."
                className="w-full p-3 rounded-2xl text-white placeholder-gray-400 border-0 transition-all duration-200"
                style={{ 
                  background: '#111', 
                  border: '2px solid rgba(255, 255, 255, 0.3)',
                  fontSize: '0.9rem'
                }}
                onKeyPress={(e) => e.key === 'Enter' && handleAddChapter()}
              />
              
              <div className="flex justify-end pt-2">
                <button
                  onClick={handleAddChapter}
                  disabled={!newChapterName.trim()}
                  className="px-4 py-2 rounded-2xl glassy-btn text-white font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed border-0 animated-white-border"
                  style={{ background: '#111' }}
                >
                  Add Chapter
                </button>
              </div>
              
              {addChapterStatus && (
                <div className="relative flex items-center p-3 rounded-2xl text-sm font-medium bg-green-600 text-white border-0 shadow-lg" style={{ boxShadow: '0 2px 12px 2px #00ff99, 0 1.5px 6px #007a4d', background: 'linear-gradient(135deg, #00ff99 80%, #007a4d 100%)', fontWeight: 600, backdropFilter: 'blur(2px)' }}>
                  <span className="pr-8">{addChapterStatus}</span>
                  <button
                    onClick={() => setAddChapterStatus('')}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-green-200 flex items-center justify-center z-10"
                    style={{ background: '#111', border: 'none', outline: 'none', boxShadow: '0 0 6px 1.5px #00ff99' }}
                    aria-label="Dismiss success"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddChapterModal; 