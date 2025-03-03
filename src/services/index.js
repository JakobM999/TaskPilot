// Services index file
// This file allows easy switching between mock and Supabase implementations

// Set this to true to use Supabase, false to use mock data
const USE_SUPABASE = true;  // Re-enabled Supabase integration

// Auth services
export const {
  signIn,
  signUp,
  signInWithMicrosoft,
  signOut,
  getCurrentUser,
  updateUserProfile,
  resetPassword
} = USE_SUPABASE 
  ? require('./authService.supabase')
  : require('./authService');

// Task services
export const {
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  toggleTaskCompletion,
  rescheduleTask
} = USE_SUPABASE 
  ? require('./taskService.supabase')
  : require('./taskService');