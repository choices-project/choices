/**
 * AuthContext Tests
 * Tests meaningful authentication functionality and state management
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { AuthProvider, useAuth } from '@/contexts/AuthContext'
import { createClient } from '@supabase/supabase-js'

// Mock dependencies
jest.mock('@/lib/auth')

// Test component to access auth context
const TestComponent = () => {
  const { user, loading, signOut, refreshSession } = useAuth()
  
  return (
    <div>
      <div data-testid="user-status">
        {loading ? 'Loading...' : user ? `Logged in as ${user.email}` : 'Not logged in'}
      </div>
      <button data-testid="signout-btn" onClick={() => signOut()}>
        Sign Out
      </button>
      <button data-testid="refresh-btn" onClick={() => refreshSession()}>
        Refresh Session
      </button>
    </div>
  )
}

describe('AuthContext', () => {
  let mockSupabase: any

  beforeEach(() => {
    jest.clearAllMocks()
    
    // Get the mocked Supabase client
    mockSupabase = createClient('test-url', 'test-key')
  })

  describe('Authentication State Management', () => {
    it('initializes with loading state', () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      expect(screen.getByTestId('user-status')).toHaveTextContent('Loading...')
    })

    it('shows authenticated user when session exists', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        user_metadata: { name: 'Test User' }
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token',
            refresh_token: 'test-refresh'
          } 
        }, 
        error: null 
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com')
      })
    })

    it('shows unauthenticated state when no session', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      })
    })
  })

  describe('Sign Out Functionality', () => {
    it('handles successful sign out', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token',
            refresh_token: 'test-refresh'
          } 
        }, 
        error: null 
      })
      mockSupabase.auth.signOut.mockResolvedValue({ error: null })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com')
      })

      // Sign out
      const signOutBtn = screen.getByTestId('signout-btn')
      fireEvent.click(signOutBtn)

      // Verify sign out was called
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })

    it('handles sign out errors gracefully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token',
            refresh_token: 'test-refresh'
          } 
        }, 
        error: null 
      })
      mockSupabase.auth.signOut.mockResolvedValue({ 
        error: { message: 'Network error' } 
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com')
      })

      // Sign out
      const signOutBtn = screen.getByTestId('signout-btn')
      fireEvent.click(signOutBtn)

      // Verify sign out was called
      await waitFor(() => {
        expect(mockSupabase.auth.signOut).toHaveBeenCalled()
      })
    })
  })

  describe('Refresh Session Functionality', () => {
    it('refreshes session successfully', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com'
      }
      
      mockSupabase.auth.getSession.mockResolvedValue({
        data: { 
          session: { 
            user: mockUser,
            access_token: 'test-token',
            refresh_token: 'test-refresh'
          } 
        }, 
        error: null 
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for authenticated state
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com')
      })

      // Refresh session
      const refreshBtn = screen.getByTestId('refresh-btn')
      fireEvent.click(refreshBtn)

      // Verify refresh was called
      await waitFor(() => {
        expect(mockSupabase.auth.getSession).toHaveBeenCalledTimes(2) // Initial + refresh
      })
    })
  })

  describe('Auth State Change Handling', () => {
    it('updates state when auth state changes', async () => {
      let authStateChangeCallback: any
      
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockImplementation((callback) => {
        authStateChangeCallback = callback
        return { data: { subscription: { unsubscribe: jest.fn() } } }
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      })

      // Simulate auth state change to signed in
      const mockUser = { id: 'user-123', email: 'test@example.com' }
      authStateChangeCallback('SIGNED_IN', { user: mockUser })

      // Verify state updated
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Logged in as test@example.com')
      })

      // Simulate auth state change to signed out
      authStateChangeCallback('SIGNED_OUT', null)

      // Verify state updated
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      })
    })
  })

  describe('Error Handling', () => {
    it('handles session retrieval errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ 
        data: { session: null }, 
        error: { message: 'Network error' } 
      })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Should handle error gracefully and show as not logged in
      await waitFor(() => {
        expect(screen.getByTestId('user-status')).toHaveTextContent('Not logged in')
      })
    })

    it('handles auth state change errors', async () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      mockSupabase.auth.onAuthStateChange.mockImplementation(() => {
        throw new Error('Auth state change error')
      })
      
      // Should not crash the component
      expect(() => {
        render(
          <AuthProvider>
            <TestComponent />
          </AuthProvider>
        )
      }).not.toThrow()
    })
  })

  describe('Context Provider', () => {
    it('provides auth context to children', () => {
      mockSupabase.auth.getSession.mockResolvedValue({ data: { session: null }, error: null })
      
      render(
        <AuthProvider>
          <TestComponent />
        </AuthProvider>
      )

      // Verify context is provided
      expect(screen.getByTestId('user-status')).toBeInTheDocument()
      expect(screen.getByTestId('signout-btn')).toBeInTheDocument()
      expect(screen.getByTestId('refresh-btn')).toBeInTheDocument()
    })

    it('throws error when useAuth is used outside provider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
      
      expect(() => {
        render(<TestComponent />)
      }).toThrow()
      
      consoleSpy.mockRestore()
    })
  })
})

