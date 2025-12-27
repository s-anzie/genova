import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ImageBackground,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Heart,
  Share2,
  CheckCircle,
  Calendar,
  MessageCircle,
  Star,
  Globe,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { apiClient } from '@/utils/api-client';
import { TutorProfileResponse, ReviewResponse } from '@/types/api';
import { eurToFcfa } from '@/utils/currency';

// Mock data for development
const MOCK_TUTOR: Partial<TutorProfileResponse> = {
  id: '1',
  userId: '1',
  bio: 'Skilled tutor with proven track record of academic success. Focused on delivering clear and effective lessons. With over 3 years of experience in teaching, I have helped numerous students achieve their academic goals.',
  experienceYears: 3,
  hourlyRate: 30,
  subjects: ['Mathematics', 'Physics', 'Chemistry'],
  educationLevels: ['High School', 'University'],
  languages: ['English', 'French', 'Spanish'],
  teachingMode: 'BOTH',
  averageRating: 4.8,
  totalReviews: 46,
  isVerified: true,
  totalHoursTaught: 150,
  diplomas: [
    {
      name: 'Master in Teaching',
      institution: 'University Name',
      year: 2020,
      verified: true,
    },
  ],
  availability: {},
  verificationDocuments: [],
  user: {
    id: '1',
    email: 'noah@example.com',
    phone: null,
    firstName: 'Noah',
    lastName: 'Miller',
    avatarUrl: null,
    birthDate: null,
    address: null,
    city: null,
    postalCode: null,
    country: 'US',
    preferredLanguage: 'en',
    role: 'TUTOR',
    subscriptionType: 'premium',
    subscriptionExpiresAt: null,
    walletBalance: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
    isVerified: true,
    isActive: true,
  },
};

const MOCK_REVIEWS: ReviewResponse[] = [
  {
    id: '1',
    sessionId: '1',
    reviewerId: '2',
    revieweeId: '1',
    rating: 5,
    comment: 'Excellent tutor! Very patient and explains concepts clearly.',
    createdAt: new Date('2025-12-15'),
    reviewer: {
      id: '2',
      email: 'student@example.com',
      phone: null,
      firstName: 'Emma',
      lastName: 'Johnson',
      avatarUrl: null,
      birthDate: null,
      address: null,
      city: null,
      postalCode: null,
      country: null,
      preferredLanguage: 'en',
      role: 'STUDENT',
      subscriptionType: 'basic',
      subscriptionExpiresAt: null,
      walletBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      isActive: true,
    },
  },
  {
    id: '2',
    sessionId: '2',
    reviewerId: '3',
    revieweeId: '1',
    rating: 4,
    comment: 'Great experience, learned a lot!',
    createdAt: new Date('2025-12-10'),
    reviewer: {
      id: '3',
      email: 'student2@example.com',
      phone: null,
      firstName: 'Liam',
      lastName: 'Smith',
      avatarUrl: null,
      birthDate: null,
      address: null,
      city: null,
      postalCode: null,
      country: null,
      preferredLanguage: 'en',
      role: 'STUDENT',
      subscriptionType: 'basic',
      subscriptionExpiresAt: null,
      walletBalance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      isVerified: false,
      isActive: true,
    },
  },
];

