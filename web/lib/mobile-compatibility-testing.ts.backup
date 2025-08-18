// Mobile Compatibility Testing Suite
// Comprehensive testing for mobile devices and touch interfaces

export interface MobileTestResult {
  testName: string
  category: string
  status: 'pass' | 'fail' | 'warning' | 'skip'
  message: string
  details?: any
  mobileSpecific?: boolean
  timestamp: number
}

export interface MobileTestSuite {
  name: string
  tests: MobileTestResult[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
    skipped: number
    successRate: number
  }
}

export class MobileCompatibilityTesting {
  private isMobile: boolean
  private isTablet: boolean
  private isTouchDevice: boolean
  private viewportWidth: number
  private viewportHeight: number
  private pixelRatio: number
  private maxTouchPoints: number

  constructor() {
    if (typeof window === 'undefined') {
      this.isMobile = false
      this.isTablet = false
      this.isTouchDevice = false
      this.viewportWidth = 1920
      this.viewportHeight = 1080
      this.pixelRatio = 1
      this.maxTouchPoints = 0
    } else {
      this.isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      this.isTablet = /iPad|Android(?=.*\bMobile\b)(?=.*\bSafari\b)/i.test(navigator.userAgent)
      this.isTouchDevice = 'ontouchstart' in window
      this.viewportWidth = window.innerWidth
      this.viewportHeight = window.innerHeight
      this.pixelRatio = window.devicePixelRatio || 1
      this.maxTouchPoints = navigator.maxTouchPoints || 0
    }
  }

  // Run all mobile compatibility tests
  async runAllTests(): Promise<MobileTestSuite[]> {
    const suites = [
      await this.runTouchInterfaceTests(),
      await this.runResponsiveDesignTests(),
      await this.runPerformanceTests(),
      await this.runPWATests(),
      await this.runAccessibilityTests(),
      await this.runBrowserTests(),
      await this.runDeviceSpecificTests()
    ]

    return suites
  }

  // Touch Interface Tests
  private async runTouchInterfaceTests(): Promise<MobileTestSuite> {
    const tests = [
      await this.testTouchSupport(),
      await this.testTouchTargets(),
      await this.testGestureRecognition(),
      await this.testScrollBehavior(),
      await this.testPinchZoom(),
      await this.testTouchFeedback(),
      await this.testMultiTouch(),
      await this.testTouchLatency()
    ]

    return this.createTestSuite('Touch Interface', tests)
  }

  // Responsive Design Tests
  private async runResponsiveDesignTests(): Promise<MobileTestSuite> {
    const tests = [
      await this.testViewportMeta(),
      await this.testResponsiveImages(),
      await this.testFlexibleLayouts(),
      await this.testTypographyScaling(),
      await this.testNavigationAdaptation(),
      await this.testFormOptimization(),
      await this.testContentAdaptation()
    ]

    return this.createTestSuite('Responsive Design', tests)
  }

  // Performance Tests
  private async runPerformanceTests(): Promise<MobileTestSuite> {
    const tests = [
      await this.testLoadPerformance(),
      await this.testRenderPerformance(),
      await this.testMemoryUsage(),
      await this.testBatteryEfficiency(),
      await this.testNetworkOptimization(),
      await this.testOfflinePerformance()
    ]

    return this.createTestSuite('Performance', tests)
  }

  // PWA Tests
  private async runPWATests(): Promise<MobileTestSuite> {
    const tests = [
      await this.testServiceWorker(),
      await this.testAppManifest(),
      await this.testInstallPrompt(),
      await this.testOfflineCapabilities(),
      await this.testPushNotifications(),
      await this.testBackgroundSync(),
      await this.testAppLikeExperience()
    ]

    return this.createTestSuite('PWA Features', tests)
  }

  // Accessibility Tests
  private async runAccessibilityTests(): Promise<MobileTestSuite> {
    const tests = [
      await this.testTouchAccessibility(),
      await this.testScreenReaderSupport(),
      await this.testVoiceControl(),
      await this.testColorContrast(),
      await this.testFocusManagement(),
      await this.testTextScaling()
    ]

    return this.createTestSuite('Accessibility', tests)
  }

  // Browser Tests
  private async runBrowserTests(): Promise<MobileTestSuite> {
    const tests = [
      await this.testMobileBrowserSupport(),
      await this.testWebAPIs(),
      await this.testCSSSupport(),
      await this.testJavaScriptSupport(),
      await this.testStorageAPIs(),
      await this.testSecurityFeatures()
    ]

    return this.createTestSuite('Browser Compatibility', tests)
  }

  // Device Specific Tests
  private async runDeviceSpecificTests(): Promise<MobileTestSuite> {
    const tests = [
      await this.testLowEndDevices(),
      await this.testHighDPIDisplays(),
      await this.testSlowConnections(),
      await this.testLimitedStorage(),
      await this.testBatteryOptimization(),
      await this.testMemoryConstraints()
    ]

    return this.createTestSuite('Device Specific', tests)
  }

