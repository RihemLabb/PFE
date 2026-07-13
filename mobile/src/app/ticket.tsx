import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export default function Ticket() {
  const router = useRouter();
  const { ticketNumber, qrToken, timeSlot, serviceName } = useLocalSearchParams();

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Your Pass</Text>
      
      <View style={styles.ticketWrapper}>
        <View style={styles.ticket}>
          
          <View style={styles.ticketTop}>
            <Text style={styles.ticketLabel}>ADMIT ONE</Text>
            <Text style={styles.ticketNumber}>{ticketNumber}</Text>
            <View style={styles.divider}>
              <View style={styles.dashedLine} />
            </View>
          </View>

          <View style={styles.ticketMiddle}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue}>{serviceName}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{timeSlot}</Text>
            </View>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              <QRCode value={qrToken as string} size={160} color="#0F172A" backgroundColor="#FFFFFF" />
            </View>
            <Text style={styles.qrHint}>Scan at the counter</Text>
          </View>

          <View style={[styles.cutout, styles.cutoutLeft]} />
          <View style={[styles.cutout, styles.cutoutRight]} />
        </View>
      </View>

      {/* Navigation Buttons */}
      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Text 
              style={styles.buttonText}
              onPress={() => router.push('/history')}
            >
              📋 View History
            </Text>
          </View>
          <View style={styles.buttonWrapper}>
            <Text 
              style={styles.buttonText}
              onPress={() => router.push('/')}
            >
              🏠 Home
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, backgroundColor: '#F9FAFB', alignItems: 'center', paddingTop: 60, paddingBottom: 40 },
  pageTitle: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 30, letterSpacing: -0.5 },
  ticketWrapper: { width: width - 40, alignItems: 'center' },
  ticket: { width: '100%', backgroundColor: '#1E293B', borderRadius: 24, overflow: 'hidden', shadowColor: '#0F172A', shadowOpacity: 0.2, shadowRadius: 20, elevation: 10 },
  ticketTop: { padding: 30, alignItems: 'center' },
  ticketLabel: { color: '#94A3B8', fontSize: 12, fontWeight: '700', letterSpacing: 3, marginBottom: 10 },
  ticketNumber: { color: '#FFFFFF', fontSize: 48, fontWeight: '900', letterSpacing: 2 },
  divider: { width: '100%', position: 'absolute', bottom: 0, height: 20, justifyContent: 'center' },
  dashedLine: { height: 1, backgroundColor: '#334155', borderStyle: 'dashed', borderWidth: 1, borderColor: '#334155', width: '100%' },
  ticketMiddle: { flexDirection: 'row', justifyContent: 'space-between', padding: 30, paddingTop: 10 },
  infoBlock: { alignItems: 'center', flex: 1 },
  infoLabel: { color: '#64748B', fontSize: 11, fontWeight: '600', textTransform: 'uppercase', marginBottom: 6 },
  infoValue: { color: '#F8FAFC', fontSize: 18, fontWeight: '700' },
  qrSection: { padding: 30, paddingTop: 10, alignItems: 'center', backgroundColor: '#1E293B' },
  qrBox: { padding: 16, backgroundColor: '#FFFFFF', borderRadius: 16, marginBottom: 15, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  qrHint: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
  cutout: { position: 'absolute', top: '50%', width: 24, height: 24, borderRadius: 12, backgroundColor: '#F9FAFB', marginTop: -12, zIndex: 10 },
  cutoutLeft: { left: -12 },
  cutoutRight: { right: -12 },
  buttonContainer: { marginTop: 40, width: width - 40 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  buttonWrapper: { flex: 1, marginHorizontal: 10 },
  buttonText: {
    textAlign: 'center',
    backgroundColor: '#6366f1',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontWeight: '700',
    fontSize: 16,
    shadowColor: '#6366f1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});