export default function TutorDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [showFullBio, setShowFullBio] = React.useState(false);
  const [tutor, setTutor] = useState<TutorProfileResponse | null>(null);
  const [reviews, setReviews] = useState<ReviewResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTutorData();
  }, [id]);

  const loadTutorData = async () => {
    try {
      setLoading(true);
      // Fetch tutor profile using the correct endpoint
      const response = await apiClient.get<{ success: boolean; data: TutorProfileResponse }>(`/profiles/tutor/${id}`);
      setTutor(response.data);

      // Fetch reviews
      try {
        const reviewsResponse = await apiClient.get<{ success: boolean; data: ReviewResponse[] }>(`/reviews/tutor/${id}`);
        setReviews(reviewsResponse.data);
      } catch (err) {
        console.error('Error loading reviews:', err);
        setReviews([]);
      }
    } catch (err) {
      console.error('Error loading tutor:', err);
      // Use mock data on error
      setTutor(MOCK_TUTOR as TutorProfileResponse);
      setReviews(MOCK_REVIEWS);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!tutor) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.errorText}>Tutor not found</Text>
      </View>
    );
  }

  const displayName = tutor.user ? `${tutor.user.firstName} ${tutor.user.lastName}` : 'Tutor';
  const avatarInitials = tutor.user ? `${tutor.user.firstName[0]}${tutor.user.lastName[0]}` : 'T';

  return (
    <View style={styles.container}>
      <PageHeader
        title="Profil du tuteur"
        showBackButton
        centerTitle
        showGradient={false}
        variant="primary"
        rightElement={
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Share2 size={20} color={Colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerButton}>
              <Heart size={20} color={Colors.textPrimary} strokeWidth={2} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Image */}
        <View style={styles.heroContainer}>
          <ImageBackground
            source={{ uri: 'https://via.placeholder.com/400x200' }}
            style={styles.heroImage}
            resizeMode="cover"
          />
        </View>

        {/* Profile Info Card with Avatar Overlap */}
        <View style={styles.profileCard}>
          {/* Avatar and Name */}
          <View style={styles.profileHeader}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <View style={styles.nameRow}>
                <Text style={styles.tutorName}>{displayName}</Text>
                {tutor.isVerified && (
                  <CheckCircle size={20} color={Colors.primary} fill={Colors.primary} strokeWidth={0} />
                )}
              </View>
              {/* Badges */}
              <View style={styles.badgesRow}>
                {tutor.isVerified && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>Verified</Text>
                  </View>
                )}
                {Number(tutor.averageRating) >= 4.5 && (
                  <View style={[styles.badge, styles.badgeSuccess]}>
                    <Text style={[styles.badgeText, styles.badgeTextSuccess]}>High Rated</Text>
                  </View>
                )}
                {tutor.teachingMode === 'ONLINE' && (
                  <View style={styles.badge}>
                    <Globe size={10} color={Colors.white} strokeWidth={2} />
                    <Text style={styles.badgeText}>Online</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <CheckCircle size={20} color={Colors.textSecondary} strokeWidth={2} />
              <Text style={styles.statLabel}>Verified</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{eurToFcfa(tutor.hourlyRate).toLocaleString('fr-FR')} FCFA</Text>
              <Text style={styles.statLabel}>Par heure</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <View style={styles.ratingRow}>
                <Star size={14} color="#FFB800" fill="#FFB800" strokeWidth={2} />
                <Text style={styles.statValue}>{Number(tutor.averageRating).toFixed(1)}</Text>
              </View>
              <Text style={styles.statLabel}>{tutor.totalReviews} reviews</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{tutor.experienceYears}y</Text>
              <Text style={styles.statLabel}>Experience</Text>
            </View>
          </View>
        </View>

        {/* About Me */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About Me</Text>
          <Text style={styles.bioText}>
            {tutor.bio || 'Skilled tutor with a proven track record of academic success.'}
          </Text>
          {tutor.bio && tutor.bio.length > 150 && (
            <TouchableOpacity onPress={() => setShowFullBio(!showFullBio)} style={styles.readMoreButton}>
              <Text style={styles.readMore}>
                {showFullBio ? 'Show Less' : 'Read More'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Subjects */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Subjects</Text>
          <View style={styles.skillsContainer}>
            {tutor.subjects.map((subject, index) => (
              <View key={index} style={styles.skillChip}>
                <Text style={styles.skillText}>{subject}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Languages */}
        {tutor.languages && tutor.languages.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Languages</Text>
            <View style={styles.skillsContainer}>
              {tutor.languages.map((language, index) => (
                <View key={index} style={styles.skillChip}>
                  <Text style={styles.skillText}>{language}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* See my schedule Button */}
        <View style={styles.scheduleButtonContainer}>
          <TouchableOpacity
            style={styles.scheduleButton}
            onPress={() => router.push(`/(student)/tutors/${id}/schedule`)}
          >
            <Calendar size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.scheduleButtonText}>See my schedule</Text>
          </TouchableOpacity>
        </View>

        {/* Reviews */}
        {reviews.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reviews ({reviews.length})</Text>
            {reviews.slice(0, 3).map((review) => (
              <View key={review.id} style={styles.reviewCard}>
                <View style={styles.reviewHeader}>
                  <View style={styles.reviewAvatar}>
                    <Text style={styles.reviewAvatarText}>
                      {review.reviewer?.firstName?.[0] || 'U'}
                    </Text>
                  </View>
                  <View style={styles.reviewInfo}>
                    <Text style={styles.reviewerName}>
                      {review.reviewer ? `${review.reviewer.firstName} ${review.reviewer.lastName}` : 'Anonymous'}
                    </Text>
                    <View style={styles.reviewRating}>
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={12}
                          color={star <= review.rating ? '#FFB800' : '#E0E0E0'}
                          fill={star <= review.rating ? '#FFB800' : 'transparent'}
                          strokeWidth={2}
                        />
                      ))}
                    </View>
                  </View>
                  <Text style={styles.reviewDate}>
                    {new Date(review.createdAt).toLocaleDateString()}
                  </Text>
                </View>
                {review.comment && (
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                )}
              </View>
            ))}
            {reviews.length > 3 && (
              <TouchableOpacity style={styles.viewAllReviews}>
                <Text style={styles.viewAllReviewsText}>View all {reviews.length} reviews</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Diplomas */}
        {tutor.diplomas && tutor.diplomas.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Certificates</Text>
            {tutor.diplomas.map((diploma, index) => (
              <View key={index} style={styles.certCard}>
                <Text style={styles.certYear}>{diploma.year}</Text>
                <Text style={styles.certName}>{diploma.name}</Text>
                <Text style={styles.certTitle}>{diploma.institution}</Text>
                {diploma.verified && (
                  <View style={styles.verifiedRow}>
                    <CheckCircle size={16} color={Colors.success} fill={Colors.success} strokeWidth={0} />
                    <Text style={styles.verifiedText}>Verified</Text>
                  </View>
                )}
              </View>
            ))}
          </View>
        )}

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footerContainer}>
        <View style={styles.footer}>
          <TouchableOpacity style={styles.chatButton}>
            <MessageCircle size={24} color={Colors.primary} strokeWidth={2} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.bookButton}
            onPress={() => router.push(`/(student)/tutors/${id}/checkout`)}
          >
            <Text style={styles.bookButtonText}>Réserver une séance</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  heroContainer: {
    width: '100%',
    height: 150,
    position: 'relative',
    backgroundColor: '#e5e5e5',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  profileCard: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    borderRadius: BorderRadius.large,
    marginHorizontal: Spacing.lg,
    marginTop: -40,
    ...Shadows.medium,
  },
  profileHeader: {
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
    fontSize: 24,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileInfo: {
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
  badgesRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  badgeSuccess: {
    backgroundColor: '#4CAF50',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  badgeTextSuccess: {
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
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  bioText: {
    fontSize: 15,
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 12,
  },
  readMoreButton: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cream,
    marginTop: 4,
  },
  readMore: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  skillChip: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  skillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
  scheduleButtonContainer: {
    paddingHorizontal: 20,
    marginBottom: 28,
  },
  scheduleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: Colors.white,
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  scheduleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primary,
  },
  reviewCard: {
    backgroundColor: Colors.cream,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  reviewHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  reviewAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  reviewAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  reviewInfo: {
    flex: 1,
  },
  reviewerName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  reviewRating: {
    flexDirection: 'row',
    gap: 2,
  },
  reviewDate: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  reviewComment: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  viewAllReviews: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.cream,
    marginTop: 4,
  },
  viewAllReviewsText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  certCard: {
    backgroundColor: Colors.cream,
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
  },
  certYear: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  certName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  certTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 10,
  },
  verifiedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
  },
  footerContainer: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  footer: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  chatButton: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  bookButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
});
