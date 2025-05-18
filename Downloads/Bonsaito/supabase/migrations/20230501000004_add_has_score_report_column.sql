-- Add has_score_report column to user_onboarding table
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS has_score_report BOOLEAN DEFAULT FALSE;

-- Also add score_report_url column if it doesn't exist
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS score_report_url TEXT; 