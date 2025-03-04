// Mock Authentication Service
// This will be replaced with Supabase authentication

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'password',
  user_metadata: {
    full_name: 'Test User'
  }
};

// Sign in a user
export const signIn = async (email, password) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // For the mock service, make login easier with a test user that always works
  if ((email === TEST_USER.email && password === TEST_USER.password) || 
      // Also allow any email with "test" password for convenience
      password === 'test') {
    
    // Create a mock user object similar to Supabase structure
    const mockUser = {
      id: '123456',
      email: email,
      user_metadata: TEST_USER.user_metadata,
      app_metadata: {
        provider: 'email'
      }
    };
    
    // Store mock user in localStorage to persist login state
    localStorage.setItem('taskpilot_user', JSON.stringify(mockUser));
    
    return { 
      user: mockUser, 
      error: null 
    };
  }
  
  // All other credentials fail
  return {
    user: null,
    error: {
      message: 'Invalid login credentials'
    }
  };
};

// Sign up a new user
export const signUp = async (email, password) => {
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // In mock mode, we'll just "log in" after sign up
  const mockUser = {
    id: 'new_user_' + Date.now(),
    email: email,
    user_metadata: {
      full_name: email.split('@')[0]
    },
    app_metadata: {
      provider: 'email'
    }
  };
  
  localStorage.setItem('taskpilot_user', JSON.stringify(mockUser));
  
  return { user: mockUser, error: null };
};

// Sign in with Microsoft (mock)
export const signInWithMicrosoft = async () => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Mock Microsoft login (always succeeds)
  const mockUser = {
    id: 'ms_user_' + Date.now(),
    email: 'microsoft@example.com',
    user_metadata: {
      full_name: 'Microsoft User',
      avatar_url: 'https://via.placeholder.com/150'
    },
    app_metadata: {
      provider: 'microsoft'
    }
  };
  
  localStorage.setItem('taskpilot_user', JSON.stringify(mockUser));
  
  return { user: mockUser, error: null };
};

// Sign out
export const signOut = async () => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Clear mock user from localStorage
  localStorage.removeItem('taskpilot_user');
  
  return { error: null };
};

// Get current user
export const getCurrentUser = async () => {
  await new Promise(resolve => setTimeout(resolve, 300));
  
  // Get user from localStorage if exists
  const userJson = localStorage.getItem('taskpilot_user');
  if (userJson) {
    return { user: JSON.parse(userJson), error: null };
  }
  
  return { user: null, error: null };
};

// Update user profile (mock)
export const updateUserProfile = async (updates) => {
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Get current mock user
  const userJson = localStorage.getItem('taskpilot_user');
  if (!userJson) {
    return { 
      user: null, 
      error: { message: 'No user logged in' }
    };
  }
  
  // Update the user
  const user = JSON.parse(userJson);
  const updatedUser = {
    ...user,
    user_metadata: {
      ...user.user_metadata,
      ...updates
    }
  };
  
  // Save updated user
  localStorage.setItem('taskpilot_user', JSON.stringify(updatedUser));
  
  return { user: updatedUser, error: null };
};

// Password reset (mock)
export const resetPassword = async (email) => {
  await new Promise(resolve => setTimeout(resolve, 800));
  
  return { error: null };
};