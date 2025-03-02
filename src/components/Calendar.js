import React from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Chip,
  Skeleton,
  Grid,
  Stack,
  IconButton,
  Tooltip,
  LinearProgress,
  Paper,
} from '@mui/material';
import { format } from 'date-fns';
import EventIcon from '@mui/icons-material/Event';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ErrorIcon from '@mui/icons-material/Error';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import VideocamIcon from '@mui/icons-material/Videocam';
import GroupsIcon from '@mui/icons-material/Groups';

// Mock events data
const mockEvents = [
  {
    id: 1,
    title: 'Team Standup',
    type: 'meeting',
    startTime: '09:00',
    endTime: '09:30',
    location: 'Teams Meeting',
    participants: ['John', 'Sarah', 'Mike']
  },
  {
    id: 2,
    title: 'Client Project Review',
    type: 'meeting',
    startTime: '11:00',
    endTime: '12:00',
    location: 'Conference Room A',
    participants: ['Client', 'PM', 'Tech Lead']
  },
  {
    id: 3,
    title: 'Development Focus Time',
    type: 'focus',
    startTime: '14:00',
    endTime: '16:00',
    location: '',
    participants: []
  }
];

function Calendar({ tasks = [], onToggleComplete, isLoading = false }) {
  // Group tasks by status
  const groupedTasks = {
    completed: tasks.filter(t => t.completed),
    overdue: tasks.filter(t => !t.completed && new Date(t.dueDate) < new Date()),
    upcoming: tasks.filter(t => !t.completed && new Date(t.dueDate) >= new Date())
  };

  // Calculate statistics
  const stats = {
    total: tasks.length,
    completed: groupedTasks.completed.length,
    overdue: groupedTasks.overdue.length,
    upcoming: groupedTasks.upcoming.length,
    completionRate: tasks.length ? 
      Math.round((groupedTasks.completed.length / tasks.length) * 100) : 0
  };

  // Render loading skeleton
  if (isLoading) {
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <EventIcon color="primary" />
          <Typography variant="h6" component="h2">Task Overview</Typography>
        </Box>
        {[1, 2, 3].map((item) => (
          <Box key={item} sx={{ mb: 2 }}>
            <Skeleton variant="text" width="40%" height={20} />
            <Skeleton variant="text" width="70%" height={20} />
            <Skeleton variant="text" width="30%" height={20} />
          </Box>
        ))}
      </Box>
    );
  }

  const TaskGroup = ({ title, tasks, icon, color }) => (
    <Box sx={{ mb: 3 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        {icon}
        <Typography variant="subtitle1" component="h3">
          {title} ({tasks.length})
        </Typography>
      </Box>
      {tasks.length > 0 ? (
        <List dense sx={{ bgcolor: 'background.paper' }}>
          {tasks.map((task) => (
            <ListItem
              key={task.id}
              sx={{
                borderLeft: 3,
                borderColor: color,
                mb: 0.5,
                borderRadius: 1,
                '&:hover': { bgcolor: 'action.hover' }
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2">{task.title}</Typography>
                    <Chip 
                      label={task.priority} 
                      size="small" 
                      color={task.priority === 'high' ? 'error' : 
                             task.priority === 'medium' ? 'warning' : 'success'}
                      sx={{ height: 20 }}
                    />
                    {task.escalated && (
                      <Tooltip title="Priority Escalated">
                        <TrendingUpIcon color="error" fontSize="small" />
                      </Tooltip>
                    )}
                  </Box>
                }
                secondary={
                  <Typography variant="caption" color="text.secondary">
                    Due: {format(new Date(task.dueDate), 'MMM d, yyyy')}
                  </Typography>
                }
              />
              <IconButton 
                edge="end" 
                size="small"
                onClick={() => onToggleComplete(task.id)}
              >
                <CheckCircleIcon 
                  color={task.completed ? 'success' : 'action'} 
                  fontSize="small"
                />
              </IconButton>
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
          No tasks in this category
        </Typography>
      )}
    </Box>
  );

  // Render events section
  const EventSection = () => (
    <Box sx={{ mb: 4 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Today's Schedule
      </Typography>
      <List sx={{ bgcolor: 'background.paper', borderRadius: 1 }}>
        {mockEvents.map((event) => (
          <React.Fragment key={event.id}>
            <ListItem
              sx={{
                borderLeft: 2,
                borderColor: event.type === 'meeting' ? 'primary.main' : 'secondary.main',
                mb: 1,
                bgcolor: 'background.paper',
                borderRadius: 1,
                boxShadow: 1,
              }}
            >
              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2">
                      {event.title}
                    </Typography>
                    <Chip
                      size="small"
                      label={event.type}
                      color={event.type === 'meeting' ? 'primary' : 'secondary'}
                      sx={{ height: 20 }}
                    />
                  </Box>
                }
                secondary={
                  <Box sx={{ mt: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                      <AccessTimeIcon fontSize="small" color="action" />
                      <Typography variant="caption">
                        {event.startTime} - {event.endTime}
                      </Typography>
                    </Box>
                    {event.location && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {event.location.includes('Teams') ? (
                          <VideocamIcon fontSize="small" color="action" />
                        ) : (
                          <LocationOnIcon fontSize="small" color="action" />
                        )}
                        <Typography variant="caption">
                          {event.location}
                        </Typography>
                      </Box>
                    )}
                    {event.participants.length > 0 && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                        <GroupsIcon fontSize="small" color="action" />
                        <Box sx={{ display: 'flex', gap: 0.5 }}>
                          {event.participants.map((participant, index) => (
                            <Chip
                              key={index}
                              label={participant}
                              size="small"
                              sx={{ height: 20, '& .MuiChip-label': { px: 1, fontSize: '0.7rem' } }}
                            />
                          ))}
                        </Box>
                      </Box>
                    )}
                  </Box>
                }
              />
            </ListItem>
          </React.Fragment>
        ))}
      </List>
    </Box>
  );

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, height: '100%' }}>
            <EventSection />
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Task Overview
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12}>
                  <LinearProgress 
                    variant="determinate" 
                    value={stats.completionRate}
                    sx={{ 
                      height: 8, 
                      borderRadius: 4,
                      bgcolor: 'grey.200',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 4,
                      }
                    }}
                  />
                  <Typography variant="body2" color="text.secondary" align="right" sx={{ mt: 0.5 }}>
                    {stats.completionRate}% completed
                  </Typography>
                </Grid>
                <Grid item xs={4}>
                  <Stack alignItems="center">
                    <Typography variant="h4" color="success.main">
                      {stats.completed}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Completed
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={4}>
                  <Stack alignItems="center">
                    <Typography variant="h4" color="error.main">
                      {stats.overdue}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Overdue
                    </Typography>
                  </Stack>
                </Grid>
                <Grid item xs={4}>
                  <Stack alignItems="center">
                    <Typography variant="h4" color="info.main">
                      {stats.upcoming}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Upcoming
                    </Typography>
                  </Stack>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 3 }} />

              <TaskGroup
                title="Overdue Tasks"
                tasks={groupedTasks.overdue}
                icon={<ErrorIcon color="error" />}
                color="error.main"
              />
              
              <TaskGroup
                title="Upcoming Tasks"
                tasks={groupedTasks.upcoming}
                icon={<PendingIcon color="info" />}
                color="info.main"
              />
              
              <TaskGroup
                title="Completed Tasks"
                tasks={groupedTasks.completed}
                icon={<CheckCircleIcon color="success" />}
                color="success.main"
              />
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}

export default Calendar;