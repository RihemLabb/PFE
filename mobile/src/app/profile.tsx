import { useEffect, useState } from 'react';
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
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

interface ProfileResponse {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: string;
}

export default function Profile() {
  const user = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const [firstName, setFirstName] = useState(user?.firstName ?? '');
  const [lastName, setLastName] = useState(user?.lastName ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadProfile = async () => {
      try {
        const { data } = await api.get<ProfileResponse>('/users/me');
        setFirstName(data.firstName);
        setLastName(data.lastName);
        setEmail(data.email);
        setPhone(data.phone ?? '');
        await updateUser(data);
      } catch (error: any) {
        Alert.alert(
          'Profile error',
          error.response?.data?.message || 'Could not load your profile',
        );
      } finally {
        setLoading(false);
      }
    };
    loadProfile();
  }, [updateUser]);

  const save = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert('Missing information', 'Name and email are required.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.patch<ProfileResponse>('/users/me', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      });
      await updateUser(data);
      setFirstName(data.firstName);
      setLastName(data.lastName);
      setEmail(data.email);
      setPhone(data.phone ?? '');
      Alert.alert('Profile updated', 'Your information has been saved.');
    } catch (error: any) {
      const message = error.response?.data?.message;
      Alert.alert(
        'Update failed',
        Array.isArray(message) ? message[0] : message || 'Could not save profile',
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.eyebrow}>MY PROFILE</Text>
      <Text style={styles.title}>Personal information</Text>
      <Text style={styles.subtitle}>
        Keep your contact details up to date for your appointments.
      </Text>

      <View style={styles.card}>
        <Text style={styles.role}>{user?.role || 'USER'}</Text>

        <Text style={styles.label}>First name</Text>
        <TextInput
          style={styles.input}
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Last name</Text>
        <TextInput
          style={styles.input}
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholder="Optional"
        />

        <TouchableOpacity
          style={[styles.saveButton, saving && styles.disabledButton]}
          disabled={saving}
          onPress={save}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.saveText}>Save profile</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  eyebrow: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2.2,
    textAlign: 'center',
  },
  title: {
    color: '#0F172A',
    fontSize: 28,
    fontWeight: '900',
    textAlign: 'center',
    marginTop: 8,
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
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
  role: {
    alignSelf: 'flex-start',
    backgroundColor: '#EEF2FF',
    color: '#4338CA',
    fontSize: 11,
    fontWeight: '900',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginBottom: 22,
  },
  label: {
    color: '#475569',
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 7,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 13,
    backgroundColor: '#F8FAFC',
    color: '#0F172A',
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },
  saveButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: { opacity: 0.55 },
  saveText: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
});
