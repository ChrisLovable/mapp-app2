-- Sample data for Admin Dashboard testing
-- Insert sample user tokens
INSERT INTO user_tokens (user_id, tokens_allocated, tokens_remaining, tokens_used) VALUES
('00000000-0000-0000-0000-000000000000', 1000, 847, 153)
ON CONFLICT (user_id) DO UPDATE SET
  tokens_allocated = 1000,
  tokens_remaining = 847,
  tokens_used = 153;

-- Insert sample API usage logs
INSERT INTO api_usage_log (user_id, api_name, endpoint, tokens_used, cost_usd, request_data, response_status, response_time_ms, status, timestamp) VALUES
-- Image Generation (most used)
('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 10, 0.001, '{"prompt": "a beautiful sunset", "hasReferenceImage": false}', '200', 2500, 'success', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 10, 0.001, '{"prompt": "flying ostrich", "hasReferenceImage": true}', '200', 3200, 'success', NOW() - INTERVAL '3 hours'),
('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 10, 0.001, '{"prompt": "test image", "hasReferenceImage": false}', '402', 1500, 'failed', NOW() - INTERVAL '4 hours'),
('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 10, 0.001, '{"prompt": "landscape painting", "hasReferenceImage": false}', '200', 2800, 'success', NOW() - INTERVAL '5 hours'),
('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 10, 0.001, '{"prompt": "portrait style", "hasReferenceImage": true}', '200', 3100, 'success', NOW() - INTERVAL '6 hours'),

-- Text Generation
('00000000-0000-0000-0000-000000000000', 'text_generation', '/api/openai/chat', 5, 0.0005, '{"prompt": "explain quantum physics"}', '200', 1200, 'success', NOW() - INTERVAL '1 hour'),
('00000000-0000-0000-0000-000000000000', 'text_generation', '/api/openai/chat', 5, 0.0005, '{"prompt": "write a poem"}', '200', 800, 'success', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000000', 'text_generation', '/api/openai/chat', 5, 0.0005, '{"prompt": "help with coding"}', '429', 500, 'failed', NOW() - INTERVAL '3 hours'),

-- Text to Speech
('00000000-0000-0000-0000-000000000000', 'text_to_speech', '/api/azure/tts', 2, 0.0002, '{"textLength": 150, "language": "en-US"}', '200', 800, 'success', NOW() - INTERVAL '30 minutes'),
('00000000-0000-0000-0000-000000000000', 'text_to_speech', '/api/azure/tts', 2, 0.0002, '{"textLength": 89, "language": "es-ES"}', '200', 600, 'success', NOW() - INTERVAL '1 hour'),

-- Speech to Text
('00000000-0000-0000-0000-000000000000', 'speech_to_text', '/api/speech/recognize', 1, 0.0001, '{"audioSize": 256000}', '200', 1200, 'success', NOW() - INTERVAL '45 minutes'),
('00000000-0000-0000-0000-000000000000', 'speech_to_text', '/api/speech/recognize', 1, 0.0001, '{"audioSize": 128000}', '400', 800, 'failed', NOW() - INTERVAL '1 hour'),

-- Translation
('00000000-0000-0000-0000-000000000000', 'translation', '/api/translate', 3, 0.0003, '{"textLength": 200, "fromLang": "en", "toLang": "es"}', '200', 900, 'success', NOW() - INTERVAL '2 hours'),
('00000000-0000-0000-0000-000000000000', 'translation', '/api/translate', 3, 0.0003, '{"textLength": 150, "fromLang": "fr", "toLang": "en"}', '200', 750, 'success', NOW() - INTERVAL '3 hours'),

-- PDF Processing
('00000000-0000-0000-0000-000000000000', 'pdf_processing', '/api/pdf/process', 5, 0.0005, '{"fileName": "document.pdf", "fileSize": 2048000}', '200', 3500, 'success', NOW() - INTERVAL '4 hours'),
('00000000-0000-0000-0000-000000000000', 'pdf_processing', '/api/pdf/process', 5, 0.0005, '{"fileName": "report.pdf", "fileSize": 5120000}', '413', 2000, 'failed', NOW() - INTERVAL '5 hours'),

-- Image to Text
('00000000-0000-0000-0000-000000000000', 'image_to_text', '/api/ocr/process', 4, 0.0004, '{"fileName": "receipt.jpg", "fileSize": 512000}', '200', 1800, 'success', NOW() - INTERVAL '6 hours'),
('00000000-0000-0000-0000-000000000000', 'image_to_text', '/api/ocr/process', 4, 0.0004, '{"fileName": "document.jpg", "fileSize": 1024000}', '200', 2200, 'success', NOW() - INTERVAL '7 hours'),

-- Calendar Events
('00000000-0000-0000-0000-000000000000', 'calendar_events', '/api/calendar/create', 1, 0.0001, '{"action": "create", "eventType": "meeting"}', '200', 300, 'success', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000000', 'calendar_events', '/api/calendar/update', 1, 0.0001, '{"action": "update", "eventType": "appointment"}', '200', 250, 'success', NOW() - INTERVAL '2 days'),
('00000000-0000-0000-0000-000000000000', 'calendar_events', '/api/calendar/delete', 1, 0.0001, '{"action": "delete", "eventType": "reminder"}', '404', 200, 'failed', NOW() - INTERVAL '3 days'),

-- Diary Entries
('00000000-0000-0000-0000-000000000000', 'diary_entries', '/api/diary/create', 1, 0.0001, '{"action": "create"}', '200', 400, 'success', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000000', 'diary_entries', '/api/diary/update', 1, 0.0001, '{"action": "update"}', '200', 350, 'success', NOW() - INTERVAL '2 days'),

-- Todo Management
('00000000-0000-0000-0000-000000000000', 'todo_management', '/api/todo/create', 1, 0.0001, '{"action": "create"}', '200', 200, 'success', NOW() - INTERVAL '12 hours'),
('00000000-0000-0000-0000-000000000000', 'todo_management', '/api/todo/update', 1, 0.0001, '{"action": "update"}', '200', 180, 'success', NOW() - INTERVAL '1 day'),
('00000000-0000-0000-0000-000000000000', 'todo_management', '/api/todo/delete', 1, 0.0001, '{"action": "delete"}', '200', 150, 'success', NOW() - INTERVAL '2 days'),

-- Expense Tracking
('00000000-0000-0000-0000-000000000000', 'expense_tracking', '/api/expenses/create', 1, 0.0001, '{"action": "create"}', '200', 300, 'success', NOW() - INTERVAL '6 hours'),
('00000000-0000-0000-0000-000000000000', 'expense_tracking', '/api/expenses/update', 1, 0.0001, '{"action": "update"}', '200', 250, 'success', NOW() - INTERVAL '1 day'),

-- Shopping List
('00000000-0000-0000-0000-000000000000', 'shopping_list', '/api/shopping/create', 1, 0.0001, '{"action": "create"}', '200', 200, 'success', NOW() - INTERVAL '3 hours'),
('00000000-0000-0000-0000-000000000000', 'shopping_list', '/api/shopping/update', 1, 0.0001, '{"action": "update"}', '200', 180, 'success', NOW() - INTERVAL '6 hours'),

-- More recent entries for live updates
('00000000-0000-0000-0000-000000000000', 'image_generation', '/api/replicate/predictions', 10, 0.001, '{"prompt": "recent test", "hasReferenceImage": false}', '200', 2400, 'success', NOW() - INTERVAL '5 minutes'),
('00000000-0000-0000-0000-000000000000', 'text_generation', '/api/openai/chat', 5, 0.0005, '{"prompt": "recent question"}', '200', 1100, 'success', NOW() - INTERVAL '2 minutes'),
('00000000-0000-0000-0000-000000000000', 'speech_to_text', '/api/speech/recognize', 1, 0.0001, '{"audioSize": 192000}', '200', 950, 'success', NOW() - INTERVAL '1 minute');

-- Update user tokens to reflect the sample usage
UPDATE user_tokens 
SET tokens_remaining = 847, tokens_used = 153, updated_at = NOW()
WHERE user_id = '00000000-0000-0000-0000-000000000000'; 