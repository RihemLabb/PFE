import { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native';
import api from '../api/axios';

interface Appointment {
  _id: string;
  ticketNumber: string;
  date: string;
  timeSlot: string;
  status: string;
  serviceId: { name: string };
}

export default function History() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAppointments = async () => {
    try {
      console.log('Fetching appointments...');
      const { data } = await api.get('/appointments/my-appointments');
      console.log('API Response:', data);
      console.log('Number of appointments:', data.length);
      if (data.length > 0) {
        console.log('First appointment:', data[0]);
      }
      setAppointments(data);
    } catch (error: any) {
      console.error('Failed to fetch appointments', error);
      console.error('Error response:', error.response?.data);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return '#10b981';
      case 'CANCELLED': return '#ef4444';
      case 'FINISHED': return '#6b7280';
      default: return '#f59e0b';
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
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
        contentContainerStyle={appointments.length === 0 ? styles.emptyContainer : styles.list}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View style={styles.cardHeader}>
              <Text style={styles.ticketNumber}>{item.ticketNumber}</Text>
              <View style={[styles.badge, { backgroundColor: getStatusColor(item.status) + '20' }]}>
                <Text style={[styles.badgeText, { color: getStatusColor(item.status) }]}>
                  {item.status}
                </Text>
              </View>
            </View>
            <Text style={styles.serviceName}>{item.serviceId?.name || 'Service'}</Text>
            <View style={styles.cardFooter}>
              <Text style={styles.date}>{new Date(item.date).toLocaleDateString()}</Text>
              <Text style={styles.time}>{item.timeSlot}</Text>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No appointments yet</Text>
            <Text style={styles.emptySubtext}>Your booking history will appear here</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  list: { padding: 20, paddingBottom: 100 },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
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
  ticketNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0F172A',
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  serviceName: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 12,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  date: {
    fontSize: 13,
    color: '#94A3B8',
  },
  time: {
    fontSize: 13,
    color: '#6366f1',
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingTop: 50,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#94A3B8',
  },
});