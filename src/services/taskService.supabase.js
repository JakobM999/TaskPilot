// Supabase Task Service
import supabase from './supabaseClient';
import { addDays, startOfToday, endOfToday, startOfTomorrow, endOfTomorrow, 
         addWeeks, startOfMonth, endOfMonth, format } from 'date-fns';

// Get tasks based on timeframe
export const getTasks = async (timeframe = 'today') => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('No authenticated user found when getting tasks');
      throw new Error('User must be authenticated to get tasks');
    }

    // Get current date in Danish local time
    const now = new Date();
    // Set to start of day in local time
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // Get timezone offset in minutes
    const offset = today.getTimezoneOffset();
    // Convert to UTC for Postgres comparison (subtract offset because getTimezoneOffset returns reverse value)
    const utcDate = new Date(today.getTime() - (offset * 60 * 1000));
    const todayStr = utcDate.toISOString().split('T')[0];

    console.log('Date debugging:', {
      localNow: now.toLocaleString('da-DK'),
      localToday: today.toLocaleString('da-DK'),
      offset,
      utcDate: utcDate.toISOString(),
      todayStr,
      timeframe
    });

    // First, get all overdue tasks
    const { data: overdueTasks, error: overdueError } = await supabase
      .from('tasks')
      .select(`
        *,
        tags:task_tags(
          id,
          tag:tags(*)
        ),
        list_items(*)
      `)
      .eq('user_id', user.id)
      .lt('due_date::date', todayStr)
      .eq('completed', false)
      .order('due_date', { ascending: true });

    if (overdueError) {
      console.error('Error fetching overdue tasks:', overdueError);
      throw overdueError;
    }

    // Build the base query for timeframe-specific tasks
    let query = supabase
      .from('tasks')
      .select(`
        *,
        tags:task_tags(
          id,
          tag:tags(*)
        ),
        list_items(*)
      `)
      .eq('user_id', user.id);

    // Apply timeframe filters
    switch (timeframe) {
      case 'today':
        query = query.eq('due_date::date', todayStr);
        break;
      
      case 'tomorrow':
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowUTC = new Date(tomorrow.getTime() - (offset * 60 * 1000));
        const tomorrowStr = tomorrowUTC.toISOString().split('T')[0];
        query = query.eq('due_date::date', tomorrowStr);
        break;
      
      case 'week':
        const weekEnd = new Date(today);
        weekEnd.setDate(weekEnd.getDate() + 7);
        const weekEndUTC = new Date(weekEnd.getTime() - (offset * 60 * 1000));
        const weekEndStr = weekEndUTC.toISOString().split('T')[0];
        query = query
          .gte('due_date::date', todayStr)
          .lte('due_date::date', weekEndStr)
          .order('due_date', { ascending: true }); // Sort by date first
        break;
      
      case 'month':
        const monthEnd = new Date(today);
        monthEnd.setDate(monthEnd.getDate() + 30);
        const monthEndUTC = new Date(monthEnd.getTime() - (offset * 60 * 1000));
        const monthEndStr = monthEndUTC.toISOString().split('T')[0];
        query = query
          .gte('due_date::date', todayStr)
          .lte('due_date::date', monthEndStr)
          .order('due_date', { ascending: true }); // Sort by date first
        break;
      
      case 'upcoming':
        query = query
          .gte('due_date::date', todayStr)
          .order('due_date', { ascending: true }); // Sort by date first
        break;
      
      case 'overdue':
        // For overdue view, return only overdue tasks
        return { 
          data: formatTasks(overdueTasks), 
          error: null 
        };
      
      default:
        query = query.eq('due_date::date', todayStr);
    }

    // Get the timeframe-specific tasks
    const { data: timeframeTasks, error: timeframeError } = await query
      .order('due_date', { ascending: true });

    if (timeframeError) {
      console.error('Error fetching timeframe tasks:', timeframeError);
      throw timeframeError;
    }

    // Combine overdue tasks with timeframe tasks, ensuring no duplicates
    const allTaskIds = new Set();
    const combinedTasks = [];

    // Add overdue tasks first
    overdueTasks?.forEach(task => {
      if (!allTaskIds.has(task.id)) {
        allTaskIds.add(task.id);
        combinedTasks.push(task);
      }
    });

    // Then add timeframe tasks
    timeframeTasks?.forEach(task => {
      if (!allTaskIds.has(task.id)) {
        allTaskIds.add(task.id);
        combinedTasks.push(task);
      }
    });

    // Format tasks for frontend
    return { 
      data: formatTasks(combinedTasks), 
      error: null 
    };
  } catch (error) {
    console.error('Error in getTasks:', error);
    return { data: null, error };
  }
};

