-- ===== USEFUL QUERIES FOR API TRACKING SYSTEM =====
-- This file contains commonly used queries for analyzing API usage data

-- ===== CURRENT USER OVERVIEW =====
-- Get current token status for a specific user
CREATE OR REPLACE VIEW user_current_status AS
SELECT 
    uta.user_id,
    uta.tokens_allocated,
    uta.tokens_used,
    uta.tokens_remaining,
    uta.reset_date,
    COALESCE(SUM(aul.cost_usd), 0) as total_cost_today,
    COUNT(aul.id) as total_requests_today
FROM public.user_token_allocations uta
LEFT JOIN public.api_usage_log aul ON (
    uta.user_id = aul.user_id 
    AND DATE(aul.timestamp) = uta.reset_date
)
WHERE uta.reset_date = CURRENT_DATE
GROUP BY uta.user_id, uta.tokens_allocated, uta.tokens_used, uta.tokens_remaining, uta.reset_date;

-- ===== API USAGE ANALYTICS =====

-- 1. Daily usage summary for a user
CREATE OR REPLACE FUNCTION get_daily_usage_summary(target_user_id UUID, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    usage_date DATE,
    total_requests BIGINT,
    total_tokens INTEGER,
    total_cost DECIMAL,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(aul.timestamp) as usage_date,
        COUNT(aul.id) as total_requests,
        COALESCE(SUM(aul.tokens_used), 0)::INTEGER as total_tokens,
        COALESCE(SUM(aul.cost_usd), 0)::DECIMAL as total_cost,
        ROUND(
            (COUNT(CASE WHEN aul.status = 'success' THEN 1 END)::DECIMAL / COUNT(aul.id) * 100), 2
        ) as success_rate
    FROM public.api_usage_log aul
    WHERE aul.user_id = target_user_id
        AND aul.timestamp >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY DATE(aul.timestamp)
    ORDER BY usage_date DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. API breakdown by type
CREATE OR REPLACE FUNCTION get_api_breakdown(target_user_id UUID, days_back INTEGER DEFAULT 30)
RETURNS TABLE (
    api_name VARCHAR,
    display_name VARCHAR,
    total_requests BIGINT,
    total_tokens INTEGER,
    total_cost DECIMAL,
    avg_response_time DECIMAL,
    success_count BIGINT,
    failure_count BIGINT,
    success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        at.name as api_name,
        at.display_name,
        COUNT(aul.id) as total_requests,
        COALESCE(SUM(aul.tokens_used), 0)::INTEGER as total_tokens,
        COALESCE(SUM(aul.cost_usd), 0)::DECIMAL as total_cost,
        ROUND(AVG(aul.response_time_ms), 2) as avg_response_time,
        COUNT(CASE WHEN aul.status = 'success' THEN 1 END) as success_count,
        COUNT(CASE WHEN aul.status != 'success' THEN 1 END) as failure_count,
        ROUND(
            (COUNT(CASE WHEN aul.status = 'success' THEN 1 END)::DECIMAL / COUNT(aul.id) * 100), 2
        ) as success_rate
    FROM public.api_types at
    LEFT JOIN public.api_usage_log aul ON (
        at.id = aul.api_type_id 
        AND aul.user_id = target_user_id
        AND aul.timestamp >= CURRENT_DATE - INTERVAL '1 day' * days_back
    )
    GROUP BY at.id, at.name, at.display_name
    HAVING COUNT(aul.id) > 0
    ORDER BY total_requests DESC;
END;
$$ LANGUAGE plpgsql;

-- 3. Hourly usage pattern
CREATE OR REPLACE FUNCTION get_hourly_usage_pattern(target_user_id UUID, days_back INTEGER DEFAULT 7)
RETURNS TABLE (
    hour_of_day INTEGER,
    avg_requests DECIMAL,
    total_requests BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM aul.timestamp)::INTEGER as hour_of_day,
        ROUND(COUNT(aul.id)::DECIMAL / days_back, 2) as avg_requests,
        COUNT(aul.id) as total_requests
    FROM public.api_usage_log aul
    WHERE aul.user_id = target_user_id
        AND aul.timestamp >= CURRENT_DATE - INTERVAL '1 day' * days_back
    GROUP BY EXTRACT(HOUR FROM aul.timestamp)
    ORDER BY hour_of_day;
END;
$$ LANGUAGE plpgsql;

-- ===== ADMIN QUERIES =====

-- 1. Top users by usage
CREATE OR REPLACE VIEW top_users_by_usage AS
SELECT 
    aul.user_id,
    COUNT(aul.id) as total_requests,
    SUM(aul.tokens_used) as total_tokens,
    SUM(aul.cost_usd) as total_cost,
    AVG(aul.response_time_ms) as avg_response_time,
    MAX(aul.timestamp) as last_activity
FROM public.api_usage_log aul
WHERE aul.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY aul.user_id
ORDER BY total_requests DESC;

-- 2. API performance overview
CREATE OR REPLACE VIEW api_performance_overview AS
SELECT 
    at.name as api_name,
    at.display_name,
    COUNT(aul.id) as total_requests,
    COUNT(CASE WHEN aul.status = 'success' THEN 1 END) as successful_requests,
    COUNT(CASE WHEN aul.status != 'success' THEN 1 END) as failed_requests,
    ROUND(AVG(aul.response_time_ms), 2) as avg_response_time,
    ROUND(
        (COUNT(CASE WHEN aul.status = 'success' THEN 1 END)::DECIMAL / COUNT(aul.id) * 100), 2
    ) as success_rate,
    SUM(aul.tokens_used) as total_tokens,
    SUM(aul.cost_usd) as total_revenue
FROM public.api_types at
LEFT JOIN public.api_usage_log aul ON at.id = aul.api_type_id
WHERE aul.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY at.id, at.name, at.display_name
ORDER BY total_requests DESC;

-- 3. Error analysis
CREATE OR REPLACE VIEW error_analysis AS
SELECT 
    aul.api_name,
    aul.response_status,
    aul.error_code,
    aul.error_message,
    COUNT(*) as error_count,
    AVG(aul.response_time_ms) as avg_response_time,
    MIN(aul.timestamp) as first_occurrence,
    MAX(aul.timestamp) as last_occurrence
FROM public.api_usage_log aul
WHERE aul.status != 'success'
    AND aul.timestamp >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY aul.api_name, aul.response_status, aul.error_code, aul.error_message
ORDER BY error_count DESC;

-- ===== COST TRACKING =====

-- 1. Monthly cost breakdown
CREATE OR REPLACE FUNCTION get_monthly_costs(target_user_id UUID DEFAULT NULL)
RETURNS TABLE (
    month_year TEXT,
    total_cost DECIMAL,
    total_tokens INTEGER,
    total_requests BIGINT,
    cost_per_token DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        TO_CHAR(aul.timestamp, 'YYYY-MM') as month_year,
        ROUND(SUM(aul.cost_usd), 4) as total_cost,
        SUM(aul.tokens_used)::INTEGER as total_tokens,
        COUNT(aul.id) as total_requests,
        CASE 
            WHEN SUM(aul.tokens_used) > 0 
            THEN ROUND(SUM(aul.cost_usd) / SUM(aul.tokens_used), 6)
            ELSE 0 
        END as cost_per_token
    FROM public.api_usage_log aul
    WHERE (target_user_id IS NULL OR aul.user_id = target_user_id)
    GROUP BY TO_CHAR(aul.timestamp, 'YYYY-MM')
    ORDER BY month_year DESC;
END;
$$ LANGUAGE plpgsql;

-- 2. Cost by API type
CREATE OR REPLACE VIEW cost_by_api_type AS
SELECT 
    at.name as api_name,
    at.display_name,
    at.category,
    COUNT(aul.id) as total_requests,
    SUM(aul.tokens_used) as total_tokens,
    ROUND(SUM(aul.cost_usd), 4) as total_cost,
    ROUND(AVG(aul.cost_usd), 6) as avg_cost_per_request,
    at.base_cost_per_token as base_rate
FROM public.api_types at
LEFT JOIN public.api_usage_log aul ON at.id = aul.api_type_id
WHERE aul.timestamp >= CURRENT_DATE - INTERVAL '30 days'
GROUP BY at.id, at.name, at.display_name, at.category, at.base_cost_per_token
ORDER BY total_cost DESC;

-- ===== RATE LIMITING QUERIES =====

-- 1. Check current rate limit status
CREATE OR REPLACE FUNCTION check_rate_limits(target_user_id UUID, target_api_name VARCHAR)
RETURNS TABLE (
    current_minute_requests INTEGER,
    current_hour_requests INTEGER,
    current_day_requests INTEGER,
    current_day_tokens INTEGER,
    minute_limit INTEGER,
    hour_limit INTEGER,
    day_limit INTEGER,
    day_token_limit INTEGER,
    minute_exceeded BOOLEAN,
    hour_exceeded BOOLEAN,
    day_exceeded BOOLEAN,
    token_exceeded BOOLEAN
) AS $$
DECLARE
    api_type_id UUID;
BEGIN
    -- Get API type ID
    SELECT id INTO api_type_id FROM public.api_types WHERE name = target_api_name;
    
    IF api_type_id IS NULL THEN
        RAISE EXCEPTION 'API type % not found', target_api_name;
    END IF;
    
    RETURN QUERY
    SELECT 
        (
            SELECT COUNT(*)::INTEGER 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND timestamp >= NOW() - INTERVAL '1 minute'
        ) as current_minute_requests,
        (
            SELECT COUNT(*)::INTEGER 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND timestamp >= NOW() - INTERVAL '1 hour'
        ) as current_hour_requests,
        (
            SELECT COUNT(*)::INTEGER 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND DATE(timestamp) = CURRENT_DATE
        ) as current_day_requests,
        (
            SELECT COALESCE(SUM(tokens_used), 0)::INTEGER 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND DATE(timestamp) = CURRENT_DATE
        ) as current_day_tokens,
        arl.requests_per_minute as minute_limit,
        arl.requests_per_hour as hour_limit,
        arl.requests_per_day as day_limit,
        arl.tokens_per_day as day_token_limit,
        (
            SELECT COUNT(*) 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND timestamp >= NOW() - INTERVAL '1 minute'
        ) >= arl.requests_per_minute as minute_exceeded,
        (
            SELECT COUNT(*) 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND timestamp >= NOW() - INTERVAL '1 hour'
        ) >= arl.requests_per_hour as hour_exceeded,
        (
            SELECT COUNT(*) 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND DATE(timestamp) = CURRENT_DATE
        ) >= arl.requests_per_day as day_exceeded,
        (
            SELECT COALESCE(SUM(tokens_used), 0) 
            FROM public.api_usage_log 
            WHERE user_id = target_user_id 
                AND api_type_id = check_rate_limits.api_type_id
                AND DATE(timestamp) = CURRENT_DATE
        ) >= arl.tokens_per_day as token_exceeded
    FROM public.api_rate_limits arl
    WHERE arl.user_id = target_user_id 
        AND arl.api_type_id = check_rate_limits.api_type_id;
END;
$$ LANGUAGE plpgsql;

-- ===== EXAMPLE USAGE QUERIES =====

-- Get current status for a user
-- SELECT * FROM user_current_status WHERE user_id = '11111111-1111-1111-1111-111111111111';

-- Get daily usage summary for last 7 days
-- SELECT * FROM get_daily_usage_summary('11111111-1111-1111-1111-111111111111', 7);

-- Get API breakdown for last 30 days
-- SELECT * FROM get_api_breakdown('11111111-1111-1111-1111-111111111111', 30);

-- Check rate limits for OpenAI GPT
-- SELECT * FROM check_rate_limits('11111111-1111-1111-1111-111111111111', 'openai_gpt');

-- Get monthly costs for all users
-- SELECT * FROM get_monthly_costs();

-- Get monthly costs for specific user
-- SELECT * FROM get_monthly_costs('11111111-1111-1111-1111-111111111111');

-- View top users
-- SELECT * FROM top_users_by_usage LIMIT 10;

-- View API performance
-- SELECT * FROM api_performance_overview;

-- View recent errors
-- SELECT * FROM error_analysis LIMIT 20;