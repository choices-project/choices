'use client'

import { Smartphone, Monitor, Tablet, Laptop, Trash2, Plus, QrCode } from 'lucide-react'
import Image from 'next/image'
import QRCode from 'qrcode'
import React, { useState, useCallback, useMemo, useEffect } from 'react'

import logger from '@/lib/utils/logger'

import { useI18n } from '@/hooks/useI18n'

import { EnhancedEmptyState } from './EnhancedEmptyState'
import { EnhancedErrorDisplay } from './EnhancedErrorDisplay'

type Device = {
  id: string
  name: string
  type: 'mobile' | 'desktop' | 'tablet' | 'laptop'
  lastUsed: string
  isActive: boolean
  icon?: string
}

type DeviceListProps = {
  devices: Device[]
  onAddDevice?: () => void
  onRemoveDevice?: (deviceId: string) => void
  onGenerateQR?: (deviceId: string) => void
  className?: string
  isLoading?: boolean
  hasError?: boolean
  onRetry?: () => void
}

const getDeviceIcon = (type: Device['type']) => {
  switch (type) {
    case 'mobile':
      return <Smartphone className="w-5 h-5" />
    case 'desktop':
      return <Monitor className="w-5 h-5" />
    case 'tablet':
      return <Tablet className="w-5 h-5" />
    case 'laptop':
      return <Laptop className="w-5 h-5" />
    default:
      return <Smartphone className="w-5 h-5" />
  }
}

