import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  StyleSheet,
  Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Video, User, Filter, ChevronDown } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse } from '@/types/api';
import { formatEurAsFcfa } from '@/utils/currency';
import { getSubjectName, getClassName } from '@/utils/session-helpers';

type FilterType = 'all' | 'upcoming' | 'past' | 'canceled';
type SortType = 'date-asc' | 'date-desc' | 'subject' | 'price';

// Separate component for session card to use hooks properly
const SessionCard = ({ session, onPress }: { session: SessionResponse; onPress: () => void }) => {
  const hasTutor = !!session.tutor && !!session.tutor.firstName;
  const now = new Date();
  const startTime = new Date(session.scheduledStart);
  const endTime = new Date(session.scheduledEnd);
  const isOngoing = now >= startTime && now <= endTime;
  
  const fifteenMinutesAfterEnd = new Date(endTime.getTime() + 15 * 60 * 1000);
  const needsCheckIn = session.status === 'CONFIRMED' && now >= startTime && now <= fifteenMinutesAfterEnd;
  
  const hoursUntilStart = (startTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const isUrgent = !hasTutor && hoursUntilStart < 24 && hoursUntilStart > 0;
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    if (isOngoing) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.5,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [isOngoing]);

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      day: 'numeric', 
      month: 'short' 
    });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return Colors.accent2;
      case 'CONFIRMED':
        return Colors.success;
      case 'COMPLETED':
        return Colors.primary;
      case 'CANCELLED':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string, hasTutor: boolean) => {
    if (!hasTutor) {
      return 'Tuteur non assigné';
    }
    switch (status) {
      case 'PENDING':
        return 'En attente';
      case 'CONFIRMED':
        return 'Confirmé';
      case 'COMPLETED':
        return 'Terminé';
      case 'CANCELLED':
        return 'Annulé';
      default:
        return status;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.sessionCard,
        isUrgent && styles.urgentCard,
        needsCheckIn && styles.checkInNeededCard,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {needsCheckIn && (
        <View style={styles.checkInBadge}>
          <Text style={styles.checkInText}>✓ Confirmer présence</Text>
        </View>
      )}

      {isUrgent && (
        <View style={styles.urgentBadge}>
          <Text style={styles.urgentText}>⚠️ URGENT</Text>
        </View>
      )}

      <View style={styles.cardHeader}>
        <View style={styles.subjectSection}>
          <View style={styles.subjectIcon}>
            <Calendar size={20} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.subjectInfo}>
            <View style={styles.subjectRow}>
              <Text style={styles.sessionSubject}>{getSubjectName(session)}</Text>
              {isOngoing && (
                <View style={styles.ongoingBadge}>
                  <Animated.View style={[styles.ongoingDot, { transform: [{ scale: pulseAnim }] }]} />
                  <Text style={styles.ongoingText}>En cours</Text>
                </View>
              )}
            </View>
            <Text style={styles.sessionDate}>{formatDate(session.scheduledStart)}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: `${getStatusColor(hasTutor ? session.status : 'PENDING')}15` }]}>
          <Text style={[styles.statusText, { color: getStatusColor(hasTutor ? session.status : 'PENDING') }]}>
            {getStatusLabel(session.status, hasTutor)}
          </Text>
        </View>
      </View>

      {session.class && (
        <View style={styles.classInfo}>
          <Text style={styles.classLabel}>Classe: </Text>
          <Text style={styles.className}>{getClassName(session)}</Text>
        </View>
      )}

      <View style={styles.detailsSection}>
        <View style={styles.detailRow}>
          <Clock size={16} color={Colors.textSecondary} strokeWidth={2} />
          <Text style={styles.detailText}>
            {formatTime(session.scheduledStart)} - {formatTime(session.scheduledEnd)}
          </Text>
        </View>
        
        {session.location && (
          <View style={styles.detailRow}>
            <MapPin size={16} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.detailText} numberOfLines={1}>
              {session.location}
            </Text>
          </View>
        )}
        
        {session.onlineMeetingLink && (
          <View style={styles.detailRow}>
            <Video size={16} color={Colors.textSecondary} strokeWidth={2} />
            <Text style={styles.detailText}>En ligne</Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        {hasTutor ? (
          <>
            <View style={styles.tutorSection}>
              <View style={styles.tutorAvatar}>
                <User size={14} color={Colors.white} strokeWidth={2} />
              </View>
              <Text style={styles.tutorName} numberOfLines={1}>
                {session.tutor!.firstName} {session.tutor!.lastName}
              </Text>
            </View>
            <Text style={styles.priceText}>{formatEurAsFcfa(Number(session.price))}</Text>
          </>
        ) : (
          <Text style={styles.noTutorText}>Aucun tuteur assigné</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function SessionsTab() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterType>('all');
  const [sortBy, setSortBy] = useState<SortType>('date-asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ success: boolean; data: SessionResponse[] }>('/sessions');
      setSessions(response.data);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSessions();
    setRefreshing(false);
  };

  // Filter sessions based on selected filter
  const getFilteredSessions = () => {
    const now = new Date();
    
    let filtered = sessions;
    
    switch (filter) {
      case 'upcoming':
        filtered = sessions.filter(s => {
          const start = new Date(s.scheduledStart);
          return start > now && s.status !== 'CANCELLED';
        });
        break;
      case 'past':
        filtered = sessions.filter(s => {
          const end = new Date(s.scheduledEnd);
          return end < now && s.status !== 'CANCELLED';
        });
        break;
      case 'canceled':
        filtered = sessions.filter(s => s.status === 'CANCELLED');
        break;
      default:
        filtered = sessions;
    }

    // Sort sessions
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date-asc':
          return new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime();
        case 'date-desc':
          return new Date(b.scheduledStart).getTime() - new Date(a.scheduledStart).getTime();
        case 'subject':
          return a.subject.localeCompare(b.subject);
        case 'price':
          return Number(b.price) - Number(a.price);
        default:
          return 0;
      }
    });
  };

  const filteredSessions = getFilteredSessions();

  const filters = [
    { key: 'all' as FilterType, label: 'Toutes', count: sessions.length },
    { 
      key: 'upcoming' as FilterType, 
      label: 'À venir', 
      count: sessions.filter(s => {
        const start = new Date(s.scheduledStart);
        return start > new Date() && s.status !== 'CANCELLED';
      }).length 
    },
    { 
      key: 'past' as FilterType, 
      label: 'Passées', 
      count: sessions.filter(s => {
        const end = new Date(s.scheduledEnd);
        return end < new Date() && s.status !== 'CANCELLED';
      }).length 
    },
    { 
      key: 'canceled' as FilterType, 
      label: 'Annulées', 
      count: sessions.filter(s => s.status === 'CANCELLED').length 
    },
  ];

  const sortOptions = [
    { key: 'date-asc' as SortType, label: 'Date (plus proche)' },
    { key: 'date-desc' as SortType, label: 'Date (plus loin)' },
    { key: 'subject' as SortType, label: 'Matière (A-Z)' },
    { key: 'price' as SortType, label: 'Prix (décroissant)' },
  ];

  return (
    <View style={styles.container}>
      {/* Compact Header with Filters and Sort */}
      <View style={styles.headerContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filtersRow}
        >
          {filters.map((f) => (
            <TouchableOpacity
              key={f.key}
              style={[
                styles.filterChip,
                filter === f.key && styles.filterChipActive
              ]}
              onPress={() => setFilter(f.key)}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.filterChipText,
                filter === f.key && styles.filterChipTextActive
              ]}>
                {f.label}
              </Text>
              <Text style={[
                styles.filterChipCount,
                filter === f.key && styles.filterChipCountActive
              ]}>
                {f.count}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        
        <TouchableOpacity 
          style={styles.sortButton}
          onPress={() => setShowSortMenu(!showSortMenu)}
          activeOpacity={0.7}
        >
          <Filter size={16} color={Colors.textSecondary} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Sort Menu Dropdown */}
      {showSortMenu && (
        <View style={styles.sortMenu}>
          {sortOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.sortOption,
                sortBy === option.key && styles.sortOptionActive
              ]}
              onPress={() => {
                setSortBy(option.key);
                setShowSortMenu(false);
              }}
              activeOpacity={0.7}
            >
              <Text style={[
                styles.sortOptionText,
                sortBy === option.key && styles.sortOptionTextActive
              ]}>
                {option.label}
              </Text>
              {sortBy === option.key && (
                <View style={styles.sortOptionCheck} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Chargement...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl 
              refreshing={refreshing} 
              onRefresh={onRefresh}
              tintColor={Colors.primary}
              colors={[Colors.primary]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {filteredSessions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Calendar size={48} color={Colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {filter === 'all' 
                  ? 'Aucune session' 
                  : filter === 'upcoming'
                  ? 'Aucune session à venir'
                  : filter === 'past'
                  ? 'Aucune session passée'
                  : 'Aucune session annulée'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {filter === 'all' || filter === 'upcoming'
                  ? 'Réservez une session avec un tuteur pour commencer'
                  : filter === 'past'
                  ? 'Vos sessions terminées apparaîtront ici'
                  : 'Les sessions annulées apparaîtront ici'}
              </Text>
            </View>
          ) : (
            filteredSessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => router.push(`/(student)/sessions/${session.id}`)}
              />
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    paddingVertical: 10,
    paddingLeft: Spacing.md,
    paddingRight: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filtersRow: {
    gap: 8,
    paddingRight: Spacing.sm,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.bgSecondary,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  filterChipTextActive: {
    color: Colors.white,
  },
  filterChipCount: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  filterChipCountActive: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  sortButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.bgSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  sortMenu: {
    backgroundColor: Colors.white,
    marginHorizontal: Spacing.md,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.medium,
    ...Shadows.medium,
    overflow: 'hidden',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sortOptionActive: {
    backgroundColor: Colors.primary + '08',
  },
  sortOptionText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  sortOptionTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  sortOptionCheck: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: Spacing.md,
  },
  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.small,
  },
  urgentCard: {
    borderWidth: 2,
    borderColor: Colors.error,
    backgroundColor: Colors.error + '05',
  },
  checkInNeededCard: {
    borderWidth: 2,
    borderColor: Colors.success,
    backgroundColor: Colors.success + '05',
  },
  checkInBadge: {
    position: 'absolute',
    top: -8,
    right: Spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.success,
    zIndex: 10,
    ...Shadows.small,
  },
  checkInText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  urgentBadge: {
    position: 'absolute',
    top: -8,
    left: Spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.error,
    zIndex: 10,
    ...Shadows.small,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.white,
    letterSpacing: 0.3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  subjectSection: {
    flex: 1,
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  subjectIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
    gap: 2,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  sessionSubject: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.success + '15',
  },
  ongoingDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  ongoingText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sessionDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.small,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.bgSecondary,
    borderRadius: BorderRadius.small,
    alignSelf: 'flex-start',
  },
  classLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  className: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  detailsSection: {
    gap: 6,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
    flex: 1,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  tutorSection: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tutorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 7,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
  },
  noTutorText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    fontStyle: 'italic',
    flex: 1,
  },
  priceText: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
  },
});
