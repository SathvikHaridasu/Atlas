import * as Haptics from 'expo-haptics';

export const triggerTabChangeHaptic = async () => {
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch (e) {
    // silently ignore if haptics not available
  }
};

