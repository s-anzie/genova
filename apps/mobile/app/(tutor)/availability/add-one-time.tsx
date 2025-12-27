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
import { CalendarDays, Clock } from 'lucide-react-native';
import { Colors, Spacing, BorderRadius, Shadows } from '@/constants/colors';
import { PageHeader } from '@/components/PageHeader';
import { apiClient } from '@/utils/api-client';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StyledModal, ModalType } from '@/components/ui/StyledModal';

export default function AddOneTimeAvailabilityScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ date?: string; startHour?: string }>();
  
  // Initialiser avec la date passée en paramètre ou aujourd'hui
  const initialDate = params.date ? new Date(params.date) : new Date();
  const [selectedDate, setSelectedDate] = useState(initialDate);
  
  // Initialiser les heures avec l'heure passée en paramètre ou des valeurs par défaut
  const initialStartTime = new Date();
  if (params.startHour) {
    initialStartTime.setHours(parseInt(params.startHour), 0, 0, 0);
  } else {
    initialStartTime.setHours(9, 0, 0, 0);
  }
  
  const initialEndTime = new Date(initialStartTime);
  initialEndTime.setHours(initialStartTime.getHours() + 2); // 2 heures par défaut
  
  const [startTime, setStartTime] = useState(initialStartTime);
  const [endTime, setEndTime] = useState(initialEndTime);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  
  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<ModalType>('warning');
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const [modalPrimaryAction, setModalPrimaryAction] = useState<(() => void) | null>(null);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
  };

  const handleSubmit = async () => {
    // Validation
    const now = new Date();
    if (selectedDate < now) {
      setModalType('error');
      setModalTitle('Erreur');
      setModalMessage('La date doit être dans le futur');
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

    // Show confirmation modal
    setModalType('warning');
    setModalTitle('Confirmer');
    setModalMessage(`Ajouter une disponibilité le ${formatDate(selectedDate).toLowerCase()} de ${formatTime(startTime)} à ${formatTime(endTime)} ?`);
    setModalPrimaryAction(() => confirmSubmit);
    setModalVisible(true);
  };

  const confirmSubmit = async () => {
    setModalVisible(false);
    
    try {
      setSubmitting(true);

      // Format the date as ISO string for the API
      const dateStr = selectedDate.toISOString().split('T')[0];

      await apiClient.post('/tutors/one-time', {
        specificDate: dateStr,
        startTime: formatTime(startTime),
        endTime: formatTime(endTime),
      });

      // Show success modal
      setModalType('success');
      setModalTitle('Succès');
      setModalMessage('Disponibilité ponctuelle ajoutée avec succès');
      setModalPrimaryAction(() => () => {
        setModalVisible(false);
        router.back();
      });
      setModalVisible(true);
    } catch (error: any) {
      console.error('❌ Failed to create one-time availability:', error);
      
      // Show error modal
      setModalType('error');
      setModalTitle('Erreur');
      setModalMessage(error.message || 'Impossible de créer la disponibilité ponctuelle');
      setModalPrimaryAction(null);
      setModalVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const onDateChange = (_event: any, selectedDate?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (selectedDate) {
      setSelectedDate(selectedDate);
    }
  };

  const onStartTimeChange = (_event: any, selectedTime?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const onEndTimeChange = (_event: any, selectedTime?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedTime) {
      setEndTime(selectedTime);
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
          <CalendarDays size={20} color={Colors.accent2} strokeWidth={2} />
          <Text style={styles.infoText}>
            Ajoutez une disponibilité pour une date spécifique
          </Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date</Text>
          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <CalendarDays size={20} color={Colors.accent2} strokeWidth={2} />
            <Text style={styles.dateButtonText}>{formatDate(selectedDate)}</Text>
          </TouchableOpacity>
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
                <Clock size={18} color={Colors.accent2} strokeWidth={2} />
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
                <Clock size={18} color={Colors.accent2} strokeWidth={2} />
                <Text style={styles.timeButtonText}>{formatTime(endTime)}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Picker */}
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onDateChange}
            minimumDate={new Date()}
          />
        )}

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
    backgroundColor: Colors.accent2 + '08',
    borderRadius: BorderRadius.large,
    padding: Spacing.md,
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.accent2 + '20',
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
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.large,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.small,
  },
  dateButtonText: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textPrimary,
    textTransform: 'capitalize',
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
    color: Colors.accent2,
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
    backgroundColor: Colors.accent2,
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
