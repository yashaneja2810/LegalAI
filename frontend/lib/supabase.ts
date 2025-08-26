import { createClient } from '@supabase/supabase-js';

// Use hardcoded values to avoid environment variable issues
const supabaseUrl = 'https://ksvsugdzdbgetnewzmej.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtzdnN1Z2R6ZGJnZXRuZXd6bWVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYxOTE2OTgsImV4cCI6MjA3MTc2NzY5OH0.Mq8hnbj4CJ7WGLbb_jkJN8jhqRu-XHLsUyUPBYgIylA';

// Debug logging for environment variables
if (typeof window !== 'undefined') {
  console.log('Supabase URL:', supabaseUrl);
  console.log('Supabase Key exists:', !!supabaseKey);
}

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('NEXT_PUBLIC_SUPABASE_ANON_KEY exists:', !!supabaseKey);
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });
  return { data, error };
};

export const signInWithEmail = async (email: string, password: string) => {
  try {
    console.log('Attempting to sign in with email:', email);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signin error:', error);
    } else {
      console.log('Signin successful:', data);
    }

    return { data, error };
  } catch (err) {
    console.error('Network or unexpected error during signin:', err);
    return {
      data: null,
      error: {
        message: 'Network error. Please check your connection and try again.',
        name: 'NetworkError'
      }
    };
  }
};

export const signUpWithEmail = async (email: string, password: string) => {
  try {
    console.log('Attempting to sign up with email:', email);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signup error:', error);
    } else {
      console.log('Signup successful:', data);
    }

    return { data, error };
  } catch (err) {
    console.error('Network or unexpected error during signup:', err);
    return {
      data: null,
      error: {
        message: 'Network error. Please check your connection and try again.',
        name: 'NetworkError'
      }
    };
  }
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};
