import React from 'react';
import type { User } from '@supabase/supabase-js';
interface AuthContextType {
    user: User | null;
    session: any | null;
    loading: boolean;
    signOut: () => Promise<void>;
    isSupabaseAvailable: boolean;
}
export declare function AuthProvider({ children }: {
    children: React.ReactNode;
}): import("react/jsx-runtime").JSX.Element;
export declare function useAuth(): AuthContextType;
export {};
