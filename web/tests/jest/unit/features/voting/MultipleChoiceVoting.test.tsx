/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import MultipleChoiceVoting from '@/features/voting/components/MultipleChoiceVoting'

// Mock the SSR-safe utility
jest.mock('@/lib/utils/ssr-safe', () => ({
  safeWindow: jest.fn(() => null)
}))

const mockOptions = [
  { id: '1', text: 'Option 1', description: 'First option' },
  { id: '2', text: 'Option 2', description: 'Second option' },
  { id: '3', text: 'Option 3', description: 'Third option' }
]

const defaultProps = {
  pollId: 'test-poll-123',
  title: 'Test Multiple Choice Poll',
  description: 'Choose all options you support',
  options: mockOptions,
  onVote: jest.fn(),
  isVoting: false,
  hasVoted: false,
  maxSelections: 2
}

describe('MultipleChoiceVoting', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders poll title and description', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    expect(screen.getByText('Test Multiple Choice Poll')).toBeInTheDocument()
    expect(screen.getByText('Choose all options you support')).toBeInTheDocument()
  })

  it('renders all poll options', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    expect(screen.getByText('Option 1')).toBeInTheDocument()
    expect(screen.getByText('Option 2')).toBeInTheDocument()
    expect(screen.getByText('Option 3')).toBeInTheDocument()
  })

  it('allows selecting multiple options', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    const option1 = screen.getByTestId('option-1-checkbox')
    const option2 = screen.getByTestId('option-2-checkbox')
    
    fireEvent.click(option1)
    fireEvent.click(option2)
    
    // Both options should be selected
    expect(option1).toHaveClass('border-green-500')
    expect(option2).toHaveClass('border-green-500')
  })

  it('allows deselecting options', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    const option1 = screen.getByTestId('option-1-checkbox')
    
    // Select then deselect
    fireEvent.click(option1)
    expect(option1).toHaveClass('border-green-500')
    
    fireEvent.click(option1)
    expect(option1).not.toHaveClass('border-green-500')
  })

  it('enforces maximum selections limit', () => {
    render(<MultipleChoiceVoting {...defaultProps} maxSelections={2} />)
    
    const option1 = screen.getByTestId('option-1-checkbox')
    const option2 = screen.getByTestId('option-2-checkbox')
    const option3 = screen.getByTestId('option-3-checkbox')
    
    // Select first two options
    fireEvent.click(option1)
    fireEvent.click(option2)
    
    // Try to select third option (should be blocked)
    fireEvent.click(option3)
    
    expect(screen.getByText('You can select up to 2 options')).toBeInTheDocument()
    expect(option3).not.toHaveClass('border-green-500')
  })

  it('shows selection summary', async () => {
    render(<MultipleChoiceVoting {...defaultProps} maxSelections={undefined} />)
    
    const option1 = screen.getByTestId('option-1-checkbox')
    const option2 = screen.getByTestId('option-2-checkbox')
    
    fireEvent.click(option1)
    fireEvent.click(option2)
    
    // Check that options are selected by verifying the styling
    expect(option1).toHaveClass('border-green-500')
    expect(option2).toHaveClass('border-green-500')
    
    // Check for selection summary
    await waitFor(() => {
      expect(screen.getByText(/Selected 2 options:/)).toBeInTheDocument()
    })
  })

  it('submits vote with selected options', async () => {
    const mockOnVote = jest.fn().mockResolvedValue({ ok: true })
    render(<MultipleChoiceVoting {...defaultProps} onVote={mockOnVote} />)
    
    const option1 = screen.getByTestId('option-1-checkbox')
    const option2 = screen.getByTestId('option-2-checkbox')
    const submitButton = screen.getByTestId('submit-vote-button')
    
    fireEvent.click(option1)
    fireEvent.click(option2)
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(mockOnVote).toHaveBeenCalledWith([0, 1])
    })
  })

  it('prevents submission with no selections', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    const submitButton = screen.getByTestId('submit-vote-button')
    expect(submitButton).toBeDisabled()
  })

  it('prevents clicking submit button when no selections', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    const submitButton = screen.getByTestId('submit-vote-button')
    
    // Button should be disabled when no options are selected
    expect(submitButton).toBeDisabled()
    
    // Select an option
    const option1 = screen.getByTestId('option-1-checkbox')
    fireEvent.click(option1)
    
    // Button should now be enabled
    expect(submitButton).not.toBeDisabled()
    
    // Deselect the option
    fireEvent.click(option1)
    
    // Button should be disabled again
    expect(submitButton).toBeDisabled()
  })

  it('displays voted state correctly', () => {
    render(<MultipleChoiceVoting {...defaultProps} hasVoted={true} />)
    
    expect(screen.getByTestId('vote-confirmation')).toBeInTheDocument()
    expect(screen.getByText('Vote submitted successfully!')).toBeInTheDocument()
  })

  it('displays user\'s previous vote', () => {
    render(<MultipleChoiceVoting {...defaultProps} userVote={[0, 2]} />)
    
    const option1 = screen.getByTestId('option-1-checkbox')
    const option3 = screen.getByTestId('option-3-checkbox')
    
    expect(option1).toHaveClass('border-green-500')
    expect(option3).toHaveClass('border-green-500')
  })

  it('shows voting method badge', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    expect(screen.getByText('🎯 Multiple Choice Voting')).toBeInTheDocument()
    expect(screen.getByText(/Select all options you support/)).toBeInTheDocument()
  })

  it('shows explanation when info button is clicked', () => {
    render(<MultipleChoiceVoting {...defaultProps} />)
    
    const infoButton = screen.getByText('How it works')
    fireEvent.click(infoButton)
    
    expect(screen.getByText('How Multiple Choice Voting Works')).toBeInTheDocument()
    expect(screen.getByText('Select multiple options:')).toBeInTheDocument()
    expect(screen.getByText('Choose all options you support')).toBeInTheDocument()
  })
})
