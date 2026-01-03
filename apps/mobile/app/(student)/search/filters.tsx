import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { X, Star, Check, ChevronRight } from 'lucide-react-native';
import { Colors } from '@/constants/colors';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

const RATING_OPTIONS = [
  { label: 'Toutes les notes', value: null },
  { label: '5 étoiles', value: 5, stars: 5 },
  { label: '4 étoiles et plus', value: 4, stars: 4 },
  { label: '3 étoiles et plus', value: 3, stars: 3 },
];

const EDUCATION_LEVEL_OPTIONS = [
  { label: 'Primaire', value: 'primary' },
  { label: 'Collège', value: 'middle_school' },
  { label: 'Lycée', value: 'high_school' },
  { label: 'Université', value: 'university' },
];

const SUBJECT_OPTIONS = [
  { label: 'Mathématiques', value: 'Mathematics' },
  { label: 'Physique', value: 'Physics' },
  { label: 'Chimie', value: 'Chemistry' },
  { label: 'Biologie', value: 'Biology' },
  { label: 'Anglais', value: 'English' },
  { label: 'Français', value: 'French' },
  { label: 'Histoire', value: 'History' },
  { label: 'Géographie', value: 'Geography' },
  { label: 'Informatique', value: 'Computer Science' },
  { label: 'Économie', value: 'Economics' },
];

const TEACHING_MODE_OPTIONS = [
  { label: 'En personne', value: 'IN_PERSON' },
  { label: 'En ligne', value: 'ONLINE' },
  { label: 'Les deux', value: 'BOTH' },
];

const PRICE_RANGES = [
  { label: 'Moins de 13 000 FCFA', value: '0-20' },
  { label: '13 000 - 26 000 FCFA', value: '20-40' },
  { label: '26 000 - 39 000 FCFA', value: '40-60' },
  { label: 'Plus de 39 000 FCFA', value: '60+' },
];

const GENDER_OPTIONS = [
  { label: 'Homme', value: 'male' },
  { label: 'Femme', value: 'female' },
  { label: 'Autre', value: 'other' },
];

const AGE_RANGES = [
  { label: '18-25 ans', value: '18-25' },
  { label: '26-35 ans', value: '26-35' },
  { label: '36-45 ans', value: '36-45' },
  { label: '46-55 ans', value: '46-55' },
  { label: 'Plus de 55 ans', value: '55+' },
];

