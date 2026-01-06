import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { Plus, Calendar, Info } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { PageHeader } from '@/components/PageHeader';

interface TimeSlot {
  id: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  levelSubject?: {
    id: string;
    subject: {
      id: string;
      name: string;
      icon?: string;
    };
  };
  streamSubject?: {
    id: string;
    subject: {
      id: string;
      name: string;
      icon?: string;
    };
  };
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
const ALL_HOURS = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'];
const BASE_CELL_WIDTH = 100;
const CELL_HEIGHT = 80;
const TIME_COLUMN_WIDTH = 60;
const MAX_TIMETABLE_HEIGHT = 500; // Hauteur maximale avant scroll
const HORIZONTAL_PADDING = Spacing.xs * 2; // Padding left + right from content
const DAY_COLUMN_GAP = 2; // marginRight between day columns

export default function ClassScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [loading, setLoading] = useState(true);
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([]);
  const [className, setClassName] = useState('');
  const [visibleHours, setVisibleHours] = useState<string[]>([]);
  const [visibleDays, setVisibleDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [dynamicCellWidth, setDynamicCellWidth] = useState(BASE_CELL_WIDTH);
  
  const horizontalScrollRef = useRef<ScrollView>(null);
  const verticalScrollRef = useRef<ScrollView>(null);

  // Helper function to get subject name from a time slot
  const getSubjectName = (slot: TimeSlot): string => {
    return slot.levelSubject?.subject.name || slot.streamSubject?.subject.name || 'Matière';
  };

  // Calculate statistics
  const getStatistics = () => {
    const subjectCount: { [key: string]: number } = {};
    let totalHours = 0;

    timeSlots.forEach(slot => {
      const subjectName = getSubjectName(slot);
      // Count slots per subject
      subjectCount[subjectName] = (subjectCount[subjectName] || 0) + 1;
      
      // Calculate total hours
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);
      totalHours += (endMinutes - startMinutes) / 60;
    });

    return {
      totalSlots: timeSlots.length,
      totalHours: totalHours.toFixed(1),
      subjects: Object.entries(subjectCount).map(([subject, count]) => ({
        subject,
        count,
      })),
    };
  };

  useEffect(() => {
    if (id) {
      loadSchedule();
    }
  }, [id]);

