import React, { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useAppTheme } from '../../contexts/ThemeContext';

interface SectionCardProps {
  title: string;
  children: ReactNode;
  helperText?: string;
}

export default function SectionCard({ title, children, helperText }: SectionCardProps) {
  const { theme } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
      <Text style={[styles.cardTitle, { color: theme.text }]}>{title}</Text>
      {children}
      {helperText && (
        <Text style={[styles.helperText, { color: theme.mutedText }]}>{helperText}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
    lineHeight: 16,
  },
});

