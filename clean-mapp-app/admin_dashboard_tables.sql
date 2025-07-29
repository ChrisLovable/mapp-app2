-- Admin Dashboard Database Schema
-- Tables for tracking API usage and user token consumption

-- User tokens table
CREATE TABLE user_tokens (
    user_id UUID PRIMARY KEY,
    tokens_allocated INT NOT NULL DEFAULT 1000,
    tokens_remaining INT NOT NULL DEFAULT 1000,
    tokens_used INT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- API usage log table
CREATE TABLE api_usage_log (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    api_name TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    tokens_used INT NOT NULL,
    cost_usd NUMERIC(10,4) DEFAULT 0,
    request_data JSONB,
    response_status TEXT,
    response_time_ms INT,
    timestamp TIMESTAMP DEFAULT NOW(),
    status TEXT DEFAULT 'success',
    error_message TEXT,
    FOREIGN KEY (user_id) REFERENCES user_tokens(user_id)
);

-- API cost configuration table
CREATE TABLE api_cost_config (
    id SERIAL PRIMARY KEY,
    api_name TEXT UNIQUE NOT NULL,
    tokens_per_request INT NOT NULL DEFAULT 1,
    cost_per_token_usd NUMERIC(10,6) DEFAULT 0.0001,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default API cost configurations
INSERT INTO api_cost_config (api_name, tokens_per_request, cost_per_token_usd, description) VALUES
('image_generation', 10, 0.0001, 'AI Image Generation via Replicate'),
('text_generation', 5, 0.0001, 'Text Generation via OpenAI'),
('text_to_speech', 2, 0.0001, 'Text-to-Speech via Azure'),
('speech_to_text', 1, 0.0001, 'Speech-to-Text via Web Speech API'),
('translation', 3, 0.0001, 'Text Translation'),
('pdf_processing', 5, 0.0001, 'PDF Reading and Processing'),
('image_to_text', 4, 0.0001, 'OCR Image to Text'),
('calendar_events', 1, 0.0001, 'Calendar Event Management'),
('diary_entries', 1, 0.0001, 'Diary Entry Management'),
('todo_management', 1, 0.0001, 'Todo List Management'),
('expense_tracking', 1, 0.0001, 'Expense Tracking'),
('shopping_list', 1, 0.0001, 'Shopping List Management');

-- Create indexes for better performance
CREATE INDEX idx_api_usage_log_user_id ON api_usage_log(user_id);
CREATE INDEX idx_api_usage_log_timestamp ON api_usage_log(timestamp);
CREATE INDEX idx_api_usage_log_api_name ON api_usage_log(api_name);
CREATE INDEX idx_api_usage_log_status ON api_usage_log(status);

-- Function to update user tokens after API usage
CREATE OR REPLACE FUNCTION update_user_tokens_after_usage()
RETURNS TRIGGER AS $$
BEGIN
    -- Update user_tokens table
    UPDATE user_tokens 
    SET 
        tokens_remaining = tokens_remaining - NEW.tokens_used,
        tokens_used = tokens_used + NEW.tokens_used,
        updated_at = NOW()
    WHERE user_id = NEW.user_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update user tokens
CREATE TRIGGER trigger_update_user_tokens
    AFTER INSERT ON api_usage_log
    FOR EACH ROW
    EXECUTE FUNCTION update_user_tokens_after_usage();

-- Function to get user statistics
CREATE OR REPLACE FUNCTION get_user_stats(user_uuid UUID)
RETURNS TABLE (
    tokens_allocated INT,
    tokens_remaining INT,
    tokens_used INT,
    total_requests BIGINT,
    total_cost_usd NUMERIC(10,4)
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ut.tokens_allocated,
        ut.tokens_remaining,
        ut.tokens_used,
        COUNT(aul.id)::BIGINT as total_requests,
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd
    FROM user_tokens ut
    LEFT JOIN api_usage_log aul ON ut.user_id = aul.user_id
    WHERE ut.user_id = user_uuid
    GROUP BY ut.tokens_allocated, ut.tokens_remaining, ut.tokens_used;
END;
$$ LANGUAGE plpgsql;

-- Function to get API usage breakdown
CREATE OR REPLACE FUNCTION get_api_usage_breakdown(user_uuid UUID, days_back INT DEFAULT 30)
RETURNS TABLE (
    api_name TEXT,
    requests_count BIGINT,
    tokens_used BIGINT,
    total_cost_usd NUMERIC(10,4),
    success_count BIGINT,
    failure_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        aul.api_name,
        COUNT(aul.id)::BIGINT as requests_count,
        SUM(aul.tokens_used)::BIGINT as tokens_used,
        COALESCE(SUM(aul.cost_usd), 0) as total_cost_usd,
        COUNT(CASE WHEN aul.status = 'success' THEN 1 END)::BIGINT as success_count,
        COUNT(CASE WHEN aul.status = 'failed' THEN 1 END)::BIGINT as failure_count
    FROM api_usage_log aul
    WHERE aul.user_id = user_uuid 
    AND aul.timestamp >= NOW() - INTERVAL '1 day' * days_back
    GROUP BY aul.api_name
    ORDER BY tokens_used DESC;
END;
$$ LANGUAGE plpgsql; 