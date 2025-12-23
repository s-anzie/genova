import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Users,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import StripePayment from '@/components/payment/stripe-payment';
import { apiClient } from '@/utils/api-client';
import { ClassResponse } from '@/types/api';

export default function CheckoutScreen() {
  const router = useRouter();
  const { id, tutorId, startTime, endTime, duration, price } = useLocalSearchParams();
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showClassModal, setShowClassModal] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassResponse | null>(null);
  const [classes, setClasses] = useState<ClassResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserClasses();
  }, []);

  const loadUserClasses = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: ClassResponse[] }>('/classes');
      setClasses(response.data || []);
      
      // Auto-select first class if only one exists
      if (response.data && response.data.length === 1) {
        setSelectedClass(response.data[0]);
      }
    } catch (err) {
      console.error('Error loading classes:', err);
      setClasses([]);
    } finally {
      setLoading(false);
    }
  };

  const tutor = {
    name: 'Noah Miller',
    avatar: '👨‍🏫',
    flag: '🇺🇸',
    verified: true,
    badges: ['Professional', 'High Rated'],
    hourlyRate: 30,
    lessons: 46,
    experience: '3 years',
  };

  const booking = {
    date: startTime ? new Date(startTime as string).toLocaleDateString('fr-FR', { 
      day: 'numeric', 
      month: 'long', 
      year: 'numeric' 
    }) : '26 June 2025',
    time: startTime ? new Date(startTime as string).toLocaleTimeString('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '14:00',
    duration: duration ? `${duration} min` : '60 min',
    price: price ? parseFloat(price as string) : 30,
  };

  const handleConfirmPayment = () => {
    if (!selectedClass) {
      setShowClassModal(true);
      return;
    }
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    router.push('/(student)/(tabs)/sessions');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Paiement</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Tutor Info Card */}
        <View style={styles.tutorCard}>
          {/* Avatar and Name */}
          <View style={styles.tutorHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{tutor.avatar}</Text>
            </View>
            <View style={styles.tutorInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.tutorName}>{tutor.name}</Text>
                <Text style={styles.flag}>{tutor.flag}</Text>
                {tutor.verified && (
                  <CheckCircle size={20} color={Colors.primary} fill={Colors.primary} strokeWidth={0} />
                )}
              </View>
              {/* Badges */}
              <View style={styles.badgesRow}>
                {tutor.badges.map((badge, index) => (
                  <View key={index} style={styles.badge}>
                    <Text style={styles.badgeText}>{badge}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <CheckCircle size={20} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>${tutor.hourlyRate}</Text>
              <Text style={styles.statLabel}>Per Lesson</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tutor.lessons}</Text>
              <Text style={styles.statLabel}>Lessons</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tutor.experience}</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
          </View>
        </View>

        {/* Booking Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Votre séance</Text>
          <View style={styles.detailsCard}>
            {selectedClass && (
              <TouchableOpacity 
                style={styles.detailRow}
                onPress={() => setShowClassModal(true)}
              >
                <Text style={styles.detailLabel}>Class</Text>
                <View style={styles.classInfo}>
                  <Text style={styles.detailValue}>{selectedClass.name}</Text>
                  <Users size={16} color={Colors.primary} strokeWidth={2} />
                </View>
              </TouchableOpacity>
            )}
            {!selectedClass && (
              <TouchableOpacity 
                style={styles.detailRow}
                onPress={() => setShowClassModal(true)}
              >
                <Text style={styles.detailLabel}>Class</Text>
                <Text style={[styles.detailValue, styles.selectClassText]}>Select a class</Text>
              </TouchableOpacity>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Date</Text>
              <Text style={styles.detailValue}>{booking.date}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Time</Text>
              <Text style={styles.detailValue}>{booking.time}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Duration</Text>
              <Text style={styles.detailValue}>{booking.duration}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Price</Text>
              <Text style={styles.detailValue}>${booking.price}</Text>
            </View>
          </View>
        </View>

        {/* Promo Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Have a promocode?</Text>
          <View style={styles.promoCard}>
            <Text style={styles.promoText}>Enter code</Text>
          </View>
        </View>

        {/* Total */}
        <View style={styles.section}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalValue}>${booking.price}</Text>
          </View>
        </View>

        {/* Cancellation Policy */}
        <View style={styles.policyCard}>
          <View style={styles.policyHeader}>
            <AlertCircle size={20} color="#FF6B6B" strokeWidth={2} />
            <Text style={styles.policyTitle}>Cancellation Guarantee</Text>
          </View>
          <Text style={styles.policyText}>
            100% refundable if you cancel at least 24 hours before the lesson starts.
          </Text>
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.confirmButton, !selectedClass && styles.confirmButtonDisabled]}
          onPress={handleConfirmPayment}
          disabled={!selectedClass}
        >
          <Text style={styles.confirmButtonText}>
            {selectedClass ? 'Confirm Payment' : 'Select a class first'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Class Selection Modal */}
      <Modal
        visible={showClassModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowClassModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.classModalContent}>
            <View style={styles.classModalHeader}>
              <Text style={styles.classModalTitle}>Select a Class</Text>
              <TouchableOpacity onPress={() => setShowClassModal(false)}>
                <Text style={styles.classModalClose}>✕</Text>
              </TouchableOpacity>
            </View>
            
            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
              </View>
            ) : classes.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>
                  You don't have any classes yet. Create one to book a session.
                </Text>
                <TouchableOpacity 
                  style={styles.createClassButton}
                  onPress={() => {
                    setShowClassModal(false);
                    router.push('/(student)/classes/create');
                  }}
                >
                  <Text style={styles.createClassButtonText}>Create Class</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <ScrollView style={styles.classListScroll}>
                {classes.map((classItem) => (
                  <TouchableOpacity
                    key={classItem.id}
                    style={[
                      styles.classItem,
                      selectedClass?.id === classItem.id && styles.classItemSelected
                    ]}
                    onPress={() => {
                      setSelectedClass(classItem);
                      setShowClassModal(false);
                    }}
                  >
                    <View style={styles.classItemContent}>
                      <Text style={styles.className}>{classItem.name}</Text>
                      <Text style={styles.classDetails}>
                        {classItem.subject} • {classItem.educationLevel}
                      </Text>
                      <View style={styles.classMembersRow}>
                        <Users size={14} color={Colors.textSecondary} strokeWidth={2} />
                        <Text style={styles.classMembersText}>
                          {classItem._count?.members || 0} members
                        </Text>
                      </View>
                    </View>
                    {selectedClass?.id === classItem.id && (
                      <CheckCircle size={24} color={Colors.primary} fill={Colors.primary} strokeWidth={0} />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Payment Modal */}
      <Modal
        visible={showPaymentModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowPaymentModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <StripePayment
              sessionId={selectedClass?.id || 'mock-session-id'}
              amount={booking.price}
              onSuccess={handlePaymentSuccess}
              onCancel={() => setShowPaymentModal(false)}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.bgCream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  tutorCard: {
    backgroundColor: Colors.white,
    borderRadius: 0,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  tutorHeader: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  avatarContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    borderWidth: 4,
    borderColor: Colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    fontSize: 36,
  },
  tutorInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  tutorName: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  flag: {
    fontSize: 20,
  },
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statItem: {
    alignItems: 'center',
    gap: 6,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  section: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  detailsCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  classInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  selectClassText: {
    color: Colors.primary,
  },
  promoCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
  },
  promoText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.white,
    padding: 16,
    borderRadius: 12,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  policyCard: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 107, 0.2)',
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FF6B6B',
  },
  policyText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
  },
  classModalContent: {
    width: '90%',
    maxHeight: '70%',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 20,
  },
  classModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  classModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  classModalClose: {
    fontSize: 24,
    color: Colors.textSecondary,
    fontWeight: '300',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  createClassButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  createClassButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  classListScroll: {
    maxHeight: 400,
  },
  classItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  classItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
  },
  classItemContent: {
    flex: 1,
  },
  className: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  classDetails: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  classMembersRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  classMembersText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