export const DeviceList: React.FC<DeviceListProps> = ({
  devices,
  onAddDevice,
  onRemoveDevice,
  onGenerateQR,
  className = '',
  isLoading = false,
  hasError = false,
  onRetry,
}) => {
  const { t } = useI18n()
  const [showQRCode, setShowQRCode] = useState<string | null>(null)
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('')

  // Memoize devices to prevent unnecessary re-renders
  const memoizedDevices = useMemo(() => devices, [devices])

  const handleRemoveDevice = useCallback((deviceId: string) => {
    if (onRemoveDevice) {
      onRemoveDevice(deviceId)
    }
  }, [onRemoveDevice])

  const handleGenerateQR = useCallback((deviceId: string) => {
    if (onGenerateQR) {
      onGenerateQR(deviceId)
      setShowQRCode(deviceId)
    }
  }, [onGenerateQR])

  // Generate QR code when showQRCode changes
  useEffect(() => {
    if (showQRCode) {
      const generateQR = async () => {
        try {
          const device = devices.find(d => d.id === showQRCode)
          if (device) {
            const qrData = JSON.stringify({
              deviceId: device.id,
              deviceName: device.name,
              deviceType: device.type,
              timestamp: new Date().toISOString(),
              setupUrl: `${window.location.origin}/devices/setup/${device.id}`
            })

            const qrDataUrl = await QRCode.toDataURL(qrData, {
              width: 128,
              margin: 2,
              color: {
                dark: '#000000',
                light: '#FFFFFF'
              }
            })
            setQrCodeDataUrl(qrDataUrl)
          }
        } catch (error) {
          logger.error('Failed to generate QR code:', error)
        }
      }

      generateQR()
    }
  }, [showQRCode, devices])

  const handleAddDevice = useCallback(() => {
    if (onAddDevice) {
      onAddDevice()
    }
  }, [onAddDevice])

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry()
    }
  }, [onRetry])

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`device-list ${className}`}
        data-testid="device-list"
        aria-label="Loading devices"
        aria-busy="true"
      >
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" aria-hidden="true" />
          <span className="ml-2">{t('common.devices.loading')}</span>
        </div>
      </div>
    )
  }

  // Error state
  if (hasError) {
    return (
      <div
        className={`device-list ${className}`}
        data-testid="device-list"
      >
        <EnhancedErrorDisplay
          title={t('common.devices.loadFailed') || 'Failed to load devices'}
          message="We couldn't load your registered devices. This might be a temporary issue."
          tip="Check your internet connection. If the problem persists, try refreshing the page."
          canRetry={true}
          onRetry={handleRetry}
          primaryAction={{
            label: 'Refresh Page',
            onClick: () => window.location.reload(),
          }}
        />
      </div>
    )
  }

  // Empty state
  if (memoizedDevices.length === 0) {
    return (
      <div
        className={`device-list ${className}`}
        data-testid="device-list"
        role="status"
        aria-live="polite"
      >
        <EnhancedEmptyState
          icon={
            <svg
              className="h-12 w-12 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          }
          title={t('common.devices.empty') || 'No devices registered'}
          description="You haven't registered any devices yet. Register a device to enable secure authentication."
          tip="Registered devices allow you to sign in securely using biometric authentication or security keys."
          {...(onAddDevice ? {
            primaryAction: {
              label: t('common.devices.add') || 'Add Device',
              onClick: handleAddDevice,
              icon: <Plus className="h-4 w-4" />,
            },
          } : {})}
        />
      </div>
    )
  }

  return (
    <div
      className={`device-list ${className}`}
      data-testid="device-list"
      role="list"
      aria-label={t('common.devices.listLabel')}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">{t('common.devices.title')}</h3>
        {onAddDevice && (
          <button
            onClick={handleAddDevice}
            className="flex items-center px-3 py-1 bg-blue-500 text-white rounded text-sm hover:bg-blue-600"
            data-testid="add-device-button"
          >
            <Plus className="w-4 h-4 mr-1" />
            {t('common.devices.add')}
          </button>
        )}
      </div>

      {/* Device List */}
      <div className="space-y-3" role="group" aria-label={t('common.devices.listLabel')}>
        {memoizedDevices.map((device) => (
          <div
            key={device.id}
            className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg transition-colors focus-within:ring-2 focus-within:ring-blue-500 focus-within:ring-offset-2 hover:border-gray-300 dark:hover:border-gray-600"
            data-testid="device-item"
            role="listitem"
            aria-label={`${device.name}, ${device.type}, ${device.isActive ? t('common.devices.active') : t('common.devices.inactive')}`}
          >
            {/* Device Info */}
            <div className="flex items-center space-x-3 flex-1">
              <div className="flex-shrink-0" aria-hidden="true">
                {getDeviceIcon(device.type)}
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{device.name}</h4>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {t('common.devices.lastUsed')}: {new Date(device.lastUsed).toLocaleDateString()}
                </p>
                {device.isActive && (
                  <span
                    className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2"
                    aria-label={t('common.devices.active')}
                    title={t('common.devices.active')}
                  />
                )}
              </div>
            </div>

            {/* Device Actions */}
            <div className="flex items-center space-x-2" role="group" aria-label={t('common.devices.actions')}>
              {onGenerateQR && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleGenerateQR(device.id)
                  }}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-blue-500 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                  aria-label={t('common.devices.generateQR', { deviceName: device.name })}
                  data-testid="qr-code-button"
                  type="button"
                >
                  <QrCode className="w-4 h-4" aria-hidden="true" />
                </button>
              )}

              {onRemoveDevice && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveDevice(device.id)
                  }}
                  className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
                  aria-label={t('common.devices.remove', { deviceName: device.name })}
                  data-testid="remove-device-button"
                  type="button"
                >
                  <Trash2 className="w-4 h-4" aria-hidden="true" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* QR Code Modal */}
      {showQRCode && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          role="button"
          tabIndex={0}
          aria-label="Close QR code modal"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowQRCode(null)
            }
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setShowQRCode(null)
            }
          }}
        >
          <div
            className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-sm w-full mx-4 shadow-xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="qr-code-modal-title"
            aria-describedby="qr-code-modal-description"
          >
            <h3 id="qr-code-modal-title" className="text-lg font-semibold mb-4 text-gray-900 dark:text-gray-100">
              {t('common.devices.qrCodeTitle')}
            </h3>
            <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded text-center">
              <div className="w-32 h-32 bg-white dark:bg-gray-800 mx-auto mb-4 flex items-center justify-center" role="img" aria-label={t('common.devices.qrCode')}>
                {qrCodeDataUrl ? (
                  <Image
                    src={qrCodeDataUrl}
                    alt={t('common.devices.qrCodeAlt')}
                    width={128}
                    height={128}
                    unoptimized
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <span className="text-gray-500 dark:text-gray-400" role="status" aria-live="polite" aria-busy="true">
                    {t('common.devices.generatingQR')}
                  </span>
                )}
              </div>
              <p id="qr-code-modal-description" className="text-sm text-gray-600 dark:text-gray-400">
                {t('common.devices.qrCodeDescription')}
              </p>
            </div>
            <button
              onClick={() => setShowQRCode(null)}
              className="mt-4 w-full px-4 py-2 bg-gray-500 dark:bg-gray-600 text-white rounded hover:bg-gray-600 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              aria-label={t('common.actions.close')}
            >
              {t('common.actions.close')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// Export for testing
export default DeviceList
