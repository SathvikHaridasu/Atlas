import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useMissions, useMissionActions } from '../contexts/MissionsContext';
import { useAppTheme } from '../contexts/ThemeContext';
import type { RootStackParamList } from '../navigation/RootNavigator';
import type { MissionWithTemplate, MissionParticipation } from '../lib/missions/types';

type FilterType = 'all' | 'sustainability' | 'exploration' | 'active' | 'completed';

type SideMissionsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function SideMissionsScreen() {
  const { theme } = useAppTheme();
  const navigation = useNavigation<SideMissionsScreenNavigationProp>();
  const { availableMissions, participation, loading, error, refresh } = useMissions();
  const { joinMission, setActiveMission } = useMissionActions();
  const [filter, setFilter] = useState<FilterType>('all');
  const [joiningMissionId, setJoiningMissionId] = useState<string | null>(null);

  /**
   * Filter missions based on selected filter
   */
  const filteredMissions = useMemo(() => {
    if (filter === 'all') {
      return availableMissions;
    }

    if (filter === 'sustainability' || filter === 'exploration') {
      return availableMissions.filter(
        (mission) => mission.mission_template.category === filter
      );
    }

    if (filter === 'active') {
      return availableMissions.filter((mission) => {
        const userParticipation = participation[mission.id];
        return userParticipation?.status === 'joined';
      });
    }

    if (filter === 'completed') {
      return availableMissions.filter((mission) => {
        const userParticipation = participation[mission.id];
        return userParticipation?.status === 'completed';
      });
    }

    return availableMissions;
  }, [availableMissions, participation, filter]);

  /**
   * Get mission status for display
   */
  const getMissionStatus = (missionId: string): {
    label: string;
    color: string;
  } => {
    const userParticipation = participation[missionId];
    
    if (!userParticipation) {
      return { label: 'Not started', color: theme.mutedText };
    }

    if (userParticipation.status === 'completed') {
      return { label: 'Completed', color: theme.accent };
    }

    if (userParticipation.status === 'joined') {
      return { label: 'Active', color: theme.accent };
    }

    return { label: 'Not started', color: theme.mutedText };
  };

  /**
   * Get button label and action for mission card
   */
  const getMissionButtonInfo = (mission: MissionWithTemplate) => {
    const userParticipation = participation[mission.id];

    if (!userParticipation) {
      return {
        label: 'Start Mission',
        onPress: () => handleStartMission(mission),
        disabled: false,
      };
    }

    if (userParticipation.status === 'completed') {
      return {
        label: 'View Completion',
        onPress: () => {
          Alert.alert('Mission Completed', '🎉 You already completed this mission!');
        },
        disabled: false,
      };
    }

    if (userParticipation.status === 'joined') {
      return {
        label: 'Continue Mission',
        onPress: () => handleContinueMission(mission),
        disabled: false,
      };
    }

    return {
      label: 'Start Mission',
      onPress: () => handleStartMission(mission),
      disabled: false,
    };
  };

  /**
   * Handle starting a new mission
   */
  const handleStartMission = async (mission: MissionWithTemplate) => {
    try {
      setJoiningMissionId(mission.id);
      await joinMission(mission.id);
      setActiveMission(mission);
      
      // Navigate to camera with mission ID
      navigation.navigate('Camera', {
        activeMissionInstanceId: mission.id,
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start mission';
      Alert.alert('Error', errorMessage);
    } finally {
      setJoiningMissionId(null);
    }
  };

  /**
   * Handle continuing an active mission
   */
  const handleContinueMission = (mission: MissionWithTemplate) => {
    setActiveMission(mission);
    
    // Navigate to camera with mission ID
    navigation.navigate('Camera', {
      activeMissionInstanceId: mission.id,
    });
  };

  /**
   * Render filter pill button
   */
  const renderFilterPill = (filterType: FilterType, label: string) => {
    const isSelected = filter === filterType;
    return (
      <TouchableOpacity
        style={[
          styles.filterPill,
          {
            backgroundColor: isSelected ? theme.accent : 'transparent',
            borderColor: theme.accent,
          },
        ]}
        onPress={() => setFilter(filterType)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.filterPillText,
            {
              color: isSelected ? '#000000' : theme.accent,
            },
          ]}
        >
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  /**
   * Render mission card
   */
  const renderMissionCard = ({ item: mission }: { item: MissionWithTemplate }) => {
    const status = getMissionStatus(mission.id);
    const buttonInfo = getMissionButtonInfo(mission);
    const isJoining = joiningMissionId === mission.id;
    const template = mission.mission_template;

    return (
      <View
        style={[
          styles.missionCard,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
          },
        ]}
      >
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View style={styles.cardHeaderLeft}>
            <Text style={[styles.cardTitle, { color: theme.text }]}>
              {template.title}
            </Text>
            {template.category && (
              <View
                style={[
                  styles.categoryTag,
                  {
                    backgroundColor: `${theme.accent}20`,
                    borderColor: theme.accent,
                  },
                ]}
              >
                <Text style={[styles.categoryTagText, { color: theme.accent }]}>
                  {template.category.charAt(0).toUpperCase() + template.category.slice(1)}
                </Text>
              </View>
            )}
          </View>
          <View
            style={[
              styles.statusChip,
              {
                backgroundColor: `${status.color}20`,
                borderColor: status.color,
              },
            ]}
          >
            <Text style={[styles.statusChipText, { color: status.color }]}>
              {status.label}
            </Text>
          </View>
        </View>

        {/* Description */}
        {template.description && (
          <Text style={[styles.cardDescription, { color: theme.mutedText }]}>
            {template.description}
          </Text>
        )}

        {/* Meta Info Row */}
        <View style={styles.cardMeta}>
          {template.difficulty && (
            <View style={styles.metaItem}>
              <Ionicons name="flag-outline" size={14} color={theme.mutedText} />
              <Text style={[styles.metaText, { color: theme.mutedText }]}>
                {template.difficulty}
              </Text>
            </View>
          )}
          <View style={styles.metaItem}>
            <Ionicons name="star-outline" size={14} color={theme.accent} />
            <Text style={[styles.metaText, { color: theme.accent }]}>
              +{template.points_reward} pts
            </Text>
          </View>
        </View>

        {/* Action Button */}
        <TouchableOpacity
          style={[
            styles.actionButton,
            {
              backgroundColor: theme.accent,
              opacity: buttonInfo.disabled || isJoining ? 0.6 : 1,
            },
          ]}
          onPress={buttonInfo.onPress}
          disabled={buttonInfo.disabled || isJoining}
          activeOpacity={0.8}
        >
          {isJoining ? (
            <ActivityIndicator size="small" color="#000000" />
          ) : (
            <Text style={styles.actionButtonText}>{buttonInfo.label}</Text>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Side Missions</Text>
        <Text style={[styles.subtitle, { color: theme.mutedText }]}>
          Optional challenges for sustainability & exploration.
        </Text>
      </View>

      {/* Filter Pills */}
      <View style={styles.filterContainer}>
        {renderFilterPill('all', 'All')}
        {renderFilterPill('sustainability', 'Sustainability')}
        {renderFilterPill('exploration', 'Exploration')}
        {renderFilterPill('active', 'Active')}
        {renderFilterPill('completed', 'Completed')}
      </View>

      {/* Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.accent} />
          <Text style={[styles.loadingText, { color: theme.mutedText }]}>
            Loading missions...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={theme.accent} />
          <Text style={[styles.errorText, { color: theme.text }]}>{error}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { borderColor: theme.accent }]}
            onPress={refresh}
          >
            <Text style={[styles.retryButtonText, { color: theme.accent }]}>
              Retry
            </Text>
          </TouchableOpacity>
        </View>
      ) : filteredMissions.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="flag-outline" size={48} color={theme.mutedText} />
          <Text style={[styles.emptyText, { color: theme.mutedText }]}>
            No missions found
          </Text>
          <Text style={[styles.emptySubtext, { color: theme.mutedText }]}>
            Try selecting a different filter
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredMissions}
          keyExtractor={(item) => item.id}
          renderItem={renderMissionCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 8,
    flexWrap: 'wrap',
  },
  filterPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  filterPillText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  missionCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 12,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  categoryTag: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaText: {
    fontSize: 13,
    fontWeight: '500',
  },
  actionButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
  },
});

