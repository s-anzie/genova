import { Stack } from 'expo-router';

export default function TutorWalletLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="withdraw" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="transactions" options={{ headerShown: false }} />
    </Stack>
  );
}
