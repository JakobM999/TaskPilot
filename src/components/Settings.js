import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Brightness4 as DarkModeIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
  Timer as TimerIcon,
  SmartToy as SmartToyIcon,
  Language as LanguageIcon,
  RestartAlt as RestartAltIcon,
  AccessTime as AccessTimeIcon,
  Save as SaveIcon,
} from '@mui/icons-material';

function Settings() {
  // Theme settings
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');

  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [desktopNotifications, setDesktopNotifications] = useState(true);
  const [reminderTime, setReminderTime] = useState(15);

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

  const [saveStatus, setSaveStatus] = useState(null);

  const handleSave = () => {
    // Here we'll save to local storage for now
    // Later this will be integrated with Supabase
    const settings = {
      appearance: { darkMode, language },
      notifications: { emailNotifications, desktopNotifications, reminderTime },
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
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3, mb: 3 }}>
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
                  <NotificationsIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Desktop Notifications" 
                  secondary="Show notifications on your desktop"
                />
                <Switch
                  checked={desktopNotifications}
                  onChange={(e) => setDesktopNotifications(e.target.checked)}
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
                  sx={{ width: 80 }}
                  InputProps={{ inputProps: { min: 5, max: 60 } }}
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
    </Box>
  );
}

export default Settings;