import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import HeaderHomeButton from '../components/HeaderHomeButton';
import { useAppTheme } from '../contexts/ThemeContext';

export default function FavoritesScreen() {
  const { theme } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      {/* Home Button */}
      <View style={styles.homeButtonContainer}>
        <HeaderHomeButton />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Ionicons name="heart" size={32} color={theme.accent} />
          <Text style={[styles.title, { color: theme.text }]}>Favorites</Text>
        </View>

        <View style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Ionicons name="heart-outline" size={48} color={theme.mutedText} style={styles.icon} />
          <Text style={[styles.cardTitle, { color: theme.text }]}>No favorites yet</Text>
          <Text style={[styles.cardText, { color: theme.mutedText }]}>
            Your saved dares and runs will appear here.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  homeButtonContainer: {
    width: '100%',
    paddingHorizontal: 16,
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginLeft: 12,
  },
  card: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  icon: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  cardText: {
    fontSize: 14,
    textAlign: 'center',
  },
});

