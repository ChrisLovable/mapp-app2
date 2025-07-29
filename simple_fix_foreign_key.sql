-- Remove foreign key constraint to allow dummy user ID
ALTER TABLE expense_tracker DROP CONSTRAINT IF EXISTS expense_tracker_user_id_fkey;

-- To restore the foreign key constraint later (when you have proper authentication):
-- ALTER TABLE expense_tracker ADD CONSTRAINT expense_tracker_user_id_fkey 
--     FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE; 