import * as pdfjsLib from 'pdfjs-dist';
// Configure PDF.js worker for different environments
export function setupPdfWorker() {
    if (typeof window === 'undefined') {
        return; // Server-side rendering
    }
    try {
        // Check if we're in production
        if (import.meta.env.PROD) {
            // Production: Use CDN worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
        }
        else {
            // Development: Use local worker
            pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).toString();
        }
    }
    catch (error) {
        console.warn('Failed to set up PDF worker, using fallback:', error);
        // Fallback: Use CDN worker
        pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
}
// Initialize the worker
setupPdfWorker();
