import React, { useState } from 'react';
import { 
  Box,
  Button, 
  Typography,
  Paper,
  Alert,
  CircularProgress,
  TextField
} from '@mui/material';
import { testSupabaseConnection } from '../services/testSupabase';
import supabase from '../services/supabaseClient';

function SupabaseTest() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [url, setUrl] = useState(process.env.REACT_APP_SUPABASE_URL || '');
  const [anonKey, setAnonKey] = useState('');

  const handleTest = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const testResult = await testSupabaseConnection();
      setResult(testResult);
    } catch (err) {
      setError(err.message || 'An error occurred during testing');
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Supabase Connection Test
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Current Configuration
        </Typography>
        <Typography variant="body1" sx={{ mb: 1 }}>
          URL: {url || 'Not configured'}
        </Typography>
        <Typography variant="body1" sx={{ mb: 3 }}>
          Anonymous Key: {anonKey ? '********' : 'Not configured'}
        </Typography>

        <Button 
          variant="contained" 
          onClick={handleTest} 
          disabled={loading}
          sx={{ mr: 2 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Test Connection'}
        </Button>
      </Paper>

      {result && (
        <Alert severity={result.success ? "success" : "error"} sx={{ mb: 3 }}>
          {result.message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Connection Details from Environment
        </Typography>
        <Box component="pre" sx={{ 
          p: 2,
          bgcolor: 'background.default',
          borderRadius: 1,
          overflow: 'auto',
          maxWidth: '100%'
        }}>
          {JSON.stringify({
            url: process.env.REACT_APP_SUPABASE_URL,
            anonKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? '[HIDDEN]' : undefined,
            nodeEnv: process.env.NODE_ENV
          }, null, 2)}
        </Box>
      </Paper>
    </Box>
  );
}

export default SupabaseTest;