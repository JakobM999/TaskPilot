// Supabase Authentication Service
import supabase from './supabaseClient';

// Sign up a new user
export const signUp = async (email, password, metadata = {}) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata // Store additional user data like full_name
      }
    });
    
    if (error) throw error;
    
    // If sign up is successful, create default user settings
    if (data?.user) {
      await createDefaultUserSettings(data.user.id);
    }
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error signing up:', error);
    return { user: null, error };
  }
};

// Sign in a user with email and password
export const signIn = async (email, password) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error signing in:', error);
    return { user: null, error };
  }
};

// Sign in with Microsoft
export const signInWithMicrosoft = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'microsoft'
    });
    
    if (error) throw error;
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error signing in with Microsoft:', error);
    return { user: null, error };
  }
};

// Sign out
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error signing out:', error);
    return { error };
  }
};

// Get current user
export const getCurrentUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();
    
    if (error) throw error;
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error getting current user:', error);
    return { user: null, error };
  }
};

// Create default user settings
const createDefaultUserSettings = async (userId) => {
  try {
    const { error } = await supabase
      .from('user_settings')
      .insert([{ user_id: userId }]);
    
    if (error) throw error;
  } catch (error) {
    console.error('Error creating default user settings:', error);
  }
};

// Update user profile
export const updateUserProfile = async (updates) => {
  try {
    const { data, error } = await supabase.auth.updateUser({
      data: updates
    });
    
    if (error) throw error;
    
    return { user: data.user, error: null };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return { user: null, error };
  }
};

// Password reset
export const resetPassword = async (email) => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
    
    if (error) throw error;
    
    return { error: null };
  } catch (error) {
    console.error('Error resetting password:', error);
    return { error };
  }
};

// Export the supabase client for direct access if needed
export { supabase };