/**
 * Superior Mobile Feed Component
 * Advanced PWA features with comprehensive representative data display
 * 
 * Created: October 8, 2025
 * Updated: October 8, 2025
 */

'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
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
import EnhancedCandidateCard from './civics-2-0/EnhancedCandidateCard';
import EnhancedRepresentativeFeed from './EnhancedRepresentativeFeed';

type SuperiorMobileFeedProps = {
  userId?: string;
  className?: string;
}

export default function SuperiorMobileFeed({ userId, className = '' }: SuperiorMobileFeedProps) {
  const [activeTab, setActiveTab] = useState<'feed' | 'representatives' | 'analytics'>('feed');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userAddress, setUserAddress] = useState<string>('');
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  // Load feed items
  const loadFeedItems = useCallback(async (pageNumber?: number) => {
    const currentPage = pageNumber || page;
    setIsLoading(true);
    try {
      // Simulate loading feed items
      const newItems = Array.from({ length: 10 }, (_, i) => ({
        id: `item-${currentPage}-${i}`,
        title: `Feed Item ${currentPage}-${i}`,
        content: `This is feed item ${currentPage}-${i}`,
        timestamp: new Date(),
      }));
      setFeedItems(prev => pageNumber === 1 ? newItems : [...prev, ...newItems]);
      setHasMore(newItems.length === 10);
      if (pageNumber) setPage(pageNumber);
    } catch (error) {
      console.error('Error loading feed items:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page]);
  const [isOnline, setIsOnline] = useState(true);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedRepresentative, setSelectedRepresentative] = useState<any | null>(null);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  
  const scrollToTopRef = useRef<HTMLButtonElement>(null);

  // Initialize superior PWA features - moved after function declarations

  const initializeSuperiorPWAFeatures = async () => {
    // Check if app is installed
    if ('serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.ready;
        setSwRegistration(registration);
        console.log('Service Worker ready:', registration);
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
    
    loadFeedItems(1);
  }, [loadFeedItems]);

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
        console.log('Service Worker registered:', registration);
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
      
      console.log('Push subscription successful');
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
        console.log('Offline data synced successfully');
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
      const data = await response.json();
      if (data.success) {
        setAnalyticsData(data.analytics);
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
    setFeedItems([]);
    setHasMore(true);
    await loadFeedItems(1);
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
    console.log(`Contact ${type}: ${value}`);
    // Implement contact functionality
  };

  const handleShare = (representative: any) => {
    console.log('Share representative:', representative.name);
    // Implement share functionality
  };

  const handleBookmark = (representative: any) => {
    console.log('Bookmark representative:', representative.name);
    // Implement bookmark functionality
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

  // Initialize superior PWA features
  useEffect(() => {
    initializeSuperiorPWAFeatures();
    loadUserPreferences();
    checkOnlineStatus();
    requestNotificationPermission();
    registerServiceWorker();
    loadAnalyticsData();
  }, [checkOnlineStatus, loadUserPreferences, requestNotificationPermission]);

  const renderContent = () => {
    switch (activeTab) {
      case 'feed':
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Civic Activity Feed</h3>
                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <AdjustmentsHorizontalIcon className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                Your personalized feed of civic activities and representative updates
              </p>
              
              {/* Advanced Filters */}
              {showAdvancedFilters && (
                <div className="mb-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
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
              <div className="space-y-3">
                {feedItems.map((item) => (
                  <div key={item.id} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                    <h4 className="font-medium text-gray-900 dark:text-white">{item.title}</h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{item.content}</p>
                    <div className="flex items-center justify-between mt-3">
                      <span className="text-xs text-gray-500">{item.timestamp.toLocaleString()}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleBookmark(item)}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <BookmarkIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleShare(item)}
                          className="p-1 text-gray-400 hover:text-green-500 transition-colors"
                        >
                          <ShareIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Load More Button */}
                {hasMore && (
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoading}
                    className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                  >
                    {isLoading ? 'Loading...' : 'Load More'}
                  </button>
                )}
                
                {/* Refresh Button */}
                <button
                  onClick={handleRefresh}
                  className="w-full py-2 px-4 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                >
                  Refresh Feed
                </button>
              </div>
            </div>
          </div>
        );
      case 'representatives':
        return (
          <EnhancedRepresentativeFeed
            userId={userId || ''}
            showHeader={true}
            maxItems={20}
            onRepresentativeClick={handleRepresentativeClick}
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
      default:
        return (
          <div className="space-y-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Welcome to Choices</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Your comprehensive civic engagement platform
              </p>
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
          onClick={() => setSidebarOpen(true)} 
          data-testid="hamburger-menu"
          className="p-2 rounded-md text-gray-700 dark:text-gray-300"
        >
          <Bars3Icon className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">Choices</h1>
        <div className="flex items-center space-x-2">
          <button 
            onClick={toggleDarkMode}
            data-testid="theme-toggle"
            className="p-2 rounded-md text-gray-700 dark:text-gray-300"
          >
            {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
          </button>
          <button className="p-2 rounded-md text-gray-700 dark:text-gray-300">
            <BellIcon className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Status Bar */}
      <div className="bg-blue-50 dark:bg-blue-900 border-b border-gray-200 dark:border-gray-700 p-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1">
              {isOnline ? (
                <WifiIcon className="w-4 h-4 text-green-500" />
              ) : (
                <SignalSlashIcon className="w-4 h-4 text-red-500" />
              )}
              <span className={isOnline ? 'text-green-600' : 'text-red-600'}>
                {isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            {!isOnline && (
              <div data-testid="offline-indicator" className="flex items-center space-x-1">
                <SignalSlashIcon className="w-4 h-4 text-red-500" />
                <span className="text-red-600">Offline</span>
              </div>
            )}
            {isOnline && (
              <div data-testid="online-indicator" className="flex items-center space-x-1">
                <WifiIcon className="w-4 h-4 text-green-500" />
                <span className="text-green-600">Online</span>
              </div>
            )}
            {syncStatus === 'syncing' && (
              <div data-testid="sync-indicator" className="flex items-center space-x-1">
                <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
                <span className="text-blue-600">Syncing...</span>
              </div>
            )}
            {isLoading && (
              <div data-testid="refresh-indicator" className="flex items-center space-x-1">
                <ArrowPathIcon className="w-4 h-4 text-blue-500 animate-spin" />
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
        <div className="flex">
          {[
            { id: 'feed', name: 'Feed', icon: HomeIcon },
            { id: 'representatives', name: 'Representatives', icon: UserGroupIcon },
            { id: 'analytics', name: 'Analytics', icon: ChartBarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sidebar for Mobile */}
      <div className={`fixed inset-0 bg-gray-800 bg-opacity-75 z-40 md:hidden ${sidebarOpen ? 'block' : 'hidden'}`} 
           onClick={() => setSidebarOpen(false)}></div>
      <div data-testid="mobile-nav" className={`fixed inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg z-50 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:hidden transition-transform duration-300 ease-in-out`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Navigation</h2>
          <button 
            onClick={() => setSidebarOpen(false)} 
            className="p-2 rounded-md text-gray-700 dark:text-gray-300"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>
        <nav className="mt-5 space-y-1 px-2">
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
            >
              {item.icon}
              <span className="ml-3">{item.name}</span>
            </a>
          ))}
        </nav>
        
        {/* User Address Input */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700 px-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Your Location</h3>
          <input
            type="text"
            placeholder="Enter your address"
            value={userAddress}
            onChange={(e) => setUserAddress(e.target.value)}
            onBlur={() => localStorage.setItem('userAddress', userAddress)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          {userAddress && (
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Representatives for: <span className="font-medium">{userAddress}</span>
            </p>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      <div data-testid="feed-container" role="main" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderContent()}
      </div>

      {/* Selected Representative Modal */}
      {selectedRepresentative && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Representative Details</h3>
              <button
                onClick={() => setSelectedRepresentative(null)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <EnhancedCandidateCard
                representative={selectedRepresentative}
                onContact={handleContact}
                onShare={handleShare}
                className="w-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top Button */}
      <button
        ref={scrollToTopRef}
        onClick={scrollToTop}
        className="fixed bottom-20 right-4 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-30"
        aria-label="Scroll to top"
      >
        <ChevronUpIcon className="w-6 h-6" />
      </button>
    </div>
  );
}
