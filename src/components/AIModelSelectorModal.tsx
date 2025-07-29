import React, { useState, useEffect } from 'react';
import { getModelSuggestions, type ModelSuggestion } from '../lib/AskMeLogic';

interface AIModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (selectedModel: string) => void;
  question?: string;
}

interface ModelOption {
  id: string;
  name: string;
  description: string;
  category: string;
}

const MODEL_OPTIONS: ModelOption[] = [
  {
    id: 'perplexity/llama-3.1-70b-instruct',
    name: 'Perplexity Llama 3.1 70B',
    description: 'Real-time web search & current information',
    category: 'Web Search'
  },
  {
    id: 'anthropic/claude-3.5-sonnet',
    name: 'Claude 3.5 Sonnet',
    description: 'Best reasoning & detailed analysis',
    category: 'Premium'
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o',
    description: 'Fast & versatile responses',
    category: 'Premium'
  },

  {
    id: 'anthropic/claude-3-haiku',
    name: 'Claude Haiku',
    description: 'Quick & cost-effective',
    category: 'Balanced'
  },
  {
    id: 'openai/gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Reliable & affordable',
    category: 'Budget'
  }
];

export default function AIModelSelectorModal({ 
  isOpen, 
  onClose, 
  onSubmit,
  question = ''
}: AIModelSelectorModalProps) {
  const [selectedModel, setSelectedModel] = useState('openai/gpt-4o');
  const [suggestion, setSuggestion] = useState<ModelSuggestion | null>(null);
  const [alternatives, setAlternatives] = useState<ModelSuggestion[]>([]);

  useEffect(() => {
    if (question && isOpen) {
      const suggestions = getModelSuggestions(question);
      setSuggestion(suggestions.primary);
      setAlternatives(suggestions.alternatives);
      setSelectedModel(suggestions.primary.modelId);
    }
  }, [question, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(selectedModel);
    onClose();
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Web Search': return 'text-purple-400';
      case 'Premium': return 'text-yellow-400';
      case 'Balanced': return 'text-blue-400';
      case 'Budget': return 'text-green-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-4">
      <div className="w-full flex items-center justify-center">
        <div className="glassy-rainbow-btn rounded-2xl bg-black p-4 w-full min-h-0 h-auto flex flex-col border-0" style={{ boxSizing: 'border-box' }}>
          <div className="overflow-y-auto max-h-[90vh]">
            {/* Header */}
            <div className="relative mb-6 px-4 py-3 rounded-lg" style={{ backgroundColor: 'var(--favourite-blue)' }}>
              <h2 className="text-xl font-bold text-white">Choose AI Model</h2>
              <button
                onClick={onClose}
                className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center"
                style={{ background: '#111', border: 'none', outline: 'none' }}
              >
                ×
              </button>
            </div>

            <div className="space-y-6">
              <div className="w-full px-4 pb-4">
                {/* AI Suggestion */}
                {suggestion && (
                  <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-purple-900/30 to-blue-900/30 border border-purple-500/50">
                    <div className="flex items-center mb-2">
                      <span className="text-2xl mr-2">🤖</span>
                      <h3 className="text-purple-300 font-semibold">AI Model Suggestion</h3>
                    </div>
                    <p className="text-white text-sm mb-3">
                      <span className="text-purple-400 font-semibold">
                        I would suggest using the <span className="text-yellow-400">{suggestion.modelName}</span> for your question
                      </span> as it would best answer your question.
                    </p>
                    <p className="text-gray-300 text-xs mb-3">
                      <span className="text-blue-400">Reason:</span> {suggestion.reason}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-xs">
                        Confidence: <span className="text-green-400">{Math.round(suggestion.confidence * 100)}%</span>
                      </span>
                      <button
                        onClick={() => setSelectedModel(suggestion.modelId)}
                        className="px-3 py-1 rounded-lg bg-purple-600 text-white text-xs hover:bg-purple-700 transition-colors"
                      >
                        Use This Model
                      </button>
                    </div>
                  </div>
                )}

                {/* Alternative Suggestions */}
                {alternatives.length > 0 && (
                  <div className="mb-6 p-3 rounded-xl bg-gray-800/30 border border-gray-600">
                    <h4 className="text-gray-300 text-sm font-semibold mb-2">Alternative Options:</h4>
                    <div className="space-y-2">
                      {alternatives.slice(0, 2).map((alt, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-700/30">
                          <div className="flex-1">
                            <span className="text-white text-xs font-medium">{alt.modelName}</span>
                            <p className="text-gray-400 text-xs">{alt.reason}</p>
                          </div>
                          <button
                            onClick={() => setSelectedModel(alt.modelId)}
                            className="px-2 py-1 rounded bg-gray-600 text-white text-xs hover:bg-gray-500 transition-colors"
                          >
                            Select
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All Model Options */}
                <div className="mb-4">
                  <h4 className="text-white text-sm font-semibold mb-3">All Available Models:</h4>
                </div>
                
                {/* Radio Buttons */}
                <div className="space-y-4 mb-6">
                  {MODEL_OPTIONS.map((model) => (
                    <label key={model.id} className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg hover:bg-gray-800 transition-colors">
                      <input
                        type="radio"
                        name="aiModel"
                        value={model.id}
                        checked={selectedModel === model.id}
                        onChange={(e) => setSelectedModel(e.target.value)}
                        className="appearance-none w-4 h-4 rounded-full border border-white checked:bg-black checked:ring-2 checked:ring-red-500 mr-1 mt-1"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-white text-base font-bold">{model.name}</span>
                          <span className={`text-xs px-2 py-1 rounded-full ${getCategoryColor(model.category)} bg-gray-800`}>
                            {model.category}
                          </span>
                          {suggestion?.modelId === model.id && (
                            <span className="text-xs px-2 py-1 rounded-full text-purple-400 bg-purple-900/50">
                              Suggested
                            </span>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mt-1">{model.description}</p>
                      </div>
                    </label>
                  ))}
                </div>

                {/* Submit Button */}
                <div className="flex justify-center mt-6">
                  <button
                    className="px-6 py-3 rounded-2xl glassy-btn neon-grid-btn text-white font-medium transition-all duration-200 border-0"
                    style={{ background: '#111', boxShadow: '0 0 6px 1.5px #00fff7, 0 0 8px 2px #00fff766, 0 3px 6px rgba(30, 64, 175, 0.3), 0 0 5px rgba(255, 255, 255, 0.1)' }}
                    onClick={handleSubmit}
                  >
                    Submit
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 