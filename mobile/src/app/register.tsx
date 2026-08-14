import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { router } from 'expo-router';
import api from '../api/axios';
import { useAuthStore } from '../store/authStore';

export default function Register() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleRegister = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !password) {
      Alert.alert('Missing information', 'Please complete all required fields.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim() || undefined,
        password,
      });
      await setAuth(data.user, data.access_token, data.refresh_token);
      router.replace('/');
    } catch (err: any) {
      const message = err.response?.data?.message;
      Alert.alert(
        'Registration failed',
        Array.isArray(message)
          ? message.join('\n')
          : message || 'Could not create account',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SMART QUEUE</Text>
      <Text style={styles.title}>Create your account</Text>
      <Text style={styles.subtitle}>
        Book appointments, keep your QR tickets, and follow your service history.
      </Text>

      <View style={styles.nameRow}>
        <TextInput
          style={[styles.input, styles.nameInput]}
          placeholder="First name"
          value={firstName}
          onChangeText={setFirstName}
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.input, styles.nameInput]}
          placeholder="Last name"
          value={lastName}
          onChangeText={setLastName}
          autoCapitalize="words"
        />
      </View>

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Phone (optional)"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />
      <TextInput
        style={styles.input}
        placeholder="Password (minimum 6 characters)"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity
        style={[styles.primaryButton, loading && styles.disabledButton]}
        disabled={loading}
        onPress={handleRegister}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.primaryButtonText}>Create account</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => router.replace('/login')}>
        <Text style={styles.loginLink}>
          Already have an account?{' '}
          <Text style={styles.loginLinkStrong}>Sign in</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F8FAFC',
  },
  eyebrow: {
    color: '#4F46E5',
    fontWeight: '800',
    fontSize: 11,
    letterSpacing: 2.5,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    color: '#0F172A',
    fontWeight: '800',
    fontSize: 28,
    textAlign: 'center',
  },
  subtitle: {
    color: '#64748B',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 28,
  },
  nameRow: { flexDirection: 'row', gap: 10 },
  nameInput: { flex: 1 },
  input: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#CBD5E1',
    color: '#0F172A',
  },
  primaryButton: {
    backgroundColor: '#4F46E5',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
  },
  disabledButton: { opacity: 0.6 },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800', fontSize: 15 },
  loginLink: {
    color: '#64748B',
    textAlign: 'center',
    marginTop: 22,
    fontSize: 13,
  },
  loginLinkStrong: { color: '#4F46E5', fontWeight: '800' },
});
