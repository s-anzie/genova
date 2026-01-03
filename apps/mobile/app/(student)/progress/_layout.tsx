import { Stack } from 'expo-router';

export default function ProgressLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="add-result" />
      <Stack.Screen name="subject" />
      <Stack.Screen name="results" />
      <Stack.Screen name="charts" />
      <Stack.Screen name="goals" />
    </Stack>
  );
}
