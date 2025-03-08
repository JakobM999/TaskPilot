import React, { useState, useEffect } from 'react';
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
  Autocomplete,
  FormHelperText,
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
import CategoryIcon from '@mui/icons-material/Category';
import LabelIcon from '@mui/icons-material/Label';
import PushPinIcon from '@mui/icons-material/PushPin';
import RepeatIcon from '@mui/icons-material/Repeat';
import ClearIcon from '@mui/icons-material/Clear';
import { getUserTags, createTag } from '../services';

function TaskList({
  tasks = [], // Provide default empty array
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onToggleComplete,
  onAnalyzeTask,
  onRescheduleTask,
  onTimeframeChange,
  onTogglePin,
  onToggleEscalation,
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
    category: 'work', // Default to work
    tags: [], // Add tags array
    listItems: [], // Add listItems array
    isRecurring: false, // Add recurring flag
    recurrencePattern: null // Add recurrence pattern
  });
  const [timeframe, setTimeframe] = useState(currentTimeframe);
  const [categoryFilter, setCategoryFilter] = useState('work'); // Default to work
  const [taskSummary] = useState(null);
  const [tagFilter, setTagFilter] = useState(null);
  const [tags, setTags] = useState([]);
  const [newTagName, setNewTagName] = useState('');

  // Fetch tags when component mounts
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const { data, error } = await getUserTags();
        if (error) {
          console.error('Error fetching tags:', error);
        } else {
          setTags(data);
        }
      } catch (error) {
        console.error('Failed to fetch tags:', error);
      }
    };

    fetchTags();
  }, []);

  const timeframeOptions = [
    { value: 'today', label: 'Today' },
    { value: 'tomorrow', label: 'Tomorrow' },
    { value: 'week', label: 'Next 7 Days' },
    { value: 'month', label: 'Next 30 Days' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'overdue', label: 'Overdue' }
  ];

  const handleReschedule = async (taskId) => {
    // Use the parent callback instead of managing state locally
    onRescheduleTask(taskId);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    console.log('Input change:', { name, value });
    setCurrentTask(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleOpenNewTaskDialog = () => {
    setIsEditing(false);
    setCurrentTask({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0], // Default to today
      priority: 'medium',
      category: 'work', // Default to work
      tags: [],
      listItems: [],
      isRecurring: false,
      recurrencePattern: null
    });
    setOpenDialog(true);
  };

  const handleOpenEditDialog = (task) => {
    setIsEditing(true);
    // Format task data for editing, maintaining all needed fields
    setCurrentTask({
      id: task.id,
      title: task.title || '',
      description: task.description || '',
      dueDate: task.dueDate.split('T')[0], // Format the date for the date input
      priority: task.priority || 'medium',
      category: task.category || 'work',
      completed: task.completed || false,
      escalated: task.escalated || false,
      pinned: task.pinned || false,
      tags: task.tags || [],
      listItems: task.listItems || [],
      isRecurring: task.isRecurring || false,
      recurrencePattern: task.recurrencePattern || null
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewTagName('');
  };

  const handleSaveTask = () => {
    const task = {
      id: currentTask.id, // Preserve ID for updates
      title: currentTask.title,
      description: currentTask.description,
      due_date: currentTask.dueDate,
      dueDate: currentTask.dueDate,
      priority: currentTask.priority,
      category: currentTask.category,
      completed: currentTask.completed || false,
      escalated: currentTask.escalated || false,
      pinned: currentTask.pinned || false,
      tags: currentTask.tags || [],
      listItems: currentTask.listItems || [],
      isRecurring: currentTask.isRecurring,
      recurrencePattern: currentTask.recurrencePattern
    };
    
    console.log('Saving task:', task);

    if (isEditing) {
      onUpdateTask(task);
    } else {
      onCreateTask(task);
    }

    handleCloseDialog();
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

  const handleTagChange = (event, newValue) => {
    setCurrentTask({
      ...currentTask,
      tags: newValue
    });
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return;
    
    try {
      const { data: newTag, error } = await createTag(newTagName);
      if (error) {
        console.error('Error creating tag:', error);
        return;
      }
      
      // Add the new tag to the local state
      setTags([...tags, newTag]);
      
      // Add the new tag to the current task
      setCurrentTask({
        ...currentTask,
        tags: [...currentTask.tags, newTag]
      });
      
      // Clear the input
      setNewTagName('');
    } catch (error) {
      console.error('Failed to create tag:', error);
    }
  };

  const sortTasks = (tasks) => {
    // Priority score mapping
    const priorityScore = {
      'high': 3,
      'medium': 2,
      'low': 1
    };

    return [...tasks].sort((a, b) => {
      // First sort by completion status
      if (a.completed !== b.completed) {
        return a.completed ? 1 : -1;
      }

      // Then sort by pin status
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      // Then sort by overdue status
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const aDate = new Date(a.dueDate);
      const bDate = new Date(b.dueDate);
      const aOverdue = aDate < today && !a.completed;
      const bOverdue = bDate < today && !b.completed;
      
      if (aOverdue !== bOverdue) {
        return aOverdue ? -1 : 1;
      }

      // If in week/month/upcoming view, sort by date first
      const isLongTermView = ['week', 'month', 'upcoming'].includes(timeframe);
      if (isLongTermView) {
        if (aDate.getTime() !== bDate.getTime()) {
          return aDate.getTime() - bDate.getTime();
        }
      }

      // Then sort by escalated status
      if (a.escalated !== b.escalated) {
        return a.escalated ? -1 : 1;
      }

      // Then sort by priority
      const priorityDiff = priorityScore[b.priority] - priorityScore[a.priority];
      if (priorityDiff !== 0) {
        return priorityDiff;
      }

      // Finally sort by due date for non-long-term views
      if (!isLongTermView) {
        return aDate - bDate;
      }

      return 0;
    });
  };

  const filterTasksByTag = (tasks, tagId) => {
    if (!tagId) return tasks;
    return tasks.filter(task => 
      task.tags && task.tags.some(tag => tag.id === tagId)
    );
  };

  const recurrencePatterns = [
    { value: null, label: 'None' },
    { value: { frequency: 'daily', interval: 1 }, label: 'Daily' },
    { value: { frequency: 'daily', interval: 2 }, label: 'Every 2 days' },
    { value: { frequency: 'weekly', interval: 1 }, label: 'Weekly' },
    { value: { frequency: 'weekly', interval: 2 }, label: 'Every 2 weeks' },
    { value: { frequency: 'monthly', interval: 1 }, label: 'Monthly' },
    { value: { frequency: 'yearly', interval: 1 }, label: 'Yearly' },
  ];

  const handleRecurrenceChange = (selectedPattern) => {
    setCurrentTask((prev) => ({
      ...prev,
      isRecurring: selectedPattern !== null,
      recurrencePattern: selectedPattern
    }));
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
          <FormControl size="small">
            <Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              startAdornment={
                <InputAdornment position="start">
                  <CategoryIcon fontSize="small" />
                </InputAdornment>
              }
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="all">All Tasks</MenuItem>
              <MenuItem value="work">Work</MenuItem>
              <MenuItem value="private">Private</MenuItem>
            </Select>
          </FormControl>
          <FormControl size="small">
            <Select
              value={tagFilter || ''}
              onChange={(e) => setTagFilter(e.target.value || null)}
              displayEmpty
              startAdornment={
                <InputAdornment position="start">
                  <LabelIcon fontSize="small" />
                </InputAdornment>
              }
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="">All Tags</MenuItem>
              {tags.map(tag => (
                <MenuItem key={tag.id} value={tag.id}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: tag.color || '#1976D2'
                      }}
                    />
                    {tag.name}
                  </Box>
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
          {sortTasks(
            filterTasksByTag(
              tasks.filter(task => {
                // Filter by category
                if (categoryFilter !== 'all' && task.category !== categoryFilter) {
                  return false;
                }

                // Check date filters
                const taskDate = new Date(task.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                // Calculate if task is overdue
                const isOverdue = taskDate < today && !task.completed;

                switch(timeframe) {
                  case 'today':
                    return isOverdue || taskDate.getTime() === today.getTime();
                  case 'tomorrow':
                    const tomorrow = new Date(today);
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    return isOverdue || taskDate.getTime() === tomorrow.getTime();
                  case 'week':
                    const weekEnd = new Date(today);
                    weekEnd.setDate(weekEnd.getDate() + 7);
                    return isOverdue || (taskDate >= today && taskDate <= weekEnd);
                  case 'month':
                    const monthEnd = new Date(today);
                    monthEnd.setDate(monthEnd.getDate() + 30);
                    return isOverdue || (taskDate >= today && taskDate <= monthEnd);
                  case 'overdue':
                    return taskDate < today;
                  case 'upcoming':
                    return taskDate >= today;
                  default:
                    return true;
                }
              }),
              tagFilter
            )
          ).map((task) => {
            const taskDate = new Date(task.dueDate);
            taskDate.setHours(0, 0, 0, 0);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const isOverdue = taskDate < today && !task.completed;
            
            return (
              <React.Fragment key={task.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: task.completed ? 'rgba(0, 0, 0, 0.04)' : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    border: task.pinned || isOverdue ? 2 : 1, // Make the border thicker (2px) for pinned/overdue tasks
                    borderColor: 
                      isOverdue ? 'error.main' : 
                      task.pinned ? 'primary.main' :
                      'transparent',
                    '&:hover': { bgcolor: 'action.hover' },
                    pr: '160px', // Add right padding to prevent text overlap with buttons
                  }}
                  secondaryAction={
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title={task.pinned ? "Unpin task" : "Pin task"}>
                        <IconButton 
                          size="small" 
                          onClick={() => onTogglePin(task.id)}
                          color={task.pinned ? "primary" : "default"}
                        >
                          <PushPinIcon />
                        </IconButton>
                      </Tooltip>
                      {task.escalated && (
                        <Tooltip title="Remove escalation">
                          <IconButton 
                            size="small" 
                            color="error"
                            onClick={() => onToggleEscalation(task.id)}
                          >
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
                          size="small"
                          onClick={() => onAnalyzeTask(task)}
                        >
                          <SmartToyIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton 
                          size="small"
                          onClick={() => handleOpenEditDialog(task)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton 
                          size="small"
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
                      checked={task.completed || false}
                      onChange={() => {
                        console.log('Toggling completion for task:', task.id);
                        onToggleComplete(task.id);
                      }}
                      sx={{
                        '&.Mui-checked': {
                          color: 'success.main',
                        },
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Typography
                          variant="subtitle1"
                          sx={{
                            textDecoration: task.completed ? 'line-through' : 'none',
                            color: task.completed ? 'text.secondary' : 'text.primary',
                          }}
                        >
                          {task.title}
                        </Typography>
                        {task.isRecurring && (
                          <Tooltip title="Recurring Task">
                            <RepeatIcon fontSize="small" color="primary" sx={{ ml: 0.5 }} />
                          </Tooltip>
                        )}
                        <Chip
                          label={task.priority}
                          size="small"
                          color={getPriorityColor(task.priority)}
                          sx={{ textTransform: 'capitalize' }}
                        />
                        <Chip
                          label={task.category}
                          size="small"
                          color={task.category === 'work' ? 'primary' : 'secondary'}
                          sx={{ textTransform: 'capitalize' }}
                        />
                        {task.escalated && (
                          <Chip
                            label="Escalated"
                            size="small"
                            color="error"
                            icon={<WarningIcon />}
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
                            wordBreak: 'break-word', // Add word breaking
                            overflowWrap: 'break-word', // Ensure long words break
                            maxWidth: 'calc(100% - 48px)' // Leave space for icons
                          }}
                        >
                          {task.description}
                        </Typography>
                        
                        {/* Tags row */}
                        {task.tags && task.tags.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 0.5 }}>
                            {task.tags.map(tag => (
                              <Chip
                                key={tag.id}
                                label={tag.name}
                                size="small"
                                variant="outlined"
                                sx={{ 
                                  height: 20,
                                  '& .MuiChip-label': { px: 1, py: 0 },
                                  backgroundColor: `${tag.color}20`,
                                  borderColor: tag.color,
                                  color: 'text.secondary'
                                }}
                              />
                            ))}
                          </Box>
                        )}
                        
                        <Typography 
                          variant="caption" 
                          color={isOverdue ? 'error.main' : 'text.secondary'}
                          sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}
                        >
                          Due: {new Date(task.dueDate).toLocaleDateString('da-DK')}
                          {isOverdue && (
                            <span>(Overdue)</span>
                          )}
                        </Typography>
                      </React.Fragment>
                    }
                  />
                </ListItem>
                <Divider component="li" />
              </React.Fragment>
            );
          })}
        </List>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{isEditing ? 'Edit Task' : 'Create New Task'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid item xs={12}>
              <TextField
                autoFocus
                name="title"
                label="Task Title"
                fullWidth
                required
                value={currentTask.title || ''}
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
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="category-select-label">Category</InputLabel>
                <Select
                  labelId="category-select-label"
                  id="category-select"
                  name="category"
                  value={currentTask.category}
                  label="Category"
                  onChange={handleInputChange}
                >
                  <MenuItem value="work">Work</MenuItem>
                  <MenuItem value="private">Private</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            
            {/* Tags section */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Tags
                </Typography>
              </Divider>
              
              <Autocomplete
                multiple
                id="tags-select"
                options={tags}
                value={currentTask.tags || []}
                isOptionEqualToValue={(option, value) => option.id === value.id}
                getOptionLabel={(option) => option.name}
                onChange={handleTagChange}
                renderOption={(props, option) => (
                  <li {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: option.color || '#1976D2'
                        }}
                      />
                      {option.name}
                    </Box>
                  </li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      key={option.id}
                      label={option.name}
                      {...getTagProps({ index })}
                      size="small"
                      sx={{
                        backgroundColor: `${option.color}30`,
                        borderColor: option.color,
                        '& .MuiChip-deleteIcon': {
                          color: `${option.color}99`
                        }
                      }}
                    />
                  ))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant="outlined"
                    label="Select Tags"
                    placeholder="Tags"
                  />
                )}
              />
              
              <Box sx={{ display: 'flex', mt: 1, gap: 1 }}>
                <TextField
                  size="small"
                  label="Create New Tag"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  fullWidth
                />
                <Button
                  variant="outlined"
                  onClick={handleCreateTag}
                  disabled={!newTagName.trim()}
                  startIcon={<AddIcon />}
                >
                  Add
                </Button>
              </Box>
            </Grid>

            {/* Recurrence section */}
            <Grid item xs={12}>
              <Divider textAlign="left" sx={{ mt: 1, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Recurrence
                </Typography>
              </Divider>
              
              <FormControl fullWidth>
                <InputLabel>Repeat</InputLabel>
                <Select
                  value={currentTask.recurrencePattern ? JSON.stringify(currentTask.recurrencePattern) : ''}
                  onChange={(e) => handleRecurrenceChange(e.target.value ? JSON.parse(e.target.value) : null)}
                  label="Repeat"
                >
                  {recurrencePatterns.map((pattern) => (
                    <MenuItem key={pattern.label} value={pattern.value ? JSON.stringify(pattern.value) : ''}>
                      {pattern.label}
                    </MenuItem>
                  ))}
                </Select>
                {currentTask.isRecurring && (
                  <FormHelperText>
                    Task will automatically repeat {currentTask.recurrencePattern?.frequency} 
                    {currentTask.recurrencePattern?.interval > 1 ? ` every ${currentTask.recurrencePattern.interval} ${currentTask.recurrencePattern.frequency.slice(0, -2)}s` : ''}
                  </FormHelperText>
                )}
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