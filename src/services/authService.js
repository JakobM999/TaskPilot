// Mock authentication service for demonstration
const DEMO_USER = {
  email: 'demo@example.com',
  password: 'demo123',
  user_metadata: {
    full_name: 'Demo User'
  }
};

export const signUp = async (email, password) => {
  // For demo purposes, always return error for signup
  return {
    user: null,
    error: { message: 'Sign up is disabled in demo mode. Please use the demo account.' }
  };
};

export const signIn = async (email, password) => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 800));

  if (email === DEMO_USER.email && password === DEMO_USER.password) {
    return { user: DEMO_USER, error: null };
  }
  return {
    user: null,
    error: { message: 'Invalid credentials. Use demo@example.com / demo123' }
  };
};

export const signInWithMicrosoft = async () => {
  // For demo purposes, return error for Microsoft login
  return {
    user: null,
    error: { message: 'Microsoft login is disabled in demo mode. Please use the demo account.' }
  };
};

export const signOut = async () => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  return { error: null };
};

export const getCurrentUser = async () => {
  // For demo purposes, always return null initially
  return { user: null, error: null };
};

// Export a mock supabase client for compatibility
export const supabase = {
  auth: {
    signUp: () => Promise.resolve({ user: null, error: null }),
    signInWithPassword: () => Promise.resolve({ user: null, error: null }),
    signOut: () => Promise.resolve({ error: null }),
    getUser: () => Promise.resolve({ data: { user: null }, error: null })
  }
};