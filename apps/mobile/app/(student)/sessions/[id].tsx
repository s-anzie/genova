import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
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
  UserPlus,
  CheckCircle,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse, SessionReportResponse, AttendanceResponse, TutorSearchResult } from '@/types/api';
import { getSubjectName, getClassName } from '@/utils/session-helpers';
import { useAuth } from '@/contexts/auth-context';
import { eurToFcfa, formatHourlyRateAsFcfa, formatEurAsFcfa } from '@/utils/currency';
import { PageHeader } from '@/components/PageHeader';

export default function SessionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { user } = useAuth();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [report, setReport] = useState<SessionReportResponse | null>(null);
  const [attendance, setAttendance] = useState<AttendanceResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTutorModal, setShowTutorModal] = useState(false);

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
    router.push(`/(student)/(tabs)/sessions/check-in?sessionId=${id}` as any);
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
    // Open tutor selection modal
    setShowTutorModal(true);
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
    if (!session || !user) return false;
    
    // Check if current user has already checked in
    const userAttendance = attendance.find(att => att.studentId === user.id);
    if (userAttendance && userAttendance.status === 'PRESENT') {
      return false; // Already checked in
    }
    
    const now = new Date();
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    // Can check in from session start until 15 minutes after end
    const fifteenMinutesAfterEnd = new Date(end.getTime() + 15 * 60 * 1000);
    return session.status === 'CONFIRMED' && now >= start && now <= fifteenMinutesAfterEnd;
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
        <PageHeader title="Ma session" showBackButton variant="primary" />
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
          <Text style={styles.subjectText}>{getSubjectName(session)}</Text>
          {session.class && (
            <Text style={styles.className}>{getClassName(session)}</Text>
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
                    ? formatHourlyRateAsFcfa(Number(session.tutor.tutorProfile.hourlyRate))
                    : session.tutor?.hourlyRate 
                    ? formatHourlyRateAsFcfa(Number(session.tutor.hourlyRate))
                    : '0 FCFA/h'}
                </Text>
              </View>
              <ChevronRight size={20} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          ) : (
            <>
              <View style={styles.emptyCard}>
                <AlertCircle size={18} color={Colors.textTertiary} strokeWidth={2} />
                <Text style={styles.emptyText}>
                  Aucun tuteur n'a été assigné à cette session
                </Text>
              </View>
              {canCancel() && (
                <TouchableOpacity 
                  style={styles.requestTutorButton}
                  onPress={handleAssignTutor}
                  activeOpacity={0.7}
                >
                  <UserPlus size={18} color={Colors.primary} strokeWidth={2} />
                  <Text style={styles.requestTutorButtonText}>
                    Demander un tuteur
                  </Text>
                </TouchableOpacity>
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

        {/* Attendance Status for Current User */}
        {user && attendance.find(att => att.studentId === user.id && att.status === 'PRESENT') && (
          <View style={styles.section}>
            <View style={styles.attendanceConfirmedCard}>
              <CheckCircle size={24} color={Colors.success} strokeWidth={2.5} />
              <View style={styles.attendanceConfirmedInfo}>
                <Text style={styles.attendanceConfirmedTitle}>Présence confirmée</Text>
                <Text style={styles.attendanceConfirmedText}>
                  Vous avez confirmé votre présence à cette session
                </Text>
              </View>
            </View>
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
              {session.price ? formatEurAsFcfa(Number(session.price)) : '0 FCFA'}
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {canCheckIn() && (
            <TouchableOpacity style={styles.checkInButton} onPress={handleCheckIn}>
              <CheckCircle size={22} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.checkInButtonText}>Confirmer ma présence</Text>
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

      {/* Tutor Selection Modal */}
      <TutorSelectionModal
        visible={showTutorModal}
        sessionId={id as string}
        onClose={() => setShowTutorModal(false)}
        onRequestSent={() => {
          setShowTutorModal(false);
          loadSessionDetails();
        }}
      />
    </View>
  );
}

// Tutor Selection Modal Component
interface TutorSelectionModalProps {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
  onRequestSent: () => void;
}

function TutorSelectionModal({ visible, sessionId, onClose, onRequestSent }: TutorSelectionModalProps) {
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      loadAvailableTutors();
    }
  }, [visible, sessionId]);

  const loadAvailableTutors = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ success: boolean; data: TutorSearchResult[] }>(
        `/sessions/${sessionId}/available-tutors`
      );
      setTutors(response.data);
    } catch (error) {
      console.error('Failed to load available tutors:', error);
      Alert.alert('Erreur', 'Impossible de charger les tuteurs disponibles');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestTutor = async (tutorId: string) => {
    try {
      setRequesting(tutorId);
      await ApiClient.post(`/sessions/${sessionId}/request-tutor`, {
        tutorId,
        message: 'Je souhaiterais que vous soyez mon tuteur pour cette session.',
      });
      Alert.alert(
        'Demande envoyée',
        'Votre demande a été envoyée au tuteur. Vous serez notifié de sa réponse.',
        [{ text: 'OK', onPress: onRequestSent }]
      );
    } catch (error: any) {
      console.error('Failed to request tutor:', error);
      Alert.alert(
        'Erreur',
        error.message || 'Impossible d\'envoyer la demande au tuteur'
      );
    } finally {
      setRequesting(null);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tuteurs disponibles</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseIcon}>
              <X size={24} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View style={styles.modalLoadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.modalLoadingText}>Chargement des tuteurs...</Text>
            </View>
          ) : tutors.length === 0 ? (
            <View style={styles.modalEmptyContainer}>
              <AlertCircle size={48} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.modalEmptyTitle}>Aucun tuteur disponible</Text>
              <Text style={styles.modalEmptyText}>
                Il n'y a pas de tuteurs disponibles pour cette session pour le moment.
              </Text>
            </View>
          ) : (
            <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={false}>
              {tutors.map((tutor) => (
                <View key={tutor.id} style={styles.tutorModalCard}>
                  <View style={styles.tutorModalHeader}>
                    <View style={styles.tutorModalAvatar}>
                      <User size={24} color={Colors.white} strokeWidth={2} />
                    </View>
                    <View style={styles.tutorModalInfo}>
                      <Text style={styles.tutorModalName}>
                        {tutor.firstName} {tutor.lastName}
                      </Text>
                      <View style={styles.tutorModalMeta}>
                        <Text style={styles.tutorModalRate}>
                          {formatHourlyRateAsFcfa(tutor.hourlyRate)}
                        </Text>
                        {tutor.averageRating > 0 && (
                          <>
                            <Text style={styles.tutorModalDivider}>•</Text>
                            <Text style={styles.tutorModalRating}>
                              ⭐ {tutor.averageRating.toFixed(1)} ({tutor.totalReviews})
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  {tutor.bio && (
                    <Text style={styles.tutorModalBio} numberOfLines={2}>
                      {tutor.bio}
                    </Text>
                  )}

                  {tutor.subjects && tutor.subjects.length > 0 && (
                    <View style={styles.tutorModalSubjects}>
                      {tutor.subjects.slice(0, 3).map((subject, index) => (
                        <View key={index} style={styles.tutorModalSubjectBadge}>
                          <Text style={styles.tutorModalSubjectText}>{subject}</Text>
                        </View>
                      ))}
                      {tutor.subjects.length > 3 && (
                        <Text style={styles.tutorModalSubjectMore}>
                          +{tutor.subjects.length - 3}
                        </Text>
                      )}
                    </View>
                  )}

                  <TouchableOpacity
                    style={[
                      styles.tutorModalRequestButton,
                      requesting === tutor.userId && styles.tutorModalRequestButtonDisabled,
                    ]}
                    onPress={() => handleRequestTutor(tutor.userId)}
                    disabled={requesting !== null}
                    activeOpacity={0.7}
                  >
                    {requesting === tutor.userId ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <>
                        <UserPlus size={18} color={Colors.white} strokeWidth={2} />
                        <Text style={styles.tutorModalRequestButtonText}>Demander</Text>
                      </>
                    )}
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
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
  attendanceConfirmedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: Spacing.md,
    backgroundColor: Colors.success + '10',
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.success + '30',
  },
  attendanceConfirmedInfo: {
    flex: 1,
  },
  attendanceConfirmedTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.success,
    marginBottom: 2,
  },
  attendanceConfirmedText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
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
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.large,
    ...Shadows.medium,
  },
  checkInButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
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
  requestTutorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '15',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.primary,
    marginTop: Spacing.xs,
  },
  requestTutorButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.large,
    borderTopRightRadius: BorderRadius.large,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCream,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseIcon: {
    padding: 4,
  },
  modalScrollView: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  modalLoadingContainer: {
    paddingVertical: Spacing.xl * 2,
    alignItems: 'center',
    gap: Spacing.md,
  },
  modalLoadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
  modalEmptyContainer: {
    paddingVertical: Spacing.xl * 2,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  modalEmptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  modalEmptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  tutorModalCard: {
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  tutorModalHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  tutorModalAvatar: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorModalInfo: {
    flex: 1,
  },
  tutorModalName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tutorModalMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tutorModalRate: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  tutorModalDivider: {
    fontSize: 14,
    color: Colors.textTertiary,
  },
  tutorModalRating: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tutorModalBio: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  tutorModalSubjects: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  tutorModalSubjectBadge: {
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  tutorModalSubjectText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tutorModalSubjectMore: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tutorModalRequestButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.xs,
  },
  tutorModalRequestButtonDisabled: {
    opacity: 0.6,
  },
  tutorModalRequestButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  modalText: {
    fontSize: 15,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  modalCloseButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
});
