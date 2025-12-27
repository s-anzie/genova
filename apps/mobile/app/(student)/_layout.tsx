import { Stack } from 'expo-router';

export default function StudentLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="tutors" options={{ headerShown: false }} />
      <Stack.Screen name="classes" options={{ headerShown: false }} />
      <Stack.Screen name="wallet" options={{ headerShown: false }} />
      <Stack.Screen name="notifications" options={{ headerShown: false }} />
      <Stack.Screen name="marketplace" options={{ headerShown: false }} />
      <Stack.Screen 
        name="filters" 
        options={{ 
          presentation: 'transparentModal',
          headerShown: false,
          animation: 'slide_from_bottom',
        }} 
      />
    </Stack>
  );
}
