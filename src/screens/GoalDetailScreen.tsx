import Slider from '@react-native-community/slider';
import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { useGoals, Goal, GoalStep, formatStepProgressText } from '../contexts/GoalsContext';
import { useAppTheme } from '../contexts/ThemeContext';
import { GoalType } from '../types/goals';

interface RouteParams {
  goalId: string;
}

export default function GoalDetailScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation();
  const route = useRoute();
  const { goalId } = (route.params as RouteParams) || {};
  const { goals, updateGoal, updateGoalProgress } = useGoals();

  const goal = goals.find((g) => g.id === goalId);
  const [localGoal, setLocalGoal] = useState<Goal | null>(
    goal ? { ...goal, steps: goal.steps ? [...goal.steps] : undefined } : null
  );

  useEffect(() => {
    // Update local goal if the goal changes in context
    const updatedGoal = goals.find((g) => g.id === goalId);
    if (updatedGoal) {
      setLocalGoal({ ...updatedGoal, steps: updatedGoal.steps ? [...updatedGoal.steps] : undefined });
    }
  }, [goals, goalId]);

  if (!localGoal) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['bottom']}>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.text }]}>Goal not found</Text>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.card, borderColor: theme.border }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={[styles.backButtonText, { color: theme.text }]}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const overallProgress = localGoal.targetValue > 0 
    ? Math.min(localGoal.currentValue / localGoal.targetValue, 1) 
    : 0;

  // Helper to get unit label based on goal type
  const getUnitLabel = (type: GoalType): string => {
    switch (type) {
      case 'distance':
        return 'km';
      case 'time':
        return 'min';
      case 'sessions':
        return 'runs';
      case 'points':
      default:
        return 'pts';
    }
  };

  // Split target into decimal steps that sum exactly to total
  const splitTargetIntoSteps = (total: number, count: number): number[] => {
    if (count <= 0) return [];

    const base = total / count;
    const values = Array.from({ length: count }, () => Number(base.toFixed(1)));

    // Adjust last step for rounding error so the sum is exactly equal
    const sum = values.reduce((acc, v) => acc + v, 0);
    const diff = Number((total - sum).toFixed(1));
    values[count - 1] = Number((values[count - 1] + diff).toFixed(1));

    return values;
  };

  const getGoalIcon = (type: GoalType): string => {
    switch (type) {
      case 'distance':
        return 'straighten';
      case 'time':
        return 'timer';
      case 'sessions':
        return 'directions-run';
      case 'points':
        return 'emoji-events';
      default:
        return 'flag';
    }
  };

  const handleStepChange = (stepId: string, nextValue: number) => {
    if (!localGoal?.steps) return;

    const updatedSteps = localGoal.steps.map((step) =>
      step.id === stepId
        ? { ...step, currentValue: Number(Math.max(0, Math.min(nextValue, step.targetValue)).toFixed(1)) }
        : step
    );

    const totalCurrent = updatedSteps.reduce((sum, step) => sum + step.currentValue, 0);

    setLocalGoal({
      ...localGoal,
      currentValue: Number(totalCurrent.toFixed(1)),
      steps: updatedSteps,
    });
  };

  const handleStepLabelChange = (stepId: string, label: string) => {
    if (!localGoal?.steps) return;

    const updatedSteps = localGoal.steps.map((step) =>
      step.id === stepId ? { ...step, label } : step
    );

    setLocalGoal({
      ...localGoal,
      steps: updatedSteps,
    });
  };

  const handleTargetChange = (nextTarget: number) => {
    if (!localGoal) return;

    const count = localGoal.steps?.length ?? 0;
    let updatedSteps = localGoal.steps;

    if (count > 0 && updatedSteps) {
      const perStepValues = splitTargetIntoSteps(nextTarget, count);

      updatedSteps = updatedSteps.map((step, index) => ({
        ...step,
        targetValue: perStepValues[index],
      }));
    }

    setLocalGoal({
      ...localGoal,
      targetValue: Number(nextTarget.toFixed(1)),
      steps: updatedSteps,
    });
  };

  const handleGoalTypeChange = (nextType: GoalType) => {
    if (!localGoal) return;

    const unitLabel = getUnitLabel(nextType);

    const updatedSteps = localGoal.steps?.map((step) => ({
      ...step,
      unitLabel,
    }));

    setLocalGoal({
      ...localGoal,
      type: nextType,
      unitLabel,
      steps: updatedSteps,
    });
  };

  const handleSave = () => {
    if (!localGoal || !localGoal.title.trim() || localGoal.targetValue <= 0) {
      return;
    }

    updateGoal(localGoal);
    updateGoalProgress(localGoal.id, localGoal.currentValue);
    navigation.goBack();
  };

  const handleCancel = () => {
    navigation.goBack();
  };

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

  const sliderRange = getSliderRange(localGoal.type);

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
          {/* Header */}
          <View style={styles.header}>
            <MaterialIcons name={getGoalIcon(localGoal.type) as any} size={32} color={theme.accent} />
            <View style={styles.headerText}>
              <TextInput
                style={[styles.titleInput, { color: theme.text }]}
                value={localGoal.title}
                onChangeText={(text) => setLocalGoal({ ...localGoal, title: text })}
                placeholder="Goal title"
                placeholderTextColor={theme.mutedText}
              />
              <Text style={[styles.subtitle, { color: theme.mutedText }]}>
                {localGoal.currentValue.toFixed(1)} / {localGoal.targetValue.toFixed(1)} {localGoal.unitLabel}
              </Text>
            </View>
          </View>

          {/* Overall Progress Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Overall Progress</Text>
            <Text style={[styles.bigValue, { color: theme.text }]}>
              {localGoal.currentValue.toFixed(1)} / {localGoal.targetValue.toFixed(1)} {localGoal.unitLabel}
            </Text>
            <View style={[styles.progressBar, { backgroundColor: theme.border }]}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${overallProgress * 100}%`, backgroundColor: theme.accent },
                ]}
              />
            </View>
            <Text style={[styles.progressText, { color: theme.mutedText }]}>
              {Math.round(overallProgress * 100)}% complete
            </Text>
          </View>

          {/* Edit Goal Card */}
          <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <Text style={[styles.cardLabel, { color: theme.text }]}>Edit Goal</Text>
            
            <Text style={[styles.cardSubtitle, { color: theme.mutedText }]}>Target Value</Text>
            <Text style={[styles.bigValue, { color: theme.text, fontSize: 24 }]}>
              {localGoal.targetValue.toFixed(1)} {localGoal.unitLabel}
            </Text>
            <Slider
              style={styles.slider}
              minimumValue={sliderRange.min}
              maximumValue={sliderRange.max}
              step={0.5}
              value={localGoal.targetValue}
              onValueChange={(value) => handleTargetChange(Number(value.toFixed(1)))}
              minimumTrackTintColor={theme.accent}
              maximumTrackTintColor={theme.border}
              thumbTintColor={theme.accent}
            />
            <Text style={[styles.hintText, { color: theme.mutedText }]}>
              Drag the slider to adjust your target.
            </Text>
          </View>

          {/* Steps Section */}
          {localGoal.steps && localGoal.steps.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Steps</Text>
              {localGoal.steps.map((step, index) => {
                const stepProgress = step.targetValue > 0 
                  ? Math.min(step.currentValue / step.targetValue, 1) 
                  : 0;

                return (
                  <View
                    key={step.id}
                    style={[styles.stepCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                  >
                    {/* Row 1: Step label and progress chip */}
                    <View style={styles.stepHeader}>
                      <TextInput
                        style={[styles.stepLabelInput, { color: theme.text }]}
                        value={step.label}
                        onChangeText={(text) => handleStepLabelChange(step.id, text)}
                        placeholder={`Step ${index + 1}`}
                        placeholderTextColor={theme.mutedText}
                      />
                      <View style={[styles.progressChip, { backgroundColor: theme.accent }]}>
                        <Text style={[styles.progressChipText, { color: '#020617' }]}>
                          {Math.round(stepProgress * 100)}%
                        </Text>
                      </View>
                    </View>

                    {/* Row 2: Current / Target */}
                    <Text style={[styles.stepProgressText, { color: theme.mutedText }]}>
                      {formatStepProgressText(step.currentValue, step.targetValue, step.unitLabel)}
                    </Text>

                    {/* Row 3: Progress bar */}
                    <View style={[styles.progressBar, { backgroundColor: theme.border, marginVertical: 8 }]}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${stepProgress * 100}%`, backgroundColor: theme.accent },
                        ]}
                      />
                    </View>

                    {/* Row 4: Slider control */}
                    <Slider
                      style={styles.stepSlider}
                      minimumValue={0}
                      maximumValue={step.targetValue}
                      step={0.5}
                      value={step.currentValue}
                      onValueChange={(value) => handleStepChange(step.id, Number(value.toFixed(1)))}
                      minimumTrackTintColor={theme.accent}
                      maximumTrackTintColor={theme.border}
                      thumbTintColor={theme.accent}
                    />
                  </View>
                );
              })}
            </View>
          )}

          {/* Bottom Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: theme.card, borderColor: theme.border }]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={[styles.cancelButtonText, { color: theme.text }]}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: theme.accent },
                (!localGoal.title.trim() || localGoal.targetValue <= 0) && styles.saveButtonDisabled,
              ]}
              onPress={handleSave}
              activeOpacity={0.8}
              disabled={!localGoal.title.trim() || localGoal.targetValue <= 0}
            >
              <Text style={[styles.saveButtonText, { color: '#020617' }]}>Save Changes</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    paddingBottom: 32,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorText: {
    fontSize: 18,
    marginBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  titleInput: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    marginBottom: 8,
  },
  bigValue: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  hintText: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  stepCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  stepLabelInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  progressChip: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  progressChipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  stepProgressText: {
    fontSize: 14,
    marginBottom: 4,
  },
  stepSlider: {
    width: '100%',
    height: 40,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 999,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
  backButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    borderWidth: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

