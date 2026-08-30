import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import type { BarcodeScanningResult } from 'expo-camera';
import { router } from 'expo-router';
import api from '../api/axios';

interface CheckInResponse {
  appointmentId: string;
  position: number;
  status: string;
}

function apiErrorMessage(error: any) {
  const message = error?.response?.data?.message;
  if (Array.isArray(message)) return message.join('\n');
  if (typeof message === 'string') return message;
  return 'Could not check in with this QR code.';
}

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [cameraReady, setCameraReady] = useState(false);
  const [scanLocked, setScanLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleBarcodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (scanLocked || submitting) return;

      const qrToken = data.trim();
      setScanLocked(true);
      setError('');

      if (!qrToken) {
        setError('The scanned QR code does not contain a valid ticket token.');
        return;
      }

      setSubmitting(true);
      try {
        const response = await api.post<CheckInResponse>('/queue/checkin', {
          qrToken,
        });
        const appointmentId = response.data.appointmentId;

        if (!appointmentId) {
          throw new Error('Check-in succeeded but no appointment ID was returned.');
        }

        router.replace({
          pathname: '/queue-status',
          params: { appointmentId },
        });
      } catch (scanError: any) {
        setError(apiErrorMessage(scanError));
        setSubmitting(false);
      }
    },
    [scanLocked, submitting],
  );

  const scanAgain = () => {
    setError('');
    setScanLocked(false);
  };

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text style={styles.loadingText}>Preparing camera…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.permissionContainer}>
        <View style={styles.permissionCard}>
          <Text style={styles.permissionIcon}>▣</Text>
          <Text style={styles.permissionTitle}>Camera access needed</Text>
          <Text style={styles.permissionText}>
            Smart Queue uses the camera only to read appointment QR tickets for check-in.
          </Text>

          {permission.canAskAgain ? (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => requestPermission()}
            >
              <Text style={styles.primaryButtonText}>Allow camera</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => Linking.openSettings()}
            >
              <Text style={styles.primaryButtonText}>Open settings</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>QR CHECK-IN</Text>
        <Text style={styles.title}>Scan your ticket</Text>
        <Text style={styles.subtitle}>
          Place the QR code inside the frame. Check-in is accepted only for an authorized appointment on its scheduled day.
        </Text>
      </View>

      <View style={styles.cameraCard}>
        <CameraView
          style={StyleSheet.absoluteFill}
          facing="back"
          barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
          onCameraReady={() => setCameraReady(true)}
          onBarcodeScanned={
            cameraReady && !scanLocked ? handleBarcodeScanned : undefined
          }
        />
        <View pointerEvents="none" style={styles.overlay}>
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>
        </View>
      </View>

      {submitting ? (
        <View style={styles.statusCard}>
          <ActivityIndicator color="#4F46E5" />
          <View style={styles.statusCopy}>
            <Text style={styles.statusTitle}>Checking in…</Text>
            <Text style={styles.statusText}>Validating your appointment and queue entry.</Text>
          </View>
        </View>
      ) : error ? (
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Check-in not completed</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={scanAgain}>
            <Text style={styles.retryButtonText}>Scan again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.hintCard}>
          <Text style={styles.hintTitle}>
            {cameraReady ? 'Ready to scan' : 'Starting camera…'}
          </Text>
          <Text style={styles.hintText}>
            Keep the ticket steady and make sure the full QR code is visible.
          </Text>
        </View>
      )}

      <TouchableOpacity style={styles.historyButton} onPress={() => router.push('/history')}>
        <Text style={styles.historyButtonText}>Open my appointments</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', padding: 20 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingText: { color: '#64748B', marginTop: 12 },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
    padding: 24,
  },
  permissionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  permissionIcon: { color: '#4F46E5', fontSize: 42, fontWeight: '900' },
  permissionTitle: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    marginTop: 12,
  },
  permissionText: {
    color: '#64748B',
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 21,
    marginTop: 10,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#4F46E5',
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontWeight: '800' },
  secondaryButton: { paddingVertical: 14, marginTop: 6 },
  secondaryButtonText: { color: '#64748B', fontWeight: '700' },
  header: { marginBottom: 18 },
  eyebrow: {
    color: '#4F46E5',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 2.2,
  },
  title: { color: '#0F172A', fontSize: 28, fontWeight: '900', marginTop: 6 },
  subtitle: { color: '#64748B', fontSize: 13, lineHeight: 19, marginTop: 8 },
  cameraCard: {
    height: 390,
    overflow: 'hidden',
    borderRadius: 28,
    backgroundColor: '#0F172A',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.22)',
  },
  scanFrame: { width: 230, height: 230, position: 'relative' },
  corner: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderColor: '#FFFFFF',
  },
  cornerTopLeft: { top: 0, left: 0, borderTopWidth: 5, borderLeftWidth: 5 },
  cornerTopRight: { top: 0, right: 0, borderTopWidth: 5, borderRightWidth: 5 },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 5,
    borderLeftWidth: 5,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 5,
    borderRightWidth: 5,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  statusCopy: { marginLeft: 12, flex: 1 },
  statusTitle: { color: '#312E81', fontWeight: '900', fontSize: 15 },
  statusText: { color: '#4F46E5', fontSize: 12, marginTop: 4 },
  errorCard: {
    backgroundColor: '#FEE2E2',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
  },
  errorTitle: { color: '#991B1B', fontWeight: '900', fontSize: 15 },
  errorText: { color: '#B91C1C', fontSize: 12, lineHeight: 18, marginTop: 5 },
  retryButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginTop: 12,
  },
  retryButtonText: { color: '#B91C1C', fontWeight: '800', fontSize: 12 },
  hintCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  hintTitle: { color: '#0F172A', fontWeight: '900', fontSize: 14 },
  hintText: { color: '#64748B', fontSize: 12, lineHeight: 18, marginTop: 4 },
  historyButton: { alignItems: 'center', paddingVertical: 16 },
  historyButtonText: { color: '#4F46E5', fontWeight: '800', fontSize: 13 },
});
