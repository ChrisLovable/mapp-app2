-- Create todos table for AI-powered to-do manager
CREATE TABLE IF NOT EXISTS todos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  due_date DATE,
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  notes TEXT,
  project TEXT,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_todos_created_at ON todos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_todos_completed ON todos(completed);
CREATE INDEX IF NOT EXISTS idx_todos_project ON todos(project);
CREATE INDEX IF NOT EXISTS idx_todos_priority ON todos(priority);

-- Enable Row Level Security (RLS)
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations (you can modify this based on your auth requirements)
CREATE POLICY "Allow all operations on todos" ON todos
  FOR ALL USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_todos_updated_at 
  BEFORE UPDATE ON todos 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample data for testing
INSERT INTO todos (title, due_date, priority, notes, project, completed) VALUES
  ('Buy groceries', '2024-01-15', 'high', 'Need milk, bread, and eggs', 'Shopping', false),
  ('Finish React tutorial', '2024-01-20', 'medium', 'Complete the advanced hooks section', 'Learning', false),
  ('Call dentist', '2024-01-12', 'low', 'Schedule annual checkup', 'Health', true),
  ('Review project proposal', '2024-01-18', 'high', 'Client meeting preparation', 'Work', false),
  ('Exercise', NULL, 'medium', '30 minutes cardio', 'Fitness', false)
ON CONFLICT DO NOTHING; 