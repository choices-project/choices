'use client';

/**
 * Personal Dashboard Component
 * 
 * User's personal command center featuring:
 * - Personal analytics and engagement metrics
 * - Elected officials (location-based civic features)
 * - Quick actions for common tasks
 * - Recent activity timeline
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import {
  BarChart3,
  MapPin,
  Vote,
  Plus,
  Settings,
  Download,
  Clock,
  Activity,
  Award,
  Target,
  RefreshCw
} from 'lucide-react';
import React, { useState, useEffect, useCallback, lazy, Suspense } from 'react';

import { FeatureWrapper } from '@/components/shared/FeatureWrapper';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { logger } from '@/lib/utils/logger';

// Lazy load heavy components
const ElectedOfficialsSection = lazy(() => 
  import('./ElectedOfficialsSection').catch(() => ({
    default: () => <div>Loading elected officials...</div>
  }))
);

type PersonalAnalytics = {
  user_id: string;
  total_votes: number;
  total_polls_created: number;
  active_polls: number;
  total_votes_on_user_polls: number;
  recent_activity: {
    votes_last_30_days: number;
    polls_created_last_30_days: number;
  };
  participation_score: number;
  recent_votes: Array<{
    id: string;
    poll_id: string;
    created_at: string;
  }>;
  recent_polls: Array<{
    id: string;
    title: string;
    created_at: string;
    total_votes: number;
    status: string;
  }>;
}

type ElectedOfficial = {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  photo_url?: string;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
    social_media?: {
      twitter?: string;
      facebook?: string;
    };
  };
}

type PersonalDashboardProps = {
  userId?: string;
  className?: string;
}

export default function PersonalDashboard({ userId, className = '' }: PersonalDashboardProps) {
  const [analytics, setAnalytics] = useState<PersonalAnalytics | null>(null);
  const [electedOfficials, setElectedOfficials] = useState<ElectedOfficial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showElectedOfficials, setShowElectedOfficials] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showRecentActivity, setShowRecentActivity] = useState(true);
  const [showEngagementScore, setShowEngagementScore] = useState(true);
  
  // Performance monitoring state
  const [performanceMetrics, setPerformanceMetrics] = useState({
    dashboardLoadTime: 0,
    apiResponseTime: 0,
    cacheHitRate: 0,
    databaseQueryTime: 0,
    totalRequests: 0,
    slowestQuery: 'none',
    errors: 0
  });

  // Check user preferences for all dashboard elements (optimized)
  const checkUserPreferences = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'user-preferences-optimized';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache if less than 10 minutes old
        if (Date.now() - timestamp < 600000) {
          console.log('📦 Using cached preferences data');
          setShowElectedOfficials(data.showElectedOfficials || false);
          setShowQuickActions(data.showQuickActions !== false);
          setShowRecentActivity(data.showRecentActivity !== false);
          setShowEngagementScore(data.showEngagementScore !== false);
          return;
        }
      }

      console.log('🌐 Fetching optimized preferences...');
      const response = await fetch('/api/dashboard?include=preferences');
      if (response.ok) {
        const data = await response.json();
        const preferences = data.preferences || {};
        
        setShowElectedOfficials(preferences.showElectedOfficials || false);
        setShowQuickActions(preferences.showQuickActions !== false);
        setShowRecentActivity(preferences.showRecentActivity !== false);
        setShowEngagementScore(preferences.showEngagementScore !== false);
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          ...preferences,
          timestamp: Date.now()
        }));
        
        console.log('📋 User dashboard preferences loaded:', preferences);
      } else {
        // Default preferences if none set
        setShowElectedOfficials(false);
        setShowQuickActions(true);
        setShowRecentActivity(true);
        setShowEngagementScore(true);
        console.log('📋 No dashboard preferences set, using defaults');
      }
    } catch (error) {
      console.log('📋 Error checking dashboard preferences, using defaults:', error);
      setShowElectedOfficials(false);
      setShowQuickActions(true);
      setShowRecentActivity(true);
      setShowEngagementScore(true);
    }
  }, []);

  // Save user preferences
  const saveUserPreferences = useCallback(async (newPreferences: Record<string, boolean>) => {
    try {
      const response = await fetch('/api/user-preferences', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'dashboard',
          preferences: newPreferences
        }),
      });

      if (response.ok) {
        console.log('📋 User preferences saved successfully');
      } else {
        console.error('📋 Failed to save user preferences');
      }
    } catch (error) {
      console.error('📋 Error saving user preferences:', error);
    }
  }, []);

  // Load personal analytics with optimized API
  const loadPersonalAnalytics = useCallback(async () => {
    try {
      // Check cache first (simple in-memory cache)
      const cacheKey = 'user-analytics-optimized';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache if less than 5 minutes old
        if (Date.now() - timestamp < 300000) {
          console.log('📦 Using cached analytics data');
          setAnalytics(data);
          return;
        }
      }

      console.log('🌐 Fetching optimized dashboard data...');
      const startTime = Date.now();
      const response = await fetch('/api/dashboard?include=analytics,preferences');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      
      const loadTime = Date.now() - startTime;
      console.log(`⚡ Dashboard loaded in ${loadTime}ms`);
      
      setAnalytics(data.analytics);
      
      // Update performance metrics
      setPerformanceMetrics(prev => ({
        ...prev,
        dashboardLoadTime: loadTime,
        apiResponseTime: data.loadTime || loadTime,
        cacheHitRate: data.fromCache ? 100 : 0,
        totalRequests: prev.totalRequests + 1
      }));
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: data.analytics,
        timestamp: Date.now()
      }));
      
      logger.info('Personal analytics loaded', { 
        analytics: data.analytics,
        loadTime,
        fromCache: data.fromCache
      });
    } catch (error) {
      logger.error('Error loading personal analytics:', error as Error);
      setError('Failed to load personal analytics');
    }
  }, []);

  // Load elected officials with caching (background loading)
  const loadElectedOfficials = useCallback(async () => {
    try {
      // Check cache first
      const cacheKey = 'elected-officials';
      const cached = sessionStorage.getItem(cacheKey);
      if (cached) {
        const { data, timestamp } = JSON.parse(cached);
        // Use cache if less than 1 hour old (officials don't change often)
        if (Date.now() - timestamp < 3600000) {
          console.log('📦 Using cached elected officials data');
          setElectedOfficials(data);
          return;
        }
      }

      console.log('🌐 Loading elected officials...');
      // This would integrate with the civics API to get user's elected officials
      // For now, we'll show a placeholder
      const mockOfficials: ElectedOfficial[] = [
        {
          id: '1',
          name: 'John Smith',
          title: 'U.S. Representative',
          party: 'Democrat',
          district: 'CA-12',
          photo_url: '/api/placeholder/64/64',
          contact: {
            email: 'john.smith@house.gov',
            phone: '(202) 225-1234',
            website: 'https://johnsmith.house.gov',
            social_media: {
              twitter: '@RepJohnSmith',
              facebook: 'RepJohnSmith'
            }
          }
        },
        {
          id: '2',
          name: 'Jane Doe',
          title: 'State Senator',
          party: 'Republican',
          district: 'District 3',
          photo_url: '/api/placeholder/64/64',
          contact: {
            email: 'jane.doe@senate.ca.gov',
            phone: '(916) 651-4003',
            website: 'https://senate.ca.gov/doe'
          }
        }
      ];
      setElectedOfficials(mockOfficials);
      
      // Cache the result
      sessionStorage.setItem(cacheKey, JSON.stringify({
        data: mockOfficials,
        timestamp: Date.now()
      }));
      
      console.log('✅ Elected officials loaded');
            } catch (error) {
              logger.error('Error loading elected officials:', error as Error);
            }
  }, []);

  // Load dashboard data with progressive loading strategy
  useEffect(() => {
    const loadDashboardData = async () => {
      setIsLoading(true);
      
      // Phase 1: Load user preferences first
      console.log('📋 Loading user preferences...');
      await checkUserPreferences();
      
      // Phase 2: Load critical data (analytics)
      try {
        console.log('🚀 Loading critical data (analytics)...');
        await loadPersonalAnalytics();
        console.log('✅ Critical data loaded, showing dashboard');
        setIsLoading(false); // Show dashboard immediately after analytics
      } catch (error) {
        logger.error('Error loading personal analytics:', error as Error);
        setError('Failed to load personal analytics');
        setIsLoading(false);
        return; // Don't continue if critical data fails
      }
      
      // Phase 3: Load optional data only if user wants it
      if (showElectedOfficials) {
        console.log('🔄 Loading elected officials (user opted in)...');
        loadElectedOfficials().catch(error => {
          logger.error('Error loading elected officials:', error as Error);
        });
      } else {
        console.log('⏭️ Skipping elected officials (user preference)');
      }
    };

    loadDashboardData();
  }, []); // Only run once on mount - functions are stable with useCallback

  // Manual refresh function - only when user wants it
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        loadPersonalAnalytics(),
        loadElectedOfficials()
      ]);
            } catch (error) {
              logger.error('Error refreshing dashboard:', error as Error);
            } finally {
      setIsRefreshing(false);
    }
  };

  // Quick actions
  const quickActions = [
    {
      id: 'create-poll',
      label: 'Create Poll',
      icon: Plus,
      href: '/polls/create',
      description: 'Start a new poll'
    },
    {
      id: 'update-profile',
      label: 'Update Profile',
      icon: Settings,
      href: '/profile/edit',
      description: 'Edit your profile'
    },
    {
      id: 'set-location',
      label: 'Set Location',
      icon: MapPin,
      href: '/profile/preferences',
      description: 'Update your location'
    },
    {
      id: 'export-data',
      label: 'Export Data',
      icon: Download,
      href: '/profile',
      description: 'Download your data'
    }
  ];

  if (isLoading) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <Activity className="h-12 w-12 mx-auto" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Error Loading Dashboard</h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`} data-testid="personal-dashboard">
      {/* Header */}
      <div className="flex items-center justify-between" data-testid="dashboard-header">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="dashboard-title">Your Dashboard</h1>
          <p className="text-gray-600 mt-1">Your personal civic engagement hub</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
          <Badge variant="outline" className="flex items-center gap-2" data-testid="participation-score">
            <Activity className="h-4 w-4" />
            {analytics?.participation_score || 0} Engagement Score
          </Badge>
        </div>
      </div>

      {/* Main Content with Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2" data-testid="dashboard-nav">
          <TabsTrigger value="overview" data-testid="overview-tab">Overview</TabsTrigger>
          <TabsTrigger value="analytics" data-testid="analytics-tab">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Personal Analytics (2/3 width) */}
            <div className="lg:col-span-2 space-y-6">
              {/* Analytics Overview */}
              <Card data-testid="personal-analytics">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Personal Analytics
                  </CardTitle>
                  <CardDescription>
                    Your civic engagement metrics and activity
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics?.total_votes || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Votes</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics?.total_polls_created || 0}
                      </div>
                      <div className="text-sm text-gray-600">Polls Created</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {analytics?.active_polls || 0}
                      </div>
                      <div className="text-sm text-gray-600">Active Polls</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics?.total_votes_on_user_polls || 0}
                      </div>
                      <div className="text-sm text-gray-600">Poll Votes</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

          {/* Engagement Score - Only show if user wants it */}
          {showEngagementScore && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Engagement Score
                </CardTitle>
                <CardDescription>
                  Your overall civic participation level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Participation Level</span>
                    <span className="text-sm text-gray-600">
                      {analytics?.participation_score || 0}/100
                    </span>
                  </div>
                  <Progress 
                    value={analytics?.participation_score || 0} 
                    className="h-2"
                  />
                  <div className="text-xs text-gray-500">
                    Based on your voting activity, poll creation, and engagement
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Trending Polls - Always enabled through hashtag system */}
          <Card data-testid="trending-polls-section">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Trending Polls
                </CardTitle>
                <CardDescription>
                  Popular polls and topics right now
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Trending polls feature is now enabled! Check the feed for trending content.
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/feed'}
                  >
                    View Trending Feed
                  </Button>
                </div>
              </CardContent>
            </Card>
            </div>

          {/* Recent Activity - Only show if user wants it */}
          {showRecentActivity && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
                <CardDescription>
                  Your latest civic engagement actions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analytics?.recent_votes?.slice(0, 3).map((vote, index) => (
                    <div key={vote.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Vote className="h-4 w-4 text-blue-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Voted on poll</div>
                        <div className="text-xs text-gray-500">
                          {new Date(vote.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                  {analytics?.recent_polls?.slice(0, 2).map((poll, index) => (
                    <div key={poll.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <Plus className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <div className="text-sm font-medium">Created: {poll.title}</div>
                        <div className="text-xs text-gray-500">
                          {poll.total_votes} votes • {new Date(poll.created_at).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
          </div>

          {/* Quick Actions & Elected Officials (1/3 width) */}
          <div className="space-y-6">
          {/* Quick Actions - Only show if user wants it */}
          {showQuickActions && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="w-full justify-start h-auto p-3"
                      onClick={() => window.location.href = action.href}
                    >
                      <Icon className="h-4 w-4 mr-3" />
                      <div className="text-left">
                        <div className="font-medium">{action.label}</div>
                        <div className="text-xs text-gray-500">{action.description}</div>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* Elected Officials - Only show if user opted in */}
          {showElectedOfficials && (
            <Suspense fallback={<Skeleton className="h-48 w-full" />}>
              <ElectedOfficialsSection electedOfficials={electedOfficials} />
            </Suspense>
          )}

          {/* Demographic Filtering - Feature Flag Controlled */}
          <FeatureWrapper feature="DEMOGRAPHIC_FILTERING">
            <Card data-testid="personalized-content-section">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Personalized Content
                </CardTitle>
                <CardDescription>
                  Content tailored to your location and demographics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="text-sm text-gray-600">
                    Demographic filtering is now enabled! Your content will be personalized based on your location and interests.
                  </div>
                  <Button 
                    variant="outline" 
                    className="w-full"
                    onClick={() => window.location.href = '/profile'}
                  >
                    Update Your Preferences
                  </Button>
                </div>
              </CardContent>
            </Card>
          </FeatureWrapper>

          {/* Dashboard Settings - Always show for customization */}
          <Card data-testid="dashboard-settings">
            <CardHeader>
              <CardTitle className="flex items-center gap-2" data-testid="settings-title">
                <Settings className="h-5 w-5" />
                Dashboard Settings
              </CardTitle>
              <CardDescription>
                Customize what you see on your dashboard
              </CardDescription>
            </CardHeader>
            <CardContent data-testid="settings-content">
              <div className="space-y-4">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Show Quick Actions</div>
                                <div className="text-sm text-gray-600">Display quick action buttons</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={showQuickActions}
                                onChange={(e) => {
                                  const newValue = e.target.checked;
                                  setShowQuickActions(newValue);
                                  saveUserPreferences({ showQuickActions: newValue });
                                }}
                                className="rounded"
                                data-testid="show-quick-actions-toggle"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Show Elected Officials</div>
                                <div className="text-sm text-gray-600">Display your representatives</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={showElectedOfficials}
                                onChange={(e) => {
                                  const newValue = e.target.checked;
                                  setShowElectedOfficials(newValue);
                                  saveUserPreferences({ showElectedOfficials: newValue });
                                }}
                                className="rounded"
                                data-testid="show-elected-officials-toggle"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Show Recent Activity</div>
                                <div className="text-sm text-gray-600">Display your recent actions</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={showRecentActivity}
                                onChange={(e) => {
                                  const newValue = e.target.checked;
                                  setShowRecentActivity(newValue);
                                  saveUserPreferences({ showRecentActivity: newValue });
                                }}
                                className="rounded"
                                data-testid="show-recent-activity-toggle"
                              />
                            </div>
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium">Show Engagement Score</div>
                                <div className="text-sm text-gray-600">Display your participation level</div>
                              </div>
                              <input
                                type="checkbox"
                                checked={showEngagementScore}
                                onChange={(e) => {
                                  const newValue = e.target.checked;
                                  setShowEngagementScore(newValue);
                                  saveUserPreferences({ showEngagementScore: newValue });
                                }}
                                className="rounded"
                                data-testid="show-engagement-score-toggle"
                              />
                            </div>
              </div>
            </CardContent>
          </Card>
        </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Analytics Overview */}
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Detailed Analytics
                  </CardTitle>
                  <CardDescription>
                    Comprehensive analytics and insights
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center" data-testid="total-votes">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics?.total_votes || 0}
                      </div>
                      <div className="text-sm text-gray-600">Total Votes</div>
                    </div>
                <div className="text-center" data-testid="polls-created">
                  <div className="text-2xl font-bold text-green-600">
                    {analytics?.total_polls_created || 0}
                  </div>
                  <div className="text-sm text-gray-600">Polls Created</div>
                </div>
                <div className="text-center" data-testid="active-polls">
                  <div className="text-2xl font-bold text-purple-600">
                    {analytics?.active_polls || 0}
                  </div>
                  <div className="text-sm text-gray-600">Active Polls</div>
                </div>
                <div className="text-center" data-testid="votes-on-user-polls">
                  <div className="text-2xl font-bold text-orange-600">
                    {analytics?.total_votes_on_user_polls || 0}
                  </div>
                  <div className="text-sm text-gray-600">Votes on Your Polls</div>
                </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