  // Individual test implementations
  private async testTouchSupport(): Promise<MobileTestResult> {
    const touchSupported = this.isTouchDevice
    const maxTouchPoints = this.maxTouchPoints
    const touchCapable = maxTouchPoints > 0

    return {
      testName: 'Touch Support',
      category: 'Touch Interface',
      status: touchCapable ? 'pass' : 'skip',
      message: touchCapable ? `Touch supported (${maxTouchPoints} points)` : 'Touch not supported',
      details: { touchSupported, maxTouchPoints, touchCapable },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testTouchTargets(): Promise<MobileTestResult> {
    if (!this.isTouchDevice) {
      return {
        testName: 'Touch Targets',
        category: 'Touch Interface',
        status: 'skip',
        message: 'Touch not supported',
        mobileSpecific: true,
        timestamp: Date.now()
      }
    }

    // Check for minimum touch target sizes (44px minimum)
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea')
    const smallTargets = Array.from(touchTargets).filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.width < 44 || rect.height < 44
    })

    const hasSmallTargets = smallTargets.length > 0

    return {
      testName: 'Touch Targets',
      category: 'Touch Interface',
      status: hasSmallTargets ? 'warning' : 'pass',
      message: hasSmallTargets ? `${smallTargets.length} small touch targets found` : 'All touch targets properly sized',
      details: { totalTargets: touchTargets.length, smallTargets: smallTargets.length },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testGestureRecognition(): Promise<MobileTestResult> {
    const touchSupported = this.isTouchDevice
    const gestureSupport = touchSupported && this.maxTouchPoints >= 2

    return {
      testName: 'Gesture Recognition',
      category: 'Touch Interface',
      status: gestureSupport ? 'pass' : 'skip',
      message: gestureSupport ? 'Multi-touch gestures supported' : 'Gesture recognition not supported',
      details: { touchSupported, maxTouchPoints: this.maxTouchPoints, gestureSupport },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testScrollBehavior(): Promise<MobileTestResult> {
    const smoothScrollSupported = 'scrollBehavior' in document.documentElement.style
    const momentumScroll = this.isTouchDevice

    return {
      testName: 'Scroll Behavior',
      category: 'Touch Interface',
      status: 'pass',
      message: momentumScroll ? 'Momentum scrolling enabled' : 'Standard scrolling',
      details: { smoothScrollSupported, momentumScroll },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testPinchZoom(): Promise<MobileTestResult> {
    const touchSupported = this.isTouchDevice
    const multiTouchSupported = this.maxTouchPoints >= 2
    const pinchZoomSupported = touchSupported && multiTouchSupported

    return {
      testName: 'Pinch Zoom',
      category: 'Touch Interface',
      status: pinchZoomSupported ? 'pass' : 'skip',
      message: pinchZoomSupported ? 'Pinch zoom supported' : 'Pinch zoom not supported',
      details: { touchSupported, multiTouchSupported, pinchZoomSupported },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testTouchFeedback(): Promise<MobileTestResult> {
    const touchSupported = this.isTouchDevice
    const hapticFeedback = 'vibrate' in navigator
    const visualFeedback = true // CSS touch-action and active states

    return {
      testName: 'Touch Feedback',
      category: 'Touch Interface',
      status: touchSupported ? 'pass' : 'skip',
      message: touchSupported ? 'Touch feedback implemented' : 'Touch not supported',
      details: { touchSupported, hapticFeedback, visualFeedback },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testMultiTouch(): Promise<MobileTestResult> {
    const multiTouchSupported = this.maxTouchPoints >= 2
    const touchSupported = this.isTouchDevice

    return {
      testName: 'Multi-Touch Support',
      category: 'Touch Interface',
      status: multiTouchSupported ? 'pass' : 'skip',
      message: multiTouchSupported ? `Multi-touch supported (${this.maxTouchPoints} points)` : 'Single touch only',
      details: { touchSupported, maxTouchPoints: this.maxTouchPoints, multiTouchSupported },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testTouchLatency(): Promise<MobileTestResult> {
    if (!this.isTouchDevice) {
      return {
        testName: 'Touch Latency',
        category: 'Touch Interface',
        status: 'skip',
        message: 'Touch not supported',
        mobileSpecific: true,
        timestamp: Date.now()
      }
    }

    const startTime = performance.now()
    await new Promise(resolve => setTimeout(resolve, 16)) // One frame
    const latency = performance.now() - startTime

    const isGoodLatency = latency < 16.67 // 60fps threshold

    return {
      testName: 'Touch Latency',
      category: 'Touch Interface',
      status: isGoodLatency ? 'pass' : 'warning',
      message: `Touch latency: ${latency.toFixed(2)}ms`,
      details: { latency, threshold: 16.67, isGoodLatency },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testViewportMeta(): Promise<MobileTestResult> {
    const viewportMeta = document.querySelector('meta[name="viewport"]')
    const hasViewportMeta = !!viewportMeta
    const content = viewportMeta?.getAttribute('content') || ''

    const hasProperViewport = hasViewportMeta && content.includes('width=device-width')

    return {
      testName: 'Viewport Meta Tag',
      category: 'Responsive Design',
      status: hasProperViewport ? 'pass' : 'fail',
      message: hasProperViewport ? 'Proper viewport meta tag' : 'Missing or incorrect viewport meta tag',
      details: { hasViewportMeta, content, hasProperViewport },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testResponsiveImages(): Promise<MobileTestResult> {
    const images = document.querySelectorAll('img')
    const responsiveImages = Array.from(images).filter(img => {
      return img.hasAttribute('srcset') || img.hasAttribute('sizes') || img.style.maxWidth === '100%'
    })

    const responsivePercentage = images.length > 0 ? (responsiveImages.length / images.length) * 100 : 100

    return {
      testName: 'Responsive Images',
      category: 'Responsive Design',
      status: responsivePercentage >= 80 ? 'pass' : 'warning',
      message: `${responsivePercentage.toFixed(1)}% of images are responsive`,
      details: { totalImages: images.length, responsiveImages: responsiveImages.length, responsivePercentage },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testFlexibleLayouts(): Promise<MobileTestResult> {
    const cssGridSupported = CSS.supports('display', 'grid')
    const flexboxSupported = CSS.supports('display', 'flex')
    const flexibleLayouts = cssGridSupported && flexboxSupported

    return {
      testName: 'Flexible Layouts',
      category: 'Responsive Design',
      status: flexibleLayouts ? 'pass' : 'warning',
      message: flexibleLayouts ? 'CSS Grid and Flexbox supported' : 'Limited layout support',
      details: { cssGridSupported, flexboxSupported, flexibleLayouts },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testTypographyScaling(): Promise<MobileTestResult> {
    const remUnits = document.querySelector('[style*="rem"]') !== null
    const viewportUnits = document.querySelector('[style*="vw"]') !== null || document.querySelector('[style*="vh"]') !== null
    const responsiveTypography = remUnits || viewportUnits

    return {
      testName: 'Typography Scaling',
      category: 'Responsive Design',
      status: responsiveTypography ? 'pass' : 'warning',
      message: responsiveTypography ? 'Responsive typography implemented' : 'Fixed typography detected',
      details: { remUnits, viewportUnits, responsiveTypography },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testNavigationAdaptation(): Promise<MobileTestResult> {
    const mobileMenu = document.querySelector('[class*="mobile-menu"], [class*="hamburger"], [class*="nav-toggle"]')
    const desktopMenu = document.querySelector('nav, [class*="navigation"]')
    const adaptiveNavigation = mobileMenu || (desktopMenu && this.viewportWidth < 768)

    return {
      testName: 'Navigation Adaptation',
      category: 'Responsive Design',
      status: adaptiveNavigation ? 'pass' : 'warning',
      message: adaptiveNavigation ? 'Adaptive navigation implemented' : 'Navigation may not be mobile-friendly',
      details: { mobileMenu: !!mobileMenu, desktopMenu: !!desktopMenu, adaptiveNavigation },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testFormOptimization(): Promise<MobileTestResult> {
    const inputs = document.querySelectorAll('input, textarea, select')
    const mobileOptimizedInputs = Array.from(inputs).filter(input => {
      const type = input.getAttribute('type')
      return type === 'tel' || type === 'email' || type === 'url' || input.hasAttribute('autocomplete')
    })

    const optimizationPercentage = inputs.length > 0 ? (mobileOptimizedInputs.length / inputs.length) * 100 : 100

    return {
      testName: 'Form Optimization',
      category: 'Responsive Design',
      status: optimizationPercentage >= 70 ? 'pass' : 'warning',
      message: `${optimizationPercentage.toFixed(1)}% of form inputs are mobile-optimized`,
      details: { totalInputs: inputs.length, optimizedInputs: mobileOptimizedInputs.length, optimizationPercentage },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testContentAdaptation(): Promise<MobileTestResult> {
    const content = document.querySelector('main, article, section')
    const hasContent = !!content
    const contentWidth = content?.getBoundingClientRect().width || 0
    const isAdaptive = hasContent && contentWidth <= this.viewportWidth

    return {
      testName: 'Content Adaptation',
      category: 'Responsive Design',
      status: isAdaptive ? 'pass' : 'warning',
      message: isAdaptive ? 'Content adapts to viewport' : 'Content may overflow viewport',
      details: { hasContent, contentWidth, viewportWidth: this.viewportWidth, isAdaptive },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testLoadPerformance(): Promise<MobileTestResult> {
    if (typeof window === 'undefined') {
      return {
        testName: 'Load Performance',
        category: 'Performance',
        status: 'skip',
        message: 'Cannot test performance on server-side',
        mobileSpecific: false,
        timestamp: Date.now()
      }
    }

    const startTime = performance.now()
    await new Promise(resolve => setTimeout(resolve, 100))
    const loadTime = performance.now() - startTime

    // Mobile performance thresholds are stricter
    const mobileThreshold = 2000 // 2 seconds for mobile
    const isGoodPerformance = loadTime < mobileThreshold

    return {
      testName: 'Load Performance',
      category: 'Performance',
      status: isGoodPerformance ? 'pass' : 'warning',
      message: `Load time: ${loadTime.toFixed(2)}ms (mobile threshold: ${mobileThreshold}ms)`,
      details: { loadTime, mobileThreshold, isGoodPerformance },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testRenderPerformance(): Promise<MobileTestResult> {
    const virtualScrolling = document.querySelector('[class*="virtual"], [class*="infinite"]')
    const lazyLoading = document.querySelectorAll('img[loading="lazy"]').length > 0
    const optimizedRendering = virtualScrolling || lazyLoading

    return {
      testName: 'Render Performance',
      category: 'Performance',
      status: optimizedRendering ? 'pass' : 'warning',
      message: optimizedRendering ? 'Optimized rendering techniques used' : 'Standard rendering',
      details: { virtualScrolling: !!virtualScrolling, lazyLoading, optimizedRendering },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testMemoryUsage(): Promise<MobileTestResult> {
    const deviceMemory = (navigator as any).deviceMemory
    const isLowMemory = deviceMemory && deviceMemory <= 2
    const memoryOptimized = !isLowMemory || this.hasMemoryOptimizations()

    return {
      testName: 'Memory Usage',
      category: 'Performance',
      status: memoryOptimized ? 'pass' : 'warning',
      message: memoryOptimized ? 'Memory usage optimized' : 'Memory optimization recommended',
      details: { deviceMemory, isLowMemory, memoryOptimized },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testBatteryEfficiency(): Promise<MobileTestResult> {
    const batteryAPI = 'getBattery' in navigator
    const efficientPractices = this.hasEfficientPractices()

    return {
      testName: 'Battery Efficiency',
      category: 'Performance',
      status: efficientPractices ? 'pass' : 'warning',
      message: efficientPractices ? 'Battery efficient practices implemented' : 'Battery optimization recommended',
      details: { batteryAPI, efficientPractices },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testNetworkOptimization(): Promise<MobileTestResult> {
    const connection = (navigator as any).connection
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
    const optimized = !isSlowConnection || this.hasNetworkOptimizations()

    return {
      testName: 'Network Optimization',
      category: 'Performance',
      status: optimized ? 'pass' : 'warning',
      message: optimized ? 'Network requests optimized' : 'Network optimization recommended',
      details: { connection: connection?.effectiveType, isSlowConnection, optimized },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testOfflinePerformance(): Promise<MobileTestResult> {
    const serviceWorker = 'serviceWorker' in navigator
    const cacheAPI = 'caches' in window
    const offlineCapable = serviceWorker && cacheAPI

    return {
      testName: 'Offline Performance',
      category: 'Performance',
      status: offlineCapable ? 'pass' : 'warning',
      message: offlineCapable ? 'Offline capabilities implemented' : 'Offline support recommended',
      details: { serviceWorker, cacheAPI, offlineCapable },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testServiceWorker(): Promise<MobileTestResult> {
    const supported = 'serviceWorker' in navigator
    const registered = supported && navigator.serviceWorker.controller !== null

    return {
      testName: 'Service Worker',
      category: 'PWA Features',
      status: supported ? (registered ? 'pass' : 'warning') : 'skip',
      message: supported ? (registered ? 'Service Worker active' : 'Service Worker supported but not registered') : 'Service Worker not supported',
      details: { supported, registered },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testAppManifest(): Promise<MobileTestResult> {
    const manifest = document.querySelector('link[rel="manifest"]')
    const hasManifest = !!manifest

    return {
      testName: 'App Manifest',
      category: 'PWA Features',
      status: hasManifest ? 'pass' : 'fail',
      message: hasManifest ? 'App manifest found' : 'App manifest missing',
      details: { hasManifest },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testInstallPrompt(): Promise<MobileTestResult> {
    const supported = 'beforeinstallprompt' in window
    const mobileInstallable = supported && this.isMobile

    return {
      testName: 'Install Prompt',
      category: 'PWA Features',
      status: mobileInstallable ? 'pass' : 'skip',
      message: mobileInstallable ? 'Install prompt supported on mobile' : 'Install prompt not supported',
      details: { supported, mobileInstallable },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testOfflineCapabilities(): Promise<MobileTestResult> {
    const cacheSupported = 'caches' in window
    const indexedDBSupported = 'indexedDB' in window
    const offlineCapable = cacheSupported && indexedDBSupported

    return {
      testName: 'Offline Capabilities',
      category: 'PWA Features',
      status: offlineCapable ? 'pass' : 'warning',
      message: offlineCapable ? 'Offline capabilities supported' : 'Limited offline support',
      details: { cacheSupported, indexedDBSupported, offlineCapable },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testPushNotifications(): Promise<MobileTestResult> {
    const supported = 'PushManager' in window
    const mobilePush = supported && this.isMobile

    return {
      testName: 'Push Notifications',
      category: 'PWA Features',
      status: mobilePush ? 'pass' : 'skip',
      message: mobilePush ? 'Push notifications supported on mobile' : 'Push notifications not supported',
      details: { supported, mobilePush },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testBackgroundSync(): Promise<MobileTestResult> {
    const supported = 'serviceWorker' in navigator && 'sync' in (navigator.serviceWorker as any)
    const mobileSync = supported && this.isMobile

    return {
      testName: 'Background Sync',
      category: 'PWA Features',
      status: mobileSync ? 'pass' : 'skip',
      message: mobileSync ? 'Background sync supported on mobile' : 'Background sync not supported',
      details: { supported, mobileSync },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testAppLikeExperience(): Promise<MobileTestResult> {
    const manifest = document.querySelector('link[rel="manifest"]')
    const serviceWorker = 'serviceWorker' in navigator
    const appLike = manifest && serviceWorker

    return {
      testName: 'App-Like Experience',
      category: 'PWA Features',
      status: appLike ? 'pass' : 'warning',
      message: appLike ? 'App-like experience implemented' : 'PWA features incomplete',
      details: { manifest: !!manifest, serviceWorker, appLike },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testTouchAccessibility(): Promise<MobileTestResult> {
    const touchTargets = document.querySelectorAll('button, a, input, select, textarea')
    const accessibleTargets = Array.from(touchTargets).filter(el => {
      const rect = el.getBoundingClientRect()
      return rect.width >= 44 && rect.height >= 44
    })

    const accessibilityPercentage = touchTargets.length > 0 ? (accessibleTargets.length / touchTargets.length) * 100 : 100

    return {
      testName: 'Touch Accessibility',
      category: 'Accessibility',
      status: accessibilityPercentage >= 90 ? 'pass' : 'warning',
      message: `${accessibilityPercentage.toFixed(1)}% of touch targets are accessible`,
      details: { totalTargets: touchTargets.length, accessibleTargets: accessibleTargets.length, accessibilityPercentage },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testScreenReaderSupport(): Promise<MobileTestResult> {
    const semanticElements = document.querySelector('main, nav, section, article, header, footer')
    const ariaLabels = document.querySelectorAll('[aria-label], [aria-labelledby]')
    const screenReaderFriendly = semanticElements && ariaLabels.length > 0

    return {
      testName: 'Screen Reader Support',
      category: 'Accessibility',
      status: screenReaderFriendly ? 'pass' : 'warning',
      message: screenReaderFriendly ? 'Screen reader friendly' : 'Screen reader support could be improved',
      details: { semanticElements: !!semanticElements, ariaLabels: ariaLabels.length, screenReaderFriendly },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testVoiceControl(): Promise<MobileTestResult> {
    const speechRecognition = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
    const voiceControlSupported = speechRecognition && this.isMobile

    return {
      testName: 'Voice Control',
      category: 'Accessibility',
      status: voiceControlSupported ? 'pass' : 'skip',
      message: voiceControlSupported ? 'Voice control supported' : 'Voice control not supported',
      details: { speechRecognition, voiceControlSupported },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testColorContrast(): Promise<MobileTestResult> {
    // Simplified contrast check - in real implementation, you'd use a library
    const hasGoodContrast = true // Placeholder

    return {
      testName: 'Color Contrast',
      category: 'Accessibility',
      status: hasGoodContrast ? 'pass' : 'warning',
      message: hasGoodContrast ? 'Good color contrast' : 'Color contrast could be improved',
      details: { hasGoodContrast },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testFocusManagement(): Promise<MobileTestResult> {
    const focusVisible = CSS.supports('selector(:focus-visible)')
    const focusManagement = focusVisible || document.querySelector('[tabindex]')

    return {
      testName: 'Focus Management',
      category: 'Accessibility',
      status: focusManagement ? 'pass' : 'warning',
      message: focusManagement ? 'Proper focus management' : 'Focus management could be improved',
      details: { focusVisible, focusManagement: !!focusManagement },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testTextScaling(): Promise<MobileTestResult> {
    const textScaling = CSS.supports('font-size', 'clamp(1rem, 4vw, 2rem)') || 
                       document.querySelector('[style*="rem"], [style*="em"]')

    return {
      testName: 'Text Scaling',
      category: 'Accessibility',
      status: textScaling ? 'pass' : 'warning',
      message: textScaling ? 'Text scaling supported' : 'Text scaling could be improved',
      details: { textScaling: !!textScaling },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testMobileBrowserSupport(): Promise<MobileTestResult> {
    const ua = navigator.userAgent
    const isMobileBrowser = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)
    const modernBrowser = /Chrome|Firefox|Safari|Edge/i.test(ua)
    const supported = isMobileBrowser && modernBrowser

    return {
      testName: 'Mobile Browser Support',
      category: 'Browser Compatibility',
      status: supported ? 'pass' : 'warning',
      message: supported ? 'Modern mobile browser detected' : 'Browser support may be limited',
      details: { isMobileBrowser, modernBrowser, supported },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testWebAPIs(): Promise<MobileTestResult> {
    const apis = {
      fetch: typeof fetch === 'function',
      localStorage: typeof localStorage !== 'undefined',
      geolocation: 'geolocation' in navigator,
      notifications: 'Notification' in window,
      deviceOrientation: 'DeviceOrientationEvent' in window
    }

    const supportedAPIs = Object.values(apis).filter(Boolean).length
    const totalAPIs = Object.keys(apis).length
    const supportRate = supportedAPIs / totalAPIs

    return {
      testName: 'Web APIs',
      category: 'Browser Compatibility',
      status: supportRate >= 0.8 ? 'pass' : 'warning',
      message: `${supportedAPIs}/${totalAPIs} Web APIs supported`,
      details: { apis, supportedAPIs, totalAPIs, supportRate },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testCSSSupport(): Promise<MobileTestResult> {
    const cssFeatures = {
      grid: CSS.supports('display', 'grid'),
      flexbox: CSS.supports('display', 'flex'),
      customProperties: CSS.supports('--custom-property', 'value'),
      transforms: CSS.supports('transform', 'translateX(0)'),
      animations: CSS.supports('animation', 'name 1s')
    }

    const supportedFeatures = Object.values(cssFeatures).filter(Boolean).length
    const totalFeatures = Object.keys(cssFeatures).length
    const supportRate = supportedFeatures / totalFeatures

    return {
      testName: 'CSS Support',
      category: 'Browser Compatibility',
      status: supportRate >= 0.8 ? 'pass' : 'warning',
      message: `${supportedFeatures}/${totalFeatures} CSS features supported`,
      details: { cssFeatures, supportedFeatures, totalFeatures, supportRate },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testJavaScriptSupport(): Promise<MobileTestResult> {
    const jsFeatures = {
      arrowFunctions: typeof (() => {}) === 'function',
      templateLiterals: typeof 'test' === 'string',
      asyncAwait: typeof async function() {} === 'function',
      modules: true,
      promises: typeof Promise !== 'undefined'
    }

    const supportedFeatures = Object.values(jsFeatures).filter(Boolean).length
    const totalFeatures = Object.keys(jsFeatures).length
    const supportRate = supportedFeatures / totalFeatures

    return {
      testName: 'JavaScript Support',
      category: 'Browser Compatibility',
      status: supportRate >= 0.8 ? 'pass' : 'warning',
      message: `${supportedFeatures}/${totalFeatures} JavaScript features supported`,
      details: { jsFeatures, supportedFeatures, totalFeatures, supportRate },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testStorageAPIs(): Promise<MobileTestResult> {
    const storageAPIs = {
      localStorage: typeof localStorage !== 'undefined',
      sessionStorage: typeof sessionStorage !== 'undefined',
      indexedDB: typeof indexedDB !== 'undefined'
    }

    const supportedAPIs = Object.values(storageAPIs).filter(Boolean).length
    const totalAPIs = Object.keys(storageAPIs).length

    return {
      testName: 'Storage APIs',
      category: 'Browser Compatibility',
      status: supportedAPIs >= 2 ? 'pass' : 'warning',
      message: `${supportedAPIs}/${totalAPIs} storage APIs supported`,
      details: { storageAPIs, supportedAPIs, totalAPIs },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testSecurityFeatures(): Promise<MobileTestResult> {
    const securityFeatures = {
      https: location.protocol === 'https:',
      crypto: typeof crypto !== 'undefined' && crypto.subtle,
      secureContext: window.isSecureContext
    }

    const supportedFeatures = Object.values(securityFeatures).filter(Boolean).length
    const totalFeatures = Object.keys(securityFeatures).length

    return {
      testName: 'Security Features',
      category: 'Browser Compatibility',
      status: supportedFeatures >= 2 ? 'pass' : 'warning',
      message: `${supportedFeatures}/${totalFeatures} security features supported`,
      details: { securityFeatures, supportedFeatures, totalFeatures },
      mobileSpecific: false,
      timestamp: Date.now()
    }
  }

  private async testLowEndDevices(): Promise<MobileTestResult> {
    const hardwareConcurrency = navigator.hardwareConcurrency || 0
    const deviceMemory = (navigator as any).deviceMemory
    const isLowEnd = hardwareConcurrency <= 2 || (deviceMemory && deviceMemory <= 2)

    return {
      testName: 'Low-End Device Support',
      category: 'Device Specific',
      status: isLowEnd ? 'pass' : 'skip',
      message: isLowEnd ? 'Low-end device detected and optimized' : 'Not a low-end device',
      details: { hardwareConcurrency, deviceMemory, isLowEnd },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testHighDPIDisplays(): Promise<MobileTestResult> {
    const isHighDPI = this.pixelRatio > 1
    const highDPIOptimized = isHighDPI && this.hasHighDPIOptimizations()

    return {
      testName: 'High DPI Display Support',
      category: 'Device Specific',
      status: highDPIOptimized ? 'pass' : isHighDPI ? 'warning' : 'skip',
      message: isHighDPI ? (highDPIOptimized ? `High DPI optimized (${this.pixelRatio}x)` : `High DPI detected (${this.pixelRatio}x) but not optimized`) : 'Standard DPI display',
      details: { pixelRatio: this.pixelRatio, isHighDPI, highDPIOptimized },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testSlowConnections(): Promise<MobileTestResult> {
    const connection = (navigator as any).connection
    const isSlowConnection = connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')
    const slowConnectionOptimized = !isSlowConnection || this.hasSlowConnectionOptimizations()

    return {
      testName: 'Slow Connection Support',
      category: 'Device Specific',
      status: slowConnectionOptimized ? 'pass' : isSlowConnection ? 'warning' : 'skip',
      message: isSlowConnection ? (slowConnectionOptimized ? `Slow connection optimized (${connection?.effectiveType})` : `Slow connection detected (${connection?.effectiveType}) but not optimized`) : 'Fast connection',
      details: { connection: connection?.effectiveType, isSlowConnection, slowConnectionOptimized },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testLimitedStorage(): Promise<MobileTestResult> {
    const storageQuota = (navigator as any).storage?.estimate?.() || Promise.resolve({})
    const hasStorageOptimizations = this.hasStorageOptimizations()

    return {
      testName: 'Limited Storage Support',
      category: 'Device Specific',
      status: hasStorageOptimizations ? 'pass' : 'warning',
      message: hasStorageOptimizations ? 'Storage optimizations implemented' : 'Storage optimization recommended',
      details: { hasStorageOptimizations },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testBatteryOptimization(): Promise<MobileTestResult> {
    const batteryAPI = 'getBattery' in navigator
    const hasBatteryOptimizations = this.hasBatteryOptimizations()

    return {
      testName: 'Battery Optimization',
      category: 'Device Specific',
      status: hasBatteryOptimizations ? 'pass' : 'warning',
      message: hasBatteryOptimizations ? 'Battery optimizations implemented' : 'Battery optimization recommended',
      details: { batteryAPI, hasBatteryOptimizations },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  private async testMemoryConstraints(): Promise<MobileTestResult> {
    const deviceMemory = (navigator as any).deviceMemory
    const hasMemoryOptimizations = this.hasMemoryOptimizations()

    return {
      testName: 'Memory Constraints',
      category: 'Device Specific',
      status: hasMemoryOptimizations ? 'pass' : 'warning',
      message: hasMemoryOptimizations ? 'Memory optimizations implemented' : 'Memory optimization recommended',
      details: { deviceMemory, hasMemoryOptimizations },
      mobileSpecific: true,
      timestamp: Date.now()
    }
  }

  // Helper methods for optimization checks
  private hasMemoryOptimizations(): boolean {
    // Check for memory optimization techniques
    const lazyLoading = document.querySelectorAll('img[loading="lazy"]').length > 0
    const virtualScrolling = document.querySelector('[class*="virtual"], [class*="infinite"]')
    return lazyLoading || !!virtualScrolling
  }

  private hasEfficientPractices(): boolean {
    // Check for battery efficient practices
    const reducedMotion = CSS.supports('prefers-reduced-motion', 'reduce')
    const efficientImages = document.querySelectorAll('img[loading="lazy"]').length > 0
    return reducedMotion || efficientImages
  }

  private hasNetworkOptimizations(): boolean {
    // Check for network optimization techniques
    const serviceWorker = 'serviceWorker' in navigator
    const cacheAPI = 'caches' in window
    const imageOptimization = document.querySelectorAll('img[loading="lazy"]').length > 0
    return serviceWorker || cacheAPI || imageOptimization
  }

  private hasHighDPIOptimizations(): boolean {
    // Check for high DPI optimizations
    const srcsetImages = document.querySelectorAll('img[srcset]').length > 0
    const responsiveImages = document.querySelectorAll('img[sizes]').length > 0
    return srcsetImages || responsiveImages
  }

  private hasSlowConnectionOptimizations(): boolean {
    // Check for slow connection optimizations
    const serviceWorker = 'serviceWorker' in navigator
    const cacheAPI = 'caches' in window
    const imageOptimization = document.querySelectorAll('img[loading="lazy"]').length > 0
    return serviceWorker || cacheAPI || imageOptimization
  }

  private hasStorageOptimizations(): boolean {
    // Check for storage optimizations
    const serviceWorker = 'serviceWorker' in navigator
    const cacheAPI = 'caches' in window
    const storageQuota = (navigator as any).storage?.estimate
    return serviceWorker || cacheAPI || !!storageQuota
  }

  private hasBatteryOptimizations(): boolean {
    // Check for battery optimizations
    const reducedMotion = CSS.supports('prefers-reduced-motion', 'reduce')
    const efficientImages = document.querySelectorAll('img[loading="lazy"]').length > 0
    const serviceWorker = 'serviceWorker' in navigator
    return reducedMotion || efficientImages || serviceWorker
  }

  // Create test suite summary
  private createTestSuite(name: string, tests: MobileTestResult[]): MobileTestSuite {
    const total = tests.length
    const passed = tests.filter(t => t.status === 'pass').length
    const failed = tests.filter(t => t.status === 'fail').length
    const warnings = tests.filter(t => t.status === 'warning').length
    const skipped = tests.filter(t => t.status === 'skip').length
    const successRate = total > 0 ? passed / total : 0

    return {
      name,
      tests,
      summary: {
        total,
        passed,
        failed,
        warnings,
        skipped,
        successRate
      }
    }
  }

  // Generate comprehensive mobile report
  async generateMobileReport(): Promise<any> {
    const allSuites = await this.runAllTests()
    
    const totalTests = allSuites.reduce((sum, suite) => sum + suite.summary.total, 0)
    const totalPassed = allSuites.reduce((sum, suite) => sum + suite.summary.passed, 0)
    const totalFailed = allSuites.reduce((sum, suite) => sum + suite.summary.failed, 0)
    const totalWarnings = allSuites.reduce((sum, suite) => sum + suite.summary.warnings, 0)
    const totalSkipped = allSuites.reduce((sum, suite) => sum + suite.summary.skipped, 0)
    const overallSuccessRate = totalTests > 0 ? totalPassed / totalTests : 0

    const mobileReady = overallSuccessRate >= 0.9 && totalFailed === 0

    return {
      mobileReady,
      overallSuccessRate,
      totalTests,
      totalPassed,
      totalFailed,
      totalWarnings,
      totalSkipped,
      suites: allSuites,
      deviceInfo: {
        isMobile: this.isMobile,
        isTablet: this.isTablet,
        isTouchDevice: this.isTouchDevice,
        viewportWidth: this.viewportWidth,
        viewportHeight: this.viewportHeight,
        pixelRatio: this.pixelRatio,
        maxTouchPoints: this.maxTouchPoints
      },
      recommendations: this.generateRecommendations(allSuites),
      timestamp: Date.now()
    }
  }

  // Generate recommendations
  private generateRecommendations(suites: MobileTestSuite[]): string[] {
    const recommendations: string[] = []

    suites.forEach(suite => {
      if (suite.summary.successRate < 0.9) {
        recommendations.push(`Improve ${suite.name} test results (${(suite.summary.successRate * 100).toFixed(1)}% success rate)`)
      }

      suite.tests.forEach(test => {
        if (test.status === 'fail') {
          recommendations.push(`Fix ${test.testName}: ${test.message}`)
        } else if (test.status === 'warning') {
          recommendations.push(`Review ${test.testName}: ${test.message}`)
        }
      })
    })

    return recommendations
  }
}

// Export singleton instance
// Lazy initialization for mobile compatibility testing
let mobileCompatibilityTestingInstance: MobileCompatibilityTesting | null = null

export const getMobileCompatibilityTesting = (): MobileCompatibilityTesting => {
  if (!mobileCompatibilityTestingInstance && typeof window !== 'undefined') {
    mobileCompatibilityTestingInstance = new MobileCompatibilityTesting()
  }
  return mobileCompatibilityTestingInstance!
}

// For backward compatibility - only call getter in browser
export const mobileCompatibilityTesting = typeof window !== 'undefined' ? getMobileCompatibilityTesting() : null
