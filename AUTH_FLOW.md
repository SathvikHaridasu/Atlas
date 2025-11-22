# Authentication Flow Implementation

This document describes the complete authentication flow with Supabase integration for the Atlas app.

## Overview

The app implements a **Scan → Auth → Portal** flow where:
1. Users can scan (or attempt to scan)
2. If not authenticated, they're redirected to sign-in/sign-up
3. Scan data is preserved and saved to their profile after authentication
4. Users access a personalized portal showing their profile and scan data

## Architecture

### Key Components

1. **Supabase Client** (`lib/supabaseClient.ts`)
   - Reads credentials from `app.json` via `expo-constants` (prioritized)
   - Falls back to environment variables if needed
   - Configured with auto-refresh and session persistence

2. **Auth Context** (`contexts/AuthContext.tsx`)
   - Provides global authentication state
   - Exposes `signUp`, `signIn`, `signOut` functions
   - Listens to auth state changes

3. **Scan Context** (`contexts/ScanContext.tsx`)
   - Temporarily stores scan data when user is not authenticated
   - Allows scan data to be passed from scan screen to auth screen
   - Cleared after successful authentication

4. **Profile Hook** (`hooks/useProfile.ts`)
   - Fetches user profile from Supabase
   - Automatically creates profile if missing
   - Supports updating profile including scan data

### Screens

1. **Scan Screen** (`app/scan.tsx`)
   - Placeholder scan interface
   - If user not authenticated: stores scan data in context and redirects to auth
   - If user authenticated: saves scan data directly to profile

2. **Auth Screen** (`app/auth.tsx`)
   - Sign-in and Sign-up forms
   - Toggles between sign-in and sign-up modes
   - On sign-up: passes scanData from context to create profile with scan data
   - On sign-in: redirects to portal (scanData saved there if present)

3. **Portal Screen** (`app/portal.tsx`)
   - Displays user profile information
   - Shows scan data if available
   - Handles saving scanData for signed-in users who scanned before auth
   - Sign-out functionality

### Routing

The root layout (`app/_layout.tsx`) handles authentication-based routing:
- Unauthenticated users → redirected to `/auth` (except when on `/scan`)
- Authenticated users on `/auth` → redirected to `/portal`
- All screens are protected based on auth state

## Flow Diagram

```
User opens app
    ↓
Check auth state
    ↓
┌─────────────────┐
│  Not Authenticated │
└─────────────────┘
    ↓
User goes to Scan
    ↓
User scans → scanData stored in context
    ↓
Redirect to Auth
    ↓
User signs up/signs in
    ↓
┌─────────────────┐
│   Authenticated   │
└─────────────────┘
    ↓
Redirect to Portal
    ↓
Profile created/updated with scanData
    ↓
Portal displays profile + scanData
```

## Database Schema

Ensure your Supabase `profiles` table has:

```sql
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  scanData JSONB,  -- Stores scan data
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Configuration

### Supabase Credentials

Credentials are configured in `app.json`:

```json
{
  "expo": {
    "extra": {
      "supabaseUrl": "https://your-project.supabase.co",
      "supabaseAnonKey": "your-anon-key"
    }
  }
}
```

### Supabase Setup Checklist

1. ✅ Enable Email/Password authentication in Supabase Dashboard
2. ✅ Create `profiles` table with `user_id` as primary key
3. ✅ Add `scanData` column (JSONB type recommended)
4. ✅ Configure Row Level Security (RLS) policies:
   - Users can read their own profile
   - Users can update their own profile
   - Users can insert their own profile (on sign-up)

Example RLS policies:

```sql
-- Allow users to read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow users to insert their own profile
CREATE POLICY "Users can insert own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Usage Examples

### Sign Up with Scan Data

```typescript
const { signUp } = useAuth();
const { scanData } = useScan();

// Scan data is automatically passed during sign-up
await signUp(email, password, undefined, scanData);
```

### Update Profile with Scan Data

```typescript
const { updateProfile } = useProfile();

await updateProfile({
  scanData: {
    timestamp: new Date().toISOString(),
    type: 'qr_code',
    data: 'scan-result',
  }
});
```

### Access Profile and Scan Data

```typescript
const { profile, loading } = useProfile();

if (profile?.scanData) {
  console.log('Scan data:', profile.scanData);
}
```

## Error Handling

All authentication and database operations include error handling:
- User-friendly alerts for auth errors
- Console logging for debugging
- Graceful fallbacks when profile creation fails

## Security Notes

1. **Credentials**: Stored in `app.json` (committed to repo). For production, consider using environment variables or Expo Secrets.
2. **RLS Policies**: Ensure proper Row Level Security is configured in Supabase.
3. **Scan Data**: Validate and sanitize scan data before storing in database.
4. **Session Management**: Supabase handles token refresh automatically.

## Next Steps

1. Replace placeholder scan functionality with actual barcode/QR scanner (e.g., `expo-barcode-scanner`)
2. Add profile editing functionality
3. Implement scan history (store multiple scans)
4. Add OAuth providers (Google, GitHub, Apple) if needed
5. Add password reset flow UI
6. Implement proper error boundaries

