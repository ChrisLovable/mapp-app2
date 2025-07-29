-- Completely disable RLS for testing purposes
-- This will allow all operations without authentication checks
ALTER TABLE expense_tracker DISABLE ROW LEVEL SECURITY;

-- To re-enable RLS later (when you have proper authentication):
-- ALTER TABLE expense_tracker ENABLE ROW LEVEL SECURITY; 