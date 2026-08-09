import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import api from '../api/axios';

interface Appointment {
  _id: string;
  ticketNumber: string;
  qrToken: string;
  date: string;
  timeSlot: string;
  status: string;
  serviceId: {
    name: string;
    requiredDocs?: string[];
  };
}

interface Feedback {
  appointmentId: string;
  rating: number;
}

export default function History() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const [appointmentsResponse, feedbackResponse] = await Promise.all([
        api.get<Appointment[]>('/appointments/my-appointments'),
        api.get<Feedback[]>('/feedback/my'),
      ]);

      setAppointments(appointmentsResponse.data);
      setRatings(
        Object.fromEntries(
          feedbackResponse.data.map((feedback) => [
            feedback.appointmentId,
            feedback.rating,
          ]),
        ),
      );
    } catch (error: any) {
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to load your appointments',
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchAppointments();
  };

  const openTicket = (appointment: Appointment) => {
    router.push({
      pathname: '/ticket',
      params: {
        appointmentId: appointment._id,
        ticketNumber: appointment.ticketNumber,
        qrToken: appointment.qrToken,
        timeSlot: appointment.timeSlot,
        date: appointment.date.split('T')[0],
        serviceName: appointment.serviceId?.name || 'Service',
      },
    });
  };

  const openQueueStatus = (appointment: Appointment) => {
    router.push({
      pathname: './queue-status',
      params: { appointmentId: appointment._id },
    });
  };

  const openFeedback = (appointment: Appointment) => {
    router.push({
      pathname: './feedback',
      params: {
        appointmentId: appointment._id,
        ticketNumber: appointment.ticketNumber,
        serviceName: appointment.serviceId?.name || 'Service',
      },
    });
  };

  const cancelAppointment = (appointment: Appointment) => {
    Alert.alert(
      'Cancel appointment?',
      `Cancel ticket ${appointment.ticketNumber}? This action cannot be undone.`,
      [
        { text: 'Keep appointment', style: 'cancel' },
        {
          text: 'Cancel appointment',
          style: 'destructive',
          onPress: async () => {
            setCancellingId(appointment._id);
            try {
              await api.post(`/appointments/${appointment._id}/cancel`);
              await fetchAppointments();
            } catch (error: any) {
              Alert.alert(
                'Cancellation failed',
                error.response?.data?.message || 'Could not cancel appointment',
              );
            } finally {
              setCancellingId(null);
            }
          },
        },
      ],
    );
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return '#10B981';
      case 'CHECKED_IN':
        return '#3B82F6';
      case 'CANCELLED':
        return '#EF4444';
      case 'FINISHED':
        return '#64748B';
      case 'ABSENT':
        return '#F97316';
      default:
        return '#F59E0B';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={appointments}
        keyExtractor={(item) => item._id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={
          appointments.length === 0 ? styles.emptyContainer : styles.list
        }
        renderItem={({ item }) => {
          const statusColor = getStatusColor(item.status);
          const canCancel = item.status === 'CONFIRMED';
          const canViewTicket = item.status !== 'CANCELLED';
          const canTrackQueue = ['CHECKED_IN', 'FINISHED', 'ABSENT'].includes(
            item.status,
          );
          const rating = ratings[item._id];
          const canRate = item.status === 'FINISHED' && !rating;

          return (
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
                <View
                  style={[styles.badge, { backgroundColor: `${statusColor}20` }]}
                >
                  <Text style={[styles.badgeText, { color: statusColor }]}> 
                    {item.status}
                  </Text>
                </View>
              </View>

              <Text style={styles.serviceName}>
                {item.serviceId?.name || 'Service'}
              </Text>

              <View style={styles.cardFooter}>
                <Text style={styles.date}>
                  {new Date(item.date).toLocaleDateString()}
                </Text>
                <Text style={styles.time}>{item.timeSlot}</Text>
              </View>

              <View style={styles.actions}>
                {canTrackQueue && (
                  <TouchableOpacity
                    style={styles.liveButton}
                    onPress={() => openQueueStatus(item)}
                  >
                    <Text style={styles.liveButtonText}>Live queue</Text>
                  </TouchableOpacity>
                )}

                {canViewTicket && (
                  <TouchableOpacity
                    style={styles.primaryButton}
                    onPress={() => openTicket(item)}
                  >
                    <Text style={styles.primaryButtonText}>View QR ticket</Text>
                  </TouchableOpacity>
                )}

                {canRate && (
                  <TouchableOpacity
                    style={styles.ratingButton}
                    onPress={() => openFeedback(item)}
                  >
                    <Text style={styles.ratingButtonText}>Rate service</Text>
                  </TouchableOpacity>
                )}

                {rating ? (
                  <View style={styles.ratedBadge}>
                    <Text style={styles.ratedText}>Rated {'★'.repeat(rating)}</Text>
                  </View>
                ) : null}

                {canCancel && (
                  <TouchableOpacity
                    style={styles.cancelButton}
                    disabled={cancellingId === item._id}
                    onPress={() => cancelAppointment(item)}
                  >
                    <Text style={styles.cancelButtonText}>
                      {cancellingId === item._id ? 'Cancelling…' : 'Cancel'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>

              {item.serviceId?.requiredDocs?.length ? (
                <View style={styles.docsSection}>
                  <Text style={styles.docsTitle}>Bring with you</Text>
                  {item.serviceId.requiredDocs.map((document) => (
                    <Text key={document} style={styles.docItem}>
                      ✓ {document}
                    </Text>
                  ))}
                </View>
              ) : null}
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No appointments yet</Text>
            <Text style={styles.emptySubtext}>
              Your booking history will appear here
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  list: { padding: 20, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 18,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketNumber: { fontSize: 18, fontWeight: '800', color: '#0F172A' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  serviceName: { fontSize: 14, color: '#64748B', marginBottom: 12 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  date: { fontSize: 13, color: '#94A3B8' },
  time: { fontSize: 13, color: '#6366F1', fontWeight: '700' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 16 },
  liveButton: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  liveButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  primaryButton: {
    flexGrow: 1,
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  ratingButton: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  ratingButtonText: { color: '#92400E', fontWeight: '800', fontSize: 13 },
  ratedBadge: {
    backgroundColor: '#F0FDF4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  ratedText: { color: '#166534', fontWeight: '800', fontSize: 12 },
  cancelButton: {
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingHorizontal: 18,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cancelButtonText: { color: '#DC2626', fontWeight: '700', fontSize: 13 },
  docsSection: {
    marginTop: 16,
    backgroundColor: '#F8FAFC',
    padding: 14,
    borderRadius: 12,
  },
  docsTitle: { fontSize: 12, fontWeight: '800', color: '#475569', marginBottom: 5 },
  docItem: { fontSize: 12, color: '#64748B', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 50 },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#64748B', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
});
