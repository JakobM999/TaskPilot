// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// When deploying your app, these environment variables should be set in your hosting environment
// For local development, you can create a .env file with these values
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || '';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || '';

// Create a single supabase client for interacting with your database
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default supabase;