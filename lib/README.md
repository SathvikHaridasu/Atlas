# Supabase Authentication Integration

This directory contains the Supabase client and authentication utilities for the Atlas app.

## Setup

1. **Environment Variables**: Create a `.env` file in the root directory with your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

Alternatively, you can add these to your `app.json` under `extra`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "your_supabase_project_url",
      "supabaseAnonKey": "your_supabase_anon_key"
    }
  }
}
```

2. **Database Setup**: Ensure your Supabase project has:
   - A `profiles` table with at least a `user_id` column (UUID, primary key, references `auth.users.id`)
   - Row Level Security (RLS) policies configured appropriately

## Usage

### Using the Auth Context

```tsx
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading, signIn, signOut } = useAuth();

  if (loading) return <Text>Loading...</Text>;
  if (!user) return <Text>Not logged in</Text>;

  return (
    <View>
      <Text>Welcome, {user.email}!</Text>
      <Button onPress={signOut} title="Sign Out" />
    </View>
  );
}
```

### Sign Up

```tsx
const { signUp } = useAuth();

const handleSignUp = async () => {
  const { user, error } = await signUp('user@example.com', 'password123');
  if (error) {
    console.error('Sign up error:', error.message);
  } else {
    console.log('User created:', user);
  }
};
```

### Sign In

```tsx
const { signIn } = useAuth();

const handleSignIn = async () => {
  const { user, error } = await signIn('user@example.com', 'password123');
  if (error) {
    console.error('Sign in error:', error.message);
  } else {
    console.log('Signed in:', user);
  }
};
```

### Using Profile Hook

```tsx
import { useProfile } from '@/hooks/useProfile';

function ProfileComponent() {
  const { profile, loading, error, updateProfile } = useProfile();

  if (loading) return <Text>Loading profile...</Text>;
  if (error) return <Text>Error: {error.message}</Text>;

  return (
    <View>
      <Text>Email: {profile?.email}</Text>
      <Text>Name: {profile?.full_name || 'Not set'}</Text>
      <Button
        onPress={() => updateProfile({ full_name: 'John Doe' })}
        title="Update Name"
      />
    </View>
  );
}
```

### OAuth Sign In

```tsx
const { signInWithOAuth } = useAuth();

const handleGoogleSignIn = async () => {
  const { error } = await signInWithOAuth('google');
  if (error) {
    console.error('OAuth error:', error.message);
  }
};
```

### Password Reset

```tsx
const { resetPassword } = useAuth();

const handleResetPassword = async () => {
  const { error } = await resetPassword('user@example.com');
  if (error) {
    console.error('Reset error:', error.message);
  } else {
    console.log('Password reset email sent');
  }
};
```

## Files

- `supabaseClient.ts`: Supabase client initialization
- `auth.ts`: Authentication functions (signUp, signIn, signOut, resetPassword, OAuth)
- `../contexts/AuthContext.tsx`: React context for global auth state
- `../hooks/useProfile.ts`: Hook for fetching and updating user profile

