import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { apiService } from '../services/api';
import { DashboardData } from '../types';

const { width } = Dimensions.get('window');

export default function DashboardScreen() {
  const { theme } = useTheme();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await apiService.getDashboardData();
      setDashboardData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading && !dashboardData) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading Dashboard...
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
            onPress={fetchDashboardData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!dashboardData) return null;

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(107, 114, 128, ${opacity})`,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '6',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const pieChartData = dashboardData.demographics.verification_tiers
    ? Object.entries(dashboardData.demographics.verification_tiers).map(([tier, count], index) => ({
        name: `Tier ${tier}`,
        population: count,
        color: ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'][index % 4],
        legendFontColor: theme.colors.text,
        legendFontSize: 12,
      }))
    : [];

  const trendData = {
    labels: dashboardData.trends.slice(-7).map(t => new Date(t.date).toLocaleDateString()),
    datasets: [
      {
        data: dashboardData.trends.slice(-7).map(t => t.votes),
        color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
        strokeWidth: 2,
      },
    ],
  };

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
          Real-Time Analytics
        </Text>
        <Text style={[styles.headerSubtitle, { color: theme.colors.textSecondary }]}>
          Live voting insights and trends
        </Text>
      </View>

      {/* Metrics Cards */}
      <View style={styles.section}>
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.primary }]}>
              <Ionicons name="list" size={24} color="white" />
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {dashboardData.overall_metrics.total_polls}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Total Polls
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.success }]}>
              <Ionicons name="checkmark-circle" size={24} color="white" />
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {dashboardData.overall_metrics.active_polls}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Active Polls
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.warning }]}>
              <Ionicons name="people" size={24} color="white" />
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {dashboardData.overall_metrics.total_votes.toLocaleString()}
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Total Votes
            </Text>
          </View>

          <View style={[styles.metricCard, { backgroundColor: theme.colors.surface }]}>
            <View style={[styles.metricIcon, { backgroundColor: theme.colors.info }]}>
              <Ionicons name="trending-up" size={24} color="white" />
            </View>
            <Text style={[styles.metricValue, { color: theme.colors.text }]}>
              {dashboardData.overall_metrics.average_participation.toFixed(1)}%
            </Text>
            <Text style={[styles.metricLabel, { color: theme.colors.textSecondary }]}>
              Participation
            </Text>
          </View>
        </View>
      </View>

      {/* Voting Trends Chart */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Voting Trends
        </Text>
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
          <LineChart
            data={trendData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>
      </View>

      {/* Demographics Chart */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Verification Tiers
        </Text>
        <View style={[styles.chartContainer, { backgroundColor: theme.colors.surface }]}>
          <PieChart
            data={pieChartData}
            width={width - 40}
            height={220}
            chartConfig={chartConfig}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>
      </View>

      {/* Active Polls */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Active Polls
        </Text>
        {dashboardData.polls.slice(0, 3).map((poll, index) => (
          <View
            key={poll.id}
            style={[styles.pollCard, { backgroundColor: theme.colors.surface }]}
          >
            <View style={styles.pollHeader}>
              <Text style={[styles.pollTitle, { color: theme.colors.text }]}>
                {poll.title}
              </Text>
              <View style={[
                styles.statusBadge,
                { backgroundColor: poll.status === 'active' ? theme.colors.success : theme.colors.warning }
              ]}>
                <Text style={styles.statusText}>
                  {poll.status}
                </Text>
              </View>
            </View>
            <Text style={[styles.pollStats, { color: theme.colors.textSecondary }]}>
              {poll.total_votes} votes • {poll.participation.toFixed(1)}% participation
            </Text>
          </View>
        ))}
      </View>

      {/* Engagement Metrics */}
      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          Engagement
        </Text>
        <View style={styles.engagementGrid}>
          <View style={[styles.engagementCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.engagementValue, { color: theme.colors.primary }]}>
              {dashboardData.engagement.active_users}
            </Text>
            <Text style={[styles.engagementLabel, { color: theme.colors.textSecondary }]}>
              Active Users
            </Text>
          </View>
          <View style={[styles.engagementCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.engagementValue, { color: theme.colors.success }]}>
              {dashboardData.engagement.new_users}
            </Text>
            <Text style={[styles.engagementLabel, { color: theme.colors.textSecondary }]}>
              New Users
            </Text>
          </View>
          <View style={[styles.engagementCard, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.engagementValue, { color: theme.colors.warning }]}>
              {dashboardData.engagement.session_duration}min
            </Text>
            <Text style={[styles.engagementLabel, { color: theme.colors.textSecondary }]}>
              Avg Session
            </Text>
          </View>
        </View>
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  metricCard: {
    width: (width - 60) / 2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    alignItems: 'center',
  },
  metricIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  chartContainer: {
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  chart: {
    borderRadius: 12,
  },
  pollCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  pollHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  pollTitle: {
    fontSize: 16,
    fontWeight: '600',
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
  pollStats: {
    fontSize: 14,
  },
  engagementGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  engagementCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  engagementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  engagementLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
});
