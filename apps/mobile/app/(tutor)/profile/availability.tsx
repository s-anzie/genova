import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  StatusBar,
  Modal,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, Trash2, X, Check, Calendar, List, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useAuth } from '@/contexts/auth-context';
import { apiClient } from '@/utils/api-client';
import { Colors } from '@/constants/colors';
import { API_BASE_URL } from '@/config/api';
import type { SessionResponse } from '@/types/api';

const DAYS_OF_WEEK = [
  { key: 'monday', label: 'Lun', fullLabel: 'Lundi', dayIndex: 1 },
  { key: 'tuesday', label: 'Mar', fullLabel: 'Mardi', dayIndex: 2 },
  { key: 'wednesday', label: 'Mer', fullLabel: 'Mercredi', dayIndex: 3 },
  { key: 'thursday', label: 'Jeu', fullLabel: 'Jeudi', dayIndex: 4 },
  { key: 'friday', label: 'Ven', fullLabel: 'Vendredi', dayIndex: 5 },
  { key: 'saturday', label: 'Sam', fullLabel: 'Samedi', dayIndex: 6 },
  { key: 'sunday', label: 'Dim', fullLabel: 'Dimanche', dayIndex: 0 },
];

const TIME_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00', '21:30',
  '22:00', '22:30', '23:00', '23:30',
];

type ViewMode = 'calendar' | 'list';

interface DateSlot {
  date: string; // ISO date string (YYYY-MM-DD)
  start: string;
  end: string;
}

