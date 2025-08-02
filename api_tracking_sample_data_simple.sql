-- ===== SIMPLE SAMPLE DATA FOR API TRACKING =====
-- Run this AFTER running api_tracking_simple.sql

-- ===== SAMPLE USER TOKEN ALLOCATIONS =====
-- Using generic UUIDs that don't need to reference actual users
INSERT INTO public.user_token_allocations (user_id, tokens_allocated, tokens_used, tokens_remaining, reset_date) VALUES
('11111111-1111-1111-1111-111111111111', 1000, 257, 743, CURRENT_DATE),
('22222222-2222-2222-2222-222222222222', 2000, 456, 1544, CURRENT_DATE),
('33333333-3333-3333-3333-333333333333', 500, 123, 377, CURRENT_DATE)
ON CONFLICT DO NOTHING;

-- ===== SAMPLE API USAGE LOG ENTRIES =====
INSERT INTO public.api_usage_log (
    user_id, api_name, endpoint, 
    request_data, tokens_used, cost_usd, 
    response_status, response_time_ms, status, timestamp
) VALUES
-- Recent successful calls
(
    '11111111-1111-1111-1111-111111111111',
    'openai_gpt',
    '/api/openai_gpt',
    '{"prompt": "Write a story", "max_tokens": 100}',
    45,
    0.0045,
    '200',
    2340,
    'success',
    NOW() - INTERVAL '5 minutes'
),
(
    '11111111-1111-1111-1111-111111111111',
    'image_generation',
    '/api/image_generation',
    '{"prompt": "A sunset", "style": "realistic"}',
    23,
    0.0460,
    '200',
    4567,
    'success',
    NOW() - INTERVAL '15 minutes'
),
(
    '22222222-2222-2222-2222-222222222222',
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
    'openai_gpt',
    '/api/openai_gpt',
    '{"prompt": "Long text", "max_tokens": 5000}',
    67,
    0.0067,
    '429',
    890,
    'failed',
    NOW() - INTERVAL '45 minutes'
),
-- Historical data
(
    '22222222-2222-2222-2222-222222222222',
    'web_search',
    '/api/web_search',
    '{"query": "AI news", "num": 10}',
    5,
    0.0005,
    '200',
    1800,
    'success',
    NOW() - INTERVAL '1 day'
),
(
    '33333333-3333-3333-3333-333333333333',
    'translate',
    '/api/translate',
    '{"text": "Hello", "from": "en", "to": "es"}',
    8,
    0.0008,
    '200',
    567,
    'success',
    NOW() - INTERVAL '2 days'
);

-- ===== SAMPLE API USAGE STATS =====
-- This will be auto-generated if you set up triggers, but we can insert some manually
INSERT INTO public.api_usage_stats (
    user_id, api_name, usage_date,
    total_requests, successful_requests, failed_requests,
    total_tokens_used, total_cost_usd,
    avg_response_time_ms, min_response_time_ms, max_response_time_ms
) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'openai_gpt',
    CURRENT_DATE,
    89, 87, 2,
    156, 0.0156,
    2000.0, 890, 3400
),
(
    '11111111-1111-1111-1111-111111111111',
    'image_generation',
    CURRENT_DATE,
    34, 32, 2,
    68, 0.1360,
    4500.0, 3200, 6800
),
(
    '22222222-2222-2222-2222-222222222222',
    'text_to_speech',
    CURRENT_DATE,
    33, 33, 0,
    33, 0.0033,
    1200.0, 450, 2100
)
ON CONFLICT DO NOTHING;

-- ===== VERIFICATION =====
SELECT 
    'Data inserted successfully!' as message,
    (SELECT COUNT(*) FROM public.api_types) as api_types_count,
    (SELECT COUNT(*) FROM public.user_token_allocations) as allocations_count,
    (SELECT COUNT(*) FROM public.api_usage_log) as usage_log_count,
    (SELECT COUNT(*) FROM public.api_usage_stats) as usage_stats_count;