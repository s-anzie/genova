import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Calendar, Clock, MapPin, Video, ChevronRight, User, Sparkles } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Shadows, Spacing, BorderRadius, Gradients } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { SessionResponse } from '@/types/api';
import { PageHeader, TabSelector } from '@/components/PageHeader';

export default function SessionsScreen() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    loadSessions();
  }, [activeTab]);

  const loadSessions = async () => {
    try {
      setLoading(true);
      const status = activeTab === 'upcoming' ? 'PENDING,CONFIRMED' : 'COMPLETED,CANCELLED';
      const response = await ApiClient.get<{ success: boolean; data: SessionResponse[] }>(`/sessions?status=${status}`);
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
        return Colors.accent2; // Gold for pending
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

  const renderSession = (session: SessionResponse) => (
    <TouchableOpacity
      key={session.id}
      style={styles.sessionCard}
      onPress={() => router.push(`/(student)/(tabs)/sessions/${session.id}`)}
      activeOpacity={0.7}
    >
      <LinearGradient
        colors={['rgba(13, 115, 119, 0.03)', 'rgba(20, 255, 236, 0.03)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.cardGradient}
      >
        {/* Status Badge */}
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(session.status) }]}>
          <View style={styles.statusDot} />
          <Text style={styles.statusText}>{getStatusLabel(session.status)}</Text>
        </View>

        {/* Subject & Date */}
        <View style={styles.cardHeader}>
          <View style={styles.subjectContainer}>
            <View style={styles.iconCircle}>
              <Sparkles size={18} color={Colors.primary} />
            </View>
            <View style={styles.subjectInfo}>
              <Text style={styles.sessionSubject}>{session.subject}</Text>
              <View style={styles.dateRow}>
                <Calendar size={14} color={Colors.textSecondary} />
                <Text style={styles.dateText}>{formatDate(session.scheduledStart)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Time & Location */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconWrapper}>
              <Clock size={16} color={Colors.primary} />
            </View>
            <Text style={styles.detailText}>
              {formatTime(session.scheduledStart)} - {formatTime(session.scheduledEnd)}
            </Text>
          </View>

          {session.location && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconWrapper}>
                <MapPin size={16} color={Colors.primary} />
              </View>
              <Text style={styles.detailText} numberOfLines={1}>
                {session.location}
              </Text>
            </View>
          )}

          {session.onlineMeetingLink && (
            <View style={styles.detailItem}>
              <View style={styles.detailIconWrapper}>
                <Video size={16} color={Colors.primary} />
              </View>
              <Text style={styles.detailText}>Session en ligne</Text>
            </View>
          )}
        </View>

        {/* Tutor Info */}
        {session.tutor && (
          <View style={styles.tutorSection}>
            <View style={styles.tutorAvatar}>
              <User size={16} color={Colors.white} />
            </View>
            <View style={styles.tutorDetails}>
              <Text style={styles.tutorLabel}>Tuteur</Text>
              <Text style={styles.tutorName}>
                {session.tutor.user?.firstName} {session.tutor.user?.lastName}
              </Text>
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>Prix</Text>
            <Text style={styles.priceValue}>{session.price.toFixed(2)} €</Text>
          </View>
          <View style={styles.arrowButton}>
            <ChevronRight size={20} color={Colors.primary} />
          </View>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header avec tabs */}
      <PageHeader 
        title="Mes Sessions" 
        subtitle={`${sessions.length} session${sessions.length > 1 ? 's' : ''}`}
      />
      
      <TabSelector
        tabs={[
          { key: 'upcoming', label: 'À venir' },
          { key: 'past', label: 'Passées' },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as 'upcoming' | 'past')}
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
                <Calendar size={64} color={Colors.textTertiary} strokeWidth={1.5} />
              </View>
              <Text style={styles.emptyTitle}>
                {activeTab === 'upcoming' 
                  ? 'Aucune session à venir' 
                  : 'Aucune session passée'}
              </Text>
              <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                  ? 'Réservez une session avec un tuteur pour commencer'
                  : 'Vos sessions terminées apparaîtront ici'}
              </Text>
            </View>
          ) : (
            sessions.map(renderSession)
          )}
        </ScrollView>
      )}
    </SafeAreaView>
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
    gap: Spacing.md,
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
    gap: Spacing.md,
  },
  sessionCard: {
    borderRadius: BorderRadius.xlarge,
    overflow: 'hidden',
    ...Shadows.medium,
    backgroundColor: Colors.white,
  },
  cardGradient: {
    padding: Spacing.lg,
  },
  statusBadge: {
    position: 'absolute',
    top: Spacing.md,
    right: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.round,
    ...Shadows.small,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.white,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.white,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardHeader: {
    marginBottom: Spacing.md,
    paddingRight: 100,
  },
  subjectContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subjectInfo: {
    flex: 1,
  },
  sessionSubject: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailsContainer: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  detailIconWrapper: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
    flex: 1,
  },
  tutorSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 115, 119, 0.08)',
  },
  tutorAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorDetails: {
    flex: 1,
  },
  tutorLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  tutorName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 115, 119, 0.08)',
  },
  priceContainer: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  arrowButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
