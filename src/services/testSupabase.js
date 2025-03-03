// Test file to verify Supabase connection
import supabase from './supabaseClient';

// Simple function to test Supabase connection
export const testSupabaseConnection = async () => {
  try {
    // Try to query a simple system table that should always exist
    const { data, error } = await supabase
      .from('tasks')
      .select('count()', { count: 'exact', head: true });
    
    if (error) {
      console.error('Error connecting to Supabase:', error);
      return { success: false, message: error.message, error };
    }
    
    console.log('Successfully connected to Supabase!');
    console.log('Task count:', data);
    return { success: true, message: 'Connected to Supabase successfully!' };
  } catch (error) {
    console.error('Exception when connecting to Supabase:', error);
    return { success: false, message: error.message, error };
  }
};

// You can run this in your browser console or a component
// import { testSupabaseConnection } from './services/testSupabase';
// testSupabaseConnection().then(result => console.log(result));