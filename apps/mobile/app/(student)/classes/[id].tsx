import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  BookOpen,
  MapPin,
  Globe,
  UserPlus,
  Trash2,
  Calendar,
  Edit,
  ChevronRight,
} from 'lucide-react-native';
import { Colors, Spacing } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { ClassResponse } from '@/types/api';
import { useAuth } from '@/contexts/auth-context';
import { PageHeader } from '@/components/PageHeader';

export default function ClassDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [classData, setClassData] = useState<ClassResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadClassData = useCallback(async () => {
    if (!id) {
      console.log('No class ID provided');
      setLoading(false);
      return;
    }
    
    try {
      const response = await apiClient.get(`/classes/${id}`);
      setClassData(response.data);
    } catch (error) {
      console.error('Failed to load class:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la classe');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadClassData();
    }
  }, [id, loadClassData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadClassData();
  };

  const handleInviteMembers = () => {
    router.push(`/(student)/classes/invite?id=${id}`);
  };

  const handleEditClass = () => {
    router.push(`/(student)/classes/edit?id=${id}`);
  };

  const handleViewSchedule = () => {
    router.push(`/(student)/classes/schedule?id=${id}`);
  };

  const handleRemoveMember = (studentId: string, studentName: string) => {
    Alert.alert(
      'Retirer le membre',
      `Êtes-vous sûr de vouloir retirer ${studentName} de la classe ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Retirer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}/members/${studentId}`);
              Alert.alert('Succès', 'Membre retiré avec succès');
              loadClassData();
            } catch (error: any) {
              console.error('Failed to remove member:', error);
              Alert.alert('Erreur', error.message || 'Impossible de retirer le membre');
            }
          },
        },
      ]
    );
  };

  const handleLeaveClass = () => {
    Alert.alert(
      'Quitter la classe',
      'Êtes-vous sûr de vouloir quitter cette classe ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Quitter',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}/members/${user?.id}`);
              Alert.alert('Succès', 'Vous avez quitté la classe', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Failed to leave class:', error);
              Alert.alert('Erreur', error.message || 'Impossible de quitter la classe');
            }
          },
        },
      ]
    );
  };

  const handleDeleteClass = () => {
    Alert.alert(
      'Supprimer la classe',
      'Êtes-vous sûr de vouloir supprimer cette classe ? Cette action est irréversible.',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}`);
              Alert.alert('Succès', 'Classe supprimée avec succès', [
                { text: 'OK', onPress: () => router.back() },
              ]);
            } catch (error: any) {
              console.error('Failed to delete class:', error);
              Alert.alert('Erreur', error.message || 'Impossible de supprimer la classe');
            }
          },
        },
      ]
    );
  };

  if (loading || !classData) {
    return (
      <View style={styles.container}>
        <PageHeader 
          title="Détails"
          variant='primary'
          showBackButton={true}
          centerTitle={true}
          showGradient={false}
        />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </View>
    );
  }

  const isCreator = classData.createdBy === user?.id;

  // Get education level and stream names from relations
  const levelName = classData.educationLevelRel?.name || 'Non spécifié';
  const streamName = classData.educationStreamRel?.name;

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Détails"
        showBackButton={true}
        centerTitle={true}
        showGradient={false}
        variant='primary'
        rightElement={
          isCreator ? (
            <TouchableOpacity style={styles.editButton} onPress={handleEditClass}>
              <Edit size={22} color={Colors.white} strokeWidth={2} />
            </TouchableOpacity>
          ) : undefined
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Main Info Card */}
        <View style={styles.infoCard}>
          {/* Class Name & Description */}
          <View style={styles.headerSection}>
            <Text style={styles.className}>{classData.name}</Text>
            {classData.description && (
              <Text style={styles.classDescription}>{classData.description}</Text>
            )}
          </View>

          {/* Education & Meeting Info */}
          <View style={styles.detailsSection}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Niveau</Text>
              <Text style={styles.detailValue}>{levelName}</Text>
            </View>
            {streamName && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Filière</Text>
                <Text style={styles.detailValue}>{streamName}</Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Type</Text>
              <View style={styles.detailValueRow}>
                {classData.meetingType === 'ONLINE' ? (
                  <Globe size={16} color={Colors.textSecondary} strokeWidth={2} />
                ) : (
                  <MapPin size={16} color={Colors.textSecondary} strokeWidth={2} />
                )}
                <Text style={styles.detailValue}>
                  {classData.meetingType === 'ONLINE' ? 'En ligne' : 'Présentiel'}
                </Text>
              </View>
            </View>
            {classData.meetingLocation && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Lieu</Text>
                <Text style={styles.detailValue}>{classData.meetingLocation}</Text>
              </View>
            )}
          </View>

          {/* Subjects */}
          {classData.classSubjects && classData.classSubjects.length > 0 && (
            <View style={styles.subjectsSection}>
              <Text style={styles.sectionTitle}>
                Matières ({classData.classSubjects.length})
              </Text>
              <View style={styles.subjectsGrid}>
                {classData.classSubjects.map((cs: any) => {
                  const subjectData = cs.levelSubject || cs.streamSubject;
                  const subject = subjectData?.subject;
                  const isCore = subjectData?.isCore;
                  const coefficient = subjectData?.coefficient;
                  const hoursPerWeek = subjectData?.hoursPerWeek;
                  
                  return (
                    <View key={cs.id} style={styles.subjectItem}>
                      <View style={styles.subjectMain}>
                        {subject?.icon && (
                          <Text style={styles.subjectIcon}>{subject.icon}</Text>
                        )}
                        <Text style={styles.subjectName}>{subject?.name || 'Matière'}</Text>
                      </View>
                      <View style={styles.subjectInfo}>
                        {coefficient && (
                          <Text style={styles.subjectInfoText}>Coef. {coefficient}</Text>
                        )}
                        {hoursPerWeek && (
                          <Text style={styles.subjectInfoText}>{hoursPerWeek}h</Text>
                        )}
                        {isCore && (
                          <View style={styles.coreIndicator} />
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>

        {/* Schedule Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.scheduleButton} onPress={handleViewSchedule}>
            <View style={styles.scheduleButtonIcon}>
              <Calendar size={20} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.scheduleButtonContent}>
              <Text style={styles.scheduleButtonTitle}>Emploi du temps</Text>
              <Text style={styles.scheduleButtonSubtitle}>
                Voir les créneaux planifiés
              </Text>
            </View>
            <ChevronRight
              size={20}
              color={Colors.textSecondary}
              strokeWidth={2}
            />
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              Membres ({classData._count?.members || 0})
            </Text>
            {isCreator && (
              <TouchableOpacity style={styles.inviteButton} onPress={handleInviteMembers}>
                <UserPlus size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.inviteButtonText}>Inviter</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.membersList}>
            {classData.members?.map((member) => (
              <View key={member.id} style={styles.memberCard}>
                <View style={styles.memberAvatar}>
                  <Text style={styles.memberAvatarText}>
                    {member.student.firstName[0]}{member.student.lastName[0]}
                  </Text>
                </View>
                <View style={styles.memberInfo}>
                  <Text style={styles.memberName}>
                    {member.student.firstName} {member.student.lastName}
                  </Text>
                  <Text style={styles.memberEmail}>{member.student.email}</Text>
                </View>
                {member.studentId === classData.createdBy && (
                  <View style={styles.adminBadge}>
                    <Text style={styles.adminBadgeText}>Admin</Text>
                  </View>
                )}
                {isCreator && member.studentId !== classData.createdBy && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() =>
                      handleRemoveMember(
                        member.studentId,
                        `${member.student.firstName} ${member.student.lastName}`
                      )
                    }
                  >
                    <Trash2 size={18} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          {!isCreator && (
            <TouchableOpacity style={styles.leaveButton} onPress={handleLeaveClass}>
              <Text style={styles.leaveButtonText}>Quitter la classe</Text>
            </TouchableOpacity>
          )}
          {isCreator && (
            <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteClass}>
              <Text style={styles.deleteButtonText}>Supprimer la classe</Text>
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
  editButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  infoCard: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.lg,
    marginTop: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  headerSection: {
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  className: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  classDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  detailsSection: {
    paddingVertical: 16,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subjectsSection: {
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subjectsGrid: {
    gap: 8,
  },
  subjectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  subjectMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  subjectIcon: {
    fontSize: 18,
  },
  subjectName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subjectInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  subjectInfoText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  coreIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  section: {
    marginBottom: 20,
    marginHorizontal: Spacing.lg,
  },
  scheduleButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  scheduleButtonIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scheduleButtonContent: {
    flex: 1,
  },
  scheduleButtonTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  scheduleButtonSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  inviteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  inviteButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  membersList: {
    gap: 10,
  },
  memberCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  memberAvatar: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  memberAvatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  memberEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  adminBadge: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  adminBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  removeButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsSection: {
    gap: 12,
    marginTop: 20,
    marginHorizontal: Spacing.lg,
  },
  leaveButton: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
  },
  leaveButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#EF4444',
  },
  deleteButton: {
    backgroundColor: '#EF4444',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  deleteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
});
