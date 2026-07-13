import { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, SafeAreaView } from 'react-native';
import { router } from 'expo-router';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface Service {
  _id: string;
  name: string;
  description: string;
  avgDuration: number;
}

export default function Home() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuthStore();

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const { data } = await api.get('/services');
        setServices(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchServices();
  }, []);

  const handleLogout = () => {
    logout();
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
        <TouchableOpacity style={styles.activePill} onPress={() => {}}>
          <Text style={styles.activePillText}>Services</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.inactivePill} onPress={() => router.push('/history')}>
          <Text style={styles.inactivePillText}>My Appointments</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#4F46E5" style={{ marginTop: 100 }} />
      ) : (
        <FlatList
          data={services}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <TouchableOpacity 
              style={styles.card} 
              onPress={() => router.push(`/booking?serviceId=${item._id}&serviceName=${item.name}`)}
            >
              <View style={styles.cardIcon}>
                <Text style={styles.cardIconText}>✦</Text>
              </View>
              <View style={styles.cardContent}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
                <Text style={styles.cardMeta}>{item.avgDuration} min • Instant confirmation</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 24, paddingTop: 20, paddingBottom: 10 },
  greeting: { fontSize: 14, color: '#64748B', fontWeight: '500' },
  userName: { fontSize: 24, color: '#0F172A', fontWeight: '700', marginTop: 2 },
  logoutBtn: { padding: 8, backgroundColor: '#F1F5F9', borderRadius: 20 },
  logoutText: { color: '#64748B', fontSize: 12, fontWeight: '600' },
  navRow: { flexDirection: 'row', paddingHorizontal: 24, marginTop: 20, gap: 12 },
  activePill: { backgroundColor: '#0F172A', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30 },
  activePillText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  inactivePill: { backgroundColor: '#FFFFFF', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 30, borderWidth: 1, borderColor: '#E2E8F0' },
  inactivePillText: { color: '#64748B', fontSize: 14, fontWeight: '600' },
  list: { padding: 24, paddingBottom: 100 },
  card: { flexDirection: 'row', backgroundColor: '#FFFFFF', padding: 20, borderRadius: 24, marginBottom: 16, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.03, shadowRadius: 12, elevation: 2 },
  cardIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 16 },
  cardIconText: { color: '#4F46E5', fontSize: 20 },
  cardContent: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: '700', color: '#0F172A', marginBottom: 4 },
  cardDesc: { fontSize: 13, color: '#64748B', lineHeight: 18, marginBottom: 8 },
  cardMeta: { fontSize: 11, color: '#94A3B8', fontWeight: '500' },
  arrow: { fontSize: 20, color: '#CBD5E1', marginLeft: 10 },
});