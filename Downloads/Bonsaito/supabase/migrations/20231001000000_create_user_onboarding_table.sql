-- Create the user_onboarding table to store onboarding flow information
CREATE TABLE IF NOT EXISTS user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  age INTEGER CHECK (age > 0),
  country TEXT,
  city TEXT,
  sat_score INTEGER CHECK (sat_score >= 400 AND sat_score <= 1600),
  target_sat_score INTEGER NOT NULL CHECK (target_sat_score >= 1000 AND target_sat_score <= 1600),
  motivation TEXT,
  score_report TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS (Row Level Security)
ALTER TABLE user_onboarding ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_onboarding
-- Policy to allow users to view only their own data
CREATE POLICY "Users can view their own onboarding data" ON user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own data
CREATE POLICY "Users can insert their own onboarding data" ON user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own data
CREATE POLICY "Users can update their own onboarding data" ON user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to set updated_at on update
CREATE TRIGGER update_user_onboarding_updated_at
BEFORE UPDATE ON user_onboarding
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); 