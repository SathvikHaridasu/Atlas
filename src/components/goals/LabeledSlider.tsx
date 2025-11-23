import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Slider from '@react-native-community/slider';
import { useAppTheme } from '../../contexts/ThemeContext';

interface LabeledSliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number) => void;
  formatValue: (value: number) => string;
  onTapToEdit?: () => void;
  helperText?: string;
}

export default function LabeledSlider({
  label,
  value,
  min,
  max,
  step,
  onValueChange,
  formatValue,
  onTapToEdit,
  helperText,
}: LabeledSliderProps) {
  const { theme } = useAppTheme();

  return (
    <View>
      <Text style={[styles.label, { color: theme.text }]}>{label}</Text>
      <View style={styles.valueContainer}>
        <Text style={[styles.valueText, { color: theme.text }]}>{formatValue(value)}</Text>
        {onTapToEdit && (
          <TouchableOpacity onPress={onTapToEdit} activeOpacity={0.7}>
            <Text style={[styles.tapToEdit, { color: theme.accent }]}>
              Tap number to type exact value
            </Text>
          </TouchableOpacity>
        )}
      </View>
      <Slider
        style={styles.slider}
        value={value}
        minimumValue={min}
        maximumValue={max}
        step={step}
        onValueChange={onValueChange}
        minimumTrackTintColor={theme.accent}
        maximumTrackTintColor={theme.border}
        thumbTintColor={theme.accent}
      />
      {helperText && (
        <Text style={[styles.helperText, { color: theme.mutedText }]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  valueContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  valueText: {
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
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
});

