import { AuthError, Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import * as authActions from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>, scanData?: any) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
  resetPassword: (email: string, redirectTo?: string) => Promise<{ error: AuthError | null }>;
  signInWithOAuth: (provider: 'google' | 'github' | 'apple', redirectTo?: string) => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, metadata?: Record<string, any>, scanData?: any): Promise<{ user: User | null; error: AuthError | null }> => {
    try {
      setLoading(true);

      // 1. Sign up
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: scanData ? { ...metadata, scanData } : metadata || {},
        },
      });

      if (error) {
        setLoading(false);
        return { user: null, error };
      }

      // 2. Wait for authenticated session (signUp sometimes returns user=null)
      let user = data.user;
      if (!user) {
        const { data: userData } = await supabase.auth.getUser();
        user = userData?.user;
      }

      if (!user) {
        setLoading(false);
        return { 
          user: null, 
          error: {
            name: 'SignUpError',
            message: 'User session not initialized after sign-up',
          } as AuthError
        };
      }

      // 3. Insert profile row (RLS requires id = auth.uid())
      const { error: profileError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
      });

      if (profileError) {
        console.log('Profile creation error:', profileError);
        setLoading(false);
        return { 
          user: null, 
          error: {
            name: 'ProfileCreationError',
            message: profileError.message || 'Failed to create profile',
          } as AuthError
        };
      }

      // Update local state
      setUser(user);

      setLoading(false);
      return { user, error: null };
    } catch (err) {
      setLoading(false);
      return {
        user: null,
        error: {
          name: 'SignUpError',
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
        } as AuthError,
      };
    }
  };

  const signIn = async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
    try {
      setLoading(true);
      const result = await authActions.signIn({ email, password });
      
      // The auth state change listener will update user state automatically
      // but we return the result immediately for the UI
      setLoading(false);
      return result;
    } catch (err) {
      setLoading(false);
      return {
        user: null,
        error: {
          name: 'SignInError',
          message: err instanceof Error ? err.message : 'An unexpected error occurred',
        } as AuthError,
      };
    }
  };

  const signOut = async () => {
    return authActions.signOut();
  };

  const resetPassword = async (email: string, redirectTo?: string) => {
    return authActions.resetPassword(email, redirectTo);
  };

  const signInWithOAuth = async (provider: 'google' | 'github' | 'apple', redirectTo?: string) => {
    return authActions.signInWithOAuth(provider, redirectTo);
  };

  const value: AuthContextType = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
    signInWithOAuth,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

