import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Clock,
  Calendar,
  Users,
  Plus,
  Edit2,
  Trash2,
  Eye,
  ArrowLeft,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/PageHeader';

interface TutorAssignment {
  id: string;
  tutorId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  recurrencePattern: 'ROUND_ROBIN' | 'WEEKLY' | 'CONSECUTIVE_DAYS' | 'MANUAL';
  recurrenceConfig: any;
  startDate: string | null;
  endDate: string | null;
  createdAt: string;
  tutor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

interface TimeSlot {
  id: string;
  classId: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isActive: boolean;
  tutorAssignments: TutorAssignment[];
}

interface SessionPreview {
  weekStart: string;
  sessionDate: string;
  tutorId: string | null;
  tutorName: string;
}

const DAYS_OF_WEEK = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

const PATTERN_LABELS: Record<string, string> = {
  ROUND_ROBIN: 'Rotation',
  WEEKLY: 'Hebdomadaire',
  CONSECUTIVE_DAYS: 'Jours consécutifs',
  MANUAL: 'Manuel',
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente',
  ACCEPTED: 'Accepté',
  DECLINED: 'Refusé',
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: '#F59E0B',
  ACCEPTED: '#10B981',
  DECLINED: '#EF4444',
};

export default function TimeSlotDetailScreen() {
  const router = useRouter();
  const { timeSlotId, classId } = useLocalSearchParams<{ timeSlotId: string; classId: string }>();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timeSlot, setTimeSlot] = useState<TimeSlot | null>(null);
  const [sessionPreview, setSessionPreview] = useState<SessionPreview[]>([]);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  const loadTimeSlotData = useCallback(async () => {
    if (!timeSlotId || !classId) {
      console.log('No time slot ID or class ID provided');
      setLoading(false);
      return;
    }

    try {
      const response = await apiClient.get(
        `/classes/${classId}/time-slots/${timeSlotId}`
      );
      
      setTimeSlot(response.data.timeSlot);
      setSessionPreview(response.data.sessionPreview || []);
    } catch (error: any) {
      console.error('Failed to load time slot:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails du créneau');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [timeSlotId]);

  useEffect(() => {
    if (timeSlotId && classId) {
      loadTimeSlotData();
    }
  }, [timeSlotId, classId, loadTimeSlotData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadTimeSlotData();
  };

  const handleAddAssignment = () => {
    if (!timeSlot) return;
    console.log('🔄 Navigating to search in assignment mode for time-slot:', timeSlot.id);
    router.push({
      pathname: '/(student)/(tabs)/search',
      params: {
        timeSlotId: timeSlot.id,
        classId: timeSlot.classId,
        subject: timeSlot.subject,
      },
    } as any);
  };

  const handleEditAssignment = (assignment: TutorAssignment) => {
    if (!timeSlot) return;
    router.push({
      pathname: '/(student)/classes/time-slots/edit-assignment',
      params: {
        classId: timeSlot.classId,
        timeSlotId: timeSlot.id,
        assignmentId: assignment.id,
        tutorId: assignment.tutorId,
        tutorName: `${assignment.tutor.firstName} ${assignment.tutor.lastName}`,
        recurrencePattern: assignment.recurrencePattern,
        recurrenceConfig: JSON.stringify(assignment.recurrenceConfig),
      },
    } as any);
  };

  const handleRemoveAssignment = (assignment: TutorAssignment) => {
    if (!timeSlot) return;

    Alert.alert(
      'Retirer l\'affectation',
      `Voulez-vous retirer ${assignment.tutor.firstName} ${assignment.tutor.lastName} de ce créneau ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(
                `/classes/${timeSlot.classId}/time-slots/${timeSlot.id}/assignments/${assignment.id}`
              );
              Alert.alert('Succès', 'Affectation retirée avec succès');
              loadTimeSlotData();
            } catch (error: any) {
              console.error('Failed to remove assignment:', error);
              Alert.alert('Erreur', error.message || 'Impossible de retirer l\'affectation');
            }
          },
        },
      ]
    );
  };

  const handleViewCalendar = () => {
    setShowCalendarModal(true);
  };

  if (loading || !timeSlot) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Créneau"
          showBackButton={true}
          centerTitle={true}
          showGradient={false}
          variant='primary'
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Créneau"
        showBackButton={true}
        centerTitle={true}
        showGradient={false}
        variant='primary'
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Time Slot Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.subjectHeader}>
            <Text style={styles.subjectTitle}>{timeSlot.subject}</Text>
            <View style={[styles.statusBadge, { backgroundColor: timeSlot.isActive ? '#10B981' : '#EF4444' }]}>
              <Text style={styles.statusBadgeText}>
                {timeSlot.isActive ? 'Actif' : 'Inactif'}
              </Text>
            </View>
          </View>

          <View style={styles.infoRow}>
            <Calendar size={18} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.infoText}>{DAYS_OF_WEEK[timeSlot.dayOfWeek]}</Text>
          </View>

          <View style={styles.infoRow}>
            <Clock size={18} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.infoText}>
              {timeSlot.startTime.substring(0, 5)} - {timeSlot.endTime.substring(0, 5)}
            </Text>
          </View>
        </View>

        {/* Tutor Assignments Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Tuteurs affectés ({timeSlot.tutorAssignments.length})
            </Text>
            <TouchableOpacity style={styles.addButton} onPress={handleAddAssignment}>
              <Plus size={18} color={Colors.primary} strokeWidth={2} />
              <Text style={styles.addButtonText}>Ajouter</Text>
            </TouchableOpacity>
          </View>

          {timeSlot.tutorAssignments.length === 0 ? (
            <View style={styles.emptyState}>
              <Users size={40} color={Colors.textTertiary} strokeWidth={1.5} />
              <Text style={styles.emptyText}>Aucun tuteur affecté</Text>
              <Text style={styles.emptySubtext}>
                Ajoutez des tuteurs pour gérer ce créneau
              </Text>
            </View>
          ) : (
            <View style={styles.assignmentsList}>
              {timeSlot.tutorAssignments.map((assignment) => (
                <View key={assignment.id} style={styles.assignmentCard}>
                  <View style={styles.assignmentHeader}>
                    <View style={styles.tutorAvatar}>
                      <Text style={styles.tutorAvatarText}>
                        {assignment.tutor.firstName[0]}{assignment.tutor.lastName[0]}
                      </Text>
                    </View>
                    <View style={styles.assignmentInfo}>
                      <Text style={styles.tutorName}>
                        {assignment.tutor.firstName} {assignment.tutor.lastName}
                      </Text>
                      <Text style={styles.tutorEmail}>{assignment.tutor.email}</Text>
                    </View>
                  </View>

                  <View style={styles.assignmentDetails}>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Statut:</Text>
                      <View
                        style={[
                          styles.statusChip,
                          { backgroundColor: `${STATUS_COLORS[assignment.status]}20` },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusChipText,
                            { color: STATUS_COLORS[assignment.status] },
                          ]}
                        >
                          {STATUS_LABELS[assignment.status]}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Récurrence:</Text>
                      <Text style={styles.detailValue}>
                        {PATTERN_LABELS[assignment.recurrencePattern]}
                      </Text>
                    </View>

                    {assignment.recurrencePattern === 'WEEKLY' && assignment.recurrenceConfig?.weeks && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Semaines:</Text>
                        <Text style={styles.detailValue}>
                          {assignment.recurrenceConfig.weeks.join(', ')}
                        </Text>
                      </View>
                    )}

                    {assignment.recurrencePattern === 'CONSECUTIVE_DAYS' && assignment.recurrenceConfig?.consecutiveDays && (
                      <View style={styles.detailRow}>
                        <Text style={styles.detailLabel}>Jours consécutifs:</Text>
                        <Text style={styles.detailValue}>
                          {assignment.recurrenceConfig.consecutiveDays}
                        </Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.assignmentActions}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleEditAssignment(assignment)}
                    >
                      <Edit2 size={16} color={Colors.primary} strokeWidth={2} />
                      <Text style={styles.actionButtonText}>Modifier</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, styles.deleteButton]}
                      onPress={() => handleRemoveAssignment(assignment)}
                    >
                      <Trash2 size={16} color="#EF4444" strokeWidth={2} />
                      <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
                        Retirer
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Calendar Preview Button */}
        {sessionPreview.length > 0 && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.calendarButton} onPress={handleViewCalendar}>
              <View style={styles.calendarButtonIcon}>
                <Eye size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.calendarButtonContent}>
                <Text style={styles.calendarButtonTitle}>Aperçu du calendrier</Text>
                <Text style={styles.calendarButtonSubtitle}>
                  Voir la distribution des tuteurs sur 4 semaines
                </Text>
              </View>
              <ArrowLeft
                size={20}
                color={Colors.textSecondary}
                strokeWidth={2}
                style={{ transform: [{ rotate: '180deg' }] }}
              />
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Calendar Preview Modal */}
      <Modal
        visible={showCalendarModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCalendarModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Aperçu du calendrier</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCalendarModal(false)}
            >
              <Text style={styles.modalCloseText}>Fermer</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {sessionPreview.map((session, index) => {
              const sessionDate = new Date(session.sessionDate);
              const weekStart = new Date(session.weekStart);
              
              return (
                <View key={index} style={styles.previewCard}>
                  <View style={styles.previewHeader}>
                    <Text style={styles.previewWeek}>
                      Semaine du {weekStart.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}
                    </Text>
                    <Text style={styles.previewDate}>
                      {sessionDate.toLocaleDateString('fr-FR', { 
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short'
                      })}
                    </Text>
                  </View>
                  <View style={styles.previewTutor}>
                    <Users size={16} color={Colors.textSecondary} strokeWidth={2} />
                    <Text style={[
                      styles.previewTutorName,
                      !session.tutorId && styles.previewUnassigned
                    ]}>
                      {session.tutorName}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: Spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: Colors.white,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  subjectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  subjectTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: Spacing.sm,
  },
  infoText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  section: {
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.small,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
  },
  emptySubtext: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },
  assignmentsList: {
    gap: Spacing.sm,
  },
  assignmentCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  assignmentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  tutorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tutorAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  assignmentInfo: {
    flex: 1,
  },
  tutorName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  tutorEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  assignmentDetails: {
    gap: 8,
    marginBottom: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  assignmentActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    paddingVertical: 10,
    borderRadius: 8,
  },
  actionButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButtonText: {
    color: '#EF4444',
  },
  calendarButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  calendarButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  calendarButtonContent: {
    flex: 1,
  },
  calendarButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  calendarButtonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: 60,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  modalCloseButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  modalCloseText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: Spacing.lg,
  },
  previewCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  previewHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  previewWeek: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  previewDate: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  previewTutor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  previewTutorName: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  previewUnassigned: {
    color: Colors.textTertiary,
    fontStyle: 'italic',
  },
});
