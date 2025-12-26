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
import { Calendar, Clock, MapPin, Video, User } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse } from '@/types/api';
import { PageHeader, TabSelector } from '@/components/PageHeader';

// Separate component for session card to use hooks properly
const SessionCard = ({ session, onPress }: { session: SessionResponse; onPress: () => void }) => {
  const hasTutor = !!session.tutor && !!session.tutor.firstName;
  const now = new Date();
  const startTime = new Date(session.scheduledStart);
  const endTime = new Date(session.scheduledEnd);
  const isOngoing = now >= startTime && now <= endTime;
  
  // Animation for the ongoing dot
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
      return 'Non assignée';
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
      style={styles.sessionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Header: Subject and Status */}
      <View style={styles.cardHeader}>
        <View style={styles.subjectSection}>
          <View style={styles.subjectIcon}>
            <Calendar size={20} color={Colors.primary} strokeWidth={2} />
          </View>
          <View style={styles.subjectInfo}>
            <View style={styles.subjectRow}>
              <Text style={styles.sessionSubject}>{session.subject}</Text>
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

      {/* Class Info */}
      {session.class && (
        <View style={styles.classInfo}>
          <Text style={styles.classLabel}>Classe: </Text>
          <Text style={styles.className}>{session.class.name}</Text>
        </View>
      )}

      {/* Time and Location */}
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

      {/* Footer: Tutor and Price */}
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
            <Text style={styles.priceText}>{Math.round(Number(session.price)).toLocaleString('fr-FR')} €</Text>
          </>
        ) : (
          <Text style={styles.noTutorText}>Aucun tuteur assigné</Text>
        )}
      </View>
    </TouchableOpacity>
  );
};

export default function SessionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past' | 'canceled'>('upcoming');
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [activeTab]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Use the tab parameter for server-side filtering
      let endpoint = '/sessions';
      if (activeTab === 'upcoming') {
        endpoint = '/sessions?tab=upcoming';
      } else if (activeTab === 'past') {
        endpoint = '/sessions?tab=past';
      } else if (activeTab === 'canceled') {
        endpoint = '/sessions?tab=canceled';
      }
      
      const response = await ApiClient.get<{ success: boolean; data: SessionResponse[] }>(endpoint);
      const allSessions = response.data;
      
      // Sessions are already filtered by the backend based on tab parameter
      // Just sort them appropriately
      if (activeTab === 'upcoming') {
        // Sort: closest first (ascending by start time)
        allSessions.sort((a, b) => {
          const aStart = new Date(a.scheduledStart).getTime();
          const bStart = new Date(b.scheduledStart).getTime();
          return aStart - bStart;
        });
      } else {
        // For past and canceled, sort: most recent first (descending)
        allSessions.sort((a, b) => {
          const aStart = new Date(a.scheduledStart).getTime();
          const bStart = new Date(b.scheduledStart).getTime();
          return bStart - aStart;
        });
      }
      
      setSessions(allSessions);
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

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Mes Sessions" 
        subtitle={`${sessions.length} session${sessions.length > 1 ? 's' : ''}`}
        variant="primary"
      />
      
      <TabSelector
        tabs={[
          { key: 'upcoming', label: 'À venir' },
          { key: 'past', label: 'Passées' },
          { key: 'canceled', label: 'Annulées' },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as 'upcoming' | 'past' | 'canceled')}
      />

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
          {sessions.length === 0 ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIconContainer}>
                <Calendar size={48} color={Colors.primary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming' 
                  ? 'Aucune session à venir' 
                  : activeTab === 'past'
                  ? 'Aucune session passée'
                  : 'Aucune session annulée'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Réservez une session avec un tuteur pour commencer'
                  : activeTab === 'past'
                  ? 'Vos sessions terminées apparaîtront ici'
                  : 'Les sessions annulées apparaîtront ici'}
              </Text>
            </View>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => router.push(`/(student)/(tabs)/sessions/${session.id}`)}
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
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  sessionCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.small,
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
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
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
    gap: 8,
  },
  sessionSubject: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  ongoingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.success + '15',
  },
  ongoingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  ongoingText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.success,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  sessionDate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.small,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  classLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  className: {
    fontSize: 12,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
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
