-- Get your user ID from Supabase auth.users table
-- Run this first to get your actual user ID, then replace the placeholder in calendar_sample_data.sql

SELECT 
    id,
    email,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;

-- Alternative: If you know your email, you can search by it:
-- SELECT id, email, created_at FROM auth.users WHERE email = 'your-email@example.com'; 