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

  // Reset profile check when user changes or authentication state changes
  useEffect(() => {
    setProfileChecked(false);
    setNeedsOnboarding(false);
  }, [isAuthenticated, user?.id]);

  // Check if student needs onboarding
  useEffect(() => {
    const checkStudentProfile = async () => {
      if (!isAuthenticated || !user || user.role?.toUpperCase() !== 'STUDENT') {
        setProfileChecked(true);
        return;
      }

      try {
        console.log('🔍 [_layout] Checking student profile for user:', user.id);
        
        const response = await apiClient.get(`/profiles/student/${user.id}`);
        const profile = response.data;
        
        console.log('📋 [_layout] Profile data:', {
          exists: !!profile,
          onboardingCompleted: profile?.onboardingCompleted,
          educationLevelId: profile?.educationLevelId,
          hasPreferredSubjects: !!(profile?.preferredLevelSubjects?.length || profile?.preferredStreamSubjects?.length),
        });
        
        // Check if profile exists and onboarding is completed
        if (!profile || profile.onboardingCompleted !== true) {
          console.log('❌ [_layout] Needs onboarding:', !profile ? 'No profile' : `onboardingCompleted=${profile.onboardingCompleted}`);
          setNeedsOnboarding(true);
        } else {
          console.log('✅ [_layout] Onboarding completed, profile OK');
          setNeedsOnboarding(false);
        }
      } catch (error: any) {
        console.log('⚠️ [_layout] Error checking profile:', {
          message: error?.message || error,
          status: error?.status,
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