export default function FiltersScreen() {
  const router = useRouter();
  
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedEducationLevels, setSelectedEducationLevels] = useState<string[]>([]);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [selectedTeachingMode, setSelectedTeachingMode] = useState<string | null>(null);
  const [selectedPriceRange, setSelectedPriceRange] = useState<string | null>(null);
  const [selectedGender, setSelectedGender] = useState<string | null>(null);
  const [selectedAgeRange, setSelectedAgeRange] = useState<string | null>(null);

  const toggleEducationLevel = (value: string) => {
    if (selectedEducationLevels.includes(value)) {
      setSelectedEducationLevels(selectedEducationLevels.filter((e) => e !== value));
    } else {
      setSelectedEducationLevels([...selectedEducationLevels, value]);
    }
  };

  const toggleSubject = (value: string) => {
    if (selectedSubjects.includes(value)) {
      setSelectedSubjects(selectedSubjects.filter((s) => s !== value));
    } else {
      setSelectedSubjects([...selectedSubjects, value]);
    }
  };

  const resetFilters = () => {
    setSelectedRating(null);
    setSelectedEducationLevels([]);
    setSelectedSubjects([]);
    setSelectedTeachingMode(null);
    setSelectedPriceRange(null);
    setSelectedGender(null);
    setSelectedAgeRange(null);
  };

  const applyFilters = () => {
    const params: any = {};
    
    if (selectedRating) {
      params.rating = selectedRating;
    }
    
    if (selectedEducationLevels.length > 0) {
      params.educationLevels = JSON.stringify(selectedEducationLevels);
    }

    if (selectedSubjects.length > 0) {
      params.subjects = JSON.stringify(selectedSubjects);
    }

    if (selectedTeachingMode) {
      params.teachingMode = selectedTeachingMode;
    }

    if (selectedPriceRange) {
      params.priceRange = selectedPriceRange;
    }

    if (selectedGender) {
      params.gender = selectedGender;
    }

    if (selectedAgeRange) {
      params.ageRange = selectedAgeRange;
    }

    router.push({
      pathname: '/(student)/search',
      params,
    });
  };

  const renderStars = (count: number) => {
    return (
      <View style={styles.starsContainer}>
        {[1, 2, 3, 4, 5].map((i) => (
          <Star
            key={i}
            size={16}
            color={i <= count ? '#FFB800' : '#E0E0E0'}
            fill={i <= count ? '#FFB800' : 'transparent'}
            strokeWidth={2}
          />
        ))}
      </View>
    );
  };

  const activeFiltersCount = 
    (selectedRating ? 1 : 0) + 
    selectedEducationLevels.length +
    selectedSubjects.length +
    (selectedTeachingMode ? 1 : 0) +
    (selectedPriceRange ? 1 : 0) +
    (selectedGender ? 1 : 0) +
    (selectedAgeRange ? 1 : 0);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="rgba(0,0,0,0.5)" translucent />
      
      {/* Backdrop */}
      <TouchableOpacity 
        style={styles.backdrop} 
        activeOpacity={1} 
        onPress={() => router.back()}
      />

      {/* Modal Content */}
      <View style={styles.modalContent}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <X size={24} color={Colors.textPrimary} strokeWidth={2.5} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Filtres</Text>
            <TouchableOpacity onPress={resetFilters} disabled={activeFiltersCount === 0}>
              <Text style={[styles.clearText, activeFiltersCount === 0 && styles.clearTextDisabled]}>
                Réinitialiser
              </Text>
            </TouchableOpacity>
          </View>
          {activeFiltersCount > 0 && (
            <View style={styles.activeFiltersBar}>
              <Text style={styles.activeFiltersText}>
                {activeFiltersCount} filtre{activeFiltersCount > 1 ? 's' : ''} actif{activeFiltersCount > 1 ? 's' : ''}
              </Text>
            </View>
          )}
        </View>

        {/* Scrollable Content */}
        <View style={styles.contentContainer}>
          <ScrollView 
            style={styles.scrollView} 
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Price Range */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tarif horaire</Text>
              <View style={styles.priceGrid}>
                {PRICE_RANGES.map((range) => {
                  const isSelected = selectedPriceRange === range.value;
                  return (
                    <TouchableOpacity
                      key={range.value}
                      style={[styles.priceChip, isSelected && styles.priceChipActive]}
                      onPress={() => setSelectedPriceRange(isSelected ? null : range.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.priceText, isSelected && styles.priceTextActive]}>
                        {range.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Check size={14} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Subject Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Matières</Text>
              <View style={styles.experienceGrid}>
                {SUBJECT_OPTIONS.map((option) => {
                  const isSelected = selectedSubjects.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.experienceChip, isSelected && styles.experienceChipActive]}
                      onPress={() => toggleSubject(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.experienceText, isSelected && styles.experienceTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIconSmall}>
                          <Check size={12} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Education Level Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Niveau d'éducation</Text>
              <View style={styles.experienceGrid}>
                {EDUCATION_LEVEL_OPTIONS.map((option) => {
                  const isSelected = selectedEducationLevels.includes(option.value);
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.experienceChip, isSelected && styles.experienceChipActive]}
                      onPress={() => toggleEducationLevel(option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.experienceText, isSelected && styles.experienceTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIconSmall}>
                          <Check size={12} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Teaching Mode Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Mode d'enseignement</Text>
              <View style={styles.experienceGrid}>
                {TEACHING_MODE_OPTIONS.map((option) => {
                  const isSelected = selectedTeachingMode === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.experienceChip, isSelected && styles.experienceChipActive]}
                      onPress={() => setSelectedTeachingMode(isSelected ? null : option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.experienceText, isSelected && styles.experienceTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIconSmall}>
                          <Check size={12} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Rating Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Note minimale</Text>
              <View style={styles.ratingList}>
                {RATING_OPTIONS.map((option) => {
                  const isSelected = selectedRating === option.value;
                  return (
                    <TouchableOpacity
                      key={option.label}
                      style={[styles.ratingOption, isSelected && styles.ratingOptionActive]}
                      onPress={() => setSelectedRating(option.value)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.ratingLeft}>
                        {option.stars ? renderStars(option.stars) : null}
                        <Text style={[styles.ratingLabel, isSelected && styles.ratingLabelActive]}>
                          {option.label}
                        </Text>
                      </View>
                      <View style={[styles.radio, isSelected && styles.radioActive]}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Gender Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Sexe</Text>
              <View style={styles.genderGrid}>
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = selectedGender === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[styles.genderChip, isSelected && styles.genderChipActive]}
                      onPress={() => setSelectedGender(isSelected ? null : option.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.genderText, isSelected && styles.genderTextActive]}>
                        {option.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIconSmall}>
                          <Check size={12} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Age Range Filter */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Tranche d'âge</Text>
              <View style={styles.ageGrid}>
                {AGE_RANGES.map((range) => {
                  const isSelected = selectedAgeRange === range.value;
                  return (
                    <TouchableOpacity
                      key={range.value}
                      style={[styles.ageChip, isSelected && styles.ageChipActive]}
                      onPress={() => setSelectedAgeRange(isSelected ? null : range.value)}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.ageText, isSelected && styles.ageTextActive]}>
                        {range.label}
                      </Text>
                      {isSelected && (
                        <View style={styles.checkIconSmall}>
                          <Check size={12} color={Colors.white} strokeWidth={3} />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <View style={{ height: 100 }} />
          </ScrollView>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.applyButton} 
            onPress={applyFilters}
            activeOpacity={0.8}
          >
            <Text style={styles.applyButtonText}>
              Appliquer les filtres
            </Text>
            <ChevronRight size={20} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: SCREEN_HEIGHT * 0.85,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.06)',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: -10,
    borderRadius: 20,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  clearText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  clearTextDisabled: {
    color: Colors.textTertiary,
  },
  activeFiltersBar: {
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  activeFiltersText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  contentContainer: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },

  // Price styles
  priceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  priceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  priceChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  priceTextActive: {
    color: Colors.white,
  },
  checkIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Rating styles
  ratingList: {
    gap: 10,
  },
  ratingOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ratingOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
  },
  ratingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  starsContainer: {
    flexDirection: 'row',
    gap: 2,
  },
  ratingLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ratingLabelActive: {
    color: Colors.primary,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#E0E0E0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioActive: {
    borderColor: Colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.primary,
  },

  // Experience styles
  experienceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  experienceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  experienceChipActive: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderColor: Colors.primary,
  },
  experienceText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  experienceTextActive: {
    color: Colors.primary,
  },
  checkIconSmall: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Gender styles
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  genderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  genderChipActive: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderColor: Colors.primary,
  },
  genderText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  genderTextActive: {
    color: Colors.primary,
  },

  // Age styles
  ageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  ageChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  ageChipActive: {
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    borderColor: Colors.primary,
  },
  ageText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  ageTextActive: {
    color: Colors.primary,
  },

  // Footer
  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 30 : 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.06)',
  },
  applyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
