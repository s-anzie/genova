import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { ClassResponse, UpdateClassData } from '@/types/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function EditClassScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    maxStudents: '',
    meetingLocation: '',
  });

  useEffect(() => {
    loadClassData();
  }, []);

  const loadClassData = async () => {
    try {
      const response = await ApiClient.get<{ success: boolean; data: ClassResponse }>(
        `/classes/${id}`
      );
      const classData = response.data;
      setFormData({
        name: classData.name,
        description: classData.description || '',
        maxStudents: classData.maxStudents?.toString() || '',
        meetingLocation: classData.meetingLocation || '',
      });
    } catch (error) {
      console.error('Failed to load class:', error);
      Alert.alert('Erreur', 'Impossible de charger les détails de la classe');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.name.trim()) {
      Alert.alert('Erreur', 'Veuillez entrer un nom pour la classe');
      return;
    }

    setSaving(true);
    try {
      const updateData: UpdateClassData = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        maxStudents: formData.maxStudents ? parseInt(formData.maxStudents) : undefined,
        meetingLocation: formData.meetingLocation.trim() || undefined,
      };

      await ApiClient.put(`/classes/${id}`, updateData);

      Alert.alert('Succès', 'Classe mise à jour avec succès', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error: any) {
      console.error('Failed to update class:', error);
      Alert.alert('Erreur', error.message || 'Impossible de mettre à jour la classe');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Modifier la classe</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Modifier la classe</Text>
        <View style={styles.placeholder} />
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            {/* Name */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nom de la classe *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Groupe de Mathématiques"
                placeholderTextColor={Colors.textTertiary}
                value={formData.name}
                onChangeText={(text) => setFormData({ ...formData, name: text })}
              />
            </View>

            {/* Description */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Description</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Décrivez les objectifs de la classe..."
                placeholderTextColor={Colors.textTertiary}
                value={formData.description}
                onChangeText={(text) => setFormData({ ...formData, description: text })}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
            </View>

            {/* Meeting Location */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Lieu de rencontre</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Bibliothèque municipale"
                placeholderTextColor={Colors.textTertiary}
                value={formData.meetingLocation}
                onChangeText={(text) => setFormData({ ...formData, meetingLocation: text })}
              />
            </View>

            {/* Max Students */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Nombre maximum d'étudiants</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 10"
                placeholderTextColor={Colors.textTertiary}
                value={formData.maxStudents}
                onChangeText={(text) =>
                  setFormData({ ...formData, maxStudents: text.replace(/[^0-9]/g, '') })
                }
                keyboardType="number-pad"
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoText}>
                Note: Le niveau d'éducation, la matière et le type de cours ne peuvent pas être
                modifiés après la création de la classe.
              </Text>
            </View>
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, saving && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={saving}
          >
            <Text style={styles.submitButtonText}>
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  placeholder: {
    width: 40,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
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
  form: {
    gap: 20,
  },
  formGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  textArea: {
    height: 100,
    paddingTop: 14,
  },
  infoCard: {
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
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
