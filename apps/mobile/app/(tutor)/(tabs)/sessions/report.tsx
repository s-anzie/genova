import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Save } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse, Performance } from '@/types/api';
import { getSubjectName } from '@/utils/session-helpers';

export default function SessionReportScreen() {
  const router = useRouter();
  const { sessionId } = useLocalSearchParams();
  const [session, setSession] = useState<SessionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [topicsCovered, setTopicsCovered] = useState('');
  const [homeworkAssigned, setHomeworkAssigned] = useState('');
  const [notes, setNotes] = useState('');
  const [studentPerformance, setStudentPerformance] = useState<{
    [studentId: string]: Performance;
  }>({});

  useEffect(() => {
    loadSession();
  }, [sessionId]);

  const loadSession = async () => {
    try {
      setLoading(true);
      const sessionResponse = await ApiClient.get<{ success: boolean; data: SessionResponse }>(`/sessions/${sessionId}`);
      setSession(sessionResponse.data);

      // Initialize performance ratings for all students
      if (sessionResponse.data.class?.members) {
        const initialPerformance: { [studentId: string]: Performance } = {};
        sessionResponse.data.class.members.forEach((member) => {
          initialPerformance[member.studentId] = {
            participation: 3,
            understanding: 3,
          };
        });
        setStudentPerformance(initialPerformance);
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      Alert.alert('Erreur', 'Impossible de charger la session');
    } finally {
      setLoading(false);
    }
  };

  const updatePerformance = (
    studentId: string,
    field: 'participation' | 'understanding',
    value: number
  ) => {
    setStudentPerformance((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value,
      },
    }));
  };

  const handleSubmit = async () => {
    if (!topicsCovered.trim()) {
      Alert.alert('Erreur', 'Veuillez indiquer les sujets abordés');
      return;
    }

    try {
      setSubmitting(true);
      await ApiClient.post(`/sessions/${sessionId}/report`, {
        topicsCovered,
        homeworkAssigned: homeworkAssigned.trim() || undefined,
        notes: notes.trim() || undefined,
        studentPerformance,
      });

      Alert.alert('Succès', 'Rapport soumis avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Erreur', error.message || 'Impossible de soumettre le rapport');
    } finally {
      setSubmitting(false);
    }
  };

  const renderRatingButtons = (
    studentId: string,
    field: 'participation' | 'understanding',
    currentValue: number
  ) => {
    return (
      <View style={styles.ratingButtons}>
        {[1, 2, 3, 4, 5].map((value) => (
          <TouchableOpacity
            key={value}
            style={[
              styles.ratingButton,
              currentValue === value && styles.ratingButtonActive,
            ]}
            onPress={() => updatePerformance(studentId, field, value)}
          >
            <Text
              style={[
                styles.ratingButtonText,
                currentValue === value && styles.ratingButtonTextActive,
              ]}
            >
              {value}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
        <Text style={styles.headerTitle}>Rapport de session</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
          <X size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sessionTitle}>{getSubjectName(session)}</Text>

        {/* Topics Covered */}
        <View style={styles.section}>
          <Text style={styles.label}>
            Sujets abordés <Text style={styles.required}>*</Text>
          </Text>
          <TextInput
            style={styles.textArea}
            value={topicsCovered}
            onChangeText={setTopicsCovered}
            placeholder="Décrivez les sujets et concepts abordés pendant la session..."
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Homework Assigned */}
        <View style={styles.section}>
          <Text style={styles.label}>Devoirs assignés</Text>
          <TextInput
            style={styles.textArea}
            value={homeworkAssigned}
            onChangeText={setHomeworkAssigned}
            placeholder="Décrivez les devoirs ou exercices à faire..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Student Performance */}
        {session.class?.members && session.class.members.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.label}>Performance des étudiants</Text>
            <Text style={styles.hint}>
              Évaluez chaque étudiant sur une échelle de 1 à 5
            </Text>

            {session.class.members.map((member) => (
              <View key={member.studentId} style={styles.studentCard}>
                <Text style={styles.studentName}>
                  {member.student.firstName} {member.student.lastName}
                </Text>

                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Participation</Text>
                  {renderRatingButtons(
                    member.studentId,
                    'participation',
                    studentPerformance[member.studentId]?.participation || 3
                  )}
                </View>

                <View style={styles.performanceItem}>
                  <Text style={styles.performanceLabel}>Compréhension</Text>
                  {renderRatingButtons(
                    member.studentId,
                    'understanding',
                    studentPerformance[member.studentId]?.understanding || 3
                  )}
                </View>
              </View>
            ))}
          </View>
        )}

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.label}>Notes additionnelles</Text>
          <TextInput
            style={styles.textArea}
            value={notes}
            onChangeText={setNotes}
            placeholder="Ajoutez des notes ou observations supplémentaires..."
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Save size={20} color={Colors.white} />
              <Text style={styles.submitButtonText}>Soumettre le rapport</Text>
            </>
          )}
        </TouchableOpacity>
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
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  closeButton: {
    padding: 4,
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
    gap: 24,
  },
  sessionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  section: {
    gap: 12,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  required: {
    color: Colors.error,
  },
  hint: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  textArea: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    minHeight: 100,
  },
  studentCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginTop: 12,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  performanceItem: {
    gap: 8,
  },
  performanceLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  ratingButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  ratingButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ratingButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  ratingButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ratingButtonTextActive: {
    color: Colors.white,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
