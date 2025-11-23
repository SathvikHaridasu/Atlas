import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';
import { GoalType } from '../../types/goal';

interface GoalTypePillsProps {
  selectedType: GoalType;
  onSelect: (type: GoalType) => void;
}

const goalTypes: { type: GoalType; label: string; description: string }[] = [
  { type: 'distance', label: 'Distance', description: 'Track total kilometers you want to run.' },
  { type: 'time', label: 'Time', description: 'Track total minutes spent running.' },
  { type: 'sessions', label: 'Sessions', description: 'Track how many runs you complete.' },
  { type: 'points', label: 'Points', description: 'Track points earned from your runs.' },
];

export default function GoalTypePills({ selectedType, onSelect }: GoalTypePillsProps) {
  const { theme } = useAppTheme();

  const selectedInfo = goalTypes.find((gt) => gt.type === selectedType);

  return (
    <View>
      <View style={styles.pillsRow}>
        {goalTypes.map((gt) => {
          const isSelected = gt.type === selectedType;
          return (
            <TouchableOpacity
              key={gt.type}
              style={[
                styles.pill,
                isSelected
                  ? { backgroundColor: theme.accent }
                  : { backgroundColor: 'transparent', borderWidth: 1, borderColor: theme.border },
              ]}
              onPress={() => onSelect(gt.type)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pillText,
                  {
                    color: isSelected ? '#020617' : theme.mutedText,
                    fontWeight: isSelected ? '600' : '400',
                  },
                ]}
              >
                {gt.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      {selectedInfo && (
        <Text style={[styles.description, { color: theme.mutedText }]}>
          {selectedInfo.description}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  pillsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  pill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pillText: {
    fontSize: 14,
  },
  description: {
    fontSize: 13,
    lineHeight: 18,
  },
});

