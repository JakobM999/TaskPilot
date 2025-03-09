// Notification Service
import supabase from './supabaseClient';

// Check if browser notifications are supported and permission is granted
const checkNotificationPermission = async () => {
  if (!('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  return false;
};

// Show a desktop notification
export const showNotification = async (title, options = {}) => {
  const hasPermission = await checkNotificationPermission();
  if (!hasPermission) return;

  const notification = new Notification(title, {
    icon: '/favicon.ico',
    ...options
  });

  notification.onclick = function(event) {
    event.preventDefault();
    window.focus();
    this.close();
  };
};

// Check for upcoming tasks and send notifications
export const checkUpcomingTasks = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user settings
    const settings = JSON.parse(localStorage.getItem('taskpilot_settings') || '{}');
    const { reminderTime = 15 } = settings.notifications || {};

    // Calculate the time window for upcoming tasks
    const now = new Date();
    const reminderWindow = new Date(now.getTime() + (reminderTime * 60 * 1000));

    // Get tasks due soon
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', user.id)
      .eq('completed', false)
      .gte('due_date', now.toISOString())
      .lte('due_date', reminderWindow.toISOString());

    if (error) throw error;

    // Send notifications for upcoming tasks
    tasks?.forEach(task => {
      const dueDate = new Date(task.due_date);
      const timeUntilDue = Math.round((dueDate - now) / 60000); // in minutes

      showNotification('Upcoming Task', {
        body: `"${task.title}" is due in ${timeUntilDue} minutes`,
        tag: `task-${task.id}`, // Prevent duplicate notifications
        renotify: false
      });
    });

  } catch (error) {
    console.error('Error checking upcoming tasks:', error);
  }
};

// Start the notification checker
export const startNotificationChecker = () => {
  // Check immediately
  checkUpcomingTasks();
  
  // Then check every minute
  return setInterval(checkUpcomingTasks, 60000);
};

// Stop the notification checker
export const stopNotificationChecker = (intervalId) => {
  clearInterval(intervalId);
};