// Helper function to format tasks for frontend
const formatTasks = (tasks) => {
  return (tasks || []).map(task => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.due_date,
    priority: task.priority,
    category: task.category || 'work',
    completed: task.completed,
    escalated: task.escalated,
    pinned: task.pinned || false,
    hasListItems: task.has_list,
    tags: task.tags ? task.tags.map(t => ({
      id: t.tag.id,
      name: t.tag.name,
      color: t.tag.color
    })).filter(Boolean) : [],
    listItems: task.list_items ? task.list_items
      .sort((a, b) => a.position - b.position)
      .map(item => ({
        id: item.id,
        text: item.text,
        completed: item.completed,
        position: item.position
      })) : []
  }));
};

// Get user tags
export const getUserTags = async () => {
  try {
    // Get the current user's ID 
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to fetch tags');
    }

    // Get all tags for the user
    const { data: tags, error } = await supabase
      .from('tags')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;

    return { data: tags || [], error: null };
  } catch (error) {
    console.error('Error fetching user tags:', error);
    return { data: [], error };
  }
};

// Create a new tag
export const createTag = async (tagName, color = '#1976D2') => {
  try {
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to create tags');
    }

    // Create the new tag
    const { data, error } = await supabase
      .from('tags')
      .insert([{
        name: tagName,
        color: color,
        user_id: user.id
      }])
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error creating tag:', error);
    return { data: null, error };
  }
};

// Helper function to check if a task was completed today
// eslint-disable-next-line no-unused-vars
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
    
    if (!user) {
      throw new Error('User must be authenticated to create tasks');
    }

    // The due_date is already in YYYY-MM-DD format from the form
    const newTask = {
      title: task.title.trim(),
      description: task.description?.trim() || '',
      due_date: task.due_date,
      priority: task.priority || 'medium',
      category: task.category || 'work',
      completed: false,
      escalated: false,
      user_id: user.id
    };

    // Insert the task
    const { data: createdTask, error: taskError } = await supabase
      .from('tasks')
      .insert([newTask])
      .select()
      .single();

    if (taskError) throw taskError;

    // Handle tags if present
    let tags = [];
    if (task.tags?.length > 0) {
      const taskTagInserts = task.tags.map(tag => ({
        task_id: createdTask.id,
        tag_id: typeof tag === 'object' ? tag.id : tag
      }));

      const { data: taskTags, error: tagError } = await supabase
        .from('task_tags')
        .insert(taskTagInserts)
        .select(`
          id,
          tag:tags(*)
        `);

      if (!tagError && taskTags) {
        tags = taskTags.map(tt => ({
          id: tt.tag.id,
          name: tt.tag.name,
          color: tt.tag.color
        }));
      }
    }

    // Return formatted task for frontend
    return {
      data: {
        id: createdTask.id,
        title: createdTask.title,
        description: createdTask.description,
        dueDate: createdTask.due_date,
        priority: createdTask.priority,
        category: createdTask.category,
        completed: createdTask.completed,
        escalated: createdTask.escalated,
        tags: tags
      },
      error: null
    };
  } catch (error) {
    console.error('Error in createTask:', error);
    return { data: null, error };
  }
};

