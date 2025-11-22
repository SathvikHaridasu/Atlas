import type { AuthError, User } from '@supabase/supabase-js';
import { supabase } from './supabaseClient';

export interface AuthResponse {
  user: User | null;
  error: AuthError | null;
}

export interface SignUpData {
  email: string;
  password: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}

/**
 * Sign up a new user with email and password
 * Automatically creates a profile entry in the profiles table
 */
export async function signUp({ email, password, metadata }: SignUpData): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: metadata || {},
      },
    });

    if (error) {
      return { user: null, error };
    }

    // Create profile entry if user was created successfully
    if (data.user) {
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: data.user.id,
          email: data.user.email,
          // Add any default profile fields here
        })
        .select()
        .single();

      // If profile creation fails, log it but don't fail the sign-up
      // (the profile might already exist or there might be a trigger)
      if (profileError && !profileError.message.includes('duplicate')) {
        console.warn('Profile creation error:', profileError);
      }
    }

    return { user: data.user, error: null };
  } catch (err) {
    return {
      user: null,
      error: {
        name: 'SignUpError',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      } as AuthError,
    };
  }
}

/**
 * Sign in an existing user with email and password
 */
export async function signIn({ email, password }: SignInData): Promise<AuthResponse> {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    return { user: data.user, error };
  } catch (err) {
    return {
      user: null,
      error: {
        name: 'SignInError',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      } as AuthError,
    };
  }
}

/**
 * Sign out the current user
 */
export async function signOut(): Promise<{ error: AuthError | null }> {
  try {
    const { error } = await supabase.auth.signOut();
    return { error };
  } catch (err) {
    return {
      error: {
        name: 'SignOutError',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      } as AuthError,
    };
  }
}

/**
 * Send password reset email
 */
export async function resetPassword(email: string, redirectTo?: string): Promise<{ error: AuthError | null }> {
  try {
    // Get redirect URL - use provided one or try to construct from window (web only)
    let redirectUrl = redirectTo;
    if (!redirectUrl && typeof window !== 'undefined') {
      redirectUrl = `${window.location.origin}/reset-password`;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      ...(redirectUrl && { redirectTo: redirectUrl }),
    });

    return { error };
  } catch (err) {
    return {
      error: {
        name: 'ResetPasswordError',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      } as AuthError,
    };
  }
}

/**
 * Get the current authenticated user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      console.error('Error getting current user:', error);
      return null;
    }
    return user;
  } catch (err) {
    console.error('Unexpected error getting current user:', err);
    return null;
  }
}

/**
 * Sign in with OAuth provider (Google, GitHub, etc.)
 */
export async function signInWithOAuth(provider: 'google' | 'github' | 'apple', redirectTo?: string): Promise<{ error: AuthError | null }> {
  try {
    // Get redirect URL - use provided one or try to construct from window (web only)
    let redirectUrl = redirectTo;
    if (!redirectUrl && typeof window !== 'undefined') {
      redirectUrl = `${window.location.origin}/auth/callback`;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      ...(redirectUrl && {
        options: {
          redirectTo: redirectUrl,
        },
      }),
    });

    return { error };
  } catch (err) {
    return {
      error: {
        name: 'OAuthError',
        message: err instanceof Error ? err.message : 'An unexpected error occurred',
      } as AuthError,
    };
  }
}

