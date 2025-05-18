-- Add subscription_plan column to user_onboarding table
ALTER TABLE user_onboarding 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT NOT NULL DEFAULT 'free'
CHECK (subscription_plan IN ('free', 'pro')); 