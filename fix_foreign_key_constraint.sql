-- Option 1: Create a dummy user in auth.users table
-- This is the cleaner approach
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data,
    is_super_admin,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'dummy@test.com',
    crypt('dummy_password', gen_salt('bf')),
    NOW(),
    NOW(),
    NOW(),
    '{"provider": "email", "providers": ["email"]}',
    '{}',
    false,
    '',
    '',
    '',
    ''
) ON CONFLICT (id) DO NOTHING;

-- Option 2: If Option 1 doesn't work, temporarily remove the foreign key constraint
-- ALTER TABLE expense_tracker DROP CONSTRAINT IF EXISTS expense_tracker_user_id_fkey;

-- To restore the foreign key constraint later:
-- ALTER TABLE expense_tracker ADD CONSTRAINT expense_tracker_user_id_fkey 
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; 