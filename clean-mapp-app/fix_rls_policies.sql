-- Fix RLS policies to allow dummy user for testing
-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view their own expenses" ON expense_tracker;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expense_tracker;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expense_tracker;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expense_tracker;

-- Now create new policies that allow both authenticated users and the dummy user
CREATE POLICY "Users can view their own expenses" ON expense_tracker
    FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can insert their own expenses" ON expense_tracker
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can update their own expenses" ON expense_tracker
    FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can delete their own expenses" ON expense_tracker
    FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000'); 