// Update an existing task
export const updateTask = async (task) => {
  try {
    const { id, title, description, due_date, priority, category, completed, escalated, pinned, tags, listItems } = task;

    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.error('Authentication error: No user found');
      throw new Error('User must be authenticated to update tasks');
    }

    // Update the task
    const updatedTask = {
      title: title.trim(),
      description: description?.trim() || '',
      due_date: due_date,
      priority: priority || 'medium',
      category: category || 'work',
      completed: completed || false,
      escalated: escalated || false,
      pinned: pinned || false,
      has_list: Boolean(listItems?.length),
      updated_at: new Date().toISOString(),
      user_id: user.id  // Ensure we're updating the correct user's task
    };

    console.log('Sending update to database:', updatedTask);

    const { data: taskData, error: taskError } = await supabase
      .from('tasks')
      .update(updatedTask)
      .eq('id', id)
      .eq('user_id', user.id)  // Additional safety check
      .select()
      .single();

    if (taskError) {
      console.error('Database error updating task:', taskError);
      throw taskError;
    }

    console.log('Task update successful:', taskData);

    // Handle tags if present
    let updatedTags = [];
    if (tags && tags.length > 0) {
      // Remove all existing tags for this task
      const { error: tagDeleteError } = await supabase
        .from('task_tags')
        .delete()
        .eq('task_id', id);

      if (tagDeleteError) {
        console.error('Error deleting existing tags:', tagDeleteError);
        throw tagDeleteError;
      }

      // Add the new tags
      const taskTagInserts = tags.map(tag => ({
        task_id: id,
        tag_id: typeof tag === 'object' ? tag.id : tag
      }));

      const { data: insertedTags, error: tagInsertError } = await supabase
        .from('task_tags')
        .insert(taskTagInserts)
        .select(`
          id,
          tag:tags(*)
        `);

      if (tagInsertError) {
        console.error('Error inserting new tags:', tagInsertError);
        throw tagInsertError;
      }

      updatedTags = insertedTags.map(tt => ({
        id: tt.tag.id,
        name: tt.tag.name,
        color: tt.tag.color
      }));
    }

    // Handle list items if present
    let updatedListItems = [];
    if (listItems) {
      // Delete all existing list items
      const { error: deleteListError } = await supabase
        .from('list_items')
        .delete()
        .eq('task_id', id);

      if (deleteListError) {
        console.error('Error deleting existing list items:', deleteListError);
        throw deleteListError;
      }

      if (listItems.length > 0) {
        // Add the new list items
        const listItemInserts = listItems.map((item, index) => ({
          task_id: id,
          text: item.text,
          completed: item.completed || false,
          position: item.position !== undefined ? item.position : index
        }));

        const { data: insertedItems, error: listItemError } = await supabase
          .from('list_items')
          .insert(listItemInserts)
          .select();

        if (listItemError) {
          console.error('Error inserting list items:', listItemError);
          throw listItemError;
        }

        updatedListItems = insertedItems.map(item => ({
          id: item.id,
          text: item.text,
          completed: item.completed,
          position: item.position
        }));
      }
    }

    // Format the response
    const formattedTask = {
      id: taskData.id,
      title: taskData.title,
      description: taskData.description,
      dueDate: taskData.due_date,
      priority: taskData.priority,
      category: taskData.category,
      completed: taskData.completed,
      escalated: taskData.escalated,
      pinned: taskData.pinned,
      hasListItems: taskData.has_list,
      tags: updatedTags,
      listItems: updatedListItems
    };

    return { data: formattedTask, error: null };
  } catch (error) {
    console.error('Error in updateTask:', error);
    return { data: null, error };
  }
};

// Toggle task pin status
export const toggleTaskPin = async (taskId) => {
  try {
    // Get the current user's ID 
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // First get the current state of the task
    const { data: taskData, error: fetchError } = await supabase
      .from('tasks')
      .select('pinned')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching task pin status:', fetchError);
      return { data: null, error: fetchError };
    }

    // Toggle the pin status
    const newPinnedStatus = !taskData.pinned;

    // Update the task with the toggled pin status
    // eslint-disable-next-line no-unused-vars
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        pinned: newPinnedStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', user.id);

    if (error) {
      console.error('Error toggling task pin status:', error);
      return { data: null, error };
    }

    return { data: { id: taskId, pinned: newPinnedStatus }, error: null };
  } catch (error) {
    console.error('Error in toggleTaskPin:', error);
    return { data: null, error };
  }
};

// Toggle task escalation status
export const toggleTaskEscalation = async (taskId) => {
  try {
    // Get the current user's ID 
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { data: null, error: new Error('User not authenticated') };
    }

    // First get the current state of the task
    const { data: taskData, error: fetchError } = await supabase
      .from('tasks')
      .select('escalated')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) {
      console.error('Error fetching task escalation status:', fetchError);
      return { data: null, error: fetchError };
    }

    // Toggle the escalation status
    const newEscalatedStatus = !taskData.escalated;

    // Update the task with the toggled escalation status
    const { data, error } = await supabase
      .from('tasks')
      .update({ 
        escalated: newEscalatedStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', user.id)
      .select();

    if (error) {
      console.error('Error toggling task escalation status:', error);
      return { data: null, error };
    }

    return { data: { id: taskId, escalated: newEscalatedStatus }, error: null };
  } catch (error) {
    console.error('Error in toggleTaskEscalation:', error);
    return { data: null, error };
  }
};

