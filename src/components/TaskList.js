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
    listItems: [] // Add listItems array
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
      category: 'work', // Default to work
      tags: [],
      listItems: []
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
    setNewTagName('');
  };

  const handleSaveTask = () => {
    // First set the date to local midnight in Denmark
    const taskDate = new Date(currentTask.dueDate);
    taskDate.setHours(0, 0, 0, 0);
    
    console.log('Saving task with date:', {
      original: currentTask.dueDate,
      localMidnight: taskDate.toISOString()
    });

    const taskToSave = {
      id: currentTask.id, // Make sure to include the ID when editing
      title: currentTask.title.trim(),
      description: currentTask.description?.trim() || '',
      dueDate: taskDate.toISOString(),
      priority: currentTask.priority || 'medium',
      category: currentTask.category || 'work',
      completed: currentTask.completed || false,
      escalated: currentTask.escalated || false,
      pinned: currentTask.pinned || false,
      hasListItems: Boolean(currentTask.listItems?.length),
      tags: Array.isArray(currentTask.tags) ? currentTask.tags : [],
      listItems: Array.isArray(currentTask.listItems) ? currentTask.listItems : []
    };
    
    if (isEditing) {
      onUpdateTask(taskToSave);
    } else {
      onCreateTask(taskToSave);
    }

    setOpenDialog(false);
    setCurrentTask({
      title: '',
      description: '',
      dueDate: new Date().toISOString().split('T')[0],
      priority: 'medium',
      category: 'work',
      tags: [],
      listItems: []
    });
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
      // First sort by pin status
      if (a.pinned !== b.pinned) {
        return a.pinned ? -1 : 1;
      }

      // If in week/month/upcoming view, sort by date first
      const isLongTermView = ['week', 'month', 'upcoming'].includes(timeframe);
      if (isLongTermView) {
        const dateA = new Date(a.dueDate);
        const dateB = new Date(b.dueDate);
        if (dateA.getTime() !== dateB.getTime()) {
          return dateA.getTime() - dateB.getTime();
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
        return new Date(a.dueDate) - new Date(b.dueDate);
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
                // First check if task is completed
                if (task.completed) {
                  return false;
                }

                // Always show pinned tasks
                if (task.pinned) {
                  return categoryFilter === 'all' || task.category === categoryFilter;
                }
                
                // Filter by category
                if (categoryFilter !== 'all' && task.category !== categoryFilter) {
                  return false;
                }

                // Check date filters
                const taskDate = new Date(task.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                switch(timeframe) {
                  case 'today':
                    return taskDate.getTime() === today.getTime();
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
            // Only consider a task overdue if its due date is strictly before today
            const isOverdue = taskDate < today && !task.completed;
            
            return (
              <React.Fragment key={task.id}>
                <ListItem
                  alignItems="flex-start"
                  sx={{
                    backgroundColor: task.completed ? 'rgba(0, 0, 0, 0.04)' : 
                                 isOverdue ? 'error.100' :
                                 task.escalated ? 'error.50' : 'transparent',
                    borderRadius: 1,
                    mb: 1,
                    border: (isOverdue || task.escalated) ? '1px solid' : 'none',
                    borderColor: 'error.light',
                  }}
                  secondaryAction={
                    <Box>
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