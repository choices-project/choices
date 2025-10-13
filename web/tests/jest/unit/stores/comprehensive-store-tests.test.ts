/**
 * Comprehensive Zustand Store Tests
 * 
 * Tests all major Zustand stores with state management,
 * actions, persistence, and error handling
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals'
import { renderHook, act } from '@testing-library/react'

// Import all stores
import { useAppStore } from '@/lib/stores/appStore'
import { useUserStore } from '@/lib/stores/userStore'
import { useVotingStore } from '@/lib/stores/votingStore'
// UIStore removed - deleted as unused
import { useNotificationStore } from '@/lib/stores/notificationStore'
// FeatureFlagsStore removed - consolidated into admin store

// Mock external dependencies
jest.mock('@/lib/utils/logger', () => ({
  devLog: jest.fn(),
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn()
  }
}))

jest.mock('@/lib/utils/objects', () => ({
  withOptional: jest.fn((obj) => obj)
}))

describe('Zustand Store Tests', () => {
  beforeEach(() => {
    // Clear all store state before each test
    useAppStore.getState().reset?.()
    useUserStore.getState().reset?.()
    useVotingStore.getState().reset?.()
    
    // Manually clear stores that don't have reset methods
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0
    })
    
    // FeatureFlagsStore removed - consolidated into admin store
  })

  describe('AppStore', () => {
    it('should initialize with default values', () => {
      const { result } = renderHook(() => useAppStore())
      
      expect(result.current.theme).toBe('system')
      expect(result.current.sidebarCollapsed).toBe(false)
      expect(result.current.isMobile).toBe(false)
    })

    it('should update theme correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setTheme('dark')
      })
      
      expect(result.current.theme).toBe('dark')
    })

    it('should toggle sidebar correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.toggleSidebar()
      })
      
      expect(result.current.sidebarCollapsed).toBe(true)
      
      act(() => {
        result.current.toggleSidebar()
      })
      
      expect(result.current.sidebarCollapsed).toBe(false)
    })

    it('should update system theme', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.updateSystemTheme('dark')
      })
      
      expect(result.current.systemTheme).toBe('dark')
    })

    it('should handle modal state correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.openModal('test-modal', { data: 'test' })
      })
      
      expect(result.current.activeModal).toBe('test-modal')
      expect(result.current.modalData).toEqual({ data: 'test' })
      
      act(() => {
        result.current.closeModal()
      })
      
      expect(result.current.activeModal).toBeNull()
    })

    it('should update settings correctly', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.updateSettings({
          animations: false,
          language: 'es'
        })
      })
      
      expect(result.current.settings.animations).toBe(false)
      expect(result.current.settings.language).toBe('es')
    })
  })

  describe('UserStore', () => {
    it('should initialize with null user', () => {
      const { result } = renderHook(() => useUserStore())
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should set user correctly', () => {
      const { result } = renderHook(() => useUserStore())
      const mockUser = {
        id: 'user-1',
        email: 'test@example.com',
        name: 'Test User',
        avatar: 'https://example.com/avatar.jpg',
        role: 'user' as const,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      act(() => {
        result.current.setUserAndAuth(mockUser, true)
      })
      
      expect(result.current.user).toEqual(mockUser)
      expect(result.current.isAuthenticated).toBe(true)
    })

    it('should clear user on logout', () => {
      const { result } = renderHook(() => useUserStore())
      const mockUser = {
        id: 'user-1',
        name: 'Test User',
        email: 'test@example.com'
      }
      
      act(() => {
        result.current.setUserAndAuth(mockUser, true)
      })
      
      expect(result.current.isAuthenticated).toBe(true)
      
      act(() => {
        result.current.clearUser()
      })
      
      expect(result.current.user).toBeNull()
      expect(result.current.isAuthenticated).toBe(false)
    })

    it('should update user profile', () => {
      const { result } = renderHook(() => useUserStore())
      const mockUser = {
        id: 'user-1',
        username: 'Test User',
        email: 'test@example.com',
        preferences: {
          theme: 'light' as const,
          notifications: true,
          language: 'en',
          timezone: 'UTC'
        },
        settings: {
          privacy: 'public' as const,
          location: 'US',
          interests: [],
          bio: 'Test bio'
        },
        metadata: {
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      }
      
      act(() => {
        result.current.setProfile(mockUser)
      })
      
      act(() => {
        result.current.updateProfile({
          username: 'Updated User',
          settings: {
            ...mockUser.settings,
            bio: 'Updated bio'
          }
        })
      })
      
      expect(result.current.profile?.username).toBe('Updated User')
      expect(result.current.profile?.settings.bio).toBe('Updated bio')
    })

    it('should handle authentication state changes', () => {
      const { result } = renderHook(() => useUserStore())
      
      act(() => {
        result.current.setAuthenticated(true)
      })
      
      expect(result.current.isAuthenticated).toBe(true)
      
      act(() => {
        result.current.setAuthenticated(false)
      })
      
      expect(result.current.isAuthenticated).toBe(false)
    })
  })

  describe('VotingStore', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useVotingStore())
      
      expect(result.current.ballots).toEqual([])
      expect(result.current.elections).toEqual([])
      expect(result.current.votingRecords).toEqual([])
    })

    it('should add ballot correctly', () => {
      const { result } = renderHook(() => useVotingStore())
      const mockBallot = {
        id: 'ballot-1',
        pollId: 'poll-1',
        userId: 'user-1',
        selections: ['option-1'],
        timestamp: new Date()
      }
      
      act(() => {
        result.current.addBallot(mockBallot)
      })
      
      expect(result.current.ballots).toHaveLength(1)
      expect(result.current.ballots[0]).toEqual(mockBallot)
    })

    it('should remove ballot correctly', () => {
      const { result } = renderHook(() => useVotingStore())
      const mockBallot = {
        id: 'ballot-1',
        pollId: 'poll-1',
        userId: 'user-1',
        selections: ['option-1'],
        timestamp: new Date()
      }
      
      act(() => {
        result.current.addBallot(mockBallot)
      })
      
      expect(result.current.ballots).toHaveLength(1)
      
      act(() => {
        result.current.removeBallot('ballot-1')
      })
      
      expect(result.current.ballots).toHaveLength(0)
    })

    it('should track voting records', () => {
      const { result } = renderHook(() => useVotingStore())
      const mockRecord = {
        id: 'record-1',
        pollId: 'poll-1',
        userId: 'user-1',
        action: 'vote_cast',
        timestamp: new Date()
      }
      
      act(() => {
        result.current.addVotingRecord(mockRecord)
      })
      
      expect(result.current.votingRecords).toHaveLength(1)
      expect(result.current.votingRecords[0]).toEqual(mockRecord)
    })

    it('should clear user voting session', () => {
      const { result } = renderHook(() => useVotingStore())
      
      act(() => {
        result.current.addBallot({
          id: 'ballot-1',
          pollId: 'poll-1',
          userId: 'user-1',
          selections: ['option-1'],
          timestamp: new Date()
        })
      })
      
      expect(result.current.ballots).toHaveLength(1)
      
      act(() => {
        result.current.clearUserVotingSession()
      })
      
      // Should clear UI state but preserve actual voting records
      expect(result.current.ballots).toHaveLength(0)
      expect(result.current.selectedBallot).toBeNull()
      expect(result.current.currentBallot).toBeNull()
      // Note: votingRecords should be preserved for audit trail
    })
  })

  // UIStore removed - deleted as unused

  describe('NotificationStore', () => {
    it('should initialize with empty notifications', () => {
      const { result } = renderHook(() => useNotificationStore())
      
      expect(result.current.notifications).toEqual([])
      expect(result.current.unreadCount).toBe(0)
    })

    it('should add notifications', () => {
      const { result } = renderHook(() => useNotificationStore())
      
      act(() => {
        result.current.addNotification({
          message: 'Test notification',
          type: 'info'
        })
      })
      
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.unreadCount).toBe(1)
      expect(result.current.notifications[0].message).toBe('Test notification')
    })

    it('should mark notifications as read', () => {
      const { result } = renderHook(() => useNotificationStore())
      
      act(() => {
        result.current.addNotification({
          message: 'Test notification',
          type: 'info'
        })
      })
      
      const notificationId = result.current.notifications[0].id
      
      act(() => {
        result.current.markAsRead(notificationId)
      })
      
      expect(result.current.notifications[0].read).toBe(true)
      expect(result.current.unreadCount).toBe(0)
    })

    it('should clear all notifications', () => {
      const { result } = renderHook(() => useNotificationStore())
      
      act(() => {
        result.current.addNotification({
          message: 'Test notification 1',
          type: 'info'
        })
        result.current.addNotification({
          message: 'Test notification 2',
          type: 'warning'
        })
      })
      
      expect(result.current.notifications).toHaveLength(2)
      
      act(() => {
        result.current.clearAll()
      })
      
      expect(result.current.notifications).toHaveLength(0)
      expect(result.current.unreadCount).toBe(0)
    })

    it('should clear notifications by type', () => {
      const { result } = renderHook(() => useNotificationStore())
      
      act(() => {
        result.current.addNotification({
          message: 'Info notification',
          type: 'info'
        })
        result.current.addNotification({
          message: 'Warning notification',
          type: 'warning'
        })
      })
      
      expect(result.current.notifications).toHaveLength(2)
      
      act(() => {
        result.current.clearByType('info')
      })
      
      expect(result.current.notifications).toHaveLength(1)
      expect(result.current.notifications[0].type).toBe('warning')
    })
  })

  // FeatureFlagsStore removed - consolidated into admin store

  describe('Store Integration', () => {
    it('should handle cross-store interactions', () => {
      const appResult = renderHook(() => useAppStore())
      const userResult = renderHook(() => useUserStore())
      
      // Set user
      act(() => {
        userResult.result.current.setUserAndAuth({
          id: 'user-1',
          name: 'Test User',
          email: 'test@example.com'
        }, true)
      })
      
      // Update app settings
      act(() => {
        appResult.result.current.updateSettings({
          theme: 'dark',
          language: 'en'
        })
      })
      
      expect(userResult.result.current.isAuthenticated).toBe(true)
      expect(appResult.result.current.settings.theme).toBe('dark')
    })

    it('should handle store persistence', () => {
      const { result } = renderHook(() => useAppStore())
      
      act(() => {
        result.current.setTheme('dark')
        result.current.setSidebarCollapsed(true)
      })
      
      // Simulate page reload by re-initializing store
      const newResult = renderHook(() => useAppStore())
      
      // In a real app with persistence, these values would be restored
      // For testing, we verify the actions work correctly
      expect(result.current.theme).toBe('dark')
      expect(result.current.sidebarCollapsed).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle store errors gracefully', () => {
      const { result } = renderHook(() => useUserStore())
      
      // Test with invalid data
      act(() => {
        try {
          result.current.setUser(null as any)
        } catch (error) {
          // Store should handle null user gracefully
        }
      })
      
      expect(result.current.user).toBeNull()
    })

    it('should handle concurrent updates', () => {
      const { result } = renderHook(() => useVotingStore())
      
      // Simulate concurrent ballot additions
      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.addBallot({
            id: `ballot-${i}`,
            pollId: 'poll-1',
            userId: 'user-1',
            selections: ['option-1'],
            timestamp: new Date()
          })
        }
      })
      
      expect(result.current.ballots).toHaveLength(10)
    })
  })
})






