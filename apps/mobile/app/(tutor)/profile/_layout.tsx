import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="availability"
        options={{
          title: 'Availability',
          headerShown: false,
          presentation: 'modal',
        }}
      />
      <Stack.Screen
        name="documents"
        options={{
          title: 'Verification Documents',
          headerShown: false,
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
