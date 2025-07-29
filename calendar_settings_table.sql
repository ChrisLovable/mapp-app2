-- Create calendar_settings table for user preferences
-- This table stores user-specific calendar settings and preferences

CREATE TABLE IF NOT EXISTS calendar_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  default_view TEXT CHECK (default_view IN ('month', 'week', 'day', 'agenda')) DEFAULT 'month',
  default_reminder_minutes INTEGER DEFAULT 15,
  working_hours_start TIME DEFAULT '09:00:00',
  working_hours_end TIME DEFAULT '17:00:00',
  working_days INTEGER[] DEFAULT '{1,2,3,4,5}', -- Monday=1, Sunday=0
  timezone TEXT DEFAULT 'UTC',
  theme TEXT CHECK (theme IN ('light', 'dark', 'auto')) DEFAULT 'auto',
  event_colors JSONB DEFAULT '{
    "meeting": "#3B82F6",
    "reminder": "#10B981", 
    "task": "#F59E0B",
    "personal": "#8B5CF6",
    "work": "#EF4444",
    "health": "#06B6D4",
    "social": "#EC4899"
  }',
  notification_settings JSONB DEFAULT '{
    "email": true,
    "push": true,
    "sound": true,
    "desktop": true
  }',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_settings_user_id ON calendar_settings(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own settings" ON calendar_settings
  FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can insert their own settings" ON calendar_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can update their own settings" ON calendar_settings
  FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_calendar_settings_updated_at 
  BEFORE UPDATE ON calendar_settings 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Add comments
COMMENT ON TABLE calendar_settings IS 'User-specific calendar settings and preferences';
COMMENT ON COLUMN calendar_settings.default_view IS 'Default calendar view (month, week, day, agenda)';
COMMENT ON COLUMN calendar_settings.default_reminder_minutes IS 'Default reminder time in minutes before events';
COMMENT ON COLUMN calendar_settings.working_hours_start IS 'Start of working hours';
COMMENT ON COLUMN calendar_settings.working_hours_end IS 'End of working hours';
COMMENT ON COLUMN calendar_settings.working_days IS 'Array of working days (0=Sunday, 1=Monday, etc.)';
COMMENT ON COLUMN calendar_settings.timezone IS 'User timezone';
COMMENT ON COLUMN calendar_settings.theme IS 'Calendar theme preference';
COMMENT ON COLUMN calendar_settings.event_colors IS 'JSON object mapping event types to colors';
COMMENT ON COLUMN calendar_settings.notification_settings IS 'JSON object with notification preferences'; 