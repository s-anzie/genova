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
import { useRouter, useLocalSearchParams } from 'expo-router';
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Video, 
  User,
  Users,
  FileText,
  QrCode,
  X,
  CheckCircle,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse, SessionReportResponse, AttendanceResponse } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/PageHeader';
import { formatHourlyRateAsFcfa, formatEurAsFcfa } from '@/utils/currency';

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
      'Se désassigner de la session',
      'Êtes-vous sûr de vouloir vous désassigner de cette session ? Les étudiants seront notifiés et la session sera remise en attente d\'un nouveau tuteur.',
      [
        { text: 'Non', style: 'cancel' },
        {
          text: 'Oui, me désassigner',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiClient.post(`/sessions/${id}/unassign-tutor`, {
                reason: 'Tuteur non disponible'
              });
              Alert.alert('Succès', 'Vous avez été désassigné de la session. Les étudiants ont été notifiés.');
              router.back();
            } catch (error) {
              Alert.alert('Erreur', 'Impossible de se désassigner de la session');
            }
          },
        },
      ]
    );
  };

  const calculateTutorRevenue = () => {
    if (!session) return 0;
    
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    const durationHours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    const studentCount = session.class?._count?.members || 1;
    
    // Try to get hourlyRate from different possible locations
    const hourlyRate = Number(
      session.tutor?.hourlyRate || 
      session.tutor?.tutorProfile?.hourlyRate || 
      0
    );
    
    console.log('Revenue calculation:', {
      hourlyRate,
      studentCount,
      durationHours,
      total: hourlyRate * studentCount * durationHours
    });
    
    return hourlyRate * studentCount * durationHours;
  };

  const getDuration = () => {
    if (!session) return '';
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h${minutes}`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
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

  const canManageAttendance = () => {
    if (!session) return false;
    const now = new Date();
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    // Can manage attendance from 15 min before start until 30 minutes after end
    const fifteenMinutesBeforeStart = new Date(start.getTime() - 15 * 60 * 1000);
    const thirtyMinutesAfterEnd = new Date(end.getTime() + 30 * 60 * 1000);
    return session.status === 'CONFIRMED' && now >= fifteenMinutesBeforeStart && now <= thirtyMinutesAfterEnd;
  };

  const handleManageAttendance = () => {
    router.push(`/(tutor)/(tabs)/sessions/attendance?sessionId=${id}`);
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
        <PageHeader 
          title="Détails de la session" 
          showBackButton
          variant="primary"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!session) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Détails de la session" 
          showBackButton
          variant="primary"
          centerTitle
        />
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Session introuvable</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Ma session" 
        subtitle={session.subject}
        showBackButton
        variant="primary"
      />
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
          <Text style={styles.durationText}>Durée: {getDuration()}</Text>
        </View>

        {/* Class Info */}
        {session.class && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Classe</Text>
            <View style={styles.classHeader}>
              <Text style={styles.className}>{session.class.name}</Text>
              <View style={styles.studentCountBadge}>
                <Users size={14} color={Colors.primary} />
                <Text style={styles.studentCountText}>
                  {session.class._count?.members || 0} étudiant{(session.class._count?.members || 0) > 1 ? 's' : ''}
                </Text>
              </View>
            </View>
            
            {/* Class Location */}
            {session.class.meetingLocation && (
              <View style={styles.infoRow}>
                <MapPin size={20} color={Colors.primary} />
                <Text style={styles.infoText}>{session.class.meetingLocation}</Text>
              </View>
            )}
            
            {/* Students List */}
            {session.class.members && session.class.members.length > 0 && (
              <View style={styles.studentsSection}>
                <Text style={styles.studentsLabel}>Étudiants inscrits:</Text>
                {session.class.members.map((member, index) => (
                  <View key={member.id || `student-${index}`} style={styles.studentRow}>
                    <View style={styles.studentAvatar}>
                      <User size={16} color={Colors.primary} />
                    </View>
                    <Text style={styles.studentName}>
                      {member.student.firstName} {member.student.lastName}
                    </Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Location - Only show if online or if no class location */}
        {(session.onlineMeetingLink || (!session.class?.meetingLocation && session.location)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Lieu</Text>
            {session.location && !session.class?.meetingLocation && (
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

        {/* Revenue */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Revenu estimé</Text>
          <View style={styles.revenueBreakdown}>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Taux horaire:</Text>
              <Text style={styles.revenueValue}>
                {formatHourlyRateAsFcfa(Number(session.tutor?.hourlyRate || session.tutor?.tutorProfile?.hourlyRate || 0))}
              </Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Nombre d'étudiants:</Text>
              <Text style={styles.revenueValue}>{session.class?._count?.members || 1}</Text>
            </View>
            <View style={styles.revenueRow}>
              <Text style={styles.revenueLabel}>Durée:</Text>
              <Text style={styles.revenueValue}>{getDuration()}</Text>
            </View>
            <View style={styles.revenueDivider} />
            <View style={styles.revenueRow}>
              <Text style={styles.revenueTotalLabel}>Total:</Text>
              <Text style={styles.revenueTotalValue}>{formatEurAsFcfa(calculateTutorRevenue())}</Text>
            </View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canManageAttendance() && (
            <TouchableOpacity style={styles.primaryButton} onPress={handleManageAttendance}>
              <CheckCircle size={20} color={Colors.white} />
              <Text style={styles.primaryButtonText}>Gérer les présences</Text>
            </TouchableOpacity>
          )}

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
              <Text style={styles.dangerButtonText}>Me désassigner</Text>
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
    gap: Spacing.md,
  },
  statusBanner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
  },
  statusBannerText: {
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
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
  durationText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
    marginTop: 4,
  },
  classHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  className: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  studentCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    backgroundColor: Colors.primary + '15',
    borderRadius: 8,
  },
  studentCountText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  studentsSection: {
    marginTop: 12,
    gap: 8,
  },
  studentsLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: Colors.bgCream,
    borderRadius: 8,
  },
  studentAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentName: {
    fontSize: 15,
    fontWeight: '500',
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
  revenueBreakdown: {
    gap: 8,
  },
  revenueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  revenueLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  revenueValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  revenueDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  revenueTotalLabel: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  revenueTotalValue: {
    fontSize: 20,
    color: Colors.primary,
    fontWeight: '800',
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
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.large,
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
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.large,
  },
  dangerButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
