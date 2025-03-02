// Mock data store - will be replaced with Supabase integration
let mockTasks = [
  {
    id: '1',
    title: 'Complete Project Proposal',
    description: 'Draft and review the Q2 project proposal document',
    dueDate: '2024-02-15',
    priority: 'high',
    completed: false,
    escalated: true
  },
  {
    id: '2',
    title: 'Team Meeting',
    description: 'Weekly sync with the development team',
    dueDate: '2024-02-14',
    priority: 'medium',
    completed: false,
    escalated: false
  }
];

// Get tasks based on timeframe
export const getTasks = async (timeframe = 'today') => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get overdue tasks (past tasks that are not completed)
    const overdueTasks = mockTasks.filter(task => {
      const taskDate = new Date(task.dueDate);
      taskDate.setHours(0, 0, 0, 0);
      return !task.completed && taskDate < today;
    });

    let timeframeTasks = [];
    if (timeframe === 'today') {
      // Get today's tasks
      timeframeTasks = mockTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === today.getTime();
      });
    } else if (timeframe === 'tomorrow') {
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      timeframeTasks = mockTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return taskDate.getTime() === tomorrow.getTime();
      });
    } else if (timeframe === 'week') {
      const weekEnd = new Date(today);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);
      timeframeTasks = mockTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= today && taskDate <= weekEnd;
      });
    } else if (timeframe === 'month') {
      const monthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      monthEnd.setHours(23, 59, 59, 999);
      timeframeTasks = mockTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        return taskDate >= today && taskDate <= monthEnd;
      });
    } else if (timeframe === 'upcoming') {
      timeframeTasks = mockTasks.filter(task => {
        const taskDate = new Date(task.dueDate);
        taskDate.setHours(0, 0, 0, 0);
        return !task.completed && taskDate > today;
      });
    } else if (timeframe === 'overdue') {
      timeframeTasks = overdueTasks;
    } else {
      timeframeTasks = mockTasks;
    }

    // For any timeframe other than 'overdue', combine overdue tasks with timeframe tasks
    // and remove duplicates
    if (timeframe !== 'overdue') {
      const allTasks = [...overdueTasks, ...timeframeTasks];
      // Remove duplicates based on task ID
      const uniqueTasks = Array.from(new Map(allTasks.map(task => [task.id, task])).values());
      return { data: uniqueTasks, error: null };
    }

    return { data: timeframeTasks, error: null };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { data: null, error };
  }
};

// Create a new task
export const createTask = async (task) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const newTask = {
      ...task,
      id: Date.now().toString(),
      escalated: false,
      completed: false
    };
    mockTasks = [...mockTasks, newTask];
    return { data: newTask, error: null };
  } catch (error) {
    console.error('Error creating task:', error);
    return { data: null, error };
  }
};

// Update an existing task
export const updateTask = async (task) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    mockTasks = mockTasks.map(t => t.id === task.id ? task : t);
    return { data: task, error: null };
  } catch (error) {
    console.error('Error updating task:', error);
    return { data: null, error };
  }
};

// Delete a task
export const deleteTask = async (taskId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    mockTasks = mockTasks.filter(t => t.id !== taskId);
    return { error: null };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error };
  }
};

// Toggle task completion status
export const toggleTaskCompletion = async (taskId) => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const task = mockTasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    const updatedTask = {
      ...task,
      completed: !task.completed
    };
    mockTasks = mockTasks.map(t => t.id === taskId ? updatedTask : t);
    return { data: updatedTask, error: null };
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return { data: null, error };
  }
};

// Reschedule an overdue task
export const rescheduleTask = async (taskId) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    const task = mockTasks.find(t => t.id === taskId);
    if (!task) throw new Error('Task not found');
    
    // Set due date to next business day
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Format date as YYYY-MM-DD for storage
    const formattedDate = tomorrow.toISOString().split('T')[0];
    
    const updatedTask = {
      ...task,
      dueDate: formattedDate,
      escalated: true
    };
    mockTasks = mockTasks.map(t => t.id === taskId ? updatedTask : t);
    return { data: updatedTask, error: null };
  } catch (error) {
    console.error('Error rescheduling task:', error);
    return { data: null, error };
  }
};

// Future implementation notes:
// - Replace mockTasks with Supabase database
// - Add proper error handling and validation
// - Implement real-time updates using Supabase subscriptions
// - Add task categories and tags
// - Implement task dependencies
// - Add recurring tasks support