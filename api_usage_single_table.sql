-- ===== SINGLE API USAGE TRACKING TABLE =====
-- One simple table to track everything you need

CREATE TABLE IF NOT EXISTS public.api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- User & API Info
    user_id UUID,
    api_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    
    -- Usage Tracking
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(8, 4) NOT NULL DEFAULT 0.00,
    
    -- Response Info
    response_status VARCHAR(10) NOT NULL DEFAULT '200',
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success' or 'failed'
    
    -- Optional Details
    request_data TEXT, -- Store request details as text
    error_message TEXT,
    
    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id ON public.api_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_api_name ON public.api_usage(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_created_at ON public.api_usage(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_status ON public.api_usage(status);

-- Insert some sample data
INSERT INTO public.api_usage (user_id, api_name, endpoint, tokens_used, cost_usd, response_status, response_time_ms, status, created_at) VALUES
('11111111-1111-1111-1111-111111111111', 'openai_gpt', '/api/openai_gpt', 45, 0.0045, '200', 2340, 'success', NOW() - INTERVAL '5 minutes'),
('11111111-1111-1111-1111-111111111111', 'image_generation', '/api/image_generation', 23, 0.0460, '200', 4567, 'success', NOW() - INTERVAL '15 minutes'),
('22222222-2222-2222-2222-222222222222', 'text_to_speech', '/api/text_to_speech', 12, 0.0012, '200', 1234, 'success', NOW() - INTERVAL '30 minutes'),
('11111111-1111-1111-1111-111111111111', 'openai_gpt', '/api/openai_gpt', 67, 0.0067, '429', 890, 'failed', NOW() - INTERVAL '45 minutes'),
('22222222-2222-2222-2222-222222222222', 'web_search', '/api/web_search', 5, 0.0005, '200', 1800, 'success', NOW() - INTERVAL '1 day'),
('33333333-3333-3333-3333-333333333333', 'translate', '/api/translate', 8, 0.0008, '200', 567, 'success', NOW() - INTERVAL '2 days');

-- Verify data
SELECT 
    'API Usage Records Created' as message,
    COUNT(*) as total_records,
    COUNT(CASE WHEN status = 'success' THEN 1 END) as successful_calls,
    COUNT(CASE WHEN status = 'failed' THEN 1 END) as failed_calls,
    SUM(tokens_used) as total_tokens,
    SUM(cost_usd) as total_cost
FROM public.api_usage;