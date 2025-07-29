-- Insert sample data for calendar system (using NULL user_id)
-- This provides examples of different types of events and templates

-- Insert sample calendar events
INSERT INTO calendar_events (
  user_id, 
  title, 
  description, 
  start_time, 
  end_time, 
  event_type, 
  location, 
  attendees, 
  color, 
  priority, 
  reminder_minutes
) VALUES 
  -- Meeting examples
  (
    NULL,
    'Team Standup',
    'Daily team standup meeting to discuss progress and blockers',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours 30 minutes',
    'meeting',
    'Conference Room A',
    ARRAY['john@company.com', 'sarah@company.com', 'mike@company.com'],
    '#3B82F6',
    'high',
    15
  ),
  (
    NULL,
    'Client Presentation',
    'Present quarterly results to client',
    NOW() + INTERVAL '2 days' + INTERVAL '14 hours',
    NOW() + INTERVAL '2 days' + INTERVAL '15 hours 30 minutes',
    'meeting',
    'Zoom Meeting',
    ARRAY['client@example.com', 'manager@company.com'],
    '#EF4444',
    'high',
    30
  ),
  -- Reminder examples
  (
    NULL,
    'Take Medication',
    'Daily medication reminder',
    NOW() + INTERVAL '12 hours',
    NOW() + INTERVAL '12 hours 5 minutes',
    'reminder',
    'Home',
    ARRAY[]::text[],
    '#10B981',
    'medium',
    5
  ),
  (
    NULL,
    'Grocery Shopping',
    'Buy groceries for the week',
    NOW() + INTERVAL '3 days' + INTERVAL '18 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '19 hours',
    'reminder',
    'Local Supermarket',
    ARRAY[]::text[],
    '#10B981',
    'medium',
    60
  ),
  -- Task examples
  (
    NULL,
    'Review Code',
    'Review pull request #123 for the new feature',
    NOW() + INTERVAL '1 day' + INTERVAL '16 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '17 hours',
    'task',
    'Office',
    ARRAY[]::text[],
    '#F59E0B',
    'medium',
    15
  ),
  -- Personal examples
  (
    NULL,
    'Gym Workout',
    'Cardio and strength training session',
    NOW() + INTERVAL '1 day' + INTERVAL '7 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '8 hours 30 minutes',
    'personal',
    'Fitness Center',
    ARRAY[]::text[],
    '#8B5CF6',
    'low',
    30
  ),
  -- Social examples
  (
    NULL,
    'Dinner with Friends',
    'Catch up with college friends',
    NOW() + INTERVAL '4 days' + INTERVAL '19 hours',
    NOW() + INTERVAL '4 days' + INTERVAL '22 hours',
    'social',
    'Italian Restaurant',
    ARRAY['friend1@email.com', 'friend2@email.com'],
    '#EC4899',
    'medium',
    60
  ),
  -- Recurring event example
  (
    NULL,
    'Weekly Team Meeting',
    'Weekly team sync and planning session',
    NOW() + INTERVAL '1 week' + INTERVAL '10 hours',
    NOW() + INTERVAL '1 week' + INTERVAL '11 hours',
    'meeting',
    'Conference Room B',
    ARRAY['team@company.com'],
    '#3B82F6',
    'high',
    15
  )
ON CONFLICT DO NOTHING;

-- Insert sample calendar settings
INSERT INTO calendar_settings (
  user_id,
  default_view,
  default_reminder_minutes,
  working_hours_start,
  working_hours_end,
  working_days,
  timezone,
  theme,
  event_colors,
  notification_settings
) VALUES (
  NULL,
  'month',
  15,
  '09:00:00',
  '17:00:00',
  ARRAY[1,2,3,4,5],
  'America/New_York',
  'auto',
  '{
    "meeting": "#3B82F6",
    "reminder": "#10B981", 
    "task": "#F59E0B",
    "personal": "#8B5CF6",
    "work": "#EF4444",
    "health": "#06B6D4",
    "social": "#EC4899"
  }',
  '{
    "email": true,
    "push": true,
    "sound": true,
    "desktop": true
  }'
) ON CONFLICT (user_id) DO NOTHING;

-- Insert sample calendar templates
INSERT INTO calendar_templates (
  user_id,
  template_name,
  title,
  description,
  event_type,
  duration_minutes,
  location,
  attendees,
  color,
  priority,
  reminder_minutes,
  is_public
) VALUES 
  (
    NULL,
    'Quick Meeting',
    'Quick Meeting',
    'Brief discussion or check-in',
    'meeting',
    30,
    'Conference Room',
    ARRAY[]::text[],
    '#3B82F6',
    'medium',
    15,
    true
  ),
  (
    NULL,
    'Doctor Appointment',
    'Doctor Appointment',
    'Medical checkup or consultation',
    'health',
    60,
    'Medical Center',
    ARRAY[]::text[],
    '#06B6D4',
    'high',
    30,
    true
  ),
  (
    NULL,
    'Workout Session',
    'Gym Workout',
    'Exercise and fitness training',
    'personal',
    90,
    'Fitness Center',
    ARRAY[]::text[],
    '#8B5CF6',
    'medium',
    15,
    true
  ),
  (
    NULL,
    'Client Call',
    'Client Call',
    'Client consultation or update call',
    'meeting',
    45,
    'Zoom/Teams',
    ARRAY['client@example.com'],
    '#EF4444',
    'high',
    30,
    false
  ),
  (
    NULL,
    'Code Review',
    'Code Review',
    'Review pull request and provide feedback',
    'task',
    60,
    'Office',
    ARRAY[]::text[],
    '#F59E0B',
    'medium',
    15,
    true
  )
ON CONFLICT DO NOTHING; 