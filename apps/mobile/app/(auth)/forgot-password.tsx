import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, ChevronLeft, ShieldCheck, CheckCircle } from 'lucide-react-native';
import { Colors, Gradients, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { StyledModal } from '@/components/ui/StyledModal';
import { useModal } from '@/hooks/useModal';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useAuth();
  const { modalState, hideModal, showError } = useModal();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email) {
      showError('Erreur', 'Veuillez entrer votre adresse email');
      return;
    }

    try {
      setIsLoading(true);
      await resetPassword(email.toLowerCase().trim());
      setEmailSent(true);
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Une erreur est survenue');
      showError('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  if (emailSent) {
    return (
      <LinearGradient colors={Gradients.primary} style={styles.gradient}>
        <View style={styles.successContainer}>
          <View style={styles.successIconContainer}>
            <CheckCircle size={80} color={Colors.white} strokeWidth={2} />
          </View>
          <Text style={styles.successTitle}>Email envoyé!</Text>
          <Text style={styles.successMessage}>
            Nous avons envoyé un lien de réinitialisation à
          </Text>
          <Text style={styles.emailText}>{email}</Text>
          <Text style={styles.successSubtext}>
            Vérifiez votre boîte de réception et suivez les instructions pour réinitialiser votre
            mot de passe.
          </Text>
          <TouchableOpacity
            style={styles.backToLoginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.backToLoginText}>Retour à la connexion</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Gradients.primary} style={styles.gradient}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ChevronLeft size={24} color={Colors.white} strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Icon Section */}
        <View style={styles.iconSection}>
          <View style={styles.iconContainer}>
            <ShieldCheck size={64} color={Colors.white} strokeWidth={2} />
          </View>
          <Text style={styles.iconTitle}>Mot de passe oublié?</Text>
          <Text style={styles.iconSubtitle}>
            Pas de problème! Entrez votre email et nous vous enverrons un lien pour réinitialiser
            votre mot de passe.
          </Text>
        </View>

        {/* Form Card */}
        <View style={styles.formCard}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Adresse email</Text>
            <View style={styles.inputWrapper}>
              <Mail size={20} color={Colors.primary} strokeWidth={2} />
              <TextInput
                style={styles.input}
                placeholder="votre@email.com"
                placeholderTextColor={Colors.textTertiary}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.resetButton, isLoading && styles.resetButtonDisabled]}
            onPress={handleResetPassword}
            disabled={isLoading}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={styles.resetButtonText}>Envoyer le lien</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.helpText}>
            <Text style={styles.helpTextContent}>Vous vous souvenez de votre mot de passe? </Text>
            <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
              <Text style={styles.helpTextLink}>Se connecter</Text>
            </TouchableOpacity>
          </View>
        </View>
        </ScrollView>
      </TouchableWithoutFeedback>

      <StyledModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButton={modalState.primaryButton}
        secondaryButton={modalState.secondaryButton}
        onClose={hideModal}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.medium,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  iconSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 20,
  },
  formCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxlarge,
    borderTopRightRadius: BorderRadius.xxlarge,
    padding: Spacing.lg,
    ...Shadows.large,
  },
  inputContainer: {
    marginBottom: Spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.large,
    paddingHorizontal: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  resetButton: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    ...Shadows.primary,
  },
  resetButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  helpText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  helpTextContent: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  helpTextLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  successIconContainer: {
    marginBottom: Spacing.xl,
  },
  successTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  successMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  emailText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: Spacing.md,
  },
  successSubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: Spacing.xl,
  },
  backToLoginButton: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    ...Shadows.medium,
  },
  backToLoginText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: 'bold',
  },
});
