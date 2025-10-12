/**
 * Zustand Store Usage Examples
 * 
 * Example components demonstrating how to use the new Zustand stores
 * in your React components. Shows best practices and common patterns.
 * 
 * Created: October 10, 2025
 * Status: ✅ ACTIVE
 */

import React from 'react';

import {
  // Store hooks
  useUser,
  useIsAuthenticated,
  useUserProfile,
  useTheme,
  useSidebarCollapsed,
  useSidebarWidth,
  useNotifications,
  useUnreadCount,
  
  // Store actions
  useUserActions,
  useAppActions,
  useNotificationActions,
  
  // Store utilities
  useStoreHooks,
  useStoreActions,
  
  // Notification utilities
  notificationStoreUtils,
} from '../index';

// ============================================================================
// Example 1: Basic Store Usage
// ============================================================================

export function BasicStoreExample() {
  // Use individual selectors for optimized re-renders
  const user = useUser();
  const isAuthenticated = useIsAuthenticated();
  const theme = useTheme();
  const sidebarCollapsed = useSidebarCollapsed();
  
  return (
    <div className="p-4">
      <h2>Basic Store Usage</h2>
      <p>User: {user?.email || 'Not logged in'}</p>
      <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
      <p>Theme: {theme}</p>
      <p>Sidebar: {sidebarCollapsed ? 'Collapsed' : 'Expanded'}</p>
    </div>
  );
}

// ============================================================================
// Example 2: Using Store Actions
// ============================================================================

