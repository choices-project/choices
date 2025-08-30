/**
 * EnhancedVoteForm Component Tests
 * Tests meaningful voting functionality and user workflows
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import EnhancedVoteForm from '@/components/polls/EnhancedVoteForm'
import { vote } from '@/app/actions/vote'
import { offlineOutbox } from '@/lib/pwa/offline-outbox'

// Mock dependencies
jest.mock('@/app/actions/vote')
jest.mock('@/lib/pwa/offline-outbox')
jest.mock('@/lib/logger', () => ({
  logger: {
    error: jest.fn()
  }
}))

const mockVote = vote as jest.MockedFunction<typeof vote>
const mockOfflineOutbox = offlineOutbox as jest.Mocked<typeof offlineOutbox>

// Test poll data
const mockPoll = {
  id: 'test-poll-123',
  title: 'Test Poll',
  description: 'A test poll for voting',
  type: 'single' as const,
  allowMultipleVotes: false,
  endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
  options: [
    { id: 'option-1', label: 'Option 1', description: 'First option' },
    { id: 'option-2', label: 'Option 2', description: 'Second option' },
    { id: 'option-3', label: 'Option 3', description: 'Third option' }
  ]
}

const mockApprovalPoll = {
  ...mockPoll,
  type: 'approval' as const,
  allowMultipleVotes: true
}

describe('EnhancedVoteForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    
    // Mock navigator.onLine
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true
    })
    
    // Mock window event listeners
    window.addEventListener = jest.fn()
    window.removeEventListener = jest.fn()
  })

  describe('Voting Validation', () => {
    it('prevents submission without selecting any options', async () => {
      const onVoteError = jest.fn()
      
      render(
        <EnhancedVoteForm 
          poll={mockPoll} 
          onVoteError={onVoteError}
        />
      )

      // Try to submit without selecting any options
      const submitButton = screen.getByRole('button', { name: 'Submit Vote' })
      fireEvent.click(submitButton)

      // Verify error callback is called
      expect(onVoteError).toHaveBeenCalledWith('Please select at least one option')
      
      // Verify button remains enabled (not in loading state)
      expect(submitButton).not.toBeDisabled()
    })

    it('validates single choice voting allows only one selection', async () => {
      render(<EnhancedVoteForm poll={mockPoll} />)

      const option1 = screen.getByLabelText('Option 1')
      const option2 = screen.getByLabelText('Option 2')

      // Select first option
      fireEvent.click(option1)
      expect(option1).toBeChecked()
      expect(option2).not.toBeChecked()

      // Select second option - should deselect first
      fireEvent.click(option2)
      expect(option1).not.toBeChecked()
      expect(option2).toBeChecked()
    })

    it('allows multiple selections for approval voting', async () => {
      render(<EnhancedVoteForm poll={mockApprovalPoll} />)

      const option1 = screen.getByLabelText('Option 1')
      const option2 = screen.getByLabelText('Option 2')

      // Select first option
      fireEvent.click(option1)
      expect(option1).toBeChecked()

      // Select second option - should keep both selected
      fireEvent.click(option2)
      expect(option1).toBeChecked()
      expect(option2).toBeChecked()

      // Deselect first option
      fireEvent.click(option1)
      expect(option1).not.toBeChecked()
      expect(option2).toBeChecked()
    })
  })

  describe('Online Voting Flow', () => {
    it('submits vote successfully when online', async () => {
      const onVoteSubmitted = jest.fn()
      mockVote.mockResolvedValue({ success: true, voteCount: 1 })

      render(
        <EnhancedVoteForm 
          poll={mockPoll} 
          onVoteSubmitted={onVoteSubmitted}
        />
      )

      // Select an option
      const option1 = screen.getByLabelText('Option 1')
      fireEvent.click(option1)

      // Submit vote
      const submitButton = screen.getByRole('button', { name: 'Submit Vote' })
      fireEvent.click(submitButton)

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument()
      })

      // Verify vote action was called with correct data
      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith(expect.any(FormData))
      })

      const formData = mockVote.mock.calls[0][0]
      expect(formData.get('pollId')).toBe(mockPoll.id)
      expect(formData.get('optionIds')).toBe(JSON.stringify(['option-1']))
      expect(formData.get('anonymous')).toBe('false')

      // Verify success callback
      await waitFor(() => {
        expect(onVoteSubmitted).toHaveBeenCalledWith({ success: true, voteCount: 1 })
      })
    })

    it('handles anonymous voting correctly', async () => {
      const onVoteSubmitted = jest.fn()
      mockVote.mockResolvedValue({ success: true, voteCount: 1 })

      render(
        <EnhancedVoteForm 
          poll={mockPoll} 
          onVoteSubmitted={onVoteSubmitted}
        />
      )

      // Select anonymous voting
      const anonymousCheckbox = screen.getByLabelText(/Vote anonymously/)
      fireEvent.click(anonymousCheckbox)

      // Select an option
      const option1 = screen.getByLabelText('Option 1')
      fireEvent.click(option1)

      // Submit vote
      const submitButton = screen.getByRole('button', { name: 'Submit Vote' })
      fireEvent.click(submitButton)

      // Verify anonymous flag is sent
      await waitFor(() => {
        expect(mockVote).toHaveBeenCalledWith(expect.any(FormData))
      })

      const formData = mockVote.mock.calls[0][0]
      expect(formData.get('anonymous')).toBe('true')
    })

    it('handles voting errors gracefully', async () => {
      const onVoteError = jest.fn()
      mockVote.mockRejectedValue(new Error('Vote submission failed'))

      render(
        <EnhancedVoteForm 
          poll={mockPoll} 
          onVoteError={onVoteError}
        />
      )

      // Select an option
      const option1 = screen.getByLabelText('Option 1')
      fireEvent.click(option1)

      // Submit vote
      const submitButton = screen.getByRole('button', { name: 'Submit Vote' })
      fireEvent.click(submitButton)

      // Verify error handling
      await waitFor(() => {
        expect(onVoteError).toHaveBeenCalledWith('Vote submission failed')
      })

      // Verify button returns to normal state
      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Submit Vote' })).not.toBeDisabled()
      })
    })
  })

  describe('Offline Voting Flow', () => {
    beforeEach(() => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      })
      
      mockOfflineOutbox.hasPendingVotes.mockResolvedValue(false)
      mockOfflineOutbox.addVote.mockResolvedValue()
    })

    it('stores votes offline when user is offline', async () => {
      const onVoteSubmitted = jest.fn()

      render(
        <EnhancedVoteForm 
          poll={mockPoll} 
          onVoteSubmitted={onVoteSubmitted}
        />
      )

      // Verify offline indicator is shown
      expect(screen.getByText("You're offline")).toBeInTheDocument()
      expect(screen.getByText('Votes will be stored locally and submitted when you\'re back online.')).toBeInTheDocument()

      // Select an option
      const option1 = screen.getByLabelText('Option 1')
      fireEvent.click(option1)

      // Submit vote
      const submitButton = screen.getByRole('button', { name: 'Store Vote Offline' })
      fireEvent.click(submitButton)

      // Verify offline storage
      await waitFor(() => {
        expect(mockOfflineOutbox.addVote).toHaveBeenCalledWith(
          mockPoll.id,
          ['option-1'],
          false
        )
      })

      // Verify success message
      await waitFor(() => {
        expect(screen.getByText('Vote stored offline')).toBeInTheDocument()
        expect(screen.getByText("Your vote will be submitted automatically when you're back online.")).toBeInTheDocument()
      })

      // Verify success callback
      expect(onVoteSubmitted).toHaveBeenCalledWith({
        success: true,
        message: 'Vote stored offline and will be submitted when you\'re back online',
        offline: true
      })
    })

    it('shows pending votes warning when user has offline votes', async () => {
      mockOfflineOutbox.hasPendingVotes.mockResolvedValue(true)

      render(<EnhancedVoteForm poll={mockPoll} />)

      // Verify pending votes warning
      await waitFor(() => {
        expect(screen.getByText('You have pending votes')).toBeInTheDocument()
        expect(screen.getByText("You've already voted on this poll. Your vote will be submitted when online.")).toBeInTheDocument()
      })
    })
  })

  describe('Poll State Management', () => {
    it('prevents voting on ended polls', () => {
      const endedPoll = {
        ...mockPoll,
        endDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() // 24 hours ago
      }

      render(<EnhancedVoteForm poll={endedPoll} />)

      // Verify ended poll message
      expect(screen.getByText('Poll has ended')).toBeInTheDocument()
      expect(screen.getByText('This poll is no longer accepting votes.')).toBeInTheDocument()

      // Verify no voting interface is shown
      expect(screen.queryByRole('button', { name: 'Submit Vote' })).not.toBeInTheDocument()
      expect(screen.queryByLabelText('Option 1')).not.toBeInTheDocument()
    })

    it('shows correct poll information', () => {
      render(<EnhancedVoteForm poll={mockPoll} />)

      // Verify poll type is displayed
      expect(screen.getByText('Poll Type:')).toBeInTheDocument()
      expect(screen.getByText('single')).toBeInTheDocument()

      // Verify end date is displayed
      expect(screen.getByText('Ends:')).toBeInTheDocument()
      expect(screen.getByText(new Date(mockPoll.endDate).toLocaleDateString())).toBeInTheDocument()
    })

    it('shows multiple votes allowed for approval polls', () => {
      render(<EnhancedVoteForm poll={mockApprovalPoll} />)

      // Verify multiple votes indicator
      expect(screen.getByText('Multiple Votes:')).toBeInTheDocument()
      expect(screen.getByText('Allowed')).toBeInTheDocument()
    })
  })

  describe('Network State Management', () => {
    it('responds to online/offline state changes', async () => {
      const mockAddEventListener = window.addEventListener as jest.MockedFunction<typeof window.addEventListener>
      const mockRemoveEventListener = window.removeEventListener as jest.MockedFunction<typeof window.removeEventListener>

      render(<EnhancedVoteForm poll={mockPoll} />)

      // Verify event listeners are set up
      expect(mockAddEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockAddEventListener).toHaveBeenCalledWith('offline', expect.any(Function))

      // Simulate going offline
      const offlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'offline'
      )?.[1] as Function

      if (offlineHandler) {
        offlineHandler()
        
        await waitFor(() => {
          expect(screen.getByText("You're offline")).toBeInTheDocument()
        })
      }

      // Simulate going online
      const onlineHandler = mockAddEventListener.mock.calls.find(
        call => call[0] === 'online'
      )?.[1] as Function

      if (onlineHandler) {
        onlineHandler()
        
        await waitFor(() => {
          expect(screen.queryByText("You're offline")).not.toBeInTheDocument()
        })
      }

      // Verify cleanup on unmount
      const { unmount } = render(<EnhancedVoteForm poll={mockPoll} />)
      unmount()

      expect(mockRemoveEventListener).toHaveBeenCalledWith('online', expect.any(Function))
      expect(mockRemoveEventListener).toHaveBeenCalledWith('offline', expect.any(Function))
    })
  })

  describe('Accessibility and UX', () => {
    it('provides proper form labels and accessibility', () => {
      render(<EnhancedVoteForm poll={mockPoll} />)

      // Verify form has proper structure
      const form = screen.getByRole('form')
      expect(form).toBeInTheDocument()

      // Verify options have proper labels
      const option1 = screen.getByLabelText('Option 1')
      const option2 = screen.getByLabelText('Option 2')
      expect(option1).toBeInTheDocument()
      expect(option2).toBeInTheDocument()

      // Verify anonymous checkbox has proper label
      const anonymousCheckbox = screen.getByLabelText(/Vote anonymously/)
      expect(anonymousCheckbox).toBeInTheDocument()

      // Verify submit button has proper role
      const submitButton = screen.getByRole('button', { name: 'Submit Vote' })
      expect(submitButton).toBeInTheDocument()
    })

    it('shows loading state during submission', async () => {
      mockVote.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve({ success: true }), 100)))

      render(<EnhancedVoteForm poll={mockPoll} />)

      // Select an option
      const option1 = screen.getByLabelText('Option 1')
      fireEvent.click(option1)

      // Submit vote
      const submitButton = screen.getByRole('button', { name: 'Submit Vote' })
      fireEvent.click(submitButton)

      // Verify loading state
      await waitFor(() => {
        expect(screen.getByText('Submitting...')).toBeInTheDocument()
        expect(submitButton).toBeDisabled()
      })
    })

    it('disables submit button when no options are selected', () => {
      render(<EnhancedVoteForm poll={mockPoll} />)

      const submitButton = screen.getByRole('button', { name: 'Submit Vote' })
      expect(submitButton).toBeDisabled()
      expect(submitButton).toHaveClass('cursor-not-allowed')
    })
  })
})







