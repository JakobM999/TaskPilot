import React, { useState, useCallback } from 'react';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Divider,
  Chip,
  LinearProgress,
  Skeleton,
  Tooltip
} from '@mui/material';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import RefreshIcon from '@mui/icons-material/Refresh';
import TipsAndUpdatesIcon from '@mui/icons-material/TipsAndUpdates';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function AIAssistant({ 
  suggestion, 
  onPrioritizeTasks, 
  onGetAdvice, 
  isLoading = false
}) {
  const [aiThinking, setAiThinking] = useState(false);

  const handlePrioritize = useCallback(async () => {
    setAiThinking(true);
    try {
      await onPrioritizeTasks();
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
          <Typography variant="h6" component="h2">Focus Assistant</Typography>
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
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <SmartToyIcon color="primary" sx={{ mr: 1 }} />
        <Typography variant="h6" component="h2">Focus Assistant</Typography>
        <Tooltip title="Get a new suggestion">
          <IconButton size="small" onClick={handleGetAdvice} disabled={aiThinking} sx={{ ml: 'auto' }}>
            <RefreshIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </Box>

      {aiThinking && (
        <LinearProgress
          sx={{
            mb: 2
          }}
        />
      )}

      <Box 
        sx={{ 
          p: 3, 
          mb: 3, 
          borderRadius: 2, 
          bgcolor: 'primary.main',
          color: 'white'
        }}
      >
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Focus Guide
          </Typography>
          <Chip
            label="AI Powered"
            size="small"
            sx={{
              bgcolor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontSize: '0.7rem',
              height: 24
            }}
          />
        </Box>
        
        <Typography variant="body2" sx={{ mb: 2 }}>
          {suggestion || "I'll help you stay focused and manage your tasks effectively. What would you like help with?"}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Button
          variant="outlined"
          size="medium"
          startIcon={<AccessTimeIcon />}
          onClick={handlePrioritize}
          disabled={aiThinking}
          fullWidth
        >
          Plan My Day
        </Button>
        <Button
          variant="outlined"
          size="medium"
          startIcon={<TipsAndUpdatesIcon />}
          onClick={handleGetAdvice}
          disabled={aiThinking}
          fullWidth
        >
          Focus Tips
        </Button>
      </Box>

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