  // Refresh data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      if (id) {
        loadSchedule();
      }
    }, [id])
  );

  // Calculate which hours and days are actually used by time slots
  const calculateVisibleHoursAndDays = (slots: TimeSlot[]) => {
    if (slots.length === 0) {
      setVisibleHours([]);
      setVisibleDays([]);
      setDynamicCellWidth(BASE_CELL_WIDTH);
      return;
    }

    const usedHours = new Set<number>();
    const usedDays = new Set<number>();

    slots.forEach(slot => {
      // Track which days have slots
      usedDays.add(slot.dayOfWeek);
      
      const startMinutes = timeToMinutes(slot.startTime);
      const endMinutes = timeToMinutes(slot.endTime);
      
      // Get all hours covered by this slot
      const startHour = Math.floor(startMinutes / 60);
      const endHour = Math.floor((endMinutes - 1) / 60); // -1 to handle exact hour endings
      
      for (let hour = startHour; hour <= endHour; hour++) {
        usedHours.add(hour);
      }
    });

    // Convert hour numbers to hour strings and filter ALL_HOURS
    const hoursToShow = ALL_HOURS.filter(hourStr => {
      const hour = parseInt(hourStr.split(':')[0]);
      return usedHours.has(hour);
    });

    const sortedDays = Array.from(usedDays).sort();
    
    setVisibleHours(hoursToShow);
    setVisibleDays(sortedDays);
    
    // Calculate dynamic cell width
    calculateDynamicCellWidth(sortedDays.length);
  };

  // Calculate the optimal cell width based on available space
  const calculateDynamicCellWidth = (numberOfDays: number) => {
    if (numberOfDays === 0) {
      setDynamicCellWidth(BASE_CELL_WIDTH);
      return;
    }

    const screenWidth = Dimensions.get('window').width;
    const availableWidth = screenWidth - TIME_COLUMN_WIDTH - HORIZONTAL_PADDING;
    
    // Calculate total width needed with base cell width
    const totalGapWidth = (numberOfDays - 1) * DAY_COLUMN_GAP;
    const totalNeededWidth = numberOfDays * BASE_CELL_WIDTH + totalGapWidth;
    
    // If total needed width is less than available, redistribute the space
    if (totalNeededWidth < availableWidth) {
      const newCellWidth = (availableWidth - totalGapWidth) / numberOfDays;
      setDynamicCellWidth(Math.floor(newCellWidth));
    } else {
      setDynamicCellWidth(BASE_CELL_WIDTH);
    }
  };

  const loadSchedule = async () => {
    if (!id) return;
    
    console.log('Loading schedule for class ID:', id);
    
    try {
      setLoading(true);
      
      const classResponse = await apiClient.get(`/classes/${id}`);
      setClassName(classResponse.data.name);
      
      const slotsResponse = await apiClient.get(`/classes/${id}/schedule/time-slots`);
      const slots = slotsResponse.data;
      setTimeSlots(slots);
      calculateVisibleHoursAndDays(slots);
    } catch (error: any) {
      console.error('Error loading schedule:', error);
      Alert.alert('Erreur', 'Impossible de charger l\'emploi du temps');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    router.push(`/(student)/classes/add?id=${id}`);
  };

  const handleDeleteTimeSlot = async (slotId: string, subjectName: string) => {
    Alert.alert(
      'Supprimer le créneau',
      `Voulez-vous supprimer le cours de ${subjectName}?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiClient.delete(`/classes/${id}/schedule/time-slots/${slotId}`);
              await loadSchedule(); // Reload to recalculate visible hours
            } catch (error: any) {
              Alert.alert('Erreur', error.message || 'Impossible de supprimer le créneau');
            }
          },
        },
      ]
    );
  };

  const handleTimeSlotPress = (slotId: string) => {
    router.push({
      pathname: '/(student)/classes/time-slots/[timeSlotId]',
      params: {
        timeSlotId: slotId,
        classId: id,
      },
    } as any);
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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

  // Get all slots for a specific day to render text overlays
  const getSlotsForDay = (day: number): TimeSlot[] => {
    return timeSlots.filter(slot => slot.dayOfWeek === day);
  };

  // Calculate the position and height of a slot's text overlay
  const getSlotTextPosition = (slot: TimeSlot) => {
    const startMinutes = timeToMinutes(slot.startTime);
    const endMinutes = timeToMinutes(slot.endTime);
    const durationMinutes = endMinutes - startMinutes;

    // Find which hour index this starts at (in visible hours)
    const startHour = Math.floor(startMinutes / 60);
    const startHourStr = `${startHour.toString().padStart(2, '0')}:00`;
    const hourIndex = visibleHours.indexOf(startHourStr);

    if (hourIndex === -1) return { top: 0, height: 0 }; // Hour not visible

    // Calculate offset within the hour (in quarters)
    const minutesIntoHour = startMinutes % 60;
    const quarterOffset = Math.floor(minutesIntoHour / 15);
    const quarterHeight = CELL_HEIGHT / 4;

    // Calculate total height in pixels
    const heightInPixels = (durationMinutes / 15) * quarterHeight;

    // Calculate top position
    const topPosition = hourIndex * (CELL_HEIGHT + 2) + quarterOffset * quarterHeight;

    return {
      top: topPosition,
      height: heightInPixels,
    };
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
          style={[styles.emptyCell, { width: dynamicCellWidth }]}
          onPress={handleAddTimeSlot}
        >
          <Plus size={16} color={Colors.textTertiary} strokeWidth={2} />
        </TouchableOpacity>
      );
    }

    // Merge all quarters from all slots in this cell
    const allQuarters = new Set<number>();
    slotsInCell.forEach(({ quarters }) => {
      quarters.forEach(q => allQuarters.add(q));
    });

    return (
      <View key={`${day}-${hour}`} style={[styles.cellContainer, { width: dynamicCellWidth }]}>
        {/* Render quarters */}
        <View style={styles.quartersContainer}>
          {[0, 1, 2, 3].map(q => (
            <View
              key={q}
              style={[
                styles.quarter,
                allQuarters.has(q) && styles.quarterFilled,
              ]}
            />
          ))}
        </View>
      </View>
    );
  };

  const renderDayColumn = (day: number) => {
    const daySlots = getSlotsForDay(day);

    return (
      <View key={day} style={[styles.dayColumn, { width: dynamicCellWidth }]}>
        {/* Render all visible hour cells for this day */}
        {visibleHours.map(hour => renderTimeSlotCell(day, hour))}
        
        {/* Overlay slot text on top */}
        {daySlots.map(slot => {
          const position = getSlotTextPosition(slot);
          
          // Don't render if position is invalid (hour not visible)
          if (position.height === 0) return null;
          
          const assignedTutor = slot.tutorAssignments.find(a => a.status === 'ACCEPTED');
          const subjectName = getSubjectName(slot);
          
          return (
            <TouchableOpacity
              key={slot.id}
              style={[
                styles.slotTextOverlay,
                {
                  top: position.top,
                  height: position.height,
                },
              ]}
              onPress={() => handleTimeSlotPress(slot.id)}
              onLongPress={() => handleDeleteTimeSlot(slot.id, subjectName)}
              activeOpacity={0.8}
            >
              <Text style={styles.slotSubject} numberOfLines={1}>{subjectName}</Text>
              <Text style={styles.slotTime} numberOfLines={1}>
                {slot.startTime.substring(0, 5)} - {slot.endTime.substring(0, 5)}
              </Text>
              {assignedTutor && (
                <Text style={styles.slotTutor} numberOfLines={1}>
                  👨‍🏫 {assignedTutor.tutor.firstName}
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <PageHeader
          title="Planning"
          variant="primary"
          showBackButton={true}
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <PageHeader 
        title="Planning"
        subtitle={className}
        showBackButton={true}
        variant="primary"
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
            <View style={[
              styles.timetableContainer,
              {
                maxHeight: MAX_TIMETABLE_HEIGHT,
                height: Math.min(
                  visibleHours.length * (CELL_HEIGHT + 2) + 40, // +40 for header
                  MAX_TIMETABLE_HEIGHT
                ),
              }
            ]}>
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
                  {visibleDays.map(day => (
                    <View key={day} style={[styles.dayHeader, { width: dynamicCellWidth }]}>
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
                  {visibleHours.map(hour => (
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
                    {visibleDays.map(day => renderDayColumn(day))}
                  </View>
                </ScrollView>
              </ScrollView>
            </View>

            {/* Scrollable Statistics and Legend Section */}
            <ScrollView 
              style={styles.bottomSection}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bottomSectionContent}
            >
              {/* Statistics Section */}
              <View style={styles.statsContainer}>
                <Text style={styles.statsTitle}>Statistiques</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{getStatistics().totalSlots}</Text>
                    <Text style={styles.statLabel}>Créneaux</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{getStatistics().totalHours}h</Text>
                    <Text style={styles.statLabel}>Par semaine</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statValue}>{getStatistics().subjects.length}</Text>
                    <Text style={styles.statLabel}>Matières</Text>
                  </View>
                </View>
                
                {/* Subject breakdown */}
                {getStatistics().subjects.length > 0 && (
                  <View style={styles.subjectsBreakdown}>
                    <Text style={styles.breakdownTitle}>Par matière</Text>
                    {getStatistics().subjects.map(({ subject, count }) => (
                      <View key={subject} style={styles.subjectRow}>
                        <View style={styles.subjectDot} />
                        <Text style={styles.subjectName}>{subject}</Text>
                        <Text style={styles.subjectCount}>{count} créneau{count > 1 ? 'x' : ''}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.legend}>
                <View style={styles.legendIconContainer}>
                  <Info size={16} color={Colors.primary} strokeWidth={2} />
                </View>
                <Text style={styles.legendText}>Appuyez sur un créneau pour gérer les tuteurs • Appuyez longuement pour supprimer</Text>
              </View>
            </ScrollView>
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
    width: BASE_CELL_WIDTH,
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
    flexDirection: 'row',
  },
  dayColumn: {
    width: BASE_CELL_WIDTH,
    marginRight: 2,
    position: 'relative',
  },
  cellContainer: {
    width: BASE_CELL_WIDTH,
    height: CELL_HEIGHT,
    marginBottom: 2,
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
    backgroundColor: 'rgba(13, 115, 119, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
  },
  slotTextOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    padding: Spacing.xs,
    justifyContent: 'center',
    zIndex: 10,
  },
  emptyCell: {
    width: BASE_CELL_WIDTH,
    height: CELL_HEIGHT,
    marginBottom: 2,
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
  bottomSection: {
    flex: 1,
  },
  bottomSectionContent: {
    paddingBottom: Spacing.md,
  },
  statsContainer: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    ...Shadows.small,
  },
  statsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  statCard: {
    flex: 1,
    padding: Spacing.sm,
    backgroundColor: 'rgba(13, 115, 119, 0.05)',
    borderRadius: BorderRadius.medium,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  subjectsBreakdown: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  breakdownTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: Spacing.xs,
  },
  subjectRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  subjectDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginRight: Spacing.sm,
  },
  subjectName: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  subjectCount: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  legend: {
    marginTop: Spacing.md,
    marginHorizontal: Spacing.xs,
    padding: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.medium,
    flexDirection: 'row',
    alignItems: 'center',
    ...Shadows.small,
  },
  legendIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(13, 115, 119, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.sm,
  },
  legendText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
});
