import supabase from './supabaseClient';
import { telegramBot } from './telegramBot';

// Notification types
export const NOTIFICATION_TYPES = {
  TASK_DUE: 'TASK_DUE',
  DAILY_SUMMARY: 'DAILY_SUMMARY',
  WEEKLY_SUMMARY: 'WEEKLY_SUMMARY',
  MONTHLY_SUMMARY: 'MONTHLY_SUMMARY',
  CUSTOM_TIME: 'CUSTOM_TIME'
};

export const notificationService = {
  async sendNotification(userId, title, message) {
    // Try browser notification if we're in a browser environment
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body: message });
    }

    // Try Telegram notification
    const isTelegramConnected = await telegramBot.isConnected(userId);
    if (isTelegramConnected) {
      await telegramBot.sendMessage(userId, `<b>${title}</b>\n\n${message}`);
    }
  },

  async sendTaskDueNotification(userId, task) {
    // Use the Telegram bot's formatting function if sending to Telegram
    const isTelegramConnected = await telegramBot.isConnected(userId);
    
    if (isTelegramConnected) {
      const formattedMessage = telegramBot.formatTaskMessage(task);
      await telegramBot.sendMessage(userId, `<b>Task Due Reminder</b>${formattedMessage}`);
    } else {
      // For browser notifications, use a simpler format
      const message = `Task due: ${task.title}\nDue at: ${task.due_date}`;
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Task Due Reminder', { body: message });
      }
    }
  },

  async sendDailySummary(userId, tasks) {
    // Use the Telegram bot's formatting function if sending to Telegram
    const isTelegramConnected = await telegramBot.isConnected(userId);
    
    if (isTelegramConnected) {
      const formattedMessage = telegramBot.formatSummaryMessage('Daily Task Summary', tasks);
      await telegramBot.sendMessage(userId, formattedMessage);
    } else {
      // For browser notifications, use a simpler format
      const message = tasks.length > 0
        ? `Daily Summary:\n\n${tasks.map(t => `- ${t.title}`).join('\n')}`
        : 'No tasks scheduled for today';
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Daily Task Summary', { body: message });
      }
    }
  },

  async sendWeeklySummary(userId, tasks) {
    // Use the Telegram bot's formatting function if sending to Telegram
    const isTelegramConnected = await telegramBot.isConnected(userId);
    
    if (isTelegramConnected) {
      const formattedMessage = telegramBot.formatSummaryMessage('Weekly Task Summary', tasks);
      await telegramBot.sendMessage(userId, formattedMessage);
    } else {
      // For browser notifications, use a simpler format
      const message = tasks.length > 0
        ? `Weekly Summary:\n\n${tasks.map(t => `- ${t.title}`).join('\n')}`
        : 'No tasks scheduled for this week';
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Weekly Task Summary', { body: message });
      }
    }
  },

  async sendMonthlySummary(userId, tasks) {
    // Use the Telegram bot's formatting function if sending to Telegram
    const isTelegramConnected = await telegramBot.isConnected(userId);
    
    if (isTelegramConnected) {
      const formattedMessage = telegramBot.formatSummaryMessage('Monthly Task Summary', tasks);
      await telegramBot.sendMessage(userId, formattedMessage);
    } else {
      // For browser notifications, use a simpler format
      const message = tasks.length > 0
        ? `Monthly Summary:\n\n${tasks.map(t => `- ${t.title}`).join('\n')}`
        : 'No tasks scheduled for this month';
      
      if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
        new Notification('Monthly Task Summary', { body: message });
      }
    }
  }
};

// Keep track of tasks we've already notified about
const notifiedTasks = new Set();

// Check for upcoming tasks and send notifications
export const checkUpcomingTasks = async () => {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Get user settings
    let reminderTime = 15; // Default reminder time
    
    // Try to get settings from localStorage if in browser environment
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const settings = JSON.parse(localStorage.getItem('taskpilot_settings') || '{}');
        reminderTime = settings.notifications?.reminderTime || 15;
      } catch (e) {
        console.error('Error parsing settings from localStorage:', e);
      }
    }

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

    // Send notifications for upcoming tasks (only if we haven't already)
    tasks?.forEach(task => {
      // Create a unique key for this task notification
      const notificationKey = `${task.id}_${task.due_date}`;
      
      // Only send notification if we haven't already notified for this task
      if (!notifiedTasks.has(notificationKey)) {
        notificationService.sendTaskDueNotification(user.id, task);
        notifiedTasks.add(notificationKey);
        
        // Log for debugging
        console.log(`Sent notification for task: ${task.title}`);
      }
    });
  } catch (error) {
    console.error('Error checking upcoming tasks:', error);
  }
};

