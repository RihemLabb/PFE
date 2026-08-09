import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface Service {
  _id: string;
  name: string;
  description: string;
  avgDuration: number;
  isActive: boolean;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.get<Service[]>('/services');
        setServices(data.filter((service) => service.isActive));
      } catch (error: any) {
        Alert.alert(
          'Connection error',
          error.response?.data?.message || 'Could not load available services',
        );
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Welcome back,</Text>
          <Text style={styles.userName}>{user?.firstName || 'User'}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn}>
          <Text style={styles.logoutText}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.navRow}>
        <View style={styles.activePill}>
          <Text style={styles.activePillText}>Services</Text>
        </View>
        <TouchableOpacity
          style={styles.inactivePill}
          onPress={() => router.push('/history')}
        >
          <Text style={styles.inactivePillText}>My Appointments</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.inactivePill}
          onPress={() => router.push('/profile')}
        >
          <Text style={styles.inactivePillText}>Profile</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.scannerCard} onPress={() => router.push('/scanner')}>
        <View style={styles.scannerIcon}>
          <Text style={styles.scannerIconText}>▣</Text>
        </View>
        <View style={styles.scannerCopy}>
          <Text style={styles.scannerTitle}>Scan QR to check in</Text>
          <Text style={styles.scannerText}>
            Use your camera to validate an appointment ticket when you arrive.
          </Text>
        </View>
        <Text style={styles.scannerArrow}>→</Text>
      </TouchableOpacity>

      {loading ? (
        <ActivityIndicator
          size="large"
          color="#4F46E5"
          style={styles.loader}
        />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          contentContainerStyle={
            services.length === 0 ? styles.emptyList : styles.list
          }
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>No services available</Text>
              <Text style={styles.emptyText}>
                There are currently no active services accepting appointments.
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({
                  pathname: '/booking',
                  params: { serviceId: item._id, serviceName: item.name },
                })
              }
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>✦</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>
                  {item.description}
                </Text>
                <Text style={styles.cardMeta}>
                  ~{item.avgDuration} min average service time
                </Text>
              </View>
              <Text style={styles.arrow}>→</Text>
            </TouchableOpacity>
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 10,
  },
  greeting: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  userName: {
    fontSize: 24,
    color: '#0F172A',
    fontWeight: '700',
    marginTop: 2,
  },
  logoutBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },
  logoutText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  navRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 24,
    marginTop: 20,
    gap: 10,
  },
  activePill: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
  },
  activePillText: { color: '#FFFFFF', fontSize: 13, fontWeight: '600' },
  inactivePill: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inactivePillText: { color: '#64748B', fontSize: 13, fontWeight: '600' },
  scannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 18,
    backgroundColor: '#EEF2FF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#C7D2FE',
  },
  scannerIcon: {
    width: 46,
    height: 46,
    borderRadius: 14,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scannerIconText: { color: '#FFFFFF', fontSize: 23, fontWeight: '900' },
  scannerCopy: { flex: 1, marginLeft: 13 },
  scannerTitle: { color: '#312E81', fontSize: 15, fontWeight: '900' },
  scannerText: { color: '#4F46E5', fontSize: 11, lineHeight: 16, marginTop: 3 },
  scannerArrow: { color: '#4F46E5', fontSize: 20, marginLeft: 10 },
  loader: { marginTop: 100 },
  list: { padding: 24, paddingBottom: 100 },
  emptyList: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: { color: '#0F172A', fontSize: 17, fontWeight: '800' },
  emptyText: {
    color: '#64748B',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: 6,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 24,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardIconText: { color: '#4F46E5', fontSize: 20 },
  cardContent: { flex: 1 },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 13,
    color: '#64748B',
    lineHeight: 18,
    marginBottom: 8,
  },
  cardMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  arrow: { fontSize: 20, color: '#CBD5E1', marginLeft: 10 },
});
