import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

export default function Ticket() {
  const { ticketNumber, qrToken, timeSlot, serviceName } = useLocalSearchParams();

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.ticketNum}>{ticketNumber}</Text>
        <Text style={styles.service}>{serviceName}</Text>
        <Text style={styles.time}>Time: {timeSlot}</Text>
        <View style={styles.qrContainer}>
          <QRCode value={qrToken as string} size={200} />
        </View>
        <Text style={styles.tokenText}>Token: {qrToken}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f3f4f6', padding: 20 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 15, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10, elevation: 5, width: '100%' },
  ticketNum: { fontSize: 36, fontWeight: 'bold', color: '#2563eb', marginBottom: 10 },
  service: { fontSize: 18, color: '#4b5563', marginBottom: 5 },
  time: { fontSize: 16, color: '#9ca3af', marginBottom: 20 },
  qrContainer: { marginTop: 20, padding: 20, backgroundColor: '#f9fafb', borderRadius: 10, borderWidth: 1, borderColor: '#e5e7eb' },
  tokenText: { marginTop: 15, fontSize: 10, color: '#9ca3af', textAlign: 'center' },
});