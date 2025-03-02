// Default settings configuration
const defaultSettings = {
  appearance: { 
    darkMode: false, 
    language: 'en' 
  },
  notifications: { 
    emailNotifications: true, 
    desktopNotifications: true, 
    reminderTime: 15 
  },
  taskManagement: { 
    workingHoursStart: '09:00', 
    workingHoursEnd: '17:00', 
    defaultTaskDuration: 30,
    autoEscalateOverdue: true 
  },
  aiAssistant: { 
    aiEnabled: true, 
    aiSuggestionFrequency: 'medium',
    focusTimeLength: 25,
    breakTimeLength: 5 
  },
  calendar: { 
    calendarSync: true, 
    blockCalendarEvents: true 
  }
};

// Load settings from localStorage or use defaults
export const loadSettings = () => {
  try {
    const savedSettings = localStorage.getItem('taskpilot_settings');
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return defaultSettings;
  }
};

// Save settings to localStorage
export const saveSettings = (settings) => {
  try {
    localStorage.setItem('taskpilot_settings', JSON.stringify(settings));
    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error };
  }
};

// Reset settings to defaults
export const resetSettings = () => {
  try {
    localStorage.removeItem('taskpilot_settings');
    return { success: true, data: defaultSettings };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, error };
  }
};

// Future implementation notes:
// - Replace localStorage with Supabase for persistent storage
// - Add user_id to settings for multi-user support
// - Implement server-side validation
// - Add settings migration system for updates