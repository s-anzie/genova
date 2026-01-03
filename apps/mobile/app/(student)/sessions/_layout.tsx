import { Stack } from 'expo-router';

export default function StudentSessionsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="check-in"
        options={{
          title: 'Check-in',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
