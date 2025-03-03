// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Provide debugging information about the configuration
if (!supabaseUrl || supabaseUrl === '') {
  console.error('Supabase URL is not configured. Make sure REACT_APP_SUPABASE_URL is set in your .env file.');
}

if (!supabaseAnonKey || supabaseAnonKey === '') {
  console.error('Supabase Anonymous Key is not configured. Make sure REACT_APP_SUPABASE_ANON_KEY is set in your .env file.');
}

// Create options with session persistence and debugging
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage  // Explicitly use localStorage
  },
  global: {
    headers: {
      'Content-Type': 'application/json'
    }
  }
};

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Debug current auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth event:', event);
  console.log('Session:', session ? 'Active' : 'None');
});

export default supabase;