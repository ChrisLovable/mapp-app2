// Shared LLM method types for consistency across the codebase
export type LLMMethod = 'virl' | 'gpt' | 'fallback' | null;

// User-friendly labels for display
export const methodLabels: Record<NonNullable<LLMMethod>, string> = {
  virl: 'Real-time Search',
  gpt: 'AI Response', 
  fallback: 'Fallback Response'
};

// Source labels for display
export const sourceLabels: Record<NonNullable<LLMMethod>, string> = {
  virl: '🕵️ Real-time Web Search',
  gpt: '🤖 AI Response',
  fallback: '⚠️ Fallback Response'
};

// Helper function to get display label
export function getMethodLabel(method: LLMMethod): string {
  return method ? methodLabels[method] : 'Unknown';
}

// Helper function to get source label
export function getSourceLabel(method: LLMMethod): string {
  return method ? sourceLabels[method] : '🤖 Response';
} 