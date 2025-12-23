import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Search, SlidersHorizontal, Star, CheckCircle2, MapPin, TrendingUp } from 'lucide-react-native';
import { PageHeader } from '@/components/PageHeader';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { ApiClient } from '@/utils/api';
import { TutorSearchResult, TutorSearchCriteria } from '@/types/api';

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [tutors, setTutors] = useState<TutorSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
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

      const response = await ApiClient.post<TutorSearchResult[]>('/tutors/search', criteria);
      
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

  return (
    <View style={styles.container}>
      <PageHeader title="Rechercher" showGradient={false} />

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
          onPress={() => router.push('/(student)/(tabs)/search/filters')}
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
              onPress={() => router.push(`/tutors/${tutor.userId}`)}
              activeOpacity={0.7}
            >
              {/* Top Section with Avatar and Info */}
              <View style={styles.cardTop}>
                <View style={styles.avatarSection}>
                  <View style={styles.tutorAvatar}>
                    <Text style={styles.tutorAvatarText}>
                      {tutor.firstName[0]}{tutor.lastName[0]}
                    </Text>
                    {tutor.isVerified && (
                      <View style={styles.verifiedBadge}>
                        <CheckCircle2 size={14} color={Colors.white} fill={Colors.primary} strokeWidth={3} />
                      </View>
                    )}
                  </View>
                  
                  {/* Rating Badge on Avatar */}
                  <View style={styles.ratingBadge}>
                    <Star size={12} color="#FFB800" fill="#FFB800" strokeWidth={2.5} />
                    <Text style={styles.ratingBadgeText}>{tutor.averageRating.toFixed(1)}</Text>
                  </View>
                </View>

                <View style={styles.tutorMainInfo}>
                  <View style={styles.nameSection}>
                    <Text style={styles.tutorName}>
                      {tutor.firstName} {tutor.lastName}
                    </Text>
                    {tutor.matchingScore >= 90 && (
                      <View style={styles.matchBadge}>
                        <TrendingUp size={11} color="#4CAF50" strokeWidth={2.5} />
                        <Text style={styles.matchBadgeText}>{tutor.matchingScore}%</Text>
                      </View>
                    )}
                  </View>
                  
                  <View style={styles.metaInfo}>
                    <View style={styles.metaItem}>
                      <Text style={styles.metaText}>{tutor.totalReviews} avis</Text>
                    </View>
                    {tutor.distance && (
                      <>
                        <View style={styles.metaDot} />
                        <View style={styles.metaItem}>
                          <MapPin size={11} color={Colors.textTertiary} strokeWidth={2} />
                          <Text style={styles.metaText}>{tutor.distance.toFixed(1)} km</Text>
                        </View>
                      </>
                    )}
                    {tutor.teachingMode === 'ONLINE' && (
                      <>
                        <View style={styles.metaDot} />
                        <View style={styles.onlineBadge}>
                          <View style={styles.onlineDot} />
                          <Text style={styles.onlineText}>En ligne</Text>
                        </View>
                      </>
                    )}
                  </View>
                </View>

                {/* Price Tag */}
                <View style={styles.priceTag}>
                  <Text style={styles.priceAmount}>{tutor.hourlyRate}€</Text>
                  <Text style={styles.priceLabel}>/h</Text>
                </View>
              </View>

              {/* Bio Section */}
              <Text style={styles.tutorBio} numberOfLines={2}>
                {tutor.bio || 'Tuteur expérimenté avec un excellent historique de réussite académique. Spécialisé dans des cours clairs et efficaces.'}
              </Text>

              {/* Subjects Section */}
              <View style={styles.subjectsSection}>
                <View style={styles.subjectsRow}>
                  {tutor.subjects.slice(0, 3).map((subject, index) => (
                    <View key={index} style={styles.subjectPill}>
                      <Text style={styles.subjectPillText}>{subject}</Text>
                    </View>
                  ))}
                  {tutor.subjects.length > 3 && (
                    <View style={[styles.subjectPill, styles.subjectPillMore]}>
                      <Text style={styles.subjectPillTextMore}>+{tutor.subjects.length - 3}</Text>
                    </View>
                  )}
                </View>
              </View>

              {/* Action Footer */}
              <View style={styles.cardFooter}>
                <TouchableOpacity style={styles.viewProfileButton}>
                  <Text style={styles.viewProfileText}>Voir le profil</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.favoriteButton}>
                  <Text style={styles.favoriteIcon}>♡</Text>
                </TouchableOpacity>
              </View>
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
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    ...Shadows.medium,
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.06)',
  },
  
  // Card Top Section
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  avatarSection: {
    position: 'relative',
    marginRight: 10,
  },
  tutorAvatar: {
    width: 44,
    height: 44,
    borderRadius: 11,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
    borderColor: 'rgba(13, 115, 119, 0.12)',
  },
  tutorAvatarText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  verifiedBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  ratingBadge: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: Colors.white,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 8,
    ...Shadows.small,
    borderWidth: 1,
    borderColor: 'rgba(255, 184, 0, 0.15)',
  },
  ratingBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  
  // Main Info Section
  tutorMainInfo: {
    flex: 1,
  },
  nameSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 3,
  },
  tutorName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  matchBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    backgroundColor: 'rgba(76, 175, 80, 0.12)',
  },
  matchBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#4CAF50',
  },
  metaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flexWrap: 'wrap',
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  metaText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontWeight: '500',
  },
  metaDot: {
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: Colors.textTertiary,
    opacity: 0.4,
  },
  onlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  onlineDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#4CAF50',
  },
  onlineText: {
    fontSize: 11,
    color: '#4CAF50',
    fontWeight: '600',
  },
  
  // Price Tag
  priceTag: {
    alignItems: 'flex-end',
    paddingLeft: 8,
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
    marginTop: -1,
  },
  
  // Bio Section
  tutorBio: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginBottom: 8,
    fontWeight: '400',
  },
  
  // Subjects Section
  subjectsSection: {
    marginBottom: 8,
  },
  subjectsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 5,
  },
  subjectPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 7,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.12)',
  },
  subjectPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  subjectPillMore: {
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
  },
  subjectPillTextMore: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  
  // Card Footer
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(13, 115, 119, 0.08)',
  },
  viewProfileButton: {
    flex: 1,
    height: 36,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.small,
  },
  viewProfileText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
    letterSpacing: -0.2,
  },
  favoriteButton: {
    width: 36,
    height: 36,
    borderRadius: 9,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(13, 115, 119, 0.12)',
  },
  favoriteIcon: {
    fontSize: 16,
    color: Colors.primary,
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
