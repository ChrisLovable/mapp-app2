import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase environment variables are available
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey;

// Create a comprehensive mock client if Supabase is not configured
const createMockClient = () => {
  // Create a mock error with code property
  const createMockError = () => {
    const error = new Error('Supabase not configured');
    (error as any).code = '23505'; // Add code property for PostgrestError compatibility
    return error;
  };

  // Create a chainable mock query builder
  const createMockQueryBuilder = () => {
    const mockBuilder = {
      data: [],
      error: createMockError(),
      select: () => mockBuilder,
      insert: () => mockBuilder,
      update: () => mockBuilder,
      delete: () => mockBuilder,
      upsert: () => mockBuilder,
      eq: () => mockBuilder,
      order: () => mockBuilder,
      limit: () => mockBuilder,
      single: () => mockBuilder
    };
    return mockBuilder;
  };

  return {
    auth: {
      getSession: async () => ({ data: { session: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: async () => ({ error: null }),
      signInWithPassword: async () => ({ data: null, error: createMockError() }),
      signUp: async () => ({ data: null, error: createMockError() }),
      resetPasswordForEmail: async () => ({ error: createMockError() }),
      getUser: async () => ({ data: { user: null }, error: null })
    },
    from: (table: string) => createMockQueryBuilder(),
    storage: {
      from: (bucket: string) => ({
        upload: async () => ({ data: null, error: createMockError() }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: async () => ({ data: null, error: createMockError() })
      })
    }
  };
};

// Export the real client if configured, otherwise export mock client
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : createMockClient();

// Export a flag to check if Supabase is properly configured
export const isSupabaseAvailable = isSupabaseConfigured;
