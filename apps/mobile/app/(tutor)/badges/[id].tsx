import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Award,
  Star,
  TrendingUp,
  CheckCircle,
  Lock,
  Sparkles,
  ArrowLeft,
  Target,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
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
    minReviews?: number;
  };
  earned: boolean;
  earnedAt?: Date;
}

export default function TutorBadgeDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [badge, setBadge] = useState<Badge | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBadgeDetail();
  }, [id]);

  const loadBadgeDetail = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ success: boolean; data: Badge[] }>(
        '/badges/with-status'
      );
      const foundBadge = response.data.find(b => b.id === id);
      if (foundBadge) {
        setBadge(foundBadge);
      }
    } catch (error) {
      console.error('Failed to load badge detail:', error);
    } finally {
      setLoading(false);
    }
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

  const getCriteriaDescription = (criteria: Badge['criteria']) => {
    switch (criteria.type) {
      case 'attendance_rate':
        return `Atteindre un taux de présence de ${criteria.threshold}% ou plus sur ${criteria.period === '1_month' ? 'un mois' : 'la période'}`;
      case 'hours_taught':
        return `Compléter ${criteria.threshold} heures de tutorat`;
      case 'average_rating':
        return `Obtenir une note moyenne de ${criteria.threshold} ou plus sur ${criteria.minReviews || 20} sessions`;
      case 'improvement':
        return `Améliorer vos résultats académiques de ${criteria.threshold}% ou plus`;
      case 'verification':
        return 'Compléter le processus de vérification du tuteur';
      default:
        return 'Critères non spécifiés';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'STUDENT':
        return 'Étudiant';
      case 'TUTOR':
        return 'Tuteur';
      case 'BOTH':
        return 'Tous';
      default:
        return category;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Badge" variant="primary" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  if (!badge) {
    return (
      <View style={styles.container}>
        <PageHeader title="Badge" variant="primary" />
        <View style={styles.emptyState}>
          <Award size={64} color={Colors.textSecondary} strokeWidth={1.5} />
          <Text style={styles.emptyStateTitle}>Badge introuvable</Text>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>Retour</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const BadgeIcon = getBadgeIcon(badge.name);
  const badgeColor = getBadgeColor(badge.name);

  return (
    <View style={styles.container}>
      <PageHeader
        title="Détails du badge"
        variant="primary"
        leftElement={
          <TouchableOpacity onPress={() => router.back()} style={styles.backIconButton}>
            <ArrowLeft size={24} color={Colors.white} strokeWidth={2} />
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Badge Hero */}
        <View
          style={[
            styles.badgeHero,
            { backgroundColor: badge.earned ? badgeColor : Colors.border },
          ]}
        >
          <View
            style={[
              styles.badgeIconLarge,
              { backgroundColor: badge.earned ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.1)' },
            ]}
          >
            {badge.earned ? (
              <BadgeIcon size={80} color={Colors.white} strokeWidth={2.5} />
            ) : (
              <Lock size={80} color={Colors.textSecondary} strokeWidth={2} />
            )}
          </View>

          <Text style={styles.badgeHeroName}>{badge.name}</Text>

          {badge.earned && badge.earnedAt && (
            <View style={styles.earnedBadge}>
              <CheckCircle size={16} color={Colors.white} strokeWidth={2.5} />
              <Text style={styles.earnedBadgeText}>
                Obtenu le{' '}
                {new Date(badge.earnedAt).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
          )}

          {!badge.earned && (
            <View style={styles.lockedBadge}>
              <Lock size={16} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.lockedBadgeText}>Verrouillé</Text>
            </View>
          )}
        </View>

        {/* Badge Info */}
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <View style={styles.infoIcon}>
              <Award size={20} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoLabel}>Catégorie</Text>
              <Text style={styles.infoValue}>{getCategoryLabel(badge.category)}</Text>
            </View>
          </View>

          {badge.description && (
            <View style={styles.descriptionContainer}>
              <Text style={styles.descriptionLabel}>Description</Text>
              <Text style={styles.descriptionText}>{badge.description}</Text>
            </View>
          )}
        </View>

        {/* Criteria Card */}
        <View style={styles.criteriaCard}>
          <View style={styles.criteriaHeader}>
            <View style={styles.criteriaIcon}>
              <Target size={20} color={Colors.primary} strokeWidth={2.5} />
            </View>
            <Text style={styles.criteriaTitle}>Comment l'obtenir</Text>
          </View>

          <Text style={styles.criteriaDescription}>
            {getCriteriaDescription(badge.criteria)}
          </Text>

          {!badge.earned && (
            <View style={styles.criteriaProgress}>
              <Text style={styles.criteriaProgressLabel}>
                Continuez à utiliser l'application pour débloquer ce badge!
              </Text>
            </View>
          )}
        </View>

        {/* Rewards Card */}
        {badge.earned && (
          <View style={styles.rewardsCard}>
            <View style={styles.rewardsHeader}>
              <View style={styles.rewardsIcon}>
                <Sparkles size={20} color={Colors.warning} strokeWidth={2.5} />
              </View>
              <Text style={styles.rewardsTitle}>Récompenses</Text>
            </View>

            <View style={styles.rewardItem}>
              <View style={styles.rewardIconContainer}>
                <Sparkles size={18} color={Colors.warning} strokeWidth={2.5} />
              </View>
              <Text style={styles.rewardText}>+100 points de fidélité</Text>
            </View>
          </View>
        )}

        {/* Tips Card */}
        {!badge.earned && (
          <View style={styles.tipsCard}>
            <Text style={styles.tipsTitle}>💡 Conseils</Text>
            <Text style={styles.tipsText}>
              {badge.name === 'Mentor' &&
                'Continuez à donner des cours de tutorat pour accumuler des heures.'}
              {badge.name === 'Pédagogue' &&
                'Offrez un excellent service pour recevoir des notes élevées de vos étudiants.'}
              {badge.name === 'Expert Vérifié' &&
                'Soumettez vos documents de vérification dans votre profil de tuteur.'}
              {!['Mentor', 'Pédagogue', 'Expert Vérifié'].includes(badge.name) &&
                'Continuez à utiliser l\'application pour débloquer ce badge.'}
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
  backIconButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  badgeHero: {
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.medium,
  },
  badgeIconLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgeHeroName: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  earnedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  earnedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  lockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  lockedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.small,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  descriptionContainer: {
    gap: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  descriptionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  criteriaCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.small,
  },
  criteriaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  criteriaIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  criteriaTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  criteriaDescription: {
    fontSize: 15,
    color: Colors.textPrimary,
    lineHeight: 22,
  },
  criteriaProgress: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  criteriaProgressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
    textAlign: 'center',
  },
  rewardsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.md,
    ...Shadows.small,
  },
  rewardsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rewardsIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.warning + '08',
    borderRadius: BorderRadius.medium,
    padding: Spacing.md,
  },
  rewardIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  rewardText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  tipsCard: {
    backgroundColor: Colors.accent2 + '08',
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.accent2 + '20',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tipsText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  backButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.md,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
});
