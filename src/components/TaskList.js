import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton,
  Checkbox,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Grid,
  Divider,
  Skeleton,
  Tooltip,
  InputAdornment,
  Fab,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import MicIcon from '@mui/icons-material/Mic';
import FilterListIcon from '@mui/icons-material/FilterList';
import WarningIcon from '@mui/icons-material/Warning';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScheduleIcon from '@mui/icons-material/Schedule';

function TaskList({
  tasks = [], // Provide default empty array
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  onAnalyzeTask,
  onRescheduleTask,
  onTimeframeChange,
  currentTimeframe,
  isLoading
}) {
  const [openDialog, setOpenDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    title: '',
    description: '',
    dueDate: new Date().toISOString().split('T')[0], // Default to today
    priority: 'medium',
  });
  const [timeframe, setTimeframe] = useState(currentTimeframe);
  const [taskSummary, setTaskSummary] = useState(null);

  const timeframeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'This Week' },
    { value: 'month', label: 'This Month' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const handleReschedule = async (taskId) => {
    // Use the parent callback instead of managing state locally
    onRescheduleTask(taskId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentTask({
      ...currentTask,
      [name]: value,
    });
  };

  const handleOpenNewTaskDialog = () => {
    setIsEditing(false);
    setCurrentTask({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0], // Default to today
      priority: 'medium',
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (task) => {
    setIsEditing(true);
    setCurrentTask({ ...task });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleSaveTask = () => {
    if (isEditing) {
      onUpdateTask(currentTask);
    } else {
      onCreateTask(currentTask);
    }
    setOpenDialog(false);
  };

  const handleVoiceInput = () => {
    setCurrentTask({
      ...currentTask,
      title: currentTask.title + " (voice input sample)",
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'error';
      case 'medium':
        return 'warning';
      case 'low':
        return 'success';
      default:
        return 'primary';
    }
  };

  const isFormValid = () => {
    return currentTask.title.trim() !== '' && currentTask.dueDate.trim() !== '';
  };

  const handleTimeframeChange = (e) => {
    const newTimeframe = e.target.value;
    setTimeframe(newTimeframe);
    onTimeframeChange(newTimeframe);
  };

  if (isLoading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" component="h2">Your Tasks</Typography>
          <Skeleton variant="rounded" width={100} height={36} />
        </Box>
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ mb: 2 }}>
            <Skeleton variant="rectangular" width="100%" height={70} />
          </Box>
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h5" component="h2">Your Tasks</Typography>
          {taskSummary && (
            <Typography variant="body2" color="text.secondary">
              {taskSummary.high} high priority • {taskSummary.escalated} escalated
            </Typography>
          )}
        </Box>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl size="small">
            <Select
              value={timeframe}
              onChange={handleTimeframeChange}
              startAdornment={
                <InputAdornment position="start">
                  <FilterListIcon fontSize="small" />
                </InputAdornment>
              }
              sx={{ minWidth: 150 }}
            >
              {timeframeOptions.map(option => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />}
            onClick={handleOpenNewTaskDialog}
          >
            Add Task
          </Button>
        </Box>
      </Box>

      {tasks.length === 0 ? (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="body1" color="text.secondary">
            No tasks for this time period. 
            {timeframe === 'today' && " Click 'Add Task' to create one."}
          </Typography>
        </Box>
      ) : (
        <List sx={{ width: '100%' }}>
          {tasks.map((task) => (
            <React.Fragment key={task.id}>
              <ListItem
                alignItems="flex-start"
                sx={{
                  backgroundColor: task.completed ? 'rgba(0, 0, 0, 0.04)' : 
                               task.escalated ? 'error.50' : 'transparent',
                  borderRadius: 1,
                  mb: 1,
                  border: task.escalated ? '1px solid' : 'none',
                  borderColor: 'error.light',
                }}
                secondaryAction={
                  <Box>
                    {task.escalated && (
                      <Tooltip title="Task priority escalated">
                        <IconButton size="small" color="error">
                          <TrendingUpIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    {new Date(task.dueDate) < new Date() && !task.completed && (
                      <Tooltip title="Reschedule to next work day">
                        <IconButton 
                          size="small" 
                          color="warning"
                          onClick={() => handleReschedule(task.id)}
                        >
                          <ScheduleIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="AI Analysis">
                      <IconButton 
                        edge="end" 
                        aria-label="ai analysis"
                        onClick={() => onAnalyzeTask(task)}
                      >
                        <SmartToyIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Edit">
                      <IconButton 
                        edge="end" 
                        aria-label="edit"
                        onClick={() => handleOpenEditDialog(task)}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton 
                        edge="end" 
                        aria-label="delete"
                        onClick={() => onDeleteTask(task.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                }
              >
                <ListItemIcon>
                  <Checkbox
                    edge="start"
                    checked={task.completed}
                    onChange={() => onToggleComplete(task.id)}
                    sx={{
                      '&.Mui-checked': {
                        color: 'primary.main',
                      },
                    }}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography
                        variant="subtitle1"
                        sx={{
                          textDecoration: task.completed ? 'line-through' : 'none',
                          color: task.completed ? 'text.secondary' : 'text.primary',
                        }}
                      >
                        {task.title}
                      </Typography>
                      <Chip
                        label={task.priority}
                        size="small"
                        color={getPriorityColor(task.priority)}
                        sx={{ textTransform: 'capitalize' }}
                      />
                      {task.escalated && (
                        <Chip
                          label="Escalated"
                          size="small"
                          color="error"
                          icon={<WarningIcon />}
                          sx={{ textTransform: 'capitalize' }}
                        />
                      )}
                    </Box>
                  }
                  secondary={
                    <React.Fragment>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'block',
                          textDecoration: task.completed ? 'line-through' : 'none',
                          mb: 0.5,
                        }}
                      >
                        {task.description}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color={new Date(task.dueDate) < new Date() && !task.completed ? 'error.main' : 'text.secondary'}
                        sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                      >
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                        {new Date(task.dueDate) < new Date() && !task.completed && (
                          <span>(Overdue)</span>
                        )}
                      </Typography>
                    </React.Fragment>
                  }
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Task Title"
                fullWidth
                required
                value={currentTask.title}
                onChange={handleInputChange}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={handleVoiceInput}>
                        <MicIcon />
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={currentTask.description}
                onChange={handleInputChange}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="dueDate"
                label="Due Date"
                type="date"
                fullWidth
                required
                value={currentTask.dueDate}
                onChange={handleInputChange}
                InputLabelProps={{
                  shrink: true,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="priority-select-label">Priority</InputLabel>
                <Select
                  labelId="priority-select-label"
                  id="priority-select"
                  name="priority"
                  value={currentTask.priority}
                  label="Priority"
                  onChange={handleInputChange}
                >
                  <MenuItem value="low">Low</MenuItem>
                  <MenuItem value="medium">Medium</MenuItem>
                  <MenuItem value="high">High</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={handleSaveTask} 
            variant="contained"
            disabled={!isFormValid()}
          >
            {isEditing ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      <Box sx={{ position: 'fixed', bottom: 16, right: 16, display: { sm: 'none' } }}>
        <Fab color="primary" aria-label="add" onClick={handleOpenNewTaskDialog}>
          <AddIcon />
        </Fab>
      </Box>
    </Box>
  );
}

export default TaskList;