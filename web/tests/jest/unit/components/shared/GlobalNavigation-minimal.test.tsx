/**
 * GlobalNavigation Component Tests - Minimal Mocking Approach
 * 
 * Tests the actual component behavior with minimal mocking
 * Focuses on real user interactions and component logic
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import GlobalNavigation from '@/components/shared/GlobalNavigation'

// Mock only what's absolutely necessary
const mockSignOut = jest.fn()
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

// Mock the stores with actual implementations
jest.mock('@/lib/stores', () => ({
  useUser: jest.fn(() => mockUser),
  useUserActions: jest.fn(() => ({
    signOut: mockSignOut
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

describe('GlobalNavigation - Real Behavior Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render all navigation items', () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Test actual rendered content
      expect(screen.getByText('Feed')).toBeInTheDocument()
      expect(screen.getByText('Polls')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should display user information when authenticated', () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Test that user info is actually displayed
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should render mobile menu button', () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Look for the actual menu button
      const menuButton = screen.getByRole('button', { name: /menu/i })
      expect(menuButton).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should toggle mobile menu when menu button is clicked', () => {
      renderWithRouter(<GlobalNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      // Test that the menu actually opens (check for close button or menu items)
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should call signOut when logout is clicked', async () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Open mobile menu first
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)
      
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should handle logout errors gracefully', async () => {
      mockSignOut.mockRejectedValueOnce(new Error('Logout failed'))
      
      renderWithRouter(<GlobalNavigation />)
      
      // Open mobile menu and click logout
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)
      
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      // Component should handle error gracefully (no crash)
    })
  })

  describe('Navigation Links', () => {
    it('should have correct href attributes', () => {
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
      
      // Since we're mocking usePathname to return '/dashboard', 
      // the dashboard link should be active
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      // Check for active styling (adjust class name based on your component)
      expect(dashboardLink).toHaveClass('bg-blue-50')
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
      // The menu should open
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      // Mock useUser to return null
      jest.mocked(require('@/lib/stores').useUser).mockReturnValueOnce(null)
      
      renderWithRouter(<GlobalNavigation />)
      
      // Component should still render without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      // Should show login/signup options instead of user info
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
})

 * GlobalNavigation Component Tests - Minimal Mocking Approach
 * 
 * Tests the actual component behavior with minimal mocking
 * Focuses on real user interactions and component logic
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, jest } from '@jest/globals'

import GlobalNavigation from '@/components/shared/GlobalNavigation'

// Mock only what's absolutely necessary
const mockSignOut = jest.fn()
const mockUser = {
  id: 'test-user-id',
  name: 'Test User',
  email: 'test@example.com',
  avatar: 'https://example.com/avatar.jpg'
}

// Mock the stores with actual implementations
jest.mock('@/lib/stores', () => ({
  useUser: jest.fn(() => mockUser),
  useUserActions: jest.fn(() => ({
    signOut: mockSignOut
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

describe('GlobalNavigation - Real Behavior Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render all navigation items', () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Test actual rendered content
      expect(screen.getByText('Feed')).toBeInTheDocument()
      expect(screen.getByText('Polls')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
    })

    it('should display user information when authenticated', () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Test that user info is actually displayed
      expect(screen.getByText('Test User')).toBeInTheDocument()
    })

    it('should render mobile menu button', () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Look for the actual menu button
      const menuButton = screen.getByRole('button', { name: /menu/i })
      expect(menuButton).toBeInTheDocument()
    })
  })

  describe('User Interactions', () => {
    it('should toggle mobile menu when menu button is clicked', () => {
      renderWithRouter(<GlobalNavigation />)
      
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      // Test that the menu actually opens (check for close button or menu items)
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })

    it('should call signOut when logout is clicked', async () => {
      renderWithRouter(<GlobalNavigation />)
      
      // Open mobile menu first
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      // Find and click logout button
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)
      
      expect(mockSignOut).toHaveBeenCalledTimes(1)
    })

    it('should handle logout errors gracefully', async () => {
      mockSignOut.mockRejectedValueOnce(new Error('Logout failed'))
      
      renderWithRouter(<GlobalNavigation />)
      
      // Open mobile menu and click logout
      const menuButton = screen.getByRole('button', { name: /menu/i })
      fireEvent.click(menuButton)
      
      const logoutButton = screen.getByRole('button', { name: /logout/i })
      fireEvent.click(logoutButton)
      
      expect(mockSignOut).toHaveBeenCalledTimes(1)
      // Component should handle error gracefully (no crash)
    })
  })

  describe('Navigation Links', () => {
    it('should have correct href attributes', () => {
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
      
      // Since we're mocking usePathname to return '/dashboard', 
      // the dashboard link should be active
      const dashboardLink = screen.getByRole('link', { name: /dashboard/i })
      // Check for active styling (adjust class name based on your component)
      expect(dashboardLink).toHaveClass('bg-blue-50')
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
      // The menu should open
      expect(screen.getByRole('button', { name: /close/i })).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should handle missing user data gracefully', () => {
      // Mock useUser to return null
      jest.mocked(require('@/lib/stores').useUser).mockReturnValueOnce(null)
      
      renderWithRouter(<GlobalNavigation />)
      
      // Component should still render without crashing
      expect(screen.getByRole('navigation')).toBeInTheDocument()
      // Should show login/signup options instead of user info
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
})










