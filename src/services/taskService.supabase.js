// Supabase Task Service
import supabase from './supabaseClient';
import { addDays, startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, 
         addWeeks, startOfMonth, endOfMonth, format } from 'date-fns';

// Get tasks based on timeframe
export const getTasks = async (timeframe = 'today') => {
  try {
    // Get the current user's ID and log auth state
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Current auth state:', { user });
    
    if (!user) {
      console.error('No authenticated user found');
      throw new Error('User must be authenticated to fetch tasks');
    }

    console.log('Fetching tasks for user:', user.id);

    // Get user settings to check if auto-escalation is enabled
    const { data: settings } = await supabase
      .from('user_settings')
      .select('task_management')
      .eq('user_id', user.id)
      .single();

    const autoEscalateEnabled = settings?.task_management?.autoEscalateOverdue ?? true;

    // Simply get all tasks for the current user
    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)  // Explicitly filter by user_id
      .order('due_date', { ascending: true });

    if (taskError) {
      console.error('Error fetching tasks:', taskError);
      throw taskError;
    }

    console.log('Tasks fetched:', taskData);
    const allTasks = taskData || [];

    // Check for overdue tasks and auto-escalate if enabled
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (autoEscalateEnabled) {
      for (const task of allTasks) {
        const taskDate = new Date(task.due_date);
        if (!task.completed && taskDate < today && !task.escalated) {
          // Auto-escalate the overdue task
          await supabase
            .from('tasks')
            .update({ escalated: true })
            .eq('id', task.id);
          task.escalated = true;
        }
      }
    }

    // Format tasks for frontend
    const formattedTasks = allTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.due_date,
      priority: task.priority,
      completed: task.completed,
      escalated: task.escalated
    }));

    console.log('Formatted tasks:', formattedTasks);
    return { data: formattedTasks, error: null };
  } catch (error) {
    console.error('Error in getTasks:', error);
    return { data: null, error };
  }
};

// Helper function to check if a task was completed today
const isCompletedToday = (completedAt) => {
  if (!completedAt) return false;
  const completedDate = new Date(completedAt);
  const today = new Date();
  return (
    completedDate.getDate() === today.getDate() &&
    completedDate.getMonth() === today.getMonth() &&
    completedDate.getFullYear() === today.getFullYear()
  );
};

// Create a new task
export const createTask = async (task) => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    console.log('Creating task - auth state:', { user });
    
    if (!user) {
      console.error('No authenticated user found when creating task');
      throw new Error('User must be authenticated to create tasks');
    }

    // Format the date properly for PostgreSQL (YYYY-MM-DD)
    const formattedDate = format(new Date(task.dueDate), 'yyyy-MM-dd');

    const newTask = {
      title: task.title,
      description: task.description,
      due_date: formattedDate,
      priority: task.priority,
      completed: false,
      escalated: false,
      user_id: user.id  // Make sure user_id is set
    };

    console.log('Attempting to create task:', newTask);

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();

    if (error) {
      console.error('Error in createTask:', error);
      throw error;
    }

    console.log('Task created successfully:', data);

    // Format task for frontend
    const formattedTask = {
      id: data.id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      priority: data.priority,
      completed: data.completed,
      escalated: data.escalated
    };

    return { data: formattedTask, error: null };
  } catch (error) {
    console.error('Error creating task:', error);
    return { data: null, error };
  }
};

// Update an existing task
export const updateTask = async (task) => {
  try {
    const { id, title, description, dueDate, priority, completed, escalated } = task;

    // Format the date properly for PostgreSQL (YYYY-MM-DD)
    const formattedDate = format(new Date(dueDate), 'yyyy-MM-dd');

    const updatedTask = {
      title,
      description,
      due_date: formattedDate,
      priority,
      completed: completed || false,
      escalated: escalated || false
    };

    const { data, error } = await supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Format task for frontend
    const formattedTask = {
      id: data.id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      priority: data.priority,
      completed: data.completed,
      escalated: data.escalated
    };

    return { data: formattedTask, error: null };
  } catch (error) {
    console.error('Error updating task:', error);
    return { data: null, error };
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;

    return { error: null };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error };
  }
};

// Toggle task completion status
export const toggleTaskCompletion = async (taskId) => {
  try {
    // First get the current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the completion status and update completed_at
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({ 
        completed: !task.completed,
        completed_at: !task.completed ? new Date().toISOString() : null 
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Format task for frontend
    const formattedTask = {
      id: data.id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      priority: data.priority,
      completed: data.completed,
      escalated: data.escalated
    };

    return { data: formattedTask, error: null };
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return { data: null, error };
  }
};

// Reschedule an overdue task
export const rescheduleTask = async (taskId) => {
  try {
    // First get the current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (fetchError) throw fetchError;

    // Set due date to next business day
    const tomorrow = addDays(new Date(), 1);
    const formattedDate = tomorrow.toISOString().split('T')[0];

    // Update the task with new due date and escalate it
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({ 
        due_date: formattedDate,
        escalated: true 
      })
      .eq('id', taskId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Format task for frontend
    const formattedTask = {
      id: data.id,
      title: data.title,
      description: data.description,
      dueDate: data.due_date,
      priority: data.priority,
      completed: data.completed,
      escalated: data.escalated
    };

    return { data: formattedTask, error: null };
  } catch (error) {
    console.error('Error rescheduling task:', error);
    return { data: null, error };
  }
};

export default {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  rescheduleTask
};