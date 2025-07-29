-- Sample data for calendar_events table
-- Note: Replace '00000000-0000-0000-0000-000000000000' with an actual user ID from your auth.users table

-- Clear existing sample data (optional)
-- DELETE FROM calendar_events WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Insert sample calendar events
INSERT INTO calendar_events (
    user_id,
    title,
    description,
    start_time,
    end_time,
    all_day,
    event_type,
    location,
    attendees,
    color,
    priority,
    reminder_minutes,
    is_completed
) VALUES 
-- Today's events
(
    '00000000-0000-0000-0000-000000000000',
    'Team Standup Meeting',
    'Daily standup to discuss progress and blockers',
    NOW() + INTERVAL '2 hours',
    NOW() + INTERVAL '2 hours 30 minutes',
    FALSE,
    'meeting',
    'Conference Room A / https://meet.google.com/abc-defg-hij',
    '["john.doe@company.com", "jane.smith@company.com", "mike.johnson@company.com"]',
    '#3B82F6',
    'medium',
    15,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Client Presentation',
    'Present quarterly results to ABC Corp',
    NOW() + INTERVAL '4 hours',
    NOW() + INTERVAL '5 hours',
    FALSE,
    'work',
    'Board Room / https://zoom.us/j/123456789',
    '["client@abccorp.com", "manager@company.com"]',
    '#EF4444',
    'high',
    30,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Doctor Appointment',
    'Annual checkup with Dr. Wilson',
    NOW() + INTERVAL '6 hours',
    NOW() + INTERVAL '7 hours',
    FALSE,
    'health',
    'Medical Center - Room 205',
    '[]',
    '#10B981',
    'medium',
    60,
    FALSE
),

-- Tomorrow's events
(
    '00000000-0000-0000-0000-000000000000',
    'Project Deadline',
    'Submit final report for Q4 project',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '17 hours',
    TRUE,
    'work',
    'Office / Remote',
    '["team@company.com"]',
    '#F59E0B',
    'urgent',
    120,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Lunch with Sarah',
    'Catch up over lunch at the new Italian restaurant',
    NOW() + INTERVAL '1 day' + INTERVAL '12 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '13 hours 30 minutes',
    FALSE,
    'social',
    'Bella Italia Restaurant',
    '["sarah@email.com"]',
    '#8B5CF6',
    'low',
    15,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Gym Workout',
    'Cardio and strength training session',
    NOW() + INTERVAL '1 day' + INTERVAL '18 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '19 hours 30 minutes',
    FALSE,
    'health',
    'Fitness Center',
    '[]',
    '#06B6D4',
    'medium',
    30,
    FALSE
),

-- This week's events
(
    '00000000-0000-0000-0000-000000000000',
    'Board Meeting',
    'Quarterly board meeting to discuss company strategy',
    NOW() + INTERVAL '3 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '12 hours',
    FALSE,
    'meeting',
    'Executive Conference Room / https://teams.microsoft.com/l/meetup-join/...',
    '["ceo@company.com", "cto@company.com", "cfo@company.com", "board@company.com"]',
    '#DC2626',
    'high',
    60,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Dentist Appointment',
    'Regular cleaning and checkup',
    NOW() + INTERVAL '4 days' + INTERVAL '14 hours',
    NOW() + INTERVAL '4 days' + INTERVAL '15 hours',
    FALSE,
    'health',
    'Dental Clinic - Dr. Martinez',
    '[]',
    '#10B981',
    'medium',
    60,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Movie Night',
    'Watch the new Marvel movie with friends',
    NOW() + INTERVAL '5 days' + INTERVAL '19 hours',
    NOW() + INTERVAL '5 days' + INTERVAL '22 hours',
    FALSE,
    'social',
    'AMC Theater - Downtown',
    '["friend1@email.com", "friend2@email.com", "friend3@email.com"]',
    '#8B5CF6',
    'low',
    30,
    FALSE
),

-- Next week's events
(
    '00000000-0000-0000-0000-000000000000',
    'Conference Call - International Team',
    'Weekly sync with overseas development team',
    NOW() + INTERVAL '8 days' + INTERVAL '8 hours',
    NOW() + INTERVAL '8 days' + INTERVAL '9 hours',
    FALSE,
    'meeting',
    'Virtual Meeting / https://meet.google.com/xyz-uvw-123',
    '["dev-team-india@company.com", "dev-team-uk@company.com", "pm@company.com"]',
    '#3B82F6',
    'medium',
    15,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Birthday Party Planning',
    'Plan details for mom\'s 60th birthday celebration',
    NOW() + INTERVAL '9 days' + INTERVAL '15 hours',
    NOW() + INTERVAL '9 days' + INTERVAL '16 hours 30 minutes',
    FALSE,
    'personal',
    'Home / Coffee Shop',
    '["sister@email.com", "brother@email.com"]',
    '#F97316',
    'medium',
    60,
    FALSE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Car Maintenance',
    'Oil change and tire rotation',
    NOW() + INTERVAL '10 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '10 days' + INTERVAL '11 hours 30 minutes',
    FALSE,
    'personal',
    'Auto Service Center',
    '[]',
    '#6B7280',
    'medium',
    30,
    FALSE
),

-- Completed events (past events)
(
    '00000000-0000-0000-0000-000000000000',
    'Weekly Team Meeting',
    'Discuss project progress and upcoming tasks',
    NOW() - INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '11 hours',
    FALSE,
    'meeting',
    'Conference Room B',
    '["team@company.com"]',
    '#3B82F6',
    'medium',
    15,
    TRUE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Grocery Shopping',
    'Buy groceries for the week',
    NOW() - INTERVAL '1 day' + INTERVAL '16 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '17 hours',
    FALSE,
    'personal',
    'Supermarket',
    '[]',
    '#6B7280',
    'low',
    30,
    TRUE
),
(
    '00000000-0000-0000-0000-000000000000',
    'Code Review Session',
    'Review pull requests for the new feature',
    NOW() - INTERVAL '3 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '15 hours',
    FALSE,
    'work',
    'Virtual / Slack',
    '["senior-dev@company.com", "junior-dev@company.com"]',
    '#F59E0B',
    'medium',
    15,
    TRUE
);

-- Verify the data was inserted
SELECT 
    title,
    event_type,
    start_time,
    end_time,
    priority,
    is_completed
FROM calendar_events 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY start_time;
