import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  return (
    <>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: '#F9FAFB',
          },
          headerTintColor: '#0F172A',
          headerTitleStyle: {
            fontWeight: '700',
          },
        }}
      >
        <Stack.Screen name="index" options={{ title: 'Smart Queue' }} />
        <Stack.Screen name="booking" options={{ title: 'Book Appointment' }} />
        <Stack.Screen name="ticket" options={{ title: 'Your Ticket', headerShown: false }} />
        <Stack.Screen name="history" options={{ title: 'History' }} />
        <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
      </Stack>
    </>
  );
}