-- Simple dummy data for calendar_events table
-- Note: Replace '00000000-0000-0000-0000-000000000000' with an actual user ID from your auth.users table

-- Clear existing sample data (optional)
-- DELETE FROM calendar_events WHERE user_id = '00000000-0000-0000-0000-000000000000';

-- Insert simple calendar events
INSERT INTO calendar_events (
    id,
    user_id,
    title,
    start_time,
    end_time,
    event_type
) VALUES 
-- Today's events
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Team Standup',
    NOW() + INTERVAL '2 hours',
    NOW() + INTERVAL '2 hours 30 minutes',
    'meeting'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Client Call',
    NOW() + INTERVAL '4 hours',
    NOW() + INTERVAL '5 hours',
    'meeting'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Doctor Appointment',
    NOW() + INTERVAL '6 hours',
    NOW() + INTERVAL '7 hours',
    'health'
),

-- Tomorrow's events
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Project Review',
    NOW() + INTERVAL '1 day' + INTERVAL '9 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '10 hours 30 minutes',
    'work'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Lunch Meeting',
    NOW() + INTERVAL '1 day' + INTERVAL '12 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '13 hours',
    'social'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Gym Session',
    NOW() + INTERVAL '1 day' + INTERVAL '18 hours',
    NOW() + INTERVAL '1 day' + INTERVAL '19 hours 30 minutes',
    'health'
),

-- This week's events
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Board Meeting',
    NOW() + INTERVAL '3 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '3 days' + INTERVAL '12 hours',
    'meeting'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Dentist Visit',
    NOW() + INTERVAL '4 days' + INTERVAL '14 hours',
    NOW() + INTERVAL '4 days' + INTERVAL '15 hours',
    'health'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Movie Night',
    NOW() + INTERVAL '5 days' + INTERVAL '19 hours',
    NOW() + INTERVAL '5 days' + INTERVAL '22 hours',
    'social'
),

-- Next week's events
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Conference Call',
    NOW() + INTERVAL '8 days' + INTERVAL '8 hours',
    NOW() + INTERVAL '8 days' + INTERVAL '9 hours',
    'meeting'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Birthday Party',
    NOW() + INTERVAL '9 days' + INTERVAL '15 hours',
    NOW() + INTERVAL '9 days' + INTERVAL '18 hours',
    'social'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Car Service',
    NOW() + INTERVAL '10 days' + INTERVAL '10 hours',
    NOW() + INTERVAL '10 days' + INTERVAL '11 hours 30 minutes',
    'personal'
),

-- Past events
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Weekly Meeting',
    NOW() - INTERVAL '2 days' + INTERVAL '10 hours',
    NOW() - INTERVAL '2 days' + INTERVAL '11 hours',
    'meeting'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Shopping Trip',
    NOW() - INTERVAL '1 day' + INTERVAL '16 hours',
    NOW() - INTERVAL '1 day' + INTERVAL '17 hours',
    'personal'
),
(
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'Code Review',
    NOW() - INTERVAL '3 days' + INTERVAL '14 hours',
    NOW() - INTERVAL '3 days' + INTERVAL '15 hours',
    'work'
);

-- Verify the data was inserted
SELECT 
    id,
    title,
    event_type,
    start_time,
    end_time
FROM calendar_events 
WHERE user_id = '00000000-0000-0000-0000-000000000000'
ORDER BY start_time; 