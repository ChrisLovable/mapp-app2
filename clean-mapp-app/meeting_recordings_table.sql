-- Create meeting_recordings table in Supabase
-- This table stores meeting recordings with user information and file references

CREATE TABLE meeting_recordings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user_name TEXT NOT NULL,
    meeting_name TEXT NOT NULL,
    meeting_date DATE NOT NULL,
    meeting_agenda TEXT, -- Agenda or topics for the meeting
    meeting_transcript TEXT, -- Full transcript of the meeting
    mp3_recording_file TEXT, -- URL or file path to the recording
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX idx_meeting_recordings_user_id ON meeting_recordings(user_id);
CREATE INDEX idx_meeting_recordings_meeting_date ON meeting_recordings(meeting_date);
CREATE INDEX idx_meeting_recordings_created_at ON meeting_recordings(created_at);

-- Enable Row Level Security (RLS)
ALTER TABLE meeting_recordings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own recordings
CREATE POLICY "Users can view own recordings" ON meeting_recordings
    FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own recordings
CREATE POLICY "Users can insert own recordings" ON meeting_recordings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own recordings
CREATE POLICY "Users can update own recordings" ON meeting_recordings
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own recordings
CREATE POLICY "Users can delete own recordings" ON meeting_recordings
    FOR DELETE USING (auth.uid() = user_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_meeting_recordings_updated_at 
    BEFORE UPDATE ON meeting_recordings 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE meeting_recordings IS 'Stores meeting recordings with user information and file references';
COMMENT ON COLUMN meeting_recordings.id IS 'Unique identifier for each recording';
COMMENT ON COLUMN meeting_recordings.user_id IS 'Reference to the user who created the recording';
COMMENT ON COLUMN meeting_recordings.user_name IS 'Display name of the user';
COMMENT ON COLUMN meeting_recordings.meeting_name IS 'Title/name of the meeting';
COMMENT ON COLUMN meeting_recordings.meeting_date IS 'Date when the meeting took place';
COMMENT ON COLUMN meeting_recordings.meeting_agenda IS 'Agenda or topics to be discussed in the meeting';
COMMENT ON COLUMN meeting_recordings.meeting_transcript IS 'Full transcript of the meeting conversation';
COMMENT ON COLUMN meeting_recordings.mp3_recording_file IS 'URL or file path to the audio recording file';
COMMENT ON COLUMN meeting_recordings.created_at IS 'Timestamp when the record was created';
COMMENT ON COLUMN meeting_recordings.updated_at IS 'Timestamp when the record was last updated'; 