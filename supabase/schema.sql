-- TaskPilot Database Schema for Supabase
-- VERSION 1.2 - Updated to fix task creation and filtering issues

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop all existing policies first
DO $$ 
BEGIN
    -- Drop all policies
    DROP POLICY IF EXISTS tasks_select_policy ON tasks;
    DROP POLICY IF EXISTS tasks_insert_policy ON tasks;
    DROP POLICY IF EXISTS tasks_update_policy ON tasks;
    DROP POLICY IF EXISTS tasks_delete_policy ON tasks;
    
    DROP POLICY IF EXISTS user_settings_select_policy ON user_settings;
    DROP POLICY IF EXISTS user_settings_insert_policy ON user_settings;
    DROP POLICY IF EXISTS user_settings_update_policy ON user_settings;
    DROP POLICY IF EXISTS user_settings_delete_policy ON user_settings;
    
    DROP POLICY IF EXISTS tags_select_policy ON tags;
    DROP POLICY IF EXISTS tags_insert_policy ON tags;
    DROP POLICY IF EXISTS tags_update_policy ON tags;
    DROP POLICY IF EXISTS tags_delete_policy ON tags;
    
    DROP POLICY IF EXISTS task_tags_select_policy ON task_tags;
    DROP POLICY IF EXISTS task_tags_insert_policy ON task_tags;
    DROP POLICY IF EXISTS task_tags_update_policy ON task_tags;
    DROP POLICY IF EXISTS task_tags_delete_policy ON task_tags;
    
    DROP POLICY IF EXISTS list_items_select_policy ON list_items;
    DROP POLICY IF EXISTS list_items_insert_policy ON list_items;
    DROP POLICY IF EXISTS list_items_update_policy ON list_items;
    DROP POLICY IF EXISTS list_items_delete_policy ON list_items;
    
    DROP POLICY IF EXISTS calendar_events_select_policy ON calendar_events;
    DROP POLICY IF EXISTS calendar_events_insert_policy ON calendar_events;
    DROP POLICY IF EXISTS calendar_events_update_policy ON calendar_events;
    DROP POLICY IF EXISTS calendar_events_delete_policy ON calendar_events;
END $$;

-- Create tables if they don't exist
DO $$ 
BEGIN
    -- Create tasks table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tasks') THEN
        CREATE TABLE tasks (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            title TEXT NOT NULL,
            description TEXT,
            due_date TIMESTAMP WITH TIME ZONE NOT NULL,
            priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
            category TEXT NOT NULL DEFAULT 'work' CHECK (category IN ('work', 'private')),
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            completed_at TIMESTAMP WITH TIME ZONE,
            escalated BOOLEAN NOT NULL DEFAULT FALSE,
            pinned BOOLEAN NOT NULL DEFAULT FALSE,
            has_list BOOLEAN NOT NULL DEFAULT FALSE,
            user_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Create user_settings table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'user_settings') THEN
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
    END IF;

    -- Create calendar_events table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'calendar_events') THEN
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
    END IF;

    -- Create tags table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'tags') THEN
        CREATE TABLE tags (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            name TEXT NOT NULL,
            color TEXT DEFAULT '#1976D2',
            user_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(name, user_id)
        );
    END IF;

    -- Create task_tags junction table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'task_tags') THEN
        CREATE TABLE task_tags (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            task_id UUID NOT NULL,
            tag_id UUID NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            UNIQUE(task_id, tag_id)
        );
    END IF;

    -- Create list_items table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'list_items') THEN
        CREATE TABLE list_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            task_id UUID NOT NULL,
            text TEXT NOT NULL,
            completed BOOLEAN NOT NULL DEFAULT FALSE,
            position INTEGER NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;

    -- Add foreign key constraints if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_tags_task_id_fkey'
    ) THEN
        ALTER TABLE task_tags 
        ADD CONSTRAINT task_tags_task_id_fkey 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'task_tags_tag_id_fkey'
    ) THEN
        ALTER TABLE task_tags 
        ADD CONSTRAINT task_tags_tag_id_fkey 
        FOREIGN KEY (tag_id) 
        REFERENCES tags(id) 
        ON DELETE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'list_items_task_id_fkey'
    ) THEN
        ALTER TABLE list_items 
        ADD CONSTRAINT list_items_task_id_fkey 
        FOREIGN KEY (task_id) 
        REFERENCES tasks(id) 
        ON DELETE CASCADE;
    END IF;
END $$;

