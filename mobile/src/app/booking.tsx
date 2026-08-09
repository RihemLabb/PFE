import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../api/axios';

interface AvailabilitySlot {
  time: string;
  booked: number;
  remaining: number;
  available: boolean;
}

interface AvailabilityResponse {
  serviceId: string;
  serviceName: string;
  date: string;
  slotDuration: number;
  maxCapacityPerSlot: number;
  openingTime: string;
  closingTime: string;
  requiredDocs: string[];
  isOpen: boolean;
  closureReason?: string | null;
  slots: AvailabilitySlot[];
}

export default function Booking() {
  const params = useLocalSearchParams();
  const serviceId = Array.isArray(params.serviceId)
    ? params.serviceId[0]
    : params.serviceId;
  const serviceName = Array.isArray(params.serviceName)
    ? params.serviceName[0]
    : params.serviceName;

  const dateOptions = useMemo(
    () =>
      Array.from({ length: 10 }, (_, index) => {
        const date = new Date();
        date.setDate(date.getDate() + index);
        const value = date.toISOString().split('T')[0];
        return {
          value,
          day: date.toLocaleDateString([], { weekday: 'short' }),
          label: date.toLocaleDateString([], { month: 'short', day: 'numeric' }),
        };
      }),
    [],
  );

  const [selectedDate, setSelectedDate] = useState(dateOptions[0].value);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(
    null,
  );
  const [loadingAvailability, setLoadingAvailability] = useState(true);
  const [bookingTime, setBookingTime] = useState<string | null>(null);

  useEffect(() => {
    if (!serviceId) return;

    const fetchAvailability = async () => {
      setLoadingAvailability(true);
      try {
        const { data } = await api.get<AvailabilityResponse>('/availability', {
          params: { serviceId, date: selectedDate },
        });
        setAvailability(data);
      } catch (err: any) {
        setAvailability(null);
        Alert.alert(
          'Availability error',
          err.response?.data?.message || 'Could not load available time slots',
        );
      } finally {
        setLoadingAvailability(false);
      }
    };

    fetchAvailability();
  }, [selectedDate, serviceId]);

  const handleBook = async (timeSlot: string) => {
    if (!serviceId) return;

    setBookingTime(timeSlot);
    try {
      const { data } = await api.post('/appointments', {
        serviceId,
        date: selectedDate,
        timeSlot,
      });

      router.push({
        pathname: '/ticket',
        params: {
          appointmentId: data._id,
          ticketNumber: data.ticketNumber,
          qrToken: data.qrToken,
          timeSlot: data.timeSlot,
          date: selectedDate,
          serviceName: serviceName || availability?.serviceName || 'Service',
        },
      });
    } catch (err: any) {
      Alert.alert('Booking error', err.response?.data?.message || 'Booking failed');
    } finally {
      setBookingTime(null);
    }
  };

  if (!serviceId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No service was selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>BOOK AN APPOINTMENT</Text>
      <Text style={styles.title}>{serviceName || 'Service'}</Text>
      <Text style={styles.subtitle}>
        Choose a date, then select one of the remaining time slots.
      </Text>

      <Text style={styles.sectionTitle}>Select a date</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.dateRow}
      >
        {dateOptions.map((option) => {
          const selected = selectedDate === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              style={[styles.dateCard, selected && styles.dateCardSelected]}
              onPress={() => setSelectedDate(option.value)}
            >
              <Text
                style={[styles.dateDay, selected && styles.dateTextSelected]}
              >
                {option.day}
              </Text>
              <Text
                style={[styles.dateLabel, selected && styles.dateTextSelected]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Available times</Text>
        {availability?.isOpen && (
          <Text style={styles.scheduleText}>
            {availability.openingTime}–{availability.closingTime}
          </Text>
        )}
      </View>

      {loadingAvailability ? (
        <ActivityIndicator size="large" color="#4F46E5" style={styles.loader} />
      ) : !availability?.isOpen ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Service closed</Text>
          <Text style={styles.emptyText}>
            {availability?.closureReason ||
              'Choose another date to view available appointments.'}
          </Text>
        </View>
      ) : availability.slots.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>No slots configured</Text>
          <Text style={styles.emptyText}>
            There are no appointment times for this day.
          </Text>
        </View>
      ) : (
        <View style={styles.slotGrid}>
          {availability.slots.map((slot) => {
            const busy = bookingTime === slot.time;
            return (
              <TouchableOpacity
                key={slot.time}
                disabled={!slot.available || bookingTime !== null}
                onPress={() => handleBook(slot.time)}
                style={[
                  styles.slotCard,
                  !slot.available && styles.slotCardDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.slotTime,
                    !slot.available && styles.slotTextDisabled,
                  ]}
                >
                  {busy ? 'Booking…' : slot.time}
                </Text>
                <Text
                  style={[
                    styles.slotMeta,
                    !slot.available && styles.slotTextDisabled,
                  ]}
                >
                  {slot.available
                    ? `${slot.remaining} place${slot.remaining === 1 ? '' : 's'} left`
                    : 'Full'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {availability?.requiredDocs?.length ? (
        <View style={styles.docsCard}>
          <Text style={styles.docsTitle}>Documents required</Text>
          {availability.requiredDocs.map((document) => (
            <Text key={document} style={styles.docItem}>
              ✓ {document}
            </Text>
          ))}
        </View>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 22, paddingBottom: 60 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  errorText: { color: '#B91C1C', fontSize: 16, fontWeight: '600' },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2,
    fontWeight: '800',
    color: '#6366F1',
    marginBottom: 8,
  },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A' },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 21,
    marginTop: 8,
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 12,
  },
  scheduleText: { color: '#64748B', fontSize: 12, marginBottom: 12 },
  dateRow: { gap: 10, paddingRight: 12 },
  dateCard: {
    minWidth: 88,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  dateCardSelected: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  dateDay: { fontSize: 12, color: '#64748B', fontWeight: '700' },
  dateLabel: {
    fontSize: 14,
    color: '#0F172A',
    fontWeight: '800',
    marginTop: 3,
  },
  dateTextSelected: { color: '#FFFFFF' },
  loader: { marginVertical: 36 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  emptyText: { fontSize: 13, color: '#64748B', marginTop: 6, lineHeight: 19 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  slotCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    borderRadius: 16,
    padding: 16,
  },
  slotCardDisabled: { backgroundColor: '#F1F5F9', borderColor: '#E2E8F0' },
  slotTime: { color: '#3730A3', fontSize: 18, fontWeight: '800' },
  slotMeta: { color: '#64748B', fontSize: 11, marginTop: 4 },
  slotTextDisabled: { color: '#94A3B8' },
  docsCard: {
    marginTop: 30,
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 20,
  },
  docsTitle: {
    color: '#312E81',
    fontWeight: '800',
    fontSize: 15,
    marginBottom: 10,
  },
  docItem: { color: '#4338CA', fontSize: 13, marginTop: 5 },
});
