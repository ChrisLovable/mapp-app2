-- Create info_vault table for the VaultModal
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS info_vault (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  description TEXT NOT NULL,
  password TEXT NOT NULL,
  username TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE info_vault ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
-- In production, you should create more restrictive policies
CREATE POLICY "Allow all operations on info_vault" ON info_vault
  FOR ALL USING (true);

-- Create an index on created_at for better performance
CREATE INDEX IF NOT EXISTS idx_info_vault_created_at ON info_vault(created_at DESC);

-- Create an index on user_id for filtering
CREATE INDEX IF NOT EXISTS idx_info_vault_user_id ON info_vault(user_id); 