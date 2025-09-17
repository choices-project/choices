'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Vote, 
  TrendingUp, 
  Activity, 
  Clock, 
  Globe,
  MapPin,
  BarChart3,
  Target,
  Award,
  Zap,
  RefreshCw
} from 'lucide-react';

type EngagementMetrics = {
  totalUsers: number;
  activeUsers: number;
  totalVotes: number;
  votesToday: number;
  participationRate: number;
  averageResponseTime: number;
  pollsCreated: number;
  pollsActive: number;
}

type GeographicData = {
  country: string;
  users: number;
  votes: number;
  percentage: number;
}

type ActivityData = {
  time: string;
  votes: number;
  users: number;
  polls: number;
}

type UserEngagementProps = {
  metrics: EngagementMetrics;
  geographicData?: GeographicData[];
  activityData?: ActivityData[];
  title?: string;
  subtitle?: string;
  showLiveUpdates?: boolean;
}

export const UserEngagement: React.FC<UserEngagementProps> = ({
  metrics,
  geographicData = [],
  activityData = [],
  title = 'Live Engagement',
  subtitle = 'Real-time participation and user activity',
  showLiveUpdates = true
}) => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Live updates effect
  useEffect(() => {
    if (showLiveUpdates) {
      const updateInterval = setInterval(() => {
        setLastUpdate(new Date());
      }, 30000); // Update every 30 seconds

      return () => clearInterval(updateInterval);
    }
  }, [showLiveUpdates]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toLocaleString();
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simulate refresh
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const getParticipationColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-blue-600';
    if (rate >= 40) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getParticipationIcon = (rate: number) => {
    if (rate >= 80) return <Award className="w-5 h-5 text-green-500" />;
    if (rate >= 60) return <TrendingUp className="w-5 h-5 text-blue-500" />;
    if (rate >= 40) return <Target className="w-5 h-5 text-yellow-500" />;
    return <Activity className="w-5 h-5 text-red-500" />;
  };

  return (
    <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-blue-600" />
              <span className="text-sm font-medium text-blue-600">LIVE</span>
            </div>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">{formatTime(currentTime)} UTC</span>
            {showLiveUpdates && (
              <div className="flex items-center gap-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>Updated: {formatTime(lastUpdate)}</span>
              </div>
            )}
          </div>
          
          <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">{subtitle}</p>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {/* Total Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mx-auto mb-4">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(metrics.totalUsers)}
            </div>
            <div className="text-sm text-gray-600 mb-2">Total Users</div>
            <div className="flex items-center justify-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              <span>+{Math.floor(Math.random() * 50) + 10} today</span>
            </div>
          </div>

          {/* Active Users */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-lg mx-auto mb-4">
              <Activity className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(metrics.activeUsers)}
            </div>
            <div className="text-sm text-gray-600 mb-2">Active Now</div>
            <div className="flex items-center justify-center gap-1 text-xs text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>Live</span>
            </div>
          </div>

          {/* Total Votes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-lg mx-auto mb-4">
              <Vote className="w-6 h-6 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-gray-900 mb-1">
              {formatNumber(metrics.totalVotes)}
            </div>
            <div className="text-sm text-gray-600 mb-2">Total Votes</div>
            <div className="flex items-center justify-center gap-1 text-xs text-purple-600">
              <Vote className="w-3 h-3" />
              <span>+{formatNumber(metrics.votesToday)} today</span>
            </div>
          </div>

          {/* Participation Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-lg mx-auto mb-4">
              {getParticipationIcon(metrics.participationRate)}
            </div>
            <div className={`text-2xl font-bold mb-1 ${getParticipationColor(metrics.participationRate)}`}>
              {metrics.participationRate}%
            </div>
            <div className="text-sm text-gray-600 mb-2">Participation</div>
            <div className="flex items-center justify-center gap-1 text-xs text-orange-600">
              <Target className="w-3 h-3" />
              <span>Target: 75%</span>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {/* Polls Created */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Polls Created</h3>
                  <p className="text-sm text-gray-600">Total polls on platform</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {metrics.pollsCreated}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${(metrics.pollsActive / metrics.pollsCreated) * 100}%` }}
                />
              </div>
              <span>{metrics.pollsActive} active</span>
            </div>
          </div>

          {/* Average Response Time */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Response Time</h3>
                  <p className="text-sm text-gray-600">Average vote processing</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {metrics.averageResponseTime}ms
            </div>
            <div className="flex items-center gap-2 text-sm text-green-600">
              <TrendingUp className="w-4 h-4" />
              <span>Fast & reliable</span>
            </div>
          </div>

          {/* Global Reach */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Globe className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Global Reach</h3>
                  <p className="text-sm text-gray-600">Countries participating</p>
                </div>
              </div>
            </div>
            <div className="text-3xl font-bold text-gray-900 mb-2">
              {geographicData.length}
            </div>
            <div className="flex items-center gap-2 text-sm text-purple-600">
              <MapPin className="w-4 h-4" />
              <span>Worldwide impact</span>
            </div>
          </div>
        </div>

        {/* Geographic Distribution */}
        {geographicData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Geographic Distribution</h3>
                <p className="text-gray-600">User participation by country</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {geographicData.slice(0, 6).map((country: any, index: any) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600">
                        {country.country.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">{country.country}</div>
                      <div className="text-sm text-gray-600">{formatNumber(country.users)} users</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">{formatNumber(country.votes)}</div>
                    <div className="text-sm text-gray-600">{country.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Activity Timeline */}
        {activityData.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Activity Timeline</h3>
                <p className="text-gray-600">Voting activity over the last 24 hours</p>
              </div>
            </div>

            <div className="grid grid-cols-6 md:grid-cols-12 gap-2">
              {activityData.map((activity: any, index: any) => (
                <div key={index} className="text-center">
                  <div className="text-xs text-gray-500 mb-1">{activity.time}</div>
                  <div 
                    className="bg-blue-500 rounded-t transition-all duration-300"
                    style={{ 
                      height: `${(activity.votes / Math.max(...activityData.map(a => a.votes))) * 60}px`,
                      minHeight: '4px'
                    }}
                  />
                  <div className="text-xs text-gray-600 mt-1">{activity.votes}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Live Activity Feed */}
        <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Live Activity</h3>
              <p className="text-gray-600">Real-time voting activity</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-green-600 font-medium">Live</span>
            </div>
          </div>

          <div className="space-y-3">
            {[
              { user: 'Sarah M.', action: 'voted on Climate Action 2024', time: '2 seconds ago' },
              { user: 'Alex K.', action: 'joined the platform', time: '5 seconds ago' },
              { user: 'Maria L.', action: 'voted on Technology Priorities', time: '12 seconds ago' },
              { user: 'David R.', action: 'created a new poll', time: '1 minute ago' },
              { user: 'Emma W.', action: 'voted on Education Reform', time: '2 minutes ago' }
            ].map((activity: any, index: any) => (
              <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-blue-600">
                    {activity.user.split(' ')[0][0]}
                  </span>
                </div>
                <div className="flex-1">
                  <span className="font-medium text-gray-900">{activity.user}</span>
                  <span className="text-gray-600"> {activity.action}</span>
                </div>
                <span className="text-sm text-gray-500">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserEngagement;
