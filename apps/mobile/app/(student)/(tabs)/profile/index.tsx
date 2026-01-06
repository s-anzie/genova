import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
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
  Crown,
  BookOpen,
  Mail,
  Phone,
  DollarSign,
  Globe,
  School,
} from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors, Shadows, BorderRadius, Spacing } from '@/constants/colors';
import { formatEurAsFcfa } from '@/utils/currency';
import { StyledModal } from '@/components/ui/StyledModal';
import { useModal } from '@/hooks/useModal';

export default function StudentProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const { modalState, hideModal, showError, showConfirm } = useModal();
  const [isLoading, setIsLoading] = useState(true);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      
      // Use the existing route with user ID
      const response = await apiClient.get(`/profiles/student/${user?.id}`);
      setProfileData(response.data);
    } catch (error: any) {
      const errorMessage = error?.message || (typeof error === 'string' ? error : 'Impossible de charger le profil');
      showError('Erreur', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    showConfirm(
      'Déconnexion',
      'Êtes-vous sûr de vouloir vous déconnecter ?',
      async () => {
        await logout();
        router.replace('/(auth)/login');
      }
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
            {profileData?.user?.avatarUrl ? (
              <Image source={{ uri: profileData.user.avatarUrl }} style={styles.avatar} />
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
            {profileData?.user?.firstName} {profileData?.user?.lastName}
          </Text>
          <Text style={styles.userEmail}>{profileData?.user?.email}</Text>
          
          <View style={styles.badgesRow}>
            <View style={styles.roleBadge}>
              <Text style={styles.roleBadgeText}>Étudiant</Text>
            </View>
            
            {profileData?.educationLevel && (
              <View style={styles.educationBadge}>
                <GraduationCap size={12} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.educationText}>
                  {profileData.educationLevel.name}
                </Text>
              </View>
            )}
            
            {profileData?.educationStream && (
              <View style={styles.achievementBadge}>
                <Award size={12} color="#FFD700" strokeWidth={2} />
                <Text style={styles.achievementText}>{profileData.educationStream.name}</Text>
              </View>
            )}
            
            {/* Certification status */}
            {profileData?.user?.isVerified ? (
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

        {/* Education Information */}
        {profileData && (profileData.educationSystem || profileData.educationLevel || profileData.educationStream || profileData.schoolName) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Éducation</Text>
            
            {profileData.educationSystem?.country && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#E8F5F5' }]}>
                    <Globe size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Pays</Text>
                    <Text style={styles.menuSubtitle}>
                      {profileData.educationSystem.country.name}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {profileData.educationSystem && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#E8F5F5' }]}>
                    <BookOpen size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Système éducatif</Text>
                    <Text style={styles.menuSubtitle}>
                      {profileData.educationSystem.name}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {profileData.educationLevel && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#E8F5F5' }]}>
                    <GraduationCap size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Niveau</Text>
                    <Text style={styles.menuSubtitle}>
                      {profileData.educationLevel.name}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {profileData.educationStream && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Award size={20} color="#9C27B0" strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Filière</Text>
                    <Text style={styles.menuSubtitle}>
                      {profileData.educationStream.name}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {profileData.schoolName && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#E8F5F5' }]}>
                    <School size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>École</Text>
                    <Text style={styles.menuSubtitle}>
                      {profileData.schoolName}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Preferred Subjects */}
        {profileData && ((profileData.preferredLevelSubjects && profileData.preferredLevelSubjects.length > 0) ||
          (profileData.preferredStreamSubjects && profileData.preferredStreamSubjects.length > 0)) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matières préférées</Text>
            
            <View style={styles.subjectsSection}>
              {/* Level Subjects */}
              {profileData.preferredLevelSubjects?.map((ps: any) => (
                <View key={`level-${ps.id}`} style={styles.subjectItem}>
                  <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                    <BookOpen size={20} color="#FF9800" strokeWidth={2} />
                  </View>
                  <Text style={styles.subjectName}>
                    {ps.levelSubject?.subject?.icon && `${ps.levelSubject.subject.icon} `}
                    {ps.levelSubject?.subject?.name || 'Matière'}
                  </Text>
                </View>
              ))}
              {/* Stream Subjects */}
              {profileData.preferredStreamSubjects?.map((ps: any) => (
                <View key={`stream-${ps.id}`} style={styles.subjectItem}>
                  <View style={[styles.menuIcon, { backgroundColor: '#FFF4E6' }]}>
                    <BookOpen size={20} color="#FF9800" strokeWidth={2} />
                  </View>
                  <Text style={styles.subjectName}>
                    {ps.streamSubject?.subject?.icon && `${ps.streamSubject.subject.icon} `}
                    {ps.streamSubject?.subject?.name || 'Matière'}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Parent Information */}
        {profileData && (profileData.parentEmail || profileData.parentPhone) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Contact des parents</Text>
            
            {profileData.parentEmail && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Mail size={20} color="#9C27B0" strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Email</Text>
                    <Text style={styles.menuSubtitle}>
                      {profileData.parentEmail}
                    </Text>
                  </View>
                </View>
              </View>
            )}
            
            {profileData.parentPhone && (
              <View style={styles.menuItem}>
                <View style={styles.menuLeft}>
                  <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                    <Phone size={20} color="#9C27B0" strokeWidth={2} />
                  </View>
                  <View style={styles.menuText}>
                    <Text style={styles.menuTitle}>Téléphone</Text>
                    <Text style={styles.menuSubtitle}>
                      {profileData.parentPhone}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        )}

        {/* Budget */}
        {profileData && profileData.budgetPerHour && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            
            <View style={styles.menuItem}>
              <View style={styles.menuLeft}>
                <View style={[styles.menuIcon, { backgroundColor: '#E8F5E9' }]}>
                  <DollarSign size={20} color="#4CAF50" strokeWidth={2} />
                </View>
                <View style={styles.menuText}>
                  <Text style={styles.menuTitle}>Tarif horaire</Text>
                  <Text style={styles.menuSubtitle}>
                    {formatEurAsFcfa(Number(profileData.budgetPerHour))}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

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
            onPress={() => router.push('/(student)/(tabs)/learn/sessions')}
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
            onPress={() => router.push('/(student)/(tabs)/learn/progress')}
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
            onPress={() => router.push('/(student)/subscription')}
          >
            <View style={styles.menuLeft}>
              <View style={[styles.menuIcon, { backgroundColor: '#F3E8FF' }]}>
                <Crown size={20} color="#9C27B0" strokeWidth={2} />
              </View>
              <View style={styles.menuText}>
                <Text style={styles.menuTitle}>Mon abonnement</Text>
                <Text style={styles.menuSubtitle}>
                  {profileData?.user?.subscriptionType === 'FREE' ? 'Plan gratuit' : 
                   profileData?.user?.subscriptionType === 'BASIC' ? 'Plan Basic' :
                   profileData?.user?.subscriptionType === 'PREMIUM' ? 'Plan Premium' :
                   profileData?.user?.subscriptionType === 'PRO' ? 'Plan Pro' : 'Gratuit'}
                </Text>
              </View>
            </View>
            <ChevronRight size={20} color="#999" strokeWidth={2} />
          </TouchableOpacity>
          
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
                  Solde: {profileData?.user?.walletBalance ? formatEurAsFcfa(Number(profileData.user.walletBalance)) : '0 FCFA'}
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

      <StyledModal
        visible={modalState.visible}
        type={modalState.type}
        title={modalState.title}
        message={modalState.message}
        primaryButton={modalState.primaryButton}
        secondaryButton={modalState.secondaryButton}
        onClose={hideModal}
      />
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

  // Subjects Section
  subjectsSection: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  subjectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  subjectName: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
});
