import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User,
  FileText,
  QrCode,
  X,
  BookOpen,
  AlertCircle,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse, SessionReportResponse, AttendanceResponse } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/PageHeader';

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

  // Reload when screen comes back into focus
  useFocusEffect(
    React.useCallback(() => {
      loadSessionDetails();
    }, [id])
  );

  const loadSessionDetails = async () => {
    try {
      setLoading(true);
      const sessionResponse = await ApiClient.get<{ success: boolean; data: SessionResponse }>(`/sessions/${id}`);
      setSession(sessionResponse.data);
      
      // Debug: log tutor data
      if (sessionResponse.data.tutor) {
        console.log('Tutor data:', JSON.stringify(sessionResponse.data.tutor, null, 2));
      }

      // Load report if session is completed
      if (sessionResponse.data.status === 'COMPLETED') {
        try {
          const reportResponse = await ApiClient.get<{ success: boolean; data: SessionReportResponse }>(
            `/sessions/${id}/report`
          );
          setReport(reportResponse.data);
        } catch (error) {
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

  const handleAssignTutor = () => {
    // Navigate to search page in assign mode
    router.push(`/(student)/(tabs)/search?sessionId=${id}&subject=${encodeURIComponent(session?.subject || '')}`);
  };

  const handleViewTutorProfile = () => {
    if (session?.tutorId) {
      router.push(`/tutors/${session.tutorId}` as any);
    }
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
        return Colors.accent2;
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

  const getStatusLabel = (status: string, hasTutor: boolean) => {
    if (!hasTutor) {
      // Check if session is past and cannot be modified
      const now = new Date();
      const endTime = new Date(session?.scheduledEnd || now);
      const isPast = endTime < now;
      
      if (isPast) {
        return 'Non assignée';
      }
      return 'Non assignée';
    }
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
      <View style={styles.container}>
        <PageHeader title="Détails de la session" showBackButton variant="primary" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <PageHeader title="Détails de la session" showBackButton variant="primary" />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session introuvable</Text>
        </View>
      </View>
    );
  }

  const hasTutor = !!session.tutor && !!session.tutor.firstName;

  return (
    <View style={styles.container}>
      <PageHeader title="Détails de la session" showBackButton variant="primary" />

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Status Banner */}
        <View style={[styles.statusBanner, { backgroundColor: `${getStatusColor(session.status)}15` }]}>
          <Text style={[styles.statusBannerText, { color: getStatusColor(session.status) }]}>
            {getStatusLabel(session.status, hasTutor)}
          </Text>
        </View>

        {/* Subject & Class */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <BookOpen size={18} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.sectionTitle}>Matière</Text>
          </View>
          <Text style={styles.subjectText}>{session.subject}</Text>
          {session.class && (
            <Text style={styles.className}>{session.class.name}</Text>
          )}
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Date et heure</Text>
          <View style={styles.infoRow}>
            <Calendar size={18} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.infoText}>{formatDate(session.scheduledStart)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Clock size={18} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.infoText}>
              {formatTime(session.scheduledStart)} - {formatTime(session.scheduledEnd)}
            </Text>
          </View>
        </View>

        {/* Location */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Lieu</Text>
          {session.onlineMeetingLink ? (
            <View style={styles.locationCard}>
              <Video size={20} color={Colors.primary} strokeWidth={2} />
              <View style={styles.locationInfo}>
                <Text style={styles.locationTitle}>Session en ligne</Text>
                {session.status === 'CONFIRMED' && (
                  <TouchableOpacity>
                    <Text style={styles.linkText}>Rejoindre la visio</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          ) : session.class?.meetingLocation ? (
            <View style={styles.locationCard}>
              <MapPin size={20} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.locationText}>{session.class?.meetingLocation}</Text>
            </View>
          ) : (
            <View style={styles.emptyCard}>
              <AlertCircle size={18} color={Colors.warning} strokeWidth={2} />
              <Text style={styles.emptyText}>Lieu non défini</Text>
            </View>
          )}
        </View>

        {/* Tutor Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Tuteur</Text>
          {hasTutor && session.tutor?.firstName ? (
            <TouchableOpacity 
              style={styles.tutorCard}
              onPress={handleViewTutorProfile}
              activeOpacity={0.7}
            >
              <View style={styles.tutorAvatar}>
                <User size={20} color={Colors.white} strokeWidth={2} />
              </View>
              <View style={styles.tutorInfo}>
                <Text style={styles.tutorName}>
                  {session.tutor.firstName} {session.tutor.lastName}
                </Text>
                <Text style={styles.tutorRate}>
                  {session.tutor?.tutorProfile?.hourlyRate 
                    ? `${Math.round(Number(session.tutor.tutorProfile.hourlyRate))} €/h` 
                    : session.tutor?.hourlyRate 
                    ? `${Math.round(Number(session.tutor.hourlyRate) )} €/h`
                    : '0 FCFA/h'}
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <>
              {canCancel() ? (
                <TouchableOpacity 
                  style={styles.emptyCard}
                  onPress={handleAssignTutor}
                  activeOpacity={0.7}
                >
                  <AlertCircle size={18} color={Colors.accent2} strokeWidth={2} />
                  <Text style={[styles.emptyText, { color: Colors.accent2 }]}>
                    Aucun tuteur assigné - Appuyez pour en choisir un
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.emptyCard}>
                  <AlertCircle size={18} color={Colors.textTertiary} strokeWidth={2} />
                  <Text style={styles.emptyText}>
                    Aucun tuteur n'a été assigné à cette session
                  </Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Description */}
        {session.description && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.descriptionText}>{session.description}</Text>
          </View>
        )}

        {/* Attendance */}
        {attendance.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Présences</Text>
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
            <Text style={styles.sectionLabel}>Rapport de session</Text>
            
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
        {hasTutor && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Prix</Text>
            <Text style={styles.priceText}>
              {session.price ? Math.round(Number(session.price) * 650).toLocaleString('fr-FR') : '0'} FCFA
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canCheckIn() && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleCheckIn}>
              <QrCode size={20} color={Colors.white} strokeWidth={2} />
              <Text style={styles.primaryButtonText}>Check-in</Text>
            </TouchableOpacity>
          )}

          {canSubmitReport() && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleSubmitReport}>
              <FileText size={20} color={Colors.white} strokeWidth={2} />
              <Text style={styles.primaryButtonText}>Soumettre un rapport</Text>
            </TouchableOpacity>
          )}

          {canCancel() && (
            <TouchableOpacity style={styles.dangerButton} onPress={handleCancelSession}>
              <X size={20} color={Colors.white} strokeWidth={2} />
              <Text style={styles.dangerButtonText}>Annuler la session</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
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
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  statusBanner: {
    padding: Spacing.md,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 14,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  className: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 4,
  },
  subjectText: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.sm,
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.medium,
  },
  locationInfo: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  locationText: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  linkText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  emptyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: Spacing.sm,
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.warning,
    borderStyle: 'dashed',
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
    flex: 1,
  },
  tutorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.sm,
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.medium,
  },
  tutorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  tutorRate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
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
    fontWeight: '500',
  },
  attendanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  attendanceStatus: {
    fontSize: 12,
    fontWeight: '700',
  },
  reportItem: {
    gap: 6,
  },
  reportLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  reportText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
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
    fontWeight: '500',
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  priceText: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  actionsContainer: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.error,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.large,
    ...Shadows.small,
  },
  dangerButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
