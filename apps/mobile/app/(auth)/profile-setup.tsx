import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { API_ENDPOINTS } from '@/config/api';

const EDUCATION_LEVELS = [
  { value: 'elementary', label: 'Elementary School' },
  { value: 'middle_school', label: 'Middle School' },
  { value: 'high_school', label: 'High School' },
  { value: 'university', label: 'University' },
  { value: 'graduate', label: 'Graduate' },
];

const SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English',
  'French',
  'Spanish',
  'History',
  'Geography',
  'Computer Science',
  'Economics',
  'Philosophy',
];

export default function ProfileSetupScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Student profile data
  const [studentData, setStudentData] = useState({
    educationLevel: '',
    schoolName: '',
    preferredSubjects: [] as string[],
    learningGoals: '',
  });

  // Tutor profile data
  const [tutorData, setTutorData] = useState({
    bio: '',
    experienceYears: '',
    hourlyRate: '',
    subjects: [] as string[],
    educationLevels: [] as string[],
    teachingMode: 'both' as 'in-person' | 'online' | 'both',
  });

  const isStudent = user?.role === 'student';

  const toggleSubject = (subject: string) => {
    if (isStudent) {
      const subjects = studentData.preferredSubjects.includes(subject)
        ? studentData.preferredSubjects.filter((s) => s !== subject)
        : [...studentData.preferredSubjects, subject];
      setStudentData({ ...studentData, preferredSubjects: subjects });
    } else {
      const subjects = tutorData.subjects.includes(subject)
        ? tutorData.subjects.filter((s) => s !== subject)
        : [...tutorData.subjects, subject];
      setTutorData({ ...tutorData, subjects });
    }
  };

  const toggleEducationLevel = (level: string) => {
    const levels = tutorData.educationLevels.includes(level)
      ? tutorData.educationLevels.filter((l) => l !== level)
      : [...tutorData.educationLevels, level];
    setTutorData({ ...tutorData, educationLevels: levels });
  };

  const handleNext = () => {
    if (isStudent && step === 1) {
      if (!studentData.educationLevel) {
        Alert.alert('Required', 'Please select your education level');
        return;
      }
    }
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      const profileData = isStudent ? studentData : tutorData;
      const endpoint = isStudent ? API_ENDPOINTS.students.profile : API_ENDPOINTS.tutors.profile;
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileData),
      });

      if (!response.ok) {
        throw new Error('Failed to create profile');
      }

      // Redirection gérée automatiquement par le layout principal selon le rôle
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to complete profile setup');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStudentStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>Education Level</Text>
      <Text style={styles.stepSubtitle}>Select your current education level</Text>

      {EDUCATION_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.value}
          style={[
            styles.optionButton,
            studentData.educationLevel === level.value && styles.optionButtonActive,
          ]}
          onPress={() => setStudentData({ ...studentData, educationLevel: level.value })}
        >
          <Text
            style={[
              styles.optionButtonText,
              studentData.educationLevel === level.value && styles.optionButtonTextActive,
            ]}
          >
            {level.label}
          </Text>
        </TouchableOpacity>
      ))}

      <View style={styles.inputContainer}>
        <Text style={styles.label}>School Name (Optional)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your school name"
          value={studentData.schoolName}
          onChangeText={(text) => setStudentData({ ...studentData, schoolName: text })}
        />
      </View>
    </View>
  );

  const renderStudentStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Subjects & Goals</Text>
      <Text style={styles.stepSubtitle}>What subjects are you interested in?</Text>

      <View style={styles.subjectsGrid}>
        {SUBJECTS.map((subject) => (
          <TouchableOpacity
            key={subject}
            style={[
              styles.subjectChip,
              studentData.preferredSubjects.includes(subject) && styles.subjectChipActive,
            ]}
            onPress={() => toggleSubject(subject)}
          >
            <Text
              style={[
                styles.subjectChipText,
                studentData.preferredSubjects.includes(subject) && styles.subjectChipTextActive,
              ]}
            >
              {subject}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Learning Goals (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="What do you want to achieve?"
          value={studentData.learningGoals}
          onChangeText={(text) => setStudentData({ ...studentData, learningGoals: text })}
          multiline
          numberOfLines={4}
        />
      </View>
    </View>
  );

  const renderTutorStep1 = () => (
    <View>
      <Text style={styles.stepTitle}>About You</Text>
      <Text style={styles.stepSubtitle}>Tell students about your experience</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Bio</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Describe your teaching experience and approach"
          value={tutorData.bio}
          onChangeText={(text) => setTutorData({ ...tutorData, bio: text })}
          multiline
          numberOfLines={4}
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Years of Experience</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 5"
          value={tutorData.experienceYears}
          onChangeText={(text) => setTutorData({ ...tutorData, experienceYears: text })}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Hourly Rate (€)</Text>
        <TextInput
          style={styles.input}
          placeholder="e.g., 25"
          value={tutorData.hourlyRate}
          onChangeText={(text) => setTutorData({ ...tutorData, hourlyRate: text })}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Teaching Mode</Text>
        <View style={styles.modeContainer}>
          {['in-person', 'online', 'both'].map((mode) => (
            <TouchableOpacity
              key={mode}
              style={[
                styles.modeButton,
                tutorData.teachingMode === mode && styles.modeButtonActive,
              ]}
              onPress={() =>
                setTutorData({
                  ...tutorData,
                  teachingMode: mode as 'in-person' | 'online' | 'both',
                })
              }
            >
              <Text
                style={[
                  styles.modeButtonText,
                  tutorData.teachingMode === mode && styles.modeButtonTextActive,
                ]}
              >
                {mode === 'in-person' ? 'In Person' : mode === 'online' ? 'Online' : 'Both'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );

  const renderTutorStep2 = () => (
    <View>
      <Text style={styles.stepTitle}>Subjects & Levels</Text>
      <Text style={styles.stepSubtitle}>What can you teach?</Text>

      <Text style={styles.sectionLabel}>Subjects</Text>
      <View style={styles.subjectsGrid}>
        {SUBJECTS.map((subject) => (
          <TouchableOpacity
            key={subject}
            style={[
              styles.subjectChip,
              tutorData.subjects.includes(subject) && styles.subjectChipActive,
            ]}
            onPress={() => toggleSubject(subject)}
          >
            <Text
              style={[
                styles.subjectChipText,
                tutorData.subjects.includes(subject) && styles.subjectChipTextActive,
              ]}
            >
              {subject}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.sectionLabel}>Education Levels</Text>
      {EDUCATION_LEVELS.map((level) => (
        <TouchableOpacity
          key={level.value}
          style={[
            styles.optionButton,
            tutorData.educationLevels.includes(level.value) && styles.optionButtonActive,
          ]}
          onPress={() => toggleEducationLevel(level.value)}
        >
          <Text
            style={[
              styles.optionButtonText,
              tutorData.educationLevels.includes(level.value) && styles.optionButtonTextActive,
            ]}
          >
            {level.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Complete Your Profile</Text>
          <Text style={styles.progress}>
            Step {step} of 2
          </Text>
        </View>

        <View style={styles.content}>
          {isStudent ? (step === 1 ? renderStudentStep1() : renderStudentStep2()) : null}
          {!isStudent ? (step === 1 ? renderTutorStep1() : renderTutorStep2()) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {step > 1 && (
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => setStep(step - 1)}
          >
            <Text style={styles.secondaryButtonText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleNext}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>{step === 2 ? 'Complete' : 'Next'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 100,
  },
  header: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  progress: {
    fontSize: 14,
    color: '#666',
  },
  content: {
    padding: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#000',
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 12,
    color: '#000',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionButton: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: '#f9f9f9',
  },
  optionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#000',
  },
  optionButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#f9f9f9',
  },
  subjectChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  subjectChipText: {
    fontSize: 14,
    color: '#000',
  },
  subjectChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  modeContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
  },
  modeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  modeButtonText: {
    fontSize: 14,
    color: '#000',
  },
  modeButtonTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#007AFF',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
