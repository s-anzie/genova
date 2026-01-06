import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Users, BookOpen, Calendar } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { StyledModal } from '@/components/ui/StyledModal';
import { useModal } from '@/hooks/useModal';

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  educationLevelRel?: {
    name: string;
  } | null;
  educationStreamRel?: {
    name: string;
  } | null;
  classSubjects?: Array<{
    levelSubject: {
      subject: {
        name: string;
        icon?: string;
      };
    };
  }>;
  _count: {
    members: number;
    timeSlots: number;
  };
}

export default function ClassesTab() {
  const router = useRouter();
  const { modalState, hideModal, showError } = useModal();
  const [loading, setLoading] = useState(true);
  const [classes, setClasses] = useState<ClassItem[]>([]);

  useEffect(() => {
    loadClasses();
  }, []);

  const loadClasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/classes');
      setClasses(response.data);
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Impossible de charger les classes');
      showError('Erreur', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = () => {
    router.push('/(student)/classes/create');
  };

  const handleClassPress = (classId: string) => {
    router.push(`/(student)/classes/${classId}` as any);
  };

  const renderClassCard = (classItem: ClassItem) => {
    // Format education level display
    let educationDisplay = '';
    if (classItem.educationLevelRel) {
      educationDisplay = classItem.educationLevelRel.name;
      if (classItem.educationStreamRel) {
        educationDisplay += ` - ${classItem.educationStreamRel.name}`;
      }
    }

    return (
      <TouchableOpacity
        key={classItem.id}
        style={styles.classCard}
        onPress={() => handleClassPress(classItem.id)}
        activeOpacity={0.7}
      >
        <View style={styles.classHeader}>
          <View style={styles.classIcon}>
            <BookOpen size={24} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.classInfo}>
            <Text style={styles.className}>{classItem.name}</Text>
            {classItem.description && (
              <Text style={styles.classDescription} numberOfLines={2}>
                {classItem.description}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.classStats}>
          <View style={styles.statItem}>
            <Users size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>
              {classItem._count.members} élève{classItem._count.members !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>
              {classItem._count.timeSlots} créneau{classItem._count.timeSlots !== 1 ? 'x' : ''}
            </Text>
          </View>
        </View>

        {classItem.classSubjects && classItem.classSubjects.length > 0 && (
          <View style={styles.subjectsContainer}>
            {classItem.classSubjects.slice(0, 3).map((classSubject, index) => (
              <View key={index} style={styles.subjectTag}>
                <Text style={styles.subjectText}>
                  {classSubject.levelSubject.subject.icon && `${classSubject.levelSubject.subject.icon} `}
                  {classSubject.levelSubject.subject.name}
                </Text>
              </View>
            ))}
            {classItem.classSubjects.length > 3 && (
              <Text style={styles.moreSubjects}>+{classItem.classSubjects.length - 3}</Text>
            )}
          </View>
        )}

        {educationDisplay && (
          <View style={styles.classFooter}>
            <Text style={styles.educationLevel}>{educationDisplay}</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {classes.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <BookOpen size={48} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyText}>Aucune classe</Text>
            <Text style={styles.emptySubtext}>
              Créez votre première classe pour commencer à organiser vos cours
            </Text>
            <TouchableOpacity style={styles.createButtonLarge} onPress={handleCreateClass}>
              <Plus size={20} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.createButtonText}>Créer une classe</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.classList}>
            {classes.map(renderClassCard)}
          </View>
        )}
      </ScrollView>

      {/* Floating Action Button */}
      {classes.length > 0 && (
        <TouchableOpacity 
          style={styles.fab} 
          onPress={handleCreateClass}
          activeOpacity={0.8}
        >
          <Plus size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      )}

      <StyledModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButton={modalState.primaryButton}
        secondaryButton={modalState.secondaryButton}
        onClose={hideModal}
      />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 80, // Space for FAB
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  createButtonLarge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: BorderRadius.large,
    ...Shadows.medium,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  classList: {
    gap: Spacing.md,
  },
  classCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  classHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  classIcon: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classInfo: {
    flex: 1,
    gap: 3,
  },
  className: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  classDescription: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  classStats: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  subjectTag: {
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.small,
  },
  subjectText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  moreSubjects: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  classFooter: {
    paddingTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  educationLevel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.large,
    elevation: 8,
  },
});
