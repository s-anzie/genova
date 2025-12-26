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

// Separate component for session card to use hooks properly
const SessionCard = ({ 
  session, 
  onPress, 
  showActions,
  onActionComplete 
}: { 
  session: SessionResponse; 
  onPress: () => void; 
  showActions?: boolean;
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

  const handleConfirm = async (e: any) => {
    e.stopPropagation();
    try {
      await ApiClient.put(`/sessions/${session.id}/status`, { status: 'CONFIRMED' });
      Alert.alert('Succès', 'Session confirmée avec succès', [
        { text: 'OK', onPress: () => onActionComplete?.() }
      ]);
    } catch (error) {
      console.error('Failed to confirm session:', error);
      Alert.alert('Erreur', 'Impossible de confirmer la session');
    }
  };

  const handleReject = async (e: any) => {
    e.stopPropagation();
    Alert.alert(
      'Refuser la session',
      'Êtes-vous sûr de vouloir refuser cette session ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiClient.put(`/sessions/${session.id}/status`, { status: 'CANCELLED' });
              Alert.alert('Succès', 'Session refusée', [
                { text: 'OK', onPress: () => onActionComplete?.() }
              ]);
            } catch (error) {
              console.error('Failed to reject session:', error);
              Alert.alert('Erreur', 'Impossible de refuser la session');
            }
          }
        }
      ]
    );
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

        {/* Actions for pending sessions */}
        {showActions && session.status === 'PENDING' && (
          <View style={styles.actionsSection}>
            <TouchableOpacity 
              style={styles.rejectButton}
              onPress={handleReject}
            >
              <XCircle size={18} color={Colors.error} strokeWidth={2} />
              <Text style={styles.rejectButtonText}>Refuser</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.confirmButton}
              onPress={handleConfirm}
            >
              <CheckCircle size={18} color={Colors.white} strokeWidth={2} />
              <Text style={styles.confirmButtonText}>Confirmer</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer: Price */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Revenu</Text>
            <Text style={styles.priceValue}>{Math.round(Number(session.price)).toLocaleString('fr-FR')} €</Text>
          </View>
          {!showActions && (
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
  const [activeTab, setActiveTab] = useState<'pending' | 'confirmed' | 'past' | 'cancelled'>('confirmed');
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [activeTab]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      // Load all sessions and filter/sort on client side
      const response = await ApiClient.get<{ success: boolean; data: SessionResponse[] }>('/sessions');
      const allSessions = response.data;
      
      const now = new Date();
      
      if (activeTab === 'pending') {
        // Filter: PENDING sessions that haven't ended yet
        const pendingSessions = allSessions.filter(session => {
          const endTime = new Date(session.scheduledEnd);
          return session.status === 'PENDING' && endTime > now;
        });
        
        // Sort: closest first (ascending by start time)
        pendingSessions.sort((a, b) => {
          const aStart = new Date(a.scheduledStart).getTime();
          const bStart = new Date(b.scheduledStart).getTime();
          return aStart - bStart;
        });
        
        setSessions(pendingSessions);
      } else if (activeTab === 'confirmed') {
        // Filter: CONFIRMED sessions that haven't ended yet
        const confirmedSessions = allSessions.filter(session => {
          const endTime = new Date(session.scheduledEnd);
          return session.status === 'CONFIRMED' && endTime > now;
        });
        
        // Sort: closest first (ascending by start time)
        confirmedSessions.sort((a, b) => {
          const aStart = new Date(a.scheduledStart).getTime();
          const bStart = new Date(b.scheduledStart).getTime();
          return aStart - bStart;
        });
        
        setSessions(confirmedSessions);
      } else if (activeTab === 'cancelled') {
        // Filter: CANCELLED sessions only
        const cancelledSessions = allSessions.filter(session => 
          session.status === 'CANCELLED'
        );
        
        // Sort: most recent first (descending by scheduled start time)
        cancelledSessions.sort((a, b) => {
          const aStart = new Date(a.scheduledStart).getTime();
          const bStart = new Date(b.scheduledStart).getTime();
          return bStart - aStart;
        });
        
        setSessions(cancelledSessions);
      } else {
        // Filter: COMPLETED sessions OR any session whose end time has passed
        const pastSessions = allSessions.filter(session => {
          const endTime = new Date(session.scheduledEnd);
          return session.status === 'COMPLETED' || 
                 (endTime <= now && session.status !== 'CANCELLED');
        });
        
        // Sort: most recent first (descending by end time)
        pastSessions.sort((a, b) => {
          const aEnd = new Date(a.scheduledEnd).getTime();
          const bEnd = new Date(b.scheduledEnd).getTime();
          return bEnd - aEnd;
        });
        
        setSessions(pastSessions);
      }
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
          { key: 'pending', label: 'En attente' },
          { key: 'confirmed', label: 'Confirmées' },
          { key: 'past', label: 'Terminées' },
          { key: 'cancelled', label: 'Annulées' },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as 'pending' | 'confirmed' | 'past' | 'cancelled')}
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
                {activeTab === 'pending' 
                  ? 'Aucune session en attente' 
                  : activeTab === 'confirmed'
                  ? 'Aucune session confirmée'
                  : activeTab === 'cancelled'
                  ? 'Aucune session annulée'
                  : 'Aucune session terminée'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'pending'
                  ? 'Les nouvelles demandes de session apparaîtront ici'
                  : activeTab === 'confirmed'
                  ? 'Vos sessions confirmées apparaîtront ici'
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
                showActions={activeTab === 'pending'}
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
  actionsSection: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingTop: Spacing.sm,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.error + '15',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.error,
  },
  confirmButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.success,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: '600',
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
