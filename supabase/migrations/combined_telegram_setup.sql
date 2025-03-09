-- TaskPilot Telegram Integration Setup Script
-- This script is non-destructive and preserves all existing data
-- Run this script in your Supabase SQL editor

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create telegram_connections table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'telegram_connections') THEN
    CREATE TABLE telegram_connections (
      user_id uuid references auth.users(id) primary key,
      chat_id bigint not null,
      connected_at timestamp with time zone default now(),
      enabled boolean default true
    );

    -- Add indexes
    CREATE INDEX IF NOT EXISTS idx_telegram_connections_chat_id ON telegram_connections(chat_id);
    CREATE INDEX IF NOT EXISTS idx_telegram_connections_user_id ON telegram_connections(user_id);

    -- Enable RLS
    ALTER TABLE telegram_connections ENABLE ROW LEVEL SECURITY;

    -- Add RLS policies
    CREATE POLICY "Users can view their own telegram connection"
      ON telegram_connections FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can manage their own telegram connection"
      ON telegram_connections FOR ALL
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Safely modify user_settings table if it exists
DO $$
BEGIN
  -- First ensure user_settings table exists without modifying existing data
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
    CREATE TABLE user_settings (
      id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
      user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
      appearance jsonb NOT NULL DEFAULT '{"darkMode": false, "language": "en"}'::jsonb,
      notifications jsonb NOT NULL DEFAULT '{"emailNotifications": true, "desktopNotifications": true, "reminderTime": 15}'::jsonb,
      task_management jsonb NOT NULL DEFAULT '{"workingHoursStart": "09:00", "workingHoursEnd": "17:00", "defaultTaskDuration": 30}'::jsonb,
      ai_assistant jsonb NOT NULL DEFAULT '{"aiEnabled": true, "aiSuggestionFrequency": "medium"}'::jsonb,
      created_at timestamp with time zone DEFAULT now(),
      updated_at timestamp with time zone DEFAULT now()
    );

    -- Enable RLS on user_settings if creating new
    ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

    -- Add basic RLS policies if creating new
    CREATE POLICY "Users can view their own settings"
      ON user_settings FOR SELECT
      USING (auth.uid() = user_id);

    CREATE POLICY "Users can update their own settings"
      ON user_settings FOR ALL
      USING (auth.uid() = user_id);
  END IF;

  -- Add telegram_settings column if it doesn't exist
  IF NOT EXISTS (
    SELECT FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'user_settings' 
    AND column_name = 'telegram_settings'
  ) THEN
    -- Add column with default value
    ALTER TABLE user_settings 
    ADD COLUMN telegram_settings jsonb DEFAULT '{
      "enabled": false,
      "dailySummary": false,
      "dailySummaryTime": "09:00",
      "weeklySummary": false,
      "weeklySummaryDay": 1,
      "weeklySummaryTime": "09:00",
      "monthlySummary": false,
      "monthlySummaryDay": 1,
      "monthlySummaryTime": "09:00"
    }'::jsonb;

    -- Make it NOT NULL after adding with a default value
    ALTER TABLE user_settings 
    ALTER COLUMN telegram_settings SET NOT NULL;
  END IF;

  -- Update existing rows that have NULL telegram_settings without affecting other data
  UPDATE user_settings 
  SET telegram_settings = '{
    "enabled": false,
    "dailySummary": false,
    "dailySummaryTime": "09:00",
    "weeklySummary": false,
    "weeklySummaryDay": 1,
    "weeklySummaryTime": "09:00",
    "monthlySummary": false,
    "monthlySummaryDay": 1,
    "monthlySummaryTime": "09:00"
  }'::jsonb
  WHERE telegram_settings IS NULL;

END $$;

-- Create or update the updated_at trigger without affecting existing data
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Safely ensure trigger exists on user_settings
DO $$
BEGIN
  -- Drop the trigger only if it exists and recreate it
  IF EXISTS (
    SELECT 1 FROM pg_trigger 
    WHERE tgname = 'update_user_settings_updated_at'
  ) THEN
    DROP TRIGGER update_user_settings_updated_at ON user_settings;
  END IF;
  
  CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
END $$;

-- Verification queries (commented out - run manually to check setup):
-- SELECT COUNT(*) FROM tasks; -- Should show same count as before
-- SELECT COUNT(*) FROM telegram_connections;
-- SELECT user_id, telegram_settings FROM user_settings WHERE telegram_settings->>'enabled' = 'true';
-- SELECT COUNT(*) FROM user_settings WHERE telegram_settings IS NOT NULL;
