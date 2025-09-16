/**
 * Security Configuration
 * Centralized security settings and policies
 * 
 * Features:
 * - CSP (Content Security Policy) configuration
 * - Security headers configuration
 * - Rate limiting settings
 * - Request validation rules
 * - Privacy and data protection settings
 * 
 * Created: 2025-08-27
 * Status: Critical security enhancement
 */

// E2E Test Detection
export const IS_E2E =
  process.env.NODE_ENV === 'test' ||
  process.env.E2E === '1' ||
  process.env.PLAYWRIGHT === '1';

export interface SecurityConfig {
  csp: CSPConfig
  headers: SecurityHeaders
  rateLimit: RateLimitConfig
  validation: ValidationConfig
  privacy: PrivacyConfig
}

export interface CSPConfig {
  'default-src': string[]
  'script-src': string[]
  'style-src': string[]
  'font-src': string[]
  'img-src': string[]
  'connect-src': string[]
  'frame-src': string[]
  'object-src': string[]
  'base-uri': string[]
  'form-action': string[]
  'frame-ancestors': string[]
  'upgrade-insecure-requests'?: string[]
}

export interface SecurityHeaders {
  'X-Frame-Options': string
  'X-Content-Type-Options': string
  'X-XSS-Protection': string
  'Referrer-Policy': string
  'Permissions-Policy': string
  'Cross-Origin-Embedder-Policy': string
  'Cross-Origin-Opener-Policy': string
  'Cross-Origin-Resource-Policy': string
}

export interface RateLimitConfig {
  enabled: boolean
  windowMs: number
  maxRequests: number
  sensitiveEndpoints: Record<string, number>
  e2eBypassHeader: string
}

export interface ValidationConfig {
  maxContentLength: number
  allowedContentTypes: string[]
  suspiciousPatterns: RegExp[]
  blockedUserAgents: string[]
}

export interface PrivacyConfig {
  dataRetentionDays: number
  anonymizeIPs: boolean
  logSensitiveData: boolean
  enableDifferentialPrivacy: boolean
}

/**
 * Production security configuration
 */
export const PRODUCTION_SECURITY_CONFIG: SecurityConfig = {
  csp: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      'https://cdn.jsdelivr.net',
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js
      'https://fonts.googleapis.com',
    ],
    'font-src': [
      "'self'",
      'https://fonts.gstatic.com',
      'data:',
    ],
    'img-src': [
      "'self'",
      'data:',
      'https:',
      'blob:',
    ],
    'connect-src': [
      "'self'",
      'https://*.supabase.co',
      'https://api.choices.app',
      'wss://*.supabase.co',
    ],
    'frame-src': ["'none'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  },
  
  headers: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Cross-Origin-Embedder-Policy': 'require-corp',
    'Cross-Origin-Opener-Policy': 'same-origin',
    'Cross-Origin-Resource-Policy': 'same-origin',
  },
  
  rateLimit: {
    enabled: !IS_E2E, // Disabled in E2E tests
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 100,
    sensitiveEndpoints: IS_E2E ? {} : {
      '/api/auth': 10,
      '/register': 5,
      '/login': 10,
      '/api/admin': 20,
    },
    e2eBypassHeader: 'x-e2e-bypass'
  },
  
  validation: {
    maxContentLength: 1024 * 1024, // 1MB
    allowedContentTypes: [
      'application/json',
      'application/x-www-form-urlencoded',
      'multipart/form-data',
    ],
    suspiciousPatterns: [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
      /javascript:/gi, // JavaScript protocol
      /on\w+\s*=/gi, // Event handlers
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, // Iframe tags
    ],
    blockedUserAgents: [
      'sqlmap',
      'nikto',
      'nmap',
      'scanner',
      'bot',
      'crawler',
    ],
  },
  
  privacy: {
    dataRetentionDays: 90,
    anonymizeIPs: true,
    logSensitiveData: false,
    enableDifferentialPrivacy: true,
  },
}

/**
 * Development security configuration (more permissive)
 */
export const DEVELOPMENT_SECURITY_CONFIG: SecurityConfig = {
  ...PRODUCTION_SECURITY_CONFIG,
  csp: {
    ...PRODUCTION_SECURITY_CONFIG.csp,
    'script-src': [
      ...PRODUCTION_SECURITY_CONFIG.csp['script-src'],
      "'unsafe-eval'", // Required for Next.js development
    ],
  },
  rateLimit: {
    ...PRODUCTION_SECURITY_CONFIG.rateLimit,
    maxRequests: 1000, // More permissive in development
  },
  privacy: {
    ...PRODUCTION_SECURITY_CONFIG.privacy,
    logSensitiveData: true, // More logging in development
  },
}

/**
 * Get security configuration based on environment
 */
export function getSecurityConfig(): SecurityConfig {
  return process.env.NODE_ENV === 'production' 
    ? PRODUCTION_SECURITY_CONFIG 
    : DEVELOPMENT_SECURITY_CONFIG
}

/**
 * Build CSP header string from configuration
 */
export function buildCSPHeader(config: CSPConfig): string {
  const directives = Object.entries(config)
    .map(([directive, sources]) => {
      if (Array.isArray(sources) && sources.length > 0) {
        return `${directive} ${sources.join(' ')}`
      } else if (sources.length === 0) {
        return directive
      }
      return ''
    })
    .filter(Boolean)
    .join('; ')
  
  return directives
}

/**
 * Validate content against security patterns
 */
export function validateContent(
  content: string, 
  config: ValidationConfig
): { valid: boolean; reason?: string } {
  // Check content length
  if (content.length > config.maxContentLength) {
    return { valid: false, reason: 'Content too long' }
  }
  
  // Check for suspicious patterns
  for (const pattern of config.suspiciousPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason: 'Suspicious content detected' }
    }
  }
  
  return { valid: true }
}

/**
 * Check if user agent is blocked
 */
export function isBlockedUserAgent(
  userAgent: string, 
  config: ValidationConfig
): boolean {
  const lowerUA = userAgent.toLowerCase()
  return config.blockedUserAgents.some(blocked => 
    lowerUA.includes(blocked.toLowerCase())
  )
}

/**
 * Anonymize IP address for privacy
 */
export function anonymizeIP(ip: string): string {
  if (!ip || ip === 'unknown') return 'unknown'
  
  // IPv4: 192.168.1.1 -> 192.168.1.0
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      return `${parts[0]}.${parts[1]}.${parts[2]}.0`
    }
  }
  
  // IPv6: 2001:db8::1 -> 2001:db8::
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 4) {
      return `${parts[0]}:${parts[1]}:${parts[2]}::`
    }
  }
  
  return ip
}
