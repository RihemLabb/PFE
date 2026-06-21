import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack screenOptions={{ headerStyle: { backgroundColor: '#2563eb' }, headerTintColor: '#fff' }}>
      <Stack.Screen name="login" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ title: 'Services' }} />
      <Stack.Screen name="booking" options={{ title: 'Book Appointment' }} />
      <Stack.Screen name="ticket" options={{ title: 'My Ticket' }} />
    </Stack>
  );
}