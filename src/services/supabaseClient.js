// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Validate configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase configuration missing!');
  console.error('Required environment variables:');
  console.error('- REACT_APP_SUPABASE_URL');
  console.error('- REACT_APP_SUPABASE_ANON_KEY');
  throw new Error('Supabase configuration is incomplete. Check your .env file.');
}

// Create options with session persistence and debugging
const options = {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: { 'Content-Type': 'application/json' }
  }
};

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey, options);

// Debug current auth state
supabase.auth.onAuthStateChange((event, session) => {
  console.log('Supabase auth state changed:', { event, user: session?.user?.email });
});

export default supabase;