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
import { useNavigation } from '@react-navigation/native';
import { useAppTheme } from '../contexts/ThemeContext';
import { useGoals } from '../contexts/GoalsContext';
import { GoalType, GoalStep } from '../types/goal';
import SectionCard from '../components/goals/SectionCard';
import GoalTypePills from '../components/goals/GoalTypePills';
import LabeledSlider from '../components/goals/LabeledSlider';
import StepRowPreview from '../components/goals/StepRowPreview';
import SummaryCard from '../components/goals/SummaryCard';

// Helper function to split target into steps
function splitTargetIntoSteps(total: number, count: number): number[] {
  if (count === 1) return [total];
  const step = total / count;
  const steps: number[] = [];
  let remaining = total;
  for (let i = 0; i < count - 1; i++) {
    const value = Math.round(step * 10) / 10; // Round to 1 decimal
    steps.push(value);
    remaining -= value;
  }
  steps.push(Math.round(remaining * 10) / 10);
  return steps;
}

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
  const [stepCount, setStepCount] = useState(3);
  const [stepNames, setStepNames] = useState<string[]>(['Step 1', 'Step 2', 'Step 3']);
  const [durationWeeks, setDurationWeeks] = useState(4);
  const [startMode, setStartMode] = useState<'today' | 'custom'>('today');
  const [startDate, setStartDate] = useState<Date | null>(null);

  // Modal states
  const [showNumericModal, setShowNumericModal] = useState(false);
  const [numericInputValue, setNumericInputValue] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Update step names when step count changes
  React.useEffect(() => {
    const newNames: string[] = [];
    for (let i = 1; i <= stepCount; i++) {
      newNames.push(stepNames[i - 1] || `Step ${i}`);
    }
    setStepNames(newNames);
  }, [stepCount]);

  // Calculate step targets
  const stepTargets = useMemo(() => {
    return splitTargetIntoSteps(targetValue, stepCount);
  }, [targetValue, stepCount]);

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

  // Format value for display
  const formatTargetValue = (value: number): string => {
    switch (goalType) {
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'time':
        return `${value} min`;
      case 'sessions':
        return `${value} run${value !== 1 ? 's' : ''}`;
      case 'points':
        return `${value.toLocaleString()} pts`;
      default:
        return `${value}`;
    }
  };

  // Get target label
  const getTargetLabel = (): string => {
    switch (goalType) {
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

    const today = new Date();
    const computedStartDate = startMode === 'today' ? today : startDate || today;
    const computedEndDate = new Date(computedStartDate);
    computedEndDate.setDate(computedEndDate.getDate() + durationWeeks * 7);

    const steps: GoalStep[] = stepTargets.map((target, index) => ({
      id: `step_${index}`,
      name: stepNames[index] || `Step ${index + 1}`,
      target,
      current: 0,
    }));

    addGoal({
      title: goalTitle.trim(),
      type: goalType,
      target: targetValue,
      steps,
      durationWeeks,
      startDate: computedStartDate,
      endDate: computedEndDate,
    });

    navigation.goBack();
  };

  // Validation
  const canCreate = goalTitle.trim().length > 0 && targetValue > 0;

  // Random placeholder
  const placeholderIndex = Math.floor(Math.random() * goalTitlePlaceholders.length);
  const placeholder = goalTitlePlaceholders[placeholderIndex];

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
            <LabeledSlider
              label={getTargetLabel()}
              value={targetValue}
              min={sliderConfig.min}
              max={sliderConfig.max}
              step={sliderConfig.step}
              onValueChange={setTargetValue}
              formatValue={formatTargetValue}
              onTapToEdit={() => {
                setNumericInputValue(targetValue.toString());
                setShowNumericModal(true);
              }}
            />
          </SectionCard>

          {/* Card 4: Steps */}
          <SectionCard
            title="Goal steps"
            helperText="Use steps to make big goals feel easier."
          >
            <View style={styles.stepsHeader}>
              <Text style={[styles.stepsLabel, { color: theme.text }]}>
                Break this goal into smaller steps
              </Text>
              <Text style={[styles.stepsChip, { color: theme.accent }]}>
                {stepCount} {stepCount === 1 ? 'step' : 'steps'}
              </Text>
            </View>
            <View style={styles.stepsSliderContainer}>
              <Text style={[styles.stepsSliderLabel, { color: theme.text }]}>
                Number of steps
              </Text>
              <View style={styles.stepsSliderRow}>
                <Slider
                  style={styles.stepsSlider}
                  value={stepCount}
                  minimumValue={1}
                  maximumValue={5}
                  step={1}
                  onValueChange={(value) => setStepCount(Math.round(value))}
                  minimumTrackTintColor={theme.accent}
                  maximumTrackTintColor={theme.border}
                  thumbTintColor={theme.accent}
                />
                <Text style={[styles.stepsSliderValue, { color: theme.text }]}>
                  {stepCount} {stepCount === 1 ? 'step' : 'steps'}
                </Text>
              </View>
            </View>
            <View style={styles.stepsList}>
              {stepTargets.map((target, index) => (
                <StepRowPreview
                  key={index}
                  stepName={stepNames[index] || `Step ${index + 1}`}
                  stepTarget={target}
                  goalType={goalType}
                  onNameChange={(name) => {
                    const newNames = [...stepNames];
                    newNames[index] = name;
                    setStepNames(newNames);
                  }}
                />
              ))}
            </View>
          </SectionCard>

          {/* Card 5: Duration */}
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
          </SectionCard>

          {/* Card 6: Summary */}
          <SummaryCard
            goalType={goalType}
            targetValue={targetValue}
            stepCount={stepCount}
            durationWeeks={durationWeeks}
            startMode={startMode}
            startDate={startDate}
          />

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

      {/* Date Picker Modal (simplified - using basic date selection) */}
      <Modal
        visible={showDatePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.modalTitle, { color: theme.text }]}>Choose start date</Text>
            <Text style={[styles.modalHelper, { color: theme.mutedText }]}>
              For a full date picker, you can integrate @react-native-community/datetimepicker
            </Text>
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: theme.border }]}
                onPress={() => {
                  setStartDate(new Date());
                  setShowDatePicker(false);
                }}
              >
                <Text style={[styles.modalButtonText, { color: theme.text }]}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: theme.accent }]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={[styles.modalButtonText, { color: '#020617' }]}>Close</Text>
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
  stepsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  stepsLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  stepsChip: {
    fontSize: 12,
    fontWeight: '600',
  },
  stepsSliderContainer: {
    marginBottom: 16,
  },
  stepsSliderLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  stepsSliderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepsSlider: {
    flex: 1,
    height: 40,
  },
  stepsSliderValue: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 60,
  },
  stepsList: {
    marginTop: 8,
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
  modalHelper: {
    fontSize: 12,
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

