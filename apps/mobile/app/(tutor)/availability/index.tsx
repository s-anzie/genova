import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import {
  Calendar,
  Clock,
  Plus,
  Trash2,
  CalendarDays,
  Check,
  X,
  List,
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';

interface TutorAvailability {
  id: string;
  tutorId: string;
  dayOfWeek: number | null;
  specificDate: string | null;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
  isActive: boolean;
  createdAt: string;
}

const DAYS_OF_WEEK = [
  { value: 1, label: 'Lun', fullLabel: 'Lundi' },
  { value: 2, label: 'Mar', fullLabel: 'Mardi' },
  { value: 3, label: 'Mer', fullLabel: 'Mercredi' },
  { value: 4, label: 'Jeu', fullLabel: 'Jeudi' },
  { value: 5, label: 'Ven', fullLabel: 'Vendredi' },
  { value: 6, label: 'Sam', fullLabel: 'Samedi' },
  { value: 0, label: 'Dim', fullLabel: 'Dimanche' },
];

type ViewMode = 'calendar' | 'list';
type AddMode = 'recurring' | 'oneTime' | null;

export default function TutorAvailabilityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [availability, setAvailability] = useState<TutorAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState<AddMode>(null);
  const [selectedDateForAdd, setSelectedDateForAdd] = useState<Date | null>(null);
  const [selectedHourForAdd, setSelectedHourForAdd] = useState<number | null>(null);

  // Continued in next part...

  function getWeekStart(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff));
  }

  function getWeekDates(weekStart: Date): Date[] {
    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + i);
      return date;
    });
  }

  function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  useEffect(() => {
    loadAvailability();
  }, []);

  const loadAvailability = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get<{ success: boolean; data: TutorAvailability[] }>(
        `/tutors/${user?.id}/availability`
      );

      const availabilityData = response.data || [];
      setAvailability(availabilityData.filter(a => a.isActive));
    } catch (error) {
      console.error('Failed to load availability:', error);
      Alert.alert('Erreur', 'Impossible de charger vos disponibilités');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAvailability();
  };

  const handleDelete = (id: string, isRecurring: boolean) => {
    Alert.alert(
      'Confirmer la suppression',
      `Êtes-vous sûr de vouloir supprimer cette disponibilité ${isRecurring ? 'récurrente' : 'ponctuelle'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: () => deleteAvailability(id),
        },
      ]
    );
  };

  const deleteAvailability = async (id: string) => {
    try {
      await apiClient.delete(`/tutors/availability/${id}`);
      setAvailability(prev => prev.filter(a => a.id !== id));
      Alert.alert('Succès', 'Disponibilité supprimée avec succès');
    } catch (error) {
      console.error('Failed to delete availability:', error);
      Alert.alert('Erreur', 'Impossible de supprimer la disponibilité');
    }
  };

  const getAvailabilityForDate = (date: Date): TutorAvailability[] => {
    const dayOfWeek = date.getDay();
    const dateKey = formatDateKey(date);
    
    return availability.filter(a => {
      if (a.isRecurring && a.dayOfWeek === dayOfWeek) return true;
      if (!a.isRecurring && a.specificDate === dateKey) return true;
      return false;
    });
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const hasAvailabilityAtTime = (date: Date, hour: number): boolean => {
    const slots = getAvailabilityForDate(date);
    return slots.some((slot) => {
      const slotStart = timeToMinutes(slot.startTime);
      const slotEnd = timeToMinutes(slot.endTime);
      return slotStart <= hour * 60 && slotEnd > hour * 60;
    });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Disponibilités</Text>
          <View style={styles.headerButton} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  const weekDates = getWeekDates(currentWeekStart);
  const recurringAvailability = availability.filter(a => a.isRecurring);
  const oneTimeAvailability = availability.filter(a => !a.isRecurring);

  // Continued in next part...

  const renderCalendarView = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Week Navigation */}
      <View style={styles.weekNav}>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => {
            const newWeek = new Date(currentWeekStart);
            newWeek.setDate(newWeek.getDate() - 7);
            setCurrentWeekStart(newWeek);
          }}
        >
          <ChevronLeft size={20} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.weekNavText}>
          {currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} -{' '}
          {weekDates[6].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </Text>
        <TouchableOpacity
          style={styles.weekNavButton}
          onPress={() => {
            const newWeek = new Date(currentWeekStart);
            newWeek.setDate(newWeek.getDate() + 7);
            setCurrentWeekStart(newWeek);
          }}
        >
          <ChevronRight size={20} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Calendar Grid */}
      <View style={styles.calendarCard}>
        <View style={styles.calendarHeader}>
          <View style={styles.timeColumn} />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <View key={i} style={styles.dayHeader}>
                <Text style={[styles.dayLabel, isToday && styles.dayLabelToday]}>
                  {DAYS_OF_WEEK[i].label}
                </Text>
                <Text style={[styles.dayNumber, isToday && styles.dayNumberToday]}>
                  {date.getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView style={styles.calendarGrid} showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {[8, 10, 12, 14, 16, 18, 20].map((hour) => (
            <View key={hour} style={styles.calendarRow}>
              <View style={styles.timeColumn}>
                <Text style={styles.timeLabel}>{`${hour}h`}</Text>
              </View>
              {weekDates.map((date, i) => {
                const hasAvailability = hasAvailabilityAtTime(date, hour);

                return (
                  <TouchableOpacity
                    key={i}
                    style={[styles.calendarCell, hasAvailability && styles.calendarCellAvailable]}
                    onPress={() => {
                      // Si déjà une disponibilité, on peut la voir/modifier
                      if (hasAvailability) {
                        const slots = getAvailabilityForDate(date);
                        const slot = slots.find(s => {
                          const slotStart = timeToMinutes(s.startTime);
                          const slotEnd = timeToMinutes(s.endTime);
                          return slotStart <= hour * 60 && slotEnd > hour * 60;
                        });
                        if (slot) {
                          Alert.alert(
                            'Disponibilité',
                            `${slot.isRecurring ? 'Récurrente' : 'Ponctuelle'}\n${slot.startTime} - ${slot.endTime}`,
                            [
                              { text: 'OK', style: 'cancel' },
                              {
                                text: 'Supprimer',
                                style: 'destructive',
                                onPress: () => handleDelete(slot.id, slot.isRecurring),
                              },
                            ]
                          );
                        }
                      } else {
                        // Sinon, ouvrir le modal d'ajout avec date/heure pré-remplies
                        setSelectedDateForAdd(date);
                        setSelectedHourForAdd(hour);
                        setShowAddModal(true);
                      }
                    }}
                  >
                    {hasAvailability && <View style={styles.availabilityIndicator} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View style={styles.statsCard}>
        <Text style={styles.statsTitle}>Statistiques</Text>
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Disponibilités récurrentes</Text>
          <Text style={styles.statsValue}>{recurringAvailability.length}</Text>
        </View>
        <View style={styles.statsDivider} />
        <View style={styles.statsRow}>
          <Text style={styles.statsLabel}>Disponibilités ponctuelles</Text>
          <Text style={styles.statsValue}>{oneTimeAvailability.length}</Text>
        </View>
      </View>

      {/* Legend */}
      <View style={styles.legendCard}>
        <Text style={styles.legendTitle}>Légende</Text>
        <View style={styles.legendItem}>
          <View style={[styles.legendColor, { backgroundColor: Colors.primary }]} />
          <Text style={styles.legendText}>Disponible</Text>
        </View>
      </View>
    </ScrollView>
  );

  // Continued in next part...

  const renderListView = () => (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
      showsVerticalScrollIndicator={false}
    >
      {/* Recurring Availability Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <Calendar size={20} color={Colors.primary} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Disponibilités récurrentes</Text>
          </View>
          <View style={styles.countBadge}>
            <Text style={styles.countBadgeText}>{recurringAvailability.length}</Text>
          </View>
        </View>

        {recurringAvailability.length === 0 ? (
          <View style={styles.emptyState}>
            <Calendar size={48} color={Colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucune disponibilité récurrente</Text>
            <Text style={styles.emptyStateText}>
              Ajoutez vos créneaux hebdomadaires pour que les étudiants sachent quand vous êtes disponible
            </Text>
          </View>
        ) : (
          <View style={styles.availabilityList}>
            {recurringAvailability.map(avail => (
              <View key={avail.id} style={styles.availabilityCard}>
                <View style={styles.availabilityContent}>
                  <View style={styles.availabilityIconContainer}>
                    <Calendar size={20} color={Colors.primary} strokeWidth={2} />
                  </View>
                  <View style={styles.availabilityInfo}>
                    <Text style={styles.availabilityDay}>
                      {DAYS_OF_WEEK[avail.dayOfWeek || 0].fullLabel}
                    </Text>
                    <View style={styles.availabilityTimeContainer}>
                      <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.availabilityTime}>
                        {avail.startTime} - {avail.endTime}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(avail.id, true)}
                >
                  <Trash2 size={20} color={Colors.error} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* One-Time Availability Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleContainer}>
            <CalendarDays size={20} color={Colors.accent2} strokeWidth={2.5} />
            <Text style={styles.sectionTitle}>Disponibilités ponctuelles</Text>
          </View>
          <View style={[styles.countBadge, styles.countBadgeSecondary]}>
            <Text style={styles.countBadgeText}>{oneTimeAvailability.length}</Text>
          </View>
        </View>

        {oneTimeAvailability.length === 0 ? (
          <View style={styles.emptyState}>
            <CalendarDays size={48} color={Colors.textTertiary} strokeWidth={1.5} />
            <Text style={styles.emptyStateTitle}>Aucune disponibilité ponctuelle</Text>
            <Text style={styles.emptyStateText}>
              Ajoutez des créneaux pour des dates spécifiques en dehors de votre planning habituel
            </Text>
          </View>
        ) : (
          <View style={styles.availabilityList}>
            {oneTimeAvailability.map(avail => (
              <View key={avail.id} style={styles.availabilityCard}>
                <View style={styles.availabilityContent}>
                  <View style={[styles.availabilityIconContainer, styles.availabilityIconSecondary]}>
                    <CalendarDays size={20} color={Colors.accent2} strokeWidth={2} />
                  </View>
                  <View style={styles.availabilityInfo}>
                    <Text style={styles.availabilityDay}>
                      {avail.specificDate && new Date(avail.specificDate).toLocaleDateString('fr-FR', {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                      })}
                    </Text>
                    <View style={styles.availabilityTimeContainer}>
                      <Clock size={14} color={Colors.textSecondary} strokeWidth={2} />
                      <Text style={styles.availabilityTime}>
                        {avail.startTime} - {avail.endTime}
                      </Text>
                    </View>
                  </View>
                </View>
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => handleDelete(avail.id, false)}
                >
                  <Trash2 size={20} color={Colors.error} strokeWidth={2} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>

      {/* Info Card */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>💡 Conseil</Text>
        <Text style={styles.infoText}>
          Vos disponibilités aident les étudiants à savoir quand vous pouvez enseigner. 
          Les disponibilités ponctuelles ont la priorité sur les disponibilités récurrentes pour la même période.
        </Text>
      </View>
    </ScrollView>
  );

  // Continued in next part...

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Disponibilités</Text>
        <TouchableOpacity style={styles.headerButton} onPress={() => setShowAddModal(true)}>
          <Plus size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* View Mode Toggle */}
      <View style={styles.viewModeContainer}>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'calendar' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('calendar')}
        >
          <Calendar size={18} color={viewMode === 'calendar' ? Colors.white : Colors.primary} strokeWidth={2} />
          <Text style={[styles.viewModeText, viewMode === 'calendar' && styles.viewModeTextActive]}>
            Agenda
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewModeButton, viewMode === 'list' && styles.viewModeButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <List size={18} color={viewMode === 'list' ? Colors.white : Colors.primary} strokeWidth={2} />
          <Text style={[styles.viewModeText, viewMode === 'list' && styles.viewModeTextActive]}>
            Configuration
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}

      {/* Add Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowAddModal(false);
          setSelectedDateForAdd(null);
          setSelectedHourForAdd(null);
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Ajouter une disponibilité</Text>
              <TouchableOpacity onPress={() => {
                setShowAddModal(false);
                setSelectedDateForAdd(null);
                setSelectedHourForAdd(null);
              }}>
                <X size={24} color={Colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>

            {selectedDateForAdd && (
              <View style={styles.selectedDateInfo}>
                <Calendar size={16} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.selectedDateText}>
                  {selectedDateForAdd.toLocaleDateString('fr-FR', { 
                    weekday: 'long', 
                    day: 'numeric', 
                    month: 'long' 
                  })}
                  {selectedHourForAdd && ` à ${selectedHourForAdd}h`}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.addOptionButton}
              onPress={() => {
                setShowAddModal(false);
                const dayOfWeek = selectedDateForAdd?.getDay();
                router.push({
                  pathname: '/(tutor)/availability/add-recurring',
                  params: dayOfWeek !== undefined ? { dayOfWeek: dayOfWeek.toString() } : {},
                } as any);
                setSelectedDateForAdd(null);
                setSelectedHourForAdd(null);
              }}
            >
              <View style={styles.addOptionIcon}>
                <Calendar size={24} color={Colors.primary} strokeWidth={2.5} />
              </View>
              <View style={styles.addOptionContent}>
                <Text style={styles.addOptionTitle}>Disponibilité récurrente</Text>
                <Text style={styles.addOptionSubtitle}>
                  {selectedDateForAdd 
                    ? `Tous les ${DAYS_OF_WEEK[selectedDateForAdd.getDay()].fullLabel.toLowerCase()}s`
                    : 'Chaque semaine'}
                </Text>
              </View>
              <Plus size={24} color={Colors.primary} strokeWidth={2.5} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.addOptionButton, styles.addOptionButtonSecondary]}
              onPress={() => {
                setShowAddModal(false);
                const params: any = {};
                if (selectedDateForAdd) {
                  params.date = formatDateKey(selectedDateForAdd);
                }
                if (selectedHourForAdd !== null) {
                  params.startHour = selectedHourForAdd.toString();
                }
                router.push({
                  pathname: '/(tutor)/availability/add-one-time',
                  params,
                } as any);
                setSelectedDateForAdd(null);
                setSelectedHourForAdd(null);
              }}
            >
              <View style={[styles.addOptionIcon, styles.addOptionIconSecondary]}>
                <CalendarDays size={24} color={Colors.accent2} strokeWidth={2.5} />
              </View>
              <View style={styles.addOptionContent}>
                <Text style={styles.addOptionTitle}>Disponibilité ponctuelle</Text>
                <Text style={styles.addOptionSubtitle}>
                  {selectedDateForAdd 
                    ? selectedDateForAdd.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
                    : 'Date spécifique'}
                </Text>
              </View>
              <Plus size={24} color={Colors.accent2} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Continued with styles...

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  header: {
    backgroundColor: Colors.primary,
    paddingTop: 48,
    paddingBottom: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewModeContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    margin: Spacing.lg,
    borderRadius: BorderRadius.xlarge,
    padding: 4,
    gap: 4,
  },
  viewModeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: BorderRadius.large,
  },
  viewModeButtonActive: {
    backgroundColor: Colors.primary,
  },
  viewModeText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  viewModeTextActive: {
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  weekNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
  },
  weekNavButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  weekNavText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  calendarCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.md,
  },
  calendarHeader: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  timeColumn: {
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayHeader: {
    flex: 1,
    alignItems: 'center',
  },
  dayLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dayLabelToday: {
    color: Colors.primary,
  },
  dayNumber: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  dayNumberToday: {
    color: Colors.primary,
    fontWeight: '700',
  },
  calendarGrid: {
    maxHeight: 384,
  },
  calendarRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  timeLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  calendarCell: {
    flex: 1,
    height: 56,
    borderLeftWidth: 1,
    borderLeftColor: Colors.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  calendarCellAvailable: {
    backgroundColor: Colors.primary + '10',
  },
  availabilityIndicator: {
    width: '90%',
    height: '90%',
    backgroundColor: Colors.primary,
    borderRadius: 4,
  },
  statsCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.lg,
  },
  statsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  statsValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  statsDivider: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginVertical: Spacing.md,
  },
  legendCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.lg,
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.md,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendColor: {
    width: 16,
    height: 16,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  section: {
    gap: Spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.primary + '20',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.medium,
  },
  countBadgeSecondary: {
    backgroundColor: Colors.accent2 + '20',
  },
  countBadgeText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  emptyState: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.xl * 1.5,
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadows.small,
  },
  emptyStateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  availabilityList: {
    gap: Spacing.sm,
  },
  availabilityCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...Shadows.small,
  },
  availabilityContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  availabilityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  availabilityIconSecondary: {
    backgroundColor: Colors.accent2 + '15',
  },
  availabilityInfo: {
    flex: 1,
    gap: 4,
  },
  availabilityDay: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  availabilityTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  availabilityTime: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  deleteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.error + '10',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    gap: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  infoText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 19,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.xlarge,
    padding: Spacing.xl,
    width: '100%',
    maxWidth: 400,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  selectedDateInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.medium,
    marginBottom: Spacing.md,
  },
  selectedDateText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'capitalize',
  },
  addOptionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.lg,
    borderRadius: BorderRadius.large,
    gap: Spacing.md,
    backgroundColor: Colors.primary + '10',
    marginBottom: Spacing.md,
  },
  addOptionButtonSecondary: {
    backgroundColor: Colors.accent2 + '10',
  },
  addOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  addOptionIconSecondary: {
    backgroundColor: Colors.white,
  },
  addOptionContent: {
    flex: 1,
    gap: 4,
  },
  addOptionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  addOptionSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
});
