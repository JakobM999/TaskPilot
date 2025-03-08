-- Add recurrence fields to tasks table
-- These ALTER statements safely add columns without affecting existing data
ALTER TABLE tasks
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS recurrence_pattern JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS parent_task_id UUID DEFAULT NULL,
ADD COLUMN IF NOT EXISTS next_instance_date TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Add index for recurring tasks - also safe operations
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_is_recurring') THEN
        CREATE INDEX idx_tasks_is_recurring ON tasks(is_recurring);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_tasks_parent_task_id') THEN
        CREATE INDEX idx_tasks_parent_task_id ON tasks(parent_task_id);
    END IF;
END $$;

-- Create function to calculate next occurrence date based on recurrence pattern
-- Creating/replacing a function doesn't affect existing data
CREATE OR REPLACE FUNCTION get_next_recurrence_date(
    input_date TIMESTAMP WITH TIME ZONE,
    pattern JSONB
) RETURNS TIMESTAMP WITH TIME ZONE AS $$
DECLARE
    freq TEXT;
    interval INTEGER;
    next_date TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Extract frequency and interval from pattern
    freq := pattern->>'frequency';
    interval := COALESCE((pattern->>'interval')::INTEGER, 1);
    
    -- Calculate next date based on frequency
    CASE freq
        WHEN 'daily' THEN
            next_date := input_date + (interval || ' days')::INTERVAL;
        WHEN 'weekly' THEN
            next_date := input_date + (interval || ' weeks')::INTERVAL;
        WHEN 'monthly' THEN
            next_date := input_date + (interval || ' months')::INTERVAL;
        WHEN 'yearly' THEN
            next_date := input_date + (interval || ' years')::INTERVAL;
        ELSE
            -- Default to no recurrence
            next_date := NULL;
    END CASE;
    
    RETURN next_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate next instance of a recurring task
-- This function only affects recurring tasks that are completed, not existing ones
CREATE OR REPLACE FUNCTION generate_recurring_task_instance()
RETURNS TRIGGER AS $$
DECLARE
    new_due_date TIMESTAMP WITH TIME ZONE;
    new_task_id UUID;
BEGIN
    -- Only for completed recurring tasks
    IF NEW.completed = TRUE AND NEW.is_recurring = TRUE AND OLD.completed = FALSE THEN
        -- Calculate next due date
        new_due_date := get_next_recurrence_date(NEW.due_date, NEW.recurrence_pattern);
        
        IF new_due_date IS NOT NULL THEN
            -- Create new task instance
            INSERT INTO tasks (
                title, description, due_date, priority, category,
                user_id, is_recurring, recurrence_pattern, parent_task_id
            ) VALUES (
                NEW.title, NEW.description, new_due_date, NEW.priority, NEW.category,
                NEW.user_id, TRUE, NEW.recurrence_pattern, 
                COALESCE(NEW.parent_task_id, NEW.id)
            )
            RETURNING id INTO new_task_id;
            
            -- Copy tags for the new task
            INSERT INTO task_tags (task_id, tag_id)
            SELECT new_task_id, tag_id
            FROM task_tags
            WHERE task_id = NEW.id;
            
            -- Update next instance date
            UPDATE tasks 
            SET next_instance_date = new_due_date
            WHERE id = NEW.id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Safely drop and create trigger for recurring tasks
-- First check if the trigger exists before attempting to drop it
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'generate_recurring_task_trigger' 
        AND tgrelid = 'tasks'::regclass
    ) THEN
        DROP TRIGGER generate_recurring_task_trigger ON tasks;
    END IF;
END $$;

-- Create the trigger - only fires when tasks are updated
CREATE TRIGGER generate_recurring_task_trigger
AFTER UPDATE ON tasks
FOR EACH ROW
EXECUTE FUNCTION generate_recurring_task_instance();