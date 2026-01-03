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
  DollarSign,
  Users,
  Clock,
  TrendingUp,
  ChevronRight,
  CheckCircle,
  BookOpen,
  ShoppingBag,
  Award,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { useAuth } from '@/contexts/auth-context';
import { useNotifications } from '@/hooks/useNotifications';
import { ApiClient, ApiClientClass } from '@/utils/api';
import { SessionResponse, AvailableSessionSuggestion } from '@/types/api';
import { eurToFcfa } from '@/utils/currency';

export default function TutorHomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { notifications, unreadCount, refresh: refreshNotifications } = useNotifications();
  const [pendingSessions, setPendingSessions] = useState<SessionResponse[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState<SessionResponse[]>([]);
  const [availableSessions, setAvailableSessions] = useState<AvailableSessionSuggestion[]>([]);
  const [stats, setStats] = useState({
    pendingCount: 0,
    upcomingCount: 0,
    totalEarnings: 0,
    hoursThisWeek: 0,
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
      const sessionsRes = await ApiClient.get<{ success: boolean; data: SessionResponse[]}>('/sessions');
      const allSessions = sessionsRes.data || [];

      // Load available sessions (non-critical, can fail)
      let availableRes = { data: [] as AvailableSessionSuggestion[] };
      try {
        availableRes = await ApiClient.get<{ success: boolean; data: AvailableSessionSuggestion[] }>('/sessions/available-suggestions?limit=3');
      } catch (error) {
        console.warn('Failed to load available sessions:', error);
      }
      
      const sessionNow = new Date();
      const weekFromNow = new Date(sessionNow.getTime() + 7 * 24 * 60 * 60 * 1000);

      // Filter pending sessions
      const pending = allSessions
        .filter(s => s.status === 'PENDING')
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
        .slice(0, 3);

      setPendingSessions(pending);

      // Filter upcoming confirmed sessions
      const upcoming = allSessions
        .filter(s => {
          const start = new Date(s.scheduledStart);
          return s.status === 'CONFIRMED' && start > sessionNow && start < weekFromNow;
        })
        .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime())
        .slice(0, 3);

      setUpcomingSessions(upcoming);

      // Set available sessions suggestions
      setAvailableSessions(availableRes.data || []);

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

      const completedSessions = allSessions.filter(s => s.status === 'COMPLETED');
      const totalEarnings = completedSessions.reduce((total, s) => total + Number(s.price || 0), 0);

      setStats({
        pendingCount: allSessions.filter(s => s.status === 'PENDING').length,
        upcomingCount: allSessions.filter(s => new Date(s.scheduledStart) > sessionNow && s.status === 'CONFIRMED').length,
        totalEarnings: Math.round(totalEarnings),
        hoursThisWeek: Math.round(hoursThisWeek * 10) / 10,
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
            onPress={() => router.push('/(tutor)/notifications')}
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
              <View style={[styles.statIconContainer, { backgroundColor: Colors.accent2 + '15' }]}>
                <Calendar size={16} color={Colors.accent2} strokeWidth={2.5} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stats.pendingCount}</Text>
                <Text style={styles.statLabel}>En attente</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.success + '15' }]}>
                <CheckCircle size={16} color={Colors.success} strokeWidth={2.5} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stats.upcomingCount}</Text>
                <Text style={styles.statLabel}>Bientôt</Text>
              </View>
            </View>

            <View style={styles.statDivider} />

            <View style={styles.statItem}>
              <View style={[styles.statIconContainer, { backgroundColor: Colors.primary + '15' }]}>
                <Clock size={16} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.statTextContainer}>
                <Text style={styles.statValue}>{stats.hoursThisWeek}h</Text>
                <Text style={styles.statLabel}>Semaine</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Earnings Card */}
        <TouchableOpacity
          style={styles.earningsCard}
          onPress={() => router.push('/(tutor)/(tabs)/wallet')}
        >
          <View style={styles.earningsContent}>
            <View style={styles.earningsIconContainer}>
              <DollarSign size={28} color={Colors.white} strokeWidth={2.5} />
            </View>
            <View style={styles.earningsInfo}>
              <Text style={styles.earningsLabel}>Revenus totaux</Text>
              <Text style={styles.earningsValue}>{eurToFcfa(stats.totalEarnings).toLocaleString('fr-FR')} FCFA</Text>
            </View>
          </View>
          <ChevronRight size={24} color={Colors.white} />
        </TouchableOpacity>

        {/* Services Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Services</Text>
          <View style={styles.servicesGrid}>
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(tutor)/(tabs)/sessions')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.primary + '15' }]}>
                <Calendar size={24} color={Colors.primary} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Sessions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(tutor)/(tabs)/marketplace')}
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
              onPress={() => router.push('/(tutor)/(tabs)/students')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.accent2 + '15' }]}>
                <Users size={24} color={Colors.accent2} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Étudiants</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(tutor)/availability')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.success + '15' }]}>
                <Clock size={24} color={Colors.success} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Horaires</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(tutor)/requests')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.error + '15' }]}>
                <Bell size={24} color={Colors.error} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Demandes</Text>
            </TouchableOpacity>

            {/* TODO: Implement consortium feature
            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(tutor)/consortium')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.secondary + '15' }]}>
                <Users size={24} color={Colors.secondary} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Groupes</Text>
            </TouchableOpacity>
            */}

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(tutor)/(tabs)/wallet')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.success + '15' }]}>
                <DollarSign size={24} color={Colors.success} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Wallet</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.serviceCard}
              onPress={() => router.push('/(tutor)/(tabs)/badges')}
            >
              <View style={[styles.serviceIcon, { backgroundColor: Colors.accent2 + '15' }]}>
                <Award size={24} color={Colors.accent2} strokeWidth={2} />
              </View>
              <Text style={styles.serviceText}>Badges</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Pending Sessions */}
        {pendingSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sessions en attente</Text>
              <TouchableOpacity onPress={() => router.push('/(tutor)/(tabs)/sessions')}>
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            {pendingSessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={[styles.sessionCard, styles.pendingSessionCard]}
                onPress={() => router.push(`/(tutor)/(tabs)/sessions/${session.id}`)}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                  <View style={styles.pendingBadge}>
                    <Text style={styles.pendingBadgeText}>Nouveau</Text>
                  </View>
                </View>
                <Text style={styles.sessionTime}>{formatSessionTime(session)}</Text>
                {session.class && (
                  <Text style={styles.sessionClass}>
                    Classe: {session.class.name} ({session.class._count?.members || 0} étudiant{(session.class._count?.members || 0) > 1 ? 's' : ''})
                  </Text>
                )}
                <View style={styles.sessionActions}>
                  <Text style={styles.actionPrompt}>Confirmer ou refuser →</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Upcoming Sessions */}
        {upcomingSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Prochaines sessions</Text>
              <TouchableOpacity onPress={() => router.push('/(tutor)/(tabs)/sessions')}>
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            {upcomingSessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={styles.sessionCard}
                onPress={() => router.push(`/(tutor)/(tabs)/sessions/${session.id}`)}
              >
                <View style={styles.sessionHeader}>
                  <Text style={styles.sessionSubject}>{session.subject}</Text>
                  <ChevronRight size={20} color={Colors.textSecondary} />
                </View>
                <Text style={styles.sessionTime}>{formatSessionTime(session)}</Text>
                {session.class && (
                  <Text style={styles.sessionClass}>
                    Classe: {session.class.name} ({session.class._count?.members || 0} étudiant{(session.class._count?.members || 0) > 1 ? 's' : ''})
                  </Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Available Sessions Suggestions */}
        {availableSessions.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Sessions disponibles</Text>
              <TouchableOpacity onPress={() => router.push('/(tutor)/(tabs)/sessions')}>
                <Text style={styles.seeAllText}>Voir plus</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.suggestionSubtitle}>
              Ces sessions correspondent à vos compétences
            </Text>

            {availableSessions.map(session => (
              <TouchableOpacity
                key={session.id}
                style={styles.availableSessionCard}
                onPress={() => router.push(`/(tutor)/(tabs)/sessions/${session.id}`)}
              >
                <View style={styles.availableSessionHeader}>
                  <View style={styles.availableSessionIcon}>
                    <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.availableSessionInfo}>
                    <Text style={styles.availableSessionSubject}>{session.subject}</Text>
                    <Text style={styles.availableSessionClass}>{session.class.name}</Text>
                    <View style={styles.availableSessionMeta}>
                      <Text style={styles.availableSessionTime}>
                        {new Date(session.scheduledStart).toLocaleDateString('fr-FR', {
                          weekday: 'short',
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </Text>
                      <Text style={styles.availableSessionStudents}>
                        {session.class._count.members} étudiant{session.class._count.members > 1 ? 's' : ''}
                      </Text>
                    </View>
                  </View>
                  <ChevronRight size={20} color={Colors.textSecondary} />
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Recent Notifications */}
        {notifications.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Notifications récentes</Text>
              <TouchableOpacity onPress={() => router.push('/(tutor)/notifications')}>
                <Text style={styles.seeAllText}>Tout voir</Text>
              </TouchableOpacity>
            </View>

            {notifications.slice(0, 3).map(notification => (
              <TouchableOpacity
                key={notification.id}
                style={[styles.notificationCard, !notification.isRead && styles.notificationUnread]}
                onPress={() => router.push('/(tutor)/notifications')}
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
  statsContainer: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    ...Shadows.small,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  statTextContainer: {
    gap: 2,
  },
  statDivider: {
    width: 1,
    height: 36,
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
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 20,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontWeight: '600',
    lineHeight: 12,
  },
  earningsCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.medium,
  },
  earningsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  earningsIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  earningsInfo: {
    gap: 4,
  },
  earningsLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '600',
  },
  earningsValue: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: -0.5,
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
  pendingSessionCard: {
    borderWidth: 2,
    borderColor: Colors.accent2 + '40',
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
    flex: 1,
  },
  pendingBadge: {
    backgroundColor: Colors.accent2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  pendingBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sessionTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  sessionClass: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sessionActions: {
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  actionPrompt: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
  suggestionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: -8,
  },
  availableSessionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    ...Shadows.small,
  },
  availableSessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  availableSessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availableSessionInfo: {
    flex: 1,
    gap: 4,
  },
  availableSessionSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  availableSessionClass: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  availableSessionMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  availableSessionTime: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  availableSessionStudents: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