export default function TutorAvailabilityScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [dateSlots, setDateSlots] = useState<DateSlot[]>([]);
  const [sessions, setSessions] = useState<SessionResponse[]>([]);
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editingSlot, setEditingSlot] = useState<{ date: string; index: number } | null>(null);
  const [showTimePicker, setShowTimePicker] = useState<{ field: 'start' | 'end'; value: string } | null>(null);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(getWeekStart(new Date()));

  useEffect(() => {
    loadData();
  }, [currentWeekStart]);

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

  function getDayKey(date: Date): string {
    const dayIndex = date.getDay();
    return DAYS_OF_WEEK.find(d => d.dayIndex === dayIndex)?.key || 'monday';
  }

  function formatDateKey(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      console.log('Loading availability data for tutor:', user?.id);
      
      // Charger les créneaux depuis le backend
      try {
        const slotsRes = await apiClient.get<{ success: boolean; data: DateSlot[] }>(
          `/scheduling/tutor/${user?.id}/availability`
        );
        console.log('Loaded slots from backend:', slotsRes.data?.length || 0);
        setDateSlots(slotsRes.data || []);
        
        // Backup local
        await AsyncStorage.setItem(`availability_${user?.id}`, JSON.stringify(slotsRes.data || []));
      } catch (availError: any) {
        console.log('Could not load slots from backend, trying local storage:', availError.message);
        // Fallback sur AsyncStorage
        const storedSlots = await AsyncStorage.getItem(`availability_${user?.id}`);
        if (storedSlots) {
          const slots = JSON.parse(storedSlots);
          console.log('Loaded slots from storage:', slots.length);
          setDateSlots(slots);
        }
      }
      
      // Charger les sessions de l'utilisateur authentifié
      try {
        const sessionsRes = await apiClient.get<{ success: boolean; data: SessionResponse[] }>(
          `/sessions`
        );
        console.log('Sessions loaded:', sessionsRes.data?.length || 0);
        setSessions(sessionsRes.data || []);
      } catch (sessionError: any) {
        console.log('Could not load sessions:', sessionError.response?.status, sessionError.message);
        // Pas grave si les sessions ne chargent pas, on continue
        setSessions([]);
      }
      
    } catch (error: any) {
      console.error('Failed to load data:', error);
      setSessions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getSlotsForDate = (date: Date): DateSlot[] => {
    const dateKey = formatDateKey(date);
    const slots = dateSlots.filter(slot => slot.date === dateKey);
    console.log(`getSlotsForDate(${dateKey}):`, slots.length, 'slots');
    return slots;
  };

  const addTimeSlot = (date: Date) => {
    const dateKey = formatDateKey(date);
    const newSlot: DateSlot = { date: dateKey, start: '09:00', end: '17:00' };
    console.log('Adding slot for date:', dateKey, newSlot);
    setDateSlots([...dateSlots, newSlot]);
    console.log('Total slots after add:', dateSlots.length + 1);
  };

  const removeTimeSlot = (date: string, index: number) => {
    const slotsForDate = dateSlots.filter(s => s.date === date);
    const slotToRemove = slotsForDate[index];
    setDateSlots(dateSlots.filter(s => s !== slotToRemove));
  };

  const updateTimeSlot = (date: string, index: number, field: 'start' | 'end', value: string) => {
    const slotsForDate = dateSlots.filter(s => s.date === date);
    const slotToUpdate = slotsForDate[index];
    const updatedSlot = { ...slotToUpdate, [field]: value };
    setDateSlots(dateSlots.map(s => s === slotToUpdate ? updatedSlot : s));
  };

  const validateTimeSlots = (): boolean => {
    for (const slot of dateSlots) {
      if (slot.start >= slot.end) {
        Alert.alert('Erreur', `L'heure de début doit être avant l'heure de fin`);
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateTimeSlots()) return;
    try {
      setIsSaving(true);
      
      const endpoint = `/scheduling/tutor/${user?.id}/availability`;
      console.log('Saving to endpoint:', endpoint);
      console.log('Full URL would be:', `${API_BASE_URL}${endpoint}`);
      console.log('Slots to save:', dateSlots.length);
      
      // Sauvegarder sur le backend
      await apiClient.post(endpoint, { slots: dateSlots });
      console.log('Saved', dateSlots.length, 'slots to backend');
      
      // Aussi sauvegarder localement pour backup
      await AsyncStorage.setItem(`availability_${user?.id}`, JSON.stringify(dateSlots));
      
      Alert.alert('Succès', 'Disponibilités enregistrées');
      router.back();
    } catch (error: any) {
      console.error('Save error:', error);
      Alert.alert('Erreur', error.message || 'Échec de la sauvegarde');
    } finally {
      setIsSaving(false);
    }
  };

  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  const getSessionsForDateAndTime = (date: Date, hour: number): SessionResponse[] => {
    return sessions.filter(session => {
      const sessionDate = new Date(session.scheduledStart);
      const sessionHour = sessionDate.getHours();
      return (
        sessionDate.toDateString() === date.toDateString() &&
        sessionHour >= hour &&
        sessionHour < hour + 2
      );
    });
  };

  const getSessionColor = (status: string): string => {
    switch (status) {
      case 'CONFIRMED': return 'bg-blue-500';
      case 'COMPLETED': return 'bg-green-500';
      case 'CANCELLED': return 'bg-red-400';
      case 'PENDING': return 'bg-yellow-500';
      default: return 'bg-gray-400';
    }
  };

  const getUpcomingSessions = () => {
    const now = new Date();
    return sessions
      .filter(s => new Date(s.scheduledStart) > now && s.status !== 'CANCELLED')
      .sort((a, b) => new Date(a.scheduledStart).getTime() - new Date(b.scheduledStart).getTime());
  };

  const getNextSession = () => getUpcomingSessions()[0];

  const formatDate = (date: Date | string): string => {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (start: Date | string, end: Date | string): string => {
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h${minutes > 0 ? minutes : ''}`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 justify-center items-center bg-gray-50">
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const weekDates = getWeekDates(currentWeekStart);
  const upcomingSessions = getUpcomingSessions();
  const nextSession = getNextSession();

  const renderCalendarView = () => (
    <ScrollView className="flex-1" contentContainerClassName="p-3" showsVerticalScrollIndicator={false}>
      {/* Week Navigation */}
      <View className="flex-row items-center justify-between mb-3 bg-white rounded-xl p-3">
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-teal-50 justify-center items-center"
          onPress={() => {
            const newWeek = new Date(currentWeekStart);
            newWeek.setDate(newWeek.getDate() - 7);
            setCurrentWeekStart(newWeek);
          }}
        >
          <ChevronLeft size={20} color={Colors.primary} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-sm font-bold text-gray-900">
          {currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} - {' '}
          {weekDates[6].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
        </Text>
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-teal-50 justify-center items-center"
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
      <View className="bg-white rounded-xl p-3 mb-3">
        <View className="flex-row mb-2">
          <View className="w-12" />
          {weekDates.map((date, i) => {
            const isToday = date.toDateString() === new Date().toDateString();
            return (
              <View key={i} className="flex-1 items-center">
                <Text className={`text-xs font-bold ${isToday ? 'text-teal-600' : 'text-gray-900'}`}>
                  {DAYS_OF_WEEK[i].label}
                </Text>
                <Text className={`text-xs ${isToday ? 'text-teal-600 font-bold' : 'text-gray-500'}`}>
                  {date.getDate()}
                </Text>
              </View>
            );
          })}
        </View>

        <ScrollView className="max-h-96" showsVerticalScrollIndicator={false} nestedScrollEnabled>
          {[8, 10, 12, 14, 16, 18, 20].map((hour) => (
            <View key={hour} className="flex-row border-t border-gray-200">
              <View className="w-12 items-center justify-center">
                <Text className="text-xs text-gray-500 font-medium">{`${hour}h`}</Text>
              </View>
              {weekDates.map((date, i) => {
                const dayKey = getDayKey(date);
                const slots = getSlotsForDate(date);
                const hasAvailability = slots.some((slot) => {
                  const slotStart = timeToMinutes(slot.start);
                  const slotEnd = timeToMinutes(slot.end);
                  return slotStart <= hour * 60 && slotEnd > hour * 60;
                });
                const sessionsAtTime = getSessionsForDateAndTime(date, hour);
                const session = sessionsAtTime[0];

                return (
                  <TouchableOpacity
                    key={i}
                    className={`flex-1 h-14 border-l border-gray-200 justify-center items-center p-0.5 ${
                      session ? '' : hasAvailability ? 'bg-teal-50' : ''
                    }`}
                    onPress={() => {
                      if (session) {
                        Alert.alert('Session', `${session.subject}\n${session.status}`);
                      } else if (hasAvailability) {
                        const slotIndex = slots.findIndex(s => 
                          timeToMinutes(s.start) <= hour * 60 && timeToMinutes(s.end) > hour * 60
                        );
                        if (slotIndex >= 0) {
                          setEditingSlot({ date: formatDateKey(date), index: slotIndex });
                        }
                      } else {
                        // Ajouter un créneau
                        addTimeSlot(date);
                      }
                    }}
                  >
                    {session ? (
                      <View className={`w-[95%] h-[95%] ${getSessionColor(session.status)} rounded justify-center items-center`}>
                        <Text className="text-[10px] font-bold text-white text-center" numberOfLines={2}>
                          {session.subject}
                        </Text>
                      </View>
                    ) : hasAvailability ? (
                      <View className="w-[90%] h-[90%] bg-teal-600 rounded" />
                    ) : null}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Stats */}
      <View className="bg-white rounded-xl p-4 mb-3">
        <Text className="text-sm font-bold text-gray-900 mb-3">Statistiques</Text>
        <View className="gap-3">
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-gray-600">Sessions à venir</Text>
            <Text className="text-sm font-bold text-teal-600">{upcomingSessions.length}</Text>
          </View>
          {nextSession && (
            <>
              <View className="h-px bg-gray-100" />
              <View>
                <Text className="text-xs text-gray-500 mb-1">Prochaine session</Text>
                <Text className="text-sm font-semibold text-gray-900">{nextSession.subject}</Text>
                <Text className="text-xs text-gray-600 mt-0.5">
                  {formatDate(nextSession.scheduledStart)} • {formatDuration(nextSession.scheduledStart, nextSession.scheduledEnd)}
                </Text>
                {nextSession.location && (
                  <Text className="text-xs text-gray-500 mt-0.5">📍 {nextSession.location}</Text>
                )}
              </View>
            </>
          )}
        </View>
      </View>

      {/* Legend */}
      <View className="bg-white rounded-xl p-4">
        <Text className="text-sm font-bold text-gray-900 mb-3">Légende</Text>
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 bg-teal-600 rounded" />
            <Text className="text-xs text-gray-600">Disponible</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 bg-blue-500 rounded" />
            <Text className="text-xs text-gray-600">Confirmé</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 bg-green-500 rounded" />
            <Text className="text-xs text-gray-600">Terminé</Text>
          </View>
          <View className="flex-row items-center gap-2">
            <View className="w-4 h-4 bg-red-400 rounded" />
            <Text className="text-xs text-gray-600">Annulé</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );

  const renderListView = () => (
    <ScrollView className="flex-1" contentContainerClassName="p-3" showsVerticalScrollIndicator={false}>
      <Text className="text-xs text-gray-500 mb-3 px-1">
        Semaine du {currentWeekStart.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })} au{' '}
        {weekDates[6].toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
      </Text>
      
      {weekDates.map((date, i) => {
        const slots = getSlotsForDate(date);
        const isExpanded = selectedDate?.toDateString() === date.toDateString();
        const hasSlots = slots.length > 0;
        const isToday = date.toDateString() === new Date().toDateString();

        return (
          <View key={i} className="bg-white rounded-xl mb-2.5 overflow-hidden">
            <TouchableOpacity
              className="flex-row items-center justify-between p-3.5"
              onPress={() => setSelectedDate(isExpanded ? null : date)}
            >
              <View className="flex-1">
                <Text className={`text-base font-semibold ${isToday ? 'text-teal-600' : 'text-gray-900'}`}>
                  {DAYS_OF_WEEK[i].fullLabel} {date.getDate()}
                </Text>
                {hasSlots && (
                  <Text className="text-xs text-gray-500 mt-0.5">
                    {slots.length} créneau{slots.length > 1 ? 'x' : ''}
                  </Text>
                )}
              </View>
              <TouchableOpacity
                className="w-8 h-8 rounded-full bg-teal-50 justify-center items-center"
                onPress={(e) => {
                  e.stopPropagation();
                  addTimeSlot(date);
                }}
              >
                <Plus size={20} color={Colors.primary} strokeWidth={2.5} />
              </TouchableOpacity>
            </TouchableOpacity>

            {isExpanded && slots.length > 0 && (
              <View className="px-3.5 pb-3.5 gap-2.5">
                {slots.map((slot, index) => (
                  <View key={index} className="flex-row items-center gap-2.5">
                    <TouchableOpacity
                      className="flex-1 flex-row items-center justify-between bg-amber-50 rounded-lg p-3 border border-gray-200"
                      onPress={() => setEditingSlot({ date: slot.date, index })}
                    >
                      <View className="flex-row items-center gap-1.5">
                        <Text className="text-sm font-semibold text-gray-900">{slot.start}</Text>
                        <Text className="text-sm text-gray-500">→</Text>
                        <Text className="text-sm font-semibold text-gray-900">{slot.end}</Text>
                      </View>
                      <Text className="text-xs font-semibold text-teal-600">
                        {((timeToMinutes(slot.end) - timeToMinutes(slot.start)) / 60).toFixed(1)}h
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      className="w-8 h-8 rounded-full bg-red-50 justify-center items-center"
                      onPress={() => removeTimeSlot(slot.date, index)}
                    >
                      <Trash2 size={18} color={Colors.error} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

            {isExpanded && slots.length === 0 && (
              <View className="p-4 items-center">
                <Text className="text-sm text-gray-400 italic">Aucun créneau défini</Text>
              </View>
            )}
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <StatusBar barStyle="light-content" backgroundColor={Colors.primary} />
      
      <View className="bg-teal-700 pt-12 pb-4 px-4 flex-row items-center justify-between">
        <TouchableOpacity 
          className="w-9 h-9 rounded-full bg-white/20 justify-center items-center"
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={Colors.white} strokeWidth={2.5} />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Disponibilités</Text>
        <TouchableOpacity
          className="w-9 h-9 rounded-full bg-white/20 justify-center items-center"
          onPress={handleSave}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color={Colors.white} />
          ) : (
            <Check size={24} color={Colors.white} strokeWidth={2.5} />
          )}
        </TouchableOpacity>
      </View>

      <View className="flex-row bg-white m-3 rounded-xl p-1 gap-1">
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${
            viewMode === 'calendar' ? 'bg-teal-700' : ''
          }`}
          onPress={() => setViewMode('calendar')}
        >
          <Calendar size={18} color={viewMode === 'calendar' ? Colors.white : Colors.primary} strokeWidth={2} />
          <Text className={`text-sm font-semibold ${viewMode === 'calendar' ? 'text-white' : 'text-teal-700'}`}>
            Agenda
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          className={`flex-1 flex-row items-center justify-center gap-1.5 py-2.5 rounded-lg ${
            viewMode === 'list' ? 'bg-teal-700' : ''
          }`}
          onPress={() => setViewMode('list')}
        >
          <List size={18} color={viewMode === 'list' ? Colors.white : Colors.primary} strokeWidth={2} />
          <Text className={`text-sm font-semibold ${viewMode === 'list' ? 'text-white' : 'text-teal-700'}`}>
            Configuration
          </Text>
        </TouchableOpacity>
      </View>

      {viewMode === 'calendar' ? renderCalendarView() : renderListView()}

      <Modal visible={editingSlot !== null} transparent animationType="slide" onRequestClose={() => setEditingSlot(null)}>
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-5">
            <View className="flex-row justify-between items-center mb-5">
              <Text className="text-lg font-bold text-gray-900">Modifier</Text>
              <TouchableOpacity onPress={() => setEditingSlot(null)}>
                <X size={24} color={Colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            {editingSlot && (
              <View className="gap-4">
                <View className="flex-row gap-3">
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 mb-2">Début</Text>
                    <TouchableOpacity
                      className="bg-amber-50 border-2 border-gray-200 rounded-xl p-3.5 items-center"
                      onPress={() => {
                        const slots = dateSlots.filter(s => s.date === editingSlot.date);
                        setShowTimePicker({ 
                          field: 'start', 
                          value: slots[editingSlot.index].start 
                        });
                      }}
                    >
                      <Text className="text-base font-bold text-gray-900">
                        {dateSlots.filter(s => s.date === editingSlot.date)[editingSlot.index].start}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-gray-900 mb-2">Fin</Text>
                    <TouchableOpacity
                      className="bg-amber-50 border-2 border-gray-200 rounded-xl p-3.5 items-center"
                      onPress={() => {
                        const slots = dateSlots.filter(s => s.date === editingSlot.date);
                        setShowTimePicker({ 
                          field: 'end', 
                          value: slots[editingSlot.index].end 
                        });
                      }}
                    >
                      <Text className="text-base font-bold text-gray-900">
                        {dateSlots.filter(s => s.date === editingSlot.date)[editingSlot.index].end}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
                <TouchableOpacity
                  className="flex-row items-center justify-center gap-2 bg-red-50 rounded-xl p-3.5"
                  onPress={() => {
                    removeTimeSlot(editingSlot.date, editingSlot.index);
                    setEditingSlot(null);
                  }}
                >
                  <Trash2 size={18} color={Colors.error} strokeWidth={2} />
                  <Text className="text-base font-semibold text-red-600">Supprimer</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>

      <Modal visible={showTimePicker !== null} transparent animationType="fade" onRequestClose={() => setShowTimePicker(null)}>
        <View className="flex-1 bg-black/50 justify-center items-center p-4">
          <View className="bg-white rounded-2xl w-full max-h-[70%] overflow-hidden">
            <View className="flex-row justify-between items-center p-4 border-b border-gray-200">
              <Text className="text-base font-bold text-gray-900">
                {showTimePicker?.field === 'start' ? 'Début' : 'Fin'}
              </Text>
              <TouchableOpacity onPress={() => setShowTimePicker(null)}>
                <X size={24} color={Colors.textSecondary} strokeWidth={2} />
              </TouchableOpacity>
            </View>
            <ScrollView className="max-h-96">
              {TIME_OPTIONS.map((time) => (
                <TouchableOpacity
                  key={time}
                  className={`flex-row justify-between items-center p-3.5 border-b border-gray-100 ${
                    showTimePicker?.value === time ? 'bg-teal-50' : ''
                  }`}
                  onPress={() => {
                    if (editingSlot) {
                      updateTimeSlot(editingSlot.date, editingSlot.index, showTimePicker!.field, time);
                      setShowTimePicker(null);
                    }
                  }}
                >
                  <Text className={`text-base ${
                    showTimePicker?.value === time ? 'font-bold text-teal-700' : 'text-gray-900'
                  }`}>
                    {time}
                  </Text>
                  {showTimePicker?.value === time && (
                    <Check size={18} color={Colors.primary} strokeWidth={2.5} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}
