/**
 * SSR-Safe Utilities
 * 
 * This file provides utilities to safely handle browser-only code in Next.js SSR environments.
 * It ensures that browser globals are only accessed on the client side.
 */

/**
 * Check if we're running in a browser environment
 */
export const isBrowser = (): boolean => {
  return typeof window !== 'undefined'
}

/**
 * Check if we're running in a server environment
 */
export const isServer = (): boolean => {
  return typeof window === 'undefined'
}

/**
 * Safely access browser globals with fallbacks
 */
export const safeBrowserAccess = {
  /**
   * Safely access window object
   */
  window: (): Window | undefined => {
    return isBrowser() ? window : undefined
  },

  /**
   * Safely access document object
   */
  document: (): Document | undefined => {
    return isBrowser() ? document : undefined
  },

  /**
   * Safely access navigator object
   */
  navigator: (): Navigator | undefined => {
    return isBrowser() ? navigator : undefined
  },

  /**
   * Safely access localStorage
   */
  localStorage: (): Storage | undefined => {
    return isBrowser() ? localStorage : undefined
  },

  /**
   * Safely access sessionStorage
   */
  sessionStorage: (): Storage | undefined => {
    return isBrowser() ? sessionStorage : undefined
  },

  /**
   * Safely access location object
   */
  location: (): Location | undefined => {
    return isBrowser() ? location : undefined
  }
}

/**
 * Execute a function only in browser environment
 */
export const browserOnly = <T>(fn: () => T, fallback?: T): T | undefined => {
  if (isBrowser()) {
    try {
      return fn()
    } catch (error) {
      console.warn('Browser-only function failed:', error)
      return fallback
    }
  }
  return fallback
}

/**
 * Execute a function only in server environment
 */
export const serverOnly = <T>(fn: () => T, fallback?: T): T | undefined => {
  if (isServer()) {
    try {
      return fn()
    } catch (error) {
      console.warn('Server-only function failed:', error)
      return fallback
    }
  }
  return fallback
}

/**
 * Create a hook that only runs on the client
 */
export const useClientOnly = <T>(fn: () => T, fallback?: T): T | undefined => {
  if (typeof window === 'undefined') {
    return fallback
  }
  
  try {
    return fn()
  } catch (error) {
    console.warn('Client-only hook failed:', error)
    return fallback
  }
}

/**
 * Safely get user agent string
 */
export const getUserAgent = (): string => {
  if (isBrowser() && navigator?.userAgent) {
    return typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
  }
  return 'unknown'
}

/**
 * Safely detect if device is mobile
 */
export const isMobileDevice = (): boolean => {
  if (!isBrowser()) {
    return false
  }
  
  const userAgent = getUserAgent()
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
}

/**
 * Safely get screen dimensions
 */
export const getScreenDimensions = (): { width: number; height: number } | null => {
  if (!isBrowser() || !window?.screen) {
    return null
  }
  
  return {
    width: window.screen.width,
    height: window.screen.height
  }
}

/**
 * Safely get viewport dimensions
 */
export const getViewportDimensions = (): { width: number; height: number } | null => {
  if (!isBrowser() || !window?.innerWidth) {
    return null
  }
  
  return {
    width: window.innerWidth,
    height: window.innerHeight
  }
}

/**
 * Safely access localStorage with error handling
 */
export const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null
    
    try {
      return localStorage.getItem(key)
    } catch (error) {
      console.warn('localStorage.getItem failed:', error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isBrowser()) return false
    
    try {
      localStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn('localStorage.setItem failed:', error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    if (!isBrowser()) return false
    
    try {
      localStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('localStorage.removeItem failed:', error)
      return false
    }
  },

  clear: (): boolean => {
    if (!isBrowser()) return false
    
    try {
      localStorage.clear()
      return true
    } catch (error) {
      console.warn('localStorage.clear failed:', error)
      return false
    }
  }
}

/**
 * Safely access sessionStorage with error handling
 */
export const safeSessionStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser()) return null
    
    try {
      return sessionStorage.getItem(key)
    } catch (error) {
      console.warn('sessionStorage.getItem failed:', error)
      return null
    }
  },

  setItem: (key: string, value: string): boolean => {
    if (!isBrowser()) return false
    
    try {
      sessionStorage.setItem(key, value)
      return true
    } catch (error) {
      console.warn('sessionStorage.setItem failed:', error)
      return false
    }
  },

  removeItem: (key: string): boolean => {
    if (!isBrowser()) return false
    
    try {
      sessionStorage.removeItem(key)
      return true
    } catch (error) {
      console.warn('sessionStorage.removeItem failed:', error)
      return false
    }
  },

  clear: (): boolean => {
    if (!isBrowser()) return false
    
    try {
      sessionStorage.clear()
      return true
    } catch (error) {
      console.warn('sessionStorage.clear failed:', error)
      return false
    }
  }
}

/**
 * Safely navigate to a URL
 */
export const safeNavigate = (url: string): boolean => {
  if (!isBrowser() || !window?.location) {
    return false
  }
  
  try {
    const window = safeBrowserAccess.window()
    if (window) {
      window.location.href = url
    }
    return true
  } catch (error) {
    console.warn('Navigation failed:', error)
    return false
  }
}

/**
 * Safely reload the page
 */
export const safeReload = (): boolean => {
  if (!isBrowser() || !window?.location) {
    return false
  }
  
  try {
    const window = safeBrowserAccess.window()
    if (window) {
      window.location.reload()
    }
    return true
  } catch (error) {
    console.warn('Page reload failed:', error)
    return false
  }
}

/**
 * Safely add event listeners
 */
export const safeAddEventListener = (
  element: EventTarget | null,
  event: string,
  handler: EventListener,
  options?: boolean | AddEventListenerOptions
): boolean => {
  if (!isBrowser() || !element) {
    return false
  }
  
  try {
    element.addEventListener(event, handler, options)
    return true
  } catch (error) {
    console.warn('addEventListener failed:', error)
    return false
  }
}

/**
 * Safely remove event listeners
 */
export const safeRemoveEventListener = (
  element: EventTarget | null,
  event: string,
  handler: EventListener,
  options?: boolean | EventListenerOptions
): boolean => {
  if (!isBrowser() || !element) {
    return false
  }
  
  try {
    element.removeEventListener(event, handler, options)
    return true
  } catch (error) {
    console.warn('removeEventListener failed:', error)
    return false
  }
}
