-- ===== API TRACKING COMPREHENSIVE DATABASE SCHEMA =====
-- This schema provides complete API usage tracking with user association,
-- token management, cost tracking, and detailed analytics

-- Enable Row Level Security
ALTER DATABASE postgres SET row_security = on;

-- ===== 1. API TYPES TABLE =====
-- Defines all available API types in the system
CREATE TABLE IF NOT EXISTS public.api_types (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'openai_gpt', 'image_generation', 'text_to_speech'
    display_name VARCHAR(200) NOT NULL, -- e.g., 'OpenAI GPT', 'Image Generation', 'Text to Speech'
    category VARCHAR(50) NOT NULL, -- e.g., 'text', 'image', 'audio', 'search'
    base_cost_per_token DECIMAL(10, 8) DEFAULT 0.0001, -- Cost per token in USD
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 2. USER TOKEN ALLOCATIONS TABLE =====
-- Manages token allocations per user
CREATE TABLE IF NOT EXISTS public.user_token_allocations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    tokens_allocated INTEGER DEFAULT 1000,
    tokens_used INTEGER DEFAULT 0,
    tokens_remaining INTEGER GENERATED ALWAYS AS (tokens_allocated - tokens_used) STORED,
    reset_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, reset_date)
);

-- ===== 3. API USAGE LOG TABLE =====
-- Detailed log of every API call made
CREATE TABLE IF NOT EXISTS public.api_usage_log (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_type_id UUID REFERENCES public.api_types(id) ON DELETE RESTRICT,
    api_name VARCHAR(100) NOT NULL, -- For backward compatibility
    endpoint VARCHAR(500) NOT NULL,
    
    -- Request Details
    request_data JSONB, -- Store request parameters
    request_size_bytes INTEGER,
    
    -- Token & Cost Tracking
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) NOT NULL DEFAULT 0.00,
    
    -- Response Details
    response_status VARCHAR(10) NOT NULL, -- '200', '400', '500', etc.
    response_time_ms INTEGER NOT NULL,
    response_size_bytes INTEGER,
    response_data JSONB, -- Store relevant response data
    
    -- Status & Error Handling
    status VARCHAR(20) NOT NULL DEFAULT 'success', -- 'success', 'failed', 'timeout', 'rate_limited'
    error_code VARCHAR(50),
    error_message TEXT,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 4. API USAGE STATS TABLE =====
-- Aggregated statistics per user per API type per day
CREATE TABLE IF NOT EXISTS public.api_usage_stats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_type_id UUID REFERENCES public.api_types(id) ON DELETE RESTRICT,
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
    avg_response_time_ms DECIMAL(10, 2),
    min_response_time_ms INTEGER,
    max_response_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, api_type_id, usage_date)
);

-- ===== 5. TOKEN RESET HISTORY TABLE =====
-- Track token resets for audit purposes
CREATE TABLE IF NOT EXISTS public.token_reset_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    old_tokens_allocated INTEGER,
    new_tokens_allocated INTEGER,
    old_tokens_used INTEGER,
    reset_reason VARCHAR(200),
    reset_by UUID REFERENCES auth.users(id), -- Who performed the reset (admin user)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===== 6. API RATE LIMITS TABLE =====
-- Define rate limits per API type per user
CREATE TABLE IF NOT EXISTS public.api_rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    api_type_id UUID REFERENCES public.api_types(id) ON DELETE RESTRICT,
    requests_per_minute INTEGER DEFAULT 60,
    requests_per_hour INTEGER DEFAULT 1000,
    requests_per_day INTEGER DEFAULT 10000,
    tokens_per_day INTEGER DEFAULT 1000,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, api_type_id)
);

