// Utility for adding test tasks when needed
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('ERROR: Supabase credentials not found in environment variables.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper function to format date for database
const formatDate = (date) => {
  const localDate = new Date(date);
  localDate.setHours(0, 0, 0, 0);
  const offset = localDate.getTimezoneOffset();
  const utcDate = new Date(localDate.getTime() - (offset * 60 * 1000));
  return utcDate.toISOString();
};

// Create a single test task
const createTestTask = async (user, taskData) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        ...taskData,
        user_id: user.id
      }])
      .select()
      .single();
    
    if (error) throw error;
    console.log(`Created test task: ${data.title}`);
    return data;
  } catch (err) {
    console.error('Error creating test task:', err);
    throw err;
  }
};

// Sign in helper
const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data.user;
};

// Create test task
const createSampleTask = async (email, password) => {
  try {
    const user = await signIn(email, password);
    console.log('Signed in as:', user.email);

    // Create single test task for today with high priority
    const today = new Date();
    await createTestTask(user, {
      title: "Sample Task",
      description: "This is a sample task for testing",
      due_date: formatDate(today),
      priority: "high",
      category: "work",
      completed: false,
      escalated: true
    });

    console.log('Test task created successfully');
  } catch (err) {
    console.error('Error in createSampleTask:', err);
  }
};

// Only run if directly invoked
if (require.main === module) {
  const email = process.argv[2];
  const password = process.argv[3];
  
  if (!email || !password) {
    console.error('Usage: node addTestTasks.js <email> <password>');
    process.exit(1);
  }
  
  createSampleTask(email, password);
}