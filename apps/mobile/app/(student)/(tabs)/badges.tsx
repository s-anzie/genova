import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Award,
  Star,
  TrendingUp,
  CheckCircle,
  Lock,
  Sparkles,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/auth-context';
import { ApiClient } from '@/utils/api';

interface Badge {
  id: string;
  name: string;
  description: string | null;
  iconUrl: string | null;
  category: 'STUDENT' | 'TUTOR' | 'BOTH';
  criteria: {
    type: string;
    threshold: number;
    period?: string;
  };
  earned: boolean;
  earnedAt?: Date;
}

interface BadgeStatistics {
  totalBadges: number;
  earnedBadges: number;
  loyaltyPoints: number;
  recentBadges: Array<{
    id: string;
    badgeId: string;
    earnedAt: Date;
    badge: {
      id: string;
      name: string;
      description: string | null;
      iconUrl: string | null;
    };
  }>;
}

export default function BadgesScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [statistics, setStatistics] = useState<BadgeStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'earned' | 'locked'>('all');

  useEffect(() => {
    loadBadges();
  }, []);

  const loadBadges = async () => {
    try {
      setLoading(true);
      const [badgesRes, statsRes] = await Promise.all([
        ApiClient.get<{ success: boolean; data: Badge[] }>('/badges/with-status'),
        ApiClient.get<{ success: boolean; data: BadgeStatistics }>('/badges/statistics'),
      ]);

      setBadges(badgesRes.data);
      setStatistics(statsRes.data);
    } catch (error) {
      console.error('Failed to load badges:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadBadges();
  };

  const getBadgeIcon = (badgeName: string) => {
    switch (badgeName) {
      case 'Assidu':
        return CheckCircle;
      case 'Mentor':
        return Award;
      case 'Pédagogue':
        return Star;
      case 'Progressiste':
        return TrendingUp;
      case 'Expert Vérifié':
        return Sparkles;
      default:
        return Award;
    }
  };

  const getBadgeColor = (badgeName: string) => {
    switch (badgeName) {
      case 'Assidu':
        return Colors.success;
      case 'Mentor':
        return Colors.primary;
      case 'Pédagogue':
        return Colors.warning;
      case 'Progressiste':
        return Colors.accent2;
      case 'Expert Vérifié':
        return '#9C27B0';
      default:
        return Colors.primary;
    }
  };

  const filteredBadges = badges.filter(badge => {
    if (selectedFilter === 'earned') return badge.earned;
    if (selectedFilter === 'locked') return !badge.earned;
    return true;
  });

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Badges" variant="primary" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Badges" variant="primary" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Statistics Card */}
        {statistics && (
          <View style={styles.statsCard}>
            <View style={styles.statsHeader}>
              <View style={styles.statsIconContainer}>
                <Award size={28} color={Colors.white} strokeWidth={2.5} />
              </View>
              <View style={styles.statsContent}>
                <Text style={styles.statsTitle}>Votre collection</Text>
                <Text style={styles.statsSubtitle}>
                  {statistics.earnedBadges} sur {statistics.totalBadges} badges
                </Text>
              </View>
            </View>

            <View style={styles.progressBarContainer}>
              <View style={styles.progressBarBackground}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${(statistics.earnedBadges / statistics.totalBadges) * 100}%`,
                    },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round((statistics.earnedBadges / statistics.totalBadges) * 100)}%
              </Text>
            </View>

            {/* Loyalty Points */}
            <View style={styles.loyaltyPointsContainer}>
              <View style={styles.loyaltyPointsIcon}>
                <Sparkles size={20} color={Colors.warning} strokeWidth={2.5} />
              </View>
              <View style={styles.loyaltyPointsContent}>
                <Text style={styles.loyaltyPointsLabel}>Points de fidélité</Text>
                <Text style={styles.loyaltyPointsValue}>{statistics.loyaltyPoints.toLocaleString('fr-FR')}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Filter Tabs */}
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'all' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('all')}
          >
            <Text style={[styles.filterTabText, selectedFilter === 'all' && styles.filterTabTextActive]}>
              Tous ({badges.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'earned' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('earned')}
          >
            <Text style={[styles.filterTabText, selectedFilter === 'earned' && styles.filterTabTextActive]}>
              Obtenus ({badges.filter(b => b.earned).length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterTab, selectedFilter === 'locked' && styles.filterTabActive]}
            onPress={() => setSelectedFilter('locked')}
          >
            <Text style={[styles.filterTabText, selectedFilter === 'locked' && styles.filterTabTextActive]}>
              Verrouillés ({badges.filter(b => !b.earned).length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Badges Grid */}
        <View style={styles.badgesGrid}>
          {filteredBadges.map(badge => {
            const BadgeIcon = getBadgeIcon(badge.name);
            const badgeColor = getBadgeColor(badge.name);

            return (
              <TouchableOpacity
                key={badge.id}
                style={[
                  styles.badgeCard,
                  !badge.earned && styles.badgeCardLocked,
                ]}
                onPress={() => {
                  // Navigate to badge detail - using any to bypass type checking for dynamic routes
                  router.push(`/(student)/badges/${badge.id}` as any);
                }}
              >
                <View
                  style={[
                    styles.badgeIconContainer,
                    { backgroundColor: badge.earned ? badgeColor + '15' : Colors.border },
                  ]}
                >
                  {badge.earned ? (
                    <BadgeIcon size={32} color={badgeColor} strokeWidth={2.5} />
                  ) : (
                    <Lock size={32} color={Colors.textSecondary} strokeWidth={2} />
                  )}
                </View>

                <Text
                  style={[
                    styles.badgeName,
                    !badge.earned && styles.badgeNameLocked,
                  ]}
                  numberOfLines={2}
                >
                  {badge.name}
                </Text>

                {badge.earned && badge.earnedAt && (
                  <Text style={styles.badgeEarnedDate}>
                    {new Date(badge.earnedAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </Text>
                )}

                {!badge.earned && (
                  <View style={styles.lockedBadge}>
                    <Lock size={12} color={Colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.lockedText}>Verrouillé</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Recent Badges */}
        {statistics && statistics.recentBadges.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Récemment obtenus</Text>
            {statistics.recentBadges.map(userBadge => {
              const BadgeIcon = getBadgeIcon(userBadge.badge.name);
              const badgeColor = getBadgeColor(userBadge.badge.name);

              return (
                <View key={userBadge.id} style={styles.recentBadgeCard}>
                  <View
                    style={[
                      styles.recentBadgeIcon,
                      { backgroundColor: badgeColor + '15' },
                    ]}
                  >
                    <BadgeIcon size={24} color={badgeColor} strokeWidth={2.5} />
                  </View>
                  <View style={styles.recentBadgeContent}>
                    <Text style={styles.recentBadgeName}>{userBadge.badge.name}</Text>
                    <Text style={styles.recentBadgeDate}>
                      {new Date(userBadge.earnedAt).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                      })}
                    </Text>
                  </View>
                  <View style={styles.recentBadgePoints}>
                    <Sparkles size={14} color={Colors.warning} strokeWidth={2.5} />
                    <Text style={styles.recentBadgePointsText}>+100</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Empty State */}
        {filteredBadges.length === 0 && (
          <View style={styles.emptyState}>
            <Award size={64} color={Colors.textSecondary} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucun badge</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === 'earned'
                ? "Vous n'avez pas encore obtenu de badges. Continuez à utiliser l'application pour en gagner!"
                : 'Tous les badges ont été débloqués!'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  statsCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.medium,
  },
  statsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContent: {
    flex: 1,
    gap: 4,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  statsSubtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  progressBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.white,
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
    minWidth: 45,
    textAlign: 'right',
  },
  loyaltyPointsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  loyaltyPointsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loyaltyPointsContent: {
    flex: 1,
    gap: 2,
  },
  loyaltyPointsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  loyaltyPointsValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: 4,
    gap: 4,
    ...Shadows.small,
  },
  filterTab: {
    flex: 1,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  filterTabActive: {
    backgroundColor: Colors.primary,
  },
  filterTabText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterTabTextActive: {
    color: Colors.white,
  },
  badgesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  badgeCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.small,
  },
  badgeCardLocked: {
    opacity: 0.6,
  },
  badgeIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  badgeNameLocked: {
    color: Colors.textSecondary,
  },
  badgeEarnedDate: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    backgroundColor: Colors.border,
    borderRadius: BorderRadius.small,
  },
  lockedText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recentBadgeCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.small,
  },
  recentBadgeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recentBadgeContent: {
    flex: 1,
    gap: 4,
  },
  recentBadgeName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recentBadgeDate: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  recentBadgePoints: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.warning + '15',
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
  },
  recentBadgePointsText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.warning,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xl * 2,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingHorizontal: Spacing.xl,
    lineHeight: 20,
  },
});
