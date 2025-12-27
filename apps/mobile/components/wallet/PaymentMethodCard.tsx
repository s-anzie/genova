import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Check, Trash2, Smartphone } from 'lucide-react-native';
import { Colors, Shadows, Spacing, BorderRadius } from '@/constants/colors';
import { PaymentMethod } from '@/types/api';

interface PaymentMethodCardProps {
  method: PaymentMethod;
  onSetDefault: (id: string) => void;
  onDelete: (id: string) => void;
}

export function PaymentMethodCard({ method, onSetDefault, onDelete }: PaymentMethodCardProps) {
  const operator = method.operator;
  
  if (!operator) return null;

  // Format phone number for display
  const formatPhoneNumber = (phone: string) => {
    // Remove country code for display
    const number = phone.replace(operator.phonePrefix, '');
    // Apply operator's format
    const format = operator.phoneFormat;
    let formatted = '';
    let numIndex = 0;
    
    for (let i = 0; i < format.length; i++) {
      if (format[i] === 'X') {
        formatted += number[numIndex] || '';
        numIndex++;
      } else {
        formatted += format[i];
      }
    }
    
    return `${operator.phonePrefix} ${formatted.trim()}`;
  };

  // Get gradient colors based on operator
  const getGradientColors = () => {
    const baseColor = operator.color;
    // Create a darker shade for gradient
    const darkerShade = adjustColor(baseColor, -30);
    return [baseColor, darkerShade];
  };

  // Helper to darken/lighten color
  const adjustColor = (color: string, amount: number) => {
    const num = parseInt(color.replace('#', ''), 16);
    const r = Math.max(0, Math.min(255, (num >> 16) + amount));
    const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00FF) + amount));
    const b = Math.max(0, Math.min(255, (num & 0x0000FF) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getGradientColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        {/* Card Header */}
        <View style={styles.cardHeader}>
          <View style={styles.operatorInfo}>
            <View style={styles.chipIcon}>
              <Smartphone size={20} color="rgba(255, 255, 255, 0.9)" strokeWidth={2} />
            </View>
            <Text style={styles.operatorName}>{operator.name}</Text>
          </View>
          {method.isVerified && (
            <View style={styles.verifiedBadge}>
              <Check size={14} color={Colors.white} strokeWidth={3} />
            </View>
          )}
        </View>

        {/* Card Number (Phone) */}
        <View style={styles.cardNumber}>
          <Text style={styles.phoneNumber}>
            {formatPhoneNumber(method.phoneNumber)}
          </Text>
        </View>

        {/* Card Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.accountInfo}>
            <Text style={styles.accountLabel}>TITULAIRE</Text>
            <Text style={styles.accountName} numberOfLines={1}>
              {method.accountHolder || method.accountName}
            </Text>
          </View>
          <View style={styles.countryInfo}>
            <Text style={styles.countryLabel}>PAYS</Text>
            <Text style={styles.countryName}>{operator.countryName}</Text>
          </View>
        </View>

        {/* Decorative pattern */}
        <View style={styles.pattern}>
          <View style={[styles.circle, styles.circle1]} />
          <View style={[styles.circle, styles.circle2]} />
        </View>
      </LinearGradient>

      {/* Action Buttons */}
      <View style={styles.actions}>
        {method.isDefault ? (
          <View style={styles.defaultBadge}>
            <Check size={14} color={Colors.white} strokeWidth={3} />
            <Text style={styles.defaultBadgeText}>Par défaut</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.setDefaultButton}
            onPress={() => onSetDefault(method.id)}
            activeOpacity={0.7}
          >
            <Text style={styles.setDefaultButtonText}>
              Définir par défaut
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => onDelete(method.id)}
          activeOpacity={0.7}
        >
          <Trash2 size={18} color={Colors.error} strokeWidth={2} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.md,
  },
  card: {
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.lg,
    minHeight: 200,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  operatorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  chipIcon: {
    width: 40,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  verifiedBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardNumber: {
    marginBottom: Spacing.xl,
  },
  phoneNumber: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.white,
    letterSpacing: 2,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  accountInfo: {
    flex: 1,
  },
  accountLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: 1,
  },
  accountName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  countryInfo: {
    alignItems: 'flex-end',
  },
  countryLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
    letterSpacing: 1,
  },
  countryName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  pattern: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '100%',
    height: '100%',
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  circle1: {
    width: 150,
    height: 150,
    top: -50,
    right: -30,
  },
  circle2: {
    width: 100,
    height: 100,
    bottom: -20,
    right: 40,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.success,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.large,
    gap: 4,
  },
  defaultBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  setDefaultButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.large,
    borderWidth: 1,
    borderColor: Colors.primary,
    backgroundColor: Colors.white,
  },
  setDefaultButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
});
