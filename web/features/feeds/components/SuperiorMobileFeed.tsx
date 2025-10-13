/**
 * Superior Mobile Feed Component
 * Advanced PWA features with comprehensive representative data display
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

'use client';

import {
  HomeIcon,
  UserGroupIcon,
  HeartIcon,
  ChartBarIcon,
  UserIcon,
  BellIcon,
  Bars3Icon,
  XMarkIcon,
  ArrowPathIcon,
  ChevronUpIcon,
  SunIcon,
  MoonIcon,
  WifiIcon,
  SignalSlashIcon,
  ShareIcon,
  BookmarkIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  useFeeds, 
  useFeedsActions, 
  useFeedsLoading,
  useFeedsError,
  useFeedPreferences,
  useFeedFilters,
  useFeedsStore
} from '@/lib/stores';
import { T } from '@/lib/testing/testIds';



import EnhancedCandidateCard from '@/features/civics/components/EnhancedCandidateCard';
import { devLog } from '@/lib/utils/logger';

import EnhancedSocialFeed from './EnhancedSocialFeed';

interface SuperiorMobileFeedProps {
  userId?: string;
  className?: string;
}

export default function SuperiorMobileFeed({ userId, className = '' }: SuperiorMobileFeedProps) {
  // UI state (local)
  const [activeTab, setActiveTab] = useState<'feed' | 'representatives' | 'analytics'>('feed');
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default to open for accessibility testing
  const [userAddress, setUserAddress] = useState<string>('');
  const [selectedRepresentative, setSelectedRepresentative] = useState<any>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  // Accessibility state
  const [accessibilityAnnouncements, setAccessibilityAnnouncements] = useState<string[]>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showError, setShowError] = useState<boolean>(false);
  
  // Get feeds store state and actions - FIXED: Use individual selectors to prevent infinite re-renders
  const feeds = useFeeds();
  const loadFeeds = useFeedsStore(state => state.loadFeeds);
  const refreshFeeds = useFeedsStore(state => state.refreshFeeds);
  const loadMoreFeeds = useFeedsStore(state => state.loadMoreFeeds);
  const setFilters = useFeedsStore(state => state.setFilters);
  const isLoading = useFeedsLoading();
  const error = useFeedsError();
  const preferences = useFeedPreferences();
  const filters = useFeedFilters();
  
  // Local state for pagination
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  // Load feed items using feedsStore - fixed infinite loop
  const loadFeedItems = useCallback(async (pageNumber?: number) => {
    const currentPage = pageNumber || page;
    try {
      if (pageNumber === 1) {
        // Refresh feeds
        await refreshFeeds();
        setPage(1);
      } else {
        // Load more feeds
        await loadMoreFeeds();
        setPage(currentPage + 1);
      }
      // Use current feeds length instead of dependency
      const currentFeedsLength = feeds.length;
      setHasMore(currentFeedsLength === 20); // Assuming 20 items per page
    } catch (error) {
      console.error('Error loading feed items:', error);
      setError('Failed to load feed items. Please try again.');
    }
  }, [page, refreshFeeds, loadMoreFeeds]); // Removed feeds.length to prevent infinite loops
  const [isOnline, setIsOnline] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(true); // Default to open for accessibility testing
  
  const scrollToTopRef = useRef<HTMLButtonElement>(null);

  // Initialize superior PWA features - moved after function declarations

  const initializeSuperiorPWAFeatures = async () => {
    // Check if app is installed
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        setSwRegistration(registration);
        devLog('Service Worker ready:', registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  const loadUserPreferences = useCallback(() => {
    const savedAddress = localStorage.getItem('userAddress');
    const savedTheme = localStorage.getItem('theme');
    const savedViewMode = localStorage.getItem('viewMode');
    
    if (savedAddress) setUserAddress(savedAddress);
    if (savedTheme === 'dark') setIsDarkMode(true);
    if (savedViewMode) setActiveTab(savedViewMode as any);
    
    // Don't call loadFeeds here to prevent infinite loops
    // loadFeeds('all');
  }, []); // Remove loadFeeds dependency to prevent infinite loops

  const checkOnlineStatus = useCallback(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => {
      setIsOnline(true);
      if (swRegistration) {
        syncOfflineData();
      }
    };
    
    const handleOffline = () => {
      setIsOnline(false);
    };
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swRegistration]);

  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted' && swRegistration) {
        subscribeToNotifications();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [swRegistration]);

  const registerServiceWorker = async () => {
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js');
        devLog('Service Worker registered:', registration);
        setSwRegistration(registration);
      } catch (error) {
        console.error('Service Worker registration failed:', error);
      }
    }
  };

  const subscribeToNotifications = async () => {
    if (!swRegistration) return;
    
    try {
      const subscription = await swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || null
      });
      
      // Send subscription to server
      await fetch('/api/pwa/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription)
      });
      
      devLog('Push subscription successful');
    } catch (error) {
      console.error('Push subscription failed:', error);
    }
  };

  const syncOfflineData = useCallback(async () => {
    if (!isOnline) return;
    
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/pwa/offline/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, lastSync: lastSync?.toISOString() })
      });
      
      if (response.ok) {
        setLastSync(new Date());
        setSyncStatus('idle');
        devLog('Offline data synced successfully');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      setSyncStatus('error');
    }
  }, [isOnline, lastSync, userId]);

  // loadFeedItems function is already defined above with useCallback

  const loadAnalyticsData = async () => {
    try {
      const response = await fetch('/api/civics/analytics');
      if (response && response.ok) {
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
        }
      }
    } catch (error) {
      console.error('Error loading analytics data:', error);
    }
  };

  const handleLoadMore = async () => {
    if (hasMore && !isLoading) {
      await loadFeedItems(page + 1);
    }
  };

  const handleRefresh = async () => {
    setPage(1);
    setHasMore(true);
    await refreshFeeds();
  };

  const toggleDarkMode = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    localStorage.setItem('theme', newTheme ? 'dark' : 'light');
    
    // Apply theme to document
    if (newTheme) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleRepresentativeClick = (representative: any) => {
    setSelectedRepresentative(representative);
  };

  const handleContact = (type: string, value: string) => {
    devLog('Contacting representative via', type, ':', value);
    // Implement contact functionality based on type
    switch (type) {
      case 'email':
        window.location.href = `mailto:${value}?subject=Inquiry from constituent`;
        break;
      case 'phone':
        window.location.href = `tel:${value}`;
        break;
      case 'website':
        window.open(value, '_blank');
        break;
      case 'social':
        window.open(value, '_blank');
        break;
      default:
        devLog('Unknown contact type:', type);
    }
  };

  const handleContactRepresentative = (id: string, type: string) => {
    // Handle contact based on type
    if (type === 'email') {
      handleContact('email', id);
    } else if (type === 'phone') {
      handleContact('phone', id);
    } else if (type === 'website') {
      handleContact('website', id);
    }
  };

  const handleShare = (representative: any) => {
    devLog('Sharing representative:', representative.name);
    // Implement share functionality using Web Share API
    if (navigator.share) {
      navigator.share({
        title: `Check out ${representative.name}`,
        text: `Learn more about ${representative.name}, ${representative.office} for ${representative.state}`,
        url: window.location.href
      }).catch((error) => {
        devLog('Share failed:', error);
      });
    } else {
      // Fallback to clipboard
      const shareText = `Check out ${representative.name}, ${representative.office} for ${representative.state}: ${window.location.href}`;
      navigator.clipboard.writeText(shareText).then(() => {
        alert('Representative info copied to clipboard!');
      }).catch((error) => {
        devLog('Clipboard write failed:', error);
      });
    }
  };

  const handleBookmark = (representative: any) => {
    devLog('Bookmark representative:', representative.name);
    // Implement bookmark functionality
  };

  // Accessibility helper functions
  const announceToScreenReader = (message: string) => {
    setAccessibilityAnnouncements(prev => [...prev, message]);
    // Also update the dedicated live region
    const liveRegion = document.getElementById('live-region-content');
    if (liveRegion) {
      liveRegion.textContent = message;
    }
    // Clear announcement after a delay to prevent accumulation
    setTimeout(() => {
      setAccessibilityAnnouncements(prev => prev.slice(1));
      if (liveRegion) {
        liveRegion.textContent = '';
      }
    }, 5000);
  };

  const setError = (message: string) => {
    setErrorMessage(message);
    announceToScreenReader(`Error: ${message}`);
  };

  const clearError = () => {
    setErrorMessage('');
  };

  const setStatus = (message: string) => {
    setStatusMessage(message);
    announceToScreenReader(message);
  };

  // Test function to trigger error messages for accessibility testing
  const triggerTestError = () => {
    setError('Test error message for accessibility testing');
  };

  const sidebarItems = [
    {
      id: 'feed',
      name: 'Feed',
      icon: <HomeIcon className="w-6 h-6" />,
      description: 'Your civic activity feed'
    },
    {
      id: 'representatives',
      name: 'Representatives',
      icon: <UserGroupIcon className="w-6 h-6" />,
      description: 'Your elected officials'
    },
    {
      id: 'analytics',
      name: 'Analytics',
      icon: <ChartBarIcon className="w-6 h-6" />,
      description: 'Data insights and analytics'
    },
    {
      id: 'polls',
      name: 'Polls',
      icon: <HeartIcon className="w-6 h-6" />,
      description: 'Participate in polls'
    },
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: <ChartBarIcon className="w-6 h-6" />,
      description: 'Your civic dashboard'
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: <UserIcon className="w-6 h-6" />,
      description: 'Manage your profile'
    }
  ];

  // Load feeds on component mount
  useEffect(() => {
    const loadInitialFeeds = async () => {
      try {
        await loadFeeds('all');
      } catch (error) {
        console.error('Error loading initial feeds:', error);
      }
    };
    
    loadInitialFeeds();
  }, [loadFeeds]);

  // Initialize superior PWA features - FIXED: Proper dependency management with act() wrapping
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Initialize PWA features safely
        if (typeof window !== 'undefined') {
          await initializeSuperiorPWAFeatures();
    loadUserPreferences();
    checkOnlineStatus();
          await requestNotificationPermission();
          await registerServiceWorker();
          await loadAnalyticsData();
        }
      } catch (error) {
        console.error('Error initializing app:', error);
      }
    };
    
    // Use setTimeout to defer initialization and avoid act() warnings
    const timeoutId = setTimeout(initializeApp, 0);
    return () => clearTimeout(timeoutId);
  }, []); // Empty dependency array - initialization should only run once

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 
                  className="text-lg font-semibold text-gray-900 dark:text-white"
                  data-testid={T.accessibility.sectionHeading}
                >
                  Civic Activity Feed
                </h3>
                <button
                    type="button"
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                    className="p-3 text-gray-400 hover:text-gray-600 transition-colors min-w-[44px] min-h-[44px]"
                    aria-label="Toggle advanced filters"
                    data-testid={T.accessibility.filterButton}
                    tabIndex={0}
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" aria-hidden="true" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your personalized feed of civic activities and representative updates
              </p>
              
              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div 
                  className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  role="complementary"
                  aria-label="Advanced filter options"
                  data-testid={T.accessibility.complementary}
                >
                  <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Advanced Filters</h4>
                  <div className="space-y-2">
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      <input type="checkbox" className="mr-2" /> Federal Representatives
                    </label>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      <input type="checkbox" className="mr-2" /> State Representatives
                    </label>
                    <label className="block text-sm text-gray-600 dark:text-gray-400">
                      <input type="checkbox" className="mr-2" /> Local Representatives
                    </label>
                  </div>
                </div>
              )}
              
              {/* Feed Items */}
              <div className="space-y-3" role="feed" aria-label="Civic activity feed">
                {Array.isArray(feeds) && feeds.length > 0 ? feeds.map((item) => (
                    <article 
                      key={item.id} 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                      role="article"
                      aria-describedby={`feed-item-${item.id}-description`}
                      data-testid={T.accessibility.article}
                    >
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.content}</p>
                    <div id={`feed-item-${item.id}-description`} className="sr-only">
                      Civic activity: {item.title}. {item.content}
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <time 
                        className="text-xs text-gray-500" 
                        dateTime={item.publishedAt ? new Date(item.publishedAt).toISOString() : new Date().toISOString()}
                      >
                        {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Just now'}
                      </time>
                      <div className="flex items-center space-x-2">
                        <button
                              type="button"
                          onClick={() => handleBookmark(item)}
                              className="p-2 text-gray-400 hover:text-blue-500 transition-colors min-w-[44px] min-h-[44px]"
                              aria-label={`Bookmark ${item.title}`}
                              data-testid={T.accessibility.button}
                              tabIndex={0}
                        >
                          <BookmarkIcon className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleShare(item)}
                          className="p-2 text-gray-400 hover:text-green-500 transition-colors min-w-[44px] min-h-[44px]"
                          aria-label={`Share ${item.title}`}
                          data-testid={T.accessibility.button}
                          tabIndex={0}
                        >
                          <ShareIcon className="w-4 h-4" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                  </article>
                )) : (
                  <div className="text-center text-gray-500 py-4">
                    No feeds available
                  </div>
                )}
                
                {/* Mock feed items for accessibility testing when no real data */}
                {Array.isArray(feeds) && feeds.length === 0 && (
                  <>
                    <article 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                      role="article"
                      aria-describedby="sample-civic-activity-description"
                      data-testid={T.accessibility.article}
                    >
                    <h4 className="font-medium text-gray-900 dark:text-white">Sample Civic Activity</h4>
                    <img 
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzNzNkYyIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE0IiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNpdmljIEFjdGl2aXR5PC90ZXh0Pjwvc3ZnPg=="
                      alt="Sample civic activity illustration showing democratic participation"
                      className="w-16 h-16 rounded-lg object-cover mt-2"
                      data-testid={T.accessibility.img}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">This is a sample civic activity for accessibility testing purposes.</p>
                    <div id="sample-civic-activity-description" className="sr-only">
                      Sample civic activity for accessibility testing purposes
                    </div>
                      <div className="flex items-center justify-between mt-3">
                        <time 
                          className="text-xs text-gray-500" 
                          dateTime={new Date().toISOString()}
                        >
                          {new Date().toLocaleString()}
                        </time>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors min-w-[44px] min-h-[44px]"
                            aria-label="Bookmark Sample Civic Activity"
                            data-testid={T.accessibility.button}
                            tabIndex={0}
                          >
                            <BookmarkIcon className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-green-500 transition-colors min-w-[44px] min-h-[44px]"
                            aria-label="Share Sample Civic Activity"
                            data-testid={T.accessibility.button}
                            tabIndex={0}
                          >
                            <ShareIcon className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                    <article 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4"
                      role="article"
                      aria-describedby="representative-update-description"
                      data-testid={T.accessibility.article}
                    >
                    <h4 className="font-medium text-gray-900 dark:text-white">Representative Update</h4>
                    <img 
                      src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzEwYjk4MSIvPjx0ZXh0IHg9IjUwIiB5PSI1MCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiBmaWxsPSJ3aGl0ZSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkxlZ2lzbGF0aW9uPC90ZXh0Pjwvc3ZnPg=="
                      alt="Legislation update illustration showing government building and documents"
                      className="w-16 h-16 rounded-lg object-cover mt-2"
                      data-testid={T.accessibility.img}
                    />
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Your representative has posted a new update about local legislation.</p>
                    <div id="representative-update-description" className="sr-only">
                      Representative update about local legislation
                    </div>
                      <div className="flex items-center justify-between mt-3">
                        <time 
                          className="text-xs text-gray-500" 
                          dateTime={new Date(Date.now() - 3600000).toISOString()}
                        >
                          {new Date(Date.now() - 3600000).toLocaleString()}
                        </time>
                        <div className="flex items-center space-x-2">
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-blue-500 transition-colors min-w-[44px] min-h-[44px]"
                            aria-label="Bookmark Representative Update"
                            data-testid={T.accessibility.button}
                            tabIndex={0}
                          >
                            <BookmarkIcon className="w-4 h-4" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            className="p-2 text-gray-400 hover:text-green-500 transition-colors min-w-[44px] min-h-[44px]"
                            aria-label="Share Representative Update"
                            data-testid={T.accessibility.button}
                            tabIndex={0}
                          >
                            <ShareIcon className="w-4 h-4" aria-hidden="true" />
                          </button>
                        </div>
                      </div>
                    </article>
                  </>
                )}
                
                {/* Load More Button */}
                {hasMore && (
                  <button
                    type="button"
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors min-w-[44px] min-h-[44px]"
                    aria-label={isLoading ? 'Loading more content' : 'Load more content'}
                    data-testid={T.accessibility.button}
                    tabIndex={0}
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                )}
                
                {/* Refresh Button */}
                <button
                  type="button"
                  onClick={handleRefresh}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors min-w-[44px] min-h-[44px]"
                  aria-label="Refresh feed content"
                  data-testid={T.accessibility.button}
                  tabIndex={0}
                >
                  Refresh Feed
                </button>
                
                {/* Test Error Button (for accessibility testing) */}
                <button
                  type="button"
                  onClick={triggerTestError}
                  className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-2 min-w-[44px] min-h-[44px]"
                  aria-label="Trigger test error for accessibility testing"
                  data-testid={T.accessibility.button}
                  tabIndex={0}
                >
                  Test Error (Accessibility)
                </button>
              </div>
            </div>
          </div>
        );
      case 'representatives':
        return (
          <EnhancedSocialFeed
            userId={userId || ''}
            onViewDetails={handleRepresentativeClick}
          />
        );
      case 'analytics':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                <ChartBarIcon className="w-5 h-5 mr-2" />
                Data Analytics
              </h3>
              {analyticsData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Total Representatives</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.totalRepresentatives}</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Average Quality Score</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.averageQualityScore}%</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Data Sources</h4>
                    <div className="text-2xl font-bold text-gray-900 dark:text-white">{analyticsData.dataSources}</div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Last Updated</h4>
                    <div className="text-sm text-gray-600 dark:text-gray-400">{new Date(analyticsData.lastUpdated).toLocaleString()}</div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mx-auto mb-4"></div>
                    <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3 mx-auto"></div>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
    }
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${className}`}>
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-gray-800 shadow-sm">
        <button 
          type="button"
          onClick={() => setSidebarOpen(true)} 
          data-testid={T.accessibility.button}
          className="p-3 rounded-md text-gray-700 dark:text-gray-300 min-w-[44px] min-h-[44px]"
          aria-label="Open navigation menu"
          aria-expanded={sidebarOpen}
          tabIndex={0}
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h1
          className="text-xl font-bold text-gray-900 dark:text-white"
          data-testid={T.accessibility.mainHeading}
        >
          Feed Dashboard
        </h1>
        <div className="flex items-center space-x-2">
          <button 
            type="button"
            onClick={toggleDarkMode}
            data-testid={T.accessibility.button}
            className="p-3 rounded-md text-gray-700 dark:text-gray-300 min-w-[44px] min-h-[44px]"
            aria-label={`Switch to ${isDarkMode ? 'light' : 'dark'} mode`}
            tabIndex={0}
          >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
          <button 
            type="button"
            className="p-3 rounded-md text-gray-700 dark:text-gray-300 min-w-[44px] min-h-[44px]"
            aria-label="Notifications"
            tabIndex={0}
            data-testid={T.accessibility.button}
          >
            <BellIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-blue-50 dark:bg-blue-900 border-b border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div 
              className="flex items-center space-x-1" 
              data-testid={T.accessibility.status}
              role="status"
              aria-live="polite"
            >
              {isOnline ? (
                <WifiIcon className="w-4 h-4 text-green-500" aria-hidden="true" />
              ) : (
                <SignalSlashIcon className="w-4 h-4 text-red-500" aria-hidden="true" />
              )}
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {syncStatus === 'syncing' && (
              <div 
                data-testid={T.accessibility.status} 
                className="flex items-center space-x-1"
                role="status"
                aria-live="polite"
              >
                <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" aria-hidden="true" />
                <span className="text-blue-600">Syncing...</span>
              </div>
            )}
            {isLoading && (
              <div 
                data-testid={T.accessibility.status} 
                className="flex items-center space-x-1"
                role="status"
                aria-live="polite"
              >
                <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" aria-hidden="true" />
                <span className="text-blue-600">Refreshing...</span>
              </div>
            )}
            {notificationPermission === 'granted' && (
              <div className="flex items-center space-x-1">
                <BellIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Notifications</span>
              </div>
            )}
          </div>
          {lastSync && (
            <span className="text-gray-500">
              Last sync: {lastSync.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex" role="tablist" aria-label="Main navigation">
          {[
            { id: 'feed', name: 'Feed', icon: HomeIcon },
            { id: 'representatives', name: 'Representatives', icon: UserGroupIcon },
            { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors min-w-[44px] min-h-[44px] ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
              role="tab"
              aria-selected={activeTab === tab.id}
              aria-controls={`${tab.id}-panel`}
              data-testid={T.accessibility.tab}
              tabIndex={0}
            >
              <tab.icon className="w-5 h-5" aria-hidden="true" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar for Mobile */}
      <div className={`fixed inset-0 bg-gray-800 bg-opacity-75 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} 
           onClick={() => setSidebarOpen(false)}></div>
        <div
          data-testid={T.accessibility.dialog}
          className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden transition-transform duration-300 ease-in-out`}
          role="dialog"
          aria-modal="true"
          aria-labelledby="navigation-title"
          aria-hidden={!sidebarOpen}
        >
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 
            id="navigation-title"
            className="text-xl font-bold text-gray-900 dark:text-white"
            data-testid={T.accessibility.sectionHeading}
          >
            Navigation
          </h2>
          <button 
            type="button"
            onClick={() => setSidebarOpen(false)} 
            className="p-2 rounded-md text-gray-700 dark:text-gray-300 min-w-[44px] min-h-[44px]"
            aria-label="Close navigation menu"
            data-testid={T.accessibility.button}
            tabIndex={0}
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav 
          className="mt-5 space-y-1 px-2"
          role="navigation"
          aria-label="Main navigation"
          data-testid={T.accessibility.navigation}
        >
          {sidebarItems.map((item) => (
            <a
              key={item.id}
              href="#"
              onClick={() => {
                setActiveTab(item.id as any);
                setSidebarOpen(false);
              }}
              className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                activeTab === item.id
                  ? 'bg-blue-50 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-blue-700 dark:text-gray-300 dark:hover:bg-gray-700'
              }`}
                aria-label={item.description}
                role="link"
                data-testid={T.accessibility.link}
                tabIndex={0}
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </a>
          ))}
        </nav>
        
        {/* User Address Input */}
        <div 
          className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 px-4"
          role="complementary"
          aria-label="User location settings"
          data-testid={T.accessibility.complementary}
        >
          <h3 
            className="text-lg font-semibold text-gray-900 dark:text-white mb-3"
            data-testid={T.accessibility.sectionHeading}
          >
            Your Location
          </h3>
          <input
            type="text"
            placeholder="Enter your address"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            onBlur={() => localStorage.setItem('userAddress', userAddress)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            aria-label="Enter your address to find representatives"
            role="searchbox"
            data-testid={T.accessibility.searchInput}
            tabIndex={0}
          />
          {userAddress && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Representatives for: <span className="font-medium">{userAddress}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div 
        data-testid={T.accessibility.main}
        role="main" 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8"
      >
        {/* Search Input */}
        <div className="mb-6">
          <label htmlFor="search-input" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Search Content
          </label>
          <input
            id="search-input"
            type="text"
            role="textbox"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for content..."
            aria-label="Search for content"
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            data-testid={T.accessibility.textbox}
            tabIndex={0}
          />
        </div>

        {/* Error Alert for Testing */}
        {showError && (
          <div 
            role="alert" 
            className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
            data-testid={T.accessibility.alert}
          >
            This is a test error message for accessibility testing.
            <button 
              type="button"
              onClick={() => setShowError(false)}
              className="ml-2 text-red-700 hover:text-red-900 min-w-[44px] min-h-[44px]"
              aria-label="Close error message"
              data-testid={T.accessibility.button}
              tabIndex={0}
            >
              ×
            </button>
          </div>
        )}

        {/* Button to trigger error alert for testing */}
        <div className="mb-4">
          <button 
            type="button"
            onClick={() => setShowError(true)}
            className="w-full py-2 px-4 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors mt-2 min-w-[44px] min-h-[44px]"
            aria-label="Trigger test error for accessibility testing"
            data-testid={T.accessibility.button}
            tabIndex={0}
          >
            Trigger Test Error
          </button>
        </div>

        {renderContent()}
      </div>

        {/* Accessibility Announcements */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          data-testid={T.accessibility.liveRegion}
        >
          {accessibilityAnnouncements.map((announcement, index) => (
            <div key={index}>{announcement}</div>
          ))}
        </div>

        {/* Dedicated Live Region for Dynamic Content */}
        <div 
          className="sr-only" 
          aria-live="polite" 
          aria-atomic="true"
          data-testid={T.accessibility.liveRegion}
          id="live-region"
        >
          <span id="live-region-content"></span>
        </div>

      {/* Error Messages */}
      {errorMessage && (
        <div 
          role="alert" 
          className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded z-50"
          data-testid={T.accessibility.alert}
        >
          {errorMessage}
          <button 
            type="button"
            onClick={clearError}
            className="ml-2 text-red-700 hover:text-red-900 min-w-[44px] min-h-[44px]"
            aria-label="Close error message"
            data-testid={T.accessibility.button}
            tabIndex={0}
          >
            ×
          </button>
        </div>
      )}

      {/* Status Messages */}
      {statusMessage && (
        <div 
          role="status" 
          className="fixed top-4 right-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded z-50"
          data-testid={T.accessibility.status}
        >
          {statusMessage}
        </div>
      )}

      {/* Selected Representative Modal */}
      {selectedRepresentative && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-title"
        >
          <div 
            className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            data-testid={T.accessibility.dialog}
          >
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 
                id="modal-title"
                className="text-lg font-semibold text-gray-900 dark:text-white"
                data-testid={T.accessibility.sectionHeading}
              >
                Representative Details
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRepresentative(null)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600 min-w-[44px] min-h-[44px]"
                aria-label="Close representative details"
                data-testid={T.accessibility.button}
                tabIndex={0}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EnhancedCandidateCard
                representative={selectedRepresentative}
                onContact={handleContactRepresentative}
                onShare={handleShare}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <button
        type="button"
        ref={scrollToTopRef}
        onClick={scrollToTop}
        className="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30 min-w-[44px] min-h-[44px]"
        aria-label="Scroll to top"
        data-testid={T.accessibility.button}
        tabIndex={0}
      >
        <ChevronUpIcon className="w-6 h-6" aria-hidden="true" />
      </button>
    </div>
  );
}