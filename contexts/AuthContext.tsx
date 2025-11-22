import { AuthError, Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Profile } from '../hooks/useProfile';
import * as authActions from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>, scanData?: any) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
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
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    async function fetchProfile() {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user!.id)
          .single();

        if (fetchError) {
          // If profile doesn't exist, create one
          if (fetchError.code === 'PGRST116') {
            const defaultUsername =
              user!.user_metadata?.full_name ||
              (user!.email ? user!.email.split('@')[0] : 'Runner');

            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                id: user!.id,
                username: defaultUsername,
              })
              .select()
              .single();

            if (createError) {
              console.error('Error creating profile:', createError);
              setProfile(null);
            } else {
              setProfile(newProfile);
            }
          } else {
            console.error('Error fetching profile:', fetchError);
            setProfile(null);
          }
        } else {
          setProfile(data);
        }
      } catch (err) {
        console.error('Error in fetchProfile:', err);
        setProfile(null);
      }
    }

    fetchProfile();
  }, [user]);

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

  const signUp = async (email: string, password: string, metadata?: Record<string, any>, scanData?: any) => {
    const signUpMetadata = scanData ? { ...metadata, scanData } : metadata;
    return authActions.signUp({ email, password, metadata: signUpMetadata });
  };

  const signIn = async (email: string, password: string): Promise<{ error?: string }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setLoading(false);
        return { error: error?.message || 'Invalid email or password.' };
      }

      const user = data.user;
      
      // Fetch profile after successful login
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        // If profile doesn't exist, create one
        if (profileError.code === 'PGRST116') {
          const defaultUsername =
            user.user_metadata?.full_name ||
            (user.email ? user.email.split('@')[0] : 'Runner');

          const { data: newProfile, error: createError } = await supabase
            .from('profiles')
            .insert({
              id: user.id,
              username: defaultUsername,
            })
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            setUser(user);
            setProfile(null);
          } else {
            setUser(user);
            setProfile(newProfile);
          }
        } else {
          console.warn('Profile fetch error:', profileError.message);
          setUser(user);
          setProfile(null);
        }
      } else {
        setUser(user);
        setProfile(profile);
      }
      
      setLoading(false);
      return {};
    } catch (e: any) {
      console.error('signIn error', e);
      setLoading(false);
      return { error: 'Something went wrong. Please try again.' };
    }
  };

  const signOut = async (): Promise<void> => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
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
    profile,
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

