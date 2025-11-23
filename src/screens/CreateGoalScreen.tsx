import React, { useState, useMemo } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../contexts/ThemeContext';
import { useGoals } from '../contexts/GoalsContext';
import { GoalType, getGoalUnitLabel } from '../types/goal';
import SectionCard from '../components/goals/SectionCard';
import GoalTypePills from '../components/goals/GoalTypePills';

// Placeholder rotation for goal title
const goalTitlePlaceholders = [
  'Run 15 km this week',
  'Train for my 5K race',
  'Evening runs 3x a week',
  'Complete 10 runs this month',
  'Run 30 minutes daily',
];

export default function CreateGoalScreen() {
  const navigation = useNavigation();
  const { theme } = useAppTheme();
  const { addGoal } = useGoals();

  // State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('distance');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [startMode, setStartMode] = useState<'today' | 'custom'>('today');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Modal states
  const [showNumericModal, setShowNumericModal] = useState(false);
  const [numericInputValue, setNumericInputValue] = useState('');

  // Get slider config based on goal type
  const sliderConfig = useMemo(() => {
    switch (goalType) {
      case 'distance':
        return { min: 1, max: 100, step: 0.5, default: 10 };
      case 'time':
        return { min: 10, max: 600, step: 5, default: 60 };
      case 'sessions':
        return { min: 1, max: 20, step: 1, default: 5 };
      case 'points':
        return { min: 100, max: 10000, step: 100, default: 1000 };
      default:
        return { min: 1, max: 100, step: 1, default: 10 };
    }
  }, [goalType]);

  // Update target value when goal type changes
  React.useEffect(() => {
    setTargetValue(sliderConfig.default);
  }, [goalType]);

  // Universal helpers
  const getTargetLabel = (type: GoalType): string => {
    switch (type) {
      case 'distance':
        return 'Total distance';
      case 'time':
        return 'Total time';
      case 'sessions':
        return 'Number of runs';
      case 'points':
        return 'Points to earn';
      default:
        return 'Goal target';
    }
  };

  const getTargetDisplay = (type: GoalType, value: number): string => {
    const unit = getGoalUnitLabel(type);
    const num = type === 'sessions' ? value.toFixed(0) : value.toFixed(1);

    if (type === 'sessions') return `${num} ${unit}`;
    if (type === 'points') return `${Number(num).toLocaleString()} ${unit}`;
    return `${num} ${unit}`;
  };

  // Handle numeric input
  const handleNumericInput = () => {
    const numValue = parseFloat(numericInputValue);
    if (!isNaN(numValue) && numValue >= sliderConfig.min && numValue <= sliderConfig.max) {
      setTargetValue(numValue);
      setShowNumericModal(false);
      setNumericInputValue('');
    }
  };

  // Handle create goal
  const handleCreateGoal = () => {
    if (!goalTitle.trim() || targetValue === 0) return;

    const unitLabel = getGoalUnitLabel(goalType);
    const computedStartDate = startMode === 'today' ? new Date() : startDate;

    addGoal({
      title: goalTitle.trim(),
      type: goalType,
      targetValue,
      unitLabel,
      durationWeeks,
      startDate: computedStartDate.toISOString(),
    });

    navigation.goBack();
  };

  // Validation
  const canCreate = goalTitle.trim().length > 0 && targetValue > 0;

  // Random placeholder
  const placeholderIndex = Math.floor(Math.random() * goalTitlePlaceholders.length);
  const placeholder = goalTitlePlaceholders[placeholderIndex];

  // Summary calculations
  const unit = getGoalUnitLabel(goalType);
  const targetText = getTargetDisplay(goalType, targetValue);
  const computedStartDate = startMode === 'today' ? new Date() : startDate;
  const endDate = new Date(computedStartDate);
  endDate.setDate(endDate.getDate() + durationWeeks * 7);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Screen Title */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: theme.text }]}>Create a Goal</Text>
            <Text style={[styles.subtitle, { color: theme.mutedText }]}>
              Set a running goal in just a few taps.
            </Text>
          </View>

          {/* Card 1: Goal Title */}
          <SectionCard title="Goal name" helperText="Pick a short, motivating name.">
            <TextInput
              style={[styles.titleInput, { color: theme.text, borderColor: theme.border }]}
              placeholder={placeholder}
              placeholderTextColor={theme.mutedText}
              value={goalTitle}
              onChangeText={setGoalTitle}
              maxLength={40}
              autoCapitalize="words"
            />
          </SectionCard>

          {/* Card 2: Goal Type */}
          <SectionCard title="Goal type">
            <GoalTypePills selectedType={goalType} onSelect={setGoalType} />
          </SectionCard>

          {/* Card 3: Goal Target */}
          <SectionCard
            title="Goal target"
            helperText="Drag the slider or tap the number to adjust your target."
          >
            <Text style={[styles.targetLabel, { color: theme.text }]}>
              {getTargetLabel(goalType)}
            </Text>
            <View style={styles.targetValueContainer}>
              <Text
                style={[styles.targetValue, { color: theme.text }]}
                numberOfLines={1}
                adjustsFontSizeToFit
              >
                {getTargetDisplay(goalType, targetValue)}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setNumericInputValue(targetValue.toString());
                  setShowNumericModal(true);
                }}
                activeOpacity={0.7}
              >
                <Text style={[styles.tapToEdit, { color: theme.accent }]}>
                  Tap number to type exact value
                </Text>
              </TouchableOpacity>
            </View>
            <Slider
              style={styles.slider}
              value={targetValue}
              minimumValue={sliderConfig.min}
              maximumValue={sliderConfig.max}
              step={sliderConfig.step}
              onValueChange={setTargetValue}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
            />
          </SectionCard>

          {/* Card 4: Duration */}
          <SectionCard
            title="Duration"
            helperText="Set a clear end date so you know when you've won."
          >
            <View style={styles.durationContainer}>
              <Text style={[styles.durationLabel, { color: theme.text }]}>
                How long is this goal?
              </Text>
              <Text style={[styles.durationValue, { color: theme.text }]}>
                {durationWeeks} {durationWeeks === 1 ? 'week' : 'weeks'}
              </Text>
              <Slider
                style={styles.durationSlider}
                value={durationWeeks}
                minimumValue={1}
                maximumValue={12}
                step={1}
                onValueChange={(value) => setDurationWeeks(Math.round(value))}
                minimumTrackTintColor={theme.accent}
                maximumTrackTintColor={theme.border}
                thumbTintColor={theme.accent}
              />
            </View>
            <View style={styles.startDateRow}>
              <TouchableOpacity
                style={[
                  styles.startDatePill,
                  startMode === 'today'
                    ? { backgroundColor: theme.accent }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
                ]}
                onPress={() => setStartMode('today')}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.startDatePillText,
                    {
                      color: startMode === 'today' ? '#020617' : theme.text,
                      fontWeight: startMode === 'today' ? '600' : '400',
                    },
                  ]}
                >
                  Start today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.startDatePill,
                  startMode === 'custom'
                    ? { backgroundColor: theme.accent }
                    : { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
                ]}
                onPress={() => {
                  setStartMode('custom');
                  setShowDatePicker(true);
                }}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.startDatePillText,
                    {
                      color: startMode === 'custom' ? '#020617' : theme.text,
                      fontWeight: startMode === 'custom' ? '600' : '400',
                    },
                  ]}
                >
                  Choose start date
                </Text>
              </TouchableOpacity>
            </View>
            {startMode === 'custom' && (
              <TouchableOpacity
                style={[styles.dateButton, { borderColor: theme.border }]}
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dateButtonLabel, { color: theme.text }]}>
                  {startDate.toDateString()}
                </Text>
              </TouchableOpacity>
            )}
            {showDatePicker && (
              <DateTimePicker
                mode="date"
                value={startDate}
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setStartDate(date);
                  }
                }}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              />
            )}
          </SectionCard>

          {/* Card 5: Summary */}
          <SectionCard title="Summary">
            <Text style={[styles.summaryLine, { color: theme.text }]}>
              You'll aim for{' '}
              <Text style={{ color: theme.accent, fontWeight: '700' }}>{targetText}</Text> in{' '}
              <Text style={{ color: theme.accent, fontWeight: '700' }}>
                {durationWeeks} {durationWeeks === 1 ? 'week' : 'weeks'}
              </Text>
              .
            </Text>
            <Text style={[styles.timeline, { color: theme.mutedText }]}>
              {startMode === 'today' ? 'Starts today' : `Starts ${computedStartDate.toDateString()}`} • Ends{' '}
              {endDate.toDateString()}
            </Text>
          </SectionCard>

          {/* Bottom spacer */}
          <View style={styles.bottomSpacer} />
        </ScrollView>

        {/* Bottom Action Bar */}
        <View style={[styles.actionBar, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          {!canCreate && (
            <Text style={[styles.hintText, { color: theme.mutedText }]}>
              Add a goal name and target to continue.
            </Text>
          )}
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.cancelButton, { borderColor: theme.border }]}
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.createButton,
                { backgroundColor: theme.accent },
                !canCreate && styles.createButtonDisabled,
              ]}
              onPress={handleCreateGoal}
              disabled={!canCreate}
              activeOpacity={0.8}
            >
              <Text
                style={[
                  styles.createButtonText,
                  { color: canCreate ? '#020617' : theme.mutedText },
                ]}
              >
                Create Goal
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>

      {/* Numeric Input Modal */}
      <Modal
        visible={showNumericModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowNumericModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Enter exact value</Text>
            <TextInput
              style={[styles.modalInput, { color: theme.text, borderColor: theme.border }]}
              value={numericInputValue}
              onChangeText={setNumericInputValue}
              keyboardType="numeric"
              placeholder={`${sliderConfig.min} - ${sliderConfig.max}`}
              placeholderTextColor={theme.mutedText}
              autoFocus
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => setShowNumericModal(false)}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={handleNumericInput}
              >
                <Text style={[styles.modalButtonText, { color: '#020617' }]}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  targetLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  targetValueContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  targetValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  tapToEdit: {
    fontSize: 12,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  durationContainer: {
    marginBottom: 20,
  },
  durationLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 12,
    textAlign: 'center',
  },
  durationSlider: {
    width: '100%',
    height: 40,
  },
  startDateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  startDatePill: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startDatePillText: {
    fontSize: 14,
  },
  dateButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  dateButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  summaryLine: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 8,
  },
  timeline: {
    fontSize: 13,
    lineHeight: 18,
  },
  bottomSpacer: {
    height: 100,
  },
  actionBar: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderTopWidth: 1,
  },
  hintText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 8,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  createButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
