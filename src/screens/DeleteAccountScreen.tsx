import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const COLORS = {
  bgDark: "#020202",
  textPrimaryDark: "#F9FAFB",
  textSecondaryDark: "#9CA3AF",
};

const DeleteAccountScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
      >
        <View style={styles.card}>
          <Text style={styles.title}>Delete Account</Text>
          <Text style={styles.description}>
            Permanently delete your account and all associated data. This action cannot be undone. All your profile information, activity history, and other data will be permanently removed.
          </Text>
          <Text style={styles.warning}>
            Warning: This action is irreversible. Please make sure you want to proceed before deleting your account.
          </Text>
          <Text style={styles.placeholder}>
            Account deletion functionality will be implemented here.
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
    borderColor: "rgba(239, 68, 68, 0.4)",
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#EF4444",
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    color: COLORS.textSecondaryDark,
    lineHeight: 24,
    marginBottom: 16,
  },
  warning: {
    fontSize: 14,
    color: "#EF4444",
    fontWeight: "600",
    marginBottom: 16,
    lineHeight: 20,
  },
  placeholder: {
    fontSize: 14,
    color: COLORS.textSecondaryDark,
    fontStyle: "italic",
  },
});

export default DeleteAccountScreen;

