-- ===== SAMPLE DATA FOR API TRACKING SYSTEM =====
-- This file populates the API tracking tables with sample data for testing

-- ===== INSERT API TYPES =====
INSERT INTO public.api_types (name, display_name, category, base_cost_per_token, description) VALUES
('openai_gpt', 'OpenAI GPT', 'text', 0.0001, 'OpenAI GPT text generation and completion'),
('openai_gpt4', 'OpenAI GPT-4', 'text', 0.0003, 'OpenAI GPT-4 advanced text generation'),
('image_generation', 'Image Generation', 'image', 0.0020, 'AI image generation using DALL-E or Stable Diffusion'),
('text_to_speech', 'Text to Speech', 'audio', 0.0001, 'Convert text to speech using Azure TTS'),
('speech_to_text', 'Speech to Text', 'audio', 0.0001, 'Convert speech to text using Whisper API'),
('web_search', 'Web Search', 'search', 0.0001, 'Real-time web search using RapidAPI'),
('translate', 'Translation', 'text', 0.0001, 'Text translation between languages'),
('pdf_analysis', 'PDF Analysis', 'document', 0.0002, 'Analyze and extract information from PDF documents'),
('calendar_parsing', 'Calendar Parsing', 'utility', 0.0001, 'Parse natural language into calendar events'),
('expense_categorization', 'Expense Categorization', 'finance', 0.0001, 'Automatically categorize expenses using AI')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    base_cost_per_token = EXCLUDED.base_cost_per_token,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ===== SAMPLE USER TOKEN ALLOCATIONS =====
-- Note: Replace with actual user IDs from your auth.users table
-- For demo purposes, we'll use placeholder UUIDs

INSERT INTO public.user_token_allocations (user_id, tokens_allocated, tokens_used, reset_date) VALUES
-- User 1
('11111111-1111-1111-1111-111111111111', 1000, 257, CURRENT_DATE),
('11111111-1111-1111-1111-111111111111', 1000, 800, CURRENT_DATE - INTERVAL '1 day'),
('11111111-1111-1111-1111-111111111111', 1000, 950, CURRENT_DATE - INTERVAL '2 days'),

-- User 2  
('22222222-2222-2222-2222-222222222222', 2000, 456, CURRENT_DATE),
('22222222-2222-2222-2222-222222222222', 2000, 1200, CURRENT_DATE - INTERVAL '1 day'),

-- User 3
('33333333-3333-3333-3333-333333333333', 500, 123, CURRENT_DATE)
ON CONFLICT (user_id, reset_date) DO UPDATE SET
    tokens_allocated = EXCLUDED.tokens_allocated,
    tokens_used = EXCLUDED.tokens_used,
    updated_at = NOW();

-- ===== SAMPLE API USAGE LOG ENTRIES =====
INSERT INTO public.api_usage_log (
    user_id, api_type_id, api_name, endpoint, 
    request_data, tokens_used, cost_usd, 
    response_status, response_time_ms, status, timestamp
) VALUES
-- Recent successful calls
(
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.api_types WHERE name = 'openai_gpt'),
    'openai_gpt',
    '/api/openai_gpt',
    '{"prompt": "Write a creative story", "max_tokens": 100}',
    45,
    0.0045,
    '200',
    2340,
    'success',
    NOW() - INTERVAL '5 minutes'
),
(
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.api_types WHERE name = 'image_generation'),
    'image_generation',
    '/api/image_generation',
    '{"prompt": "A beautiful sunset over mountains", "style": "realistic"}',
    23,
    0.0460,
    '200',
    4567,
    'success',
    NOW() - INTERVAL '15 minutes'
),
(
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM public.api_types WHERE name = 'text_to_speech'),
    'text_to_speech',
    '/api/text_to_speech',
    '{"text": "Hello world", "voice": "en-US-JennyNeural"}',
    12,
    0.0012,
    '200',
    1234,
    'success',
    NOW() - INTERVAL '30 minutes'
),

-- Failed call example
(
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.api_types WHERE name = 'openai_gpt'),
    'openai_gpt',
    '/api/openai_gpt',
    '{"prompt": "Generate a very long text", "max_tokens": 5000}',
    67,
    0.0067,
    '429',
    890,
    'failed',
    NOW() - INTERVAL '45 minutes'
),

-- Historical data (past 7 days)
(
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.api_types WHERE name = 'web_search'),
    'web_search',
    '/api/web_search',
    '{"query": "latest AI news", "num": 10}',
    5,
    0.0005,
    '200',
    1800,
    'success',
    NOW() - INTERVAL '1 day'
),
(
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM public.api_types WHERE name = 'translate'),
    'translate',
    '/api/translate',
    '{"text": "Hello world", "from": "en", "to": "es"}',
    8,
    0.0008,
    '200',
    567,
    'success',
    NOW() - INTERVAL '2 days'
),
(
    '33333333-3333-3333-3333-333333333333',
    (SELECT id FROM public.api_types WHERE name = 'pdf_analysis'),
    'pdf_analysis',
    '/api/pdf_analysis',
    '{"file_url": "https://example.com/document.pdf", "analysis_type": "summary"}',
    156,
    0.0312,
    '200',
    8900,
    'success',
    NOW() - INTERVAL '3 days'
),

