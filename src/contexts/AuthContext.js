import { jsx as _jsx } from "react/jsx-runtime";
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseAvailable } from '../lib/supabase';
const AuthContext = createContext(undefined);
export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        };
        if (isSupabaseAvailable) {
            getSession();
            const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
                setSession(session);
                setUser(session?.user ?? null);
                setLoading(false);
            });
            // Add event listener to refresh session on window focus
            window.addEventListener('focus', getSession);
            return () => {
                subscription.unsubscribe();
                window.removeEventListener('focus', getSession);
            };
        }
        else {
            setLoading(false);
        }
    }, []);
    const signOut = async () => {
        if (isSupabaseAvailable) {
            await supabase.auth.signOut();
        }
    };
    const value = {
        user,
        session,
        loading,
        signOut,
        isSupabaseAvailable,
    };
    return (_jsx(AuthContext.Provider, { value: value, children: children }));
}
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
