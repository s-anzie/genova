import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Clock,
  Calendar as CalendarIcon,
} from 'lucide-react-native';
import { Colors } from '@/constants/colors';
import { apiClient } from '@/utils/api-client';
import { TutorProfileResponse, SessionResponse } from '@/types/api';

interface DateSlot {
  date: string;
  start: string;
  end: string;
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
  const [tutorSlots, setTutorSlots] = useState<DateSlot[]>([]);
  const [bookedSessions, setBookedSessions] = useState<SessionResponse[]>([]);

  useEffect(() => {
    loadTutorData();
  }, [id]);

  useEffect(() => {
    if (tutor) {
      generateAvailableSlots();
    }
  }, [selectedDate, tutor, tutorSlots, bookedSessions]);

  const loadTutorData = async () => {
    try {
      setLoading(true);
      
      // Load tutor profile
      const tutorData = await apiClient.get<{ success: boolean; data: TutorProfileResponse }>(`/profiles/tutor/${id}`);
      setTutor(tutorData.data);
      
      // Load tutor's availability slots from backend
      try {
        const slotsRes = await apiClient.get<{ success: boolean; data: DateSlot[] }>(
          `/scheduling/tutor/${id}/availability`
        );
        console.log('Loaded tutor slots:', slotsRes.data?.length || 0);
        setTutorSlots(slotsRes.data || []);
      } catch (availError) {
        console.log('Could not load availability from backend, trying local storage');
        // Fallback sur AsyncStorage
        const storedSlots = await AsyncStorage.getItem(`availability_${id}`);
        if (storedSlots) {
          setTutorSlots(JSON.parse(storedSlots));
        }
      }
      
      // Load tutor's booked sessions
      try {
        const sessionsRes = await apiClient.get<{ success: boolean; data: SessionResponse[] }>(
          `/sessions?tutorId=${id}&status=PENDING,CONFIRMED`
        );
        setBookedSessions(sessionsRes.data || []);
      } catch (err) {
        console.log('Could not load sessions:', err);
      }
      
    } catch (err) {
      console.error('Error loading tutor:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatDateKey = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const isSlotBooked = (date: Date, time: string): boolean => {
    const slotTime = timeToMinutes(time);
    return bookedSessions.some(session => {
      const sessionDate = new Date(session.scheduledStart);
      if (sessionDate.toDateString() !== date.toDateString()) return false;
      
      const sessionStart = sessionDate.getHours() * 60 + sessionDate.getMinutes();
      const sessionEnd = new Date(session.scheduledEnd).getHours() * 60 + new Date(session.scheduledEnd).getMinutes();
      
      return slotTime >= sessionStart && slotTime < sessionEnd;
    });
  };

  const generateAvailableSlots = () => {
    const dateKey = formatDateKey(selectedDate);
    const slotsForDate = tutorSlots.filter(slot => slot.date === dateKey);
    
    if (slotsForDate.length === 0) {
      setAvailableSlots([]);
      return;
    }
    
    const slots: string[] = [];
    const duration = parseInt(selectedDuration);
    
    slotsForDate.forEach(slot => {
      const startMinutes = timeToMinutes(slot.start);
      const endMinutes = timeToMinutes(slot.end);
      
      // Generate slots every 30 minutes
      for (let minutes = startMinutes; minutes + duration <= endMinutes; minutes += 30) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        const timeStr = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
        
        // Check if slot is not already booked
        if (!isSlotBooked(selectedDate, timeStr)) {
          slots.push(timeStr);
        }
      }
    });
    
    setAvailableSlots(slots);
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
        onPress={() => setSelectedTime(time)}
      >
        <Text style={[styles.timeSlotText, isSelected && styles.timeSlotTextSelected]}>
          {time}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.headerButton}>
          <ArrowLeft size={24} color={Colors.textPrimary} strokeWidth={2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Réserver une séance</Text>
        <View style={{ width: 40 }} />
      </View>

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
                    onPress={() => setSelectedSubject(subject)}
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
              {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
          </View>
          <View style={styles.weekDays}>
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <Text key={day} style={styles.weekDayText}>{day}</Text>
            ))}
          </View>
          <View style={styles.datesGrid}>
            {days.map((date, index) => {
              const isSelected = date.toDateString() === selectedDate.toDateString();
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.dateCell, isSelected && styles.dateCellSelected]}
                  onPress={() => setSelectedDate(date)}
                >
                  <Text style={[styles.dateText, isSelected && styles.dateTextSelected]}>
                    {date.getDate()}
                  </Text>
                  <Text style={[styles.dayText, isSelected && styles.dayTextSelected]}>
                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
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
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: Colors.bgCream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
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
    backgroundColor: Colors.bgCream,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  subjectChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subjectChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  subjectChipTextSelected: {
    color: Colors.white,
  },
  calendarHeader: {
    marginBottom: 16,
  },
  monthText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  weekDays: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  weekDayText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
    width: 40,
    textAlign: 'center',
  },
  datesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  dateCell: {
    width: 50,
    height: 60,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bgCream,
  },
  dateCellSelected: {
    backgroundColor: Colors.primary,
  },
  dateText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  dateTextSelected: {
    color: Colors.white,
  },
  dayText: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  dayTextSelected: {
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
    borderRadius: 10,
    backgroundColor: Colors.bgCream,
    minWidth: 80,
    alignItems: 'center',
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary,
  },
  timeSlotText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  timeSlotTextSelected: {
    color: Colors.white,
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
