import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { CheckCircle, XCircle, AlertCircle, X } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';

// Add missing color constants
const bgLight = Colors.bgSecondary;

const { width } = Dimensions.get('window');

export type ModalType = 'success' | 'error' | 'warning' | 'loading';

interface StyledModalProps {
  visible: boolean;
  type: ModalType;
  title: string;
  message?: string;
  primaryButton?: {
    text: string;
    onPress: () => void;
  };
  secondaryButton?: {
    text: string;
    onPress: () => void;
  };
  onClose?: () => void;
  showCloseButton?: boolean;
}

export function StyledModal({
  visible,
  type,
  title,
  message,
  primaryButton,
  secondaryButton,
  onClose,
  showCloseButton = true,
}: StyledModalProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={56} color={Colors.success} strokeWidth={2} />;
      case 'error':
        return <XCircle size={56} color={Colors.error} strokeWidth={2} />;
      case 'warning':
        return <AlertCircle size={56} color={Colors.warning} strokeWidth={2} />;
      case 'loading':
        return <ActivityIndicator size="large" color={Colors.primary} />;
    }
  };

  const getIconBackgroundColor = () => {
    switch (type) {
      case 'success':
        return 'rgba(34, 197, 94, 0.1)';
      case 'error':
        return 'rgba(239, 68, 68, 0.1)';
      case 'warning':
        return 'rgba(251, 191, 36, 0.1)';
      case 'loading':
        return 'rgba(99, 102, 241, 0.1)';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {showCloseButton && onClose && type !== 'loading' && (
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <X size={24} color={Colors.textSecondary} strokeWidth={2} />
            </TouchableOpacity>
          )}

          <View style={[styles.iconContainer, { backgroundColor: getIconBackgroundColor() }]}>
            {getIcon()}
          </View>

          <Text style={styles.title}>{title}</Text>

          {message && <Text style={styles.message}>{message}</Text>}

          {(primaryButton || secondaryButton) && (
            <View style={styles.buttonsContainer}>
              {secondaryButton && (
                <TouchableOpacity
                  style={[styles.button, styles.secondaryButton]}
                  onPress={secondaryButton.onPress}
                >
                  <Text style={styles.secondaryButtonText}>{secondaryButton.text}</Text>
                </TouchableOpacity>
              )}

              {primaryButton && (
                <TouchableOpacity
                  style={[styles.button, styles.primaryButton]}
                  onPress={primaryButton.onPress}
                >
                  <Text style={styles.primaryButtonText}>{primaryButton.text}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalContainer: {
    width: width - 48,
    maxWidth: 400,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.xl,
    alignItems: 'center',
    ...Shadows.large,
  },
  closeButton: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    backgroundColor: bgLight,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: Spacing.lg,
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: Spacing.md,
    width: '100%',
    marginTop: Spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: BorderRadius.large,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: Colors.primary,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  secondaryButton: {
    backgroundColor: bgLight,
    borderWidth: 1,
    borderColor: Colors.borderLight,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
