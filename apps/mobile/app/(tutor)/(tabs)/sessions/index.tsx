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
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Video, Users, CheckCircle, XCircle } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse } from '@/types/api';
import { PageHeader, TabSelector } from '@/components/PageHeader';
import { formatEurAsFcfa } from '@/utils/currency';

// Separate component for session card to use hooks properly
const SessionCard = ({ 
  session, 
  onPress, 
  showAcceptButton,
  onActionComplete 
}: { 
  session: SessionResponse; 
  onPress: () => void; 
  showAcceptButton?: boolean;
  onActionComplete?: () => void;
}) => {
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
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // Check if it's today
    if (d.toDateString() === today.toDateString()) {
      return "Aujourd'hui";
    }
    // Check if it's tomorrow
    if (d.toDateString() === tomorrow.toDateString()) {
      return "Demain";
    }
    
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getDuration = () => {
    const start = new Date(session.scheduledStart);
    const end = new Date(session.scheduledEnd);
    const durationMs = end.getTime() - start.getTime();
    const hours = Math.floor(durationMs / (1000 * 60 * 60));
    const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0 && minutes > 0) {
      return `${hours}h${minutes}`;
    } else if (hours > 0) {
      return `${hours}h`;
    } else {
      return `${minutes}min`;
    }
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

  const getStatusLabel = (status: string) => {
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

  const handleAccept = async (e: any) => {
    e.stopPropagation();
    try {
      // Assign tutor to session and confirm
      await ApiClient.put(`/sessions/${session.id}`, { tutorId: 'current' });
      await ApiClient.put(`/sessions/${session.id}/status`, { status: 'CONFIRMED' });
      Alert.alert('Succès', 'Session acceptée avec succès', [
        { text: 'OK', onPress: () => onActionComplete?.() }
      ]);
    } catch (error) {
      console.error('Failed to accept session:', error);
      Alert.alert('Erreur', 'Impossible d\'accepter la session');
    }
  };

  return (
    <TouchableOpacity
      style={styles.sessionCard}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Status Badge - Top Right */}
      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
        <Text style={styles.statusText}>{getStatusLabel(session.status)}</Text>
      </View>

      {/* Ongoing Badge - Top Left */}
      {isOngoing && (
        <View style={styles.ongoingBadgeTop}>
          <Animated.View style={[styles.ongoingDot, { transform: [{ scale: pulseAnim }] }]} />
          <Text style={styles.ongoingText}>EN COURS</Text>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.cardContent}>
        {/* Date Section */}
        <View style={styles.dateSection}>
          <Calendar size={18} color={Colors.primary} strokeWidth={2.5} />
          <Text style={styles.dateText}>{formatDate(session.scheduledStart)}</Text>
        </View>

        {/* Subject - Large and prominent */}
        <Text style={styles.sessionSubject}>{session.subject}</Text>

        {/* Class Info */}
        {session.class && (
          <View style={styles.classInfoRow}>
            <View style={styles.classIconWrapper}>
              <Users size={14} color={Colors.primary} strokeWidth={2} />
            </View>
            <Text style={styles.classText}>{session.class.name}</Text>
            {session.class._count && (
              <View style={styles.studentBadge}>
                <Text style={styles.studentBadgeText}>
                  {session.class._count.members} étudiant{session.class._count.members > 1 ? 's' : ''}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Divider */}
        <View style={styles.divider} />

        {/* Time and Location Grid */}
        <View style={styles.detailsGrid}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconCircle}>
              <Clock size={14} color={Colors.primary} strokeWidth={2} />
            </View>
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Horaire</Text>
              <Text style={styles.detailValue}>
                {formatTime(session.scheduledStart)} - {formatTime(session.scheduledEnd)}
              </Text>
              <Text style={styles.detailSubValue}>Durée: {getDuration()}</Text>
            </View>
          </View>

          {(session.location || session.onlineMeetingLink) && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconCircle}>
                {session.onlineMeetingLink ? (
                  <Video size={14} color={Colors.primary} strokeWidth={2} />
                ) : (
                  <MapPin size={14} color={Colors.primary} strokeWidth={2} />
                )}
              </View>
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Lieu</Text>
                <Text style={styles.detailValue} numberOfLines={1}>
                  {session.onlineMeetingLink ? 'En ligne' : session.location}
                </Text>
              </View>
            </View>
          )}
        </View>

        {/* Accept button for suggested sessions */}
        {showAcceptButton && (
          <TouchableOpacity 
            style={styles.acceptButton}
            onPress={handleAccept}
          >
            <CheckCircle size={18} color={Colors.white} strokeWidth={2} />
            <Text style={styles.acceptButtonText}>Accepter cette session</Text>
          </TouchableOpacity>
        )}

        {/* Footer: Price */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Revenu</Text>
            <Text style={styles.priceValue}>{formatEurAsFcfa(Number(session.price))}</Text>
          </View>
          {!showAcceptButton && (
            <View style={styles.arrowCircle}>
              <Text style={styles.arrowText}>→</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default function SessionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'assigned' | 'suggested' | 'past' | 'cancelled'>('assigned');
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [activeTab]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      
      // Use the filter parameter for server-side filtering
      // Validates: Requirements 10.1, 10.2, 10.3, 10.4
      let endpoint = '/sessions';
      if (activeTab === 'assigned') {
        endpoint = '/sessions?filter=assigned';
      } else if (activeTab === 'suggested') {
        endpoint = '/sessions?filter=suggested';
      } else if (activeTab === 'past') {
        endpoint = '/sessions?filter=tutor-past';
      } else if (activeTab === 'cancelled') {
        endpoint = '/sessions?filter=tutor-cancelled';
      }
      
      const response = await ApiClient.get<{ success: boolean; data: SessionResponse[] }>(endpoint);
      const allSessions = response.data;
      
      // Sessions are already filtered and sorted by the backend
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
          { key: 'assigned', label: 'Assignées' },
          { key: 'suggested', label: 'Suggérées' },
          { key: 'past', label: 'Terminées' },
          { key: 'cancelled', label: 'Annulées' },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as 'assigned' | 'suggested' | 'past' | 'cancelled')}
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
                {activeTab === 'assigned' 
                  ? 'Aucune session assignée' 
                  : activeTab === 'suggested'
                  ? 'Aucune session suggérée'
                  : activeTab === 'cancelled'
                  ? 'Aucune session annulée'
                  : 'Aucune session terminée'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'assigned'
                  ? 'Vos sessions assignées apparaîtront ici'
                  : activeTab === 'suggested'
                  ? 'Les sessions correspondant à vos compétences apparaîtront ici'
                  : activeTab === 'cancelled'
                  ? 'Les sessions annulées apparaîtront ici'
                  : 'Vos sessions terminées apparaîtront ici'}
              </Text>
            </View>
          ) : (
            sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onPress={() => router.push(`/(tutor)/(tabs)/sessions/${session.id}`)}
                showAcceptButton={activeTab === 'suggested'}
                onActionComplete={loadSessions}
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
    padding: Spacing.lg,
    position: 'relative',
    ...Shadows.small,
  },
  // Status Badge - Top Right
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.small,
    zIndex: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Ongoing Badge - Top Left
  ongoingBadgeTop: {
    position: 'absolute',
    top: Spacing.md,
    left: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.success + '15',
    zIndex: 10,
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
    letterSpacing: 0.5,
  },
  // Main Content
  cardContent: {
    gap: Spacing.md,
    marginTop: 28, // Space for badges
  },
  // Date Section
  dateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  // Subject
  sessionSubject: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
    lineHeight: 28,
  },
  // Class Info
  classInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  classIconWrapper: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  classText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  studentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.accent2 + '20',
  },
  studentBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.accent2,
  },
  // Divider
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.xs,
  },
  // Details Grid
  detailsGrid: {
    gap: Spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
  },
  detailIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailContent: {
    flex: 1,
    gap: 2,
  },
  detailLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  detailSubValue: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.success,
    marginTop: Spacing.xs,
  },
  acceptButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.white,
  },
  // Footer
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    marginTop: Spacing.xs,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  priceContainer: {
    gap: 2,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  arrowText: {
    fontSize: 18,
    color: Colors.primary,
    fontWeight: '600',
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
