import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Plus, Calendar } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { PageHeader } from '@/components/PageHeader';

interface TimeSlot {
  id: string;
  subject: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  tutorAssignments: {
    id: string;
    tutor: {
      id: string;
      firstName: string;
      lastName: string;
    };
    status: string;
  }[];
}

const DAYS_SHORT = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const CELL_WIDTH = 100;
const CELL_HEIGHT = 80;
const TIME_COLUMN_WIDTH = 60;

export default function ClassScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [className, setClassName] = useState('');
  
  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    if (id) {
      loadSchedule();
    }
  }, [id]);

  const loadSchedule = async () => {
    if (!id) return;
    
    console.log('Loading schedule for class ID:', id);
    
    try {
      setLoading(true);
      
      const classResponse = await apiClient.get(`/classes/${id}`);
      setClassName(classResponse.data.name);
      
      const slotsResponse = await apiClient.get(`/classes/${id}/schedule/time-slots`);
      setTimeSlots(slotsResponse.data);
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    router.push(`/(student)/classes/${id}/schedule/add` as any);
  };

  const handleDeleteTimeSlot = async (slotId: string, subject: string) => {
    Alert.alert(
      'Supprimer le créneau',
      `Voulez-vous supprimer le cours de ${subject}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}/schedule/time-slots/${slotId}`);
              loadSchedule();
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le créneau');
            }
          },
        },
      ]
    );
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getQuarterPosition = (minutes: number): number => {
    // Returns which quarter (0-3) the minutes fall into
    if (minutes < 15) return 0;
    if (minutes < 30) return 1;
    if (minutes < 45) return 2;
    return 3;
  };

  const getSlotsForDayAndHour = (day: number, hour: string): Array<{slot: TimeSlot, quarters: number[]}> => {
    const hourMinutes = timeToMinutes(hour);
    const results: Array<{slot: TimeSlot, quarters: number[]}> = [];

    timeSlots.forEach(slot => {
      if (slot.dayOfWeek !== day) return;

      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);

      // Check if this slot overlaps with this hour
      if (startMinutes < hourMinutes + 60 && endMinutes > hourMinutes) {
        // Calculate which quarters are filled
        const quarters: number[] = [];
        
        for (let q = 0; q < 4; q++) {
          const quarterStart = hourMinutes + (q * 15);
          const quarterEnd = quarterStart + 15;
          
          // If slot overlaps this quarter
          if (startMinutes < quarterEnd && endMinutes > quarterStart) {
            quarters.push(q);
          }
        }

        if (quarters.length > 0) {
          results.push({ slot, quarters });
        }
      }
    });

    return results;
  };

  const handleContentScroll = (event: any) => {
    const { contentOffset } = event.nativeEvent;
    
    // Sync horizontal header
    if (horizontalScrollRef.current) {
      horizontalScrollRef.current.scrollTo({ x: contentOffset.x, animated: false });
    }
    
    // Sync vertical header
    if (verticalScrollRef.current) {
      verticalScrollRef.current.scrollTo({ y: contentOffset.y, animated: false });
    }
  };

  const renderTimeSlotCell = (day: number, hour: string) => {
    const slotsInCell = getSlotsForDayAndHour(day, hour);

    if (slotsInCell.length === 0) {
      return (
        <TouchableOpacity
          key={`${day}-${hour}`}
          style={styles.emptyCell}
          onPress={handleAddTimeSlot}
        >
          <Plus size={16} color={Colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // For now, handle single slot per cell (most common case)
    const { slot, quarters } = slotsInCell[0];
    const assignedTutor = slot.tutorAssignments.find(a => a.status === 'ACCEPTED');

    return (
      <View key={`${day}-${hour}`} style={styles.cellContainer}>
        {/* Render quarters */}
        <View style={styles.quartersContainer}>
          {[0, 1, 2, 3].map(q => (
            <View
              key={q}
              style={[
                styles.quarter,
                quarters.includes(q) && styles.quarterFilled,
              ]}
            />
          ))}
        </View>

        {/* Render slot info if this is the starting hour */}
        {slot.startTime.startsWith(hour.substring(0, 2)) && (
          <TouchableOpacity
            style={styles.slotInfo}
            onLongPress={() => handleDeleteTimeSlot(slot.id, slot.subject)}
            activeOpacity={0.8}
          >
            <Text style={styles.slotSubject} numberOfLines={1}>{slot.subject}</Text>
            <Text style={styles.slotTime} numberOfLines={1}>
              {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
            </Text>
            {assignedTutor && (
              <Text style={styles.slotTutor} numberOfLines={1}>
                👨‍🏫 {assignedTutor.tutor.firstName}
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader title="Emploi du temps" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Emploi du temps"
        subtitle={className}
        rightElement={
          <TouchableOpacity style={styles.addButton} onPress={handleAddTimeSlot}>
            <Plus size={22} color={Colors.white} strokeWidth={2.5} />
          </TouchableOpacity>
        }
      />

      <View style={styles.content}>
        {timeSlots.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Calendar size={48} color={Colors.primary} strokeWidth={1.5} />
            </View>
            <Text style={styles.emptyText}>Aucun créneau</Text>
            <Text style={styles.emptySubtext}>
              Ajoutez des créneaux pour organiser l'emploi du temps
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleAddTimeSlot}>
              <Text style={styles.createButtonText}>Ajouter un créneau</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.timetableContainer}>
              {/* Top-left corner (fixed) */}
              <View style={styles.cornerCell} />

              {/* Days header (scrolls horizontally) */}
              <ScrollView
                ref={horizontalScrollRef}
                horizontal
                scrollEnabled={false}
                showsHorizontalScrollIndicator={false}
                style={styles.daysHeader}
              >
                <View style={styles.daysRow}>
                  {[1, 2, 3, 4, 5, 6].map(day => (
                    <View key={day} style={styles.dayHeader}>
                      <Text style={styles.dayHeaderText}>{DAYS_SHORT[day - 1]}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Time column (scrolls vertically) */}
              <ScrollView
                ref={verticalScrollRef}
                scrollEnabled={false}
                showsVerticalScrollIndicator={false}
                style={styles.timeColumnScroll}
              >
                <View>
                  {HOURS.map(hour => (
                    <View key={hour} style={styles.timeCell}>
                      <Text style={styles.timeText}>{hour}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>

              {/* Content grid (scrolls both directions) */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                scrollEventThrottle={16}
                onScroll={handleContentScroll}
                style={styles.contentScroll}
              >
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  scrollEventThrottle={16}
                  onScroll={handleContentScroll}
                >
                  <View style={styles.grid}>
                    {HOURS.map(hour => (
                      <View key={hour} style={styles.gridRow}>
                        {[1, 2, 3, 4, 5, 6].map(day => renderTimeSlotCell(day, hour))}
                      </View>
                    ))}
                  </View>
                </ScrollView>
              </ScrollView>
            </View>

            <View style={styles.legend}>
              <Text style={styles.legendText}>💡 Appuyez longuement sur un créneau pour le supprimer</Text>
            </View>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadows.primary,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: Spacing.xs,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(13, 115, 119, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  createButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.large,
    ...Shadows.primary,
  },
  createButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.white,
  },
  timetableContainer: {
    flex: 1,
    backgroundColor: Colors.white,
    overflow: 'hidden',
    ...Shadows.medium,
  },
  cornerCell: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: TIME_COLUMN_WIDTH,
    height: 40,
    backgroundColor: Colors.white,
    zIndex: 3,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
  },
  daysHeader: {
    position: 'absolute',
    top: 0,
    left: TIME_COLUMN_WIDTH,
    right: 0,
    height: 40,
    zIndex: 2,
  },
  daysRow: {
    flexDirection: 'row',
  },
  dayHeader: {
    width: CELL_WIDTH,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    marginRight: 2,
  },
  dayHeaderText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.white,
  },
  timeColumnScroll: {
    position: 'absolute',
    top: 40,
    left: 0,
    width: TIME_COLUMN_WIDTH,
    bottom: 0,
    zIndex: 2,
  },
  timeCell: {
    width: TIME_COLUMN_WIDTH,
    height: CELL_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    marginBottom: 2,
  },
  timeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  contentScroll: {
    position: 'absolute',
    top: 40,
    left: TIME_COLUMN_WIDTH,
    right: 0,
    bottom: 0,
    zIndex: 1,
  },
  grid: {
    paddingBottom: Spacing.md,
  },
  gridRow: {
    flexDirection: 'row',
    marginBottom: 2,
  },
  cellContainer: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    marginRight: 2,
    position: 'relative',
  },
  quartersContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'column',
  },
  quarter: {
    flex: 1,
    backgroundColor: Colors.bgCream,
    borderWidth: 0.5,
    borderColor: Colors.border,
  },
  quarterFilled: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.success,
  },
  slotInfo: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    padding: Spacing.xs,
    justifyContent: 'center',
  },
  emptyCell: {
    width: CELL_WIDTH,
    height: CELL_HEIGHT,
    marginRight: 2,
    backgroundColor: Colors.bgCream,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  slotSubject: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  slotTime: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  slotTutor: {
    fontSize: 10,
    color: Colors.textSecondary,
  },
  legend: {
    marginTop: Spacing.xs,
    padding: Spacing.sm,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
  },
  legendText: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
