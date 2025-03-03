// Test file to verify Supabase connection
import supabase from './supabaseClient';

// Simple function to test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    // First check if Supabase client has URL and key
    if (!supabase.supabaseUrl || supabase.supabaseUrl === '') {
      return { 
        success: false, 
        message: 'Supabase URL is not configured in environment variables. Check your .env file.'
      };
    }
    
    if (!supabase.supabaseKey || supabase.supabaseKey === '') {
      return { 
        success: false, 
        message: 'Supabase anon key is not configured in environment variables. Check your .env file.'
      };
    }

    console.log('Testing connection to: ' + supabase.supabaseUrl);
    console.log('Using anon key: ' + supabase.supabaseKey.substring(0, 10) + '...');
    
    // Try a simple connection test first - just fetching server time
    const { data: pingData, error: pingError } = await supabase.rpc('ping');
    
    if (pingError) {
      console.error('Ping test failed:', pingError);
      
      // Check for specific network issues
      if (pingError.code === 'ENOTFOUND' || pingError.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: `Cannot reach Supabase server at ${supabase.supabaseUrl}. Make sure your local Supabase instance is running.`,
          error: pingError
        };
      }
      
      // Check for specific CORS issues
      if (pingError.message && pingError.message.includes('CORS')) {
        return {
          success: false,
          message: 'CORS error detected. Make sure your Supabase instance has the correct CORS configuration.',
          error: pingError
        };
      }
      
      // Generic connection error
      return { 
        success: false, 
        message: pingError.message || 'Failed to connect to Supabase server. Check if the server is running.', 
        error: pingError 
      };
    }
    
    // If the basic ping works, try accessing a table to check database permissions
    const { data: tableData, error: tableError, status, statusText } = await supabase
      .from('tasks')
      .select('count(*)', { count: 'exact', head: true });
    
    console.log('API response status:', status, statusText);
    
    if (tableError) {
      console.error('Tasks table check failed:', tableError, 'Status:', status);
      
      // If table doesn't exist
      if (tableError.code === '42P01' || (tableError.message && tableError.message.includes("relation") && tableError.message.includes("does not exist"))) {
        return { 
          success: false, 
          message: "The 'tasks' table doesn't exist. Have you run the schema.sql script in the SQL editor?", 
          error: tableError 
        };
      }
      
      // If this is an authentication issue (JWT token problem)
      if (status === 401 || status === 403 || 
          (tableError.message && tableError.message.toLowerCase().includes("jwt")) ||
          (tableError.message && tableError.message.toLowerCase().includes("auth"))) {
        return {
          success: false,
          message: "Authentication failed. Check that your anon key is correct in the .env file.",
          error: tableError
        };
      }
      
      // Other errors
      return { 
        success: false, 
        message: tableError.message || `Database error (${status}): Cannot access tasks table.`, 
        error: tableError 
      };
    }
    
    console.log('Successfully connected to Supabase!');
    return { 
      success: true, 
      message: 'Connected to Supabase successfully!',
      details: {
        url: supabase.supabaseUrl,
        status: status,
        response: tableData
      }
    };
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
    return { 
      success: false, 
      message: error.message || 'An unexpected error occurred while testing the connection.', 
      error 
    };
  }
};

// Helper function to extract the most useful error message
function extractErrorMessage(error) {
  if (!error) return 'Unknown error';
  if (typeof error === 'string') return error;
  
  // Handle common Supabase/PostgreSQL error formats
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.details) return error.details;
  if (error.hint) return `${error.message || 'Error'}: ${error.hint}`;
  
  // Network-related errors
  if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
    return `Server not found at ${supabase.supabaseUrl}. Check if Supabase is running at this address.`;
  }
  
  // Authentication errors
  if (error.code === 'invalid_grant' || error.code === 'invalid_client') {
    return 'Authentication failed. Check your Supabase anon key.';
  }
  
  // Last resort - stringify the error
  try {
    return JSON.stringify(error);
  } catch (e) {
    return 'Unknown error occurred';
  }
}