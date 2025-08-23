import { useState, useEffect, useCallback } from 'react'
import { devLog } from '@/lib/logger'

// Types
export type DeviceType = 'mobile' | 'tablet' | 'desktop' | 'tv'

export interface DeviceInfo {
  type: DeviceType
  os: string
  browser: string
  screen_size: { width: number; height: number }
  pixel_ratio: number
  touch_support: boolean
  pwa_support: boolean
  user_agent: string
}

export interface DeviceCapabilities {
  offline_support: boolean
  push_notifications: boolean
  camera_access: boolean
  location_access: boolean
  storage_quota: number
  network_speed: 'slow' | 'medium' | 'fast'
  battery_level?: number
  connection_type?: string
}

export interface OptimizationSettings {
  image_quality: 'low' | 'medium' | 'high'
  animation_enabled: boolean
  real_time_updates: boolean
  offline_mode: boolean
  reduced_motion: boolean
  data_saver: boolean
}

const DEVICE_BREAKPOINTS = {
  mobile: { max: 768 },
  tablet: { min: 769, max: 1024 },
  desktop: { min: 1025 },
  tv: { min: 1920 }
}

const OS_PATTERNS = {
  ios: /iPhone|iPad|iPod/i,
  android: /Android/i,
  windows: /Windows/i,
  macos: /Mac OS X/i,
  linux: /Linux/i
}

const BROWSER_PATTERNS = {
  chrome: /Chrome/i,
  firefox: /Firefox/i,
  safari: /Safari/i,
  edge: /Edge/i,
  opera: /Opera/i
}

