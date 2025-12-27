import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Calendar, Clock } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { apiClient } from '@/utils/api-client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyledModal, ModalType } from '@/components/ui/StyledModal';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dim' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mer' },
  { value: 4, label: 'Jeu' },
  { value: 5, label: 'Ven' },
  { value: 6, label: 'Sam' },
];

export default function AddRecurringAvailabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ dayOfWeek?: string }>();
  const [selectedDay, setSelectedDay] = useState<number | null>(
    params.dayOfWeek ? parseInt(params.dayOfWeek) : null
  );
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('warning');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalPrimaryAction, setModalPrimaryAction] = useState<(() => void) | null>(null);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleSubmit = async () => {
    // Validation
    if (selectedDay === null) {
      setModalType('error');
      setModalTitle('Erreur');
      setModalMessage('Veuillez sélectionner un jour de la semaine');
      setModalPrimaryAction(null);
      setModalVisible(true);
      return;
    }

    if (startTime >= endTime) {
      setModalType('error');
      setModalTitle('Erreur');
      setModalMessage("L'heure de début doit être avant l'heure de fin");
      setModalPrimaryAction(null);
      setModalVisible(true);
      return;
    }

    const dayLabel = DAYS_OF_WEEK.find(d => d.value === selectedDay)?.label || '';
    
    // Show confirmation modal
    setModalType('warning');
    setModalTitle('Confirmer');
    setModalMessage(`Ajouter une disponibilité tous les ${dayLabel} de ${formatTime(startTime)} à ${formatTime(endTime)} ?`);
    setModalPrimaryAction(() => confirmSubmit);
    setModalVisible(true);
  };

  const confirmSubmit = async () => {
    setModalVisible(false);
    
    try {
      setSubmitting(true);

      await apiClient.post('/tutors/recurring', {
        dayOfWeek: selectedDay,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      });

      // Show success modal
      setModalType('success');
      setModalTitle('Succès');
      setModalMessage('Disponibilité récurrente ajoutée avec succès');
      setModalPrimaryAction(() => () => {
        setModalVisible(false);
        router.back();
      });
      setModalVisible(true);
    } catch (error: any) {
      console.error('❌ Failed to create recurring availability:', error);
      
      // Show error modal
      setModalType('error');
      setModalTitle('Erreur');
      setModalMessage(error.message || 'Impossible de créer la disponibilité récurrente');
      setModalPrimaryAction(null);
      setModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const onStartTimeChange = (_event: any, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartTime(selectedDate);
    }
  };

  const onEndTimeChange = (_event: any, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndTime(selectedDate);
    }
  };

  return (
    <View style={styles.container}>
      <PageHeader
        title="Disponibilité"
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
        {/* Info Card */}
        <View style={styles.infoCard}>
          <Calendar size={20} color={Colors.primary} strokeWidth={2} />
          <Text style={styles.infoText}>
            Définissez un créneau qui se répète chaque semaine
          </Text>
        </View>

        {/* Day Selection - Horizontal Scroll */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Jour de la semaine</Text>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.daysScroll}
          >
            {DAYS_OF_WEEK.map(day => (
              <TouchableOpacity
                key={day.value}
                style={[
                  styles.dayChip,
                  selectedDay === day.value && styles.dayChipSelected,
                ]}
                onPress={() => setSelectedDay(day.value)}
              >
                <Text
                  style={[
                    styles.dayChipText,
                    selectedDay === day.value && styles.dayChipTextSelected,
                  ]}
                >
                  {day.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Time Selection - Same Row */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Horaires</Text>
          <View style={styles.timeRow}>
            {/* Start Time */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Début</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowStartPicker(true)}
              >
                <Clock size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.timeButtonText}>{formatTime(startTime)}</Text>
              </TouchableOpacity>
            </View>

            {/* Separator */}
            <View style={styles.timeSeparator}>
              <Text style={styles.timeSeparatorText}>→</Text>
            </View>

            {/* End Time */}
            <View style={styles.timeColumn}>
              <Text style={styles.timeLabel}>Fin</Text>
              <TouchableOpacity
                style={styles.timeButton}
                onPress={() => setShowEndPicker(true)}
              >
                <Clock size={18} color={Colors.primary} strokeWidth={2} />
                <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Time Pickers */}
        {showStartPicker && (
          <DateTimePicker
            value={startTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartTimeChange}
          />
        )}

        {showEndPicker && (
          <DateTimePicker
            value={endTime}
            mode="time"
            is24Hour={true}
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndTimeChange}
          />
        )}

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitButton, submitting && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          <Text style={styles.submitButtonText}>
            {submitting ? 'Enregistrement...' : 'Ajouter la disponibilité'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal */}
      <StyledModal
        visible={modalVisible}
        type={modalType}
        title={modalTitle}
        message={modalMessage}
        primaryButton={
          modalPrimaryAction
            ? {
                text: modalType === 'warning' ? 'Confirmer' : 'OK',
                onPress: modalPrimaryAction,
              }
            : {
                text: 'OK',
                onPress: () => setModalVisible(false),
              }
        }
        secondaryButton={
          modalType === 'warning'
            ? {
                text: 'Annuler',
                onPress: () => setModalVisible(false),
              }
            : undefined
        }
        onClose={() => setModalVisible(false)}
        showCloseButton={modalType !== 'warning'}
      />
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
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  infoCard: {
    backgroundColor: Colors.primary + '08',
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary + '20',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  section: {
    gap: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  daysScroll: {
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  dayChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.large,
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  dayChipSelected: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  dayChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  dayChipTextSelected: {
    color: Colors.white,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.md,
  },
  timeColumn: {
    flex: 1,
    gap: Spacing.xs,
  },
  timeLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  timeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  timeButtonText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    letterSpacing: 1,
  },
  timeSeparator: {
    paddingBottom: Spacing.md,
  },
  timeSeparatorText: {
    fontSize: 20,
    color: Colors.textSecondary,
  },
  submitButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    alignItems: 'center',
    marginTop: Spacing.md,
    ...Shadows.medium,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
});
