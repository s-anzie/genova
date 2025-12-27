import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, SlidersHorizontal, Star, CheckCircle2 } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { TutorSearchResult, TutorSearchCriteria } from '@/types/api';
import { eurToFcfa, formatHourlyRateAsFcfa } from '@/utils/currency';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Check if we're in "assign tutor" mode (for session or time-slot)
  const sessionId = params.sessionId as string | undefined;
  const timeSlotId = params.timeSlotId as string | undefined;
  const classId = params.classId as string | undefined;
  const isAssignMode = !!(sessionId || timeSlotId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Parse filters from URL params with useMemo to prevent unnecessary re-renders
  const filters = useMemo(() => ({
    countries: params.countries ? JSON.parse(params.countries as string) : [],
    rating: params.rating ? Number(params.rating) : null,
    educationLevels: params.educationLevels ? JSON.parse(params.educationLevels as string) : [],
    subjects: params.subjects ? JSON.parse(params.subjects as string) : [],
    teachingMode: params.teachingMode ? (params.teachingMode as string) : null,
    gender: params.gender ? (params.gender as string) : null,
  }), [params.countries, params.rating, params.educationLevels, params.subjects, params.teachingMode, params.gender]);

  useEffect(() => {
    // Clear any pending search
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Debounce the search to avoid multiple rapid calls
    searchTimeoutRef.current = setTimeout(() => {
      searchTutors();
    }, 300);

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [filters.countries, filters.rating, filters.educationLevels, filters.subjects, filters.teachingMode, filters.gender]);

  const searchTutors = async () => {
    try {
      setLoading(true);

      // Build search criteria
      const criteria: TutorSearchCriteria = {};
      
      if (searchQuery.trim()) {
        criteria.subject = searchQuery.trim();
      }
      
      if (filters.rating) {
        criteria.minRating = filters.rating;
      }

      // Map education levels
      if (filters.educationLevels.length > 0) {
        criteria.educationLevel = filters.educationLevels[0];
      }

      // Map subjects
      if (filters.subjects.length > 0) {
        // Use the first selected subject or combine them
        criteria.subject = filters.subjects[0];
      }

      // Map teaching mode
      if (filters.teachingMode) {
        criteria.teachingMode = filters.teachingMode as 'IN_PERSON' | 'ONLINE' | 'BOTH';
      }

      // Map price range
      if (params.priceRange) {
        const priceRange = params.priceRange as string;
        if (priceRange === '0-20') {
          criteria.maxPrice = 20;
        } else if (priceRange === '20-40') {
          criteria.minPrice = 20;
          criteria.maxPrice = 40;
        } else if (priceRange === '40-60') {
          criteria.minPrice = 40;
          criteria.maxPrice = 60;
        } else if (priceRange === '60+') {
          criteria.minPrice = 60;
        }
      }

      const response = await apiClient.post<TutorSearchResult[]>('/tutors/search', criteria);
      
      // Handle different response formats
      let tutorData: TutorSearchResult[] = [];
      
      if (Array.isArray(response)) {
        tutorData = response;
      } else if (response && Array.isArray((response as any).data)) {
        tutorData = (response as any).data;
      } else {
        console.warn('API returned unexpected response format:', response);
      }
      
      setTutors(tutorData);
      setInitialLoad(false);
    } catch (err: any) {
      console.error('Search error:', err);
      // Use mock data on error for development
      setTutors(MOCK_TUTORS);
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    searchTutors();
  };

  const handleAssignTutorToSession = async (tutorId: string, tutorName: string, hourlyRate: number) => {
    if (!sessionId) return;

    Alert.alert(
      'Confirmer l\'assignation',
      `Voulez-vous assigner ${tutorName} à cette session ?\n\nTarif: ${formatHourlyRateAsFcfa(hourlyRate)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setAssigning(true);
              console.log('🔄 Assigning tutor to session:', sessionId);
              
              await apiClient.put(`/sessions/${sessionId}`, {
                tutorId,
              });

              console.log('✅ Tutor assigned successfully to session:', sessionId);

              Alert.alert(
                'Succès',
                'Le tuteur a été assigné à la session',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Failed to assign tutor to session:', error);
              const message = error.response?.data?.message || 'Impossible d\'assigner le tuteur';
              Alert.alert('Erreur', message);
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  const handleAssignTutorToTimeSlot = async (tutorId: string, tutorName: string, hourlyRate: number) => {
    if (!timeSlotId || !classId) return;

    Alert.alert(
      'Confirmer l\'assignation',
      `Voulez-vous assigner ${tutorName} à ce créneau ?\n\nTarif: ${formatHourlyRateAsFcfa(hourlyRate)}`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              setAssigning(true);
              console.log('🔄 Creating tutor assignment for time-slot:', timeSlotId);
              
              // Create the assignment with default ROUND_ROBIN pattern
              await apiClient.post(
                `/classes/${classId}/time-slots/${timeSlotId}/assignments`,
                {
                  tutorId,
                  recurrencePattern: 'ROUND_ROBIN',
                  recurrenceConfig: null,
                }
              );

              console.log('✅ Tutor assigned successfully to time-slot:', timeSlotId);

              Alert.alert(
                'Succès',
                'Le tuteur a été assigné au créneau',
                [
                  {
                    text: 'OK',
                    onPress: () => router.back(),
                  },
                ]
              );
            } catch (error: any) {
              console.error('❌ Failed to assign tutor to time-slot:', error);
              const message = error.response?.data?.message || 'Impossible d\'assigner le tuteur';
              Alert.alert('Erreur', message);
            } finally {
              setAssigning(false);
            }
          },
        },
      ]
    );
  };

  const handleTutorPress = (tutor: TutorSearchResult) => {
    if (isAssignMode) {
      if (sessionId) {
        handleAssignTutorToSession(
          tutor.userId,
          `${tutor.firstName} ${tutor.lastName}`,
          tutor.hourlyRate
        );
      } else if (timeSlotId) {
        handleAssignTutorToTimeSlot(
          tutor.userId,
          `${tutor.firstName} ${tutor.lastName}`,
          tutor.hourlyRate
        );
      }
    } else {
      router.push(`/tutors/${tutor.userId}`);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader 
        title={isAssignMode ? "Assigner un tuteur" : "Rechercher"} 
        subtitle={isAssignMode && params.subject ? `Matière: ${params.subject}` : undefined}
        showBackButton={false}
        showGradient={false} 
        variant="primary" 
      />

      {/* Search Bar */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Search size={20} color={Colors.textSecondary} strokeWidth={2} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tutors"
            placeholderTextColor={Colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => router.push('/(student)/filters')}
        >
          <SlidersHorizontal size={20} color={Colors.white} strokeWidth={2} />
        </TouchableOpacity>
      </View>

      {/* Filter Tags */}
      {(filters.countries.length > 0 || filters.rating || filters.educationLevels.length > 0 || filters.subjects.length > 0 || filters.teachingMode || filters.gender) && (
        <View style={styles.filterTags}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterTagsContent}>
            {filters.countries.map((country: string) => (
              <View key={country} style={styles.filterTag}>
                <Text style={styles.filterTagText}>{country}</Text>
              </View>
            ))}
            {filters.rating && (
              <View style={styles.filterTag}>
                <Star size={12} color={Colors.primary} fill={Colors.primary} strokeWidth={2} />
                <Text style={styles.filterTagText}>{filters.rating}+</Text>
              </View>
            )}
            {filters.educationLevels.map((level: string) => (
              <View key={level} style={styles.filterTag}>
                <Text style={styles.filterTagText}>{level}</Text>
              </View>
            ))}
            {filters.subjects.map((subject: string) => (
              <View key={subject} style={styles.filterTag}>
                <Text style={styles.filterTagText}>{subject}</Text>
              </View>
            ))}
            {filters.teachingMode && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>{filters.teachingMode}</Text>
              </View>
            )}
            {filters.gender && (
              <View style={styles.filterTag}>
                <Text style={styles.filterTagText}>{filters.gender}</Text>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* Results */}
      {loading && initialLoad ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>Recherche en cours...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {loading && !initialLoad && (
            <View style={styles.refreshingIndicator}>
              <ActivityIndicator size="small" color={Colors.primary} />
            </View>
          )}
          
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsCount}>{tutors?.length || 0} tutors</Text>
            <TouchableOpacity>
              <Text style={styles.sortText}>By relevance ▼</Text>
            </TouchableOpacity>
          </View>

          {tutors && tutors.length > 0 ? (
            tutors.map((tutor) => (
            <TouchableOpacity
              key={tutor.id}
              style={styles.tutorCard}
              onPress={() => handleTutorPress(tutor)}
              activeOpacity={0.7}
              disabled={assigning}
            >
              {/* Header: Name and Price */}
              <View style={styles.cardHeader}>
                <View style={styles.tutorAvatar}>
                  <Text style={styles.tutorAvatarText}>
                    {tutor.firstName[0]}{tutor.lastName[0]}
                  </Text>
                </View>
                
                <View style={styles.headerInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.tutorName}>
                      {tutor.firstName} {tutor.lastName}
                    </Text>
                    {tutor.isVerified && (
                      <CheckCircle2 size={16} color={Colors.primary} fill={Colors.primary} strokeWidth={2.5} />
                    )}
                  </View>
                  
                  <View style={styles.ratingRow}>
                    <Star size={14} color="#FFB800" fill="#FFB800" strokeWidth={2} />
                    <Text style={styles.ratingText}>{tutor.averageRating.toFixed(1)}</Text>
                    <Text style={styles.reviewsText}>({tutor.totalReviews})</Text>
                  </View>
                </View>

                <View style={styles.priceContainer}>
                  <Text style={styles.priceAmount}>{eurToFcfa(tutor.hourlyRate).toLocaleString('fr-FR')}</Text>
                  <Text style={styles.priceLabel}>FCFA/h</Text>
                </View>
              </View>

              {/* Subjects */}
              <View style={styles.subjectsContainer}>
                {tutor.subjects.slice(0, 4).map((subject, index) => (
                  <View key={index} style={styles.subjectChip}>
                    <Text style={styles.subjectText}>{subject}</Text>
                  </View>
                ))}
                {tutor.subjects.length > 4 && (
                  <Text style={styles.moreSubjects}>+{tutor.subjects.length - 4}</Text>
                )}
              </View>

              {/* Footer: Action Button */}
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={() => handleTutorPress(tutor)}
                disabled={assigning}
              >
                <Text style={styles.actionButtonText}>
                  {isAssignMode ? 'Assigner' : 'Voir le profil'}
                </Text>
              </TouchableOpacity>
            </TouchableOpacity>
          ))
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateTitle}>Aucun tuteur trouvé</Text>
              <Text style={styles.emptyStateText}>
                Essayez de modifier vos critères de recherche ou vos filtres
              </Text>
            </View>
          )}

          <View style={{ height: 80 }} />
        </ScrollView>
      )}
    </View>
  );
}

// Mock data for development
const MOCK_TUTORS: TutorSearchResult[] = [
  {
    id: '1',
    userId: '1',
    firstName: 'Noah',
    lastName: 'Miller',
    avatarUrl: null,
    bio: 'Skilled tutor with a proven track record of academic success. Focused on delivering clear and effective lessons.',
    hourlyRate: 30,
    subjects: ['Mathematics', 'Physics', 'Chemistry'],
    educationLevels: ['High School', 'University'],
    languages: ['English', 'French'],
    teachingMode: 'BOTH',
    averageRating: 4.8,
    totalReviews: 100,
    isVerified: true,
    matchingScore: 95,
    availability: {},
  },
  {
    id: '2',
    userId: '2',
    firstName: 'Olivia',
    lastName: 'Smith',
    avatarUrl: null,
    bio: 'Skilled tutor with a proven track record of academic success. Focused on delivering clear and effective lessons.',
    hourlyRate: 45,
    subjects: ['English', 'Literature', 'Writing'],
    educationLevels: ['High School', 'University'],
    languages: ['English', 'Spanish'],
    teachingMode: 'ONLINE',
    averageRating: 4.7,
    totalReviews: 150,
    isVerified: true,
    matchingScore: 92,
    availability: {},
  },
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  searchSection: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 115, 119, 0.08)',
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
    borderRadius: BorderRadius.large,
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterTags: {
    backgroundColor: Colors.white,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(13, 115, 119, 0.08)',
  },
  filterTagsContent: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  filterTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.small,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
  },
  filterTagText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
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
  refreshingIndicator: {
    position: 'absolute',
    top: 10,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.xlarge,
    marginHorizontal: Spacing.lg,
    ...Shadows.small,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
  },
  resultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  resultsCount: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  sortText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  tutorCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    ...Shadows.small,
  },
  
  // Card Header
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  tutorAvatar: {
    width: 52,
    height: 52,
    borderRadius: 50,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tutorAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.5,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  tutorName: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewsText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  priceContainer: {
    alignItems: 'flex-end',
  },
  priceAmount: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  priceLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginTop: -2,
  },
  
  // Subjects
  subjectsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  subjectChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.small,
    backgroundColor: Colors.bgCream,
  },
  subjectText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  moreSubjects: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    alignSelf: 'center',
  },
  
  // Action Button
  actionButton: {
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.white,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});
