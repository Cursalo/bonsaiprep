-- Comprehensive fix for user_onboarding table to ensure all columns exist
-- This ensures the table has all columns that the application is trying to use

-- Add score_report_text column if it doesn't exist
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS score_report_text TEXT;

-- Add score_report_url column if it doesn't exist
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS score_report_url TEXT;

-- Add has_score_report column if it doesn't exist
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS has_score_report BOOLEAN DEFAULT FALSE;

-- Make sure the subscription_plan column exists
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free'
CHECK (subscription_plan IN ('free', 'pro'));

-- Add any other columns that might be used in the application
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;

ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMP WITH TIME ZONE;

-- Create index on user_id for faster lookups
CREATE INDEX IF NOT EXISTS user_onboarding_user_id_idx ON user_onboarding(user_id); 