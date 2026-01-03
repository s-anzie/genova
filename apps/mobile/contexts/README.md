# State Management Contexts

This directory contains React Context providers for global state management in the Genova mobile app.

## Available Contexts

### 1. AuthContext (`auth-context.tsx`)
Manages user authentication state and operations.

**Features:**
- User login/logout
- Registration
- Token management (automatic refresh)
- Password reset
- Biometric authentication
- Secure token storage

**Usage:**
```tsx
import { useAuth } from '@/contexts';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  // Use authentication state and methods
}
```

### 2. ProfileContext (`profile-context.tsx`)
Manages user profile data for both students and tutors.

**Features:**
- Load user profile
- Update user information
- Manage student-specific profile
- Manage tutor-specific profile
- Avatar upload

**Usage:**
```tsx
import { useProfile } from '@/contexts';

function ProfileScreen() {
  const { 
    user, 
    studentProfile, 
    tutorProfile, 
    updateUserProfile,
    uploadAvatar 
  } = useProfile();
  
  // Use profile data and methods
}
```

### 3. SessionContext (`session-context.tsx`)
Manages tutoring sessions state and operations.

**Features:**
- Load all sessions
- Filter sessions (upcoming, past, pending, today)
- Create/update/cancel sessions
- Session confirmation
- Check-in/check-out functionality
- Automatic session categorization

**Usage:**
```tsx
import { useSession } from '@/contexts';

function SessionsScreen() {
  const { 
    sessions,
    upcomingSessions,
    nextSession,
    createSession,
    cancelSession,
    checkInSession
  } = useSession();
  
  // Use session data and methods
}
```

### 4. NotificationContext (`notification-context.tsx`)
Manages push notifications and in-app notifications.

**Features:**
- Load notifications
- Mark as read (single/all)
- Delete notifications
- Notification preferences
- Push notification permissions
- Automatic polling (60s interval)
- Badge count management

**Usage:**
```tsx
import { useNotification } from '@/contexts';

function NotificationsScreen() {
  const { 
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    requestPermissions
  } = useNotification();
  
  // Use notification data and methods
}
```

## Setup

All contexts are automatically provided at the app root level via the `AppProviders` component in `app/_layout.tsx`.

The provider hierarchy is:
```
AuthProvider
  └─ ProfileProvider
      └─ SessionProvider
          └─ NotificationProvider
              └─ App Content
```

This ensures that:
1. Auth is available first (required by other contexts)
2. Profile depends on auth
3. Sessions depend on auth
4. Notifications depend on auth

## Best Practices

### 1. Use contexts for global state only
- User authentication
- User profile
- Sessions list
- Notifications

### 2. Use local state for component-specific data
- Form inputs
- UI toggles
- Temporary data

### 3. Avoid prop drilling
Instead of passing data through multiple components, use contexts:

❌ Bad:
```tsx
<Parent user={user}>
  <Child user={user}>
    <GrandChild user={user} />
  </Child>
</Parent>
```

✅ Good:
```tsx
function GrandChild() {
  const { user } = useAuth();
  // Use user directly
}
```

### 4. Handle loading states
All contexts provide loading states:

```tsx
const { user, isLoading } = useProfile();

if (isLoading) {
  return <LoadingSpinner />;
}

return <ProfileView user={user} />;
```

### 5. Handle errors
All contexts provide error states:

```tsx
const { sessions, error } = useSession();

if (error) {
  return <ErrorMessage message={error} />;
}
```

### 6. Refresh data when needed
Use refresh methods to update data:

```tsx
const { refreshSessions } = useSession();

// After creating a session
await createSession(data);
// Data is automatically refreshed

// Or manually refresh
await refreshSessions();
```

## Performance Considerations

### 1. Automatic Refresh
- Sessions: Refreshed after mutations
- Notifications: Polled every 60 seconds
- Profile: Loaded once, refreshed on demand

### 2. Throttling
- Notifications are throttled to prevent excessive API calls
- Minimum 5 seconds between requests

### 3. Caching
- Auth tokens are cached in SecureStore
- User data is cached in memory

### 4. Selective Re-renders
Contexts use React.memo and useCallback to minimize re-renders.

## Testing

When testing components that use contexts, wrap them in providers:

```tsx
import { AuthProvider, ProfileProvider } from '@/contexts';

test('renders profile', () => {
  render(
    <AuthProvider>
      <ProfileProvider>
        <ProfileScreen />
      </ProfileProvider>
    </AuthProvider>
  );
});
```

Or use the combined provider:

```tsx
import { AppProviders } from '@/contexts/app-providers';

test('renders profile', () => {
  render(
    <AppProviders>
      <ProfileScreen />
    </AppProviders>
  );
});
```
