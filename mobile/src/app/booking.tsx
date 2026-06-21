import { useState } from 'react';
import { View, Text, Button, Alert, StyleSheet, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import api from '../api/axios';

export default function Booking() {
  const { serviceId, serviceName } = useLocalSearchParams();
  const [date] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleBook = async (timeSlot: string) => {
    setLoading(true);
    try {
      const { data } = await api.post('/appointments', {
        serviceId,
        date,
        timeSlot,
      });
      router.push({ 
        pathname: '/ticket', 
        params: { 
          ticketNumber: data.ticketNumber, 
          qrToken: data.qrToken, 
          timeSlot: data.timeSlot, 
          serviceName: serviceName as string 
        } 
      });
    } catch (err: any) {
      Alert.alert('Error', err.response?.data?.message || 'Booking failed');
    } finally {
      setLoading(false);
    }
  };

  const slots = ['09:00', '10:00', '11:00'];

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Book {serviceName}</Text>
      <Text style={styles.subtitle}>Date: {date}</Text>
      {loading && <ActivityIndicator size="large" style={{ margin: 20 }} />}
      <View style={styles.slots}>
        {slots.map((slot) => (
          <View key={slot} style={{ marginBottom: 15 }}>
            <Button title={slot} onPress={() => handleBook(slot)} color="#2563eb" />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f3f4f6' },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10 },
  subtitle: { fontSize: 16, color: '#6b7280', marginBottom: 20 },
  slots: { gap: 15 },
});