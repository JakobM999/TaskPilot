import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  AppBar, 
  Toolbar, 
  Button,
  useTheme,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Tooltip
} from '@mui/material';
import { format } from 'date-fns';
import { da } from 'date-fns/locale';
import MenuIcon from '@mui/icons-material/Menu';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import TaskList from './TaskList';
import Calendar from './Calendar';
import AIAssistant from './AIAssistant';
import Settings from './Settings';
import { signOut } from '../services/index';
import { getTasks, createTask, updateTask, deleteTask, toggleTaskCompletion, toggleTaskPin, toggleTaskEscalation, rescheduleTask } from '../services/index';
import { analyzeTask, prioritizeTasks, getTaskManagementAdvice } from '../services/aiService';

const drawerWidth = 240;

function Tasks({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTimeframe, setCurrentTimeframe] = useState('today');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const theme = useTheme();

  // Fetch tasks and initial AI advice
  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: taskData, error: taskError } = await getTasks(currentTimeframe);
        if (!mounted) return;
        
        if (taskError) {
          console.error('Error fetching tasks:', taskError);
        } else {
          setTasks(taskData || []);
          
          const { data: aiData } = await getTaskManagementAdvice();
          if (!mounted) setAiSuggestion(aiData?.advice || "Let's help you stay focused and productive today.");
        }
      } catch (err) {
        console.error('Error in tasks view:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      mounted = false;
    };
  }, [currentTimeframe]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      onLogout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleCreateTask = async (newTask) => {
    try {
      // Check if we have the user object available
      if (!user) {
        console.error('User not authenticated when attempting to create task');
        return;
      }

      console.log('Creating new task with authenticated user:', user.email);
      console.log('Task data:', newTask);
      
      const { data, error } = await createTask(newTask);
      
      if (error) {
        console.error('Error creating task:', error);
      } else {
        console.log('Task created successfully:', data);
        
        // Refresh the tasks list to ensure database sync
        const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
        
        if (refreshError) {
          console.error('Error refreshing tasks after creation:', refreshError);
          // Fall back to updating local state directly
          setTasks([...tasks, data]);
        } else {
          console.log('Tasks refreshed successfully:', refreshedTasks);
          setTasks(refreshedTasks || []);
        }
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    try {
      setIsLoading(true);
      console.log('Updating task:', updatedTask);
      const { data, error } = await updateTask(updatedTask);
      
      if (error) {
        console.error('Error updating task:', error);
      } else {
        console.log('Task updated successfully:', data);
        // Update local state directly with the returned task data
        setTasks(tasks.map(task => task.id === data.id ? data : task));
      }
    } catch (err) {
      console.error('Error updating task:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      console.log('Deleting task:', taskId);
      const { error } = await deleteTask(taskId);
      
      if (error) {
        console.error('Error deleting task:', error);
      } else {
        console.log('Task deleted successfully');
        // Update local state directly
        setTasks(tasks.filter(task => task.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleComplete = async (taskId) => {
    try {
      console.log('Toggling completion for task:', taskId);
      const { data, error } = await toggleTaskCompletion(taskId);
      
      if (error) {
        console.error('Error toggling task completion:', error);
      } else {
        console.log('Task completion toggled successfully:', data);
        // Update local state directly with the returned task data
        setTasks(tasks.map(task => task.id === data.id ? data : task));
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
    }
  };

  const handleAnalyzeTask = async (task) => {
    try {
      const { data, error } = await analyzeTask(task);
      if (error) {
        console.error('Error analyzing task:', error);
      } else {
        setAiSuggestion(data.suggestion);
      }
    } catch (err) {
      console.error('Error analyzing task:', err);
    }
  };

  const handlePrioritizeTasks = async () => {
    try {
      const { data, error } = await prioritizeTasks(tasks);
      if (error) {
        console.error('Error prioritizing tasks:', error);
      } else {
        setTasks(data.prioritizedTasks);
        setAiSuggestion(data.suggestion);
      }
    } catch (err) {
      console.error('Error prioritizing tasks:', err);
    }
  };

  const handleRescheduleTask = async (taskId) => {
    try {
      const { data, error } = await rescheduleTask(taskId);
      if (error) {
        console.error('Error rescheduling task:', error);
      } else {
        // Update local state directly with the returned task data
        setTasks(tasks.map(task => task.id === data.id ? data : task));
      }
    } catch (err) {
      console.error('Error rescheduling task:', err);
    }
  };

  const handleTogglePin = async (taskId) => {
    try {
      const { data, error } = await toggleTaskPin(taskId);
      if (error) {
        console.error('Error toggling task pin:', error);
      } else {
        // Update local state with the pinned status
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, pinned: data.pinned } : task
        ));
      }
    } catch (err) {
      console.error('Error toggling task pin:', err);
    }
  };

  const handleToggleEscalation = async (taskId) => {
    try {
      const { data, error } = await toggleTaskEscalation(taskId);
      if (error) {
        console.error('Error toggling task escalation:', error);
      } else {
        // Update local state with the escalated status
        setTasks(tasks.map(task => 
          task.id === taskId ? { ...task, escalated: data.escalated } : task
        ));
      }
    } catch (err) {
      console.error('Error toggling task escalation:', err);
    }
  };

  const handleSidebarCollapse = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const drawer = (
    <Box>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        px: 2,
        py: 1 
      }}>
        {!sidebarCollapsed && (
          <Typography variant="h6" component="div" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
            TaskPilot
          </Typography>
        )}
        <IconButton onClick={handleSidebarCollapse}>
          {sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <List>
        <ListItem 
          button 
          onClick={() => setActiveTab('tasks')}
          selected={activeTab === 'tasks'}
        >
          <ListItemIcon>
            <Tooltip title="Tasks" placement="right">
              <DashboardIcon />
            </Tooltip>
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary="Tasks" />}
        </ListItem>
        <ListItem 
          button 
          onClick={() => setActiveTab('calendar')}
          selected={activeTab === 'calendar'}
        >
          <ListItemIcon>
            <Tooltip title="Calendar" placement="right">
              <CalendarMonthIcon />
            </Tooltip>
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary="Calendar" />}
        </ListItem>
        <ListItem 
          button 
          onClick={() => setActiveTab('settings')}
          selected={activeTab === 'settings'}
        >
          <ListItemIcon>
            <Tooltip title="Settings" placement="right">
              <SettingsIcon />
            </Tooltip>
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary="Settings" />}
        </ListItem>
        <ListItem button onClick={handleSignOut}>
          <ListItemIcon>
            <Tooltip title="Sign Out" placement="right">
              <LogoutIcon />
            </Tooltip>
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary="Sign Out" />}
        </ListItem>
      </List>
    </Box>
  );

  const renderContent = () => {
    switch (activeTab) {
      case 'calendar':
        return (
          <Box sx={{ p: 3 }}>
            <Typography variant="h5" component="h2" gutterBottom>
              Calendar Overview
            </Typography>
            <Grid container spacing={3}>
              <Grid item xs={12} lg={8}>
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <Calendar 
                    tasks={tasks}
                    onToggleComplete={handleToggleComplete}
                    onTogglePin={handleTogglePin}
                    isLoading={isLoading}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} lg={4}>
                <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <AIAssistant 
                    suggestion={aiSuggestion}
                    onPrioritizeTasks={handlePrioritizeTasks}
                    onGetAdvice={async () => {
                      const { data } = await getTaskManagementAdvice();
                      setAiSuggestion(data.advice);
                    }}
                    isLoading={isLoading}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
      case 'settings':
        return (
          <Box sx={{ p: 3 }}>
            <Settings />
          </Box>
        );
      default:
        return (
          <Box sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={7} lg={8}>
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <TaskList 
                    tasks={tasks}
                    onCreateTask={handleCreateTask}
                    onUpdateTask={handleUpdateTask}
                    onDeleteTask={handleDeleteTask}
                    onToggleComplete={handleToggleComplete}
                    onAnalyzeTask={handleAnalyzeTask}
                    onRescheduleTask={handleRescheduleTask}
                    onTimeframeChange={setCurrentTimeframe}
                    onTogglePin={handleTogglePin}
                    onToggleEscalation={handleToggleEscalation}
                    currentTimeframe={currentTimeframe}
                    isLoading={isLoading}
                  />
                </Paper>
              </Grid>
              <Grid item xs={12} md={5} lg={4}>
                <Paper sx={{ p: 3, mb: 3, borderRadius: 2 }}>
                  <AIAssistant 
                    suggestion={aiSuggestion}
                    onPrioritizeTasks={handlePrioritizeTasks}
                    onGetAdvice={async () => {
                      const { data } = await getTaskManagementAdvice();
                      setAiSuggestion(data.advice);
                    }}
                    isLoading={isLoading}
                  />
                </Paper>
              </Grid>
            </Grid>
          </Box>
        );
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${sidebarCollapsed ? 56 : drawerWidth}px)` },
          ml: { sm: sidebarCollapsed ? 56 : drawerWidth },
          zIndex: theme.zIndex.drawer + 1,
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            {format(new Date(), 'EEEE, d. MMMM yyyy', { locale: da })}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ display: { xs: 'none', sm: 'block' } }}>
              Welcome, {user?.user_metadata?.full_name || user?.email || 'User'}
            </Typography>
            <Button color="inherit" onClick={handleSignOut} startIcon={<LogoutIcon />}>
              Sign Out
            </Button>
          </Box>
        </Toolbar>
      </AppBar>
      
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box', 
            width: drawerWidth,
          },
        }}
      >
        {drawer}
      </Drawer>
      
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': { 
            boxSizing: 'border-box',
            width: sidebarCollapsed ? 56 : drawerWidth,
            transition: theme.transitions.create('width', {
              easing: theme.transitions.easing.sharp,
              duration: theme.transitions.duration.enteringScreen,
            }),
            overflowX: 'hidden',
          },
        }}
        open
      >
        {drawer}
      </Drawer>
      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: '100%',
          mt: 8,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.enteringScreen,
          }),
          marginLeft: {
            xs: 0,
            sm: sidebarCollapsed ? '56px' : `${drawerWidth}px`
          }
        }}
      >
        {renderContent()}
      </Box>
    </Box>
  );
}

export default Tasks;