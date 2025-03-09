import supabase from './supabaseClient';

// Default settings configuration
export const defaultSettings = {
  appearance: { 
    darkMode: false, 
    language: 'en' 
  },
  notifications: { 
    emailNotifications: true, 
    desktopNotifications: true, 
    reminderTime: 15,
    customNotifications: []
  },
  telegram_settings: {
    enabled: false,
    dailySummary: false,
    dailySummaryTime: '09:00',
    weeklySummary: false,
    weeklySummaryDay: 1,
    weeklySummaryTime: '09:00',
    monthlySummary: false,
    monthlySummaryDay: 1,
    monthlySummaryTime: '09:00'
  },
  task_management: { 
    workingHoursStart: '09:00', 
    workingHoursEnd: '17:00', 
    defaultTaskDuration: 30,
    autoEscalateOverdue: true 
  },
  ai_assistant: { 
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

// Load settings from Supabase and fall back to localStorage
export const loadSettings = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to load settings');
    }

    // Try to load from Supabase first
    const { data: userSettings, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error loading settings from Supabase:', error);
      // Fall back to localStorage
      const savedSettings = localStorage.getItem('taskpilot_settings');
      return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
    }

    if (!userSettings) {
      // Create new settings record in Supabase
      const settingsToCreate = {
        user_id: userId,
        ...defaultSettings,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('user_settings')
        .insert([settingsToCreate]);

      if (insertError) {
        console.error('Error creating settings:', insertError);
      }

      return defaultSettings;
    }

    // Merge with defaults to ensure all fields exist
    const mergedSettings = {
      ...defaultSettings,
      appearance: { ...defaultSettings.appearance, ...userSettings.appearance },
      notifications: { ...defaultSettings.notifications, ...userSettings.notifications },
      telegram_settings: { ...defaultSettings.telegram_settings, ...userSettings.telegram_settings },
      task_management: { ...defaultSettings.task_management, ...userSettings.task_management },
      ai_assistant: { ...defaultSettings.ai_assistant, ...userSettings.ai_assistant },
      calendar: { ...defaultSettings.calendar, ...userSettings.calendar }
    };

    // Keep localStorage in sync
    localStorage.setItem('taskpilot_settings', JSON.stringify(mergedSettings));

    return mergedSettings;
  } catch (error) {
    console.error('Error in loadSettings:', error);
    // Fall back to localStorage
    const savedSettings = localStorage.getItem('taskpilot_settings');
    return savedSettings ? { ...defaultSettings, ...JSON.parse(savedSettings) } : defaultSettings;
  }
};

// Save settings to both Supabase and localStorage
export const saveSettings = async (userId, settings) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to save settings');
    }

    // Format settings for Supabase
    const supabaseSettings = {
      user_id: userId,
      appearance: settings.appearance,
      notifications: settings.notifications,
      telegram_settings: settings.telegram_settings,
      task_management: settings.task_management,
      ai_assistant: settings.ai_assistant,
      calendar: settings.calendar,
      updated_at: new Date().toISOString()
    };

    // Save to Supabase using upsert
    const { error } = await supabase
      .from('user_settings')
      .upsert(supabaseSettings);

    if (error) {
      console.error('Error saving settings to Supabase:', error);
      throw error;
    }

    // Save to localStorage as backup
    localStorage.setItem('taskpilot_settings', JSON.stringify(settings));

    return { success: true };
  } catch (error) {
    console.error('Error saving settings:', error);
    return { success: false, error };
  }
};

// Reset settings to defaults
export const resetSettings = async (userId) => {
  try {
    if (!userId) {
      throw new Error('User ID is required to reset settings');
    }

    // Update Supabase with defaults
    const { error } = await supabase
      .from('user_settings')
      .upsert({ 
        user_id: userId,
        ...defaultSettings,
        updated_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error resetting settings in Supabase:', error);
      throw error;
    }

    // Clear localStorage
    localStorage.removeItem('taskpilot_settings');

    return { success: true, data: defaultSettings };
  } catch (error) {
    console.error('Error resetting settings:', error);
    return { success: false, error };
  }
};
