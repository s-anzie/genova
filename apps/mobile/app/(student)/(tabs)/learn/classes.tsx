import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Plus, Users, BookOpen, Calendar } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { formatEducationLevel } from '@/utils/education-level-parser';

interface ClassItem {
  id: string;
  name: string;
  description: string | null;
  educationLevel: any;
  subjects: string[];
  _count: {
    students: number;
    timeSlots: number;
  };
}

export default function ClassesTab() {
  const router = useRouter();
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
      console.error('Error loading classes:', error);
      Alert.alert('Erreur', 'Impossible de charger les classes');
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
              {classItem._count.students} élève{classItem._count.students !== 1 ? 's' : ''}
            </Text>
          </View>
          <View style={styles.statItem}>
            <Calendar size={16} color={Colors.textSecondary} />
            <Text style={styles.statText}>
              {classItem._count.timeSlots} créneau{classItem._count.timeSlots !== 1 ? 'x' : ''}
            </Text>
          </View>
        </View>

        {classItem.subjects.length > 0 && (
          <View style={styles.subjectsContainer}>
            {classItem.subjects.slice(0, 3).map((subject, index) => (
              <View key={index} style={styles.subjectTag}>
                <Text style={styles.subjectText}>{subject}</Text>
              </View>
            ))}
            {classItem.subjects.length > 3 && (
              <Text style={styles.moreSubjects}>+{classItem.subjects.length - 3}</Text>
            )}
          </View>
        )}

        <View style={styles.classFooter}>
          <Text style={styles.educationLevel}>
            {formatEducationLevel(classItem.educationLevel)}
          </Text>
        </View>
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
