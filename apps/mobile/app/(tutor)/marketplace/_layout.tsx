import { Stack } from 'expo-router';

export default function TutorMarketplaceLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="create-product" />
      <Stack.Screen name="edit-product" />
    </Stack>
  );
}
