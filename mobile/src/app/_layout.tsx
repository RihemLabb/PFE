import { useEffect } from 'react';
import { router, Stack, usePathname } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useAuthStore } from '../store/authStore';

export default function RootLayout() {
  const loadAuth = useAuthStore((state) => state.loadAuth);
  const logout = useAuthStore((state) => state.logout);
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const pathname = usePathname();

  useEffect(() => {
    loadAuth();
  }, [loadAuth]);

  useEffect(() => {
    if (!isHydrated) return;

    const onPublicAuthScreen =
      pathname === '/login' || pathname === '/register';

    if (token && user && user.role !== 'USER') {
      void logout().then(() => router.replace('/login'));
      return;
    }

    if (!token && !onPublicAuthScreen) {
      router.replace('/login');
    } else if (token && onPublicAuthScreen) {
      router.replace('/');
    }
  }, [isHydrated, logout, pathname, token, user]);

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
        <Stack.Screen
          name="ticket"
          options={{ title: 'Your Ticket', headerShown: false }}
        />
        <Stack.Screen name="history" options={{ title: 'History' }} />
        <Stack.Screen name="queue-status" options={{ title: 'Live Queue' }} />
        <Stack.Screen name="scanner" options={{ title: 'QR Check-in' }} />
        <Stack.Screen name="feedback" options={{ title: 'Rate Service' }} />
        <Stack.Screen name="profile" options={{ title: 'My Profile' }} />
        <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
        <Stack.Screen
          name="login"
          options={{ title: 'Login', headerShown: false }}
        />
        <Stack.Screen
          name="register"
          options={{ title: 'Register', headerShown: false }}
        />
      </Stack>
    </>
  );
}
