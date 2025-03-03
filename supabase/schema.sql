-- TaskPilot Database Schema for Supabase
-- This SQL script sets up the complete database schema including tables and security policies

-- TABLES
-- =======

-- Create a table for tasks
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  due_date DATE NOT NULL,
  priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  escalated BOOLEAN NOT NULL DEFAULT FALSE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for user settings
CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  appearance JSONB NOT NULL DEFAULT '{"darkMode": false, "language": "en"}'::jsonb,
  notifications JSONB NOT NULL DEFAULT '{"emailNotifications": true, "desktopNotifications": true, "reminderTime": 15}'::jsonb,
  task_management JSONB NOT NULL DEFAULT '{"workingHoursStart": "09:00", "workingHoursEnd": "17:00", "defaultTaskDuration": 30, "autoEscalateOverdue": true}'::jsonb,
  ai_assistant JSONB NOT NULL DEFAULT '{"aiEnabled": true, "aiSuggestionFrequency": "medium", "focusTimeLength": 25, "breakTimeLength": 5}'::jsonb,
  calendar JSONB NOT NULL DEFAULT '{"calendarSync": true, "blockCalendarEvents": true}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create a table for calendar events (optional for future implementation)
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  location TEXT,
  participants JSONB,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- INDEXES
-- =======
-- Create indexes for improved performance on common queries

-- Index on tasks by user_id for faster retrieval of a user's tasks
CREATE INDEX idx_tasks_user_id ON tasks(user_id);

-- Index on tasks by due_date for faster date-based queries
CREATE INDEX idx_tasks_due_date ON tasks(due_date);

-- Index on tasks by completed status
CREATE INDEX idx_tasks_completed ON tasks(completed);

-- Index on user_settings by user_id
CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);

-- Index on calendar_events by user_id and start_time
CREATE INDEX idx_calendar_events_user_id_start_time ON calendar_events(user_id, start_time);

-- FUNCTIONS
-- =========

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- TRIGGERS
-- ========

-- Create triggers to automatically update the updated_at timestamp
CREATE TRIGGER update_tasks_timestamp
BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_user_settings_timestamp
BEFORE UPDATE ON user_settings
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_calendar_events_timestamp
BEFORE UPDATE ON calendar_events
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ROW LEVEL SECURITY
-- =================

-- Enable Row Level Security for all tables
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

-- Create security policies for tasks
CREATE POLICY tasks_select_policy ON tasks 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY tasks_insert_policy ON tasks 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY tasks_update_policy ON tasks 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY tasks_delete_policy ON tasks 
  FOR DELETE USING (auth.uid() = user_id);

-- Create security policies for user_settings
CREATE POLICY user_settings_select_policy ON user_settings 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY user_settings_insert_policy ON user_settings 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY user_settings_update_policy ON user_settings 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY user_settings_delete_policy ON user_settings 
  FOR DELETE USING (auth.uid() = user_id);

-- Create security policies for calendar_events
CREATE POLICY calendar_events_select_policy ON calendar_events 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY calendar_events_insert_policy ON calendar_events 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY calendar_events_update_policy ON calendar_events 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY calendar_events_delete_policy ON calendar_events 
  FOR DELETE USING (auth.uid() = user_id);