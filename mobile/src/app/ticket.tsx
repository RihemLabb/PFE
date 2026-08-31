import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import QRCode from 'react-native-qrcode-svg';

const screenWidth = Dimensions.get('window').width;
const qrSize = Math.min(190, screenWidth - 150);
const firstParam = (value: string | string[] | undefined) => Array.isArray(value) ? value[0] : value;

export default function Ticket() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const appointmentId = firstParam(params.appointmentId);
  const ticketNumber = firstParam(params.ticketNumber) || '—';
  const qrToken = firstParam(params.qrToken);
  const timeSlot = firstParam(params.timeSlot) || '—';
  const serviceName = firstParam(params.serviceName) || 'Service';
  const date = firstParam(params.date);
  const formattedDate = date ? new Date(`${date}T00:00:00`).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  if (!qrToken) {
    return <SafeAreaView style={styles.fallback}><Text style={styles.fallbackTitle}>Ticket unavailable</Text><Text style={styles.fallbackText}>Open this appointment again from your history.</Text><TouchableOpacity style={styles.primaryButton} onPress={() => router.replace('/history')}><Text style={styles.primaryButtonText}>Open my appointments</Text></TouchableOpacity></SafeAreaView>;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}><Text style={styles.backButtonText}>‹</Text></TouchableOpacity>
          <View style={styles.titleBlock}><Text style={styles.eyebrow}>APPOINTMENT PASS</Text><Text style={styles.pageTitle}>Your ticket</Text></View>
          <View style={styles.confirmedPill}><View style={styles.confirmedDot} /><Text style={styles.confirmedText}>Confirmed</Text></View>
        </View>

        <View style={styles.ticketShadow}><View style={styles.ticket}>
          <View style={styles.ticketHeader}><Text style={styles.ticketLabel}>TICKET NUMBER</Text><Text style={styles.ticketNumber}>{ticketNumber}</Text><Text style={styles.serviceName}>{serviceName}</Text></View>
          <View style={styles.perforation}><View style={[styles.cutout, styles.cutoutLeft]} /><View style={styles.dashRow} /><View style={[styles.cutout, styles.cutoutRight]} /></View>
          <View style={styles.detailsRow}>
            <View style={styles.detailBlock}><Text style={styles.detailLabel}>DATE</Text><Text style={styles.detailValue}>{formattedDate}</Text></View>
            <View style={styles.detailDivider} />
            <View style={styles.detailBlockSmall}><Text style={styles.detailLabel}>TIME</Text><Text style={styles.timeValue}>{timeSlot}</Text></View>
          </View>
          <View style={styles.qrArea}>
            <View style={styles.qrBox}><QRCode value={qrToken} size={qrSize} color="#0F172A" backgroundColor="#FFFFFF" /></View>
            <Text style={styles.presentTitle}>Present this ticket to the agent</Text>
            <Text style={styles.presentText}>The agent can scan this QR code or enter {ticketNumber} manually.</Text>
          </View>
        </View></View>

        <View style={styles.infoCard}><View style={styles.infoIcon}><Text style={styles.infoIconText}>i</Text></View><View style={styles.infoCopy}><Text style={styles.infoTitle}>Check-in on your appointment day</Text><Text style={styles.infoText}>Keep this screen ready when you arrive. Your live queue position becomes available after the agent checks you in.</Text></View></View>

        <View style={styles.actions}>
          {appointmentId ? <TouchableOpacity style={styles.primaryButton} onPress={() => router.push({ pathname: '/queue-status', params: { appointmentId } })}><Text style={styles.primaryButtonText}>View live queue</Text></TouchableOpacity> : null}
          <View style={styles.secondaryRow}><TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/history')}><Text style={styles.secondaryButtonText}>My appointments</Text></TouchableOpacity><TouchableOpacity style={styles.secondaryButton} onPress={() => router.push('/')}><Text style={styles.secondaryButtonText}>Home</Text></TouchableOpacity></View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F8FAFC' },
  container: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 36 },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 22 },
  backButton: { width: 42, height: 42, borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', justifyContent: 'center' },
  backButtonText: { color: '#0F172A', fontSize: 31, lineHeight: 34, marginTop: -3 },
  titleBlock: { flex: 1, marginLeft: 13 },
  eyebrow: { color: '#6366F1', fontSize: 10, fontWeight: '900', letterSpacing: 1.7 },
  pageTitle: { color: '#0F172A', fontSize: 25, fontWeight: '900', marginTop: 2 },
  confirmedPill: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', paddingHorizontal: 10, paddingVertical: 7, borderRadius: 20 },
  confirmedDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#10B981', marginRight: 6 },
  confirmedText: { color: '#047857', fontSize: 11, fontWeight: '800' },
  ticketShadow: { shadowColor: '#0F172A', shadowOpacity: 0.15, shadowRadius: 22, shadowOffset: { width: 0, height: 12 }, elevation: 10 },
  ticket: { backgroundColor: '#172033', borderRadius: 28, overflow: 'hidden' },
  ticketHeader: { alignItems: 'center', paddingTop: 27, paddingHorizontal: 24, paddingBottom: 22 },
  ticketLabel: { color: '#94A3B8', fontSize: 10, fontWeight: '800', letterSpacing: 2.1 },
  ticketNumber: { color: '#FFFFFF', fontSize: 41, fontWeight: '900', letterSpacing: 2, marginTop: 5 },
  serviceName: { color: '#C7D2FE', fontSize: 15, fontWeight: '700', marginTop: 5, textAlign: 'center' },
  perforation: { height: 24, justifyContent: 'center', position: 'relative' },
  dashRow: { marginHorizontal: 25, borderTopWidth: 1, borderStyle: 'dashed', borderColor: '#475569' },
  cutout: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: '#F8FAFC', zIndex: 2 },
  cutoutLeft: { left: -12 }, cutoutRight: { right: -12 },
  detailsRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 26, paddingVertical: 15 },
  detailBlock: { flex: 1 }, detailBlockSmall: { width: 92, alignItems: 'flex-end' },
  detailDivider: { width: 1, height: 42, backgroundColor: '#334155', marginHorizontal: 18 },
  detailLabel: { color: '#64748B', fontSize: 9, fontWeight: '900', letterSpacing: 1.5 },
  detailValue: { color: '#F8FAFC', fontSize: 14, fontWeight: '800', marginTop: 5 },
  timeValue: { color: '#F8FAFC', fontSize: 21, fontWeight: '900', marginTop: 2 },
  qrArea: { backgroundColor: '#111827', alignItems: 'center', paddingHorizontal: 24, paddingTop: 23, paddingBottom: 26 },
  qrBox: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 22 },
  presentTitle: { color: '#F8FAFC', fontSize: 14, fontWeight: '900', marginTop: 17 },
  presentText: { color: '#94A3B8', fontSize: 11, lineHeight: 17, textAlign: 'center', marginTop: 5, maxWidth: 290 },
  infoCard: { flexDirection: 'row', backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: '#C7D2FE', borderRadius: 20, padding: 16, marginTop: 20 },
  infoIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#6366F1', alignItems: 'center', justifyContent: 'center' },
  infoIconText: { color: '#FFFFFF', fontSize: 16, fontWeight: '900' },
  infoCopy: { flex: 1, marginLeft: 12 }, infoTitle: { color: '#312E81', fontSize: 13, fontWeight: '900' },
  infoText: { color: '#4F46E5', fontSize: 11, lineHeight: 17, marginTop: 4 },
  actions: { marginTop: 18 },
  primaryButton: { backgroundColor: '#6366F1', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 24, alignItems: 'center', shadowColor: '#6366F1', shadowOpacity: 0.2, shadowRadius: 10, elevation: 3 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '900', fontSize: 14 },
  secondaryRow: { flexDirection: 'row', gap: 10, marginTop: 10 },
  secondaryButton: { flex: 1, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 16, paddingVertical: 14, alignItems: 'center' },
  secondaryButtonText: { color: '#334155', fontWeight: '800', fontSize: 12 },
  fallback: { flex: 1, backgroundColor: '#F8FAFC', alignItems: 'center', justifyContent: 'center', padding: 30 },
  fallbackTitle: { fontSize: 22, fontWeight: '900', color: '#0F172A' }, fallbackText: { marginTop: 8, marginBottom: 22, color: '#64748B', textAlign: 'center' },
});
