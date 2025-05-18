-- Add score_report_text column to user_onboarding table
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS score_report_text TEXT; 