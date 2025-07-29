-- User Comments Table
-- This table stores user information and comments from the main textbox

CREATE TABLE IF NOT EXISTS user_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    comment_text TEXT NOT NULL,
    language VARCHAR(10) DEFAULT 'en-US', -- Language of the comment (en-US, af-ZA, etc.)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    metadata JSONB DEFAULT '{}' -- Additional metadata like device info, browser, etc.
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_comments_user_id ON user_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_user_comments_created_at ON user_comments(created_at);
CREATE INDEX IF NOT EXISTS idx_user_comments_language ON user_comments(language);
CREATE INDEX IF NOT EXISTS idx_user_comments_active ON user_comments(is_active);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_user_comments_updated_at 
    BEFORE UPDATE ON user_comments 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE user_comments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own comments
CREATE POLICY "Users can view own comments" ON user_comments
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own comments
CREATE POLICY "Users can insert own comments" ON user_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update own comments" ON user_comments
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments" ON user_comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create a view for easier querying with user information
CREATE OR REPLACE VIEW user_comments_with_user_info AS
SELECT 
    uc.id,
    uc.user_id,
    u.email as user_email,
    u.raw_user_meta_data->>'full_name' as user_full_name,
    uc.comment_text,
    uc.language,
    uc.created_at,
    uc.updated_at,
    uc.is_active,
    uc.metadata
FROM user_comments uc
LEFT JOIN auth.users u ON uc.user_id = u.id
WHERE uc.is_active = TRUE;

-- Sample data insertion (for testing)
-- Note: Replace 'your-user-id-here' with an actual user ID from auth.users
/*
INSERT INTO user_comments (user_id, comment_text, language, metadata) VALUES
('your-user-id-here', 'This is a test comment from the main textbox.', 'en-US', '{"device": "mobile", "browser": "chrome"}'),
('your-user-id-here', 'Hierdie is \''n toets kommentaar in Afrikaans.', 'af-ZA', '{"device": "desktop", "browser": "firefox"}'),
('your-user-id-here', 'Another test comment with some special characters: @#$%^&*()', 'en-US', '{"device": "tablet", "browser": "safari"}');
*/

-- Function to get user's comment statistics
CREATE OR REPLACE FUNCTION get_user_comment_stats(p_user_id UUID)
RETURNS TABLE (
    total_comments BIGINT,
    comments_this_month BIGINT,
    comments_this_week BIGINT,
    most_used_language VARCHAR(10),
    last_comment_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_comments,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('month', NOW())) as comments_this_month,
        COUNT(*) FILTER (WHERE created_at >= date_trunc('week', NOW())) as comments_this_week,
        language as most_used_language,
        MAX(created_at) as last_comment_date
    FROM user_comments 
    WHERE user_id = p_user_id AND is_active = TRUE
    GROUP BY language
    ORDER BY COUNT(*) DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Function to search comments by text content
CREATE OR REPLACE FUNCTION search_user_comments(p_user_id UUID, search_term TEXT)
RETURNS TABLE (
    id UUID,
    comment_text TEXT,
    language VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE,
    similarity REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        uc.id,
        uc.comment_text,
        uc.language,
        uc.created_at,
        similarity(uc.comment_text, search_term) as similarity
    FROM user_comments uc
    WHERE uc.user_id = p_user_id 
        AND uc.is_active = TRUE
        AND uc.comment_text ILIKE '%' || search_term || '%'
    ORDER BY similarity DESC, uc.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON user_comments TO authenticated;
GRANT SELECT ON user_comments_with_user_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_comment_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION search_user_comments(UUID, TEXT) TO authenticated;

-- Comments and documentation
COMMENT ON TABLE user_comments IS 'Stores user comments from the main textbox with user information and metadata';
COMMENT ON COLUMN user_comments.comment_text IS 'The actual comment text from the main textbox';
COMMENT ON COLUMN user_comments.language IS 'Language code of the comment (en-US, af-ZA, etc.)';
COMMENT ON COLUMN user_comments.metadata IS 'Additional metadata like device info, browser, etc.';
COMMENT ON VIEW user_comments_with_user_info IS 'View combining user comments with user information for easier querying'; 