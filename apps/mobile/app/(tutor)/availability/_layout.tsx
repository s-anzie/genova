import { Stack } from 'expo-router';
import React from 'react';

export default function AvailabilityLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="add-recurring" />
      <Stack.Screen name="add-one-time" />
    </Stack>
  );
}
