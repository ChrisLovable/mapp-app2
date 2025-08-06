import React, { useState, useRef, useEffect } from 'react';
import { MdClose, MdUpload, MdDescription, MdQuestionAnswer, MdSummarize, MdVisibility, MdSend, MdWarning, MdZoomIn, MdZoomOut, MdNavigateNext, MdNavigateBefore, MdFullscreen, MdFullscreenExit } from 'react-icons/md';
import * as pdfjsLib from 'pdfjs-dist';
import '../lib/pdf-worker';




interface PdfReaderModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AnalysisResult {
  fullText?: string;
  summary?: string;
  questionAnswer?: string;
}

export default function PdfReaderModal({ isOpen, onClose }: PdfReaderModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [pdfDocument, setPdfDocument] = useState<pdfjsLib.PDFDocumentProxy | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [extractedText, setExtractedText] = useState('');
  const [pageTexts, setPageTexts] = useState<string[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult>({});
  const [question, setQuestion] = useState('');
  const [analysisType, setAnalysisType] = useState<string>('fullText');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAnalysisPanel, setShowAnalysisPanel] = useState(false);
  const [topTextboxValue, setTopTextboxValue] = useState('');
  const [analysisTextboxValue, setAnalysisTextboxValue] = useState('');
  const [copyMessage, setCopyMessage] = useState('');
  const [showQueryModal, setShowQueryModal] = useState(false);
  const [queryText, setQueryText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [showPdfFlipbookModal, setShowPdfFlipbookModal] = useState(false);
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const wordInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const speechRecognitionRef = useRef<SpeechRecognition | null>(null);

  // Reset state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
      setPdfDocument(null);
      setCurrentPage(1);
      setTotalPages(0);
      setScale(1.0);
      setAnalysisResult({});
      setError('');
      setExtractedText('');
      setPageTexts([]);
      setAnalysisType('fullText');
      setIsAnalyzing(false);
      setShowAnalysisPanel(false);
      setIsFullscreen(false);
      setTopTextboxValue('');
      setAnalysisTextboxValue('');
      setCopyMessage('');
    }
  }, [isOpen]);

  // Handle fullscreen changes
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Function to get current page text
  const getCurrentPageText = () => {
    if (pageTexts.length === 0 || currentPage < 1 || currentPage > pageTexts.length) {
      return '';
    }
    return pageTexts[currentPage - 1];
  };

  // Function to apply zoom to text display
  const getZoomedText = (text: string, zoomLevel: number) => {
    // For text zoom, we can adjust line spacing and potentially font size
    // This is a simple implementation - you could make it more sophisticated
    const lines = text.split('\n');
    const zoomedLines = lines.map(line => line.repeat(Math.max(1, Math.floor(zoomLevel))));
    return zoomedLines.join('\n');
  };

  // Function to update textbox with current page text and zoom
  const updateTextboxWithCurrentPage = () => {
    const currentPageText = getCurrentPageText();
    const zoomedText = getZoomedText(currentPageText, scale);
    setTopTextboxValue(zoomedText);
  };

  // Update textbox when page or zoom changes
  useEffect(() => {
    if (pageTexts.length > 0) {
      updateTextboxWithCurrentPage();
    }
  }, [currentPage, scale, pageTexts]);

  // Function to copy all extracted text
  const handleCopyText = async () => {
    try {
      // Get the text from the textarea that's actually displayed
      const textToCopy = topTextboxValue || extractedText || '';
      
      if (!textToCopy.trim()) {
        setCopyMessage('No text to copy');
        setTimeout(() => setCopyMessage(''), 3000);
        return;
      }

      // Select all text in the top textbox for visual feedback with blue selection
      const textarea = document.querySelector('.pdf-reader-textarea') as HTMLTextAreaElement;
      if (textarea) {
        textarea.select();
        textarea.setSelectionRange(0, textarea.value.length);
        
        // Clear selection after 2 seconds
        setTimeout(() => {
          textarea.setSelectionRange(0, 0);
        }, 2000);
      }
      
      // Try modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopyMessage('Text copied');
      } else {
        // Fallback for older browsers or when clipboard API is not available
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        document.body.removeChild(textArea);
        
        if (successful) {
          setCopyMessage('Text copied');
        } else {
          throw new Error('Copy command failed');
        }
      }
  
      // Clear the message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);
    } catch (err) {
      console.error('Failed to copy text:', err);
      setCopyMessage('Failed to copy text');
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);
    }
  };

  const handleParagraphSummary = async () => {
    if (!extractedText || extractedText.trim() === '') {
      setCopyMessage('No text to summarize');
      setTimeout(() => setCopyMessage(''), 3000);
      return;
    }

    try {
      setIsAnalyzing(true);
      setCopyMessage('Generating summary...');
      
      // Set cursor to waiting while summary is being generated
      document.body.style.cursor = 'wait';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates concise, well-structured summaries. Summarize the given text in exactly 100 words, maintaining the key points and main ideas while ensuring the summary is coherent and readable.'
            },
            {
              role: 'user',
              content: `Please provide a concise 100-word summary of the following text:\n\n${extractedText}`
            }
          ],
          max_tokens: 500,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || 'Failed to generate summary';
      
      // Set the summary in the extracted PDF text textbox (second textbox)
      setAnalysisTextboxValue(summary);
      
      setCopyMessage('Summary generated');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);

    } catch (err) {
      console.error('Summary generation error:', err);
      setCopyMessage('Failed to generate summary');
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);
    } finally {
      setIsAnalyzing(false);
      // Reset cursor to default after summary generation completes
      document.body.style.cursor = 'default';
    }
  };

  const handlePageSummary = async () => {
    if (!extractedText || extractedText.trim() === '') {
      setCopyMessage('No text to summarize');
      setTimeout(() => setCopyMessage(''), 3000);
      return;
    }

    try {
      setIsAnalyzing(true);
      setCopyMessage('Generating summary...');
      
      // Set cursor to waiting while summary is being generated
      document.body.style.cursor = 'wait';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that creates comprehensive, well-structured summaries. Summarize the given text in exactly 400 words, maintaining all key points and main ideas while ensuring the summary is coherent, detailed, and readable.'
            },
            {
              role: 'user',
              content: `Please provide a comprehensive 400-word summary of the following text:\n\n${extractedText}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const summary = data.choices[0]?.message?.content || 'Failed to generate summary';
      
      // Set the summary in the extracted PDF text textbox (second textbox)
      setAnalysisTextboxValue(summary);
      
      setCopyMessage('Summary generated');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);

    } catch (err) {
      console.error('Summary generation error:', err);
      setCopyMessage('Failed to generate summary');
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);
    } finally {
      setIsAnalyzing(false);
      // Reset cursor to default after summary generation completes
      document.body.style.cursor = 'default';
    }
  };

  const handleAskQuestion = () => {
    setShowQueryModal(true);
  };

  const handleQuerySubmit = async () => {
    if (!queryText.trim() || !extractedText.trim()) {
      setCopyMessage('Please enter a question and ensure PDF text is loaded');
      setTimeout(() => setCopyMessage(''), 3000);
      return;
    }

    try {
      setIsAnalyzing(true);
      setCopyMessage('Generating answer...');
      setShowQueryModal(false);
      
      // Set cursor to waiting while answer is being generated
      document.body.style.cursor = 'wait';

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are a helpful assistant that answers questions about PDF content. Provide clear, accurate, and detailed answers based on the provided text. If the answer cannot be found in the text, say so clearly.'
            },
            {
              role: 'user',
              content: `Based on the following PDF content, please answer this question: "${queryText}"\n\nPDF Content:\n${extractedText}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content || 'Failed to generate answer';
      
      // Set the answer in the extracted PDF text textbox (second textbox)
      setAnalysisTextboxValue(`Question: ${queryText}\n\nAnswer: ${answer}`);
      
      setCopyMessage('Answer generated');
      
      // Clear the message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);

    } catch (err) {
      console.error('Answer generation error:', err);
      setCopyMessage('Failed to generate answer');
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setCopyMessage('');
      }, 3000);
    } finally {
      setIsAnalyzing(false);
      setQueryText('');
      // Reset cursor to default after answer generation completes
      document.body.style.cursor = 'default';
    }
  };

  const handleMicClick = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setCopyMessage('Speech recognition not supported in this browser');
      setTimeout(() => setCopyMessage(''), 3000);
      return;
    }

    if (isListening) {
      // Stop recording
      setIsListening(false);
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    } else {
      // Start recording
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      
      recognition.onstart = () => {
        setIsListening(true);
      };
      
      recognition.onresult = (event) => {
        // Handle incremental results properly
        let finalTranscript = '';
        let interimTranscript = '';

        // Process all results incrementally
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results.item(i);
          const transcript = result.item(0).transcript;
          
          if (result.isFinal) {
            finalTranscript += transcript + ' ';
          } else {
            interimTranscript = transcript; // Only keep the latest interim
          }
        }

        // Combine final and latest interim results
        const combinedTranscript = (finalTranscript + interimTranscript).trim();
        
        // Update the text with the combined transcript
        if (combinedTranscript) {
          setQueryText(combinedTranscript);
        }
      };
      
      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          setIsListening(false);
          setCopyMessage('Speech recognition error');
          setTimeout(() => setCopyMessage(''), 3000);
        }
      };
      
      recognition.onend = () => {
        // Only stop if user didn't manually stop it
        if (isListening) {
          setIsListening(false);
        }
      };
      
      // Store recognition instance in ref so we can stop it
      speechRecognitionRef.current = recognition;
      recognition.start();
    }
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.includes('pdf')) {
      setError('Please select a PDF file');
      return;
    }

    setSelectedFile(file);
    setError('');
    setIsLoading(true);
    
    // Set cursor to waiting
    document.body.style.cursor = 'wait';

    try {
      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ 
        data: arrayBuffer,
        useSystemFonts: true
      }).promise;
      
      setPdfDocument(pdf);
      setTotalPages(pdf.numPages);
      setCurrentPage(1);

      // Extract text from all pages and store individually
      const pageTextsArray: string[] = [];
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        try {
          const page = await pdf.getPage(i);
          const textContent = await page.getTextContent();
          const pageText = textContent.items
            .map((item: any) => item.str)
            .join(' ');
          pageTextsArray.push(pageText);
          fullText += `Page ${i}:\n${pageText}\n\n`;
        } catch (pageError) {
          console.warn(`Error extracting text from page ${i}:`, pageError);
          pageTextsArray.push('[Text extraction failed]');
          fullText += `Page ${i}:\n[Text extraction failed]\n\n`;
        }
      }
      
      setPageTexts(pageTextsArray);
      setExtractedText(fullText);
      setTopTextboxValue(pageTextsArray[0] || ''); // Show first page text
      renderPage(pdf, 1, scale);

    } catch (err) {
      console.error('PDF processing error:', err);
      setError('Error processing PDF file. Please ensure it\'s a valid PDF document.');
    } finally {
      setIsLoading(false);
      // Reset cursor to default
      document.body.style.cursor = 'default';
    }
  };

  const renderPage = async (pdf: pdfjsLib.PDFDocumentProxy, pageNum: number, currentScale: number) => {
    if (!canvasRef.current) return;

    try {
      const page = await pdf.getPage(pageNum);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (!context) return;

      const viewport = page.getViewport({ scale: currentScale });
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      const renderContext = {
        canvasContext: context,
        viewport: viewport
      };

      await page.render(renderContext).promise;
    } catch (error) {
      console.error('Error rendering page:', error);
      setError('Error rendering PDF page');
    }
  };

  const handlePageChange = (newPage: number) => {
    if (!pdfDocument || newPage < 1 || newPage > totalPages) return;
    
    setCurrentPage(newPage);
    renderPage(pdfDocument, newPage, scale);
    // Textbox will be updated via useEffect
  };

  const handleZoomIn = () => {
    const newScale = Math.min(scale * 1.2, 3.0);
    setScale(newScale);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, newScale);
    }
    // Textbox will be updated via useEffect
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale / 1.2, 0.5);
    setScale(newScale);
    if (pdfDocument) {
      renderPage(pdfDocument, currentPage, newScale);
    }
    // Textbox will be updated via useEffect
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  };

  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const analyzePdf = async () => {
    if (!extractedText.trim()) {
      alert('Please upload a PDF first.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisResult({});

    try {
      let prompt = '';
      let systemPrompt = '';

      switch (analysisType) {
        case 'fullText':
          prompt = `Please provide the full text content from this PDF in a clean, readable format. Remove any formatting artifacts and organize the content logically.`;
          systemPrompt = 'You are a helpful assistant that extracts and formats text from PDF documents.';
          break;
          
        case 'paragraphSummary':
          prompt = `Please provide a comprehensive summary of this PDF document, organized by paragraphs. For each major section or paragraph, provide a concise summary that captures the key points and main ideas.`;
          systemPrompt = 'You are a helpful assistant that creates detailed paragraph-by-paragraph summaries of documents.';
          break;
          
        case 'pageSummary':
          prompt = `Please provide a page-by-page summary of this PDF document. For each page or major section, provide a concise summary that captures the key points, main ideas, and important details.`;
          systemPrompt = 'You are a helpful assistant that creates page-by-page summaries of documents.';
          break;
          
        case 'questionAnswer':
          if (!question.trim()) {
            alert('Please enter a question to ask about the PDF.');
            setIsAnalyzing(false);
            return;
          }
          prompt = `Based on the content of this PDF, please answer the following question: "${question}"\n\nProvide a detailed and accurate answer using only the information available in the document.`;
          systemPrompt = 'You are a helpful assistant that answers questions based on document content.';
          break;
          
        default:
          prompt = `Please provide the full text content from this PDF in a clean, readable format.`;
          systemPrompt = 'You are a helpful assistant that extracts and formats text from PDF documents.';
      }

      // Use the existing getGPTAnswer function with custom system prompt
      const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
      
      if (!apiKey) {
        throw new Error('OpenAI API key not found. Please check your .env file.');
      }

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: systemPrompt
            },
            {
              role: 'user',
              content: `${prompt}\n\nPDF Content:\n${extractedText}`
            }
          ],
          max_tokens: 1000,
          temperature: 0.7
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      const answer = data.choices[0]?.message?.content;

      if (!answer) {
        throw new Error('No response received from OpenAI');
      }

      // Update results based on analysis type
      const newResult: AnalysisResult = {};
      
      switch (analysisType) {
        case 'fullText':
          newResult.fullText = answer;
          break;
        case 'paragraphSummary':
        case 'pageSummary':
          newResult.summary = answer;
          break;
        case 'questionAnswer':
          newResult.questionAnswer = answer;
          break;
      }
      
      setAnalysisResult(newResult);

      if (answer && answer.includes('Max 10-15 pages supported')) {
        setError('Max 10-15 pages supported due to token limits.');
        setIsAnalyzing(false);
        return;
      }

    } catch (error) {
      console.error('Error analyzing PDF:', error);
      alert(`Error analyzing PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Function to handle Word document selection
  const handleWordFileSelect = async (file: File) => {
    setIsLoading(true);
    setError('');
    
    try {
      // For now, we'll extract text from Word documents using a simple approach
      // In a real implementation, you'd use a library like mammoth.js or similar
      const text = await extractTextFromWordDocument(file);
      
      setSelectedFile(file);
      setExtractedText(text);
      setAnalysisTextboxValue(text);
      setTopTextboxValue(text);
      setTotalPages(1); // Word docs are treated as single page for now
      setCurrentPage(1);
      setPageTexts([text]);
      
    } catch (err) {
      console.error('Error processing Word document:', err);
      setError('Failed to process Word document. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Function to extract text from Word document
  const extractTextFromWordDocument = async (file: File): Promise<string> => {
    // This is a placeholder implementation
    // In a real app, you'd use a library like mammoth.js
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          // For now, we'll show a message that Word processing is being implemented
          // In a real implementation, you'd parse the Word document here
          resolve("Word document processing is being implemented. This would extract text from the Word document.");
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read Word document'));
      reader.readAsArrayBuffer(file);
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9998] p-2 sm:p-4" style={{ height: '100vh' }}>
      <div 
        ref={containerRef}
        className="rounded-2xl bg-black p-4 max-h-[95vh] flex flex-col"
        style={{ width: '85vw', boxSizing: 'border-box', border: '2px solid white' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 mb-6 py-3 rounded-xl mx-2 mt-2 glassy-btn" style={{
          background: 'linear-gradient(135deg, rgba(30, 58, 138, 0.9) 0%, rgba(0, 0, 0, 0.95) 100%)',
          border: '2px solid rgba(255, 255, 255, 0.7)',
          boxShadow: '0 4px 24px 0 rgba(30, 58, 138, 0.3), 0 1.5px 0 0 #fff',
          backdropFilter: 'blur(12px)',
          filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.3))'
        }}>
          <h2 className="text-white font-bold text-lg text-center" style={{
            textShadow: '0 1px 4px rgba(30, 58, 138, 0.8)',
            margin: '0',
            padding: '0'
          }}>PDF Reader</h2>
          <button
            onClick={onClose}
            className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
            style={{
              background: '#000000',
              fontSize: '15px',
              border: '1px solid #666666'
            }}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        {/* Content */}
        <div className="flex flex-col lg:flex-row overflow-y-auto flex-1">
          {/* Left Panel - PDF Viewer */}
          <div className="w-full lg:w-2/3 flex flex-col p-2 sm:p-4">
            {/* File Upload */}
            {!selectedFile ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-4">
                <button
                  className="glassy-btn neon-grid-btn px-8 py-4 rounded-2xl text-white font-bold text-sm transition-colors border-0"
                  style={{ background: '#111', minWidth: '200px', border: '1px solid #666666' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Upload PDF document
                </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf"
                    onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    className="hidden"
                  />
                <button
                  className="glassy-btn neon-grid-btn px-8 py-4 rounded-2xl text-white font-bold text-sm transition-colors border-0"
                  style={{ background: '#111', minWidth: '200px', border: '1px solid #666666' }}
                  onClick={() => wordInputRef.current?.click()}
                >
                  Upload Word document
                </button>
                <input
                  ref={wordInputRef}
                  type="file"
                  accept=".docx"
                  onChange={(e) => e.target.files?.[0] && handleWordFileSelect(e.target.files[0])}
                  className="hidden"
                />
              </div>
            ) : (
              <>
                {/* File Info */}
                <div className="animated-rainbow-border rounded-2xl p-[5px] bg-black min-h-[34px] h-auto flex items-center justify-center gap-3 w-full min-w-0 overflow-visible">
                  <MdDescription className="text-red-500" size={20} />
                  <div className="flex-1 min-w-0 h-full flex items-center justify-center">
                    <h4 className="font-bold text-white text-[11px] h-[20px] w-full flex items-center justify-center text-center truncate max-w-full">{selectedFile.name}</h4>
                    <p className="text-xs text-gray-300 hidden">
                        {formatFileSize(selectedFile.size)} • {totalPages} pages
                      </p>
                  </div>
                </div>
                {/* PDF Controls */}
                <div className="animated-rainbow-border rounded-2xl pl-[5px] pr-[5px] pt-[15px] pb-[5px] bg-black min-h-[44px] h-auto flex flex-wrap items-center justify-between gap-1 max-w-full w-full overflow-visible">
                  <div className="flex items-center gap-1 h-[36px] min-w-0 flex-1 -mt-[10px]">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1}
                      className="p-3 h-full flex items-center min-w-0 text-white glassy-btn neon-grid-btn rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ border: '1px solid #666666' }}
                    >
                      <MdNavigateBefore size={32} />
                    </button>
                    <span className="text-[10px] font-bold text-white flex items-center h-full min-w-0 truncate pl-0 pr-3">
                      Page {currentPage}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages}
                      className="p-3 h-full flex items-center min-w-0 text-white glassy-btn neon-grid-btn rounded disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ border: '1px solid #666666' }}
                    >
                      <MdNavigateNext size={32} />
                    </button>
                  </div>
                  <div className="flex items-center gap-1 h-[36px] min-w-0 flex-1 -mt-[10px]">
                    <button
                      onClick={handleZoomOut}
                      className="p-3 h-full flex items-center min-w-0 text-white glassy-btn neon-grid-btn rounded"
                      style={{ border: '1px solid #666666' }}
                    >
                      <MdZoomOut size={32} />
                    </button>
                    <span className="text-[10px] font-bold text-white flex items-center h-full min-w-0 truncate pl-0 pr-3">{Math.round(scale * 100)}%</span>
                    <button
                      onClick={handleZoomIn}
                      className="p-3 h-full flex items-center min-w-0 text-white glassy-btn neon-grid-btn rounded"
                      style={{ border: '1px solid #666666' }}
                    >
                      <MdZoomIn size={32} />
                    </button>
                  </div>
                </div>
                {/* Extracted PDF Text */}
                <div className="mb-4 pt-2">
                  <h3 className="font-bold text-white text-[11px] mb-3">Extracted document: Page {currentPage} of {totalPages}</h3>
                  <textarea
                    value={topTextboxValue}
                    onChange={e => setTopTextboxValue(e.target.value)}
                    placeholder="PDF text will appear here..."
                    className="w-full min-w-0 p-3 animated-rainbow-border bg-black border-2 border-white rounded-2xl resize-none font-bold focus:ring-2 focus:ring-white focus:border-transparent text-[10px] overflow-y-scroll touch-pan-y touch-manipulation overscroll-contain pdf-reader-textarea"
                    style={{ 
                      color: '#fff', 
                      background: '#000', 
                      borderColor: 'white',
                      fontSize: `${Math.max(8, Math.min(16, 10 * scale))}px`,
                      lineHeight: `${Math.max(1.2, Math.min(2.0, 1.4 * scale))}`,
                      height: '150px'
                    }}
                  />
                  
                  {/* PDF Flipbook and Copy buttons */}
                  <div className="flex gap-3 mt-3">
                    <button
                      onClick={() => setShowPdfFlipbookModal(true)}
                      className="w-full p-3 glassy-btn neon-grid-btn text-[11px] font-bold rounded-2xl transition-colors border-0"
                      style={{ background: '#111', border: '1px solid #666666' }}
                      aria-label="Open PDF flipbook"
                      type="button"
                    >
                      PDF Flipbook
                    </button>
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        handleCopyText();
                      }}
                      className={`w-full p-3 glassy-btn neon-grid-btn text-[11px] font-bold rounded-2xl transition-colors border-0 ${analysisType === 'pageSummary' ? 'ring-4 ring-blue-400' : ''}`}
                      style={{ background: '#111', border: '1px solid #666666' }}
                      aria-label="Copy text"
                      type="button"
                    >
                      Copy text
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
          {/* Right Panel - Analysis */}
          <div className="w-full lg:w-1/3 flex flex-col p-2 sm:p-4 border-t-0 lg:border-t-0 lg:border-l-0">
            {/* Analysis Toggle */}
            {selectedFile && (
              <>
                {/* Copy Message */}
                {copyMessage && (
                  <div className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[10000]" style={{ animation: 'fadeInUp 0.3s ease-out' }}>
                    <div className="glassy-btn neon-grid-btn rounded-2xl border-0 p-6 min-w-[300px] max-w-[90vw] ring-2 ring-green-400 ring-opacity-60" style={{
                      background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.85) 0%, rgba(0, 0, 0, 0.95) 100%)',
                      boxShadow: '0 8px 32px 0 rgba(34, 197, 94, 0.25), 0 1.5px 0 0 #fff',
                      border: '2px solid rgba(255, 255, 255, 0.7)',
                      backdropFilter: 'blur(12px)',
                      color: '#fff'
                    }}>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl" style={{ filter: 'drop-shadow(0 0 6px #22c55e)' }}>✅</div>
                        <div className="flex-1">
                          <p className="text-white font-bold text-lg" style={{ textShadow: '0 1px 4px #22c55e' }}>{copyMessage}</p>
                        </div>
                        <button
                          onClick={() => setCopyMessage('')}
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:text-gray-300 transition-colors force-black-button"
                          style={{
                            background: 'rgba(34, 197, 94, 0.7)',
                            fontSize: '22px',
                            border: '1px solid #fff'
                          }}
                          aria-label="Close message"
                        >×</button>
                      </div>
                    </div>
                  </div>
                )}
                {/* Analysis Options */}
                <div className="mb-4" style={{ marginTop: '-20px' }}>
                  <h3 className="font-bold text-white text-[11px] mb-3">Analysis Options</h3>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      className={`w-full p-3 glassy-btn neon-grid-btn text-[11px] font-bold rounded-2xl transition-colors border-0 ${analysisType === 'paragraphSummary' ? 'ring-4 ring-blue-400' : ''}`}
                      style={{ background: '#111', border: '1px solid #666666' }}
                      onClick={handleParagraphSummary}
                    >
                      Paragraph summary
                    </button>
                    <button
                      className={`w-full p-3 glassy-btn neon-grid-btn text-[11px] font-bold rounded-2xl transition-colors border-0 ${analysisType === 'pageSummary' ? 'ring-4 ring-blue-400' : ''}`}
                      style={{ background: '#111', border: '1px solid #666666' }}
                      onClick={handlePageSummary}
                    >
                      Page summary
                    </button>
                    <button
                      className={`w-full p-3 glassy-btn neon-grid-btn text-[11px] font-bold rounded-2xl transition-colors border-0 ${analysisType === 'questionAnswer' ? 'ring-4 ring-blue-400' : ''}`}
                      style={{ background: '#111', border: '1px solid #666666' }}
                      onClick={handleAskQuestion}
                    >
                      Ask a question
                    </button>
                  </div>
                </div>
                {/* Question Input */}
                {analysisType === 'questionAnswer' && (
                  <div className="mb-4">
                    <h3 className="font-bold text-white mb-3">Ask a Question</h3>
                    <textarea
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Enter your question about the PDF content..."
                      className="w-full min-w-0 p-3 animated-rainbow-border bg-black border-0 rounded-2xl resize-none font-bold focus:ring-2 focus:ring-white focus:border-transparent"
                      style={{ color: '#fff', background: '#000' }}
                      rows={3}
                    />
                  </div>
                )}
                {/* Extracted PDF Text */}
                {analysisType === 'fullText' && (
                  <div className="mb-4 pt-2">
                    <h3 className="font-bold text-white text-[11px] mb-3" style={{ marginTop: '-5px' }}>Result</h3>
                    <textarea
                      value={analysisTextboxValue}
                      onChange={e => setAnalysisTextboxValue(e.target.value)}
                      placeholder="PDF text will appear here..."
                      className="w-full min-w-0 p-3 animated-rainbow-border bg-black border-2 border-white rounded-2xl resize-none font-bold focus:ring-2 focus:ring-white focus:border-transparent text-[10px] overflow-y-scroll max-h-96 touch-pan-y touch-manipulation overscroll-contain pdf-reader-textarea"
                      style={{ 
                        color: '#fff', 
                        background: '#000', 
                        borderColor: 'white',
                        fontSize: `${Math.max(8, Math.min(16, 10 * scale))}px`,
                        lineHeight: `${Math.max(1.2, Math.min(2.0, 1.4 * scale))}`
                      }}
                      rows={10}
                    />
                    
                    {/* Copy button for second textbox */}
                    <button
                      className="w-full mt-3 p-3 glassy-btn neon-grid-btn text-[11px] font-bold rounded-2xl transition-colors border-0"
                      style={{ background: '#111', border: '1px solid #666666' }}
                      onClick={async (e) => {
                        e.preventDefault();
                        
                        if (!analysisTextboxValue || analysisTextboxValue.trim() === '') {
                          setCopyMessage('No text to copy');
                          setTimeout(() => setCopyMessage(''), 3000);
                          return;
                        }

                        try {
                          // Select all text in the second textbox for visual feedback with blue selection
                          const textareas = document.querySelectorAll('.pdf-reader-textarea') as NodeListOf<HTMLTextAreaElement>;
                          const secondTextarea = textareas[1]; // Get the second textbox
                          if (secondTextarea) {
                            secondTextarea.select();
                            secondTextarea.setSelectionRange(0, secondTextarea.value.length);
                            
                            // Clear selection after 2 seconds
                            setTimeout(() => {
                              secondTextarea.setSelectionRange(0, 0);
                            }, 2000);
                          }
                          
                          // Try modern clipboard API first
                          if (navigator.clipboard && navigator.clipboard.writeText) {
                            await navigator.clipboard.writeText(analysisTextboxValue);
                            setCopyMessage('Text copied');
                          } else {
                            // Fallback for older browsers or when clipboard API is not available
                            const textArea = document.createElement('textarea');
                            textArea.value = analysisTextboxValue;
                            textArea.style.position = 'fixed';
                            textArea.style.left = '-999999px';
                            textArea.style.top = '-999999px';
                            document.body.appendChild(textArea);
                            textArea.focus();
                            textArea.select();
                            
                            const successful = document.execCommand('copy');
                            document.body.removeChild(textArea);
                            
                            if (successful) {
                              setCopyMessage('Text copied');
                            } else {
                              throw new Error('Copy command failed');
                            }
                          }
                          
                          // Clear the message after 3 seconds
                          setTimeout(() => {
                            setCopyMessage('');
                          }, 3000);
                        } catch (err) {
                          console.error('Failed to copy text:', err);
                          setCopyMessage('Failed to copy text');
                          
                          // Clear the error message after 3 seconds
                          setTimeout(() => {
                            setCopyMessage('');
                          }, 3000);
                        }
                      }}
                    >
                      Copy text
                    </button>
                  </div>
                )}

              </>
            )}
          </div>
        </div>
        {/* Error Message (top of modal) */}
            {error && (
          <div className="fixed left-1/2 top-1/2 z-[9999] transform -translate-x-1/2 -translate-y-1/2 p-6 rounded-2xl text-sm font-bold bg-red-600 text-white border-0 shadow-lg flex items-center justify-center w-full max-w-[80vw]" style={{ fontWeight: 700, boxShadow: '0 2px 12px 2px #ff0033, 0 1.5px 6px #a1001a', background: 'linear-gradient(135deg, #ff0033 80%, #a1001a 100%)' }}>
            <span className="pr-8 mx-auto text-center w-full">{error}</span>
            <button
              onClick={() => setError('')}
              className="absolute top-1 right-1 w-6 h-6 rounded-full text-sm font-bold text-white hover:text-gray-300 flex items-center justify-center z-10"
              style={{ background: '#111', border: 'none', outline: 'none', boxShadow: '0 0 6px 1.5px #ff0033' }}
              aria-label="Dismiss error"
            >
              ×
            </button>
              </div>
            )}
      </div>
      
      {/* Query Document Modal */}
      {showQueryModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75">
          <div className="rounded-2xl bg-black p-0 flex flex-col" style={{ boxSizing: 'border-box', border: '2px solid white', width: '85vw' }}>
            {/* Modal Header */}
            <div 
              className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
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
                Query Document
              </h2>
              <button
                onClick={() => {
                  setShowQueryModal(false);
                  setQueryText('');
                }}
                className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
                style={{ background: '#000000' }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            {/* Question Label */}
            <div className="mb-4">
              <label className="block text-white font-bold text-sm mb-2">
                What would you like to ask about the content?
              </label>
            </div>
            
            {/* Text Input */}
            <div className="mb-6 px-4">
              <textarea
                value={queryText}
                onChange={(e) => setQueryText(e.target.value)}
                placeholder="Record or type your question"
                className="w-full p-3 bg-black border-2 border-white rounded-2xl text-white font-bold focus:ring-2 focus:ring-white focus:border-transparent text-sm resize-none"
                style={{ borderColor: 'white' }}
                rows={3}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleQuerySubmit();
                  }
                }}
              />
            </div>
            
            {/* Submit Button and Mic */}
            <div className="flex gap-3 px-4 pb-4 pr-5">
              <button
                onClick={handleMicClick}
                className={`glassy-btn neon-grid-btn px-4 py-1 rounded-2xl text-white transition-colors text-sm border-0 ${
                  isListening ? 'animate-pulse' : ''
                }`}
                style={{ 
                  background: isListening ? '#dc2626' : '#111', 
                  fontSize: '0.9rem', 
                  width: '40px',
                  height: '40px',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #666666'
                }}
                aria-label={isListening ? 'Stop listening' : 'Start listening'}
                type="button"
              >
                <span className={`text-2xl ${isListening ? 'text-red-200' : ''}`}>🎤</span>
              </button>
              <button
                onClick={() => setQueryText('')}
                className="glassy-btn neon-grid-btn px-4 py-1 rounded-2xl text-white transition-colors text-sm border-0"
                style={{ background: '#111', fontSize: '0.8rem', minWidth: '80px', border: '1px solid #666666' }}
                aria-label="Clear text"
                type="button"
              >
                Clear
              </button>
              <button
                onClick={handleQuerySubmit}
                disabled={!queryText.trim()}
                className="glassy-btn neon-grid-btn px-4 py-1 rounded-2xl text-white transition-colors text-sm border-0"
                style={{ background: '#111', fontSize: '0.8rem', minWidth: '120px', border: '1px solid #666666' }}
                aria-label="Submit question"
                type="button"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* PDF Flipbook Modal */}
      {showPdfFlipbookModal && selectedFile && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75">
          <div className="rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col" style={{ boxSizing: 'border-box', height: '90vh', border: '2px solid white' }}>
            {/* Modal Header */}
            <div 
              className="relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn" 
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
                PDF Flipbook - {selectedFile.name}
              </h2>
              <button
                onClick={() => setShowPdfFlipbookModal(false)}
                className="absolute top-2 right-2 w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors"
                style={{ background: '#000000' }}
                aria-label="Close modal"
              >
                ×
              </button>
            </div>
            
            {/* PDF Viewer */}
            <div className="flex-1 px-4 pb-4 overflow-hidden">
              <div className="w-full h-full flex flex-col">
                {/* PDF Controls */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                      disabled={currentPage <= 1}
                      className="glassy-btn neon-grid-btn px-3 py-1 rounded-xl text-white transition-colors text-sm border-0"
                      style={{ background: '#111', border: '1px solid #666666' }}
                    >
                      ← Previous
                    </button>
                    <span className="text-white font-bold text-sm">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage >= totalPages}
                      className="glassy-btn neon-grid-btn px-3 py-1 rounded-xl text-white transition-colors text-sm border-0"
                      style={{ background: '#111', border: '1px solid #666666' }}
                    >
                      Next →
                    </button>
                  </div>
                  <button
                    onClick={() => setShowPdfFlipbookModal(false)}
                    className="glassy-btn neon-grid-btn px-3 py-1 rounded-xl text-white transition-colors text-sm border-0"
                    style={{ background: '#111' }}
                  >
                    Close
                  </button>
                </div>
                
                {/* PDF Canvas */}
                <div className="flex-1 bg-white rounded-xl overflow-hidden flex items-center justify-center">
                  <canvas
                    ref={canvasRef}
                    className="w-full h-full object-contain"
                    style={{ 
                      width: '100%', 
                      height: '100%',
                      objectFit: 'contain'
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 