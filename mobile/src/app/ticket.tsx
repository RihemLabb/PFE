import { Dimensions, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

const { width } = Dimensions.get('window');

export default function Ticket() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const ticketNumber = Array.isArray(params.ticketNumber)
    ? params.ticketNumber[0]
    : params.ticketNumber;
  const qrToken = Array.isArray(params.qrToken) ? params.qrToken[0] : params.qrToken;
  const timeSlot = Array.isArray(params.timeSlot)
    ? params.timeSlot[0]
    : params.timeSlot;
  const serviceName = Array.isArray(params.serviceName)
    ? params.serviceName[0]
    : params.serviceName;
  const date = Array.isArray(params.date) ? params.date[0] : params.date;

  const formattedDate = date
    ? new Date(`${date}T00:00:00`).toLocaleDateString([], {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '—';

  if (!qrToken) {
    return (
      <View style={styles.fallback}>
        <Text style={styles.fallbackTitle}>Ticket unavailable</Text>
        <Text style={styles.fallbackText}>
          Open this appointment again from your history.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.pageTitle}>Your Pass</Text>

      <View style={styles.ticketWrapper}>
        <View style={styles.ticket}>
          <View style={styles.ticketTop}>
            <Text style={styles.ticketLabel}>APPOINTMENT TICKET</Text>
            <Text style={styles.ticketNumber}>{ticketNumber || '—'}</Text>
            <View style={styles.divider}>
              <View style={styles.dashedLine} />
            </View>
          </View>

          <View style={styles.ticketMiddle}>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Service</Text>
              <Text style={styles.infoValue} numberOfLines={2}>
                {serviceName || 'Service'}
              </Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Date</Text>
              <Text style={styles.infoValue}>{formattedDate}</Text>
            </View>
            <View style={styles.infoBlock}>
              <Text style={styles.infoLabel}>Time</Text>
              <Text style={styles.infoValue}>{timeSlot || '—'}</Text>
            </View>
          </View>

          <View style={styles.qrSection}>
            <View style={styles.qrBox}>
              <QRCode
                value={qrToken}
                size={160}
                color="#0F172A"
                backgroundColor="#FFFFFF"
              />
            </View>
            <Text style={styles.qrHint}>Present this QR code at check-in</Text>
          </View>

          <View style={[styles.cutout, styles.cutoutLeft]} />
          <View style={[styles.cutout, styles.cutoutRight]} />
        </View>
      </View>

      <View style={styles.buttonContainer}>
        <View style={styles.buttonRow}>
          <View style={styles.buttonWrapper}>
            <Text style={styles.buttonText} onPress={() => router.push('/history')}>
              📋 View History
            </Text>
          </View>
          <View style={styles.buttonWrapper}>
            <Text style={styles.buttonText} onPress={() => router.push('/')}>
              🏠 Home
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 40,
  },
  fallback: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
  },
  fallbackTitle: { fontSize: 22, fontWeight: '800', color: '#0F172A' },
  fallbackText: { marginTop: 8, color: '#64748B', textAlign: 'center' },
  pageTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 30,
    letterSpacing: -0.5,
  },
  ticketWrapper: { width: width - 40, alignItems: 'center' },
  ticket: {
    width: '100%',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#0F172A',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
  },
  ticketTop: { padding: 30, alignItems: 'center' },
  ticketLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 2.5,
    marginBottom: 10,
  },
  ticketNumber: {
    color: '#FFFFFF',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: 2,
  },
  divider: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    height: 20,
    justifyContent: 'center',
  },
  dashedLine: {
    height: 1,
    backgroundColor: '#334155',
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: '#334155',
    width: '100%',
  },
  ticketMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 24,
    paddingTop: 10,
    gap: 8,
  },
  infoBlock: { alignItems: 'center', flex: 1 },
  infoLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 6,
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  qrSection: {
    padding: 30,
    paddingTop: 10,
    alignItems: 'center',
    backgroundColor: '#1E293B',
  },
  qrBox: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  qrHint: { color: '#64748B', fontSize: 12, fontStyle: 'italic' },
  cutout: {
    position: 'absolute',
    top: '50%',
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F9FAFB',
    marginTop: -12,
    zIndex: 10,
  },
  cutoutLeft: { left: -12 },
  cutoutRight: { right: -12 },
  buttonContainer: { marginTop: 40, width: width - 40 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between' },
  buttonWrapper: { flex: 1, marginHorizontal: 6 },
  buttonText: {
    textAlign: 'center',
    backgroundColor: '#6366F1',
    color: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontWeight: '700',
    fontSize: 14,
    shadowColor: '#6366F1',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
});
