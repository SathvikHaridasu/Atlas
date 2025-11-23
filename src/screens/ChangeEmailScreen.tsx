import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  bgDark: "#020202",
  textPrimaryDark: "#F9FAFB",
  textSecondaryDark: "#9CA3AF",
};

const ChangeEmailScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Change Email</Text>
          <Text style={styles.description}>
            This feature allows you to update your email address. You will need to verify your new email address before it becomes active.
          </Text>
          <Text style={styles.placeholder}>
            Email change functionality will be implemented here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgDark,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: "#101010",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(3, 202, 89, 0.4)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.textPrimaryDark,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondaryDark,
    lineHeight: 24,
    marginBottom: 16,
  },
  placeholder: {
    fontSize: 14,
    color: COLORS.textSecondaryDark,
    fontStyle: "italic",
  },
});

export default ChangeEmailScreen;

