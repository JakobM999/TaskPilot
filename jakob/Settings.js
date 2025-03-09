import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Switch,
  FormControlLabel,
  Select,
  MenuItem,
  TextField,
  Divider,
  Grid,
  Button,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Stack,
  Collapse,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tabs,
  Tab,
  IconButton,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  SmartToy as SmartToyIcon,
  Telegram as TelegramIcon,
  Language as LanguageIcon,
  RestartAlt as RestartAltIcon,
  AccessTime as AccessTimeIcon,
  Save as SaveIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Storage as StorageIcon,
  Help as HelpIcon,
  ConstructionOutlined as ConstructionIcon,
  Category as CategoryIcon,
  AccessTime as TimeIcon,
  Layers as LayersIcon,
  Analytics as AnalyticsIcon,
  IntegrationInstructions as IntegrationIcon,
  Settings as SettingsIcon,
  Engineering as EngineeringIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Event as EventIcon,
  CalendarMonth as CalendarIcon,
} from '@mui/icons-material';
import { testSupabaseConnection } from '../services/testSupabase';
import { verifySupabaseSchema } from '../services/verifySchema';
import { useNotifications } from '../hooks/useNotifications';
import { telegramBot } from '../services/telegramBot';
import supabase from '../services/supabaseClient';

// Tab panel component to wrap content for each tab
function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

