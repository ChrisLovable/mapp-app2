-- Create calendar_templates table for reusable event templates
-- This table stores templates for quick event creation

CREATE TABLE IF NOT EXISTS calendar_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  template_name TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT CHECK (event_type IN ('meeting', 'reminder', 'task', 'personal', 'work', 'health', 'social')) DEFAULT 'meeting',
  duration_minutes INTEGER DEFAULT 60,
  location TEXT,
  attendees TEXT[],
  color TEXT DEFAULT '#3B82F6',
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')) DEFAULT 'medium',
  reminder_minutes INTEGER DEFAULT 15,
  is_public BOOLEAN DEFAULT FALSE, -- Whether template can be shared
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_templates_user_id ON calendar_templates(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_templates_event_type ON calendar_templates(event_type);
CREATE INDEX IF NOT EXISTS idx_calendar_templates_is_public ON calendar_templates(is_public);

-- Enable Row Level Security (RLS)
ALTER TABLE calendar_templates ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own templates and public ones" ON calendar_templates
  FOR SELECT USING (
    auth.uid() = user_id OR 
    user_id = '00000000-0000-0000-0000-000000000000' OR 
    is_public = true
  );

CREATE POLICY "Users can insert their own templates" ON calendar_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can update their own templates" ON calendar_templates
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can delete their own templates" ON calendar_templates
  FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_templates_updated_at 
  BEFORE UPDATE ON calendar_templates 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE calendar_templates IS 'Reusable event templates for quick calendar event creation';
COMMENT ON COLUMN calendar_templates.template_name IS 'Name of the template for easy identification';
COMMENT ON COLUMN calendar_templates.title IS 'Default title for events created from this template';
COMMENT ON COLUMN calendar_templates.description IS 'Default description for events created from this template';
COMMENT ON COLUMN calendar_templates.duration_minutes IS 'Default duration in minutes for events created from this template';
COMMENT ON COLUMN calendar_templates.is_public IS 'Whether this template can be shared with other users'; 