-- Create a table to store user progress data
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  correct_answers_count INTEGER NOT NULL DEFAULT 0,
  completed_tests INTEGER NOT NULL DEFAULT 0,
  last_test_date TIMESTAMP WITH TIME ZONE,
  tree_sync_timestamp BIGINT NOT NULL DEFAULT extract(epoch from now()) * 1000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create unique index on user_id to ensure one progress record per user
CREATE UNIQUE INDEX IF NOT EXISTS user_progress_user_id_idx ON user_progress(user_id);

-- Add RLS policies for user_progress table
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Policy for users to see only their own progress
CREATE POLICY "Users can view their own progress" 
  ON user_progress 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Policy for users to update only their own progress
CREATE POLICY "Users can update their own progress" 
  ON user_progress 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Policy for users to insert their own progress
CREATE POLICY "Users can insert their own progress" 
  ON user_progress 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_progress_updated_at
  BEFORE UPDATE ON user_progress
  FOR EACH ROW
  EXECUTE PROCEDURE update_updated_at_column(); 