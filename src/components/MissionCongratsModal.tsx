import { Ionicons } from '@expo/vector-icons';
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppTheme } from '../contexts/ThemeContext';

export interface MissionCongratsModalProps {
  visible: boolean;
  onClose: () => void;
  missionTitle?: string;
  pointsAwarded?: number; // default to 50
}

/**
 * MissionCongratsModal
 * Gen-Z style congratulations popup for completed side missions
 */
export const MissionCongratsModal: React.FC<MissionCongratsModalProps> = ({
  visible,
  onClose,
  missionTitle,
  pointsAwarded = 50,
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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
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
            onPress={onClose}
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
            <Ionicons name="trophy" size={48} color={theme.accent} />
          </View>

          {/* Heading */}
          <Text style={[styles.heading, { color: theme.text }]}>
            WOW, you just snagged {pointsAwarded} points 🤯
          </Text>

          {/* Mission Title */}
          {missionTitle && (
            <View style={styles.missionTitleContainer}>
              <Text style={[styles.missionLabel, { color: theme.mutedText }]}>
                Side mission:
              </Text>
              <Text style={[styles.missionTitle, { color: theme.accent }]}>
                {missionTitle}
              </Text>
            </View>
          )}

          {/* Subtitle */}
          <Text style={[styles.subtitle, { color: theme.mutedText }]}>
            Your leaderboard just got a glow-up. Keep stacking those points. 💪
          </Text>

          {/* Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: theme.accent }]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>Okay bet 😎</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  card: {
    width: '85%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  heading: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 32,
  },
  missionTitleContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  missionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  missionTitle: {
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
  buttonContainer: {
    width: '100%',
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#000000',
  },
});

