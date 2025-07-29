-- API Usage Tracking Tables
-- This file contains all the necessary tables for tracking API usage and token consumption

-- 1. User Tokens Table - Stores token allocation and usage per user
CREATE TABLE IF NOT EXISTS user_tokens (
    user_id UUID PRIMARY KEY,
    tokens_allocated INTEGER NOT NULL DEFAULT 1000,
    tokens_remaining INTEGER NOT NULL DEFAULT 1000,
    tokens_used INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. API Usage Log Table - Records every API request
CREATE TABLE IF NOT EXISTS api_usage_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    api_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    source_modal TEXT, -- Tracks which modal/component sent the request
    tokens_used INTEGER NOT NULL DEFAULT 0,
    cost_usd NUMERIC(10,6) NOT NULL DEFAULT 0,
    response_status TEXT,
    response_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'success', -- 'success', 'failed', 'error'
    error_message TEXT,
    request_data JSONB,
    response_data JSONB,
    ip_address INET,
    user_agent TEXT
);

-- 3. API Cost Configuration Table - Defines cost per token for each API
CREATE TABLE IF NOT EXISTS api_cost_config (
    id SERIAL PRIMARY KEY,
    api_name TEXT UNIQUE NOT NULL,
    cost_per_token NUMERIC(10,6) NOT NULL DEFAULT 0.0001,
    base_cost NUMERIC(10,6) NOT NULL DEFAULT 0,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_api_usage_log_user_id ON api_usage_log(user_id);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_timestamp ON api_usage_log(timestamp);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_api_name ON api_usage_log(api_name);
CREATE INDEX IF NOT EXISTS idx_api_usage_log_status ON api_usage_log(status);
CREATE INDEX IF NOT EXISTS idx_user_tokens_updated_at ON user_tokens(updated_at);

-- 5. Insert default cost configurations for common APIs
INSERT INTO api_cost_config (api_name, cost_per_token, base_cost, description) VALUES
    ('openai_chat', 0.000002, 0, 'OpenAI GPT-4 Chat API'),
    ('openai_vision', 0.00001, 0, 'OpenAI GPT-4 Vision API'),
    ('replicate_image', 0.0001, 0, 'Replicate Image Generation'),
    ('azure_tts', 0.000016, 0, 'Azure Text-to-Speech'),
    ('google_tts', 0.000004, 0, 'Google Text-to-Speech'),
    ('speech_to_text', 0.000006, 0, 'Speech Recognition'),
    ('translation', 0.00002, 0, 'Translation API'),
    ('pdf_processing', 0.00005, 0, 'PDF Analysis and Processing'),
    ('image_generation', 0.0001, 0, 'AI Image Generation'),
    ('text_generation', 0.000002, 0, 'Text Generation API')
ON CONFLICT (api_name) DO NOTHING;

-- 6. Function to update user tokens after API usage
CREATE OR REPLACE FUNCTION update_user_tokens_after_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user tokens when API usage is logged
    UPDATE user_tokens 
    SET 
        tokens_remaining = tokens_remaining - NEW.tokens_used,
        tokens_used = tokens_used + NEW.tokens_used,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 7. Trigger to automatically update user tokens
DROP TRIGGER IF EXISTS trigger_update_user_tokens ON api_usage_log;
CREATE TRIGGER trigger_update_user_tokens
    AFTER INSERT ON api_usage_log
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tokens_after_usage();

-- 8. Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    tokens_allocated INTEGER,
    tokens_remaining INTEGER,
    tokens_used INTEGER,
    total_requests BIGINT,
    total_cost_usd NUMERIC(10,6)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.tokens_allocated,
        ut.tokens_remaining,
        ut.tokens_used,
        COALESCE(COUNT(aul.id), 0)::BIGINT as total_requests,
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd
    FROM user_tokens ut
    LEFT JOIN api_usage_log aul ON ut.user_id = aul.user_id
    WHERE ut.user_id = user_uuid
    GROUP BY ut.tokens_allocated, ut.tokens_remaining, ut.tokens_used;
END;
$$ LANGUAGE plpgsql;

-- 9. Function to get API usage breakdown
CREATE OR REPLACE FUNCTION get_api_usage_breakdown(user_uuid UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    api_name TEXT,
    requests_count BIGINT,
    tokens_used BIGINT,
    total_cost_usd NUMERIC(10,6),
    success_count BIGINT,
    failure_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aul.api_name,
        COUNT(aul.id)::BIGINT as requests_count,
        COALESCE(SUM(aul.tokens_used), 0)::BIGINT as tokens_used,
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd,
        COUNT(CASE WHEN aul.status = 'success' THEN 1 END)::BIGINT as success_count,
        COUNT(CASE WHEN aul.status != 'success' THEN 1 END)::BIGINT as failure_count
    FROM api_usage_log aul
    WHERE aul.user_id = user_uuid
    AND aul.timestamp >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY aul.api_name
    ORDER BY requests_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 10. Function to get recent usage history
CREATE OR REPLACE FUNCTION get_recent_usage(user_uuid UUID, limit_count INTEGER DEFAULT 100)
RETURNS TABLE (
    id INTEGER,
    api_name TEXT,
    endpoint TEXT,
    source_modal TEXT,
    tokens_used INTEGER,
    cost_usd NUMERIC(10,6),
    response_status TEXT,
    response_time_ms INTEGER,
    timestamp TIMESTAMP WITH TIME ZONE,
    status TEXT,
    error_message TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aul.id,
        aul.api_name,
        aul.endpoint,
        aul.source_modal,
        aul.tokens_used,
        aul.cost_usd,
        aul.response_status,
        aul.response_time_ms,
        aul.timestamp,
        aul.status,
        aul.error_message
    FROM api_usage_log aul
    WHERE aul.user_id = user_uuid
    ORDER BY aul.timestamp DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- 11. Function to reset user tokens
CREATE OR REPLACE FUNCTION reset_user_tokens(user_uuid UUID, new_allocation INTEGER DEFAULT 1000)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO user_tokens (user_id, tokens_allocated, tokens_remaining, tokens_used)
    VALUES (user_uuid, new_allocation, new_allocation, 0)
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        tokens_allocated = new_allocation,
        tokens_remaining = new_allocation,
        tokens_used = 0,
        updated_at = NOW();
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- 12. Function to log API usage with automatic cost calculation
CREATE OR REPLACE FUNCTION log_api_usage(
    p_user_id UUID,
    p_api_name TEXT,
    p_endpoint TEXT,
    p_source_modal TEXT,
    p_tokens_used INTEGER,
    p_response_status TEXT,
    p_response_time_ms INTEGER,
    p_status TEXT DEFAULT 'success',
    p_error_message TEXT DEFAULT NULL,
    p_request_data JSONB DEFAULT NULL,
    p_response_data JSONB DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_cost_usd NUMERIC(10,6);
    v_log_id INTEGER;
BEGIN
    -- Calculate cost based on API configuration
    SELECT (p_tokens_used * cost_per_token + base_cost) INTO v_cost_usd
    FROM api_cost_config 
    WHERE api_name = p_api_name AND is_active = true;
    
    -- Default cost if no configuration found
    IF v_cost_usd IS NULL THEN
        v_cost_usd := p_tokens_used * 0.0001;
    END IF;
    
    -- Insert usage log
    INSERT INTO api_usage_log (
        user_id, api_name, endpoint, source_modal, tokens_used, cost_usd,
        response_status, response_time_ms, status, error_message,
        request_data, response_data
    ) VALUES (
        p_user_id, p_api_name, p_endpoint, p_source_modal, p_tokens_used, v_cost_usd,
        p_response_status, p_response_time_ms, p_status, p_error_message,
        p_request_data, p_response_data
    ) RETURNING id INTO v_log_id;
    
    RETURN v_log_id;
END;
$$ LANGUAGE plpgsql;

-- 13. Create a sample user for testing (optional)
INSERT INTO user_tokens (user_id, tokens_allocated, tokens_remaining, tokens_used)
VALUES ('00000000-0000-0000-0000-000000000000', 1000, 1000, 0)
ON CONFLICT (user_id) DO NOTHING;

-- 14. Insert some sample API usage data for demonstration
INSERT INTO api_usage_log (user_id, api_name, endpoint, source_modal, tokens_used, cost_usd, response_status, response_time_ms, status, timestamp) VALUES
    ('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 'ImageGeneratorModal', 10, 0.001, '200', 2500, 'success', NOW() - INTERVAL '1 hour'),
    ('00000000-0000-0000-0000-000000000000', 'text_generation', '/api/openai/chat', 'AskMeModal', 5, 0.00001, '200', 1200, 'success', NOW() - INTERVAL '2 hours'),
    ('00000000-0000-0000-0000-000000000000', 'text_to_speech', '/api/azure/tts', 'VoiceOutput', 2, 0.000032, '200', 800, 'success', NOW() - INTERVAL '3 hours'),
    ('00000000-0000-0000-0000-000000000000', 'speech_to_text', '/api/speech/recognize', 'VoiceInput', 1, 0.000006, '200', 500, 'success', NOW() - INTERVAL '4 hours'),
    ('00000000-0000-0000-0000-000000000000', 'translation', '/api/translate', 'TranslateModal', 3, 0.00006, '200', 600, 'success', NOW() - INTERVAL '5 hours'),
    ('00000000-0000-0000-0000-000000000000', 'pdf_processing', '/api/pdf/analyze', 'PdfReaderModal', 8, 0.0004, '200', 1500, 'success', NOW() - INTERVAL '6 hours'),
    ('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 'ImageGeneratorModal', 10, 0.001, '500', 3000, 'failed', NOW() - INTERVAL '7 hours'),
    ('00000000-0000-0000-0000-000000000000', 'text_generation', '/api/openai/chat', 'AskMeModal', 5, 0.00001, '429', 100, 'failed', NOW() - INTERVAL '8 hours');

-- 15. Update user tokens based on sample data
UPDATE user_tokens 
SET 
    tokens_remaining = tokens_remaining - 40,
    tokens_used = tokens_used + 40,
    updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- 16. Create a view for easy dashboard queries
CREATE OR REPLACE VIEW dashboard_stats AS
SELECT 
    ut.user_id,
    ut.tokens_allocated,
    ut.tokens_remaining,
    ut.tokens_used,
    COUNT(aul.id) as total_requests,
    COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd,
    COUNT(CASE WHEN aul.status = 'success' THEN 1 END) as success_count,
    COUNT(CASE WHEN aul.status != 'success' THEN 1 END) as failure_count,
    ut.updated_at as last_activity
FROM user_tokens ut
LEFT JOIN api_usage_log aul ON ut.user_id = aul.user_id
GROUP BY ut.user_id, ut.tokens_allocated, ut.tokens_remaining, ut.tokens_used, ut.updated_at;

-- 17. Grant necessary permissions (adjust as needed for your setup)
-- GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO your_app_user;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO your_app_user;

COMMENT ON TABLE user_tokens IS 'Stores token allocation and usage for each user';
COMMENT ON TABLE api_usage_log IS 'Records every API request with detailed metadata';
COMMENT ON TABLE api_cost_config IS 'Defines cost per token for different APIs';
COMMENT ON VIEW dashboard_stats IS 'Aggregated view for dashboard statistics'; 