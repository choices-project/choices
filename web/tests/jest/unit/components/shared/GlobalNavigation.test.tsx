/**
 * GlobalNavigation Component Tests
 * 
 * Comprehensive tests for the main navigation component
 * Tests user interactions, authentication states, and responsive behavior
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

// Mock lucide-react before importing the component
jest.mock('lucide-react', () => require('@/../../__mocks__/lucide-react.js'))

import GlobalNavigation from '@/components/shared/GlobalNavigation'

// Mock the stores at the module level to prevent infinite loops
const mockSignOut = jest.fn()
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

// Mock the entire store module to prevent infinite loops
jest.mock('@/lib/stores', () => ({
  useUser: jest.fn(() => mockUser),
  useUserActions: jest.fn(() => ({
    signOut: mockSignOut
  })),
  useUserStore: jest.fn(() => ({
    user: mockUser,
    isAuthenticated: true,
    signOut: mockSignOut,
    setUserAndAuth: jest.fn(),
    setSessionAndDerived: jest.fn(),
    initializeAuth: jest.fn(),
    clearUser: jest.fn()
  }))
}))

// Mock the store creation to prevent initialization
jest.mock('zustand', () => ({
  create: jest.fn(() => () => ({
    user: mockUser,
    isAuthenticated: true,
    signOut: mockSignOut,
    setUserAndAuth: jest.fn(),
    setSessionAndDerived: jest.fn(),
    initializeAuth: jest.fn(),
    clearUser: jest.fn()
  }))
}))

// Mock Next.js navigation
jest.mock('next/navigation', () => ({
  usePathname: jest.fn(() => '/dashboard')
}))

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('GlobalNavigation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render navigation items', () => {
      renderWithRouter(<GlobalNavigation />)
      
      expect(screen.getByText('Feed')).toBeInTheDocument()
      expect(screen.getByText('Polls')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should render user information when authenticated', () => {
      renderWithRouter(<GlobalNavigation />)
      
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should render mobile menu button', () => {
      renderWithRouter(<GlobalNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      expect(menuButton).toBeInTheDocument()
    })
  })

  describe('Mobile Menu', () => {
    it('should toggle mobile menu when menu button is clicked', () => {
      renderWithRouter(<GlobalNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      // Check if mobile menu is open (you might need to adjust this based on your component structure)
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should close mobile menu when close button is clicked', async () => {
      renderWithRouter(<GlobalNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      // Wait for menu to open, then find and click close button
      await waitFor(() => {
        const closeButton = screen.getByRole('button', { name: /close/i })
        fireEvent.click(closeButton)
      })
    })
  })

  describe('Navigation Links', () => {
    it('should have correct href attributes for navigation items', () => {
      renderWithRouter(<GlobalNavigation />)
      
      const feedLink = screen.getByRole('link', { name: /feed/i })
      const pollsLink = screen.getByRole('link', { name: /polls/i })
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      
      expect(feedLink).toHaveAttribute('href', '/feed')
      expect(pollsLink).toHaveAttribute('href', '/polls')
      expect(dashboardLink).toHaveAttribute('href', '/dashboard')
    })

    it('should highlight active navigation item', () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Since we're mocking usePathname to return '/dashboard', the dashboard link should be active
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      expect(dashboardLink).toHaveClass('bg-blue-50') // Adjust class name based on your component
    })
  })

  describe('User Actions', () => {
    it('should call signOut when logout button is clicked', async () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Open mobile menu first
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      // Find and click logout button
      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: /logout/i })
        fireEvent.click(logoutButton)
      })
      
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should handle logout errors gracefully', async () => {
      mockSignOut.mockRejectedValueOnce(new Error('Logout failed'))
      
      renderWithRouter(<GlobalNavigation />)
      
      // Open mobile menu and click logout
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      await waitFor(() => {
        const logoutButton = screen.getByRole('button', { name: /logout/i })
        fireEvent.click(logoutButton)
      })
      
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      // The component should handle the error gracefully
    })
  })

  describe('Responsive Behavior', () => {
    it('should show mobile menu button on small screens', () => {
      // Mock window.innerWidth for mobile
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderWithRouter(<GlobalNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      expect(menuButton).toBeInTheDocument()
    })

    it('should hide mobile menu on desktop screens', () => {
      // Mock window.innerWidth for desktop
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })
      
      renderWithRouter(<GlobalNavigation />)
      
      // Mobile menu should not be visible by default on desktop
      expect(screen.queryByRole('button', { name: /close/i })).not.toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      renderWithRouter(<GlobalNavigation />)
      
      const navigation = screen.getByRole('navigation')
      expect(navigation).toBeInTheDocument()
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      expect(menuButton).toHaveAttribute('aria-label', 'Open menu')
    })

    it('should support keyboard navigation', () => {
      renderWithRouter(<GlobalNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      menuButton.focus()
      
      // Test keyboard navigation
      fireEvent.keyDown(menuButton, { key: 'Enter' })
      // Add more keyboard navigation tests as needed
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      // Mock useUser to return null
      jest.mocked(require('@/lib/stores').useUser).mockReturnValueOnce(null)
      
      renderWithRouter(<GlobalNavigation />)
      
      // Component should still render without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })

    it('should handle authentication errors', () => {
      // Mock useUser to return an error state
      jest.mocked(require('@/lib/stores').useUser).mockReturnValueOnce({
        error: 'Authentication failed'
      })
      
      renderWithRouter(<GlobalNavigation />)
      
      // Component should handle error state gracefully
      expect(screen.getByRole('navigation')).toBeInTheDocument()
    })
  })
});