// Update a list item's completion status
export const toggleListItemCompletion = async (taskId, itemId) => {
  try {
    // First get the current list item
    const { data: item, error: fetchError } = await supabase
      .from('list_items')
      .select('*')
      .eq('id', itemId)
      .single();

    if (fetchError) throw fetchError;

    // Toggle the completion status
    const { data, error: updateError } = await supabase
      .from('list_items')
      .update({ completed: !item.completed })
      .eq('id', itemId)
      .select()
      .single();

    if (updateError) throw updateError;

    return { data, error: null };
  } catch (error) {
    console.error('Error toggling list item completion:', error);
    return { data: null, error };
  }
};

// Add a new list item to a task
export const addListItem = async (taskId, text) => {
  try {
    // First, check if the task exists and belongs to the current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      throw new Error('User must be authenticated to add list items');
    }

    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .select('id, has_list')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (taskError) {
      console.error('Error fetching task for list item addition:', taskError);
      throw taskError;
    }

    // Get current position count to add as last item
    const { data: existingItems, error: countError } = await supabase
      .from('list_items')
      .select('position')
      .eq('task_id', taskId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existingItems && existingItems.length > 0 ? 
      existingItems[0].position + 1 : 0;

    // Add the list item
    const { data, error } = await supabase
      .from('list_items')
      .insert([{
        task_id: taskId,
        text,
        completed: false,
        position: nextPosition
      }])
      .select()
      .single();

    if (error) {
      console.error('Error adding list item:', error);
      throw error;
    }

    // If the task didn't have list items before, update the has_list flag
    if (!task.has_list) {
      await supabase
        .from('tasks')
        .update({ has_list: true })
        .eq('id', taskId);
    }

    return { data, error: null };
  } catch (error) {
    console.error('Error in addListItem:', error);
    return { data: null, error };
  }
};

// Delete a list item
export const deleteListItem = async (itemId) => {
  try {
    // First check if the item exists
    const { data: item, error: fetchError } = await supabase
      .from('list_items')
      .select('task_id')
      .eq('id', itemId)
      .single();

    if (fetchError) {
      console.error('Error fetching list item:', fetchError);
      throw fetchError;
    }

    // Delete the list item
    const { error } = await supabase
      .from('list_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    // Check if this was the last list item for the task
    // eslint-disable-next-line no-unused-vars
    const { data: remainingItems, error: countError } = await supabase
      .from('list_items')
      .select('id', { count: 'exact' })
      .eq('task_id', item.task_id);

    if (!countError && remainingItems?.length === 0) {
      // Update the task's has_list flag to false
      await supabase
        .from('tasks')
        .update({ has_list: false })
        .eq('id', item.task_id);
    }

    return { error: null };
  } catch (error) {
    console.error('Error deleting list item:', error);
    return { error };
  }
};

// Update a list item
export const updateListItem = async (itemId, text) => {
  try {
    const { data, error } = await supabase
      .from('list_items')
      .update({ text })
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error('Error updating list item:', error);
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
      category: data.category || 'work',
      completed: data.completed,
      escalated: data.escalated,
      tags: data.tags || []
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
    // Get the current user's ID
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('User must be authenticated to reschedule tasks');
    }

    // First get the current task
    const { data: task, error: fetchError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .eq('user_id', user.id)
      .single();

    if (fetchError) throw fetchError;

    // Get next business day (skip to Monday if it's Friday)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // If it's Friday (5), add 3 days to get to Monday
    // If it's Saturday (6), add 2 days to get to Monday
    const dayOfWeek = tomorrow.getDay();
    if (dayOfWeek === 6) { // Saturday
      tomorrow.setDate(tomorrow.getDate() + 2);
    } else if (dayOfWeek === 5) { // Friday
      tomorrow.setDate(tomorrow.getDate() + 3);
    }
    
    // Set time to midnight local time
    tomorrow.setHours(0, 0, 0, 0);
    
    // Convert to UTC for storage
    const offset = tomorrow.getTimezoneOffset();
    const utcDate = new Date(tomorrow.getTime() - (offset * 60 * 1000));
    const formattedDate = utcDate.toISOString();

    // Update the task with new due date and escalate it
    const { data, error: updateError } = await supabase
      .from('tasks')
      .update({
        due_date: formattedDate,
        escalated: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .eq('user_id', user.id)
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
      category: data.category || 'work',
      completed: data.completed,
      escalated: data.escalated,
      pinned: data.pinned || false,
      hasListItems: data.has_list || false,
      tags: data.tags || []
    };

    return { data: formattedTask, error: null };
  } catch (error) {
    console.error('Error rescheduling task:', error);
    return { data: null, error };
  }
};