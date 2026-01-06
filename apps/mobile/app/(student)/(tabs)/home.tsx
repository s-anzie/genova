import React, { useState, useEffect, useRef } from 'react';
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
  ShoppingBag,
  Users,
  Target,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { StatsCard } from '@/components/StatsCard';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import { ApiClient, ApiClientClass } from '@/utils/api';
import { SessionResponse, TutorSuggestion } from '@/types/api';
import { eurToFcfa } from '@/utils/currency';
import { getSubjectName } from '@/utils/session-helpers';

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
  const lastLoadTimeRef = useRef<number>(0);
  const isLoadingRef = useRef(false);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    // Prevent concurrent requests
    if (isLoadingRef.current) {
      console.log('⚠️ Dashboard already loading, skipping...');
      return;
    }

    // Throttle requests - don't load more than once every 5 seconds
    const now = Date.now();
    const timeSinceLastLoad = now - lastLoadTimeRef.current;
    if (timeSinceLastLoad < 5000 && !refreshing) {
      console.log('⚠️ Throttling dashboard request (last load was', timeSinceLastLoad, 'ms ago)');
      return;
    }

    try {
      isLoadingRef.current = true;
      lastLoadTimeRef.current = now;
      setLoading(true);
      
      // Load sessions first (critical)
      const sessionsRes = await ApiClient.get<{ success: boolean; data: SessionResponse[] }>('/sessions');
      const allSessions = sessionsRes.data || [];

      // Load wallet balance (non-critical, can fail)
      let walletRes = { 
        success: true,
        data: { totalBalance: 0, availableBalance: 0, pendingBalance: 0 } 
      };
      try {
        walletRes = await ApiClient.get<{ success: boolean; data: { totalBalance: number; availableBalance: number; pendingBalance: number } }>('/payments/wallet');
      } catch (error) {
        console.warn('Failed to load wallet balance:', error);
      }

      const sessionNow = new Date();
      const weekFromNow = new Date(sessionNow.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Filter upcoming sessions
      const upcoming = allSessions
        .filter(s => {
          const start = new Date(s.scheduledStart);
          return s.status === 'CONFIRMED' && start > sessionNow && start < weekFromNow;
        })
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
        .slice(0, 3);

      setUpcomingSessions(upcoming);

      // Find unassigned sessions
      const unassigned = allSessions.find(s => 
        s.status === 'PENDING' && 
        !s.tutorId && 
        new Date(s.scheduledStart) > sessionNow
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
      const weekStart = new Date(sessionNow);
      weekStart.setDate(sessionNow.getDate() - sessionNow.getDay());
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
        upcomingCount: allSessions.filter(s => new Date(s.scheduledStart) > sessionNow && s.status === 'CONFIRMED').length,
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
        walletBalance: Math.round(walletRes.data.totalBalance || 0),
      });
    } catch (error: any) {
      // Ignore logout errors - they're expected during logout flow
      if (ApiClientClass.isLogoutError(error)) {
        console.log('⚠️ Dashboard load skipped: logout in progress');
        return;
      }
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
      isLoadingRef.current = false;
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
        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(student)/search')}
          activeOpacity={0.7}
        >
          <View style={styles.searchIconContainer}>
            <Search size={20} color={Colors.white} strokeWidth={2.5} />
          </View>
          <View style={styles.searchTextContainer}>
            <Text style={styles.searchPlaceholder}>Rechercher un tuteur</Text>
            <Text style={styles.searchSubtext}>Matières, niveaux, disponibilités...</Text>
          </View>
          <ChevronRight size={18} color={Colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>

        {/* Announcement Banner */}
        <TouchableOpacity
          style={styles.announcementBanner}
          activeOpacity={0.8}
          onPress={() => {
            // Action à définir (navigation, modal, etc.)
          }}
        >
          <View style={styles.bannerContent}>
            <View style={styles.bannerIconContainer}>
              <Star size={24} color={Colors.warning} fill={Colors.warning} strokeWidth={2} />
            </View>
            <View style={styles.bannerTextContainer}>
              <Text style={styles.bannerTitle}>Offre spéciale !</Text>
              <Text style={styles.bannerDescription}>
                Profitez de -20% sur votre première session
              </Text>
            </View>
            <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
          </View>
        </TouchableOpacity>

        {/* Stats Card */}
        <StatsCard
          mode="expanded"
          stats={[
            {
              icon: Calendar,
              iconColor: Colors.primary,
              value: stats.upcomingCount,
              label: 'Bientôt',
            },
            {
              icon: Clock,
              iconColor: Colors.accent2,
              value: `${stats.hoursThisWeek}h`,
              label: 'Semaine',
            },
            {
              icon: BookOpen,
              iconColor: Colors.success,
              value: stats.totalSessions,
              label: 'Total',
            },
          ]}
        />

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
              <Text style={styles.walletBalance}>{eurToFcfa(stats.walletBalance).toLocaleString('fr-FR')} FCFA</Text>
            </View>
            <ChevronRight size={24} color={Colors.white} />
          </TouchableOpacity>
        )}

        {/* Services Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(student)/(tabs)/marketplace')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.accent1 + '15' }]}>
                <ShoppingBag size={24} color={Colors.accent1} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Boutique</Text>
              <View style={styles.newBadge}>
                <Text style={styles.newBadgeText}>NEW</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(student)/(tabs)/learn/classes')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.secondary + '15' }]}>
                <Users size={24} color={Colors.secondary} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Classes</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(student)/(tabs)/learn/sessions')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Calendar size={24} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(student)/(tabs)/learn/progress')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.success + '15' }]}>
                <TrendingUp size={24} color={Colors.success} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Progrès</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(student)/badges')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.accent2 + '15' }]}>
                <Award size={24} color={Colors.accent2} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Badges</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(student)/wallet')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.success + '15' }]}>
                <Wallet size={24} color={Colors.success} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(student)/(tabs)/learn/goals')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.error + '15' }]}>
                <Target size={24} color={Colors.error} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Objectifs</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Tutor Suggestions for Unassigned Sessions */}
        {tutorSuggestions.length > 0 && unassignedSessionId && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tuteurs suggérés</Text>
              <TouchableOpacity onPress={() => router.push('/(student)/search')}>
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
                    <Text style={styles.tutorRate}>{eurToFcfa(tutor.hourlyRate).toLocaleString('fr-FR')} FCFA/h</Text>
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
              <TouchableOpacity onPress={() => router.push('/(student)/(tabs)/learn/sessions')}>
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            {upcomingSessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => router.push(`/(student)/sessions/${session.id}`)}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionSubject}>{getSubjectName(session)}</Text>
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
                  <Text style={[
                    styles.notificationTitle,
                    !notification.isRead && styles.notificationTitleUnread
                  ]}>
                    {notification.title}
                  </Text>
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
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
    borderWidth: 1.5,
    borderColor: Colors.primary + '20',
    ...Shadows.small,
  },
  searchIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchTextContainer: {
    flex: 1,
    gap: 1,
  },
  searchPlaceholder: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  searchSubtext: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  announcementBanner: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  bannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  bannerIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bannerTextContainer: {
    flex: 1,
    gap: 2,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.3,
  },
  bannerDescription: {
    fontSize: 12,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 16,
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
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  serviceCard: {
    width: '23%',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    alignItems: 'center',
    gap: 6,
    ...Shadows.small,
    position: 'relative',
  },
  serviceIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  serviceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 14,
  },
  newBadge: {
    position: 'absolute',
    top: -4,
    right: 4,
    backgroundColor: Colors.error,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  newBadgeText: {
    fontSize: 8,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.5,
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
    marginBottom: Spacing.sm,
    ...Shadows.small,
  },
  notificationUnread: {
    backgroundColor: Colors.bgCream,
    ...Shadows.medium,
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
  notificationTitleUnread: {
    fontWeight: '700',
    color: Colors.primary,
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
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: Colors.white,
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
