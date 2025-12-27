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
  Users,
  Calendar,
  TrendingUp,
  Award,
  Wallet,
  CreditCard,
  Settings,
  Edit2,
  ChevronRight,
  LogOut,
  Check,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors } from '@/constants/colors';
import { API_BASE_URL } from '@/config/api';
import type { UserResponse, StudentProfileResponse } from '@/types/api';
import { formatEurAsFcfa } from '@/utils/currency';

const EDUCATION_LEVELS: Record<string, string> = {
  primary: 'École primaire',
  middle_school: 'Collège',
  high_school: 'Lycée',
  university: 'Université',
  graduate: 'Études supérieures',
};

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState<UserResponse | null>(null);
  const [profileData, setProfileData] = useState<StudentProfileResponse | null>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading profile for user:', user?.id);
      
      // Fetch user data
      console.log('Fetching user data from:', `/profiles/user/${user?.id}`);
      const userResponse = await apiClient.get<{ success: boolean; data: UserResponse }>(
        `/profiles/user/${user?.id}`
      );
      console.log('User response:', userResponse);
      setUserData(userResponse.data);

      // Fetch student profile - handle 404 if profile doesn't exist yet
      try {
        console.log('Fetching student profile from:', `/profiles/student/${user?.id}`);
        const profileResponse = await apiClient.get<{ success: boolean; data: StudentProfileResponse }>(
          `/profiles/student/${user?.id}`
        );
        console.log('Profile response:', profileResponse);
        setProfileData(profileResponse.data);
      } catch (profileError: any) {
        console.log('Student profile not found (404) - this is normal for new users');
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
        {/* Hero Header */}
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
              onPress={() => router.push('/(student)/(tabs)/profile/edit')}
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
              <Text style={styles.roleBadgeText}>Étudiant</Text>
            </View>
            
            {profileData?.educationLevel && (
              <View style={styles.educationBadge}>
                <GraduationCap size={12} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.educationText}>
                  {EDUCATION_LEVELS[profileData.educationLevel]}
                </Text>
              </View>
            )}
            
            {/* Badge le plus récent ou "New" */}
            <View style={styles.achievementBadge}>
              <Award size={12} color="#FFD700" strokeWidth={2} />
              <Text style={styles.achievementText}>New</Text>
            </View>
            
            {/* Certification status */}
            {userData?.isVerified ? (
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

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Users size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Classes</Text>
          </View>
          <View style={styles.statCard}>
            <Calendar size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCard}>
            <Award size={20} color={Colors.primary} strokeWidth={2} />
            <Text style={styles.statValue}>0</Text>
            <Text style={styles.statLabel}>Badges</Text>
          </View>
        </View>

        {/* Main Actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Mon activité</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(student)/classes')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#E8F5F5' }]}>
                <Users size={20} color={Colors.primary} strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Mes classes</Text>
                <Text style={styles.menuSubtitle}>Gérer mes groupes d'étude</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(student)/(tabs)/sessions')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                <Calendar size={20} color="#FF9800" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Mes sessions</Text>
                <Text style={styles.menuSubtitle}>Voir mes cours planifiés</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(student)/(tabs)/progress')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                <TrendingUp size={20} color="#9C27B0" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Ma progression</Text>
                <Text style={styles.menuSubtitle}>Suivre mes résultats</Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>
        </View>

        {/* Financial */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Finances</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/wallet')}
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
            onPress={() => router.push('/wallet/transactions')}
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

        {/* Account */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Compte</Text>
          
          <TouchableOpacity 
            style={styles.menuItem}
            onPress={() => router.push('/(student)/(tabs)/profile/edit')}
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
            onPress={() => {/* TODO: Settings */}}
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
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
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
  educationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.white,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  educationText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.primary,
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  achievementText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFD700',
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