// Get notification settings from localStorage or use defaults
const getNotificationSettings = () => {
  // Default settings
  const defaultSettings = {
    enabled: false,
    taskDue: true,
    dailySummary: false,
    dailySummaryTime: '09:00',
    weeklySummary: false,
    weeklySummaryDay: 1, // Monday
    weeklySummaryTime: '09:00',
    monthlySummary: false,
    monthlySummaryDay: 1,
    monthlySummaryTime: '09:00',
    customNotifications: []
  };
  
  // Try to get settings from localStorage if in browser environment
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const settings = JSON.parse(localStorage.getItem('taskpilot_settings') || '{}');
      return settings.notifications || defaultSettings;
    } catch (e) {
      console.error('Error parsing settings from localStorage:', e);
      return defaultSettings;
    }
  }
  
  return defaultSettings;
};

// Keep track of summary notifications we've already sent
const sentSummaries = {
  daily: new Set(),
  weekly: new Set(),
  monthly: new Set(),
  custom: new Set()
};

// Check if it's time for a scheduled notification
const checkScheduledNotifications = async () => {
  const settings = getNotificationSettings();
  if (!settings.enabled) return;

  const now = new Date();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  // Check daily summary
  if (settings.dailySummary) {
    const [hour, minute] = settings.dailySummaryTime.split(':');
    if (now.getHours() === parseInt(hour) && now.getMinutes() === parseInt(minute)) {
      // Create a unique key for today's summary
      const summaryKey = `daily_${now.toISOString().split('T')[0]}`;
      
      // Only send if we haven't already sent today's summary
      if (!sentSummaries.daily.has(summaryKey)) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .gte('due_date', now.toISOString())
          .lte('due_date', new Date(now.getTime() + 24*60*60*1000).toISOString());

        await notificationService.sendDailySummary(user.id, tasks || []);
        sentSummaries.daily.add(summaryKey);
        console.log('Sent daily summary notification');
      }
    }
  }

  // Check weekly summary
  if (settings.weeklySummary && 
      now.getDay() === settings.weeklySummaryDay) {
    const [hour, minute] = settings.weeklySummaryTime.split(':');
    if (now.getHours() === parseInt(hour) && now.getMinutes() === parseInt(minute)) {
      // Create a unique key for this week's summary
      const weekNumber = Math.floor(now.getDate() / 7);
      const summaryKey = `weekly_${now.getFullYear()}_${now.getMonth()}_${weekNumber}`;
      
      // Only send if we haven't already sent this week's summary
      if (!sentSummaries.weekly.has(summaryKey)) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .gte('due_date', now.toISOString())
          .lte('due_date', new Date(now.getTime() + 7*24*60*60*1000).toISOString());

        await notificationService.sendWeeklySummary(user.id, tasks || []);
        sentSummaries.weekly.add(summaryKey);
        console.log('Sent weekly summary notification');
      }
    }
  }

  // Check monthly summary
  if (settings.monthlySummary && 
      now.getDate() === settings.monthlySummaryDay) {
    const [hour, minute] = settings.monthlySummaryTime.split(':');
    if (now.getHours() === parseInt(hour) && now.getMinutes() === parseInt(minute)) {
      // Create a unique key for this month's summary
      const summaryKey = `monthly_${now.getFullYear()}_${now.getMonth()}`;
      
      // Only send if we haven't already sent this month's summary
      if (!sentSummaries.monthly.has(summaryKey)) {
        const { data: tasks } = await supabase
          .from('tasks')
          .select('*')
          .eq('user_id', user.id)
          .eq('completed', false)
          .gte('due_date', now.toISOString())
          .lte('due_date', new Date(now.getTime() + 30*24*60*60*1000).toISOString());

        await notificationService.sendMonthlySummary(user.id, tasks || []);
        sentSummaries.monthly.add(summaryKey);
        console.log('Sent monthly summary notification');
      }
    }
  }

  // Check custom notifications
  settings.customNotifications?.forEach(async (notification) => {
    const [hour, minute] = notification.time.split(':');
    if (now.getHours() === parseInt(hour) && now.getMinutes() === parseInt(minute)) {
      // Create a unique key for this custom notification
      const notificationKey = `custom_${notification.id}_${now.toISOString().split('T')[0]}`;
      
      // Only send if we haven't already sent this notification today
      if (!sentSummaries.custom.has(notificationKey)) {
        await notificationService.sendNotification(
          user.id,
          notification.title,
          notification.message
        );
        sentSummaries.custom.add(notificationKey);
        console.log(`Sent custom notification: ${notification.title}`);
      }
    }
  });
};

// Start the notification checker
let notificationInterval = null;

export const startNotificationChecker = () => {
  // Check immediately
  checkUpcomingTasks();
  checkScheduledNotifications();
  
  // Check every minute
  notificationInterval = setInterval(() => {
    checkUpcomingTasks();
    checkScheduledNotifications();
  }, 60000);

  return notificationInterval;
};

// Stop the notification checker
export const stopNotificationChecker = () => {
  if (notificationInterval) {
    clearInterval(notificationInterval);
    notificationInterval = null;
  }
};
