import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User,
  FileText,
  QrCode,
  Hash,
  X,
  CheckCircle,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse, SessionReportResponse, AttendanceResponse } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';

export default function SessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [report, setReport] = useState<SessionReportResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSessionDetails();
  }, [id]);

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      const sessionResponse = await ApiClient.get<{ success: boolean; data: SessionResponse }>(`/sessions/${id}`);
      setSession(sessionResponse.data);

      // Load report if session is completed
      if (sessionResponse.data.status === 'COMPLETED') {
        try {
          const reportResponse = await ApiClient.get<{ success: boolean; data: SessionReportResponse }>(
            `/sessions/${id}/report`
          );
          setReport(reportResponse.data);
        } catch (error) {
          // Report might not exist yet
          console.log('No report available');
        }
      }

      // Load attendance
      try {
        const attendanceResponse = await ApiClient.get<{ success: boolean; data: AttendanceResponse[] }>(
          `/sessions/${id}/attendance`
        );
        setAttendance(attendanceResponse.data);
      } catch (error) {
        console.log('No attendance data');
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la session');
    } finally {
      setLoading(false);
    }
  };

  const handleCheckIn = () => {
    router.push(`/sessions/check-in?sessionId=${id}`);
  };

  const handleSubmitReport = () => {
    router.push(`/sessions/report?sessionId=${id}`);
  };

  const handleCancelSession = async () => {
    Alert.alert(
      'Annuler la session',
      'Êtes-vous sûr de vouloir annuler cette session ?',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiClient.delete(`/sessions/${id}`);
              Alert.alert('Succès', 'Session annulée');
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible d\'annuler la session');
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Colors.accent2; // Gold for pending
      case 'CONFIRMED':
        return Colors.success;
      case 'COMPLETED':
        return Colors.primary;
      case 'CANCELLED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'En attente de confirmation';
      case 'CONFIRMED':
        return 'Confirmée';
      case 'COMPLETED':
        return 'Terminée';
      case 'CANCELLED':
        return 'Annulée';
      default:
        return status;
    }
  };

  const canCheckIn = () => {
    if (!session) return false;
    const now = new Date();
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    return session.status === 'CONFIRMED' && now >= start && now <= end;
  };

  const canSubmitReport = () => {
    if (!session || !user) return false;
    return (
      session.status === 'COMPLETED' &&
      user.role === 'tutor' &&
      session.tutorId === user.id &&
      !report
    );
  };

  const canCancel = () => {
    if (!session) return false;
    const now = new Date();
    const start = new Date(session.scheduledStart);
    const hoursUntilStart = (start.getTime() - now.getTime()) / (1000 * 60 * 60);
    return (
      (session.status === 'PENDING' || session.status === 'CONFIRMED') &&
      hoursUntilStart > 0
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session introuvable</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Détails de la session</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(session.status)}15` }]}>
          <Text style={[styles.statusBannerText, { color: getStatusColor(session.status) }]}>
            {getStatusLabel(session.status)}
          </Text>
        </View>

        {/* Subject */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Matière</Text>
          <Text style={styles.subjectText}>{session.subject}</Text>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date et heure</Text>
          <View style={styles.infoRow}>
            <Calendar size={20} color={Colors.primary} />
            <Text style={styles.infoText}>{formatDate(session.scheduledStart)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={20} color={Colors.primary} />
            <Text style={styles.infoText}>
              {formatTime(session.scheduledStart)} - {formatTime(session.scheduledEnd)}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lieu</Text>
          {session.location && (
            <View style={styles.infoRow}>
              <MapPin size={20} color={Colors.primary} />
              <Text style={styles.infoText}>{session.location}</Text>
            </View>
          )}
          {session.onlineMeetingLink && (
            <View style={styles.infoRow}>
              <Video size={20} color={Colors.primary} />
              <Text style={styles.infoText}>Session en ligne</Text>
            </View>
          )}
        </View>

        {/* Tutor */}
        {session.tutor && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Tuteur</Text>
            <View style={styles.tutorCard}>
              <User size={24} color={Colors.primary} />
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>
                  {session.tutor.user?.firstName} {session.tutor.user?.lastName}
                </Text>
                <Text style={styles.tutorRate}>
                  {session.tutor.hourlyRate.toFixed(2)} €/h
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Description */}
        {session.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{session.description}</Text>
          </View>
        )}

        {/* Attendance */}
        {attendance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Présences</Text>
            {attendance.map((att) => (
              <View key={att.id} style={styles.attendanceRow}>
                <Text style={styles.attendanceStudent}>
                  {att.student?.firstName} {att.student?.lastName}
                </Text>
                <View style={[
                  styles.attendanceBadge,
                  { backgroundColor: att.status === 'PRESENT' ? Colors.success + '15' : Colors.error + '15' }
                ]}>
                  <Text style={[
                    styles.attendanceStatus,
                    { color: att.status === 'PRESENT' ? Colors.success : Colors.error }
                  ]}>
                    {att.status === 'PRESENT' ? 'Présent' : 'Absent'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Session Report */}
        {report && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Rapport de session</Text>
            
            {report.topicsCovered && (
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Sujets abordés:</Text>
                <Text style={styles.reportText}>{report.topicsCovered}</Text>
              </View>
            )}

            {report.homeworkAssigned && (
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Devoirs assignés:</Text>
                <Text style={styles.reportText}>{report.homeworkAssigned}</Text>
              </View>
            )}

            {report.notes && (
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Notes:</Text>
                <Text style={styles.reportText}>{report.notes}</Text>
              </View>
            )}

            {user && report.studentPerformance[user.id] && (
              <View style={styles.reportItem}>
                <Text style={styles.reportLabel}>Votre performance:</Text>
                <View style={styles.performanceRow}>
                  <Text style={styles.performanceLabel}>Participation:</Text>
                  <Text style={styles.performanceValue}>
                    {report.studentPerformance[user.id].participation}/5
                  </Text>
                </View>
                <View style={styles.performanceRow}>
                  <Text style={styles.performanceLabel}>Compréhension:</Text>
                  <Text style={styles.performanceValue}>
                    {report.studentPerformance[user.id].understanding}/5
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Price */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Prix</Text>
          <Text style={styles.priceText}>{session.price.toFixed(2)} €</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canCheckIn() && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleCheckIn}>
              <QrCode size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Check-in</Text>
            </TouchableOpacity>
          )}

          {canSubmitReport() && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitReport}>
              <FileText size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Soumettre un rapport</Text>
            </TouchableOpacity>
          )}

          {canCancel() && (
            <TouchableOpacity style={styles.dangerButton} onPress={handleCancelSession}>
              <X size={20} color={Colors.white} />
              <Text style={styles.dangerButtonText}>Annuler la session</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 20,
  },
  statusBanner: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subjectText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoText: {
    fontSize: 16,
    color: Colors.textPrimary,
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    backgroundColor: Colors.bgCream,
    borderRadius: 8,
  },
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tutorRate: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  descriptionText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  attendanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  attendanceStudent: {
    fontSize: 15,
    color: Colors.textPrimary,
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  attendanceStatus: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportItem: {
    gap: 8,
  },
  reportLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  reportText: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  performanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  performanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    paddingVertical: 16,
    borderRadius: 12,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