-- INDEXES
-- =======
-- Create indexes if they don't exist
DO $$
BEGIN
    -- Tasks indexes
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_user_id') THEN
        CREATE INDEX idx_tasks_user_id ON tasks(user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_due_date') THEN
        CREATE INDEX idx_tasks_due_date ON tasks(due_date);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_completed') THEN
        CREATE INDEX idx_tasks_completed ON tasks(completed);
    END IF;
    
    -- Add index for pinned tasks if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_pinned') THEN
        CREATE INDEX idx_tasks_pinned ON tasks(pinned);
    END IF;

    -- User settings index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_settings_user_id') THEN
        CREATE INDEX idx_user_settings_user_id ON user_settings(user_id);
    END IF;

    -- Calendar events index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_calendar_events_user_id_start_time') THEN
        CREATE INDEX idx_calendar_events_user_id_start_time ON calendar_events(user_id, start_time);
    END IF;

    -- Tags index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tags_user_id') THEN
        CREATE INDEX idx_tags_user_id ON tags(user_id);
    END IF;

    -- Task tags index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_task_tags_task_id') THEN
        CREATE INDEX idx_task_tags_task_id ON task_tags(task_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_task_tags_tag_id') THEN
        CREATE INDEX idx_task_tags_tag_id ON task_tags(tag_id);
    END IF;

    -- List items index
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_list_items_task_id') THEN
        CREATE INDEX idx_list_items_task_id ON list_items(task_id);
    END IF;
END $$;

-- FUNCTIONS
-- =========

-- Simple ping function used for connectivity testing
CREATE OR REPLACE FUNCTION ping()
RETURNS TEXT AS $$
BEGIN
  RETURN 'pong';
END;
$$ LANGUAGE plpgsql;

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

-- Drop existing triggers first
DROP TRIGGER IF EXISTS update_tasks_timestamp ON tasks;
DROP TRIGGER IF EXISTS update_user_settings_timestamp ON user_settings;
DROP TRIGGER IF EXISTS update_calendar_events_timestamp ON calendar_events;

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

DROP TRIGGER IF EXISTS update_list_items_timestamp ON list_items;
CREATE TRIGGER update_list_items_timestamp
    BEFORE UPDATE ON list_items
    FOR EACH ROW
    EXECUTE FUNCTION update_timestamp();

-- ROW LEVEL SECURITY
-- =================

-- Enable Row Level Security for all tables
ALTER TABLE IF EXISTS tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS list_items ENABLE ROW LEVEL SECURITY;

-- Create security policies for all tables
DO $$ 
BEGIN
    -- Tasks policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_select_policy') THEN
        CREATE POLICY tasks_select_policy ON tasks FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_insert_policy') THEN
        CREATE POLICY tasks_insert_policy ON tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_update_policy') THEN
        CREATE POLICY tasks_update_policy ON tasks FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tasks' AND policyname = 'tasks_delete_policy') THEN
        CREATE POLICY tasks_delete_policy ON tasks FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- User settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'user_settings_select_policy') THEN
        CREATE POLICY user_settings_select_policy ON user_settings FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'user_settings_insert_policy') THEN
        CREATE POLICY user_settings_insert_policy ON user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'user_settings_update_policy') THEN
        CREATE POLICY user_settings_update_policy ON user_settings FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'user_settings_delete_policy') THEN
        CREATE POLICY user_settings_delete_policy ON user_settings FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Calendar events policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'calendar_events_select_policy') THEN
        CREATE POLICY calendar_events_select_policy ON calendar_events FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'calendar_events_insert_policy') THEN
        CREATE POLICY calendar_events_insert_policy ON calendar_events FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'calendar_events_update_policy') THEN
        CREATE POLICY calendar_events_update_policy ON calendar_events FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'calendar_events' AND policyname = 'calendar_events_delete_policy') THEN
        CREATE POLICY calendar_events_delete_policy ON calendar_events FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Tags policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'tags_select_policy') THEN
        CREATE POLICY tags_select_policy ON tags FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'tags_insert_policy') THEN
        CREATE POLICY tags_insert_policy ON tags FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'tags_update_policy') THEN
        CREATE POLICY tags_update_policy ON tags FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'tags' AND policyname = 'tags_delete_policy') THEN
        CREATE POLICY tags_delete_policy ON tags FOR DELETE USING (auth.uid() = user_id);
    END IF;

    -- Task tags policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_tags' AND policyname = 'task_tags_select_policy') THEN
        CREATE POLICY task_tags_select_policy ON task_tags 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = task_tags.task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_tags' AND policyname = 'task_tags_insert_policy') THEN
        CREATE POLICY task_tags_insert_policy ON task_tags 
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_tags' AND policyname = 'task_tags_update_policy') THEN
        CREATE POLICY task_tags_update_policy ON task_tags 
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = task_tags.task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'task_tags' AND policyname = 'task_tags_delete_policy') THEN
        CREATE POLICY task_tags_delete_policy ON task_tags 
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = task_tags.task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;

    -- List items policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'list_items' AND policyname = 'list_items_select_policy') THEN
        CREATE POLICY list_items_select_policy ON list_items 
        FOR SELECT USING (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = list_items.task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'list_items' AND policyname = 'list_items_insert_policy') THEN
        CREATE POLICY list_items_insert_policy ON list_items 
        FOR INSERT WITH CHECK (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'list_items' AND policyname = 'list_items_update_policy') THEN
        CREATE POLICY list_items_update_policy ON list_items 
        FOR UPDATE USING (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = list_items.task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'list_items' AND policyname = 'list_items_delete_policy') THEN
        CREATE POLICY list_items_delete_policy ON list_items 
        FOR DELETE USING (
            EXISTS (
                SELECT 1 FROM tasks 
                WHERE tasks.id = list_items.task_id 
                AND tasks.user_id = auth.uid()
            )
        );
    END IF;
END $$;