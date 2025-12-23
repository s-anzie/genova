import { Stack } from 'expo-router';

export default function AdminLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="users" options={{ headerShown: false }} />
      <Stack.Screen name="verifications" options={{ headerShown: false }} />
      <Stack.Screen name="content" options={{ headerShown: false }} />
    </Stack>
  );
}
