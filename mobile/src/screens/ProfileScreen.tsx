import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type ProfileScreenNavigationProp = StackNavigationProp<RootStackParamList, 'MainTabs'>;

export default function ProfileScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userTier, setUserTier] = useState('T1');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

  // Mock user data - in a real app, this would come from authentication
  const mockUser = {
    id: 'mobile-user-123',
    stable_id: 'stable-user-456',
    email: 'user@example.com',
    tier: 'T1',
    created_at: '2024-01-15T10:30:00Z',
    last_login: '2024-08-13T22:00:00Z',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: () => {
            setIsAuthenticated(false);
            // In a real app, this would clear authentication tokens
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action cannot be undone. All your data will be permanently deleted.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            // In a real app, this would delete the user account
            Alert.alert('Account Deleted', 'Your account has been deleted.');
          },
        },
      ]
    );
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'T3':
        return theme.colors.success;
      case 'T2':
        return theme.colors.primary;
      case 'T1':
        return theme.colors.secondary;
      default:
        return theme.colors.textSecondary;
    }
  };

  const getTierDescription = (tier: string) => {
    switch (tier) {
      case 'T3':
        return 'Verified Identity - Highest voting weight';
      case 'T2':
        return 'Enhanced Verification - Medium voting weight';
      case 'T1':
        return 'Basic Verification - Standard voting weight';
      default:
        return 'Unverified - Limited access';
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.colors.surface }]}>
          <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
            Profile & Settings
          </Text>
        </View>

        {/* User Profile Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            User Profile
          </Text>
          
          <View style={[styles.profileCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.profileHeader}>
              <View style={[styles.avatar, { backgroundColor: theme.colors.primary }]}>
                <Ionicons name="person" size={32} color="white" />
              </View>
              <View style={styles.profileInfo}>
                <Text style={[styles.userName, { color: theme.colors.text }]}>
                  {mockUser.email}
                </Text>
                <Text style={[styles.userId, { color: theme.colors.textSecondary }]}>
                  ID: {mockUser.stable_id}
                </Text>
              </View>
            </View>

            <View style={styles.verificationTier}>
              <View style={[styles.tierBadge, { backgroundColor: getTierColor(userTier) }]}>
                <Text style={styles.tierText}>{userTier}</Text>
              </View>
              <Text style={[styles.tierDescription, { color: theme.colors.textSecondary }]}>
                {getTierDescription(userTier)}
              </Text>
            </View>

            <View style={styles.profileStats}>
              <View style={styles.statItem}>
                <Ionicons name="calendar" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  Member since {formatDate(mockUser.created_at)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="time" size={16} color={theme.colors.textSecondary} />
                <Text style={[styles.statText, { color: theme.colors.textSecondary }]}>
                  Last login {formatDate(mockUser.last_login)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Settings Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Preferences
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="moon" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Dark Mode
                </Text>
              </View>
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: '#767577', true: theme.colors.primary + '40' }}
                thumbColor={theme.colors.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="notifications" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Push Notifications
                </Text>
              </View>
              <Switch
                value={notificationsEnabled}
                onValueChange={setNotificationsEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary + '40' }}
                thumbColor={theme.colors.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="finger-print" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Biometric Authentication
                </Text>
              </View>
              <Switch
                value={biometricEnabled}
                onValueChange={setBiometricEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary + '40' }}
                thumbColor={theme.colors.primary}
              />
            </View>

            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="refresh" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Auto-refresh Dashboard
                </Text>
              </View>
              <Switch
                value={autoRefreshEnabled}
                onValueChange={setAutoRefreshEnabled}
                trackColor={{ false: '#767577', true: theme.colors.primary + '40' }}
                thumbColor={theme.colors.primary}
              />
            </View>
          </View>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Security & Privacy
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="shield-checkmark" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Privacy Policy
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="document-text" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Terms of Service
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="lock-closed" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Change Password
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="download" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Export My Data
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Support Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Support & Feedback
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="help-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Help & FAQ
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="mail" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Contact Support
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="star" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  Rate the App
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Ionicons name="information-circle" size={20} color={theme.colors.primary} />
                <Text style={[styles.settingText, { color: theme.colors.text }]}>
                  About Choices
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Account Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Account Actions
          </Text>

          <View style={[styles.settingsCard, { backgroundColor: theme.colors.surface }]}>
            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleLogout}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="log-out" size={20} color={theme.colors.warning} />
                <Text style={[styles.settingText, { color: theme.colors.warning }]}>
                  Logout
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.settingItem}
              onPress={handleDeleteAccount}
            >
              <View style={styles.settingInfo}>
                <Ionicons name="trash" size={20} color={theme.colors.error} />
                <Text style={[styles.settingText, { color: theme.colors.error }]}>
                  Delete Account
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* App Version */}
        <View style={styles.section}>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Choices Mobile v1.0.0
          </Text>
          <Text style={[styles.versionText, { color: theme.colors.textSecondary }]}>
            Built with React Native & Expo
          </Text>
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
  header: {
    padding: 20,
    paddingTop: 10,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  profileCard: {
    padding: 16,
    borderRadius: 12,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userId: {
    fontSize: 14,
  },
  verificationTier: {
    marginBottom: 16,
  },
  tierBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginBottom: 8,
  },
  tierText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tierDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  profileStats: {
    gap: 8,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 14,
    marginLeft: 8,
  },
  settingsCard: {
    borderRadius: 12,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
  },
  versionText: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 4,
  },
});
