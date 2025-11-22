# Troubleshooting Guide for Account Creation + Profile Flow + Post-Login Navigation

## Database Issues

### RLS Errors (42501)
- **Symptom**: Getting 42501 permission denied errors when accessing profiles table.
- **Cause**: Row Level Security policies not applied or incorrect.
- **Fix**: Run the migration SQL in Supabase SQL Editor. Ensure policies are created with correct auth.uid() checks.

### Schema Cache Errors (PGRST204)
- **Symptom**: Table not found or schema issues.
- **Cause**: Migration not run or schema mismatch.
- **Fix**: Run `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='profiles';` to check columns. If "Email" is quoted/capitalized, run `ALTER TABLE public.profiles RENAME COLUMN "Email" TO email;`.

## Navigation Issues

### Still Seeing "Explore" Tab
- **Symptom**: Default Expo Router "Explore" screen appears instead of custom tabs.
- **Cause**: Expo Router auto-generating routes from app/(tabs).
- **Fix**: Delete the `app/(tabs)` directory entirely. Ensure `app/_layout.tsx` uses `RootNavigator` instead of Expo Router Stack.

### Stuck on One Screen (e.g., Home Only)
- **Symptom**: Can only see Home screen, other tabs not accessible.
- **Cause**: Tabs not properly registered in `Tabs.tsx` or conflicting Expo Router routes.
- **Fix**: Verify all screens are imported and added as `Tab.Screen` in `src/navigation/Tabs.tsx`. Remove any `app/(tabs)` files.

### Missing Routes or Dead Tabs
- **Symptom**: Tapping a tab does nothing or shows error.
- **Cause**: Screen component not exported or import path wrong.
- **Fix**: Check `src/navigation/Tabs.tsx` imports match file names in `src/screens/`. Ensure all screens export default function.

## Profile Creation Issues

### Profile Not Created on Sign Up
- **Symptom**: User signs up but no profile row in database.
- **Cause**: AuthContext not handling profile creation or race conditions.
- **Fix**: Ensure `AuthContext.tsx` has `ensureProfileExists` logic in signIn/signUp. Check for RLS policy allowing inserts.

### Email Column Mismatch
- **Symptom**: Profile upsert fails due to email field.
- **Cause**: DB schema has email but payload doesn't match.
- **Fix**: Remove email from upsert if not in DB schema. Check migration for exact column names.

## Expo Router Conflicts

### Auto-Generated Routes Interfering
- **Symptom**: Navigation not working as expected, seeing unexpected screens.
- **Cause**: Expo Router generating routes from files in `app/`.
- **Fix**: Use custom navigation in `src/navigation/`. Set `app/_layout.tsx` to only wrap `RootNavigator` with providers. Avoid file-based routing in `app/` for main navigation.

### Still Seeing Auth Redirects
- **Symptom**: Expo Router redirecting to /auth or /portal.
- **Cause**: Old Expo Router logic in `_layout.tsx`.
- **Fix**: Replace with simple provider wrapping `RootNavigator`.

## General Fixes

### No Bottom Tabs After Login
- **Symptom**: User logs in but sees no tabs.
- **Cause**: `RootNavigator` not rendering `Tabs` for authenticated users.
- **Fix**: Check `useAuth` hook returns correct `user` state. Ensure `Tabs` component is properly imported.

### Screen Not Showing Content
- **Symptom**: Tab navigates but screen is blank.
- **Cause**: Screen component not rendering or export issue.
- **Fix**: Simplify screens to basic templates. Ensure default export.

### Build Errors
- **Symptom**: TypeScript or Metro errors.
- **Cause**: Import paths wrong or missing dependencies.
- **Fix**: Use relative imports. Install required packages: `@react-navigation/native`, `react-native-screens`, `react-native-safe-area-context`, `@react-navigation/native-stack`, `@react-navigation/bottom-tabs`.

## Testing Checklist

1. Run migration in Supabase.
2. Create new user via sign up.
3. Check profiles table: `select * from profiles where id = '<user-id>';`
4. Verify bottom tabs appear after login.
5. Tap each tab: Home, Run, Messages, Profile, Settings.
6. Ensure no "Explore" or fallback screens.
7. Check no RLS errors in console.