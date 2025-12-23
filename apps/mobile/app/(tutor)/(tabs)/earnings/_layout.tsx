import { Stack } from 'expo-router';

export default function EarningsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="wallet"
        options={{
          title: 'Mon Portefeuille',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="withdraw"
        options={{
          title: 'Retrait',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
