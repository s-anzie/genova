import { Stack } from 'expo-router';

export default function ClassesLayout() {
  return (
    <Stack 
      screenOptions={{headerShown: false }}
      initialRouteName="index"
    >
      <Stack.Screen name="create"/>
      <Stack.Screen name="[id]"/>
      <Stack.Screen name="invite"/>
      <Stack.Screen name="edit"/>
      <Stack.Screen name="schedule"/>
      <Stack.Screen name="add"/>
    </Stack>
  );
}
