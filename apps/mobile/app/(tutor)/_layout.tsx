import { Stack, useRouter, useSegments } from 'expo-router';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';

export default function TutorLayout() {
  const { user } = useAuth();
  const router = useRouter();
  const segments = useSegments();
  const [isCheckingProfile, setIsCheckingProfile] = useState(true);
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    checkProfile();
  }, [user]);

  const checkProfile = async () => {
    if (!user) {
      setIsCheckingProfile(false);
      return;
    }

    try {
      // Check if tutor profile exists and onboarding is completed
      const response = await apiClient.get(`/profiles/tutor/${user.id}`);
      const profile = response.data;
      
      setHasProfile(!!profile);
      
      // If profile exists but onboarding not completed, redirect to onboarding
      const isOnOnboarding = segments.some(segment => segment === 'onboarding');
      if (profile && !profile.onboardingCompleted && !isOnOnboarding) {
        router.replace('/(tutor)/onboarding' as any);
      }
    } catch (error: any) {
      // If 404 or profile doesn't exist, redirect to onboarding
      if (error.message?.includes('404') || error.message?.includes('not found')) {
        setHasProfile(false);
        const isOnOnboarding = segments.some(segment => segment === 'onboarding');
        if (!isOnOnboarding) {
          router.replace('/(tutor)/onboarding' as any);
        }
      }
    } finally {
      setIsCheckingProfile(false);
    }
  };

  if (isCheckingProfile) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bgCream }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Screen name="onboarding" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="profile/availability" options={{ headerShown: false }} />
      <Stack.Screen name="profile/documents" options={{ headerShown: false }} />
      <Stack.Screen name="availability" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="requests" options={{ headerShown: false }} />
      <Stack.Screen name="subscription" options={{ headerShown: false }} />
      <Stack.Screen name="students" options={{ headerShown: false }} />
      <Stack.Screen name="marketplace" options={{ headerShown: false }} />
      <Stack.Screen name="badges" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
    </Stack>
  );
}
