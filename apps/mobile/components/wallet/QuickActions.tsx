import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Download, CreditCard, TrendingUp, Plus } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

interface QuickActionsProps {
  userRole: 'student' | 'tutor' | 'STUDENT' | 'TUTOR';
}

export function QuickActions({ userRole }: QuickActionsProps) {
  const router = useRouter();
  const isTutor = userRole === 'tutor' || userRole === 'TUTOR';

  return (
    <View style={styles.quickActions}>
      {isTutor && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/withdraw')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.success }]}>
            <Download size={22} color={Colors.white} strokeWidth={2.5} />
          </View>
          <Text style={styles.quickActionLabel}>Retirer</Text>
        </TouchableOpacity>
      )}
      
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => router.push('/payment-methods')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: Colors.primary }]}>
          <CreditCard size={22} color={Colors.white} strokeWidth={2.5} />
        </View>
        <Text style={styles.quickActionLabel}>Cartes</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.quickActionButton}
        onPress={() => router.push('/transactions')}
        activeOpacity={0.7}
      >
        <View style={[styles.quickActionIcon, { backgroundColor: Colors.secondary }]}>
          <TrendingUp size={22} color={Colors.textPrimary} strokeWidth={2.5} />
        </View>
        <Text style={styles.quickActionLabel}>Historique</Text>
      </TouchableOpacity>

      {!isTutor && (
        <TouchableOpacity
          style={styles.quickActionButton}
          onPress={() => router.push('/add-funds')}
          activeOpacity={0.7}
        >
          <View style={[styles.quickActionIcon, { backgroundColor: Colors.accent2 }]}>
            <Plus size={22} color={Colors.textPrimary} strokeWidth={2.5} />
          </View>
          <Text style={styles.quickActionLabel}>Ajouter</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
  },
  quickActionButton: {
    alignItems: 'center',
    gap: 10,
  },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  quickActionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
});
