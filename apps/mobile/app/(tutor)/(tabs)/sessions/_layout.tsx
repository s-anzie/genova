import { Stack } from 'expo-router';

export default function TutorSessionsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="report"
        options={{
          title: 'Rapport de Session',
          presentation: 'modal',
        }}
      />
    </Stack>
  );
}
