import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GoalType } from '../../types/goal';

interface StepRowPreviewProps {
  stepName: string;
  stepTarget: number;
  goalType: GoalType;
  onNameChange: (name: string) => void;
}

export default function StepRowPreview({
  stepName,
  stepTarget,
  goalType,
  onNameChange,
}: StepRowPreviewProps) {
  const { theme } = useAppTheme();

  const formatStepTarget = (value: number, type: GoalType): string => {
    switch (type) {
      case 'distance':
        return `${value.toFixed(1)} km`;
      case 'time':
        return `${value} min`;
      case 'sessions':
        return `${value} runs`;
      case 'points':
        return `${value.toLocaleString()} pts`;
      default:
        return `${value}`;
    }
  };

  return (
    <View style={styles.row}>
      <TextInput
        style={[styles.stepNameInput, { color: theme.text, borderColor: theme.border }]}
        value={stepName}
        onChangeText={onNameChange}
        placeholder="Step name"
        placeholderTextColor={theme.mutedText}
        maxLength={30}
      />
      <Text style={[styles.stepTarget, { color: theme.mutedText }]}>
        0 / {formatStepTarget(stepTarget, goalType)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  stepNameInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  stepTarget: {
    fontSize: 13,
    minWidth: 80,
    textAlign: 'right',
  },
});

