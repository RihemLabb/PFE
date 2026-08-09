import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import api from '../api/axios';

export default function FeedbackScreen() {
  const params = useLocalSearchParams();
  const appointmentId = Array.isArray(params.appointmentId)
    ? params.appointmentId[0]
    : params.appointmentId;
  const ticketNumber = Array.isArray(params.ticketNumber)
    ? params.ticketNumber[0]
    : params.ticketNumber;
  const serviceName = Array.isArray(params.serviceName)
    ? params.serviceName[0]
    : params.serviceName;

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!appointmentId) {
      Alert.alert('Missing appointment', 'No appointment was selected.');
      return;
    }

    if (rating < 1) {
      Alert.alert('Choose a rating', 'Select between 1 and 5 stars.');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/feedback', {
        appointmentId,
        rating,
        comment: comment.trim() || undefined,
      });
      Alert.alert('Thank you', 'Your feedback was submitted.');
      router.replace('./history');
    } catch (error: any) {
      const message = error.response?.data?.message;
      Alert.alert(
        'Could not submit feedback',
        Array.isArray(message) ? message[0] : message || 'Please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!appointmentId) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No appointment selected.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>SERVICE FEEDBACK</Text>
      <Text style={styles.title}>How was your visit?</Text>
      <Text style={styles.subtitle}>
        {serviceName || 'Service'}
        {ticketNumber ? ` · ${ticketNumber}` : ''}
      </Text>

      <View style={styles.card}>
        <Text style={styles.label}>Your rating</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((value) => (
            <TouchableOpacity
              key={value}
              accessibilityRole="button"
              accessibilityLabel={`${value} star rating`}
              onPress={() => setRating(value)}
              style={styles.starButton}
            >
              <Text
                style={[
                  styles.star,
                  value <= rating ? styles.starSelected : styles.starUnselected,
                ]}
              >
                ★
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text style={styles.ratingHint}>
          {rating ? `${rating} out of 5` : 'Tap a star to rate your experience'}
        </Text>

        <Text style={[styles.label, styles.commentLabel]}>Comment (optional)</Text>
        <TextInput
          value={comment}
          onChangeText={(value) => setComment(value.slice(0, 500))}
          placeholder="Tell us what went well or what could be improved"
          placeholderTextColor="#94A3B8"
          multiline
          textAlignVertical="top"
          style={styles.input}
        />
        <Text style={styles.counter}>{comment.length}/500</Text>

        <TouchableOpacity
          onPress={submit}
          disabled={submitting || rating < 1}
          style={[
            styles.submitButton,
            (submitting || rating < 1) && styles.disabledButton,
          ]}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.submitText}>Submit feedback</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  content: { padding: 22, paddingBottom: 60 },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  errorText: { color: '#B91C1C', fontWeight: '700', textAlign: 'center' },
  eyebrow: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  title: {
    marginTop: 8,
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  label: { color: '#334155', fontSize: 14, fontWeight: '800' },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  starButton: { padding: 4 },
  star: { fontSize: 42 },
  starSelected: { color: '#F59E0B' },
  starUnselected: { color: '#E2E8F0' },
  ratingHint: {
    textAlign: 'center',
    color: '#64748B',
    fontSize: 12,
    marginTop: 8,
  },
  commentLabel: { marginTop: 28, marginBottom: 10 },
  input: {
    minHeight: 130,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 14,
    padding: 14,
    color: '#0F172A',
    backgroundColor: '#F8FAFC',
    fontSize: 14,
  },
  counter: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'right',
    marginTop: 6,
  },
  submitButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 22,
  },
  disabledButton: { opacity: 0.5 },
  submitText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
