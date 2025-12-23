import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing } from '@/constants/colors';

export default function StudentProgressScreen() {
  return (
    <View style={styles.container}>
      <PageHeader title="Ma Progression" />

      <View style={styles.content}>
        <TrendingUp size={64} color={Colors.textSecondary} strokeWidth={1.5} />
        <Text style={styles.title}>Suivi de progression</Text>
        <Text style={styles.subtitle}>
          Suivez vos progrès académiques et vos objectifs
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
