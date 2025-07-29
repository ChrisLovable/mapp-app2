-- Secure RLS Policies for Production
-- This file contains secure Row Level Security policies for all tables
-- Run this in your Supabase SQL Editor

-- ===== EXPENSE TRACKER =====
-- Drop existing policies that allow dummy user
DROP POLICY IF EXISTS "Users can view their own expenses" ON expense_tracker;
DROP POLICY IF EXISTS "Users can insert their own expenses" ON expense_tracker;
DROP POLICY IF EXISTS "Users can update their own expenses" ON expense_tracker;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON expense_tracker;

-- Create secure policies that only allow authenticated users to access their own data
CREATE POLICY "Users can view their own expenses" ON expense_tracker
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own expenses" ON expense_tracker
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON expense_tracker
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON expense_tracker
    FOR DELETE USING (auth.uid() = user_id);

-- ===== TODOS =====
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on todos" ON todos;

-- Create secure policies
CREATE POLICY "Users can view their own todos" ON todos
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own todos" ON todos
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own todos" ON todos
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own todos" ON todos
    FOR DELETE USING (auth.uid() = user_id);

-- Add user_id column if it doesn't exist
ALTER TABLE todos ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===== SHOPPING ITEMS =====
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on shopping_items" ON shopping_items;

-- Create secure policies
CREATE POLICY "Users can view their own shopping items" ON shopping_items
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own shopping items" ON shopping_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own shopping items" ON shopping_items
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own shopping items" ON shopping_items
    FOR DELETE USING (auth.uid() = user_id);

-- Add user_id column if it doesn't exist
ALTER TABLE shopping_items ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- ===== INFO VAULT =====
-- Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all operations on info_vault" ON info_vault;

-- Create secure policies
CREATE POLICY "Users can view their own vault entries" ON info_vault
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own vault entries" ON info_vault
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own vault entries" ON info_vault
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own vault entries" ON info_vault
    FOR DELETE USING (auth.uid()::text = user_id);

-- ===== CALENDAR EVENTS =====
-- These policies should already be secure, but let's ensure they're correct
DROP POLICY IF EXISTS "Users can view their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can insert their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can update their own events" ON calendar_events;
DROP POLICY IF EXISTS "Users can delete their own events" ON calendar_events;

CREATE POLICY "Users can view their own events" ON calendar_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own events" ON calendar_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own events" ON calendar_events
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own events" ON calendar_events
    FOR DELETE USING (auth.uid() = user_id);

-- ===== USER COMMENTS =====
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own comments" ON user_comments;
DROP POLICY IF EXISTS "Users can insert own comments" ON user_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON user_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON user_comments;

-- Create secure policies
CREATE POLICY "Users can view own comments" ON user_comments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own comments" ON user_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments" ON user_comments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON user_comments
    FOR DELETE USING (auth.uid() = user_id);

-- ===== DIARY ENTRIES =====
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can insert own diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can update own diary entries" ON diary_entries;
DROP POLICY IF EXISTS "Users can delete own diary entries" ON diary_entries;

-- Create secure policies
CREATE POLICY "Users can view own diary entries" ON diary_entries
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own diary entries" ON diary_entries
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own diary entries" ON diary_entries
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own diary entries" ON diary_entries
    FOR DELETE USING (auth.uid() = user_id);

-- ===== MEETING RECORDINGS =====
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own recordings" ON meeting_recordings;
DROP POLICY IF EXISTS "Users can insert own recordings" ON meeting_recordings;
DROP POLICY IF EXISTS "Users can update own recordings" ON meeting_recordings;
DROP POLICY IF EXISTS "Users can delete own recordings" ON meeting_recordings;

-- Create secure policies
CREATE POLICY "Users can view own recordings" ON meeting_recordings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recordings" ON meeting_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recordings" ON meeting_recordings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own recordings" ON meeting_recordings
    FOR DELETE USING (auth.uid() = user_id);

-- ===== VERIFICATION =====
-- Check that all tables have RLS enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'expense_tracker',
    'todos', 
    'shopping_items',
    'info_vault',
    'calendar_events',
    'user_comments',
    'diary_entries',
    'meeting_recordings'
);

-- Check policies for each table
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname; 