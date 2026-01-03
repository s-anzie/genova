import { Stack } from 'expo-router';

export default function SubscriptionLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="plans" />
      <Stack.Screen name="purchase" />
      <Stack.Screen name="manage" />
      <Stack.Screen name="payment-method" />
    </Stack>
  );
}
