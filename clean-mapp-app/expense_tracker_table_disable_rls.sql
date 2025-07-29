-- Temporarily disable RLS for testing
ALTER TABLE expense_tracker DISABLE ROW LEVEL SECURITY;

-- Or if you want to drop the existing policies and recreate them:
-- DROP POLICY IF EXISTS "Users can view their own expenses" ON expense_tracker;
-- DROP POLICY IF EXISTS "Users can insert their own expenses" ON expense_tracker;
-- DROP POLICY IF EXISTS "Users can update their own expenses" ON expense_tracker;
-- DROP POLICY IF EXISTS "Users can delete their own expenses" ON expense_tracker;

-- Then you can re-enable RLS later with proper policies:
-- ALTER TABLE expense_tracker ENABLE ROW LEVEL SECURITY; 