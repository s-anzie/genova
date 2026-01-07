import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { 
  User,
  GraduationCap,
  Calendar,
  Award,
  Wallet,
  CreditCard,
  Settings,
  Edit2,
  ChevronRight,
  LogOut,
  Check,
  Clock,
  FileText,
  Star,
  DollarSign,
  BookOpen,
  MapPin,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors } from '@/constants/colors';
import type { UserResponse, TutorProfileResponse } from '@/types/api';
import { formatEurAsFcfa, formatHourlyRateAsFcfa } from '@/utils/currency';

// Helper function to get country name from country code
const getCountryName = (countryCode: string): string => {
  const countries: { [key: string]: string } = {
    'SN': 'Sénégal',
    'CM': 'Cameroun',
    'CI': 'Côte d\'Ivoire',
    'BJ': 'Bénin',
    'TG': 'Togo',
    'BF': 'Burkina Faso',
    'ML': 'Mali',
    'NE': 'Niger',
    'GA': 'Gabon',
    'CG': 'Congo',
    'CD': 'RD Congo',
    'FR': 'France',
    'BE': 'Belgique',
    'CH': 'Suisse',
    'CA': 'Canada',
  };
  return countries[countryCode] || countryCode;
};

export default function TutorProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [profileData, setProfileData] = useState<TutorProfileResponse | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Fetch user data
      const userResponse = await apiClient.get<{ success: boolean; data: UserResponse }>(
        `/profiles/user/${user?.id}`
      );
      setUserData(userResponse.data);

      // Fetch tutor profile - handle 404 if profile doesn't exist yet
      // Use /tutors/user/:userId endpoint which returns formatted data with subjects, educationLevels, languages
      try {
        const profileResponse = await apiClient.get<{ success: boolean; data: TutorProfileResponse }>(
          `/tutors/user/${user?.id}`
        );
        console.log('📊 Profile data loaded:', {
          subjects: profileResponse.data?.subjects,
          educationLevels: profileResponse.data?.educationLevels,
          languages: profileResponse.data?.languages,
          countryCode: profileResponse.data?.countryCode,
        });
        setProfileData(profileResponse.data);
      } catch (profileError: any) {
        console.log('❌ Profile error:', profileError.message);
        // Profile doesn't exist yet - this is OK for new users
        setProfileData(null);
      }
    } catch (error: any) {
      console.error('Failed to load profile - Full error:', error);
      console.error('Error message:', error.message);
      
      // If user data fetch fails, show error
      Alert.alert(
        'Erreur',
        `Impossible de charger le profil: ${error.message || 'Erreur inconnue'}`,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.heroHeader}>
          <View style={styles.avatarContainer}>
            {userData?.avatarUrl ? (
              <Image source={{ uri: userData.avatarUrl }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <User size={40} color={Colors.white} strokeWidth={2} />
              </View>
            )}
            <TouchableOpacity 
              style={styles.editAvatarButton}
              onPress={() => router.push('/(tutor)/profile/edit')}
            >
              <Edit2 size={16} color={Colors.white} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>
            {userData?.firstName} {userData?.lastName}
          </Text>
          <Text style={styles.userEmail}>{userData?.email}</Text>
          
          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Tuteur</Text>
            </View>
            
            {profileData?.experienceYears !== undefined && profileData.experienceYears !== null && (
              <View style={styles.experienceBadge}>
                <GraduationCap size={12} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.experienceText}>
                  {profileData.experienceYears} ans d'expérience
                </Text>
              </View>
            )}
            
            {profileData?.isVerified ? (
              <View style={styles.certifiedBadge}>
                <Check size={12} color="#4CAF50" strokeWidth={3} />
                <Text style={styles.certifiedText}>Vérifié</Text>
              </View>
            ) : (
              <View style={styles.notCertifiedBadge}>
                <Text style={styles.notCertifiedText}>Non vérifié</Text>
              </View>
            )}
          </View>
        </View>

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Clock size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.statValue}>{profileData?.totalHoursTaught || 0}</Text>
            <Text style={styles.statLabel}>Heures</Text>
          </View>
          <View style={styles.statCard}>
            <Star size={20} color="#FFD700" strokeWidth={2} />
            <Text style={styles.statValue}>{Number(profileData?.averageRating || 0).toFixed(1)}</Text>
            <Text style={styles.statLabel}>Note</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.statValue}>{profileData?.totalReviews || 0}</Text>
            <Text style={styles.statLabel}>Avis</Text>
          </View>
        </View>

        {profileData?.bio && (
          <View style={styles.bioSection}>
            <Text style={styles.bioTitle}>À propos</Text>
            <Text style={styles.bioText}>{profileData.bio}</Text>
          </View>
        )}

        {profileData?.hourlyRate && (
          <View style={styles.rateSection}>
            <DollarSign size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.rateText}>
              Tarif: <Text style={styles.rateValue}>{formatHourlyRateAsFcfa(profileData.hourlyRate)}</Text>
            </Text>
          </View>
        )}

        {/* Competencies and Information Section */}
        {(profileData?.subjects || profileData?.countryCode || profileData?.educationLevels || profileData?.languages) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Compétences et Informations</Text>
            
            {/* Subjects */}
            {profileData?.subjects && profileData.subjects.length > 0 ? (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#E8F5F5' }]}>
                    <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Matières enseignées</Text>
                    <Text style={styles.menuSubtitle} numberOfLines={2}>
                      {profileData.subjects.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            ) : profileData && (
              <TouchableOpacity 
                style={styles.menuItem}
                onPress={() => router.push('/(tutor)/profile/edit')}
              >
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                    <BookOpen size={20} color="#FF9800" strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Matières enseignées</Text>
                    <Text style={styles.menuSubtitle}>Aucune matière configurée</Text>
                  </View>
                </View>
                <ChevronRight size={20} color="#999" strokeWidth={2} />
              </TouchableOpacity>
            )}
            
            {/* Education Levels */}
            {profileData?.educationLevels && profileData.educationLevels.length > 0 && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                    <GraduationCap size={20} color="#9C27B0" strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Niveaux enseignés</Text>
                    <Text style={styles.menuSubtitle} numberOfLines={2}>
                      {profileData.educationLevels.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Languages */}
            {profileData?.languages && profileData.languages.length > 0 && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                    <Text style={styles.languageIcon}>🌐</Text>
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Langues d'enseignement</Text>
                    <Text style={styles.menuSubtitle} numberOfLines={2}>
                      {profileData.languages.join(', ')}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {/* Country */}
            {profileData?.countryCode && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
                    <MapPin size={20} color="#2196F3" strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Pays</Text>
                    <Text style={styles.menuSubtitle}>{getCountryName(profileData.countryCode)}</Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Gestion du profil</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tutor)/availability')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5F5' }]}>
                <Clock size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Disponibilités</Text>
                <Text style={styles.menuSubtitle}>Gérer mon emploi du temps</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tutor)/profile/documents')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                <FileText size={20} color="#FF9800" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Documents</Text>
                <Text style={styles.menuSubtitle}>Vérification et diplômes</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tutor)/(tabs)/sessions')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                <Calendar size={20} color="#9C27B0" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Mes sessions</Text>
                <Text style={styles.menuSubtitle}>Voir mes cours planifiés</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finances</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tutor)/wallet')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
                <Wallet size={20} color="#4CAF50" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Mon portefeuille</Text>
                <Text style={styles.menuSubtitle}>
                  Solde: {userData?.walletBalance ? formatEurAsFcfa(Number(userData.walletBalance)) : '0 FCFA'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tutor)/wallet/transactions')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF3E0' }]}>
                <CreditCard size={20} color="#FF9800" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Transactions</Text>
                <Text style={styles.menuSubtitle}>Historique des paiements</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(tutor)/profile/edit')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F5F5F5' }]}>
                <Edit2 size={20} color="#666" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Modifier le profil</Text>
                <Text style={styles.menuSubtitle}>Informations personnelles</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => {}}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F5F5F5' }]}>
                <Settings size={20} color="#666" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Paramètres</Text>
                <Text style={styles.menuSubtitle}>Préférences et notifications</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={handleLogout}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFEBEE' }]}>
                <LogOut size={20} color={Colors.error} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={[styles.menuTitle, { color: Colors.error }]}>Déconnexion</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>
        </View>
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
    backgroundColor: Colors.bgCream,
  },

  scrollView: {
    flex: 1,
  },

  // Hero Header
  heroHeader: {
    backgroundColor: Colors.primary,
    paddingTop: 60, // Status bar spacing
    paddingBottom: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  editAvatarButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.white,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 16,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  roleBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  roleBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
  },
  experienceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  experienceText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  certifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.4)',
  },
  certifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  notCertifiedBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
  },
  notCertifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },

  // Stats
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginTop: -24,
    marginBottom: 16,
    zIndex: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Bio Section
  bioSection: {
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  bioTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  bioText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // Rate Section
  rateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  rateText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  rateValue: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
  },

  // Language Icon
  languageIcon: {
    fontSize: 20,
  },

  // Sections
  section: {
    backgroundColor: Colors.white,
    marginBottom: 16,
    paddingVertical: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },

  // Menu Items
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  menuIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuText: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
});
