-- Create the practice_questions table to store AI-generated practice questions
CREATE TABLE IF NOT EXISTS practice_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_data JSONB NOT NULL, -- Stores the full question object (text, options, answer, explanation, etc.)
  source TEXT, -- Where the question came from (e.g., 'onboarding', 'upload', 'manual')
  completed BOOLEAN DEFAULT FALSE, -- Whether the user has completed this question
  completed_at TIMESTAMP WITH TIME ZONE, -- When the user completed the question
  correct BOOLEAN, -- Whether the user answered correctly
  user_answer TEXT, -- The answer provided by the user
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create an index on user_id for faster lookups
CREATE INDEX practice_questions_user_id_idx ON practice_questions(user_id);

-- Create an index on source for filtering questions by source
CREATE INDEX practice_questions_source_idx ON practice_questions(source);

-- Enable RLS (Row Level Security)
ALTER TABLE practice_questions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for practice_questions
-- Policy to allow users to view only their own questions
CREATE POLICY "Users can view their own practice questions" ON practice_questions
  FOR SELECT USING (auth.uid() = user_id);

-- Policy to allow users to insert their own questions
CREATE POLICY "Users can insert their own practice questions" ON practice_questions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to update their own questions
CREATE POLICY "Users can update their own practice questions" ON practice_questions
  FOR UPDATE USING (auth.uid() = user_id);

-- Function to automatically update the updated_at timestamp (using the existing function)
CREATE TRIGGER update_practice_questions_updated_at
BEFORE UPDATE ON practice_questions
FOR EACH ROW
EXECUTE PROCEDURE update_updated_at_column(); -- Assuming this function was created in a previous migration 