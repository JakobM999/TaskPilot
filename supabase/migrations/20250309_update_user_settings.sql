-- Add telegram_settings column to user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS telegram_settings JSONB NOT NULL 
DEFAULT '{"enabled": false, "dailySummary": false, "weeklySummary": false, "monthlySummary": false}'::jsonb;

-- Update existing user_settings rows if any
UPDATE user_settings 
SET telegram_settings = '{"enabled": false, "dailySummary": false, "weeklySummary": false, "monthlySummary": false}'::jsonb
WHERE telegram_settings IS NULL;
