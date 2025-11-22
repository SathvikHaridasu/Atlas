import { AuthError, Session, User } from '@supabase/supabase-js';
import React, { createContext, ReactNode, useContext, useEffect, useState } from 'react';
import { Profile } from '../hooks/useProfile';
import * as authActions from '../lib/auth';
import { supabase } from '../lib/supabaseClient';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>, scanData?: any) => Promise<{ user: User | null; error: AuthError | null }>;
  signIn: (email: string, password: string) => Promise<{ user: User | null; error: AuthError | null }>;
<<<<<<< Updated upstream
  signOut: () => Promise<{ error: AuthError | null }>;
=======
  signOut: () => Promise<void>;
>>>>>>> Stashed changes
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

<<<<<<< Updated upstream
=======
  // Fetch profile when user changes
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const currentUser = user; // Store in const for TypeScript

    async function fetchProfile() {
      try {
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', currentUser.id)
          .single();

        if (fetchError) {
          // If profile doesn't exist, create one
          if (fetchError.code === 'PGRST116') {
            const defaultUsername =
              currentUser.user_metadata?.full_name ||
              (currentUser.email ? currentUser.email.split('@')[0] : 'Runner');
            
            const { data: newProfile, error: createError } = await supabase
              .from('profiles')
              .insert({
                user_id: currentUser.id,
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

>>>>>>> Stashed changes
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
      const profileData: Record<string, any> = {
        id: user.id,
        email: user.email,
        created_at: new Date().toISOString(),
      };

      // Add scanData to profile if provided
      if (scanData) {
        profileData.scanData = scanData;
      }

      // Add username if available from metadata
      const defaultUsername =
        user.user_metadata?.full_name ||
        (user.email ? user.email.split('@')[0] : 'Runner');
      profileData.username = defaultUsername;

      const { error: profileError } = await supabase
        .from('profiles')
        .insert(profileData);

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
      
      // Fetch the created profile
      const { data: profile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!fetchError && profile) {
        setProfile(profile);
      }

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

<<<<<<< Updated upstream
  const signIn = async (email: string, password: string) => {
    return authActions.signIn({ email, password });
=======
  const signIn = async (email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error || !data.user) {
        setLoading(false);
        return { 
          user: null, 
          error: error || {
            name: 'SignInError',
            message: 'Invalid email or password.',
          } as AuthError
        };
      }

      const user = data.user;
      
      // Fetch profile after successful login
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
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
              user_id: user.id,
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
      return { user, error: null };
    } catch (e: any) {
      console.error('signIn error', e);
      setLoading(false);
      return { 
        user: null, 
        error: {
          name: 'SignInError',
          message: e instanceof Error ? e.message : 'Something went wrong. Please try again.',
        } as AuthError
      };
    }
>>>>>>> Stashed changes
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

