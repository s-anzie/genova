import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/contexts/auth-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Mail, Lock, User, GraduationCap, UserCheck, Calendar, Eye, EyeOff } from 'lucide-react-native';
import { Colors, Gradients, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { validateEmail, validatePassword, validatePasswordMatch, validateName, validateBirthDate } from '@/utils/validation';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    role: 'student' as 'student' | 'tutor',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    firstName?: string;
    lastName?: string;
    birthDate?: string;
  }>({});
  const scrollViewRef = useRef<ScrollView>(null);

  const formatBirthDate = (text: string) => {
    // Supprimer tous les caractères non numériques
    const cleaned = text.replace(/\D/g, '');
    
    // Limiter à 8 chiffres (JJMMAAAA)
    const limited = cleaned.substring(0, 8);
    
    // Formater progressivement
    let formatted = limited;
    if (limited.length >= 2) {
      formatted = limited.substring(0, 2);
      if (limited.length >= 3) {
        formatted += '/' + limited.substring(2, 4);
        if (limited.length >= 5) {
          formatted += '/' + limited.substring(4, 8);
        }
      }
    }
    
    return formatted;
  };

  const handleBirthDateChange = (text: string) => {
    const formatted = formatBirthDate(text);
    setFormData({ ...formData, birthDate: formatted });
    if (errors.birthDate) {
      setErrors({ ...errors, birthDate: undefined });
    }
  };

  const validateStep1 = (): boolean => {
    if (!formData.role) {
      Alert.alert('Erreur', 'Veuillez sélectionner un rôle');
      return false;
    }
    return true;
  };

  const validateStep2 = (): boolean => {
    const newErrors: typeof errors = {};
    
    const firstNameValidation = validateName(formData.firstName);
    if (!firstNameValidation.valid) {
      newErrors.firstName = firstNameValidation.message;
    }
    
    const lastNameValidation = validateName(formData.lastName);
    if (!lastNameValidation.valid) {
      newErrors.lastName = lastNameValidation.message;
    }
    
    if (formData.birthDate) {
      const birthDateValidation = validateBirthDate(formData.birthDate);
      if (!birthDateValidation.valid) {
        newErrors.birthDate = birthDateValidation.message;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = (): boolean => {
    const newErrors: typeof errors = {};
    
    const emailValidation = validateEmail(formData.email);
    if (!emailValidation.valid) {
      newErrors.email = emailValidation.message;
    }
    
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.message;
    }
    
    const passwordMatchValidation = validatePasswordMatch(formData.password, formData.confirmPassword);
    if (!passwordMatchValidation.valid) {
      newErrors.confirmPassword = passwordMatchValidation.message;
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 1) {
      if (!validateStep1()) return;
      setStep(2);
    } else if (step === 2) {
      if (!validateStep2()) return;
      setStep(3);
    } else {
      handleRegister();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleRegister = async () => {
    if (!validateStep3()) {
      return;
    }

    try {
      setIsLoading(true);
      await register({
        email: formData.email.toLowerCase().trim(),
        password: formData.password,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        role: formData.role,
      });
      // Redirect to login after successful registration
      Alert.alert(
        'Inscription réussie',
        'Votre compte a été créé avec succès. Veuillez vous connecter.',
        [
          {
            text: 'OK',
            onPress: () => router.replace('/(auth)/login'),
          },
        ]
      );
    } catch (error: any) {
      Alert.alert("Erreur d'inscription", error.message || 'Une erreur est survenue');
    } finally {
      setIsLoading(false);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Choisissez votre rôle</Text>
      <Text style={styles.stepSubtitle}>Êtes-vous étudiant ou tuteur?</Text>

      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleCard, formData.role === 'student' && styles.roleCardActive]}
          onPress={() => setFormData({ ...formData, role: 'student' })}
        >
          <View
            style={[
              styles.roleIconContainer,
              formData.role === 'student' && styles.roleIconContainerActive,
            ]}
          >
            <GraduationCap
              size={32}
              color={formData.role === 'student' ? Colors.white : Colors.primary}
              strokeWidth={2}
            />
          </View>
          <Text
            style={[styles.roleTitle, formData.role === 'student' && styles.roleTitleActive]}
          >
            Étudiant
          </Text>
          <Text style={styles.roleDescription}>Je cherche un tuteur pour m'aider</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleCard, formData.role === 'tutor' && styles.roleCardActive]}
          onPress={() => setFormData({ ...formData, role: 'tutor' })}
        >
          <View
            style={[
              styles.roleIconContainer,
              formData.role === 'tutor' && styles.roleIconContainerActive,
            ]}
          >
            <UserCheck
              size={32}
              color={formData.role === 'tutor' ? Colors.white : Colors.primary}
              strokeWidth={2}
            />
          </View>
          <Text style={[styles.roleTitle, formData.role === 'tutor' && styles.roleTitleActive]}>
            Tuteur
          </Text>
          <Text style={styles.roleDescription}>Je veux enseigner et aider les étudiants</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Vos informations</Text>
      <Text style={styles.stepSubtitle}>Comment devons-nous vous appeler?</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Prénom</Text>
        <View style={[styles.inputWrapper, errors.firstName && styles.inputWrapperError]}>
          <User size={20} color={errors.firstName ? Colors.error : Colors.primary} strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="John"
            placeholderTextColor={Colors.textTertiary}
            value={formData.firstName}
            onChangeText={(text) => {
              setFormData({ ...formData, firstName: text });
              if (errors.firstName) {
                setErrors({ ...errors, firstName: undefined });
              }
            }}
            editable={!isLoading}
          />
        </View>
        {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Nom</Text>
        <View style={[styles.inputWrapper, errors.lastName && styles.inputWrapperError]}>
          <User size={20} color={errors.lastName ? Colors.error : Colors.primary} strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="Doe"
            placeholderTextColor={Colors.textTertiary}
            value={formData.lastName}
            onChangeText={(text) => {
              setFormData({ ...formData, lastName: text });
              if (errors.lastName) {
                setErrors({ ...errors, lastName: undefined });
              }
            }}
            editable={!isLoading}
          />
        </View>
        {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Date de naissance (optionnel)</Text>
        <View style={[styles.inputWrapper, errors.birthDate && styles.inputWrapperError]}>
          <Calendar size={20} color={errors.birthDate ? Colors.error : Colors.primary} strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="JJ/MM/AAAA"
            placeholderTextColor={Colors.textTertiary}
            value={formData.birthDate}
            onChangeText={handleBirthDateChange}
            keyboardType="numeric"
            maxLength={10}
            editable={!isLoading}
          />
        </View>
        {errors.birthDate && <Text style={styles.errorText}>{errors.birthDate}</Text>}
        {formData.birthDate && !errors.birthDate && (
          <Text style={styles.hintText}>Format: JJ/MM/AAAA</Text>
        )}
      </View>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <Text style={styles.stepTitle}>Sécurité</Text>
      <Text style={styles.stepSubtitle}>Créez votre compte sécurisé</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Email</Text>
        <View style={[styles.inputWrapper, errors.email && styles.inputWrapperError]}>
          <Mail size={20} color={errors.email ? Colors.error : Colors.primary} strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="votre@email.com"
            placeholderTextColor={Colors.textTertiary}
            value={formData.email}
            onChangeText={(text) => {
              setFormData({ ...formData, email: text });
              if (errors.email) {
                setErrors({ ...errors, email: undefined });
              }
            }}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            editable={!isLoading}
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Mot de passe</Text>
        <View style={[styles.inputWrapper, errors.password && styles.inputWrapperError]}>
          <Lock size={20} color={errors.password ? Colors.error : Colors.primary} strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="Min. 8 caractères"
            placeholderTextColor={Colors.textTertiary}
            value={formData.password}
            onChangeText={(text) => {
              setFormData({ ...formData, password: text });
              if (errors.password) {
                setErrors({ ...errors, password: undefined });
              }
            }}
            secureTextEntry={!showPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
            disabled={isLoading}
          >
            {showPassword ? (
              <EyeOff size={20} color={Colors.textSecondary} strokeWidth={2} />
            ) : (
              <Eye size={20} color={Colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>Confirmer le mot de passe</Text>
        <View style={[styles.inputWrapper, errors.confirmPassword && styles.inputWrapperError]}>
          <Lock size={20} color={errors.confirmPassword ? Colors.error : Colors.primary} strokeWidth={2} />
          <TextInput
            style={styles.input}
            placeholder="Répétez le mot de passe"
            placeholderTextColor={Colors.textTertiary}
            value={formData.confirmPassword}
            onChangeText={(text) => {
              setFormData({ ...formData, confirmPassword: text });
              if (errors.confirmPassword) {
                setErrors({ ...errors, confirmPassword: undefined });
              }
            }}
            secureTextEntry={!showConfirmPassword}
            editable={!isLoading}
          />
          <TouchableOpacity
            onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            style={styles.eyeIcon}
            disabled={isLoading}
          >
            {showConfirmPassword ? (
              <EyeOff size={20} color={Colors.textSecondary} strokeWidth={2} />
            ) : (
              <Eye size={20} color={Colors.textSecondary} strokeWidth={2} />
            )}
          </TouchableOpacity>
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={Gradients.primary} style={styles.gradient}>
      {/* Header fixe */}
      <View style={styles.header}>
            <View style={styles.logoContainer}>
              <GraduationCap size={32} color={Colors.white} strokeWidth={2} />
              <Text style={styles.logoText}>Genova</Text>
            </View>
          </View>

          {/* Progress Dots */}
          <View style={styles.progressContainer}>
            <View style={styles.dotsContainer}>
              {[1, 2, 3].map((dotStep) => (
                <View
                  key={dotStep}
                  style={[
                    styles.dot,
                    dotStep === step && styles.dotActive,
                    dotStep < step && styles.dotCompleted,
                  ]}
                />
              ))}
            </View>
            <Text style={styles.progressText}>Étape {step} sur 3</Text>
          </View>

          {/* Form Card avec ScrollView */}
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.formCard}>
              <ScrollView
                ref={scrollViewRef}
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                bounces={false}
              >
                {step === 1 && renderStep1()}
                {step === 2 && renderStep2()}
                {step === 3 && renderStep3()}
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>

          {/* Footer fixe */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
              onPress={handleNext}
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
                  <Text style={styles.nextButtonText}>
                    {step === 3 ? 'Créer mon compte' : 'Continuer'}
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.loginContainer}>
              <Text style={styles.loginText}>Déjà un compte? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
                <Text style={styles.loginLink}>Se connecter</Text>
              </TouchableOpacity>
            </View>
          </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.white,
  },
  progressContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  dotActive: {
    backgroundColor: Colors.white,
    width: 24,
  },
  dotCompleted: {
    backgroundColor: Colors.white,
  },
  progressText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  formCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderTopLeftRadius: BorderRadius.xxlarge,
    borderTopRightRadius: BorderRadius.xxlarge,
    ...Shadows.large,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: Spacing.xl,
  },
  roleContainer: {
    gap: Spacing.md,
  },
  roleCard: {
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
  },
  roleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.round,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  roleIconContainerActive: {
    backgroundColor: Colors.primary,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  roleTitleActive: {
    color: Colors.primary,
  },
  roleDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: Spacing.md,
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
  inputWrapperError: {
    borderColor: Colors.error,
  },
  input: {
    flex: 1,
    height: 50,
    fontSize: 16,
    color: Colors.textPrimary,
    marginLeft: Spacing.sm,
  },
  eyeIcon: {
    padding: Spacing.xs,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
  },
  hintText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
    marginLeft: Spacing.sm,
    fontStyle: 'italic',
  },
  footer: {
    padding: Spacing.lg,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  nextButton: {
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    ...Shadows.primary,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  buttonGradient: {
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nextButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
