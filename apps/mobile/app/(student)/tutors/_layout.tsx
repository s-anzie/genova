import { Stack } from 'expo-router';

export default function TutorsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/schedule"
        options={{
          title: 'Réserver une session',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]/checkout"
        options={{
          headerShown: false,
          title: 'Paiement',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
