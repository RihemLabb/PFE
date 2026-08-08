import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import api from '../api/axios';

interface QueueStatusResponse {
  appointmentId: string;
  ticketNumber: string;
  appointmentStatus: string;
  serviceName: string;
  queueStatus: string | null;
  position: number | null;
  peopleAhead: number | null;
  estimatedWaitMinutes: number | null;
  averageServiceMinutes: number;
  counter: {
    id: string;
    number: number;
    name: string;
  } | null;
}

const STATUS_LABELS: Record<string, string> = {
  WAITING: 'Waiting in queue',
  CALLED: 'You are being called',
  IN_PROGRESS: 'Service in progress',
  FINISHED: 'Service completed',
  ABSENT: 'Marked absent',
};

export default function QueueStatusScreen() {
  const params = useLocalSearchParams();
  const appointmentId = Array.isArray(params.appointmentId)
    ? params.appointmentId[0]
    : params.appointmentId;
  const [data, setData] = useState<QueueStatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchStatus = async (manual = false) => {
    if (!appointmentId) return;
    if (manual) setRefreshing(true);

    try {
      const response = await api.get<QueueStatusResponse>('/queue/my-status', {
        params: { appointmentId },
      });
      setData(response.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Could not load queue status');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(() => fetchStatus(), 5000);
    return () => clearInterval(interval);
  }, [appointmentId]);

  if (!appointmentId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No appointment selected.</Text>
      </View>
    );
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Loading live queue status…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => fetchStatus(true)}
        />
      }
    >
      {error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : data ? (
        <>
          <Text style={styles.eyebrow}>LIVE QUEUE</Text>
          <Text style={styles.ticket}>{data.ticketNumber}</Text>
          <Text style={styles.service}>{data.serviceName}</Text>

          {!data.queueStatus ? (
            <View style={styles.infoCard}>
              <Text style={styles.infoTitle}>Not checked in yet</Text>
              <Text style={styles.infoText}>
                Present your QR ticket when you arrive. Your live position and waiting estimate will appear here after check-in.
              </Text>
            </View>
          ) : (
            <>
              <View style={[styles.statusCard, statusStyle(data.queueStatus)]}>
                <Text style={styles.statusLabel}>
                  {STATUS_LABELS[data.queueStatus] || data.queueStatus}
                </Text>
                {data.queueStatus === 'CALLED' && data.counter ? (
                  <>
                    <Text style={styles.counterNumber}>
                      Counter {data.counter.number}
                    </Text>
                    <Text style={styles.counterName}>{data.counter.name}</Text>
                  </>
                ) : data.queueStatus === 'IN_PROGRESS' && data.counter ? (
                  <Text style={styles.counterNumber}>
                    Counter {data.counter.number}
                  </Text>
                ) : null}
              </View>

              {data.queueStatus === 'WAITING' && (
                <View style={styles.metricsRow}>
                  <Metric
                    label="Position"
                    value={data.position ? `#${data.position}` : '—'}
                  />
                  <Metric
                    label="People ahead"
                    value={String(data.peopleAhead ?? 0)}
                  />
                  <Metric
                    label="Est. wait"
                    value={`~${data.estimatedWaitMinutes ?? 0} min`}
                  />
                </View>
              )}

              {data.queueStatus === 'WAITING' && (
                <View style={styles.etaCard}>
                  <Text style={styles.etaTitle}>Smart wait estimate</Text>
                  <Text style={styles.etaText}>
                    Based on the people ahead of you and recent service processing times. Current average: {data.averageServiceMinutes} min per visitor.
                  </Text>
                </View>
              )}
            </>
          )}

          <Text style={styles.refreshHint}>
            Updates automatically every 5 seconds · Pull down to refresh
          </Text>
        </>
      ) : null}
    </ScrollView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function statusStyle(status: string) {
  switch (status) {
    case 'CALLED':
      return styles.statusCalled;
    case 'IN_PROGRESS':
      return styles.statusProgress;
    case 'FINISHED':
      return styles.statusFinished;
    case 'ABSENT':
      return styles.statusAbsent;
    default:
      return styles.statusWaiting;
  }
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 22, paddingBottom: 60 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  loadingText: { color: '#64748B', marginTop: 12 },
  eyebrow: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 2.5,
    textAlign: 'center',
  },
  ticket: {
    color: '#0F172A',
    fontSize: 40,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  service: {
    color: '#64748B',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 28,
  },
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  infoTitle: { color: '#0F172A', fontSize: 18, fontWeight: '800' },
  infoText: { color: '#64748B', fontSize: 14, lineHeight: 21, marginTop: 8 },
  statusCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    marginBottom: 18,
  },
  statusWaiting: { backgroundColor: '#FEF3C7' },
  statusCalled: { backgroundColor: '#DBEAFE' },
  statusProgress: { backgroundColor: '#EDE9FE' },
  statusFinished: { backgroundColor: '#D1FAE5' },
  statusAbsent: { backgroundColor: '#FEE2E2' },
  statusLabel: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  counterNumber: {
    color: '#1E1B4B',
    fontSize: 34,
    fontWeight: '900',
    marginTop: 12,
  },
  counterName: { color: '#475569', fontSize: 13, marginTop: 4 },
  metricsRow: { flexDirection: 'row', gap: 10 },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 8,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricValue: { color: '#0F172A', fontSize: 20, fontWeight: '900' },
  metricLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '700',
    marginTop: 5,
    textAlign: 'center',
  },
  etaCard: {
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  etaTitle: { color: '#312E81', fontSize: 14, fontWeight: '800' },
  etaText: { color: '#4F46E5', fontSize: 12, lineHeight: 18, marginTop: 6 },
  refreshHint: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 24,
  },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 18,
  },
  errorText: { color: '#B91C1C', fontWeight: '700', textAlign: 'center' },
});
