import { Stack } from 'expo-router';

export default function TutorLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="profile/edit" options={{ headerShown: false }} />
      <Stack.Screen name="profile/availability" options={{ headerShown: false }} />
      <Stack.Screen name="profile/documents" options={{ headerShown: false }} />
      <Stack.Screen name="availability" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="requests" options={{ headerShown: false }} />
      <Stack.Screen name="wallet/payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="wallet/transactions" options={{ headerShown: false }} />
      <Stack.Screen name="wallet/withdraw" options={{ headerShown: false }} />
    </Stack>
  );
}