// Feature Upgrades component for the dedicated tab
function FeatureUpgrades({ featureUpgrades, setFeatureUpgrades, handleToggleFeature }) {
  const [editMode, setEditMode] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [newCategoryTitle, setNewCategoryTitle] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [newTaskText, setNewTaskText] = useState('');

  // Calculate progress for feature upgrade categories
  const calculateProgress = (category) => {
    const tasks = featureUpgrades[category].tasks;
    const completedCount = tasks.filter(task => task.completed).length;
    return {
      count: completedCount,
      total: tasks.length,
      percentage: Math.round((completedCount / tasks.length) * 100)
    };
  };

  // Calculate overall progress
  const calculateOverallProgress = () => {
    let totalTasks = 0;
    let completedTasks = 0;
    
    Object.keys(featureUpgrades).forEach(category => {
      const tasks = featureUpgrades[category].tasks;
      totalTasks += tasks.length;
      completedTasks += tasks.filter(task => task.completed).length;
    });
    
    return {
      count: completedTasks,
      total: totalTasks,
      percentage: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };
  };

  const handleAddCategory = () => {
    if (newCategory && newCategoryTitle) {
      const updatedUpgrades = {
        ...featureUpgrades,
        [newCategory]: {
          title: newCategoryTitle,
          tasks: []
        }
      };
      localStorage.setItem('taskpilot_feature_upgrades', JSON.stringify(updatedUpgrades));
      setFeatureUpgrades(updatedUpgrades);
      setNewCategory('');
      setNewCategoryTitle('');
    }
  };

  const handleDeleteCategory = (category) => {
    const updatedUpgrades = { ...featureUpgrades };
    delete updatedUpgrades[category];
    localStorage.setItem('taskpilot_feature_upgrades', JSON.stringify(updatedUpgrades));
    setFeatureUpgrades(updatedUpgrades);
  };

  const handleAddTask = () => {
    if (selectedCategory && newTaskText) {
      const updatedUpgrades = {
        ...featureUpgrades,
        [selectedCategory]: {
          ...featureUpgrades[selectedCategory],
          tasks: [
            ...featureUpgrades[selectedCategory].tasks,
            {
              id: Date.now().toString(),
              text: newTaskText,
              completed: false
            }
          ]
        }
      };
      localStorage.setItem('taskpilot_feature_upgrades', JSON.stringify(updatedUpgrades));
      setFeatureUpgrades(updatedUpgrades);
      setNewTaskText('');
    }
  };

  const handleDeleteTask = (category, taskId) => {
    const updatedUpgrades = {
      ...featureUpgrades,
      [category]: {
        ...featureUpgrades[category],
        tasks: featureUpgrades[category].tasks.filter(task => task.id !== taskId)
      }
    };
    localStorage.setItem('taskpilot_feature_upgrades', JSON.stringify(updatedUpgrades));
    setFeatureUpgrades(updatedUpgrades);
  };

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ConstructionIcon color="primary" />
          <Typography variant="h5" component="h2">
            Feature Upgrades To-Do List
          </Typography>
        </Box>
        <Button
          variant="outlined"
          onClick={() => setEditMode(!editMode)}
          startIcon={editMode ? <SaveIcon /> : <EditIcon />}
        >
          {editMode ? 'Done Editing' : 'Edit List'}
        </Button>
      </Box>
      
      <Typography variant="body1" paragraph>
        Track your progress implementing new features and improvements to TaskPilot.
        Overall progress: {calculateOverallProgress().count}/{calculateOverallProgress().total} ({calculateOverallProgress().percentage}% complete)
      </Typography>

      {editMode && (
        <Paper sx={{ p: 2, mb: 3 }} elevation={0} variant="outlined">
          <Typography variant="h6" gutterBottom>Add New Category</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                label="Category ID"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                size="small"
                helperText="Use lowercase, no spaces (e.g., 'newFeatures')"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Category Title"
                value={newCategoryTitle}
                onChange={(e) => setNewCategoryTitle(e.target.value)}
                size="small"
                helperText="Display name for the category"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddCategory}
                disabled={!newCategory || !newCategoryTitle}
              >
                Add
              </Button>
            </Grid>
          </Grid>

          <Divider sx={{ my: 2 }} />

          <Typography variant="h6" gutterBottom>Add New Task</Typography>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select
                  value={selectedCategory || ''}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  label="Category"
                >
                  {Object.keys(featureUpgrades).map((category) => (
                    <MenuItem key={category} value={category}>
                      {featureUpgrades[category].title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Task Description"
                value={newTaskText}
                onChange={(e) => setNewTaskText(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                fullWidth
                variant="contained"
                onClick={handleAddTask}
                disabled={!selectedCategory || !newTaskText}
              >
                Add
              </Button>
            </Grid>
          </Grid>
        </Paper>
      )}
      
      {Object.keys(featureUpgrades).map((category) => (
        <Accordion key={category} defaultExpanded={true}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
              {category === 'organization' && <CategoryIcon color="primary" />}
              {category === 'timeManagement' && <TimeIcon color="primary" />}
              {category === 'userExperience' && <LayersIcon color="primary" />}
              {category === 'ai' && <SmartToyIcon color="primary" />}
              {category === 'integration' && <IntegrationIcon color="primary" />}
              {category === 'analytics' && <AnalyticsIcon color="primary" />}
              
              <Typography variant="h6">{featureUpgrades[category].title}</Typography>
              
              <Typography variant="body2" sx={{ ml: 'auto', mr: 2 }}>
                {calculateProgress(category).count}/{calculateProgress(category).total} completed
              </Typography>

              {editMode && (
                <IconButton
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteCategory(category);
                  }}
                  sx={{ mr: 1 }}
                >
                  <DeleteIcon />
                </IconButton>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <List dense>
              {featureUpgrades[category].tasks.map((task) => (
                <ListItem
                  key={task.id}
                  secondaryAction={
                    editMode && (
                      <IconButton
                        edge="end"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteTask(category, task.id);
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    )
                  }
                >
                  <ListItemIcon>
                    <Checkbox
                      checked={task.completed}
                      onChange={() => handleToggleFeature(category, task.id)}
                      onClick={(e) => e.stopPropagation()}
                      edge="start"
                      sx={{ ml: -1 }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={task.text}
                    sx={{
                      textDecoration: task.completed ? 'line-through' : 'none',
                      color: task.completed ? 'text.secondary' : 'text.primary'
                    }}
                  />
                </ListItem>
              ))}
            </List>
          </AccordionDetails>
        </Accordion>
      ))}
    </>
  );
}

function Settings() {
  const [currentTab, setCurrentTab] = useState(0);
  
// Theme settings
const [darkMode, setDarkMode] = useState(false);
const [language, setLanguage] = useState('en');

// Telegram settings
const [telegramConnected, setTelegramConnected] = useState(false);
const [userId, setUserId] = useState(null);

// Get current user ID
useEffect(() => {
  const fetchUserId = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUserId(user?.id);
  };
  fetchUserId();
}, []);

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState(15);
  const [dailySummaryEnabled, setDailySummaryEnabled] = useState(false);
  const [dailySummaryTime, setDailySummaryTime] = useState('09:00');
  const [weeklySummaryEnabled, setWeeklySummaryEnabled] = useState(false);
  const [weeklySummaryDay, setWeeklySummaryDay] = useState(1);
  const [weeklySummaryTime, setWeeklySummaryTime] = useState('09:00');
  const [monthlySummaryEnabled, setMonthlySummaryEnabled] = useState(false);
  const [monthlySummaryDay, setMonthlySummaryDay] = useState(1);
  const [monthlySummaryTime, setMonthlySummaryTime] = useState('09:00');
  const [customNotifications, setCustomNotifications] = useState([]);

  const handleCustomNotificationChange = (index, field, value) => {
    setCustomNotifications(prev => prev.map((notification, i) => 
      i === index ? { ...notification, [field]: value } : notification
    ));
  };

  const addCustomNotification = () => {
    setCustomNotifications(prev => [...prev, {
      id: Date.now().toString(),
      title: '',
      message: '',
      time: '09:00',
    }]);
  };

  const removeCustomNotification = (index) => {
    setCustomNotifications(prev => prev.filter((_, i) => i !== index));
  };

  // Task management settings
  const [workingHoursStart, setWorkingHoursStart] = useState('09:00');
  const [workingHoursEnd, setWorkingHoursEnd] = useState('17:00');
  const [defaultTaskDuration, setDefaultTaskDuration] = useState(30);
  const [autoEscalateOverdue, setAutoEscalateOverdue] = useState(true);

  // AI Assistant settings
  const [aiEnabled, setAiEnabled] = useState(true);
  const [aiSuggestionFrequency, setAiSuggestionFrequency] = useState('medium');
  const [focusTimeLength, setFocusTimeLength] = useState(25);
  const [breakTimeLength, setBreakTimeLength] = useState(5);

  // Calendar Integration
  const [calendarSync, setCalendarSync] = useState(true);
  const [blockCalendarEvents, setBlockCalendarEvents] = useState(true);

  // Feature upgrade to-do list
  const [featureUpgrades, setFeatureUpgrades] = useState({
    organization: {
      title: "Task Organization & Display",
      tasks: [
        { id: "categories", text: "Task Categorization", completed: false },
        { id: "dependencies", text: "Task Dependencies", completed: false },
        { id: "priority-visual", text: "Improved Priority Visualization", completed: false },
        { id: "sorting", text: "Advanced Task Sorting & Filtering", completed: false }
      ]
    },
    timeManagement: {
      title: "Time Management",
      tasks: [
        { id: "time-estimates", text: "Time Estimates for Tasks", completed: false },
        { id: "progress", text: "Partial Progress Tracking", completed: false },
        { id: "pomodoro", text: "Pomodoro Timer Integration", completed: false },
        { id: "recurring", text: "Recurring Tasks Support", completed: false }
      ]
    },
    userExperience: {
      title: "User Experience",
      tasks: [
        { id: "drag-drop", text: "Drag & Drop Interface", completed: false },
        { id: "templates", text: "Task Templates", completed: false },
        { id: "bulk-actions", text: "Bulk Actions", completed: false },
        { id: "keyboard", text: "Keyboard Shortcuts", completed: false },
        { id: "dark-mode", text: "Dark Mode Toggle", completed: false }
      ]
    },
    ai: {
      title: "AI & Smart Features",
      tasks: [
        { id: "smart-suggestions", text: "Smarter Task Suggestions", completed: false },
        { id: "nlp", text: "Natural Language Processing", completed: false },
        { id: "auto-priority", text: "Automated Priority Setting", completed: false },
        { id: "smart-notifications", text: "Smart Notifications", completed: false }
      ]
    },
    integration: {
      title: "Integration & Expansion",
      tasks: [
        { id: "calendar", text: "Improved Calendar Integration", completed: false },
        { id: "team", text: "Team Tasks & Collaboration", completed: false },
        { id: "mobile", text: "Mobile App", completed: false },
        { id: "api", text: "API Access", completed: false }
      ]
    },
    analytics: {
      title: "Analytics & Insights",
      tasks: [
        { id: "dashboard", text: "Productivity Dashboard", completed: false },
        { id: "goals", text: "Goal Tracking", completed: false },
        { id: "heatmap", text: "Task Completion Heatmap", completed: false }
      ]
    }
  });

  const [saveStatus, setSaveStatus] = useState(null);

  const [testResult, setTestResult] = useState(null);
  const [testError, setTestError] = useState(null);
  const [schemaResult, setSchemaResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDatabaseDetails, setShowDatabaseDetails] = useState(false);

  const { 
    notificationsEnabled, 
    notificationPermission, 
    toggleNotifications 
  } = useNotifications();

  // Auto-save settings whenever they change
  useEffect(() => {
    const settings = {
      appearance: { darkMode, language },
      notifications: { 
        emailNotifications, 
        desktopNotifications, 
        reminderTime,
        dailySummary: dailySummaryEnabled,
        dailySummaryTime,
        weeklySummary: weeklySummaryEnabled,
        weeklySummaryDay,
        weeklySummaryTime,
        monthlySummary: monthlySummaryEnabled,
        monthlySummaryDay,
        monthlySummaryTime,
        customNotifications
      },
      taskManagement: { 
        workingHoursStart, 
        workingHoursEnd, 
        defaultTaskDuration,
        autoEscalateOverdue 
      },
      aiAssistant: { 
        aiEnabled, 
        aiSuggestionFrequency,
        focusTimeLength,
        breakTimeLength 
      },
      calendar: { calendarSync, blockCalendarEvents }
    };
    
    localStorage.setItem('taskpilot_settings', JSON.stringify(settings));
  }, [
    darkMode, language,
    emailNotifications, desktopNotifications, reminderTime,
    dailySummaryEnabled, dailySummaryTime,
    weeklySummaryEnabled, weeklySummaryDay, weeklySummaryTime,
    monthlySummaryEnabled, monthlySummaryDay, monthlySummaryTime,
    customNotifications,
    workingHoursStart, workingHoursEnd, defaultTaskDuration, autoEscalateOverdue,
    aiEnabled, aiSuggestionFrequency, focusTimeLength, breakTimeLength,
    calendarSync, blockCalendarEvents
  ]);

  // Check Telegram connection status
  useEffect(() => {
    if (userId) {
      const checkTelegramConnection = async () => {
        const isConnected = await telegramBot.isConnected(userId);
        setTelegramConnected(isConnected);
      };
      checkTelegramConnection();
    }
  }, [userId]);

  // Load saved settings and feature upgrades from localStorage on component mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('taskpilot_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        
        // Load notification settings
        if (settings.notifications) {
          setEmailNotifications(settings.notifications.emailNotifications ?? true);
          setDesktopNotifications(settings.notifications.desktopNotifications ?? true);
          setReminderTime(settings.notifications.reminderTime ?? 15);
          setDailySummaryEnabled(settings.notifications.dailySummary ?? false);
          setDailySummaryTime(settings.notifications.dailySummaryTime ?? '09:00');
          setWeeklySummaryEnabled(settings.notifications.weeklySummary ?? false);
          setWeeklySummaryDay(settings.notifications.weeklySummaryDay ?? 1);
          setWeeklySummaryTime(settings.notifications.weeklySummaryTime ?? '09:00');
          setMonthlySummaryEnabled(settings.notifications.monthlySummary ?? false);
          setMonthlySummaryDay(settings.notifications.monthlySummaryDay ?? 1);
          setMonthlySummaryTime(settings.notifications.monthlySummaryTime ?? '09:00');
          setCustomNotifications(settings.notifications.customNotifications ?? []);
        }

        // Load theme settings
        if (settings.appearance) {
          setDarkMode(settings.appearance.darkMode ?? false);
          setLanguage(settings.appearance.language ?? 'en');
        }

        // Load task management settings
        if (settings.taskManagement) {
          setWorkingHoursStart(settings.taskManagement.workingHoursStart ?? '09:00');
          setWorkingHoursEnd(settings.taskManagement.workingHoursEnd ?? '17:00');
          setDefaultTaskDuration(settings.taskManagement.defaultTaskDuration ?? 30);
          setAutoEscalateOverdue(settings.taskManagement.autoEscalateOverdue ?? true);
        }

        // Load AI settings
        if (settings.aiAssistant) {
          setAiEnabled(settings.aiAssistant.aiEnabled ?? true);
          setAiSuggestionFrequency(settings.aiAssistant.aiSuggestionFrequency ?? 'medium');
          setFocusTimeLength(settings.aiAssistant.focusTimeLength ?? 25);
          setBreakTimeLength(settings.aiAssistant.breakTimeLength ?? 5);
        }

        // Load calendar settings
        if (settings.calendar) {
          setCalendarSync(settings.calendar.calendarSync ?? true);
          setBlockCalendarEvents(settings.calendar.blockCalendarEvents ?? true);
        }
      } catch (error) {
        console.error('Error loading saved settings:', error);
      }
    }
  }, []);

  // Load saved feature upgrades from localStorage on component mount
  useEffect(() => {
    const savedUpgrades = localStorage.getItem('taskpilot_feature_upgrades');
    if (savedUpgrades) {
      try {
        const parsedUpgrades = JSON.parse(savedUpgrades);
        setFeatureUpgrades(prevState => {
          // Merge the saved state with the current structure to handle new features
          const updatedState = { ...prevState };
          
          // Update completed status for each task
          Object.keys(parsedUpgrades).forEach(category => {
            if (updatedState[category]) {
              parsedUpgrades[category].tasks.forEach(savedTask => {
                const taskIndex = updatedState[category].tasks.findIndex(t => t.id === savedTask.id);
                if (taskIndex !== -1) {
                  updatedState[category].tasks[taskIndex].completed = savedTask.completed;
                }
              });
            }
          });
          
          return updatedState;
        });
      } catch (error) {
        console.error('Error loading saved feature upgrades:', error);
      }
    }
  }, []);

  const handleToggleFeature = (category, taskId) => {
    setFeatureUpgrades(prevState => {
      const newState = {
        ...prevState,
        [category]: {
          ...prevState[category],
          tasks: prevState[category].tasks.map(task => 
            task.id === taskId 
              ? { ...task, completed: !task.completed }
              : task
          )
        }
      };
      
      // Save to localStorage after updating
      localStorage.setItem('taskpilot_feature_upgrades', JSON.stringify(newState));
      
      return newState;
    });
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
  };

  const handleSave = () => {
    // Save all settings including feature upgrades
    const settings = {
      appearance: { darkMode, language },
      notifications: { 
        emailNotifications, 
        desktopNotifications, 
        reminderTime,
        dailySummary: dailySummaryEnabled,
        dailySummaryTime,
        weeklySummary: weeklySummaryEnabled,
        weeklySummaryDay,
        weeklySummaryTime,
        monthlySummary: monthlySummaryEnabled,
        monthlySummaryDay,
        monthlySummaryTime,
        customNotifications
      },
      taskManagement: { 
        workingHoursStart, 
        workingHoursEnd, 
        defaultTaskDuration,
        autoEscalateOverdue 
      },
      aiAssistant: { 
        aiEnabled, 
        aiSuggestionFrequency,
        focusTimeLength,
        breakTimeLength 
      },
      calendar: { calendarSync, blockCalendarEvents }
    };

    localStorage.setItem('taskpilot_settings', JSON.stringify(settings));
    localStorage.setItem('taskpilot_feature_upgrades', JSON.stringify(featureUpgrades));
    
    setSaveStatus('success');
    setTimeout(() => setSaveStatus(null), 3000);
  };

  const handleReset = () => {
    // Reset to default values
    setDarkMode(false);
    setLanguage('en');
    setEmailNotifications(true);
    setDesktopNotifications(true);
    setReminderTime(15);
    setWorkingHoursStart('09:00');
    setWorkingHoursEnd('17:00');
    setDefaultTaskDuration(30);
    setAutoEscalateOverdue(true);
    setAiEnabled(true);
    setAiSuggestionFrequency('medium');
    setFocusTimeLength(25);
    setBreakTimeLength(5);
    setCalendarSync(true);
    setBlockCalendarEvents(true);
  };

  const handleTestConnection = async () => {
    setIsLoading(true);
    setTestResult(null);
    setTestError(null);
    
    try {
      const testResult = await testSupabaseConnection();
      setTestResult(testResult);
      
      if (!testResult.success) {
        setTestError(testResult.message || "Unknown error occurred");
      }
    } catch (err) {
      setTestError(err.message || 'An error occurred during testing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifySchema = async () => {
    setIsLoading(true);
    setSchemaResult(null);
    
    try {
      const result = await verifySupabaseSchema();
      setSchemaResult(result);
    } catch (err) {
      setSchemaResult({
        success: false,
        message: err.message || 'Error verifying schema'
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Settings
        </Typography>
        <Typography variant="body1" color="text.secondary" gutterBottom>
          Customize TaskPilot to match your work style and preferences
        </Typography>
      </Box>

      {saveStatus && (
        <Alert 
          severity="success" 
          sx={{ mb: 3 }}
          onClose={() => setSaveStatus(null)}
        >
          Settings saved successfully!
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ width: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
              value={currentTab} 
              onChange={handleTabChange} 
              variant="scrollable"
              scrollButtons="auto"
            >
              <Tab 
                icon={<SettingsIcon />} 
                iconPosition="start" 
                label="General" 
              />
              <Tab 
                icon={<NotificationsIcon />} 
                iconPosition="start" 
                label="Notifications" 
              />
              <Tab 
                icon={<EngineeringIcon />} 
                iconPosition="start" 
                label="Feature Upgrades" 
              />
              <Tab 
                icon={<StorageIcon />} 
                iconPosition="start" 
                label="Database" 
              />
              </Tabs>
            </Box>

            {/* General Settings Tab */}
            <TabPanel value={currentTab} index={0}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={8}>
                  <Paper sx={{ p: 3, mb: 3 }}>
                    {/* Existing settings sections */}
                    <List subheader={
                      <ListSubheader sx={{ bgcolor: 'transparent', pl: 0 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          Appearance & Language
                        </Typography>
                      </ListSubheader>
                    }>
                      <ListItem>
                        <ListItemIcon>
                          <DarkModeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Dark Mode" 
                          secondary="Switch between light and dark theme"
                        />
                        <Switch
                          checked={darkMode}
                          onChange={(e) => setDarkMode(e.target.checked)}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <LanguageIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Language" 
                          secondary="Choose your preferred language"
                        />
                        <Select
                          value={language}
                          onChange={(e) => setLanguage(e.target.value)}
                          size="small"
                          sx={{ width: 120 }}
                        >
                          <MenuItem value="en">English</MenuItem>
                          <MenuItem value="es">Español</MenuItem>
                          <MenuItem value="fr">Français</MenuItem>
                        </Select>
                  </ListItem>

                  {/* Telegram Integration */}
                  <ListItem>
                    <ListItemIcon>
                      <TelegramIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Telegram Notifications" 
                      secondary={telegramConnected 
                        ? "Connected - You will receive notifications on Telegram" 
                        : "Connect to receive notifications on Telegram"
                      }
                    />
                    <Button
                      variant="outlined"
                      color={telegramConnected ? "error" : "primary"}
                      onClick={() => {
                        if (telegramConnected) {
                          // Handle disconnect
                          telegramBot.disconnect(userId);
                          setTelegramConnected(false);
                        } else {
                          // Handle connect
                          window.open(`https://t.me/TaskPilot_jm_bot?start=${userId}`, '_blank');
                        }
                      }}
                      disabled={!userId}
                    >
                      {telegramConnected ? "Disconnect" : "Connect Telegram"}
                    </Button>
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                    <List subheader={
                      <ListSubheader sx={{ bgcolor: 'transparent', pl: 0 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          Notifications
                        </Typography>
                      </ListSubheader>
                    }>
                      <ListItem>
                        <ListItemIcon>
                          <NotificationsIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Push Notifications" 
                          secondary={
                            notificationPermission === 'denied' 
                              ? "Notifications are blocked. Please enable them in your browser settings."
                              : "Get notified about upcoming tasks"
                          }
                        />
                        <Switch
                          checked={notificationsEnabled}
                          onChange={toggleNotifications}
                          disabled={notificationPermission === 'denied'}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <NotificationsIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Email Notifications" 
                          secondary="Receive task reminders via email"
                        />
                        <Switch
                          checked={emailNotifications}
                          onChange={(e) => setEmailNotifications(e.target.checked)}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <TimerIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Reminder Time" 
                          secondary="Minutes before task due time"
                        />
                        <TextField
                          type="number"
                          value={reminderTime}
                          onChange={(e) => setReminderTime(Number(e.target.value))}
                          size="small"
                          sx={{ width: { xs: 70, sm: 80 } }}
                          InputProps={{ 
                            inputProps: { min: 5, max: 60 },
                            sx: { textAlign: 'center' }
                          }}
                        />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <List subheader={
                      <ListSubheader sx={{ bgcolor: 'transparent', pl: 0 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          Task Management
                        </Typography>
                      </ListSubheader>
                    }>
                      <ListItem>
                        <ListItemIcon>
                          <AccessTimeIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Working Hours" 
                          secondary="Set your typical working hours"
                        />
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            type="time"
                            value={workingHoursStart}
                            onChange={(e) => setWorkingHoursStart(e.target.value)}
                            size="small"
                          />
                          <Typography variant="body2">to</Typography>
                          <TextField
                            type="time"
                            value={workingHoursEnd}
                            onChange={(e) => setWorkingHoursEnd(e.target.value)}
                            size="small"
                          />
                        </Box>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <ScheduleIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Default Task Duration" 
                          secondary="Minutes allocated for new tasks"
                        />
                        <TextField
                          type="number"
                          value={defaultTaskDuration}
                          onChange={(e) => setDefaultTaskDuration(Number(e.target.value))}
                          size="small"
                          sx={{ width: 80 }}
                          InputProps={{ inputProps: { min: 15, max: 480 } }}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <TimerIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Auto-escalate Overdue Tasks" 
                          secondary="Automatically increase priority of overdue tasks"
                        />
                        <Switch
                          checked={autoEscalateOverdue}
                          onChange={(e) => setAutoEscalateOverdue(e.target.checked)}
                        />
                      </ListItem>
                    </List>

                    <Divider sx={{ my: 2 }} />

                    <List subheader={
                      <ListSubheader sx={{ bgcolor: 'transparent', pl: 0 }}>
                        <Typography variant="h6" component="h2" gutterBottom>
                          AI Assistant
                        </Typography>
                      </ListSubheader>
                    }>
                      <ListItem>
                        <ListItemIcon>
                          <SmartToyIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="AI Assistant" 
                          secondary="Enable AI-powered suggestions and analysis"
                        />
                        <Switch
                          checked={aiEnabled}
                          onChange={(e) => setAiEnabled(e.target.checked)}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <TimerIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Suggestion Frequency" 
                          secondary="How often AI provides suggestions"
                        />
                        <Select
                          value={aiSuggestionFrequency}
                          onChange={(e) => setAiSuggestionFrequency(e.target.value)}
                          size="small"
                          sx={{ width: 120 }}
                        >
                          <MenuItem value="low">Low</MenuItem>
                          <MenuItem value="medium">Medium</MenuItem>
                          <MenuItem value="high">High</MenuItem>
                        </Select>
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <TimerIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Focus Time Length" 
                          secondary="Minutes per Pomodoro session"
                        />
                        <TextField
                          type="number"
                          value={focusTimeLength}
                          onChange={(e) => setFocusTimeLength(Number(e.target.value))}
                          size="small"
                          sx={{ width: 80 }}
                          InputProps={{ inputProps: { min: 15, max: 60 } }}
                        />
                      </ListItem>

                      <ListItem>
                        <ListItemIcon>
                          <TimerIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Break Time Length" 
                          secondary="Minutes per break"
                        />
                        <TextField
                          type="number"
                          value={breakTimeLength}
                          onChange={(e) => setBreakTimeLength(Number(e.target.value))}
                          size="small"
                          sx={{ width: 80 }}
                          InputProps={{ inputProps: { min: 3, max: 15 } }}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Paper sx={{ p: 3, mb: 3, position: 'sticky', top: 88 }}>
                    <Typography variant="h6" gutterBottom>
                      Actions
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <Button
                        variant="contained"
                        startIcon={<SaveIcon />}
                        onClick={handleSave}
                        fullWidth
                      >
                        Save Changes
                      </Button>
                      <Button
                        variant="outlined"
                        startIcon={<RestartAltIcon />}
                        onClick={handleReset}
                        fullWidth
                      >
                        Reset to Defaults
                      </Button>
                    </Box>

                    <Box sx={{ mt: 3 }}>
                      <Typography variant="subtitle2" gutterBottom>
                        Calendar Integration
                      </Typography>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={calendarSync}
                            onChange={(e) => setCalendarSync(e.target.checked)}
                          />
                        }
                        label="Sync with Outlook Calendar"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={blockCalendarEvents}
                            onChange={(e) => setBlockCalendarEvents(e.target.checked)}
                          />
                        }
                        label="Block calendar during focus time"
                      />
                    </Box>
                  </Paper>
                </Grid>
              </Grid>
            </TabPanel>

            {/* Feature Upgrades Tab */}
            {/* Notifications Tab */}
            <TabPanel value={currentTab} index={1}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <NotificationsIcon color="primary" />
                  Notification Settings
                </Typography>

                <List>
                  {/* Task Due Notifications */}
                  <ListItem>
                    <ListItemIcon>
                      <TimerIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Task Due Notifications" 
                      secondary="Get notified before tasks are due"
                    />
                    <Switch
                      checked={notificationsEnabled}
                      onChange={toggleNotifications}
                      disabled={notificationPermission === 'denied'}
                    />
                  </ListItem>

                  {/* Daily Summary */}
                  <ListItem>
                    <ListItemIcon>
                      <AccessTimeIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Daily Summary" 
                      secondary="Get a daily overview of your tasks"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Switch
                        checked={dailySummaryEnabled}
                        onChange={(e) => setDailySummaryEnabled(e.target.checked)}
                      />
                      <TextField
                        type="time"
                        value={dailySummaryTime}
                        onChange={(e) => setDailySummaryTime(e.target.value)}
                        size="small"
                        disabled={!dailySummaryEnabled}
                      />
                    </Box>
                  </ListItem>

                  {/* Weekly Summary */}
                  <ListItem>
                    <ListItemIcon>
                      <EventIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Weekly Summary" 
                      secondary="Get a weekly overview of your tasks"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Switch
                        checked={weeklySummaryEnabled}
                        onChange={(e) => setWeeklySummaryEnabled(e.target.checked)}
                      />
                      <Select
                        value={weeklySummaryDay}
                        onChange={(e) => setWeeklySummaryDay(e.target.value)}
                        size="small"
                        sx={{ width: 120 }}
                        disabled={!weeklySummaryEnabled}
                      >
                        <MenuItem value={1}>Monday</MenuItem>
                        <MenuItem value={2}>Tuesday</MenuItem>
                        <MenuItem value={3}>Wednesday</MenuItem>
                        <MenuItem value={4}>Thursday</MenuItem>
                        <MenuItem value={5}>Friday</MenuItem>
                        <MenuItem value={6}>Saturday</MenuItem>
                        <MenuItem value={0}>Sunday</MenuItem>
                      </Select>
                      <TextField
                        type="time"
                        value={weeklySummaryTime}
                        onChange={(e) => setWeeklySummaryTime(e.target.value)}
                        size="small"
                        disabled={!weeklySummaryEnabled}
                      />
                    </Box>
                  </ListItem>

                  {/* Monthly Summary */}
                  <ListItem>
                    <ListItemIcon>
                      <CalendarIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Monthly Summary" 
                      secondary="Get a monthly overview of your tasks"
                    />
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Switch
                        checked={monthlySummaryEnabled}
                        onChange={(e) => setMonthlySummaryEnabled(e.target.checked)}
                      />
                      <TextField
                        type="number"
                        value={monthlySummaryDay}
                        onChange={(e) => setMonthlySummaryDay(Number(e.target.value))}
                        size="small"
                        sx={{ width: 70 }}
                        InputProps={{ inputProps: { min: 1, max: 28 } }}
                        disabled={!monthlySummaryEnabled}
                      />
                      <TextField
                        type="time"
                        value={monthlySummaryTime}
                        onChange={(e) => setMonthlySummaryTime(e.target.value)}
                        size="small"
                        disabled={!monthlySummaryEnabled}
                      />
                    </Box>
                  </ListItem>
                </List>

                <Divider sx={{ my: 2 }} />

                {/* Custom Notifications */}
                <Box sx={{ mb: 2 }}>
                  <Typography variant="h6" gutterBottom>
                    Custom Notifications
                  </Typography>
                  
                  {customNotifications.map((notification, index) => (
                    <Paper key={index} variant="outlined" sx={{ p: 2, mb: 2 }}>
                      <Grid container spacing={2} alignItems="center">
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Title"
                            value={notification.title}
                            onChange={(e) => handleCustomNotificationChange(index, 'title', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={4}>
                          <TextField
                            fullWidth
                            label="Message"
                            value={notification.message}
                            onChange={(e) => handleCustomNotificationChange(index, 'message', e.target.value)}
                            size="small"
                          />
                        </Grid>
                        <Grid item xs={12} sm={3}>
                          <TextField
                            type="time"
                            value={notification.time}
                            onChange={(e) => handleCustomNotificationChange(index, 'time', e.target.value)}
                            size="small"
                            fullWidth
                          />
                        </Grid>
                        <Grid item xs={12} sm={1}>
                          <IconButton onClick={() => removeCustomNotification(index)} color="error">
                            <DeleteIcon />
                          </IconButton>
                        </Grid>
                      </Grid>
                    </Paper>
                  ))}

                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={addCustomNotification}
                  >
                    Add Custom Notification
                  </Button>
                </Box>
              </Paper>
            </TabPanel>

            <TabPanel value={currentTab} index={2}>
              <Paper sx={{ p: 3 }}>
                <FeatureUpgrades 
                  featureUpgrades={featureUpgrades}
                  setFeatureUpgrades={setFeatureUpgrades}
                  handleToggleFeature={handleToggleFeature}
                />

                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                  >
                    Save Upgrade Progress
                  </Button>
                </Box>
              </Paper>
            </TabPanel>

            {/* Database Tab */}
            <TabPanel value={currentTab} index={3}>
              <Paper sx={{ p: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <StorageIcon />
                  Database Connection
                </Typography>

                <Stack spacing={2}>
                  <Button
                    variant="outlined"
                    onClick={handleTestConnection}
                    disabled={isLoading}
                    startIcon={<StorageIcon />}
                  >
                    Test Database Connection
                  </Button>

                  <Button
                    variant="outlined"
                    onClick={handleVerifySchema}
                    disabled={isLoading}
                    startIcon={<StorageIcon />}
                  >
                    Verify Database Schema
                  </Button>

                  {testResult && (
                    <Alert severity={testResult.success ? "success" : "error"}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {testResult.success ? "Connection Successful" : "Connection Failed"}
                      </Typography>
                      <Typography variant="body2">
                        {testResult.message || (testResult.success ? "Successfully connected to database!" : "Failed to connect to database.")}
                      </Typography>
                    </Alert>
                  )}

                  {schemaResult && (
                    <Alert severity={schemaResult.success ? "success" : "error"}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {schemaResult.success ? "Schema Verification Successful" : "Schema Verification Failed"}
                      </Typography>
                      <Typography variant="body2">
                        {schemaResult.message}
                      </Typography>
                    </Alert>
                  )}

                  {(testError || (!testResult?.success && !schemaResult?.success)) && (
                    <>
                      <Button
                        fullWidth
                        sx={{ mt: 2 }}
                        endIcon={showDatabaseDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        onClick={() => setShowDatabaseDetails(!showDatabaseDetails)}
                      >
                        {showDatabaseDetails ? 'Hide Troubleshooting' : 'Show Troubleshooting'}
                      </Button>

                      <Collapse in={showDatabaseDetails}>
                        <Paper sx={{ p: 3 }} variant="outlined">
                          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <HelpIcon color="info" />
                            Troubleshooting Steps
                          </Typography>
                          <List>
                            <ListItem>
                              <ListItemText 
                                primary="Check if Database is Running" 
                                secondary="Make sure your database server is running at the URL you specified." 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Verify API Key" 
                                secondary="Double-check that you've copied the correct API key from your dashboard." 
                              />
                            </ListItem>
                            <ListItem>
                              <ListItemText 
                                primary="Run Database Schema" 
                                secondary="Make sure to run the schema.sql script to create all necessary tables." 
                              />
                            </ListItem>
                          </List>
                        </Paper>
                      </Collapse>
                    </>
                  )}
                </Stack>
              </Paper>
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Settings;