-- ===== SIMPLIFIED API TRACKING SCHEMA =====
-- This is a simplified version that avoids foreign key issues
-- Run this first, then add relationships later if needed

-- ===== 1. API TYPES TABLE (Simple) =====
CREATE TABLE IF NOT EXISTS public.api_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'general',
    base_cost_per_token DECIMAL(10, 8) DEFAULT 0.0001,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 2. USER TOKEN ALLOCATIONS TABLE (Simple) =====
CREATE TABLE IF NOT EXISTS public.user_token_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Remove foreign key constraint for now
    tokens_allocated INTEGER DEFAULT 1000,
    tokens_used INTEGER DEFAULT 0,
    tokens_remaining INTEGER DEFAULT 0, -- Make this a regular column for now
    reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 3. API USAGE LOG TABLE (Simplified) =====
CREATE TABLE IF NOT EXISTS public.api_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID, -- Remove foreign key constraint for now
    api_name VARCHAR(100) NOT NULL,
    endpoint VARCHAR(500) NOT NULL,
    
    -- Request Details
    request_data JSONB,
    
    -- Token & Cost Tracking
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.00,
    
    -- Response Details
    response_status VARCHAR(10) NOT NULL DEFAULT '200',
    response_time_ms INTEGER NOT NULL DEFAULT 0,
    
    -- Status & Error Handling
    status VARCHAR(20) NOT NULL DEFAULT 'success',
    error_message TEXT,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 4. API USAGE STATS TABLE (Simplified) =====
CREATE TABLE IF NOT EXISTS public.api_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID,
    api_name VARCHAR(100) NOT NULL,
    usage_date DATE DEFAULT CURRENT_DATE,
    
    -- Counters
    total_requests INTEGER DEFAULT 0,
    successful_requests INTEGER DEFAULT 0,
    failed_requests INTEGER DEFAULT 0,
    
    -- Tokens & Cost
    total_tokens_used INTEGER DEFAULT 0,
    total_cost_usd DECIMAL(10, 6) DEFAULT 0.00,
    
    -- Performance Metrics
    avg_response_time_ms DECIMAL(10, 2) DEFAULT 0,
    min_response_time_ms INTEGER DEFAULT 0,
    max_response_time_ms INTEGER DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== INDEXES FOR PERFORMANCE =====
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_id ON public.api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_timestamp ON public.api_usage_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_api_name ON public.api_usage_log(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_status ON public.api_usage_log(status);

-- ===== SIMPLE TRIGGER FOR UPDATED_AT =====
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
DROP TRIGGER IF EXISTS update_api_types_updated_at ON public.api_types;
CREATE TRIGGER update_api_types_updated_at 
    BEFORE UPDATE ON public.api_types 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_token_allocations_updated_at ON public.user_token_allocations;
CREATE TRIGGER update_user_token_allocations_updated_at 
    BEFORE UPDATE ON public.user_token_allocations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_api_usage_stats_updated_at ON public.api_usage_stats;
CREATE TRIGGER update_api_usage_stats_updated_at 
    BEFORE UPDATE ON public.api_usage_stats 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===== ROW LEVEL SECURITY (Optional - can be enabled later) =====
-- Commented out for initial setup to avoid auth issues
-- ALTER TABLE public.api_types ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.user_token_allocations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.api_usage_stats ENABLE ROW LEVEL SECURITY;

-- ===== INSERT BASIC API TYPES =====
INSERT INTO public.api_types (name, display_name, category, base_cost_per_token, description) VALUES
('openai_gpt', 'OpenAI GPT', 'text', 0.0001, 'OpenAI GPT text generation'),
('image_generation', 'Image Generation', 'image', 0.0020, 'AI image generation'),
('text_to_speech', 'Text to Speech', 'audio', 0.0001, 'Text to speech conversion'),
('web_search', 'Web Search', 'search', 0.0001, 'Web search functionality'),
('translate', 'Translation', 'text', 0.0001, 'Text translation')
ON CONFLICT (name) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    category = EXCLUDED.category,
    base_cost_per_token = EXCLUDED.base_cost_per_token,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ===== VERIFICATION QUERY =====
SELECT 'API Types' as table_name, COUNT(*) as record_count FROM public.api_types
UNION ALL
SELECT 'User Token Allocations', COUNT(*) FROM public.user_token_allocations  
UNION ALL
SELECT 'API Usage Log', COUNT(*) FROM public.api_usage_log
UNION ALL
SELECT 'API Usage Stats', COUNT(*) FROM public.api_usage_stats;