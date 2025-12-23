import { Stack } from 'expo-router';

export default function StudentWalletLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ headerShown: false }} />
      <Stack.Screen name="add-funds" options={{ headerShown: false }} />
      <Stack.Screen name="payment-methods" options={{ headerShown: false }} />
      <Stack.Screen name="transactions" options={{ headerShown: false }} />
    </Stack>
  );
}
