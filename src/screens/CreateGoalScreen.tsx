import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppTheme } from '../contexts/ThemeContext';
import { GoalStep, GoalType, NewGoal } from '../types/goals';

export default function CreateGoalScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();

  const [goalTitle, setGoalTitle] = useState('');
  const [goalType, setGoalType] = useState<GoalType>('distance');
  const [targetValue, setTargetValue] = useState<number>(10);
  const [stepCount, setStepCount] = useState<number>(3);
  const [steps, setSteps] = useState<GoalStep[]>([]);
  const [durationWeeks, setDurationWeeks] = useState<number>(4);
  const [startToday, setStartToday] = useState<boolean>(true);
  const [startDate, setStartDate] = useState<Date | null>(null);

  // Get default target value based on goal type
  const getDefaultTarget = (type: GoalType): number => {
    switch (type) {
      case 'distance':
        return 10;
      case 'time':
        return 60;
      case 'sessions':
        return 4;
      case 'points':
        return 1000;
      default:
        return 10;
    }
  };

  // Get slider range based on goal type
  const getSliderRange = (type: GoalType): { min: number; max: number } => {
    switch (type) {
      case 'distance':
        return { min: 1, max: 100 };
      case 'time':
        return { min: 10, max: 600 };
      case 'sessions':
        return { min: 1, max: 20 };
      case 'points':
        return { min: 100, max: 10000 };
      default:
        return { min: 1, max: 100 };
    }
  };

  // Get unit label based on goal type
  const getUnit = (type: GoalType): string => {
    switch (type) {
      case 'distance':
        return 'km';
      case 'time':
        return 'min';
      case 'sessions':
        return 'runs';
      case 'points':
        return 'pts';
      default:
        return '';
    }
  };

  // Get goal type description
  const getTypeDescription = (type: GoalType): string => {
    switch (type) {
      case 'distance':
        return 'Track total kilometers you want to run.';
      case 'time':
        return 'Track total minutes spent running.';
      case 'sessions':
        return 'Track how many runs you complete.';
      case 'points':
        return 'Track points earned from runs.';
      default:
        return '';
    }
  };

  // Auto-generate steps when stepCount or targetValue changes
  useEffect(() => {
    const stepTarget = Math.round(targetValue / stepCount);
    const newSteps: GoalStep[] = [];
    for (let i = 0; i < stepCount; i++) {
      newSteps.push({
        id: i + 1,
        label: '',
        target: stepTarget,
      });
    }
    setSteps(newSteps);
  }, [stepCount, targetValue]);

  // Reset target value when goal type changes
  useEffect(() => {
    setTargetValue(getDefaultTarget(goalType));
  }, [goalType]);

  // Update step target when targetValue changes
  useEffect(() => {
    if (steps.length > 0) {
      const stepTarget = Math.round(targetValue / stepCount);
      setSteps((prevSteps) =>
        prevSteps.map((step) => ({
          ...step,
          target: stepTarget,
        }))
      );
    }
  }, [targetValue, stepCount]);

  const handleStepLabelChange = (id: number, label: string) => {
    setSteps((prevSteps) =>
      prevSteps.map((step) => (step.id === id ? { ...step, label } : step))
    );
  };

  const handleCreateGoal = () => {
    if (!goalTitle.trim() || targetValue === 0) {
      return;
    }

    const newGoal: NewGoal = {
      title: goalTitle.trim(),
      type: goalType,
      target: targetValue,
      steps: steps,
      durationWeeks: durationWeeks,
      startDate: startToday ? new Date() : startDate || new Date(),
    };

    console.log('New Goal Created:', newGoal);
    // TODO: Add goal to user's goals list
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTarget = (): string => {
    return `${targetValue} ${getUnit(goalType)}`;
  };

  const sliderRange = getSliderRange(goalType);
  const unit = getUnit(goalType);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.helperText, { color: theme.mutedText }]}>
            Set your own running goal in just a few steps.
          </Text>

          {/* Goal Name Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Goal title</Text>
            <TextInput
              style={[styles.input, { color: theme.text, borderColor: theme.border }]}
              placeholder="Ex: Run 15 km this week"
              placeholderTextColor={theme.mutedText}
              value={goalTitle}
              onChangeText={setGoalTitle}
            />
            <Text style={[styles.hintText, { color: theme.mutedText }]}>
              Pick a short, motivating name.
            </Text>
          </View>

          {/* Goal Type Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Goal type</Text>
            <View style={styles.pillRow}>
              {(['distance', 'time', 'sessions', 'points'] as GoalType[]).map((type) => {
                const isSelected = goalType === type;
                const labels: Record<GoalType, string> = {
                  distance: 'Distance',
                  time: 'Time',
                  sessions: 'Sessions',
                  points: 'Points',
                };
                return (
                  <TouchableOpacity
                    key={type}
                    style={[
                      styles.pill,
                      isSelected && { backgroundColor: theme.accent },
                      !isSelected && { borderColor: theme.border },
                      { marginRight: 8, marginBottom: 8 },
                    ]}
                    onPress={() => setGoalType(type)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.pillText,
                        { color: isSelected ? '#020617' : theme.mutedText },
                      ]}
                    >
                      {labels[type]}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            <Text style={[styles.hintText, { color: theme.mutedText, marginTop: 8 }]}>
              {getTypeDescription(goalType)}
            </Text>
          </View>

          {/* Goal Target Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>
              {goalType === 'distance'
                ? 'Total distance'
                : goalType === 'time'
                ? 'Total time'
                : goalType === 'sessions'
                ? 'Number of runs'
                : 'Points target'}
            </Text>
            <Text style={[styles.bigValue, { color: theme.text }]}>{formatTarget()}</Text>
            <Slider
              style={styles.slider}
              minimumValue={sliderRange.min}
              maximumValue={sliderRange.max}
              value={targetValue}
              onValueChange={setTargetValue}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
            />
            <Text style={[styles.hintText, { color: theme.mutedText }]}>
              Drag the slider or tap the number to adjust your target.
            </Text>
          </View>

          {/* Goal Steps Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Steps</Text>
            <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>
              Break this goal into smaller steps.
            </Text>
            <Text style={[styles.stepCountText, { color: theme.text }]}>{stepCount} steps</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={5}
              value={stepCount}
              onValueChange={(value) => setStepCount(Math.round(value))}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
              step={1}
            />
            {steps.map((step) => (
              <View key={step.id} style={styles.stepRow}>
                <TextInput
                  style={[
                    styles.stepInput,
                    { color: theme.text, borderColor: theme.border, backgroundColor: theme.background },
                  ]}
                  placeholder={`Ex: Step ${step.id} - First easy run`}
                  placeholderTextColor={theme.mutedText}
                  value={step.label}
                  onChangeText={(text) => handleStepLabelChange(step.id, text)}
                />
                <View style={[styles.stepTarget, { backgroundColor: theme.border, marginLeft: 8 }]}>
                  <Text style={[styles.stepTargetText, { color: theme.text }]}>
                    {step.target} {unit}
                  </Text>
                </View>
              </View>
            ))}
            <Text style={[styles.hintText, { color: theme.mutedText, marginTop: 8 }]}>
              Use steps to make big goals feel easier.
            </Text>
          </View>

          {/* Goal Duration Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Duration</Text>
            <Text style={[styles.durationText, { color: theme.text }]}>{durationWeeks} weeks</Text>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={12}
              value={durationWeeks}
              onValueChange={(value) => setDurationWeeks(Math.round(value))}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
              step={1}
            />
            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  startToday && { backgroundColor: theme.accent },
                  !startToday && { borderColor: theme.border },
                ]}
                onPress={() => setStartToday(true)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: startToday ? '#020617' : theme.mutedText },
                  ]}
                >
                  Start today
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.togglePill,
                  !startToday && { backgroundColor: theme.accent },
                  startToday && { borderColor: theme.border },
                  { marginLeft: 8 },
                ]}
                onPress={() => setStartToday(false)}
                activeOpacity={0.8}
              >
                <Text
                  style={[
                    styles.toggleText,
                    { color: !startToday ? '#020617' : theme.mutedText },
                  ]}
                >
                  Choose start date
                </Text>
              </TouchableOpacity>
            </View>
            {!startToday && (
              <TextInput
                style={[
                  styles.input,
                  { color: theme.text, borderColor: theme.border, marginTop: 8 },
                ]}
                placeholder="Tap to pick date"
                placeholderTextColor={theme.mutedText}
                editable={false}
                value={startDate ? formatDate(startDate) : ''}
              />
            )}
            <Text style={[styles.hintText, { color: theme.mutedText, marginTop: 8 }]}>
              Set a clear end date so you know when you've won.
            </Text>
          </View>

          {/* Goal Summary Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Summary</Text>
            <Text style={[styles.summaryText, { color: theme.mutedText }]}>
              You'll complete {formatTarget()} over {stepCount} step{stepCount !== 1 ? 's' : ''} in{' '}
              {durationWeeks} week{durationWeeks !== 1 ? 's' : ''}.
            </Text>
            <Text style={[styles.summaryText, { color: theme.mutedText, marginTop: 4 }]}>
              {startToday
                ? 'Starts today.'
                : startDate
                ? `Starts on ${formatDate(startDate)}.`
                : 'Choose a start date.'}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={[styles.bottomActions, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: theme.border, marginRight: 12 }]}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={[styles.cancelButtonText, { color: theme.mutedText }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.createButton,
              { backgroundColor: theme.accent },
              (!goalTitle.trim() || targetValue === 0) && styles.createButtonDisabled,
            ]}
            onPress={handleCreateGoal}
            activeOpacity={0.8}
            disabled={!goalTitle.trim() || targetValue === 0}
          >
            <Text style={[styles.createButtonText, { color: '#020617' }]}>Create Goal</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 100,
  },
  helperText: {
    fontSize: 14,
    marginBottom: 24,
    lineHeight: 20,
  },
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  cardSubtitle: {
    fontSize: 14,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
  },
  pillRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  bigValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  stepCountText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  stepInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  stepTarget: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  stepTargetText: {
    fontSize: 14,
    fontWeight: '600',
  },
  durationText: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    marginTop: 12,
  },
  togglePill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
  },
  summaryText: {
    fontSize: 14,
    lineHeight: 20,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
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
  },
  createButtonDisabled: {
    opacity: 0.5,
  },
  createButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

