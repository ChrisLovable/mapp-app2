import React, { useState } from 'react'
import type { ExcelFile, ChunkingResult } from '../types/excel'
import { MdClose, MdSend, MdHistory, MdInfo, MdDataUsage, MdEdit, MdSettings } from 'react-icons/md'

interface ExcelQueryModalProps {
  isOpen: boolean
  onClose: () => void
  excelFile: ExcelFile | null
  chunkingResult?: ChunkingResult | null
}

interface QueryHistory {
  id: string
  question: string
  answer: string
  timestamp: Date
}

export default function ExcelQueryModal({ isOpen, onClose, excelFile, chunkingResult }: ExcelQueryModalProps) {
  const [question, setQuestion] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentAnswer, setCurrentAnswer] = useState('')
  const [error, setError] = useState('')
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([])
  const [showPromptEditor, setShowPromptEditor] = useState(false)
  const [customPrompt, setCustomPrompt] = useState(`You are an Excel data analyst assistant. You have access to the following Excel file data:

{CONTEXT}

User Question: {QUESTION}

Please provide a comprehensive answer based on the Excel data. If the question cannot be answered with the available data, please explain what additional information would be needed. Be specific and include relevant data points when possible.

Answer:`)

  const handleSubmitQuery = async () => {
    if (!question.trim() || !excelFile) return

    setIsLoading(true)
    setError('')
    setCurrentAnswer('')

    try {
      // Prepare the context from Excel data and chunks
      const context = chunkingResult 
        ? prepareEnhancedContext(excelFile, chunkingResult)
        : prepareExcelContext(excelFile)
      
      // Create the prompt for GPT-4o
      const prompt = createQueryPrompt(question, context)
      
      // Call GPT-4o API
      const response = await queryGPT4o(prompt)
      
      // Store in history
      const newQuery: QueryHistory = {
        id: crypto.randomUUID(),
        question: question,
        answer: response,
        timestamp: new Date()
      }
      
      setQueryHistory(prev => [newQuery, ...prev])
      setCurrentAnswer(response)
      setQuestion('') // Clear input for next query
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get answer')
    } finally {
      setIsLoading(false)
    }
  }

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const prepareEnhancedContext = (file: ExcelFile, result: ChunkingResult): string => {
    let context = `Excel File: ${file.name}\n`
    context += `Total Sheets: ${file.totalSheets}\n`
    context += `File Size: ${formatFileSize(file.size)}\n`
    context += `Semantic Chunks: ${result.totalChunks} chunks created\n`
    context += `Total Rows Processed: ${result.chunks.reduce((sum, chunk) => sum + chunk.totalRows, 0)}\n\n`
    
    // Add chunk information
    context += `CHUNK ANALYSIS:\n`
    result.chunks.forEach((chunk, index) => {
      context += `\nChunk ${index + 1} (${chunk.sheetName}):\n`
      context += `  Rows: ${chunk.rowStart}-${chunk.rowEnd} (${chunk.totalRows} rows)\n`
      context += `  Columns: ${chunk.columns.join(', ')}\n`
      context += `  Summary: ${chunk.metadata.semanticSummary}\n`
      
      // Add sample data from first few rows
      if (chunk.rawData.length > 0) {
        context += `  Sample Data:\n`
        chunk.rawData.slice(0, 3).forEach((row, rowIndex) => {
          context += `    Row ${rowIndex + 1}: ${row.join(' | ')}\n`
        })
      }
    })
    
    return context
  }

  const prepareExcelContext = (file: ExcelFile): string => {
    let context = `Excel File: ${file.name}\n`
    context += `Total Sheets: ${file.totalSheets}\n`
    context += `File Size: ${formatFileSize(file.size)}\n\n`
    
    context += `SHEETS INFORMATION:\n`
    file.sheets.forEach((sheet, index) => {
      context += `\nSheet ${index + 1}: ${sheet.name}\n`
      context += `  Rows: ${sheet.rowCount}\n`
      context += `  Columns: ${sheet.columnCount}\n`
      context += `  Headers: ${sheet.headers.join(', ')}\n`
      context += `  Preview Data:\n`
      sheet.previewData.forEach((row, rowIndex) => {
        context += `    Row ${rowIndex + 1}: ${row.join(' | ')}\n`
      })
    })
    
    return context
  }

  const createQueryPrompt = (question: string, context: string): string => {
    return customPrompt
      .replace('{CONTEXT}', context)
      .replace('{QUESTION}', question)
  }

  const queryGPT4o = async (prompt: string): Promise<string> => {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    
    if (!apiKey) {
      throw new Error('OpenAI API key not found. Please check your .env file.')
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Excel data analyst. Provide clear, accurate answers based on the data provided. If you cannot answer with the given data, explain what additional information is needed.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.3
      })
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OpenAI API error: ${errorData.error?.message || response.statusText}`)
    }

    const data = await response.json()
    const answer = data.choices[0]?.message?.content

    if (!answer) {
      throw new Error('No response received from OpenAI')
    }

    return answer
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmitQuery()
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-blue-50 to-purple-50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <MdDataUsage className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Excel Data Query</h2>
              <p className="text-sm text-gray-600">Ask questions about your Excel data</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowPromptEditor(!showPromptEditor)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Edit Prompt Template"
            >
              <MdSettings size={20} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <MdClose size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col h-[calc(90vh-120px)] p-4">
          {/* File Info Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
            {excelFile && (
              <div className="bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <MdInfo className="text-blue-600" size={16} />
                  <h3 className="font-medium text-blue-900">File Information</h3>
                </div>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><span className="font-medium">Name:</span> {excelFile.name}</p>
                  <p><span className="font-medium">Size:</span> {formatFileSize(excelFile.size)}</p>
                  <p><span className="font-medium">Sheets:</span> {excelFile.totalSheets}</p>
                </div>
              </div>
            )}

            {chunkingResult && (
              <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <MdDataUsage className="text-purple-600" size={16} />
                  <h3 className="font-medium text-purple-900">Semantic Analysis</h3>
                </div>
                <div className="space-y-1 text-sm text-purple-800">
                  <p>• {chunkingResult.totalChunks} chunks created</p>
                  <p>• {chunkingResult.chunks.reduce((sum, chunk) => sum + chunk.totalRows, 0)} rows processed</p>
                  <p>• {chunkingResult.processingTime}ms processing time</p>
                </div>
              </div>
            )}
          </div>

          {/* Prompt Editor */}
          {showPromptEditor && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center gap-2 mb-2">
                <MdEdit className="text-gray-600" size={16} />
                <h3 className="font-medium text-gray-900">Prompt Template</h3>
              </div>
              <textarea
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                className="w-full h-32 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                placeholder="Customize the prompt template. Use {CONTEXT} and {QUESTION} as placeholders."
              />
              <div className="text-xs text-gray-500 mt-1">
                Use {'{CONTEXT}'} for Excel data and {'{QUESTION}'} for user question
              </div>
            </div>
          )}

          {/* Query Input */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ask a question about your Excel data:
            </label>
            <div className="relative">
                                <textarea
                    value={question}
                    onChange={(e) => setQuestion(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="e.g., What is the total sales for Q1? Which product has the highest revenue? Show me trends in the data..."
                    className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    rows={4}
                    disabled={isLoading || !excelFile}
                  />
              <button
                onClick={handleSubmitQuery}
                disabled={isLoading || !question.trim() || !excelFile}
                className="absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {isLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                ) : (
                  <MdSend size={16} />
                )}
              </button>
            </div>
          </div>

          {/* Current Answer */}
          {currentAnswer && (
            <div className="mb-4 bg-gray-50 rounded-lg p-4 border">
              <h3 className="font-medium text-gray-900 mb-2">Latest Answer:</h3>
              <textarea
                value={currentAnswer}
                readOnly
                className="w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 text-sm font-mono"
                rows={Math.max(4, currentAnswer.split('\n').length + 2)}
                onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              />
              <div className="flex justify-end mt-2">
                <button
                  onClick={() => navigator.clipboard.writeText(currentAnswer)}
                  className="text-xs text-blue-600 hover:text-blue-800 underline"
                >
                  Copy to clipboard
                </button>
              </div>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-lg p-3">
              <div className="flex items-center gap-2">
                <MdInfo className="text-red-500" size={16} />
                <p className="text-red-700 text-sm">{error}</p>
              </div>
            </div>
          )}

          {/* Query History */}
          <div className="flex-1 overflow-y-auto">
            <div className="flex items-center gap-2 mb-4">
              <MdHistory className="text-gray-600" size={20} />
              <h3 className="font-medium text-gray-900">Query History</h3>
            </div>
            
            <div className="space-y-3">
              {queryHistory.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  <MdHistory className="mx-auto text-gray-300" size={48} />
                  <p className="mt-2 text-sm">No queries yet</p>
                  <p className="text-xs">Your questions and answers will appear here</p>
                </div>
              ) : (
                queryHistory.map((query) => (
                  <div key={query.id} className="bg-white rounded-lg p-3 border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-gray-500">
                        {query.timestamp.toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="space-y-2">
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">Question:</h4>
                        <p className="text-gray-700 text-sm">{query.question}</p>
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-900 text-sm mb-1">Answer:</h4>
                        <p className="text-gray-600 text-sm line-clamp-3">
                          {query.answer}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 