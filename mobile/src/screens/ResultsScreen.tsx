import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../services/api';
import { Poll, Tally, CommitmentLog, RootStackParamList } from '../types';
import { LineChart, PieChart } from 'react-native-chart-kit';
import { Dimensions } from 'react-native';

type ResultsScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

const screenWidth = Dimensions.get('window').width;

export default function ResultsScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<ResultsScreenNavigationProp>();
  const route = useRoute<ResultsScreenRouteProp>();
  const { pollId } = route.params;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [tally, setTally] = useState<Tally | null>(null);
  const [commitmentLog, setCommitmentLog] = useState<CommitmentLog | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, [pollId]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch poll details, tally, and commitment log in parallel
      const [pollData, tallyData, commitmentData] = await Promise.all([
        apiService.getPoll(pollId),
        apiService.getTally(pollId),
        apiService.getCommitmentLog(pollId),
      ]);
      
      setPoll(pollData);
      setTally(tallyData);
      setCommitmentLog(commitmentData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load results');
    } finally {
      setLoading(false);
    }
  };

  const getTotalVotes = () => {
    if (!tally) return 0;
    return Object.values(tally).reduce((sum, count) => sum + count, 0);
  };

  const getVotePercentage = (votes: number) => {
    const total = getTotalVotes();
    if (total === 0) return 0;
    return Math.round((votes / total) * 100);
  };

  const getWinningOption = () => {
    if (!tally || !poll) return null;
    
    let maxVotes = 0;
    let winningIndex = 0;
    
    Object.entries(tally).forEach(([index, votes]) => {
      if (votes > maxVotes) {
        maxVotes = votes;
        winningIndex = parseInt(index);
      }
    });
    
    return {
      index: winningIndex,
      option: poll.options[winningIndex],
      votes: maxVotes,
      percentage: getVotePercentage(maxVotes),
    };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getChartData = () => {
    if (!tally || !poll) return [];
    
    return poll.options.map((option, index) => ({
      name: option,
      votes: tally[index] || 0,
      percentage: getVotePercentage(tally[index] || 0),
      color: `hsl(${(index * 137.5) % 360}, 70%, 60%)`,
    }));
  };

  const getPieChartData = () => {
    const chartData = getChartData();
    return chartData.map((item, index) => ({
      name: item.name,
      population: item.votes,
      color: item.color,
      legendFontColor: theme.colors.text,
      legendFontSize: 12,
    }));
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading Results...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !poll) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={64} color={theme.colors.error} />
          <Text style={[styles.errorText, { color: theme.colors.text }]}>
            {error || 'Results not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchResults}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const totalVotes = getTotalVotes();
  const winningOption = getWinningOption();
  const chartData = getChartData();
  const pieChartData = getPieChartData();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color={theme.colors.primary} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Poll Results
          </Text>
        </View>

        {/* Poll Info */}
        <View style={[styles.pollInfo, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.pollTitle, { color: theme.colors.text }]}>
            {poll.title}
          </Text>
          <Text style={[styles.pollDescription, { color: theme.colors.textSecondary }]}>
            {poll.description}
          </Text>
          
          <View style={styles.pollMeta}>
            <View style={styles.metaItem}>
              <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                Ended: {formatDate(poll.end_time)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {totalVotes} total votes
              </Text>
            </View>
          </View>
        </View>

        {/* Winner Announcement */}
        {winningOption && (
          <View style={[styles.winnerCard, { backgroundColor: theme.colors.success + '20' }]}>
            <Ionicons name="trophy" size={32} color={theme.colors.success} />
            <View style={styles.winnerContent}>
              <Text style={[styles.winnerTitle, { color: theme.colors.success }]}>
                Winner
              </Text>
              <Text style={[styles.winnerOption, { color: theme.colors.text }]}>
                {winningOption.option}
              </Text>
              <Text style={[styles.winnerStats, { color: theme.colors.textSecondary }]}>
                {winningOption.votes} votes ({winningOption.percentage}%)
              </Text>
            </View>
          </View>
        )}

        {/* Vote Breakdown */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Vote Breakdown
          </Text>
          
          {chartData.map((item, index) => (
            <View
              key={index}
              style={[styles.resultCard, { backgroundColor: theme.colors.surface }]}
            >
              <View style={styles.resultHeader}>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                  {item.name}
                </Text>
                <Text style={[styles.voteCount, { color: theme.colors.primary }]}>
                  {item.votes} votes ({item.percentage}%)
                </Text>
              </View>
              
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { 
                      backgroundColor: item.color,
                      width: `${item.percentage}%`,
                    }
                  ]}
                />
              </View>
            </View>
          ))}
        </View>

        {/* Pie Chart */}
        {pieChartData.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Vote Distribution
            </Text>
            <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
              <PieChart
                data={pieChartData}
                width={screenWidth - 80}
                height={200}
                chartConfig={{
                  backgroundColor: theme.colors.surface,
                  backgroundGradientFrom: theme.colors.surface,
                  backgroundGradientTo: theme.colors.surface,
                  color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                }}
                accessor="population"
                backgroundColor="transparent"
                paddingLeft="15"
                absolute
              />
            </View>
          </View>
        )}

        {/* Commitment Verification */}
        {commitmentLog && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Verification
            </Text>
            <View style={[styles.verificationCard, { backgroundColor: theme.colors.surface }]}>
              <View style={styles.verificationItem}>
                <Ionicons name="shield-checkmark" size={20} color={theme.colors.success} />
                <Text style={[styles.verificationText, { color: theme.colors.text }]}>
                  Merkle Root: {commitmentLog.root.substring(0, 16)}...
                </Text>
              </View>
              <View style={styles.verificationItem}>
                <Ionicons name="leaf" size={20} color={theme.colors.primary} />
                <Text style={[styles.verificationText, { color: theme.colors.text }]}>
                  Total Leaves: {commitmentLog.leaf_count}
                </Text>
              </View>
              <View style={styles.verificationItem}>
                <Ionicons name="time" size={20} color={theme.colors.secondary} />
                <Text style={[styles.verificationText, { color: theme.colors.text }]}>
                  Committed: {formatDate(commitmentLog.timestamp)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.primaryButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => navigation.navigate('Vote', { pollId })}
          >
            <Ionicons name="checkmark-circle" size={20} color="white" />
            <Text style={styles.primaryButtonText}>Vote Again</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.secondary }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="list" size={20} color={theme.colors.secondary} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.secondary }]}>
              Back to Polls
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  backButton: {
    marginRight: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  pollInfo: {
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  pollTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  pollDescription: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  pollMeta: {
    gap: 8,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 14,
    marginLeft: 8,
  },
  winnerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  winnerContent: {
    marginLeft: 16,
    flex: 1,
  },
  winnerTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  winnerOption: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  winnerStats: {
    fontSize: 14,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  resultCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  voteCount: {
    fontSize: 14,
    fontWeight: '600',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  chartContainer: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  verificationCard: {
    padding: 16,
    borderRadius: 12,
  },
  verificationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  verificationText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