-- ===== INDEXES FOR PERFORMANCE =====
-- User-based queries
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_id ON public.api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_timestamp ON public.api_usage_log(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_timestamp ON public.api_usage_log(user_id, timestamp DESC);

-- API type queries
CREATE INDEX IF NOT EXISTS idx_api_usage_log_api_type ON public.api_usage_log(api_type_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_api_name ON public.api_usage_log(api_name);

-- Status and error tracking
CREATE INDEX IF NOT EXISTS idx_api_usage_log_status ON public.api_usage_log(status);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_response_status ON public.api_usage_log(response_status);

-- Stats table indexes
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_user_date ON public.api_usage_stats(user_id, usage_date DESC);
CREATE INDEX IF NOT EXISTS idx_api_usage_stats_api_date ON public.api_usage_stats(api_type_id, usage_date DESC);

-- Token allocation indexes
CREATE INDEX IF NOT EXISTS idx_user_token_allocations_user ON public.user_token_allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_token_allocations_reset_date ON public.user_token_allocations(reset_date DESC);

-- ===== FUNCTIONS AND TRIGGERS =====

-- Function to update timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers for updated_at
CREATE TRIGGER update_api_types_updated_at BEFORE UPDATE ON public.api_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_token_allocations_updated_at BEFORE UPDATE ON public.user_token_allocations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_usage_stats_updated_at BEFORE UPDATE ON public.api_usage_stats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_rate_limits_updated_at BEFORE UPDATE ON public.api_rate_limits FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update token usage when API call is logged
CREATE OR REPLACE FUNCTION update_token_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user token allocation
    INSERT INTO public.user_token_allocations (user_id, tokens_used, reset_date)
    VALUES (NEW.user_id, NEW.tokens_used, CURRENT_DATE)
    ON CONFLICT (user_id, reset_date)
    DO UPDATE SET 
        tokens_used = user_token_allocations.tokens_used + NEW.tokens_used,
        updated_at = NOW();
    
    -- Update daily stats
    INSERT INTO public.api_usage_stats (
        user_id, api_type_id, api_name, usage_date,
        total_requests, 
        successful_requests, 
        failed_requests,
        total_tokens_used, 
        total_cost_usd,
        avg_response_time_ms,
        min_response_time_ms,
        max_response_time_ms
    )
    VALUES (
        NEW.user_id, NEW.api_type_id, NEW.api_name, CURRENT_DATE,
        1,
        CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
        CASE WHEN NEW.status != 'success' THEN 1 ELSE 0 END,
        NEW.tokens_used,
        NEW.cost_usd,
        NEW.response_time_ms,
        NEW.response_time_ms,
        NEW.response_time_ms
    )
    ON CONFLICT (user_id, api_type_id, usage_date)
    DO UPDATE SET
        total_requests = api_usage_stats.total_requests + 1,
        successful_requests = api_usage_stats.successful_requests + 
            CASE WHEN NEW.status = 'success' THEN 1 ELSE 0 END,
        failed_requests = api_usage_stats.failed_requests + 
            CASE WHEN NEW.status != 'success' THEN 1 ELSE 0 END,
        total_tokens_used = api_usage_stats.total_tokens_used + NEW.tokens_used,
        total_cost_usd = api_usage_stats.total_cost_usd + NEW.cost_usd,
        avg_response_time_ms = (
            (api_usage_stats.avg_response_time_ms * api_usage_stats.total_requests + NEW.response_time_ms) / 
            (api_usage_stats.total_requests + 1)
        ),
        min_response_time_ms = LEAST(api_usage_stats.min_response_time_ms, NEW.response_time_ms),
        max_response_time_ms = GREATEST(api_usage_stats.max_response_time_ms, NEW.response_time_ms),
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to update stats when API usage is logged
CREATE TRIGGER update_token_usage_trigger 
    AFTER INSERT ON public.api_usage_log 
    FOR EACH ROW EXECUTE FUNCTION update_token_usage();

-- ===== ROW LEVEL SECURITY POLICIES =====

-- Enable RLS on all tables
ALTER TABLE public.api_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_token_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.token_reset_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;

-- API Types: Everyone can read, only admins can modify
CREATE POLICY "API types are viewable by everyone" ON public.api_types FOR SELECT USING (true);
CREATE POLICY "API types are modifiable by admins only" ON public.api_types FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- User Token Allocations: Users can only see/modify their own
CREATE POLICY "Users can view own token allocations" ON public.user_token_allocations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own token allocations" ON public.user_token_allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own token allocations" ON public.user_token_allocations FOR UPDATE USING (auth.uid() = user_id);

-- API Usage Log: Users can only see/insert their own
CREATE POLICY "Users can view own API usage" ON public.api_usage_log FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API usage" ON public.api_usage_log FOR INSERT WITH CHECK (auth.uid() = user_id);

-- API Usage Stats: Users can only see their own
CREATE POLICY "Users can view own API stats" ON public.api_usage_stats FOR SELECT USING (auth.uid() = user_id);

-- Token Reset History: Users can view own, admins can view all
CREATE POLICY "Users can view own reset history" ON public.token_reset_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all reset history" ON public.token_reset_history FOR SELECT USING (auth.jwt() ->> 'role' = 'admin');
CREATE POLICY "Admins can insert reset history" ON public.token_reset_history FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

-- API Rate Limits: Users can view own
CREATE POLICY "Users can view own rate limits" ON public.api_rate_limits FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage rate limits" ON public.api_rate_limits FOR ALL USING (auth.jwt() ->> 'role' = 'admin');