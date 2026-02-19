import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { initRevenueCat } from '../src/services/revenuecat';

export default function RootLayout() {
  useEffect(() => {
    initRevenueCat();
  }, []);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" options={{ animation: 'none' }} />
      <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
      <Stack.Screen name="auth" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="subscription" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="privacy-security" options={{ animation: 'slide_from_right' }} />
    </Stack>
  );
}
