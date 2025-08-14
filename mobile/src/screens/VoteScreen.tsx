import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { apiService } from '../services/api';
import { Poll, RootStackParamList, TokenResponse, Vote } from '../types';

type VoteScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Vote'>;
type VoteScreenRouteProp = RouteProp<RootStackParamList, 'Vote'>;

export default function VoteScreen() {
  const { theme } = useTheme();
  const navigation = useNavigation<VoteScreenNavigationProp>();
  const route = useRoute<VoteScreenRouteProp>();
  const { pollId } = route.params;

  const [poll, setPoll] = useState<Poll | null>(null);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<TokenResponse | null>(null);

  useEffect(() => {
    fetchPollDetails();
  }, [pollId]);

  const fetchPollDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const pollData = await apiService.getPoll(pollId);
      setPoll(pollData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load poll details');
    } finally {
      setLoading(false);
    }
  };

  const acquireToken = async () => {
    try {
      // For now, using a mock user ID. In a real app, this would come from authentication
      const userStableId = 'mobile-user-' + Date.now();
      const tokenData = await apiService.getToken(userStableId, pollId, 'T1');
      setToken(tokenData);
      return tokenData;
    } catch (err) {
      throw new Error('Failed to acquire voting token');
    }
  };

  const submitVote = async () => {
    if (selectedOption === null) {
      Alert.alert('Selection Required', 'Please select an option before voting.');
      return;
    }

    if (!poll) {
      Alert.alert('Error', 'Poll data not available.');
      return;
    }

    if (poll.status !== 'active') {
      Alert.alert('Poll Closed', 'This poll is no longer accepting votes.');
      return;
    }

    try {
      setSubmitting(true);

      // Acquire token if not already available
      let votingToken = token;
      if (!votingToken) {
        votingToken = await acquireToken();
      }

      // Submit the vote
      const voteData: Vote = {
        poll_id: pollId,
        token: votingToken.token,
        tag: votingToken.tag,
        choice: selectedOption,
        voted_at: new Date().toISOString(),
        merkle_leaf: '',
        merkle_proof: [],
      };
      await apiService.submitVote(voteData);

      Alert.alert(
        'Vote Submitted!',
        'Your vote has been successfully recorded. Thank you for participating!',
        [
          {
            text: 'View Results',
            onPress: () => navigation.navigate('Results', { pollId }),
          },
          {
            text: 'Back to Polls',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to submit vote';
      Alert.alert('Voting Error', errorMessage);
    } finally {
      setSubmitting(false);
    }
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

  const getTimeRemaining = () => {
    if (!poll) return '';
    const now = new Date();
    const endTime = new Date(poll.end_time);
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Poll ended';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (days > 0) return `${days}d ${hours}h remaining`;
    if (hours > 0) return `${hours}h ${minutes}m remaining`;
    return `${minutes}m remaining`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading Poll Details...
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
            {error || 'Poll not found'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: theme.colors.primary }]}
            onPress={fetchPollDetails}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
            Cast Your Vote
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
                Ends: {formatDate(poll.end_time)}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {getTimeRemaining()}
              </Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="people" size={16} color={theme.colors.textSecondary} />
              <Text style={[styles.metaText, { color: theme.colors.textSecondary }]}>
                {poll.sponsors.length} sponsors
              </Text>
            </View>
          </View>
        </View>

        {/* Voting Options */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Select Your Choice
          </Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.textSecondary }]}>
            Choose one option from the list below
          </Text>

          {poll.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionCard,
                { backgroundColor: theme.colors.surface },
                selectedOption === index && { borderColor: theme.colors.primary, borderWidth: 2 }
              ]}
              onPress={() => setSelectedOption(index)}
              disabled={poll.status !== 'active'}
            >
              <View style={styles.optionContent}>
                <View style={[
                  styles.radioButton,
                  { borderColor: theme.colors.textSecondary },
                  selectedOption === index && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                ]}>
                  {selectedOption === index && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
                <Text style={[styles.optionText, { color: theme.colors.text }]}>
                  {option}
                </Text>
              </View>
              {selectedOption === index && (
                <Ionicons name="checkmark-circle" size={24} color={theme.colors.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Warning */}
        {poll.status !== 'active' && (
          <View style={[styles.warningCard, { backgroundColor: theme.colors.warning + '20' }]}>
            <Ionicons name="warning" size={24} color={theme.colors.warning} />
            <Text style={[styles.warningText, { color: theme.colors.warning }]}>
              This poll is {poll.status} and no longer accepting votes
            </Text>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              { backgroundColor: theme.colors.primary },
              (poll.status !== 'active' || selectedOption === null || submitting) && { opacity: 0.5 }
            ]}
            onPress={submitVote}
            disabled={poll.status !== 'active' || selectedOption === null || submitting}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <Ionicons name="checkmark-circle" size={20} color="white" />
            )}
            <Text style={styles.submitButtonText}>
              {submitting ? 'Submitting Vote...' : 'Submit Vote'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.secondary }]}
            onPress={() => navigation.navigate('Results', { pollId })}
          >
            <Ionicons name="analytics" size={20} color={theme.colors.secondary} />
            <Text style={[styles.secondaryButtonText, { color: theme.colors.secondary }]}>
              View Results
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
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    marginBottom: 20,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  radioButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
  },
  warningText: {
    fontSize: 14,
    marginLeft: 12,
    flex: 1,
  },
  actions: {
    padding: 20,
    gap: 12,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  submitButtonText: {
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
