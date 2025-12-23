import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="tutors" options={{ headerShown: false }} />
      <Stack.Screen name="classes" options={{ headerShown: false }} />
      <Stack.Screen name="wallet/index" options={{ headerShown: false }} />
      <Stack.Screen name="marketplace" options={{ headerShown: false }} />
    </Stack>
  );
}
