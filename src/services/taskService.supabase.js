// Supabase Task Service
import supabase from './supabaseClient';
import { addDays, startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, 
         addWeeks, startOfMonth, endOfMonth } from 'date-fns';

// Get tasks based on timeframe
export const getTasks = async (timeframe = 'today') => {
  try {
    const today = startOfToday();
    let query = supabase
      .from('tasks')
      .select('*');

    // Get overdue tasks (past tasks that are not completed)
    let overdueTasks = [];
    const { data: overdueData, error: overdueError } = await supabase
      .from('tasks')
      .select('*')
      .lt('due_date', today.toISOString())
      .eq('completed', false)
      .order('due_date', { ascending: true });

    if (overdueError) throw overdueError;
    overdueTasks = overdueData || [];

    // Filter based on timeframe
    let timeframeTasks = [];
    if (timeframe === 'today') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', startOfToday().toISOString())
        .lte('due_date', endOfToday().toISOString());

      if (error) throw error;
      timeframeTasks = data || [];
    } 
    else if (timeframe === 'tomorrow') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', startOfTomorrow().toISOString())
        .lte('due_date', endOfTomorrow().toISOString());

      if (error) throw error;
      timeframeTasks = data || [];
    } 
    else if (timeframe === 'week') {
      const nextWeek = addWeeks(today, 1);
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', today.toISOString())
        .lte('due_date', nextWeek.toISOString());

      if (error) throw error;
      timeframeTasks = data || [];
    } 
    else if (timeframe === 'month') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gte('due_date', startOfMonth(today).toISOString())
        .lte('due_date', endOfMonth(today).toISOString());

      if (error) throw error;
      timeframeTasks = data || [];
    } 
    else if (timeframe === 'upcoming') {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .gt('due_date', today.toISOString());

      if (error) throw error;
      timeframeTasks = data || [];
    } 
    else if (timeframe === 'overdue') {
      timeframeTasks = overdueTasks;
    } 
    else {
      // Get all tasks
      const { data, error } = await supabase
        .from('tasks')
        .select('*');

      if (error) throw error;
      timeframeTasks = data || [];
    }

    // For any timeframe other than 'overdue', combine overdue tasks with timeframe tasks
    if (timeframe !== 'overdue') {
      // Combine tasks and remove duplicates
      const taskMap = new Map();
      
      // Add overdue tasks to map first
      overdueTasks.forEach(task => {
        taskMap.set(task.id, {
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.due_date,
          priority: task.priority,
          completed: task.completed,
          escalated: task.escalated
        });
      });
      
      // Add timeframe tasks, overwriting any duplicate IDs
      timeframeTasks.forEach(task => {
        taskMap.set(task.id, {
          id: task.id,
          title: task.title,
          description: task.description,
          dueDate: task.due_date,
          priority: task.priority,
          completed: task.completed,
          escalated: task.escalated
        });
      });
      
      const combinedTasks = Array.from(taskMap.values());
      return { data: combinedTasks, error: null };
    }

    // Convert Supabase tasks to the format expected by the frontend
    const formattedTasks = timeframeTasks.map(task => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.due_date,
      priority: task.priority,
      completed: task.completed,
      escalated: task.escalated
    }));

    return { data: formattedTasks, error: null };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { data: null, error };
  }
};

// Create a new task
export const createTask = async (task) => {
  try {
    const newTask = {
      title: task.title,
      description: task.description,
      due_date: task.dueDate,
      priority: task.priority,
      completed: false,
      escalated: false
    };

    const { data, error } = await supabase
      .from('tasks')
      .insert([newTask])
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
    console.error('Error creating task:', error);
    return { data: null, error };
  }
};

// Update an existing task
export const updateTask = async (task) => {
  try {
    const { id, title, description, dueDate, priority, completed, escalated } = task;

    const updatedTask = {
      title,
      description,
      due_date: dueDate,
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

    // Toggle the completion status
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({ completed: !task.completed })
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