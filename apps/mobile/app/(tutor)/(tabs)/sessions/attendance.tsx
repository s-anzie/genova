import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  QrCode, 
  Hash, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Users,
  LogOut,
} from 'lucide-react-native';
import QRCode from 'react-native-qrcode-svg';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { PageHeader } from '@/components/PageHeader';
import { AttendanceResponse } from '@/types/api';

export default function SessionAttendanceScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [method, setMethod] = useState<'QR' | 'PIN'>('QR');
  const [qrCode, setQrCode] = useState<string>('');
  const [pin, setPin] = useState<string>('');
  const [expiresIn, setExpiresIn] = useState<number>(0);
  const [attendances, setAttendances] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);
  const [newCheckIns, setNewCheckIns] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadAttendanceData();
    generateCode();
  }, [sessionId, method]);

  // Auto-refresh attendance data every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadAttendanceData(true); // Silent refresh
    }, 5000);

    return () => clearInterval(interval);
  }, [sessionId]);

  useEffect(() => {
    // Countdown timer for code expiration
    if (expiresIn > 0) {
      const timer = setInterval(() => {
        setExpiresIn(prev => {
          if (prev <= 1) {
            generateCode(); // Regenerate when expired
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [expiresIn]);

  const loadAttendanceData = async (silent = false) => {
    try {
      const response = await ApiClient.get<{ success: boolean; data: AttendanceResponse[] }>(
        `/attendance/sessions/${sessionId}`
      );
      
      // Detect new check-ins
      if (attendances.length > 0 && !silent) {
        const previousPresentIds = new Set(
          attendances.filter(a => a.status === 'PRESENT').map(a => a.studentId)
        );
        const currentPresentIds = new Set(
          response.data.filter(a => a.status === 'PRESENT').map(a => a.studentId)
        );
        
        const newIds = new Set<string>();
        currentPresentIds.forEach(id => {
          if (!previousPresentIds.has(id)) {
            newIds.add(id);
          }
        });
        
        if (newIds.size > 0) {
          setNewCheckIns(newIds);
          // Clear the highlight after 3 seconds
          setTimeout(() => setNewCheckIns(new Set()), 3000);
        }
      }
      
      setAttendances(response.data);
    } catch (error) {
      console.error('Failed to load attendance:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const generateCode = async () => {
    try {
      const endpoint = method === 'QR' 
        ? `/attendance/sessions/${sessionId}/qr`
        : `/attendance/sessions/${sessionId}/pin`;
      
      const response = await ApiClient.get<{ 
        success: boolean; 
        data: { qrCode?: string; pin?: string; expiresIn: number } 
      }>(endpoint);

      if (method === 'QR' && response.data.qrCode) {
        setQrCode(response.data.qrCode);
      } else if (method === 'PIN' && response.data.pin) {
        setPin(response.data.pin);
      }
      
      setExpiresIn(response.data.expiresIn);
    } catch (error) {
      console.error('Failed to generate code:', error);
      Alert.alert('Erreur', 'Impossible de générer le code');
    }
  };

  const handleCheckOut = () => {
    Alert.alert(
      'Terminer la session',
      'Êtes-vous sûr de vouloir terminer cette session ? Les étudiants ne pourront plus faire leur check-in.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Terminer',
          style: 'destructive',
          onPress: performCheckOut,
        },
      ]
    );
  };

  const performCheckOut = async () => {
    try {
      setCheckingOut(true);
      await ApiClient.post('/attendance/checkout', {
        sessionId,
      });

      Alert.alert(
        'Session terminée',
        'La session a été terminée avec succès. Les paiements seront traités sous peu.',
        [
          {
            text: 'OK',
            onPress: () => router.back(),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de terminer la session');
    } finally {
      setCheckingOut(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendanceData();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
  const absentCount = attendances.filter(a => a.status === 'ABSENT').length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Chargement...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Présences" 
        showBackButton 
        variant="primary"
        centerTitle
      />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card */}
        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Users size={24} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.statValue}>{attendances.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <CheckCircle2 size={24} color={Colors.success} strokeWidth={2} />
            <Text style={[styles.statValue, { color: Colors.success }]}>{presentCount}</Text>
            <Text style={styles.statLabel}>Présents</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <XCircle size={24} color={Colors.error} strokeWidth={2} />
            <Text style={[styles.statValue, { color: Colors.error }]}>{absentCount}</Text>
            <Text style={styles.statLabel}>Absents</Text>
          </View>
        </View>

        {/* Method Selector */}
        <View style={styles.methodSelector}>
          <TouchableOpacity
            style={[styles.methodButton, method === 'QR' && styles.methodButtonActive]}
            onPress={() => setMethod('QR')}
            activeOpacity={0.7}
          >
            <QrCode 
              size={20} 
              color={method === 'QR' ? Colors.white : Colors.textSecondary} 
              strokeWidth={2}
            />
            <Text style={[
              styles.methodButtonText,
              method === 'QR' && styles.methodButtonTextActive
            ]}>
              QR Code
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodButton, method === 'PIN' && styles.methodButtonActive]}
            onPress={() => setMethod('PIN')}
            activeOpacity={0.7}
          >
            <Hash 
              size={20} 
              color={method === 'PIN' ? Colors.white : Colors.textSecondary} 
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

        {/* Code Display */}
        <View style={styles.codeCard}>
          {method === 'QR' && qrCode ? (
            <View style={styles.qrContainer}>
              <View style={styles.qrCodeDisplay}>
                <QRCode
                  value={qrCode}
                  size={200}
                  color={Colors.primary}
                  backgroundColor={Colors.white}
                />
              </View>
              <Text style={styles.codeInstruction}>
                Les étudiants doivent scanner ce QR code pour confirmer leur présence
              </Text>
            </View>
          ) : method === 'PIN' && pin ? (
            <View style={styles.pinContainer}>
              <Text style={styles.pinLabel}>Code PIN</Text>
              <Text style={styles.pinDisplay}>{pin}</Text>
              <Text style={styles.codeInstruction}>
                Communiquez ce code aux étudiants pour qu'ils confirment leur présence
              </Text>
            </View>
          ) : null}

          {/* Expiration Timer */}
          <View style={styles.expirationBadge}>
            <Clock size={16} color={Colors.white} strokeWidth={2} />
            <Text style={styles.expirationText}>
              Expire dans {formatTime(expiresIn)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.refreshButton}
            onPress={generateCode}
            activeOpacity={0.7}
          >
            <Text style={styles.refreshButtonText}>Générer un nouveau code</Text>
          </TouchableOpacity>
        </View>

        {/* Attendance List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Liste des présences</Text>
          {attendances.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={48} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyTitle}>Aucune présence enregistrée</Text>
              <Text style={styles.emptyText}>
                Les étudiants apparaîtront ici après leur check-in
              </Text>
            </View>
          ) : (
            <View style={styles.attendanceList}>
              {attendances.map((attendance) => {
                const isNewCheckIn = newCheckIns.has(attendance.studentId);
                return (
                  <View 
                    key={attendance.id} 
                    style={[
                      styles.attendanceItem,
                      isNewCheckIn && styles.attendanceItemHighlight
                    ]}
                  >
                    <View style={styles.attendanceInfo}>
                      <Text style={styles.studentName}>
                        {attendance.student?.firstName || ''} {attendance.student?.lastName || ''}
                      </Text>
                      {attendance.checkInTime && (
                        <Text style={styles.checkInTime}>
                          Check-in: {new Date(attendance.checkInTime).toLocaleTimeString('fr-FR', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      )}
                    </View>
                    <View style={[
                      styles.statusBadge,
                      attendance.status === 'PRESENT' && styles.statusBadgePresent,
                      attendance.status === 'ABSENT' && styles.statusBadgeAbsent,
                    ]}>
                      {attendance.status === 'PRESENT' ? (
                        <CheckCircle2 size={16} color={Colors.success} strokeWidth={2.5} />
                      ) : (
                        <XCircle size={16} color={Colors.error} strokeWidth={2.5} />
                      )}
                      <Text style={[
                        styles.statusText,
                        attendance.status === 'PRESENT' && styles.statusTextPresent,
                        attendance.status === 'ABSENT' && styles.statusTextAbsent,
                      ]}>
                        {attendance.status === 'PRESENT' ? 'Présent' : 'Absent'}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
          )}
        </View>

        {/* Check Out Button */}
        <TouchableOpacity
          style={[styles.checkOutButton, checkingOut && styles.checkOutButtonDisabled]}
          onPress={handleCheckOut}
          disabled={checkingOut}
          activeOpacity={0.8}
        >
          {checkingOut ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <LogOut size={22} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.checkOutButtonText}>Terminer la session</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={{ height: Spacing.xxxl }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgSecondary,
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadows.medium,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: Spacing.sm,
  },
  methodSelector: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.borderLight,
    ...Shadows.small,
  },
  methodButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  methodButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  methodButtonTextActive: {
    color: Colors.white,
  },
  codeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.xl,
    marginBottom: Spacing.lg,
    alignItems: 'center',
    ...Shadows.medium,
  },
  qrContainer: {
    alignItems: 'center',
    gap: Spacing.lg,
  },
  qrCodeDisplay: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.borderLight,
  },
  pinContainer: {
    alignItems: 'center',
    gap: Spacing.md,
    width: '100%',
  },
  pinLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  pinDisplay: {
    fontSize: 48,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 8,
  },
  codeInstruction: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  expirationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.large,
    marginTop: Spacing.lg,
  },
  expirationText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  refreshButton: {
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
  },
  refreshButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.xxxl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.small,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
  attendanceList: {
    gap: Spacing.sm,
  },
  attendanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  attendanceItemHighlight: {
    backgroundColor: 'rgba(74, 222, 128, 0.15)',
    borderWidth: 2,
    borderColor: Colors.success,
  },
  attendanceInfo: {
    flex: 1,
    gap: 4,
  },
  studentName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  checkInTime: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.medium,
  },
  statusBadgePresent: {
    backgroundColor: 'rgba(74, 222, 128, 0.1)',
  },
  statusBadgeAbsent: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusTextPresent: {
    color: Colors.success,
  },
  statusTextAbsent: {
    color: Colors.error,
  },
  checkOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.error,
    borderRadius: BorderRadius.xlarge,
    paddingVertical: Spacing.md,
    ...Shadows.medium,
  },
  checkOutButtonDisabled: {
    opacity: 0.6,
  },
  checkOutButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
