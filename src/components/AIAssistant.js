import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Skeleton,
  Avatar,
  Tooltip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Collapse,
  Alert
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RefreshIcon from '@mui/icons-material/Refresh';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import BlockIcon from '@mui/icons-material/Block';

function AIAssistant({ 
  suggestion, 
  onPrioritizeTasks, 
  onGetAdvice, 
  isLoading = false
}) {
  const [aiThinking, setAiThinking] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [currentAdvice, setCurrentAdvice] = useState(null);

  const handlePrioritize = useCallback(async () => {
    setAiThinking(true);
    try {
      const result = await onPrioritizeTasks();
      setCurrentAdvice(result);
    } catch (error) {
      console.error('Error prioritizing tasks:', error);
    } finally {
      setAiThinking(false);
    }
  }, [onPrioritizeTasks]);

  const handleGetAdvice = useCallback(async () => {
    setAiThinking(true);
    try {
      await onGetAdvice();
    } catch (error) {
      console.error('Error getting advice:', error);
    } finally {
      setAiThinking(false);
    }
  }, [onGetAdvice]);

  // Render loading state
  if (isLoading) {
    return (
      <Box>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6" component="h2">AI Assistant</Typography>
        </Box>
        <Skeleton variant="rectangular" height={120} sx={{ borderRadius: 1 }} />
        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between' }}>
          <Skeleton variant="rounded" width={120} height={36} />
          <Skeleton variant="rounded" width={120} height={36} />
        </Box>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <SmartToyIcon color="primary" />
          <Typography variant="h6" component="h2">Focus Assistant</Typography>
        </Box>
        <Tooltip title="Get a new suggestion">
          <IconButton size="small" onClick={handleGetAdvice} disabled={aiThinking}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          bgcolor: 'primary.light',
          color: 'primary.contrastText',
          borderRadius: 2,
          position: 'relative',
          overflow: 'hidden',
          mb: 2
        }}
      >
        {aiThinking && (
          <LinearProgress
            sx={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
            }}
          />
        )}

        <Box sx={{ display: 'flex', mb: 1.5 }}>
          <Avatar sx={{ bgcolor: 'primary.main', width: 32, height: 32, mr: 1.5 }}>
            <SmartToyIcon fontSize="small" />
          </Avatar>
          <Box>
            <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
              Focus Guide
            </Typography>
            <Chip
              label="AI Powered"
              size="small"
              color="primary"
              sx={{
                height: '20px',
                bgcolor: 'rgba(255, 255, 255, 0.3)',
                '& .MuiChip-label': { px: 1, py: 0, fontSize: '0.7rem' }
              }}
            />
          </Box>
        </Box>

        <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
          {suggestion || "I'll help you stay focused and manage your tasks effectively. What would you like help with?"}
        </Typography>

        {currentAdvice?.timeBlocks && (
          <Alert severity="info" sx={{ mt: 2, bgcolor: 'rgba(255, 255, 255, 0.1)' }}>
            Recommended Focus Time: {currentAdvice.timeBlocks[0]?.suggestedTime}
          </Alert>
        )}
      </Paper>

      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 2 }}>
        <Button
          variant="outlined"
          size="small"
          startIcon={<AccessTimeIcon />}
          onClick={handlePrioritize}
          disabled={aiThinking}
          fullWidth
        >
          Plan My Day
        </Button>
        <Button
          variant="outlined"
          size="small"
          startIcon={<TipsAndUpdatesIcon />}
          onClick={handleGetAdvice}
          disabled={aiThinking}
          fullWidth
        >
          Focus Tips
        </Button>
      </Box>

      {currentAdvice && (
        <>
          <Button
            fullWidth
            sx={{ mt: 2 }}
            endIcon={showDetails ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowDetails(!showDetails)}
          >
            {showDetails ? 'Hide Details' : 'Show Details'}
          </Button>

          <Collapse in={showDetails}>
            <Paper sx={{ mt: 2, p: 2 }} variant="outlined">
              {currentAdvice.distractionWarnings && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="error" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <BlockIcon fontSize="small" />
                    Potential Distractions
                  </Typography>
                  <List dense>
                    {currentAdvice.distractionWarnings.preventiveMeasures.map((measure, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <NotificationsActiveIcon fontSize="small" color="warning" />
                        </ListItemIcon>
                        <ListItemText primary={measure} />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}

              {currentAdvice.timeBlocks && (
                <Box>
                  <Typography variant="subtitle2" sx={{ mb: 1 }}>
                    Recommended Schedule
                  </Typography>
                  <List dense>
                    {currentAdvice.timeBlocks.map((block, index) => (
                      <ListItem key={index}>
                        <ListItemIcon sx={{ minWidth: 36 }}>
                          <AccessTimeIcon fontSize="small" color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary={block.task} 
                          secondary={`${block.suggestedTime} (${block.duration})`}
                        />
                      </ListItem>
                    ))}
                  </List>
                </Box>
              )}
            </Paper>
          </Collapse>
        </>
      )}

      <Divider sx={{ my: 2 }} />

      <Box sx={{ textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          Your personalized focus assistant. Updates advice based on your work patterns.
        </Typography>
      </Box>
    </Box>
  );
}

export default AIAssistant;