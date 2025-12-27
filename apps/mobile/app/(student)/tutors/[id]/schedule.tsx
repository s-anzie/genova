import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  Clock,
} from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { apiClient } from '@/utils/api-client';
import { TutorProfileResponse } from '@/types/api';

interface DateSlot {
  date: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isRecurring: boolean;
}

export default function ScheduleScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const [selectedDuration, setSelectedDuration] = useState<'30' | '60'>('60');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [tutor, setTutor] = useState<TutorProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);

  useEffect(() => {
    loadTutorData();
  }, [id]);

  useEffect(() => {
    if (tutor) {
      generateAvailableSlots();
    }
  }, [selectedDate, tutor, selectedDuration]);

  const loadTutorData = async () => {
    try {
      setLoading(true);
      
      // Load tutor profile
      const response = await apiClient.get<{ success: boolean; data: TutorProfileResponse }>(`/profiles/tutor/${id}`);
      setTutor(response.data);
      
    } catch (err) {
      console.error('❌ Error loading tutor:', err);
    } finally {
      setLoading(false);
    }
  };

  const generateAvailableSlots = async () => {
    if (!tutor) return;
    
    try {
      // Get tutor availability from API
      const response = await apiClient.get<{ success: boolean; data: any[] }>(`/tutors/${id}/availability`);
      const availabilities = response.data || [];
      
      const slots: string[] = [];
      const duration = parseInt(selectedDuration);
      const dayOfWeek = selectedDate.getDay();
      const dateStr = selectedDate.toISOString().split('T')[0];
      
      // Filter availabilities for selected date
      const relevantAvailabilities = availabilities.filter((avail: any) => {
        if (avail.isRecurring && avail.dayOfWeek === dayOfWeek) {
          return true;
        }
        if (!avail.isRecurring && avail.specificDate) {
          const availDate = new Date(avail.specificDate).toISOString().split('T')[0];
          return availDate === dateStr;
        }
        return false;
      });
      
      // Generate time slots
      relevantAvailabilities.forEach((avail: any) => {
        const startMinutes = timeToMinutes(avail.startTime);
        const endMinutes = timeToMinutes(avail.endTime);
        
        // Generate slots every 30 minutes
        for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += 30) {
          const hours = Math.floor(minutes / 60);
          const mins = minutes % 60;
          const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
          
          if (!slots.includes(timeStr)) {
            slots.push(timeStr);
          }
        }
      });
      
      setAvailableSlots(slots.sort());
    } catch (err) {
      console.error('❌ Error loading availability:', err);
      setAvailableSlots([]);
    }
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getNext7Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const handleDateSelect = (date: Date) => {
    // Allow deselection by clicking the same date
    if (selectedDate.toDateString() === date.toDateString()) {
      return; // Don't deselect date, just keep it selected
    }
    setSelectedDate(date);
    setSelectedTime(''); // Reset time when date changes
  };

  const handleTimeSelect = (time: string) => {
    // Allow deselection by clicking the same time
    if (selectedTime === time) {
      setSelectedTime('');
    } else {
      setSelectedTime(time);
    }
  };

  const handleSubjectSelect = (subject: string) => {
    // Allow deselection by clicking the same subject
    if (selectedSubject === subject) {
      setSelectedSubject('');
    } else {
      setSelectedSubject(subject);
    }
  };

  const handleContinue = () => {
    if (selectedTime && selectedSubject && tutor) {
      // Calculate session times
      const [hours, minutes] = selectedTime.split(':').map(Number);
      const startTime = new Date(selectedDate);
      startTime.setHours(hours, minutes, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setMinutes(endTime.getMinutes() + parseInt(selectedDuration));

      // Navigate to checkout with booking details
      router.push({
        pathname: `/tutors/${id}/checkout` as any,
        params: {
          tutorId: tutor.userId,
          startTime: startTime.toISOString(),
          endTime: endTime.toISOString(),
          duration: selectedDuration,
          price: tutor.hourlyRate.toString(),
          subject: selectedSubject,
        },
      });
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const days = getNext7Days();
  const morningSlots = availableSlots.filter(slot => {
    const hour = parseInt(slot.split(':')[0]);
    return hour >= 6 && hour < 12;
  });
  const afternoonSlots = availableSlots.filter(slot => {
    const hour = parseInt(slot.split(':')[0]);
    return hour >= 12 && hour < 18;
  });
  const eveningSlots = availableSlots.filter(slot => {
    const hour = parseInt(slot.split(':')[0]);
    return hour >= 18;
  });

  const renderTimeSlot = (time: string) => {
    const isSelected = selectedTime === time;
    return (
      <TouchableOpacity
        key={time}
        style={[styles.timeSlot, isSelected && styles.timeSlotSelected]}
        onPress={() => handleTimeSelect(time)}
      >
        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Réserver une séance"
        showBackButton
        centerTitle
        showGradient={false}
        variant="primary"
      />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Duration Tabs */}
        <View style={styles.durationTabs}>
          <TouchableOpacity
            style={[styles.durationTab, selectedDuration === '30' && styles.durationTabActive]}
            onPress={() => setSelectedDuration('30')}
          >
            <Text style={[styles.durationTabText, selectedDuration === '30' && styles.durationTabTextActive]}>
              Séance 30 min
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.durationTab, selectedDuration === '60' && styles.durationTabActive]}
            onPress={() => setSelectedDuration('60')}
          >
            <Text style={[styles.durationTabText, selectedDuration === '60' && styles.durationTabTextActive]}>
              Séance 60 min
            </Text>
          </TouchableOpacity>
        </View>

        {/* Subject Selection */}
        {tutor && tutor.subjects && tutor.subjects.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Matière</Text>
            <View style={styles.subjectsGrid}>
              {tutor.subjects.map((subject) => {
                const isSelected = selectedSubject === subject;
                return (
                  <TouchableOpacity
                    key={subject}
                    style={[styles.subjectChip, isSelected && styles.subjectChipSelected]}
                    onPress={() => handleSubjectSelect(subject)}
                  >
                    <Text style={[styles.subjectChipText, isSelected && styles.subjectChipTextSelected]}>
                      {subject}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        )}

        {/* Calendar */}
        <View style={styles.section}>
          <View style={styles.calendarHeader}>
            <Text style={styles.monthText}>
              {selectedDate.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.datesGrid}>
            {days.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              const dayName = date.toLocaleDateString('fr-FR', { weekday: 'short' });
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCell, isSelected && styles.dateCellSelected]}
                  onPress={() => handleDateSelect(date)}
                >
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {dayName}
                  </Text>
                  <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
                    {date.getDate()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Time Slots */}
        <View style={styles.section}>
          {morningSlots.length > 0 && (
            <>
              <View style={styles.timeHeader}>
                <Clock size={18} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.timeHeaderText}>Matin</Text>
              </View>
              <View style={styles.timeSlotsGrid}>
                {morningSlots.map(renderTimeSlot)}
              </View>
            </>
          )}

          {afternoonSlots.length > 0 && (
            <>
              <View style={styles.timeHeader}>
                <Clock size={18} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.timeHeaderText}>Après-midi</Text>
              </View>
              <View style={styles.timeSlotsGrid}>
                {afternoonSlots.map(renderTimeSlot)}
              </View>
            </>
          )}

          {eveningSlots.length > 0 && (
            <>
              <View style={styles.timeHeader}>
                <Clock size={18} color={Colors.textSecondary} strokeWidth={2} />
                <Text style={styles.timeHeaderText}>Soirée</Text>
              </View>
              <View style={styles.timeSlotsGrid}>
                {eveningSlots.map(renderTimeSlot)}
              </View>
            </>
          )}
        </View>

        <View style={{ height: 20 }} />
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.continueButton, (!selectedTime || !selectedSubject) && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={!selectedTime || !selectedSubject}
        >
          <Text style={styles.continueButtonText}>
            {selectedTime && selectedSubject ? 'Passer au paiement' : 'Sélectionnez un créneau et une matière'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bgCream,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  durationTabs: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  durationTab: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: Colors.bgCream,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  durationTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  durationTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  durationTabTextActive: {
    color: Colors.white,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 12,
  },
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  subjectChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  subjectChipSelected: {
    backgroundColor: Colors.primary,
    ...Shadows.medium,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  subjectChipTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  calendarHeader: {
    marginBottom: 16,
  },
  monthText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dateCell: {
    flex: 1,
    height: 70,
    borderRadius: BorderRadius.medium,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.white,
    ...Shadows.small,
  },
  dateCellSelected: {
    backgroundColor: Colors.primary,
    ...Shadows.medium,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 4,
    textTransform: 'capitalize',
  },
  dayTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  dateText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  dateTextSelected: {
    color: Colors.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    marginTop: 8,
  },
  timeHeaderText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 16,
  },
  timeSlot: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.medium,
    backgroundColor: Colors.white,
    minWidth: 80,
    alignItems: 'center',
    ...Shadows.small,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
    ...Shadows.medium,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: Colors.white,
    fontWeight: '700',
  },
  footer: {
    padding: 20,
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  continueButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  continueButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
