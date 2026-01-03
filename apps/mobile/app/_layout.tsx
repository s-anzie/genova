import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { AppProviders } from '@/contexts/app-providers';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/stripe';
import { Colors } from '@/constants/colors';
import "../global.css"

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inStudentGroup = segments[0] === '(student)';
    const inTutorGroup = segments[0] === '(tutor)';
    const inAdminGroup = segments[0] === '(admin)';

    // Normalize role to lowercase for comparison
    const userRole = user?.role?.toLowerCase();

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to appropriate role-based interface after authentication
      if (userRole === 'tutor') {
        router.replace('/(tutor)/(tabs)/home');
      } else if (userRole === 'admin') {
        router.replace('/(admin)/(tabs)/dashboard');
      } else {
        // Default to student interface
        router.replace('/(student)/(tabs)/home');
      }
    } else if (isAuthenticated && user) {
      // Ensure user is in the correct role group
      const correctGroup = 
        userRole === 'tutor' ? inTutorGroup :
        userRole === 'admin' ? inAdminGroup :
        inStudentGroup;

      if (!correctGroup && !inAuthGroup) {
        // Redirect to correct role interface
        if (userRole === 'tutor') {
          router.replace('/(tutor)/(tabs)/home');
        } else if (userRole === 'admin') {
          router.replace('/(admin)/(tabs)/dashboard');
        } else {
          router.replace('/(student)/(tabs)/home');
        }
      }
    }
  }, [isAuthenticated, isLoading, user, segments]);

  return (
    <Stack>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(student)" options={{ headerShown: false }} />
      <Stack.Screen name="(tutor)" options={{ headerShown: false }} />
      <Stack.Screen name="(admin)" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // Configure navigation bar color on Android
    if (Platform.OS === 'android') {
      SystemUI.setBackgroundColorAsync(Colors.cream);
    }
  }, []);

  return (
    <StripeProvider publishableKey={STRIPE_PUBLISHABLE_KEY}>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AppProviders>
          <RootLayoutNav />
          <StatusBar style="light" backgroundColor="#0d7377" />
        </AppProviders>
      </ThemeProvider>
    </StripeProvider>
  );
}
