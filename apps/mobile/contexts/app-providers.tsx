import React, { ReactNode } from 'react';
import { AuthProvider } from './auth-context';
import { ProfileProvider } from './profile-context';
import { SessionProvider } from './session-context';
import { NotificationProvider } from './notification-context';

/**
 * Combined provider component that wraps the app with all context providers
 * in the correct order (auth first, then dependent contexts)
 */
export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <SessionProvider>
          <NotificationProvider>
            {children}
          </NotificationProvider>
        </SessionProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}
