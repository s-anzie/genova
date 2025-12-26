import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Bell,
  Calendar,
  TrendingUp,
  Search,
  BookOpen,
  Clock,
  Award,
  ChevronRight,
  Wallet,
  User,
  Star,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import { ApiClient } from '@/utils/api';
import { SessionResponse, TutorSuggestion } from '@/types/api';

export default function StudentHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, refresh: refreshNotifications } = useNotifications();
  const [upcomingSessions, setUpcomingSessions] = useState<SessionResponse[]>([]);
  const [tutorSuggestions, setTutorSuggestions] = useState<TutorSuggestion[]>([]);
  const [unassignedSessionId, setUnassignedSessionId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalSessions: 0,
    upcomingCount: 0,
    hoursThisWeek: 0,
    walletBalance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const [sessionsRes, walletRes] = await Promise.all([
        ApiClient.get<{ success: boolean; data: SessionResponse[] }>('/sessions'),
        ApiClient.get<{ success: boolean; data: { totalBalance: number; availableBalance: number; pendingBalance: number } }>('/payments/wallet').catch(() => ({ 
          success: true,
          data: { totalBalance: 0, availableBalance: 0, pendingBalance: 0 } 
        })),
      ]);
      
      const allSessions = sessionsRes.data;

      const now = new Date();
      const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Filter upcoming sessions
      const upcoming = allSessions
        .filter(s => {
          const start = new Date(s.scheduledStart);
          return s.status === 'CONFIRMED' && start > now && start < weekFromNow;
        })
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
        .slice(0, 3);

      setUpcomingSessions(upcoming);

      // Find unassigned sessions
      const unassigned = allSessions.find(s => 
        s.status === 'PENDING' && 
        !s.tutorId && 
        new Date(s.scheduledStart) > now
      );

      if (unassigned) {
        setUnassignedSessionId(unassigned.id);
        // Load tutor suggestions for this session
        try {
          const suggestionsRes = await ApiClient.get<{ success: boolean; data: TutorSuggestion[] }>(
            `/tutors/suggestions/${unassigned.id}?limit=3`
          );
          setTutorSuggestions(suggestionsRes.data);
        } catch (error) {
          console.error('Failed to load tutor suggestions:', error);
          setTutorSuggestions([]);
        }
      } else {
        setUnassignedSessionId(null);
        setTutorSuggestions([]);
      }

      // Calculate stats
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - now.getDay());
      weekStart.setHours(0, 0, 0, 0);

      const sessionsThisWeek = allSessions.filter(s => {
        const start = new Date(s.scheduledStart);
        return start >= weekStart && s.status !== 'CANCELLED';
      });

      const hoursThisWeek = sessionsThisWeek.reduce((total, s) => {
        const duration = (new Date(s.scheduledEnd).getTime() - new Date(s.scheduledStart).getTime()) / (1000 * 60 * 60);
        return total + duration;
      }, 0);

      setStats({
        totalSessions: allSessions.filter(s => s.status !== 'CANCELLED').length,
        upcomingCount: allSessions.filter(s => new Date(s.scheduledStart) > now && s.status === 'CONFIRMED').length,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        walletBalance: Math.round(walletRes.data.totalBalance || 0),
      });
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    refreshNotifications();
  };

  const formatSessionTime = (session: SessionResponse) => {
    const start = new Date(session.scheduledStart);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let dateStr = '';
    if (start.toDateString() === today.toDateString()) {
      dateStr = "Aujourd'hui";
    } else if (start.toDateString() === tomorrow.toDateString()) {
      dateStr = 'Demain';
    } else {
      dateStr = start.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
    }

    const timeStr = start.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} à ${timeStr}`;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Accueil" variant="primary" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title={`${getGreeting()}, ${user?.firstName}!`}
        variant="primary"
        rightElement={
          <TouchableOpacity 
            style={styles.notificationButton}
            onPress={() => router.push('/(student)/notifications')}
          >
            <Bell size={24} color={Colors.white} strokeWidth={2} />
            {unreadCount > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Card - Unified */}
        <View style={styles.statsCard}>
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.primary + '15' }]}>
                <Calendar size={18} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.upcomingCount}</Text>
              <Text style={styles.statLabel}>À venir</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.accent2 + '15' }]}>
                <Clock size={18} color={Colors.accent2} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.hoursThisWeek}h</Text>
              <Text style={styles.statLabel}>Cette semaine</Text>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.success + '15' }]}>
                <BookOpen size={18} color={Colors.success} strokeWidth={2.5} />
              </View>
              <Text style={styles.statValue}>{stats.totalSessions}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
          </View>
        </View>

        {/* Wallet Balance Card - Only show if balance > 0 */}
        {stats.walletBalance > 0 && (
          <TouchableOpacity
            style={styles.walletCard}
            onPress={() => router.push('/(student)/wallet')}
          >
            <View style={styles.walletIconContainer}>
              <Wallet size={24} color={Colors.white} strokeWidth={2} />
            </View>
            <View style={styles.walletContent}>
              <Text style={styles.walletLabel}>Solde du portefeuille</Text>
              <Text style={styles.walletBalance}>{stats.walletBalance} €</Text>
            </View>
            <ChevronRight size={24} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/(tabs)/search')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Search size={24} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.actionText}>Trouver un tuteur</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/(tabs)/sessions')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.accent2 + '15' }]}>
                <Calendar size={24} color={Colors.accent2} strokeWidth={2} />
              </View>
              <Text style={styles.actionText}>Mes sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/(tabs)/progress')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.success + '15' }]}>
                <TrendingUp size={24} color={Colors.success} strokeWidth={2} />
              </View>
              <Text style={styles.actionText}>Mes progrès</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionCard}
              onPress={() => router.push('/(student)/(tabs)/progress/goals')}
            >
              <View style={[styles.actionIcon, { backgroundColor: Colors.error + '15' }]}>
                <Award size={24} color={Colors.error} strokeWidth={2} />
              </View>
              <Text style={styles.actionText}>Mes objectifs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tutor Suggestions for Unassigned Sessions */}
        {tutorSuggestions.length > 0 && unassignedSessionId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tuteurs suggérés</Text>
              <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/search')}>
                <Text style={styles.seeAllText}>Voir plus</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.suggestionSubtitle}>
              Pour votre session non assignée
            </Text>

            {tutorSuggestions.map(tutor => (
              <TouchableOpacity
                key={tutor.id}
                style={styles.tutorCard}
                onPress={() => router.push(`/(student)/tutors/${tutor.userId}`)}
              >
                <View style={styles.tutorAvatar}>
                  <User size={24} color={Colors.primary} strokeWidth={2} />
                </View>
                <View style={styles.tutorInfo}>
                  <Text style={styles.tutorName}>
                    {tutor.firstName} {tutor.lastName}
                  </Text>
                  <View style={styles.tutorMeta}>
                    <View style={styles.ratingContainer}>
                      <Star size={14} color={Colors.warning} fill={Colors.warning} strokeWidth={2} />
                      <Text style={styles.ratingText}>
                        {tutor.averageRating.toFixed(1)} ({tutor.totalReviews})
                      </Text>
                    </View>
                    <Text style={styles.tutorRate}>{tutor.hourlyRate}€/h</Text>
                  </View>
                  <Text style={styles.tutorSubjects} numberOfLines={1}>
                    {tutor.subjects.join(', ')}
                  </Text>
                </View>
                <ChevronRight size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prochaines sessions</Text>
              <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/sessions')}>
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            {upcomingSessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => router.push(`/(student)/(tabs)/sessions/${session.id}`)}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                  <ChevronRight size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.sessionTime}>{formatSessionTime(session)}</Text>
                {session.tutor && (
                  <Text style={styles.sessionTutor}>
                    Avec {session.tutor.firstName} {session.tutor.lastName}
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notifications récentes</Text>
              <TouchableOpacity onPress={() => router.push('/(student)/notifications')}>
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            {notifications.slice(0, 3).map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, !notification.isRead && styles.notificationUnread]}
                onPress={() => router.push('/(student)/notifications')}
              >
                <View style={styles.notificationContent}>
                  <Text style={styles.notificationTitle}>{notification.title}</Text>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {new Date(notification.createdAt).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                {!notification.isRead && <View style={styles.unreadDot} />}
              </TouchableOpacity>
            ))}
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
  notificationButton: {
    position: 'relative',
    padding: 8,
  },
  notificationBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  notificationBadgeText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.xs,
  },
  statDivider: {
    width: 1,
    height: 50,
    backgroundColor: Colors.border,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.xs,
    ...Shadows.small,
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textAlign: 'center',
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  quickActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  actionCard: {
    width: '48%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.sm,
    ...Shadows.small,
  },
  actionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.xs,
    ...Shadows.small,
  },
  sessionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  sessionTutor: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  notificationCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.small,
  },
  notificationUnread: {
    backgroundColor: Colors.primary + '08',
  },
  notificationContent: {
    flex: 1,
    gap: 4,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  notificationMessage: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  notificationTime: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  walletCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.medium,
  },
  walletIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  walletContent: {
    flex: 1,
    gap: 4,
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
  },
  walletBalance: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  suggestionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  tutorCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.small,
  },
  tutorAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorInfo: {
    flex: 1,
    gap: 4,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  tutorMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  tutorRate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  tutorSubjects: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
});
