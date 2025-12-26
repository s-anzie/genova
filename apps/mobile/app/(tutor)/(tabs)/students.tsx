import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Users } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing } from '@/constants/colors';

export default function TutorStudentsScreen() {
  return (
    <View style={styles.container}>
      <PageHeader title="Mes Étudiants" variant="primary" />
      
      <View style={styles.content}>
        <Users size={64} color={Colors.textSecondary} strokeWidth={1.5} />
        <Text style={styles.title}>Étudiants</Text>
        <Text style={styles.subtitle}>Liste de vos étudiants</Text>
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
  },
});
