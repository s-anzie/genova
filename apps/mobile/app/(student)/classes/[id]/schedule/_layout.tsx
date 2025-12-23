import { Stack } from 'expo-router';

export default function ScheduleLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName='index'
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add" />
      <Stack.Screen name="[slotId]/assign-tutor" />
    </Stack>
  );
}
