// Centralized runtime configuration for APIs and proxies
// UI is untouched; only fetch bases change to use env-driven values

export const DASHBOARD_API_BASE =
  import.meta.env.VITE_DASHBOARD_API_URL || '/api';

export const TOKEN_API_BASE =
  import.meta.env.VITE_TOKEN_API_URL || '/api';

export const SEARCH_PROXY_URL =
  import.meta.env.VITE_SEARCH_PROXY_URL || '/api/search';

export const AZURE_TTS_BASE =
  import.meta.env.VITE_AZURE_TTS_URL || '/api/azure-tts';

export const AZURE_VOICES_URL =
  import.meta.env.VITE_AZURE_VOICES_URL || '/api/azure-voices';

// n8n webhook base (e.g., https://n8n.yourdomain.com/webhook)
export const N8N_WEBHOOK_BASE =
  import.meta.env.VITE_N8N_WEBHOOK_BASE || '';


