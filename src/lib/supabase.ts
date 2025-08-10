import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Check if Supabase environment variables are available and not empty
const isSupabaseConfigured = supabaseUrl?.trim() && supabaseAnonKey?.trim();

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
      updateUser: async () => ({ data: null, error: createMockError() }),
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

// Realtime helper: subscribe to table changes for a specific user
export type RealtimeUnsubscribe = () => void;

export function subscribeToUserExpenses(
  userId: string,
  onInsert: (row: any) => void,
  onError?: (err: any) => void
): RealtimeUnsubscribe {
  try {
    // @supabase/supabase-js v2 Realtime channel
    // Filter server-side: table=expense_tracker, event=INSERT
    const channel = (supabase as any).channel?.(`exp-tracker-${userId}`) || null;
    if (!channel) {
      // Fallback for mock or older clients: no-op
      return () => {};
    }

    channel
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'expense_tracker',
          filter: `user_id=eq.${userId}`
        },
        (payload: any) => {
          try { onInsert(payload.new); } catch {}
        }
      )
      .subscribe((status: any) => {
        if (status === 'CHANNEL_ERROR') {
          onError?.(new Error('Realtime channel error for expense_tracker'));
        }
      });

    return () => {
      try { (supabase as any).removeChannel?.(channel); } catch {}
    };
  } catch (err) {
    onError?.(err);
    return () => {};
  }
}