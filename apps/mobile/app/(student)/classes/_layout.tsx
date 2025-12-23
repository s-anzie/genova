import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack 
      screenOptions={{headerShown: false }}
      initialRouteName="index"
    >
      <Stack.Screen name="index"/>
      <Stack.Screen name="create"/>
      <Stack.Screen name="[id]"/>
    </Stack>
  );
}
