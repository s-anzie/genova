import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideIcon } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';

export interface StatItem {
  icon: LucideIcon;
  iconColor: string;
  value: string | number;
  label: string;
}

interface StatsCardProps {
  stats: StatItem[];
  mode?: 'compact' | 'expanded';
}

export function StatsCard({ stats, mode = 'compact' }: StatsCardProps) {
  if (mode === 'compact') {
    return (
      <View style={styles.compactCard}>
        <View style={styles.compactRow}>
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <React.Fragment key={index}>
                <View style={styles.compactItem}>
                  <View style={[styles.compactIconContainer, { backgroundColor: stat.iconColor + '15' }]}>
                    <Icon size={16} color={stat.iconColor} strokeWidth={2.5} />
                  </View>
                  <View style={styles.compactTextContainer}>
                    <Text style={styles.compactValue}>{stat.value}</Text>
                    <Text style={styles.compactLabel}>{stat.label}</Text>
                  </View>
                </View>
                {index < stats.length - 1 && <View style={styles.compactDivider} />}
              </React.Fragment>
            );
          })}
        </View>
      </View>
    );
  }

  // Expanded mode
  return (
    <View style={styles.expandedContainer}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <View key={index} style={styles.expandedCard}>
            <View style={[styles.expandedIconContainer, { backgroundColor: stat.iconColor + '15' }]}>
              <Icon size={24} color={stat.iconColor} strokeWidth={2.5} />
            </View>
            <Text style={styles.expandedValue}>{stat.value}</Text>
            <Text style={styles.expandedLabel}>{stat.label}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  // Compact mode styles
  compactCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  compactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  compactItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  compactIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compactTextContainer: {
    gap: 2,
  },
  compactValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  compactLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    lineHeight: 12,
  },
  compactDivider: {
    width: 1,
    height: 36,
    backgroundColor: Colors.border,
  },

  // Expanded mode styles
  expandedContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  expandedCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.small,
  },
  expandedIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandedValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  expandedLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
});