export function useDeviceDetection() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [capabilities, setCapabilities] = useState<DeviceCapabilities | null>(null)
  const [optimizationSettings, setOptimizationSettings] = useState<OptimizationSettings | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const detectDeviceType = useCallback((width: number): DeviceType => {
    if (width <= DEVICE_BREAKPOINTS.mobile.max) return 'mobile'
    if (width >= DEVICE_BREAKPOINTS.tablet.min && width <= DEVICE_BREAKPOINTS.tablet.max) return 'tablet'
    if (width >= DEVICE_BREAKPOINTS.tv.min) return 'tv'
    return 'desktop'
  }, [])

  const detectOS = useCallback((userAgent: string): string => {
    for (const [os, pattern] of Object.entries(OS_PATTERNS)) {
      if (pattern.test(userAgent)) {
        return os
      }
    }
    return 'unknown'
  }, [])

  const detectBrowser = useCallback((userAgent: string): string => {
    for (const [browser, pattern] of Object.entries(BROWSER_PATTERNS)) {
      if (pattern.test(userAgent)) {
        return browser
      }
    }
    return 'unknown'
  }, [])

  const checkCapabilities = useCallback(async (): Promise<DeviceCapabilities> => {
    const capabilities: DeviceCapabilities = {
      offline_support: 'serviceWorker' in navigator,
      push_notifications: 'Notification' in window && 'serviceWorker' in navigator,
      camera_access: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      location_access: 'geolocation' in navigator,
      storage_quota: 0,
      network_speed: 'medium'
    }

    // Check storage quota
    if ('storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate()
        capabilities.storage_quota = estimate.quota || 0
      } catch (error) {
        devLog('Error checking storage quota:', error)
      }
    }

    // Check network speed
    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        capabilities.connection_type = connection.effectiveType || 'unknown'
        capabilities.network_speed = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' ? 'slow' : 
                                   connection.effectiveType === '3g' ? 'medium' : 'fast'
      }
    }

    // Check battery level
    if ('getBattery' in navigator) {
      try {
        const battery = await (navigator as any).getBattery()
        capabilities.battery_level = battery.level * 100
      } catch (error) {
        devLog('Error checking battery level:', error)
      }
    }

    return capabilities
  }, [])

  const getOptimizationSettings = useCallback((deviceInfo: DeviceInfo, capabilities: DeviceCapabilities): OptimizationSettings => {
    const settings: OptimizationSettings = {
      image_quality: 'medium',
      animation_enabled: true,
      real_time_updates: true,
      offline_mode: false,
      reduced_motion: false,
      data_saver: false
    }

    // Adjust based on device type
    switch (deviceInfo.type) {
      case 'mobile':
        settings.image_quality = capabilities.network_speed === 'slow' ? 'low' : 'medium'
        settings.animation_enabled = !window.matchMedia('(prefers-reduced-motion: reduce)').matches
        settings.data_saver = capabilities.network_speed === 'slow'
        break
      case 'tablet':
        settings.image_quality = 'medium'
        settings.animation_enabled = true
        break
      case 'desktop':
        settings.image_quality = 'high'
        settings.animation_enabled = true
        settings.real_time_updates = true
        break
      case 'tv':
        settings.image_quality = 'high'
        settings.animation_enabled = false
        settings.real_time_updates = false
        break
    }

    // Adjust based on capabilities
    if (capabilities.network_speed === 'slow') {
      settings.image_quality = 'low'
      settings.animation_enabled = false
      settings.real_time_updates = false
      settings.data_saver = true
    }

    if (capabilities.offline_support) {
      settings.offline_mode = true
    }

    // Check for reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      settings.reduced_motion = true
      settings.animation_enabled = false
    }

    return settings
  }, [])

  const detectDevice = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)

      const userAgent = navigator.userAgent
      const screenWidth = window.screen.width
      const screenHeight = window.screen.height
      const pixelRatio = window.devicePixelRatio || 1

      const deviceInfo: DeviceInfo = {
        type: detectDeviceType(screenWidth),
        os: detectOS(userAgent),
        browser: detectBrowser(userAgent),
        screen_size: { width: screenWidth, height: screenHeight },
        pixel_ratio: pixelRatio,
        touch_support: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
        pwa_support: 'serviceWorker' in navigator && 'PushManager' in window,
        user_agent: userAgent
      }

      const capabilities = await checkCapabilities()
      const optimizationSettings = getOptimizationSettings(deviceInfo, capabilities)

      setDeviceInfo(deviceInfo)
      setCapabilities(capabilities)
      setOptimizationSettings(optimizationSettings)

      devLog('Device detected:', deviceInfo)
      devLog('Capabilities:', capabilities)
      devLog('Optimization settings:', optimizationSettings)

    } catch (error) {
      devLog('Error detecting device:', error)
      setError('Failed to detect device capabilities')
    } finally {
      setIsLoading(false)
    }
  }, [detectDeviceType, detectOS, detectBrowser, checkCapabilities, getOptimizationSettings])

  const updateOptimizationSettings = useCallback((newSettings: Partial<OptimizationSettings>) => {
    setOptimizationSettings(prev => prev ? { ...prev, ...newSettings } : null)
  }, [])

  const checkNetworkStatus = useCallback(async (): Promise<{ online: boolean; speed: 'slow' | 'medium' | 'fast' }> => {
    const online = navigator.onLine
    let speed: 'slow' | 'medium' | 'fast' = 'medium'

    if ('connection' in navigator) {
      const connection = (navigator as any).connection
      if (connection) {
        speed = connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g' ? 'slow' : 
               connection.effectiveType === '3g' ? 'medium' : 'fast'
      }
    }

    return { online, speed }
  }, [])

  const requestCameraAccess = useCallback(async (): Promise<boolean> => {
    if (!capabilities?.camera_access) return false

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      stream.getTracks().forEach(track => track.stop())
      return true
    } catch (error) {
      devLog('Camera access denied:', error)
      return false
    }
  }, [capabilities])

  const requestLocationAccess = useCallback(async (): Promise<boolean> => {
    if (!capabilities?.location_access) return false

    try {
      await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
      })
      return true
    } catch (error) {
      devLog('Location access denied:', error)
      return false
    }
  }, [capabilities])

  const enableOfflineMode = useCallback(async (): Promise<boolean> => {
    if (!capabilities?.offline_support) return false

    try {
      // Register service worker for offline functionality
      if ('serviceWorker' in navigator) {
        await navigator.serviceWorker.register('/sw.js')
        return true
      }
      return false
    } catch (error) {
      devLog('Failed to enable offline mode:', error)
      return false
    }
  }, [capabilities])

  useEffect(() => {
    detectDevice()

    // Listen for window resize
    const handleResize = () => {
      detectDevice()
    }

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [detectDevice])

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => {
      devLog('Device came online')
      detectDevice()
    }

    const handleOffline = () => {
      devLog('Device went offline')
      detectDevice()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [detectDevice])

  return {
    deviceInfo,
    capabilities,
    optimizationSettings,
    isLoading,
    error,
    updateOptimizationSettings,
    checkNetworkStatus,
    requestCameraAccess,
    requestLocationAccess,
    enableOfflineMode,
    refreshDeviceInfo: detectDevice
  }
}