-- More historical entries for realistic data
(
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.api_types WHERE name = 'calendar_parsing'),
    'calendar_parsing',
    '/api/calendar_parsing',
    '{"text": "Meeting with John tomorrow at 3pm"}',
    15,
    0.0015,
    '200',
    1200,
    'success',
    NOW() - INTERVAL '4 days'
),
(
    '22222222-2222-2222-2222-222222222222',
    (SELECT id FROM public.api_types WHERE name = 'expense_categorization'),
    'expense_categorization',
    '/api/expense_categorization',
    '{"description": "Starbucks coffee", "amount": 5.50}',
    3,
    0.0003,
    '200',
    450,
    'success',
    NOW() - INTERVAL '5 days'
),
(
    '11111111-1111-1111-1111-111111111111',
    (SELECT id FROM public.api_types WHERE name = 'speech_to_text'),
    'speech_to_text',
    '/api/speech_to_text',
    '{"audio_url": "https://example.com/audio.mp3", "language": "en"}',
    28,
    0.0028,
    '200',
    3400,
    'success',
    NOW() - INTERVAL '6 days'
);

-- ===== SAMPLE RATE LIMITS =====
INSERT INTO public.api_rate_limits (user_id, api_type_id, requests_per_minute, requests_per_hour, requests_per_day, tokens_per_day) VALUES
-- Default limits for User 1
('11111111-1111-1111-1111-111111111111', (SELECT id FROM public.api_types WHERE name = 'openai_gpt'), 10, 100, 1000, 1000),
('11111111-1111-1111-1111-111111111111', (SELECT id FROM public.api_types WHERE name = 'image_generation'), 2, 20, 50, 200),
('11111111-1111-1111-1111-111111111111', (SELECT id FROM public.api_types WHERE name = 'text_to_speech'), 20, 200, 2000, 500),

-- Higher limits for User 2 (premium user)
('22222222-2222-2222-2222-222222222222', (SELECT id FROM public.api_types WHERE name = 'openai_gpt'), 20, 200, 2000, 2000),
('22222222-2222-2222-2222-222222222222', (SELECT id FROM public.api_types WHERE name = 'image_generation'), 5, 50, 100, 500),
('22222222-2222-2222-2222-222222222222', (SELECT id FROM public.api_types WHERE name = 'web_search'), 30, 300, 3000, 1000),

-- Basic limits for User 3
('33333333-3333-3333-3333-333333333333', (SELECT id FROM public.api_types WHERE name = 'openai_gpt'), 5, 50, 500, 500),
('33333333-3333-3333-3333-333333333333', (SELECT id FROM public.api_types WHERE name = 'pdf_analysis'), 2, 10, 20, 100)
ON CONFLICT (user_id, api_type_id) DO UPDATE SET
    requests_per_minute = EXCLUDED.requests_per_minute,
    requests_per_hour = EXCLUDED.requests_per_hour,
    requests_per_day = EXCLUDED.requests_per_day,
    tokens_per_day = EXCLUDED.tokens_per_day,
    updated_at = NOW();

-- ===== SAMPLE TOKEN RESET HISTORY =====
INSERT INTO public.token_reset_history (user_id, old_tokens_allocated, new_tokens_allocated, old_tokens_used, reset_reason, reset_by) VALUES
('11111111-1111-1111-1111-111111111111', 1000, 1000, 950, 'Monthly reset', '11111111-1111-1111-1111-111111111111'),
('22222222-2222-2222-2222-222222222222', 1000, 2000, 800, 'Upgraded to premium plan', '11111111-1111-1111-1111-111111111111'),
('33333333-3333-3333-3333-333333333333', 1000, 500, 100, 'Downgraded due to inactivity', '11111111-1111-1111-1111-111111111111');

-- ===== VERIFY DATA INSERTION =====
-- Check that all data was inserted correctly
SELECT 'API Types' as table_name, COUNT(*) as record_count FROM public.api_types
UNION ALL
SELECT 'User Token Allocations', COUNT(*) FROM public.user_token_allocations  
UNION ALL
SELECT 'API Usage Log', COUNT(*) FROM public.api_usage_log
UNION ALL
SELECT 'API Usage Stats', COUNT(*) FROM public.api_usage_stats
UNION ALL
SELECT 'Token Reset History', COUNT(*) FROM public.token_reset_history
UNION ALL
SELECT 'API Rate Limits', COUNT(*) FROM public.api_rate_limits;