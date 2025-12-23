import { Stack } from 'expo-router';

export default function ClassDetailLayout() {
  return (
    <Stack 
      screenOptions={{ headerShown: false }}
      initialRouteName="index"
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="invite" />
      <Stack.Screen name="edit" />
    </Stack>
  );
}
