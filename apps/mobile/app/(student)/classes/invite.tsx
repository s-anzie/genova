import React, { useState } from 'react';
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
import { ArrowLeft, Mail, Plus, X } from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function InviteMembersScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [emails, setEmails] = useState<string[]>(['']);
  const [loading, setLoading] = useState(false);

  const handleAddEmail = () => {
    setEmails([...emails, '']);
  };

  const handleRemoveEmail = (index: number) => {
    if (emails.length > 1) {
      setEmails(emails.filter((_, i) => i !== index));
    }
  };

  const handleEmailChange = (index: number, value: string) => {
    const newEmails = [...emails];
    newEmails[index] = value;
    setEmails(newEmails);
  };

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    // Filter out empty emails
    const validEmails = emails.filter((email) => email.trim() !== '');

    if (validEmails.length === 0) {
      Alert.alert('Erreur', 'Veuillez entrer au moins une adresse email');
      return;
    }

    // Validate all emails
    const invalidEmails = validEmails.filter((email) => !validateEmail(email));
    if (invalidEmails.length > 0) {
      Alert.alert(
        'Erreur',
        `Les adresses email suivantes sont invalides:\n${invalidEmails.join('\n')}`
      );
      return;
    }

    setLoading(true);
    try {
      const response = await ApiClient.post<{
        success: boolean;
        data: { invited: string[]; failed: string[] };
      }>(`/classes/${id}/invite`, { emails: validEmails });

      const { invited, failed } = response.data;

      let message = '';
      if (invited.length > 0) {
        message += `${invited.length} invitation(s) envoyée(s) avec succès`;
      }
      if (failed.length > 0) {
        message += `\n\n${failed.length} invitation(s) échouée(s):\n${failed.join('\n')}`;
      }

      Alert.alert(
        invited.length > 0 ? 'Succès' : 'Erreur',
        message,
        [
          {
            text: 'OK',
            onPress: () => {
              if (invited.length > 0) {
                router.back();
              }
            },
          },
        ]
      );
    } catch (error: any) {
      console.error('Failed to invite members:', error);
      Alert.alert('Erreur', error.message || 'Impossible d\'envoyer les invitations');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Inviter des membres</Text>
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
          <View style={styles.infoCard}>
            <Mail size={24} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.infoText}>
              Entrez les adresses email des étudiants que vous souhaitez inviter à rejoindre
              cette classe. Ils recevront une notification.
            </Text>
          </View>

          <View style={styles.emailsList}>
            {emails.map((email, index) => (
              <View key={index} style={styles.emailInputContainer}>
                <TextInput
                  style={styles.emailInput}
                  placeholder={`Email ${index + 1}`}
                  placeholderTextColor={Colors.textTertiary}
                  value={email}
                  onChangeText={(text) => handleEmailChange(index, text)}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {emails.length > 1 && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => handleRemoveEmail(index)}
                  >
                    <X size={20} color="#EF4444" strokeWidth={2} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAddEmail}>
            <Plus size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.addButtonText}>Ajouter une adresse email</Text>
          </TouchableOpacity>
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'Envoi...' : 'Envoyer les invitations'}
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
  infoCard: {
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emailsList: {
    gap: 12,
    marginBottom: 16,
  },
  emailInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emailInput: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: Colors.textPrimary,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  removeButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.white,
    borderRadius: 12,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.primary,
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