export function StoreActionsExample() {
  const appActions = useAppActions();
  const notificationActions = useNotificationActions();
  
  const handleToggleTheme = () => {
    appActions.toggleTheme();
  };
  
  const handleToggleSidebar = () => {
    appActions.toggleSidebar();
  };
  
  const handleAddNotification = () => {
    notificationActions.addNotification({
      type: 'info',
      title: 'Example Notification',
      message: 'This is a test notification from the store example.',
      duration: 3000,
    });
  };
  
  return (
    <div className="p-4 space-y-4">
      <h2>Store Actions Example</h2>
      
      <div className="space-x-2">
        <button 
          onClick={handleToggleTheme}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Toggle Theme
        </button>
        
        <button 
          onClick={handleToggleSidebar}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Toggle Sidebar
        </button>
        
        <button 
          onClick={handleAddNotification}
          className="px-4 py-2 bg-purple-500 text-white rounded"
        >
          Add Notification
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 3: Combined Store Hooks
// ============================================================================

export function CombinedStoreExample() {
  // Use combined hooks for multiple store values
  const { user, isAuthenticated, theme, sidebarCollapsed, notifications, unreadCount } = useStoreHooks();
  const { app: _appActions } = useStoreActions();
  
  return (
    <div className="p-4">
      <h2>Combined Store Example</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3>User State</h3>
          <p>Authenticated: {isAuthenticated ? 'Yes' : 'No'}</p>
          <p>Email: {user?.email || 'Not logged in'}</p>
        </div>
        
        <div>
          <h3>App State</h3>
          <p>Theme: {theme}</p>
          <p>Sidebar: {sidebarCollapsed ? 'Collapsed' : 'Expanded'}</p>
        </div>
        
        <div>
          <h3>Notifications</h3>
          <p>Total: {notifications.length}</p>
          <p>Unread: {unreadCount}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 4: Notification System
// ============================================================================

export function NotificationExample() {
  const notifications = useNotifications();
  const unreadCount = useUnreadCount();
  const notificationActions = useNotificationActions();
  
  const handleAddSuccess = () => {
    notificationStoreUtils.createSuccess(
      'Success!',
      'Operation completed successfully.',
      3000
    );
  };
  
  const handleAddError = () => {
    notificationStoreUtils.createError(
      'Error!',
      'Something went wrong.',
      0 // Don't auto-dismiss errors
    );
  };
  
  const handleAddWarning = () => {
    notificationStoreUtils.createWarning(
      'Warning!',
      'Please check your input.',
      5000
    );
  };
  
  const handleAddInfo = () => {
    notificationStoreUtils.createInfo(
      'Info',
      'Here is some useful information.',
      3000
    );
  };
  
  const handleMarkAllRead = () => {
    notificationActions.markAllAsRead();
  };
  
  const handleClearAll = () => {
    notificationActions.clearAll();
  };
  
  return (
    <div className="p-4">
      <h2>Notification System Example</h2>
      
      <div className="mb-4">
        <p>Total Notifications: {notifications.length}</p>
        <p>Unread Count: {unreadCount}</p>
      </div>
      
      <div className="space-x-2 mb-4">
        <button 
          onClick={handleAddSuccess}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Add Success
        </button>
        
        <button 
          onClick={handleAddError}
          className="px-4 py-2 bg-red-500 text-white rounded"
        >
          Add Error
        </button>
        
        <button 
          onClick={handleAddWarning}
          className="px-4 py-2 bg-yellow-500 text-white rounded"
        >
          Add Warning
        </button>
        
        <button 
          onClick={handleAddInfo}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Add Info
        </button>
      </div>
      
      <div className="space-x-2">
        <button 
          onClick={handleMarkAllRead}
          className="px-4 py-2 bg-gray-500 text-white rounded"
        >
          Mark All Read
        </button>
        
        <button 
          onClick={handleClearAll}
          className="px-4 py-2 bg-gray-700 text-white rounded"
        >
          Clear All
        </button>
      </div>
      
      <div className="mt-4">
        <h3>Notifications:</h3>
        <div className="space-y-2">
          {notifications.map((notification) => (
            <div 
              key={notification.id}
              className={`p-3 rounded border-l-4 ${
                notification.type === 'success' ? 'bg-green-50 border-green-500' :
                notification.type === 'error' ? 'bg-red-50 border-red-500' :
                notification.type === 'warning' ? 'bg-yellow-50 border-yellow-500' :
                'bg-blue-50 border-blue-500'
              }`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold">{notification.title}</h4>
                  <p className="text-sm text-gray-600">{notification.message}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex space-x-2">
                  {!notification.read && (
                    <button
                      onClick={() => notificationActions.markAsRead(notification.id)}
                      className="text-xs bg-blue-500 text-white px-2 py-1 rounded"
                    >
                      Mark Read
                    </button>
                  )}
                  <button
                    onClick={() => notificationActions.removeNotification(notification.id)}
                    className="text-xs bg-red-500 text-white px-2 py-1 rounded"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Example 5: User Profile Management
// ============================================================================

export function UserProfileExample() {
  const user = useUser();
  const profile = useUserProfile();
  const userActions = useUserActions();
  
  const handleUpdatePreferences = () => {
    userActions.updatePreferences({
      theme: 'dark',
      notifications: true,
      language: 'en',
    });
  };
  
  const handleUpdateSettings = () => {
    userActions.updateSettings({
      privacy: 'private',
      location: 'US',
      interests: ['politics', 'technology'],
    });
  };
  
  if (!user) {
    return (
      <div className="p-4">
        <h2>User Profile Example</h2>
        <p>Please log in to view your profile.</p>
      </div>
    );
  }
  
  return (
    <div className="p-4">
      <h2>User Profile Example</h2>
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <h3>User Info</h3>
          <p>Email: {user.email}</p>
          <p>ID: {user.id}</p>
          <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
        </div>
        
        <div>
          <h3>Profile</h3>
          {profile ? (
            <>
              <p>Username: {profile.username}</p>
              <p>Theme: {profile.preferences.theme}</p>
              <p>Notifications: {profile.preferences.notifications ? 'Enabled' : 'Disabled'}</p>
              <p>Privacy: {profile.settings.privacy}</p>
            </>
          ) : (
            <p>No profile loaded</p>
          )}
        </div>
      </div>
      
      <div className="mt-4 space-x-2">
        <button 
          onClick={handleUpdatePreferences}
          className="px-4 py-2 bg-blue-500 text-white rounded"
        >
          Update Preferences
        </button>
        
        <button 
          onClick={handleUpdateSettings}
          className="px-4 py-2 bg-green-500 text-white rounded"
        >
          Update Settings
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// Example 6: App Settings Management
// ============================================================================

export function AppSettingsExample() {
  const theme = useTheme();
  const sidebarCollapsed = useSidebarCollapsed();
  const sidebarWidth = useSidebarWidth();
  const appActions = useAppActions();
  
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    appActions.setTheme(newTheme);
  };
  
  const handleSidebarWidthChange = (width: number) => {
    appActions.setSidebarWidth(width);
  };
  
  return (
    <div className="p-4">
      <h2>App Settings Example</h2>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Theme:</label>
          <select 
            value={theme} 
            onChange={(e) => handleThemeChange(e.target.value as 'light' | 'dark' | 'system')}
            className="border rounded px-3 py-2"
          >
            <option value="light">Light</option>
            <option value="dark">Dark</option>
            <option value="system">System</option>
          </select>
        </div>
        
        <div>
          <label className="block text-sm font-medium mb-2">Sidebar Width:</label>
          <input
            type="range"
            min="200"
            max="400"
            value={sidebarWidth}
            onChange={(e) => handleSidebarWidthChange(Number(e.target.value))}
            className="w-full"
          />
          <p className="text-sm text-gray-600">{sidebarWidth}px</p>
        </div>
        
        <div>
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={sidebarCollapsed}
              onChange={() => appActions.toggleSidebar()}
              className="mr-2"
            />
            Sidebar Collapsed
          </label>
        </div>
      </div>
    </div>
  );
}
