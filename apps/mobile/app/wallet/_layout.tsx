import { Stack } from 'expo-router';

export default function PaymentLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          title: 'Wallet',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="transactions"
        options={{
          title: 'Transaction History',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="withdraw"
        options={{
          title: 'Withdraw Funds',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="payment-methods"
        options={{
          title: 'Payment Methods',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
