import React, { useState, useEffect } from 'react';
import supabase from '../services/supabaseClient';
import { 
  Box, 
  Grid, 
  Typography, 
  Paper, 
  useTheme,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  styled,
  Snackbar,
  Button,
  Chip
} from '@mui/material';
import MuiAlert from '@mui/material/Alert';
import {
  SmartToy as SmartToyIcon,
  Refresh as RefreshIcon,
  AccessTime as AccessTimeIcon,
  TipsAndUpdates as TipsAndUpdatesIcon,
  Apps as AppsIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import TaskList from './TaskList';
import Calendar from './Calendar';
import AIAssistant from './AIAssistant';
import Settings from './Settings';
import { getTasks, createTask, updateTask, deleteTask, toggleTaskCompletion, toggleTaskPin, toggleTaskEscalation, rescheduleTask } from '../services/index';
import { analyzeTask, prioritizeTasks, getTaskManagementAdvice } from '../services/aiService';


function Tasks({ user, onLogout }) {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [currentTimeframe, setCurrentTimeframe] = useState('today');
  const [activeTab, setActiveTab] = useState('tasks');
  const [message, setMessage] = useState({ text: '', type: 'info', open: false });
  const theme = useTheme();

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const fetchData = async () => {
      setIsLoading(true);
      try {
        const fetchedTasks = await getTasks(currentTimeframe);
        if (!mounted) return;
        
        if (fetchedTasks.error) {
          console.error('Error fetching tasks:', fetchedTasks.error);
        } else {
          console.log('Fetched tasks:', fetchedTasks);
          setTasks(fetchedTasks.data || []);
          
          const { data: aiData } = await getTaskManagementAdvice();
          if (mounted) setAiSuggestion(aiData?.advice || "Let's help you stay focused and productive today.");
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

    // Set up real-time subscription to tasks table using Supabase's channel API
    // This subscribes to all task changes (insert, update, delete) for the current user
    // and automatically refreshes the task list when changes occur
    const channel = supabase
      .channel('task-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tasks',
          filter: `user_id=eq.${user?.id}`
        },
        (payload) => {
          console.log('Real-time update:', payload);
          const { eventType, new: newRecord, old: oldRecord } = payload;
          
          // Only refresh if the task belongs to the current user
          if ((newRecord?.user_id === user?.id) || (oldRecord?.user_id === user?.id)) {
            console.log('Task change detected for current user, refreshing data...');
            fetchData();
          }
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      // Clean up subscription when component unmounts
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [currentTimeframe, user?.id]);

  const handleCreateTask = async (newTask) => {
    try {
      if (!user) {
        console.error('User not authenticated when attempting to create task');
        return;
      }

      console.log('Creating new task with authenticated user:', user.email);
      console.log('Task data:', newTask);
      
      const { data, error } = await createTask(newTask);
      
      if (error) {
        console.error('Error creating task:', error);
        return;
      }

      // Always fetch fresh data after creating a task
      const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
      
      if (refreshError) {
        console.error('Error refreshing tasks after creation:', refreshError);
        // If refresh fails, at least add the new task to the current list
        setTasks(prevTasks => [...prevTasks, data]);
      } else {
        console.log('Tasks refreshed successfully:', refreshedTasks);
        setTasks(refreshedTasks || []);
      }

      setMessage({
        text: 'Task created successfully',
        type: 'success',
        open: true
      });
    } catch (err) {
      console.error('Error creating task:', err);
      setMessage({
        text: 'Failed to create task',
        type: 'error',
        open: true
      });
    }
  };

  const handleUpdateTask = async (task) => {
    console.log('Updating task:', task);
    
    setIsLoading(true);
    try {
      const { error } = await updateTask(task);
      
      if (error) {
        console.error('Error updating task:', error);
        setMessage({
          text: 'Failed to update task',
          type: 'error',
          open: true
        });
        return;
      }
      
      // Always fetch fresh data after updating a task
      const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
      
      if (refreshError) {
        console.error('Error refreshing tasks after update:', refreshError);
        // If refresh fails, at least update the task in the current list
        setTasks(prevTasks => 
          prevTasks.map(t => t.id === task.id ? task : t)
        );
      } else {
        console.log('Tasks refreshed successfully:', refreshedTasks);
        setTasks(refreshedTasks || []);
      }
      
      setMessage({
        text: 'Task updated successfully',
        type: 'success',
        open: true
      });
    } catch (err) {
      console.error('Error in handleUpdateTask:', err);
      setMessage({
        text: 'Failed to update task',
        type: 'error',
        open: true
      });
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
        setMessage({
          text: 'Failed to delete task',
          type: 'error',
          open: true
        });
        return;
      }

      // Always fetch fresh data after deleting a task
      const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
      
      if (refreshError) {
        console.error('Error refreshing tasks after deletion:', refreshError);
        // If refresh fails, at least remove the task from the current list
        setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
      } else {
        console.log('Tasks refreshed successfully:', refreshedTasks);
        setTasks(refreshedTasks || []);
      }

      setMessage({
        text: 'Task deleted successfully',
        type: 'success',
        open: true
      });
    } catch (err) {
      console.error('Error deleting task:', err);
      setMessage({
        text: 'Failed to delete task',
        type: 'error',
        open: true
      });
    }
  };

  const handleToggleComplete = async (taskId) => {
    try {
      console.log('Toggling completion for task:', taskId);
      const { data, error } = await toggleTaskCompletion(taskId);
      
      if (error) {
        console.error('Error toggling task completion:', error);
        setMessage({
          text: 'Failed to toggle task completion',
          type: 'error',
          open: true
        });
        return;
      }

      // Always fetch fresh data after toggling completion
      const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
      
      if (refreshError) {
        console.error('Error refreshing tasks after completion toggle:', refreshError);
        // If refresh fails, at least update the task in the current list
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === data.id ? data : task
        ));
      } else {
        console.log('Tasks refreshed successfully:', refreshedTasks);
        setTasks(refreshedTasks || []);
      }
    } catch (err) {
      console.error('Error toggling task completion:', err);
      setMessage({
        text: 'Failed to toggle task completion',
        type: 'error',
        open: true
      });
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
        setMessage({
          text: 'Failed to reschedule task',
          type: 'error',
          open: true
        });
        return;
      }

      // Always fetch fresh data after rescheduling
      const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
      
      if (refreshError) {
        console.error('Error refreshing tasks after rescheduling:', refreshError);
        // If refresh fails, at least update the task in the current list
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === data.id ? data : task
        ));
      } else {
        console.log('Tasks refreshed successfully:', refreshedTasks);
        setTasks(refreshedTasks || []);
      }

      setMessage({
        text: 'Task rescheduled successfully',
        type: 'success',
        open: true
      });
    } catch (err) {
      console.error('Error rescheduling task:', err);
      setMessage({
        text: 'Failed to reschedule task',
        type: 'error',
        open: true
      });
    }
  };

  const handleTogglePin = async (taskId) => {
    try {
      const { data, error } = await toggleTaskPin(taskId);
      if (error) {
        console.error('Error toggling task pin:', error);
        setMessage({
          text: 'Failed to toggle pin status',
          type: 'error',
          open: true
        });
        return;
      }

      // Always fetch fresh data after toggling pin
      const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
      
      if (refreshError) {
        console.error('Error refreshing tasks after pin toggle:', refreshError);
        // If refresh fails, at least update the task in the current list
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === taskId ? { ...task, pinned: data.pinned } : task
        ));
      } else {
        console.log('Tasks refreshed successfully:', refreshedTasks);
        setTasks(refreshedTasks || []);
      }
    } catch (err) {
      console.error('Error toggling task pin:', err);
      setMessage({
        text: 'Failed to toggle pin status',
        type: 'error',
        open: true
      });
    }
  };

  const handleToggleEscalation = async (taskId) => {
    try {
      const { data, error } = await toggleTaskEscalation(taskId);
      if (error) {
        console.error('Error toggling task escalation:', error);
        setMessage({
          text: 'Failed to toggle escalation',
          type: 'error',
          open: true
        });
        return;
      }

      // Always fetch fresh data after toggling escalation
      const { data: refreshedTasks, error: refreshError } = await getTasks(currentTimeframe);
      
      if (refreshError) {
        console.error('Error refreshing tasks after escalation toggle:', refreshError);
        // If refresh fails, at least update the task in the current list
        setTasks(prevTasks => prevTasks.map(task => 
          task.id === taskId ? { ...task, escalated: data.escalated } : task
        ));
      } else {
        console.log('Tasks refreshed successfully:', refreshedTasks);
        setTasks(refreshedTasks || []);
      }
    } catch (err) {
      console.error('Error toggling task escalation:', err);
      setMessage({
        text: 'Failed to toggle escalation',
        type: 'error',
        open: true
      });
    }
  };

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
                    tasks={tasks.filter(task => {
                      const taskDate = new Date(task.dueDate);
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      const isOverdue = taskDate < today;

                      switch(currentTimeframe) {
                        case 'today':
                          return taskDate.getTime() === today.getTime() || isOverdue;
                        case 'tomorrow':
                          const tomorrow = new Date(today);
                          tomorrow.setDate(tomorrow.getDate() + 1);
                          return taskDate.getTime() === tomorrow.getTime();
                        case 'week':
                          const weekEnd = new Date(today);
                          weekEnd.setDate(weekEnd.getDate() + 7);
                          return taskDate >= today && taskDate <= weekEnd;
                        case 'month':
                          const monthEnd = new Date(today);
                          monthEnd.setDate(monthEnd.getDate() + 30);
                          return taskDate >= today && taskDate <= monthEnd;
                        case 'upcoming':
                          return taskDate >= today;
                        case 'overdue':
                          return isOverdue;
                        default:
                          return true;
                      }
                    })}
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
              <Grid item xs={12} md={8}>
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
              <Grid item xs={12} md={4}>
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
    <Box>
      {/* Alert component */}
      {React.useMemo(() => {
        const Alert = React.forwardRef(function Alert(props, ref) {
          return (
            <MuiAlert
              elevation={6}
              variant="filled"
              ref={ref}
              {...props}
            />
          );
        });

        return (
          <Snackbar
            open={message.open}
            autoHideDuration={3000}
            onClose={() => setMessage(prev => ({ ...prev, open: false }))}
          >
            <Alert
              onClose={() => setMessage(prev => ({ ...prev, open: false }))}
              severity={message.type}
              sx={{ width: '100%' }}
            >
              {message.text}
            </Alert>
          </Snackbar>
        );
      }, [message])}

      {renderContent()}
    </Box>
  );
}

export default Tasks;
