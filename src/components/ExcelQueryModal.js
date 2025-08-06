import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import React, { useState } from 'react';
import { MdClose, MdSend, MdHistory, MdInfo, MdDataUsage, MdEdit, MdSettings } from 'react-icons/md';
export default function ExcelQueryModal({ isOpen, onClose, excelFile, chunkingResult }) {
    const [question, setQuestion] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [error, setError] = useState('');
    const [queryHistory, setQueryHistory] = useState([]);
    const [showPromptEditor, setShowPromptEditor] = useState(false);
    const [customPrompt, setCustomPrompt] = useState(`You are an Excel data analyst assistant. You have access to the following Excel file data:

{CONTEXT}

User Question: {QUESTION}

Please provide a comprehensive answer based on the Excel data. If the question cannot be answered with the available data, please explain what additional information would be needed. Be specific and include relevant data points when possible.

Answer:`);
    const handleSubmitQuery = async () => {
        if (!question.trim() || !excelFile)
            return;
        setIsLoading(true);
        setError('');
        setCurrentAnswer('');
        try {
            // Prepare the context from Excel data and chunks
            const context = chunkingResult
                ? prepareEnhancedContext(excelFile, chunkingResult)
                : prepareExcelContext(excelFile);
            // Create the prompt for GPT-4o
            const prompt = createQueryPrompt(question, context);
            // Call GPT-4o API
            const response = await queryGPT4o(prompt);
            // Store in history
            const newQuery = {
                id: crypto.randomUUID(),
                question: question,
                answer: response,
                timestamp: new Date()
            };
            setQueryHistory(prev => [newQuery, ...prev]);
            setCurrentAnswer(response);
            setQuestion(''); // Clear input for next query
        }
        catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to get answer');
        }
        finally {
            setIsLoading(false);
        }
    };
    const formatFileSize = (bytes) => {
        if (bytes === 0)
            return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    const prepareEnhancedContext = (file, result) => {
        let context = `Excel File: ${file.name}\n`;
        context += `Total Sheets: ${file.totalSheets}\n`;
        context += `File Size: ${formatFileSize(file.size)}\n`;
        context += `Semantic Chunks: ${result.totalChunks} chunks created\n`;
        context += `Total Rows Processed: ${result.chunks.reduce((sum, chunk) => sum + chunk.totalRows, 0)}\n\n`;
        // Add chunk information
        context += `CHUNK ANALYSIS:\n`;
        result.chunks.forEach((chunk, index) => {
            context += `\nChunk ${index + 1} (${chunk.sheetName}):\n`;
            context += `  Rows: ${chunk.rowStart}-${chunk.rowEnd} (${chunk.totalRows} rows)\n`;
            context += `  Columns: ${chunk.columns.join(', ')}\n`;
            context += `  Summary: ${chunk.metadata.semanticSummary}\n`;
            // Add sample data from first few rows
            if (chunk.rawData.length > 0) {
                context += `  Sample Data:\n`;
                chunk.rawData.slice(0, 3).forEach((row, rowIndex) => {
                    context += `    Row ${rowIndex + 1}: ${row.join(' | ')}\n`;
                });
            }
        });
        return context;
    };
    const prepareExcelContext = (file) => {
        let context = `Excel File: ${file.name}\n`;
        context += `Total Sheets: ${file.totalSheets}\n`;
        context += `File Size: ${formatFileSize(file.size)}\n\n`;
        context += `SHEETS INFORMATION:\n`;
        file.sheets.forEach((sheetName, index) => {
            context += `\nSheet ${index + 1}: ${sheetName}\n`;
            // Since we don't have detailed sheet info, we'll just show the sheet name
            context += `  Sheet Name: ${sheetName}\n`;
        });
        return context;
    };
    const createQueryPrompt = (question, context) => {
        return customPrompt
            .replace('{CONTEXT}', context)
            .replace('{QUESTION}', question);
    };
    const queryGPT4o = async (prompt) => {
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
        return answer;
    };
    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmitQuery();
        }
    };
    if (!isOpen)
        return null;
    return (_jsx("div", { className: "fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[9999] p-4", children: _jsxs("div", { className: "rounded-2xl bg-black p-0 w-full max-w-4xl mx-4 flex flex-col", style: { boxSizing: 'border-box', maxHeight: '90vh', border: '2px solid white' }, children: [_jsxs("div", { className: "relative mb-6 px-4 py-3 rounded-xl mx-2 mt-2 glassy-btn", style: {
                        background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 58, 138, 0.9))',
                        border: '2px solid rgba(255, 255, 255, 0.4)',
                        boxShadow: '0 8px 25px rgba(0, 0, 0, 0.4), 0 4px 12px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.2), inset 0 -1px 0 rgba(0, 0, 0, 0.3)',
                        backdropFilter: 'blur(10px)',
                        textShadow: '0 1px 2px rgba(0, 0, 0, 0.8)',
                        filter: 'drop-shadow(0 0 8px rgba(30, 58, 138, 0.3))',
                        transform: 'translateZ(5px)'
                    }, children: [_jsx("h2", { className: "text-white font-bold text-base text-center", style: {
                                textShadow: '0 2px 4px rgba(0, 0, 0, 0.8), 0 4px 8px rgba(0, 0, 0, 0.6), 0 0 0 1px rgba(255, 255, 255, 0.3)',
                                filter: 'drop-shadow(0 0 2px rgba(255, 255, 255, 0.5))',
                                transform: 'translateZ(3px)'
                            }, children: "Excel Data Query" }), _jsxs("div", { className: "absolute top-2 right-2 flex items-center gap-2", children: [_jsx("button", { onClick: () => setShowPromptEditor(!showPromptEditor), className: "w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, title: "Edit Prompt Template", children: "\u2699\uFE0F" }), _jsx("button", { onClick: onClose, className: "w-6 h-6 rounded-full text-white hover:text-gray-300 flex items-center justify-center transition-colors", style: { background: '#000000', fontSize: '15px' }, "aria-label": "Close modal", children: "\u00D7" })] })] }), _jsxs("div", { className: "flex-1 px-4 pb-2 overflow-y-auto", children: [_jsxs("div", { className: "grid grid-cols-1 md:grid-cols-2 gap-3 mb-4", children: [excelFile && (_jsxs("div", { className: "bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg p-3 border border-white", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(MdInfo, { className: "text-blue-600", size: 16 }), _jsx("h3", { className: "font-medium text-blue-900", children: "File Information" })] }), _jsxs("div", { className: "space-y-1 text-sm text-blue-800", children: [_jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Name:" }), " ", excelFile.name] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Size:" }), " ", formatFileSize(excelFile.size)] }), _jsxs("p", { children: [_jsx("span", { className: "font-medium", children: "Sheets:" }), " ", excelFile.totalSheets] })] })] })), chunkingResult && (_jsxs("div", { className: "bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-3 border border-purple-200", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(MdDataUsage, { className: "text-purple-600", size: 16 }), _jsx("h3", { className: "font-medium text-purple-900", children: "Semantic Analysis" })] }), _jsxs("div", { className: "space-y-1 text-sm text-purple-800", children: [_jsxs("p", { children: ["\u2022 ", chunkingResult.totalChunks, " chunks created"] }), _jsxs("p", { children: ["\u2022 ", chunkingResult.chunks.reduce((sum, chunk) => sum + chunk.totalRows, 0), " rows processed"] }), _jsxs("p", { children: ["\u2022 ", chunkingResult.processingTime, "ms processing time"] })] })] }))] }), showPromptEditor && (_jsxs("div", { className: "mb-4 p-3 bg-gray-50 rounded-lg border", children: [_jsxs("div", { className: "flex items-center gap-2 mb-2", children: [_jsx(MdEdit, { className: "text-gray-600", size: 16 }), _jsx("h3", { className: "font-medium text-gray-900", children: "Prompt Template" })] }), _jsx("textarea", { value: customPrompt, onChange: (e) => setCustomPrompt(e.target.value), className: "w-full h-32 p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none", placeholder: "Customize the prompt template. Use {CONTEXT} and {QUESTION} as placeholders." }), _jsxs("div", { className: "text-xs text-gray-500 mt-1", children: ["Use ", '{CONTEXT}', " for Excel data and ", '{QUESTION}', " for user question"] })] })), _jsxs("div", { className: "mb-4", children: [_jsx("label", { className: "block text-sm font-medium text-gray-700 mb-2", children: "Ask a question about your Excel data:" }), _jsxs("div", { className: "relative", children: [_jsx("textarea", { value: question, onChange: (e) => setQuestion(e.target.value), onKeyPress: handleKeyPress, placeholder: "e.g., What is the total sales for Q1? Which product has the highest revenue? Show me trends in the data...", className: "w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900", rows: 4, disabled: isLoading || !excelFile }), _jsx("button", { onClick: handleSubmitQuery, disabled: isLoading || !question.trim() || !excelFile, className: "absolute bottom-3 right-3 p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors", children: isLoading ? (_jsx("div", { className: "animate-spin rounded-full h-4 w-4 border-b-2 border-white" })) : (_jsx(MdSend, { size: 16 })) })] })] }), currentAnswer && (_jsxs("div", { className: "mb-4 bg-gray-50 rounded-lg p-4 border", children: [_jsx("h3", { className: "font-medium text-gray-900 mb-2", children: "Latest Answer:" }), _jsx("textarea", { value: currentAnswer, readOnly: true, className: "w-full p-3 border border-gray-300 rounded-lg resize-none bg-white text-gray-900 text-sm font-mono", rows: Math.max(4, currentAnswer.split('\n').length + 2), onClick: (e) => e.target.select() }), _jsx("div", { className: "flex justify-end mt-2", children: _jsx("button", { onClick: () => navigator.clipboard.writeText(currentAnswer), className: "text-xs text-blue-600 hover:text-blue-800 underline", children: "Copy to clipboard" }) })] })), error && (_jsx("div", { className: "mb-4 bg-red-50 border border-red-200 rounded-lg p-3", children: _jsxs("div", { className: "flex items-center gap-2", children: [_jsx(MdInfo, { className: "text-red-500", size: 16 }), _jsx("p", { className: "text-red-700 text-sm", children: error })] }) })), _jsxs("div", { className: "flex-1 overflow-y-auto", children: [_jsxs("div", { className: "flex items-center gap-2 mb-4", children: [_jsx(MdHistory, { className: "text-gray-600", size: 20 }), _jsx("h3", { className: "font-medium text-gray-900", children: "Query History" })] }), _jsx("div", { className: "space-y-3", children: queryHistory.length === 0 ? (_jsxs("div", { className: "text-center text-gray-500 py-8", children: [_jsx(MdHistory, { className: "mx-auto text-gray-300", size: 48 }), _jsx("p", { className: "mt-2 text-sm", children: "No queries yet" }), _jsx("p", { className: "text-xs", children: "Your questions and answers will appear here" })] })) : (queryHistory.map((query) => (_jsxs("div", { className: "bg-white rounded-lg p-3 border shadow-sm", children: [_jsx("div", { className: "flex items-center justify-between mb-2", children: _jsx("span", { className: "text-xs text-gray-500", children: query.timestamp.toLocaleTimeString() }) }), _jsxs("div", { className: "space-y-2", children: [_jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 text-sm mb-1", children: "Question:" }), _jsx("p", { className: "text-gray-700 text-sm", children: query.question })] }), _jsxs("div", { children: [_jsx("h4", { className: "font-medium text-gray-900 text-sm mb-1", children: "Answer:" }), _jsx("p", { className: "text-gray-600 text-sm line-clamp-3", children: query.answer })] })] })] }, query.id)))) })] })] })] }) }));
}
