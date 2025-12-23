import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { QrCode, Hash, X, Camera as CameraIcon, CheckCircle2 } from 'lucide-react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Spacing, BorderRadius, Gradients } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { useAuth } from '@/contexts/auth-context';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function CheckInScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const { user } = useAuth();
  const [method, setMethod] = useState<'QR' | 'PIN'>('QR');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const handleQRScan = async () => {
    if (!permission) {
      // Permission not loaded yet
      return;
    }

    if (!permission.granted) {
      const { granted } = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Permission requise',
          'L\'accès à la caméra est nécessaire pour scanner le QR code',
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setScanning(true);
  };

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      setScanning(false);
      return;
    }

    try {
      setLoading(true);
      setScanning(false);

      await ApiClient.post('/sessions/checkin', {
        sessionId,
        studentId: user.id,
        method: 'QR',
        code: data,
      });

      Alert.alert('Succès', 'Check-in enregistré avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer le check-in');
      setScanning(false);
    } finally {
      setLoading(false);
    }
  };

  const handlePINSubmit = async () => {
    if (!pin || pin.length < 4) {
      Alert.alert('Erreur', 'Veuillez entrer un code PIN valide');
      return;
    }

    if (!user) {
      Alert.alert('Erreur', 'Utilisateur non connecté');
      return;
    }

    try {
      setLoading(true);
      await ApiClient.post('/sessions/checkin', {
        sessionId,
        studentId: user.id,
        method: 'PIN',
        code: pin,
      });

      Alert.alert('Succès', 'Check-in enregistré avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible d\'enregistrer le check-in');
    } finally {
      setLoading(false);
    }
  };

  if (scanning) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        
        <View style={styles.scannerHeader}>
          <Text style={styles.scannerTitle}>Scanner le QR code</Text>
          <TouchableOpacity onPress={() => setScanning(false)} style={styles.closeScannerButton}>
            <X size={24} color={Colors.white} />
          </TouchableOpacity>
        </View>

        <CameraView
          style={styles.camera}
          facing="back"
          onBarcodeScanned={handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr'],
          }}
        >
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerInstructions}>
              Positionnez le QR code dans le cadre
            </Text>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Check-in</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>Confirmer votre présence</Text>
        <Text style={styles.subtitle}>
          Choisissez une méthode pour enregistrer votre présence à cette session
        </Text>

        {/* Method Selector */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodButton, method === 'QR' && styles.methodButtonActive]}
            onPress={() => setMethod('QR')}
            activeOpacity={0.7}
          >
            <QrCode 
              size={24} 
              color={method === 'QR' ? Colors.primary : Colors.textSecondary} 
              strokeWidth={2}
            />
            <Text style={[
              styles.methodButtonText,
              method === 'QR' && styles.methodButtonTextActive
            ]}>
              Scanner QR
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, method === 'PIN' && styles.methodButtonActive]}
            onPress={() => setMethod('PIN')}
            activeOpacity={0.7}
          >
            <Hash 
              size={24} 
              color={method === 'PIN' ? Colors.primary : Colors.textSecondary} 
              strokeWidth={2}
            />
            <Text style={[
              styles.methodButtonText,
              method === 'PIN' && styles.methodButtonTextActive
            ]}>
              Code PIN
            </Text>
          </TouchableOpacity>
        </View>

        {/* QR Scanner */}
        {method === 'QR' && (
          <View style={styles.qrContainer}>
            <View style={styles.qrPlaceholder}>
              <QrCode size={80} color={Colors.primary} strokeWidth={1.5} />
              <Text style={styles.qrPlaceholderText}>
                Scanner le QR code affiché par le tuteur pour confirmer votre présence
              </Text>
            </View>
            <TouchableOpacity 
              style={styles.scanButton} 
              onPress={handleQRScan}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.scanButtonGradient}
              >
                <CameraIcon size={22} color={Colors.white} />
                <Text style={styles.scanButtonText}>Ouvrir le scanner</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}

        {/* PIN Entry */}
        {method === 'PIN' && (
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>Entrez le code PIN</Text>
            <TextInput
              style={styles.pinInput}
              value={pin}
              onChangeText={setPin}
              placeholder="••••"
              placeholderTextColor="rgba(13, 115, 119, 0.3)"
              keyboardType="number-pad"
              maxLength={6}
              autoFocus
            />
            <Text style={styles.pinHint}>
              Le code PIN est fourni par votre tuteur au début de la session
            </Text>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handlePINSubmit}
              disabled={loading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.primary}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.submitButtonGradient}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <>
                    <CheckCircle2 size={22} color={Colors.white} />
                    <Text style={styles.submitButtonText}>Confirmer ma présence</Text>
                  </>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 115, 119, 0.08)',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: Spacing.xl,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: 'rgba(13, 115, 119, 0.1)',
    ...Shadows.small,
  },
  methodButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
  },
  methodButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  methodButtonTextActive: {
    color: Colors.primary,
  },
  qrContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xl,
  },
  qrPlaceholder: {
    alignItems: 'center',
    gap: Spacing.lg,
    padding: Spacing.xxxl,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xxlarge,
    borderWidth: 3,
    borderColor: 'rgba(13, 115, 119, 0.1)',
    borderStyle: 'dashed',
    ...Shadows.medium,
  },
  qrPlaceholderText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    maxWidth: 220,
    lineHeight: 22,
    fontWeight: '500',
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Shadows.primary,
  },
  scanButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  scanButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  pinContainer: {
    flex: 1,
    gap: Spacing.lg,
  },
  pinLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  pinInput: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.lg,
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 12,
    borderWidth: 2,
    borderColor: Colors.primary,
    color: Colors.primary,
    ...Shadows.medium,
  },
  pinHint: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  submitButton: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    marginTop: Spacing.lg,
    ...Shadows.primary,
  },
  submitButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  submitButtonDisabled: {
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  // Scanner styles
  camera: {
    flex: 1,
  },
  scannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
  },
  scannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  closeScannerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xxxl,
  },
  scannerFrame: {
    width: 280,
    height: 280,
    borderWidth: 4,
    borderColor: Colors.secondary,
    borderRadius: BorderRadius.xxlarge,
    backgroundColor: 'transparent',
    shadowColor: Colors.secondary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  scannerInstructions: {
    fontSize: 17,
    color: Colors.white,
    textAlign: 'center',
    paddingHorizontal: Spacing.xxxl,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
});
