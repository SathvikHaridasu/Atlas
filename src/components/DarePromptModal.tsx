import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export interface DarePromptModalProps {
  visible: boolean;
  value: string;
  onChangeText: (text: string) => void;
  onSkip: () => void;
  onSubmit: () => void;
  loading?: boolean;
}

/**
 * DarePromptModal
 * First-time dare prompt modal for chat sessions
 */
export const DarePromptModal: React.FC<DarePromptModalProps> = ({
  visible,
  value,
  onChangeText,
  onSkip,
  onSubmit,
  loading = false,
}) => {
  const { theme } = useAppTheme();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animations
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const handleSubmit = () => {
    if (value.trim()) {
      onSubmit();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onSkip}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Backdrop */}
        <Animated.View
          style={[
            styles.backdrop,
            {
              opacity: opacityAnim,
            },
          ]}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={onSkip}
          />
        </Animated.View>

        {/* Content Card */}
        <Animated.View
          style={[
            styles.card,
            {
              backgroundColor: theme.card,
              borderColor: theme.accent,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconContainer, { backgroundColor: `${theme.accent}20` }]}>
            <Ionicons name="rocket-outline" size={40} color={theme.accent} />
          </View>

          {/* Heading */}
          <Text style={[styles.heading, { color: theme.text }]}>
            Drop a dare for this chat 👀
          </Text>

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            What challenge do you want to throw into this room?
          </Text>

          {/* Text Input */}
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.border,
                color: theme.text,
                borderColor: theme.accent,
              },
            ]}
            placeholder="Enter your dare..."
            placeholderTextColor={theme.mutedText}
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={200}
            autoFocus
            editable={!loading}
          />

          {/* Character count */}
          <Text style={[styles.charCount, { color: theme.mutedText }]}>
            {value.length}/200
          </Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            <TouchableOpacity
              style={[styles.skipButton, { borderColor: theme.border }]}
              onPress={onSkip}
              disabled={loading}
              activeOpacity={0.7}
            >
              <Text style={[styles.skipButtonText, { color: theme.mutedText }]}>
                Skip for now
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.submitButton,
                {
                  backgroundColor: value.trim() ? theme.accent : theme.border,
                  opacity: value.trim() ? 1 : 0.5,
                },
              ]}
              onPress={handleSubmit}
              disabled={!value.trim() || loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Text style={[styles.submitButtonText, { color: value.trim() ? '#000' : theme.mutedText }]}>
                  Save Dare
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  card: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  input: {
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    minHeight: 100,
    maxHeight: 150,
    textAlignVertical: 'top',
    borderWidth: 1,
    marginBottom: 8,
  },
  charCount: {
    fontSize: 12,
    textAlign: 'right',
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  submitButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
  },
});

