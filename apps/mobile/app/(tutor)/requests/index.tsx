import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  User,
  Check,
  X,
  BookOpen,
  MapPin,
  AlertCircle,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { PageHeader } from '@/components/PageHeader';
import { formatEurAsFcfa } from '@/utils/currency';

interface TutorAssignmentRequest {
  id: string;
  sessionId: string;
  studentId: string;
  tutorId: string;
  status: 'PENDING' | 'ACCEPTED' | 'DECLINED';
  message: string | null;
  createdAt: Date;
  respondedAt: Date | null;
  session: {
    id: string;
    subject: string;
    scheduledStart: Date;
    scheduledEnd: Date;
    location: string | null;
    onlineMeetingLink: string | null;
    description: string | null;
    price: number;
    class: {
      id: string;
      name: string;
      _count: {
        members: number;
      };
    };
  };
  student: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
}

export default function TutorRequestsScreen() {
  const router = useRouter();
  const [requests, setRequests] = useState<TutorAssignmentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [processingRequest, setProcessingRequest] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const response = await ApiClient.get<{ success: boolean; data: TutorAssignmentRequest[] }>(
        '/tutors/assignment-requests?status=PENDING'
      );
      setRequests(response.data);
    } catch (error) {
      console.error('Failed to load requests:', error);
      Alert.alert('Erreur', 'Impossible de charger les demandes');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
    setRefreshing(false);
  };

  const handleAcceptRequest = async (requestId: string) => {
    Alert.alert(
      'Accepter la demande',
      'Voulez-vous accepter cette demande d\'assignation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Accepter',
          onPress: async () => {
            try {
              setProcessingRequest(requestId);
              await ApiClient.post(`/assignment-requests/${requestId}/accept`, {});
              Alert.alert('Succès', 'Demande acceptée avec succès');
              await loadRequests();
            } catch (error: any) {
              console.error('Failed to accept request:', error);
              Alert.alert(
                'Erreur',
                error.message || 'Impossible d\'accepter la demande'
              );
            } finally {
              setProcessingRequest(null);
            }
          },
        },
      ]
    );
  };

  const handleDeclineRequest = async (requestId: string) => {
    Alert.alert(
      'Refuser la demande',
      'Voulez-vous refuser cette demande d\'assignation ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Refuser',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingRequest(requestId);
              await ApiClient.post(`/assignment-requests/${requestId}/decline`, {
                reason: 'Non disponible pour cette session',
              });
              Alert.alert('Succès', 'Demande refusée');
              await loadRequests();
            } catch (error: any) {
              console.error('Failed to decline request:', error);
              Alert.alert(
                'Erreur',
                error.message || 'Impossible de refuser la demande'
              );
            } finally {
              setProcessingRequest(null);
            }
          },
        },
      ]
    );
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };

  const formatTime = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Demandes d'assignation" showBackButton variant="primary" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader title="Demandes d'assignation" showBackButton variant="primary" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <AlertCircle size={64} color={Colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyTitle}>Aucune demande</Text>
            <Text style={styles.emptyText}>
              Vous n'avez pas de demandes d'assignation en attente pour le moment.
            </Text>
          </View>
        ) : (
          requests.map((request) => (
            <View key={request.id} style={styles.requestCard}>
              {/* Student Info */}
              <View style={styles.studentSection}>
                <View style={styles.studentAvatar}>
                  <User size={20} color={Colors.white} strokeWidth={2} />
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>
                    {request.student.firstName} {request.student.lastName}
                  </Text>
                  <Text style={styles.studentEmail}>{request.student.email}</Text>
                </View>
              </View>

              {/* Session Info */}
              <View style={styles.sessionSection}>
                <View style={styles.sessionHeader}>
                  <BookOpen size={16} color={Colors.primary} strokeWidth={2} />
                  <Text style={styles.sessionSubject}>{request.session.subject}</Text>
                </View>
                <Text style={styles.sessionClass}>{request.session.class.name}</Text>

                <View style={styles.sessionDetails}>
                  <View style={styles.sessionDetailRow}>
                    <Calendar size={14} color={Colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.sessionDetailText}>
                      {formatDate(request.session.scheduledStart)}
                    </Text>
                  </View>
                  <View style={styles.sessionDetailRow}>
                    <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
                    <Text style={styles.sessionDetailText}>
                      {formatTime(request.session.scheduledStart)} -{' '}
                      {formatTime(request.session.scheduledEnd)}
                    </Text>
                  </View>
                  {request.session.location && (
                    <View style={styles.sessionDetailRow}>
                      <MapPin size={14} color={Colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.sessionDetailText}>
                        {request.session.location}
                      </Text>
                    </View>
                  )}
                </View>

                {request.message && (
                  <View style={styles.messageBox}>
                    <Text style={styles.messageLabel}>Message:</Text>
                    <Text style={styles.messageText}>{request.message}</Text>
                  </View>
                )}

                <View style={styles.priceRow}>
                  <Text style={styles.priceLabel}>Prix:</Text>
                  <Text style={styles.priceValue}>
                    {formatEurAsFcfa(Number(request.session.price))}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsRow}>
                <TouchableOpacity
                  style={[
                    styles.declineButton,
                    processingRequest === request.id && styles.buttonDisabled,
                  ]}
                  onPress={() => handleDeclineRequest(request.id)}
                  disabled={processingRequest !== null}
                  activeOpacity={0.7}
                >
                  {processingRequest === request.id ? (
                    <ActivityIndicator size="small" color={Colors.error} />
                  ) : (
                    <>
                      <X size={18} color={Colors.error} strokeWidth={2} />
                      <Text style={styles.declineButtonText}>Refuser</Text>
                    </>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.acceptButton,
                    processingRequest === request.id && styles.buttonDisabled,
                  ]}
                  onPress={() => handleAcceptRequest(request.id)}
                  disabled={processingRequest !== null}
                  activeOpacity={0.7}
                >
                  {processingRequest === request.id ? (
                    <ActivityIndicator size="small" color={Colors.white} />
                  ) : (
                    <>
                      <Check size={18} color={Colors.white} strokeWidth={2} />
                      <Text style={styles.acceptButtonText}>Accepter</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          ))
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
    gap: Spacing.md,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 3,
    gap: Spacing.sm,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: Spacing.xl,
  },
  requestCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    gap: Spacing.md,
    ...Shadows.small,
  },
  studentSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.bgCream,
  },
  studentAvatar: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  sessionSection: {
    gap: Spacing.xs,
  },
  sessionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sessionSubject: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  sessionClass: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  sessionDetails: {
    gap: 6,
    marginTop: Spacing.xs,
  },
  sessionDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sessionDetailText: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  messageBox: {
    backgroundColor: Colors.bgCream,
    padding: Spacing.sm,
    borderRadius: BorderRadius.medium,
    marginTop: Spacing.xs,
  },
  messageLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 14,
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.bgCream,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  priceValue: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  declineButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.error + '15',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    borderWidth: 1,
    borderColor: Colors.error,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
  },
  acceptButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.success,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
