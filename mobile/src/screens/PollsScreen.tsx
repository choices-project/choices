import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../services/api';
import { Poll, RootStackParamList } from '../types';

type PollsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function PollsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<PollsScreenNavigationProp>();
  const [polls, setPolls] = useState<Poll[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPolls = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getPolls();
      setPolls(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load polls');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPolls();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchPolls();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return theme.colors.success;
      case 'closed':
        return theme.colors.error;
      default:
        return theme.colors.warning;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  if (loading && polls.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="list" size={48} color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading Polls...
          </Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={48} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchPolls}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          Active Polls
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          {polls.filter(p => p.status === 'active').length} polls available
        </Text>
      </View>

      {/* Polls List */}
      <View style={styles.section}>
        {polls.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="list-outline" size={64} color={theme.colors.textSecondary} />
            <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
              No polls available
            </Text>
          </View>
        ) : (
          polls.map((poll) => (
            <TouchableOpacity
              key={poll.id}
              style={[styles.pollCard, { backgroundColor: theme.colors.surface }]}
              onPress={() => navigation.navigate('Vote', { pollId: poll.id })}
            >
              <View style={styles.pollHeader}>
                <Text style={[styles.pollTitle, { color: theme.colors.text }]}>
                  {poll.title}
                </Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: getStatusColor(poll.status) }
                ]}>
                  <Text style={styles.statusText}>
                    {poll.status}
                  </Text>
                </View>
              </View>

              <Text style={[styles.pollDescription, { color: theme.colors.textSecondary }]}>
                {poll.description}
              </Text>

              <View style={styles.pollOptions}>
                <Text style={[styles.optionsLabel, { color: theme.colors.textSecondary }]}>
                  Options:
                </Text>
                {poll.options.slice(0, 3).map((option, index) => (
                  <Text key={index} style={[styles.optionText, { color: theme.colors.text }]}>
                    • {option}
                  </Text>
                ))}
                {poll.options.length > 3 && (
                  <Text style={[styles.optionText, { color: theme.colors.textSecondary }]}>
                    • +{poll.options.length - 3} more options
                  </Text>
                )}
              </View>

              <View style={styles.pollFooter}>
                <View style={styles.pollInfo}>
                  <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.pollInfoText, { color: theme.colors.textSecondary }]}>
                    Ends: {formatDate(poll.end_time)}
                  </Text>
                </View>
                <View style={styles.pollInfo}>
                  <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
                  <Text style={[styles.pollInfoText, { color: theme.colors.textSecondary }]}>
                    {poll.sponsors.length} sponsors
                  </Text>
                </View>
              </View>

              <View style={styles.pollActions}>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.primary }]}
                  onPress={() => navigation.navigate('Vote', { pollId: poll.id })}
                >
                  <Ionicons name="checkmark-circle" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Vote</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, { backgroundColor: theme.colors.secondary }]}
                  onPress={() => navigation.navigate('Results', { pollId: poll.id })}
                >
                  <Ionicons name="analytics" size={16} color="white" />
                  <Text style={styles.actionButtonText}>Results</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 18,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
  },
  pollCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  pollTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  pollDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  pollOptions: {
    marginBottom: 12,
  },
  optionsLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    marginBottom: 4,
  },
  pollFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pollInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  pollInfoText: {
    fontSize: 12,
    marginLeft: 4,
  },
  pollActions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});
