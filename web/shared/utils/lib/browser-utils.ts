import { logger } from '@/lib/logger';
import { safeNavigate } from '@/lib/ssr-safe';
/**
 * Browser detection and compatibility utilities
 */

export interface BrowserInfo {
  name: string
  version: string
  isMobile: boolean
  supportsServerRedirects: boolean
}

/**
 * Detect browser information from user agent
 */
export function detectBrowser(): BrowserInfo {
  if (typeof window === 'undefined') {
    return {
      name: 'unknown',
      version: 'unknown',
      isMobile: false,
      supportsServerRedirects: true
    }
  }

  const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)

  // Detect browser type
  let name = 'unknown'
  let version = 'unknown'

  if (userAgent.includes('Firefox')) {
    name = 'firefox'
    const match = userAgent.match(/Firefox\/(\d+)/)
    version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Chrome') && !userAgent.includes('Edg')) {
    name = 'chrome'
    const match = userAgent.match(/Chrome\/(\d+)/)
    version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Safari') && !userAgent.includes('Chrome')) {
    name = 'safari'
    const match = userAgent.match(/Version\/(\d+)/)
    version = match ? match[1] : 'unknown'
  } else if (userAgent.includes('Edg')) {
    name = 'edge'
    const match = userAgent.match(/Edg\/(\d+)/)
    version = match ? match[1] : 'unknown'
  }

  // Determine server redirect support based on browser and version
  const supportsServerRedirects = determineServerRedirectSupport(name, version, isMobile)

  return {
    name,
    version,
    isMobile,
    supportsServerRedirects
  }
}

/**
 * Determine if browser supports server redirects reliably
 */
function determineServerRedirectSupport(name: string, version: string, _isMobile: boolean): boolean {
  const versionNum = parseInt(version, 10)

  switch (name) {
    case 'safari':
      // Safari (WebKit) supports server redirects well
      return true
    case 'chrome':
      // Chrome has issues with server redirects in some cases
      return versionNum >= 80
    case 'firefox':
      // Firefox has mixed support for server redirects
      return versionNum >= 75
    case 'edge':
      // Edge (Chromium-based) has similar issues to Chrome
      return versionNum >= 80
    default:
      // Default to true for unknown browsers
      return true
  }
}

/**
 * Get browser-specific redirect strategy
 */
export function getRedirectStrategy(): 'server' | 'client' | 'hybrid' {
  const browser = detectBrowser()
  
  if (browser.supportsServerRedirects) {
    return 'server'
  } else if (browser.isMobile) {
    return 'hybrid'
  } else {
    return 'client'
  }
}

/**
 * Browser-specific navigation helper
 */
export function navigateTo(url: string, strategy?: 'server' | 'client' | 'hybrid') {
  const browser = detectBrowser()
  const redirectStrategy = strategy || getRedirectStrategy()

  logger.info('🔍 Browser navigation:', {
    browser: browser.name,
    version: browser.version,
    isMobile: browser.isMobile,
    strategy: redirectStrategy,
    url
  })

  switch (redirectStrategy) {
    case 'server':
      // Use safe navigation for server redirects
      safeNavigate(url)
      break
    case 'client':
      // Use router for client-side navigation
      // This would need to be passed from the component
      safeNavigate(url)
      break
    case 'hybrid':
      // Try server first, fallback to client
      safeNavigate(url)
      break
    default:
      safeNavigate(url)
  }
}

