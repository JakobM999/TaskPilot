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
import { getTasks, createTask, updateTask, deleteTask, toggleTaskCompletion, rescheduleTask } from '../services/index';
import { analyzeTask, prioritizeTasks, getTaskManagementAdvice } from '../services/aiService';

const drawerWidth = 240;

function Dashboard({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [currentTimeframe, setCurrentTimeframe] = useState('today');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
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
          // Don't filter tasks here anymore, as it's handled in taskService
          setTasks(taskData || []);
          
          // Get initial AI advice
          const { data: aiData } = await getTaskManagementAdvice();
          if (!mounted) setAiSuggestion(aiData?.advice || "Let's help you stay focused and productive today.");
        }
      } catch (err) {
        console.error('Error in dashboard:', err);
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
      const { data, error } = await createTask(newTask);
      if (error) {
        console.error('Error creating task:', error);
      } else {
        setTasks([...tasks, data]);
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  const handleUpdateTask = async (updatedTask) => {
    try {
      const { data, error } = await updateTask(updatedTask);
      if (error) {
        console.error('Error updating task:', error);
      } else {
        setTasks(tasks.map(task => task.id === data.id ? data : task));
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  const handleDeleteTask = async (taskId) => {
    try {
      const { error } = await deleteTask(taskId);
      if (error) {
        console.error('Error deleting task:', error);
      } else {
        setTasks(tasks.filter(task => task.id !== taskId));
      }
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  const handleToggleComplete = async (taskId) => {
    try {
      const { data, error } = await toggleTaskCompletion(taskId);
      if (error) {
        console.error('Error toggling task completion:', error);
      } else {
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
      await rescheduleTask(taskId);
      // Refresh tasks after rescheduling
      const { data } = await getTasks(currentTimeframe);
      setTasks(data);
    } catch (err) {
      console.error('Error rescheduling task:', err);
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
          onClick={() => setActiveTab('dashboard')}
          selected={activeTab === 'dashboard'}
        >
          <ListItemIcon>
            <Tooltip title="Dashboard" placement="right">
              <DashboardIcon />
            </Tooltip>
          </ListItemIcon>
          {!sidebarCollapsed && <ListItemText primary="Dashboard" />}
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

export default Dashboard;