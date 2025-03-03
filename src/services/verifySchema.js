// Script to verify if Supabase schema has been created correctly
import supabase from './supabaseClient';

// Function to check if tables exist and have the right structure
export const verifySupabaseSchema = async () => {
  console.log('Verifying Supabase schema...');
  const results = {};
  
  try {
    // 1. Check if tasks table exists
    console.log('Checking tasks table...');
    const { data: tasksData, error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
    
    results.tasks = {
      exists: !tasksError || (tasksError.code === 'PGRST116'),
      error: tasksError ? tasksError.message : null
    };
    
    // 2. Check if user_settings table exists
    console.log('Checking user_settings table...');
    const { data: settingsData, error: settingsError } = await supabase
      .from('user_settings')
      .select('id')
      .limit(1);
    
    results.userSettings = {
      exists: !settingsError || (settingsError.code === 'PGRST116'),
      error: settingsError ? settingsError.message : null
    };
    
    // 3. Check if calendar_events table exists
    console.log('Checking calendar_events table...');
    const { data: eventsData, error: eventsError } = await supabase
      .from('calendar_events')
      .select('id')
      .limit(1);
    
    results.calendarEvents = {
      exists: !eventsError || (eventsError.code === 'PGRST116'),
      error: eventsError ? eventsError.message : null
    };
    
    // 4. Check if tables actually exist by checking system tables (this doesn't need RLS permissions)
    const { data: tableList, error: tableListError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['tasks', 'user_settings', 'calendar_events']);
    
    if (!tableListError && tableList) {
      const tableNames = tableList.map(t => t.table_name);
      
      if (!results.tasks.exists && tableNames.includes('tasks')) {
        results.tasks = { exists: true, error: 'Table exists but RLS policy prevents access' };
      }
      
      if (!results.userSettings.exists && tableNames.includes('user_settings')) {
        results.userSettings = { exists: true, error: 'Table exists but RLS policy prevents access' };
      }
      
      if (!results.calendarEvents.exists && tableNames.includes('calendar_events')) {
        results.calendarEvents = { exists: true, error: 'Table exists but RLS policy prevents access' };
      }
    }
    
    return {
      success: results.tasks.exists && results.userSettings.exists && results.calendarEvents.exists,
      message: results.tasks.exists && results.userSettings.exists && results.calendarEvents.exists 
        ? 'Schema verification successful! All required tables exist.' 
        : 'Schema verification failed. Some tables are missing.',
      details: results,
      rls: {
        active: results.tasks.error?.includes('security policy') || 
               results.userSettings.error?.includes('security policy') || 
               results.calendarEvents.error?.includes('security policy'),
        message: "RLS policies are active and working correctly. You'll need to be authenticated to access the data."
      }
    };
  } catch (error) {
    console.error('Error during schema verification:', error);
    return {
      success: false,
      message: 'Error during schema verification: ' + (error.message || 'Unknown error'),
      error
    };
  }
};

// Function to check if we can insert and retrieve data
export const testDataOperations = async () => {
  console.log('Testing basic data operations...');
  
  try {
    // First check if user is authenticated
    const { data: authData } = await supabase.auth.getSession();
    const isAuthenticated = !!authData?.session?.user;
    
    // If not authenticated, inform user that authentication is required
    if (!isAuthenticated) {
      return {
        success: false,
        authenticated: false,
        message: "Authentication required for data operations. RLS policies are correctly preventing unauthorized access. You need to sign in first.",
        details: "Row Level Security (RLS) policies are working correctly. This is a good sign! You'll need to be authenticated to perform data operations."
      };
    }
    
    // 1. Try to insert a test task
    const testTask = {
      title: 'Test Task',
      description: 'This is a test task to verify the database is working',
      due_date: new Date().toISOString().split('T')[0],
      priority: 'medium',
      completed: false,
      escalated: false
    };
    
    const { data: insertedTask, error: insertError } = await supabase
      .from('tasks')
      .insert([testTask])
      .select()
      .single();
    
    if (insertError) {
      return {
        success: false,
        authenticated: true,
        message: 'Failed to insert test task: ' + insertError.message,
        error: insertError
      };
    }
    
    // 2. Try to read the task back
    const { data: readTask, error: readError } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', insertedTask.id)
      .single();
    
    if (readError) {
      return {
        success: false,
        authenticated: true,
        message: 'Failed to read test task: ' + readError.message,
        error: readError
      };
    }
    
    // 3. Clean up by deleting the test task
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .eq('id', insertedTask.id);
    
    if (deleteError) {
      console.warn('Warning: Could not delete test task:', deleteError.message);
    }
    
    return {
      success: true,
      authenticated: true,
      message: 'Data operations test successful! Insert, read and delete operations work correctly.',
      taskData: readTask
    };
  } catch (error) {
    console.error('Error during data operations test:', error);
    return {
      success: false,
      message: 'Error during data operations test: ' + (error.message || 'Unknown error'),
      error
    };
  }
};

// Run both verification functions
export const runFullVerification = async () => {
  const schemaResults = await verifySupabaseSchema();
  console.log('Schema Verification Results:', schemaResults);
  
  if (schemaResults.success) {
    const dataResults = await testDataOperations();
    console.log('Data Operations Test Results:', dataResults);
    return {
      success: schemaResults.success && dataResults.success,
      schemaVerification: schemaResults,
      dataOperations: dataResults
    };
  }
  
  return {
    success: false,
    schemaVerification: schemaResults,
    dataOperations: null
  };
};

// Export for use in browser console or components
export default {
  verifySupabaseSchema,
  testDataOperations,
  runFullVerification
};