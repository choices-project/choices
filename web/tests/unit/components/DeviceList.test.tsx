import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import DeviceList from '@/components/auth/DeviceList'

// Mock the WebAuthn utilities
jest.mock('@/lib/webauthn', () => ({
  getUserCredentials: jest.fn(),
  removeCredential: jest.fn(),
  generateQRCodeData: jest.fn()
}))

describe('DeviceList Component', () => {
  const mockProps = {
    userId: 'test-user-123',
    onAddDevice: jest.fn(),
    onDeviceRemoved: jest.fn(),
    className: 'test-class'
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders loading state initially', () => {
    render(<DeviceList {...mockProps} />)
    
    expect(screen.getByTestId('loading-indicator')).toBeInTheDocument()
    expect(screen.getByText('Loading devices...')).toBeInTheDocument()
  })

  test('renders empty state when no devices', async () => {
    const { getUserCredentials } = require('@/lib/webauthn')
    getUserCredentials.mockResolvedValue({
      success: true,
      credentials: []
    })

    render(<DeviceList {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('empty-state')).toBeInTheDocument()
    })
    
    expect(screen.getByText('No devices found')).toBeInTheDocument()
    expect(screen.getByTestId('add-device-button')).toBeInTheDocument()
  })

  test('renders devices when data is available', async () => {
    const { getUserCredentials } = require('@/lib/webauthn')
    getUserCredentials.mockResolvedValue({
      success: true,
      credentials: [
        {
          id: 'device-1',
          name: 'Test iPhone',
          deviceInfo: { deviceType: 'ios', platform: 'apple', browser: 'Safari' },
          lastUsed: '2024-12-19T10:00:00Z',
          isCurrent: true,
          authenticatorType: 'platform'
        },
        {
          id: 'device-2',
          name: 'Test MacBook',
          deviceInfo: { deviceType: 'macos', platform: 'apple', browser: 'Chrome' },
          lastUsed: '2024-12-18T15:30:00Z',
          isCurrent: false,
          authenticatorType: 'cross-platform'
        }
      ]
    })

    render(<DeviceList {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getAllByTestId('device-item')).toHaveLength(2)
    })
    
    expect(screen.getByText('Test iPhone')).toBeInTheDocument()
    expect(screen.getByText('Test MacBook')).toBeInTheDocument()
    expect(screen.getByTestId('current-badge')).toBeInTheDocument()
  })

  test('handles error state', async () => {
    const { getUserCredentials } = require('@/lib/webauthn')
    getUserCredentials.mockResolvedValue({
      success: false,
      error: 'Failed to load devices'
    })

    render(<DeviceList {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('error-message')).toBeInTheDocument()
    })
    
    expect(screen.getByText('Failed to load devices')).toBeInTheDocument()
  })

  test('calls onAddDevice when add device button is clicked', async () => {
    const { getUserCredentials } = require('@/lib/webauthn')
    getUserCredentials.mockResolvedValue({
      success: true,
      credentials: []
    })

    render(<DeviceList {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('add-device-button')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTestId('add-device-button'))
    expect(mockProps.onAddDevice).toHaveBeenCalledTimes(1)
  })

  test('shows QR code modal when QR button is clicked', async () => {
    const { getUserCredentials, generateQRCodeData } = require('@/lib/webauthn')
    getUserCredentials.mockResolvedValue({
      success: true,
      credentials: [
        {
          id: 'device-1',
          name: 'Test iPhone',
          deviceInfo: { deviceType: 'ios', platform: 'apple', browser: 'Safari' },
          lastUsed: '2024-12-19T10:00:00Z',
          isCurrent: true,
          authenticatorType: 'platform'
        }
      ]
    })
    generateQRCodeData.mockResolvedValue({
      success: true,
      qrData: 'test-qr-code-data'
    })

    render(<DeviceList {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-button')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTestId('qr-code-button'))
    
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-modal')).toBeInTheDocument()
    })
    
    expect(screen.getByTestId('qr-code-data')).toHaveTextContent('test-qr-code-data')
  })

  test('closes QR code modal when close button is clicked', async () => {
    const { getUserCredentials, generateQRCodeData } = require('@/lib/webauthn')
    getUserCredentials.mockResolvedValue({
      success: true,
      credentials: [
        {
          id: 'device-1',
          name: 'Test iPhone',
          deviceInfo: { deviceType: 'ios', platform: 'apple', browser: 'Safari' },
          lastUsed: '2024-12-19T10:00:00Z',
          isCurrent: true,
          authenticatorType: 'platform'
        }
      ]
    })
    generateQRCodeData.mockResolvedValue({
      success: true,
      qrData: 'test-qr-code-data'
    })

    render(<DeviceList {...mockProps} />)
    
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-button')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTestId('qr-code-button'))
    
    await waitFor(() => {
      expect(screen.getByTestId('qr-code-modal')).toBeInTheDocument()
    })
    
    fireEvent.click(screen.getByTestId('close-modal'))
    
    await waitFor(() => {
      expect(screen.queryByTestId('qr-code-modal')).not.toBeInTheDocument()
    })
  })
})
