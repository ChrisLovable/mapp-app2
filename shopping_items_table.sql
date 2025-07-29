-- Create shopping_items table for the ShoppingListModal
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS shopping_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  description TEXT NOT NULL,
  quantity TEXT DEFAULT '1',
  vendor TEXT DEFAULT 'Any',
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE shopping_items ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
-- In production, you should create more restrictive policies
CREATE POLICY "Allow all operations on shopping_items" ON shopping_items
  FOR ALL USING (true);

-- Create an index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_shopping_items_created_at ON shopping_items(created_at DESC);

-- Optional: Create an index on completed status
CREATE INDEX IF NOT EXISTS idx_shopping_items_completed ON shopping_items(completed); 