-- ===== DASHBOARD API TRACKING TABLE =====
-- Simple table to support exactly what's shown on the dashboard

CREATE TABLE IF NOT EXISTS public.dashboard_api_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    
    -- Dashboard columns
    time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    api VARCHAR(100) NOT NULL,
    tokens INTEGER NOT NULL DEFAULT 0,
    cost DECIMAL(8, 4) NOT NULL DEFAULT 0.0000,
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    response_time INTEGER NOT NULL DEFAULT 0, -- in milliseconds
    
    -- Optional user tracking
    user_id UUID
);

-- Index for fast dashboard queries
CREATE INDEX IF NOT EXISTS idx_dashboard_api_usage_time ON public.dashboard_api_usage(time DESC);
CREATE INDEX IF NOT EXISTS idx_dashboard_api_usage_user ON public.dashboard_api_usage(user_id);

-- Insert sample data matching current dashboard
INSERT INTO public.dashboard_api_usage (time, api, tokens, cost, status, response_time, user_id) VALUES
(NOW() - INTERVAL '5 minutes', 'openai_gpt', 45, 0.0034, 'success', 2340, '11111111-1111-1111-1111-111111111111'),
(NOW() - INTERVAL '15 minutes', 'image_generation', 23, 0.0021, 'success', 4567, '11111111-1111-1111-1111-111111111111'),
(NOW() - INTERVAL '30 minutes', 'text_to_speech', 12, 0.0008, 'success', 1234, '22222222-2222-2222-2222-222222222222'),
(NOW() - INTERVAL '45 minutes', 'openai_gpt', 67, 0.0051, 'failed', 890, '11111111-1111-1111-1111-111111111111');

-- Verify the data matches dashboard format
SELECT 
    to_char(time, 'MM/DD/YYYY HH24:MI:SS') as time,
    api,
    tokens,
    '$' || cost as cost,
    status,
    response_time || 'ms' as response_time
FROM public.dashboard_api_usage 
ORDER BY time DESC;