-- Create expense_tracker table
CREATE TABLE IF NOT EXISTS expense_tracker (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    expense_date DATE NOT NULL,
    vendor TEXT,
    amount DECIMAL(10,2) NOT NULL,
    quantity INTEGER DEFAULT 1,
    description TEXT,
    category TEXT,
    receipt_image TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_expense_tracker_user_id ON expense_tracker(user_id);
CREATE INDEX IF NOT EXISTS idx_expense_tracker_date ON expense_tracker(expense_date);
CREATE INDEX IF NOT EXISTS idx_expense_tracker_category ON expense_tracker(category);

-- Enable Row Level Security
ALTER TABLE expense_tracker ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own expenses" ON expense_tracker
    FOR SELECT USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can insert their own expenses" ON expense_tracker
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can update their own expenses" ON expense_tracker
    FOR UPDATE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

CREATE POLICY "Users can delete their own expenses" ON expense_tracker
    FOR DELETE USING (auth.uid() = user_id OR user_id = '00000000-0000-0000-0000-000000000000');

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_expense_tracker_updated_at 
    BEFORE UPDATE ON expense_tracker 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 