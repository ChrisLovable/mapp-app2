import React, { useState } from 'react';
import { getGPTAnswer } from '../lib/AskMeLogic';

// Add CSS animation for loading spinner
const spinnerStyle = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation?: string;
}

interface MindGamesUIProps {
  isOpen: boolean;
  onClose: () => void;
}

const MindGamesUI: React.FC<MindGamesUIProps> = ({ isOpen, onClose }) => {
  const [selectedDifficulty, setSelectedDifficulty] = useState<'easy' | 'medium' | 'hard' | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [showExplanation, setShowExplanation] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const difficulties = [
    { key: 'easy', label: 'Easy', gradient: 'from-green-400 to-green-600' },
    { key: 'medium', label: 'Medium', gradient: 'from-yellow-400 to-yellow-600' },
    { key: 'hard', label: 'Hard', gradient: 'from-red-400 to-red-600' }
  ] as const;

  const generateQuestions = async (difficulty: 'easy' | 'medium' | 'hard') => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Add randomization elements for truly unique questions
      const topics = [
        'science', 'history', 'geography', 'literature', 'art', 'technology', 
        'sports', 'music', 'politics', 'nature', 'space', 'medicine', 
        'economics', 'philosophy', 'mathematics', 'architecture', 'fashion', 
        'food', 'animals', 'inventions', 'discoveries', 'cultures', 'languages',
        'chemistry', 'physics', 'biology', 'astronomy', 'psychology', 'sociology'
      ];
      
      const contexts = [
        'for a trivia night',
        'for educational purposes', 
        'for a fun quiz game',
        'for testing general knowledge',
        'for a brain training session',
        'for a pub quiz',
        'for a classroom activity',
        'for a family game night',
        'for a competitive tournament',
        'for a casual learning session'
      ];
      
      const randomTopics = topics.sort(() => Math.random() - 0.5).slice(0, 8);
      const randomContext = contexts[Math.floor(Math.random() * contexts.length)];
      const timestamp = new Date().toISOString();
      const randomSeed = Math.random().toString(36).substring(7);
      const randomYear = Math.floor(Math.random() * 50) + 1970;
      
      const prompt = `Generate exactly 10 ${difficulty} general knowledge quiz questions ${randomContext} at ${timestamp}. Focus on these specific topics: ${randomTopics.join(', ')}. Make sure each question is completely unique and different from any previous questions. Include questions from year ${randomYear} and various time periods. Each question should have 4 multiple choice options (A, B, C, D) and include an explanation for the correct answer. 

CRITICAL: Return ONLY raw JSON. No markdown, no explanations, no text before or after. Just the JSON array.

Format exactly like this (no markdown, no code blocks):
[
  {
    "id": 1,
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": 0,
    "explanation": "Explanation for why this answer is correct."
  }
]

Requirements:
- Exactly 10 questions, no more, no less
- Each question must have exactly 4 options
- correctAnswer must be 0, 1, 2, or 3 (index of correct option)
- No trailing commas
- No markdown formatting
- No explanations outside the JSON
- Random seed: ${randomSeed}`;

      const response = await getGPTAnswer(prompt);

      if (!response) {
        throw new Error('Failed to generate questions');
      }

      console.log('Raw OpenAI response:', response);

      // Parse the response to extract JSON with robust error handling
      let questionsData: Question[];
      
      try {
        // Step 1: Pre-cleanup - Remove markdown and extra text
        let cleanResponse = response.trim()
          .replace(/```json|```/g, '') // Remove markdown code blocks
          .replace(/^Here are|^Here's|^I'll generate|^Generated|^Here is|^Sure|^I'll create|^Here's your|^Here are your/gi, '') // Remove common prefixes
          .replace(/^[^[]*/, '') // Remove anything before the first [
          .replace(/[^]*$/, '') // Remove anything after the last ]
          .trim();
        
        console.log('Pre-cleaned response:', cleanResponse);
        
        // Step 2: Try direct JSON parse first
        try {
          questionsData = JSON.parse(cleanResponse);
          console.log('Direct JSON parse successful');
        } catch (directParseError) {
          console.log('Direct JSON parsing failed, attempting extraction');
          console.log('Direct parse error:', directParseError);
          
          // Step 3: Extract JSON array using regex
          const jsonMatch = response.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            let extractedJson = jsonMatch[0];
            console.log('Extracted JSON:', extractedJson);
            
            // Step 4: Clean up common JSON formatting issues
            let cleanedJson = extractedJson
              .replace(/,\s*}/g, '}') // Remove trailing commas in objects
              .replace(/,\s*]/g, ']') // Remove trailing commas in arrays
              .replace(/,\s*,/g, ',') // Remove double commas
              .replace(/\n/g, ' ') // Replace newlines with spaces
              .replace(/\r/g, ' ') // Replace carriage returns with spaces
              .replace(/\t/g, ' ') // Replace tabs with spaces
              .replace(/\s+/g, ' ') // Replace multiple spaces with single space
              .replace(/"\s*,\s*"/g, '","') // Fix spacing around commas in arrays
              .replace(/:\s*"/g, ':"') // Fix spacing around colons
              .replace(/"\s*:/g, '":') // Fix spacing around colons
              .replace(/}\s*,/g, '},') // Fix spacing around commas after objects
              .replace(/]\s*,/g, '],') // Fix spacing around commas after arrays
              .replace(/,\s*{/g, ',{') // Fix spacing around commas before objects
              .replace(/,\s*\[/g, ',[') // Fix spacing around commas before arrays
              .replace(/}\s*}/g, '}}') // Fix spacing between closing braces
              .replace(/]\s*]/g, ']]') // Fix spacing between closing brackets
              .replace(/}\s*]/g, '}]') // Fix spacing between closing brace and bracket
              .replace(/]\s*}/g, ']}') // Fix spacing between closing bracket and brace
              .replace(/,\s*}/g, '}') // Final cleanup of trailing commas
              .replace(/,\s*]/g, ']'); // Final cleanup of trailing commas
            
            console.log('Cleaned JSON:', cleanedJson);
            
            try {
              questionsData = JSON.parse(cleanedJson);
              console.log('Extracted JSON parse successful');
            } catch (cleanedParseError) {
              console.error('Cleaned JSON parse failed:', cleanedParseError);
              console.error('Cleaned JSON that failed:', cleanedJson);
              
              // Step 5: Try even more aggressive cleaning
              let aggressiveClean = cleanedJson
                .replace(/[^\x20-\x7E]/g, '') // Remove non-printable characters
                .replace(/,\s*([}\]])/g, '$1') // Remove trailing commas more aggressively
                .replace(/\s+/g, ' ') // Normalize spaces
                .trim();
              
              console.log('Aggressively cleaned JSON:', aggressiveClean);
              
              try {
                questionsData = JSON.parse(aggressiveClean);
                console.log('Aggressive cleaning successful');
              } catch (aggressiveError) {
                console.error('Aggressive cleaning failed:', aggressiveError);
                throw new Error('Failed to parse JSON after multiple cleaning attempts');
              }
            }
          } else {
            // Step 6: Fallback - Create questions from text format
            console.log('No JSON array found, attempting to create questions from text');
            const lines = response.split('\n').filter(line => line.trim().length > 0);
            const questionLines = lines.filter(line => 
              line.includes('?') || 
              line.match(/^\d+\./) || 
              line.match(/^Question/) ||
              line.match(/^[A-D]\./)
            );
            
            console.log('Question lines found:', questionLines);
            
            if (questionLines.length >= 10) {
              // Create questions from text lines
              questionsData = [];
              for (let i = 0; i < Math.min(10, questionLines.length); i++) {
                const line = questionLines[i];
                questionsData.push({
                  id: i + 1,
                  question: line.replace(/^\d+\.\s*/, '').replace(/^Question\s*\d*:?\s*/, ''),
                  options: ['Option A', 'Option B', 'Option C', 'Option D'],
                  correctAnswer: 0,
                  explanation: 'Question generated from text response.'
                });
              }
              console.log('Created questions from text format');
            } else {
              console.error('Not enough question lines found:', questionLines.length);
              throw new Error('Could not extract valid questions from response');
            }
          }
        }
      } catch (parseError) {
        console.error('JSON parsing failed:', parseError);
        console.error('Original response:', response);
        throw new Error('Failed to parse OpenAI response. Please try again.');
      }

      // Validate the questions structure
      if (!Array.isArray(questionsData) || questionsData.length === 0) {
        throw new Error('No valid questions generated');
      }

      // Ensure we have exactly 10 questions
      if (questionsData.length !== 10) {
        console.warn(`Expected 10 questions, got ${questionsData.length}. Using available questions.`);
      }

      // Ensure each question has the required properties
      const validatedQuestions = questionsData.map((q, index) => ({
        id: index + 1,
        question: q.question || `Question ${index + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4 
          ? q.options 
          : ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
          ? q.correctAnswer 
          : 0,
        explanation: q.explanation || 'No explanation provided.'
      }));

      setQuestions(validatedQuestions);
      setSelectedDifficulty(difficulty);
      setCurrentQuestion(0);
      setScore(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setShowExplanation(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate questions');
      console.error('Error generating questions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDifficultySelect = (difficulty: 'easy' | 'medium' | 'hard') => {
    // Clear any existing questions and generate fresh ones
    setQuestions([]);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setError(null);
    generateQuestions(difficulty);
  };

  const handleAnswerSelect = (answerIndex: number) => {
    if (selectedAnswer !== null || questions.length === 0) return;
    
    setSelectedAnswer(answerIndex);
    setShowExplanation(true);
    
    const currentQ = questions[currentQuestion];
    if (answerIndex === currentQ.correctAnswer) {
      setScore(score + 1);
    }
  };

  const handleNextQuestion = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
    } else {
      setShowResult(true);
    }
  };

  const handlePlayAgain = () => {
    setSelectedDifficulty(null);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setQuestions([]);
    setError(null);
  };

  const handleClose = () => {
    onClose();
    setQuestions([]); // Clear questions when modal closes
    setSelectedDifficulty(null);
    setCurrentQuestion(0);
    setScore(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setShowExplanation(false);
    setError(null);
  };

  if (!isOpen) return null;

  const modalStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    padding: '1rem'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#1f2937',
    borderRadius: '1rem',
    padding: '2rem',
    maxWidth: '600px',
    width: '100%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    border: '1px solid #374151'
  };

  const buttonStyle: React.CSSProperties = {
    padding: '0.75rem 1.5rem',
    borderRadius: '0.5rem',
    border: 'none',
    color: 'white',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    margin: '0.5rem'
  };

  const difficultyButtonStyle = (gradient: string): React.CSSProperties => ({
    ...buttonStyle,
    background: `linear-gradient(135deg, var(--tw-gradient-stops))`,
    '--tw-gradient-from': gradient.split(' ')[1],
    '--tw-gradient-to': gradient.split(' ')[3],
  } as any);

  const optionButtonStyle = (isSelected: boolean, isCorrect: boolean, showExplanation: boolean): React.CSSProperties => ({
    ...buttonStyle,
    backgroundColor: showExplanation 
      ? isCorrect 
        ? '#10b981' 
        : isSelected && !isCorrect 
          ? '#ef4444' 
          : '#374151'
      : isSelected 
        ? '#3b82f6' 
        : '#374151',
    border: showExplanation && isCorrect ? '2px solid #10b981' : '1px solid #4b5563',
    opacity: showExplanation && !isSelected && !isCorrect ? 0.6 : 1
  });

  return (
    <div style={modalStyle} onClick={onClose}>
      <style>{spinnerStyle}</style>
      <div style={cardStyle} onClick={(e) => e.stopPropagation()}>
        {isLoading ? (
          // Loading Screen
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '2rem', 
              color: 'white', 
              marginBottom: '1rem' 
            }}>
              🧠
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '1rem' 
            }}>
              Generating Questions...
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              color: '#9ca3af' 
            }}>
              Creating your personalized quiz with AI
            </p>
            <div style={{ 
              marginTop: '2rem',
              width: '40px',
              height: '40px',
              border: '4px solid #374151',
              borderTop: '4px solid #3b82f6',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '2rem auto 0'
            }}></div>
          </div>
        ) : error ? (
          // Error Screen
          <div style={{ textAlign: 'center' }}>
            <div style={{ 
              fontSize: '2rem', 
              color: '#ef4444', 
              marginBottom: '1rem' 
            }}>
              ❌
            </div>
            <h2 style={{ 
              fontSize: '1.5rem', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '1rem' 
            }}>
              Error Generating Questions
            </h2>
            <p style={{ 
              fontSize: '1rem', 
              color: '#9ca3af',
              marginBottom: '2rem' 
            }}>
              {error}
            </p>
            <button
              onClick={handlePlayAgain}
              style={{
                ...buttonStyle,
                backgroundColor: '#3b82f6'
              }}
            >
              Try Again
            </button>
          </div>
        ) : !selectedDifficulty ? (
          // Difficulty Selection Screen
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ 
              fontSize: '2.5rem', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '1rem',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              Mind Games
            </h1>
            <p style={{ 
              fontSize: '1.1rem', 
              color: '#9ca3af', 
              marginBottom: '2rem' 
            }}>
              Choose your difficulty level and test your knowledge with AI-generated questions!
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {difficulties.map(({ key, label, gradient }) => (
                <button
                  key={key}
                  onClick={() => handleDifficultySelect(key)}
                  style={difficultyButtonStyle(gradient)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        ) : showResult ? (
          // Results Screen
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ 
              fontSize: '2rem', 
              fontWeight: 'bold', 
              color: 'white', 
              marginBottom: '1rem' 
            }}>
              Quiz Complete!
            </h2>
            <div style={{ 
              fontSize: '1.5rem', 
              color: '#9ca3af', 
              marginBottom: '2rem' 
            }}>
              Your Score: <span style={{ color: '#10b981', fontWeight: 'bold' }}>{score}</span> / {questions.length}
            </div>
            <div style={{ 
              fontSize: '1.1rem', 
              color: '#9ca3af', 
              marginBottom: '2rem' 
            }}>
              Percentage: <span style={{ color: '#10b981', fontWeight: 'bold' }}>
                {Math.round((score / questions.length) * 100)}%
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handlePlayAgain}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#3b82f6'
                }}
              >
                Play Again
              </button>
              <button
                onClick={handleClose}
                style={{
                  ...buttonStyle,
                  backgroundColor: '#6b7280'
                }}
              >
                Close
              </button>
            </div>
          </div>
        ) : questions.length > 0 ? (
          // Quiz Screen
          <div>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              marginBottom: '1.5rem' 
            }}>
              <h2 style={{ 
                fontSize: '1.5rem', 
                fontWeight: 'bold', 
                color: 'white' 
              }}>
                {selectedDifficulty.charAt(0).toUpperCase() + selectedDifficulty.slice(1)} Level
              </h2>
              <div style={{ 
                fontSize: '1rem', 
                color: '#9ca3af' 
              }}>
                Question {currentQuestion + 1} of {questions.length}
              </div>
            </div>
            
            <div style={{ 
              fontSize: '1.1rem', 
              color: 'white', 
              marginBottom: '2rem',
              lineHeight: '1.6'
            }}>
              {questions[currentQuestion].question}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '2rem' }}>
              {questions[currentQuestion].options.map((option, index) => (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  disabled={selectedAnswer !== null}
                  style={optionButtonStyle(
                    selectedAnswer === index,
                    index === questions[currentQuestion].correctAnswer,
                    showExplanation
                  )}
                >
                  {option}
                </button>
              ))}
            </div>

            {showExplanation && (
              <div style={{ 
                backgroundColor: '#374151', 
                padding: '1rem', 
                borderRadius: '0.5rem', 
                marginBottom: '1.5rem',
                border: '1px solid #4b5563'
              }}>
                <p style={{ 
                  color: '#9ca3af', 
                  fontSize: '0.9rem',
                  fontStyle: 'italic'
                }}>
                  {questions[currentQuestion].explanation}
                </p>
              </div>
            )}

            {showExplanation && (
              <div style={{ textAlign: 'center' }}>
                <button
                  onClick={handleNextQuestion}
                  style={{
                    ...buttonStyle,
                    backgroundColor: '#10b981'
                  }}
                >
                  {currentQuestion < questions.length - 1 ? 'Next Question' : 'See Results'}
                </button>
              </div>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
};

export default MindGamesUI; 