import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';
import { Platform } from 'react-native';
import * as SystemUI from 'expo-system-ui';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { useAuth } from '@/contexts/auth-context';
import { AppProviders } from '@/contexts/app-providers';
import { STRIPE_PUBLISHABLE_KEY } from '@/config/stripe';
import { Colors } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import "../global.css"

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const [profileChecked, setProfileChecked] = useState(false);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);

  // Check if student needs onboarding
  useEffect(() => {
    const checkStudentProfile = async () => {
      if (!isAuthenticated || !user || user.role?.toUpperCase() !== 'STUDENT') {
        setProfileChecked(true);
        return;
      }

      try {
        console.log('🔍 Checking student profile for user:', user.id);
        
        // Get the token to verify it exists
        const token = await apiClient.getAccessToken();
        console.log('🔑 Token available:', !!token);
        
        const response = await apiClient.get(`/profiles/student/${user.id}`);
        console.log('📡 Response received:', {
          success: response.success,
          hasData: !!response.data,
        });
        
        const profile = response.data;
        
        console.log('📋 Profile data:', {
          exists: !!profile,
          onboardingCompleted: profile?.onboardingCompleted,
          userId: profile?.userId,
        });
        
        // Check if profile exists and onboarding is completed
        if (!profile || profile.onboardingCompleted !== true) {
          console.log('❌ Needs onboarding:', !profile ? 'No profile' : 'onboardingCompleted is not true');
          setNeedsOnboarding(true);
        } else {
          console.log('✅ Onboarding completed, profile OK');
          setNeedsOnboarding(false);
        }
      } catch (error: any) {
        console.log('⚠️ Error checking profile:', {
          message: error?.message || error,
          status: error?.status,
          response: error?.response,
        });
        // Profile doesn't exist or error occurred
        setNeedsOnboarding(true);
      } finally {
        setProfileChecked(true);
      }
    };

    if (isAuthenticated && user && !profileChecked) {
      checkStudentProfile();
    }
  }, [isAuthenticated, user, profileChecked]);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inStudentGroup = segments[0] === '(student)';
    const inTutorGroup = segments[0] === '(tutor)';
    const inAdminGroup = segments[0] === '(admin)';
    const onOnboardingPage = segments[1] === 'onboarding';

    // Normalize role to uppercase for comparison
    const userRole = user?.role?.toUpperCase();

    if (!isAuthenticated && !inAuthGroup) {
      // Redirect to login if not authenticated
      router.replace('/(auth)/login');
    } else if (isAuthenticated && inAuthGroup) {
      // Redirect to appropriate role-based interface after authentication
      if (userRole === 'TUTOR') {
        router.replace('/(tutor)/(tabs)/home');
      } else if (userRole === 'ADMIN') {
        router.replace('/(admin)/(tabs)/dashboard');
      } else if (userRole === 'STUDENT') {
        // Wait for profile check before redirecting
        if (profileChecked) {
          if (needsOnboarding) {
            router.replace('/(student)/onboarding');
          } else {
            router.replace('/(student)/(tabs)/home');
          }
        }
      }
    } else if (isAuthenticated && user) {
      // Don't redirect if already on onboarding page
      if (onOnboardingPage) return;

      // For students, check if they need onboarding
      if (userRole === 'STUDENT' && profileChecked) {
        if (needsOnboarding && !onOnboardingPage) {
          router.replace('/(student)/onboarding');
          return;
        }
      }

      // Ensure user is in the correct role group
      const correctGroup = 
        userRole === 'TUTOR' ? inTutorGroup :
        userRole === 'ADMIN' ? inAdminGroup :
        inStudentGroup;

      if (!correctGroup && !inAuthGroup) {
        // Redirect to correct role interface
        if (userRole === 'TUTOR') {
          router.replace('/(tutor)/(tabs)/home');
        } else if (userRole === 'ADMIN') {
          router.replace('/(admin)/(tabs)/dashboard');
        } else if (userRole === 'STUDENT') {
          if (needsOnboarding) {
            router.replace('/(student)/onboarding');
          } else {
            router.replace('/(student)/(tabs)/home');
          }
        }
      }
    }
  }, [isAuthenticated, isLoading, user, segments, profileChecked, needsOnboarding]);

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
