/**
 * Hardened Share URL Builder
 * 
 * Creates platform-specific share URLs with proper encoding and security.
 * All URLs are validated and sanitized before generation.
 */

export type SharePlatform =
  | 'x' | 'facebook' | 'linkedin' | 'reddit'
  | 'whatsapp' | 'telegram' | 'email' | 'sms'

export type ShareInput = {
  url: string           // canonical https URL
  text?: string | undefined         // short copy
  hashtags?: string[] | undefined   // no '#'
  via?: string | undefined          // x username w/o @
}

const enc = encodeURIComponent

/**
 * Builds platform-specific share URLs with proper encoding and validation
 */
export function buildShareUrl(p: SharePlatform, i: ShareInput): string {
  const url = new URL(i.url)
  // enforce https + strip dangerous fragments
  url.protocol = 'https:'
  url.hash = ''
  const base = url.toString()

  switch (p) {
    case 'x': {
      const qs = new URLSearchParams()
      if (i.text) qs.set('text', i.text)
      qs.set('url', base)
      if (i.via) qs.set('via', i.via.replace(/^@/, ''))
      if (i.hashtags?.length) qs.set('hashtags', i.hashtags.join(','))
      return `https://twitter.com/intent/tweet?${qs.toString()}`
    }
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${enc(base)}`
    case 'linkedin': {
      const qs = new URLSearchParams({ url: base })
      if (i.text) qs.set('summary', i.text)
      return `https://www.linkedin.com/sharing/share-offsite/?${qs.toString()}`
    }
    case 'reddit': {
      const qs = new URLSearchParams({ url: base })
      if (i.text) qs.set('title', i.text)
      return `https://www.reddit.com/submit?${qs.toString()}`
    }
    case 'whatsapp': {
      const message = [i.text, base].filter(Boolean).join(' – ')
      return `https://api.whatsapp.com/send?text=${enc(message)}`
    }
    case 'telegram': {
      const qs = new URLSearchParams({ url: base })
      if (i.text) qs.set('text', i.text)
      return `https://t.me/share/url?${qs.toString()}`
    }
    case 'email': {
      const subject = i.text ?? 'Check this out'
      const body = [i.text, base].filter(Boolean).join('\n\n')
      return `mailto:?subject=${enc(subject)}&body=${enc(body)}`
    }
    case 'sms': {
      const body = [i.text, base].filter(Boolean).join(' – ')
      // Comma vs ?body varies; this form is broadly supported
      return `sms:&body=${enc(body)}`
    }
  }
}

/**
 * Platform-specific share configurations
 */
export const PLATFORM_CONFIG = {
  x: {
    name: 'X (Twitter)',
    icon: 'x',
    color: '#000000',
    maxTextLength: 280,
    supportsHashtags: true,
    supportsVia: true,
  },
  facebook: {
    name: 'Facebook',
    icon: 'facebook',
    color: '#1877F2',
    maxTextLength: 0, // Uses OG tags
    supportsHashtags: false,
    supportsVia: false,
  },
  linkedin: {
    name: 'LinkedIn',
    icon: 'linkedin',
    color: '#0A66C2',
    maxTextLength: 3000,
    supportsHashtags: true,
    supportsVia: false,
  },
  reddit: {
    name: 'Reddit',
    icon: 'reddit',
    color: '#FF4500',
    maxTextLength: 300,
    supportsHashtags: false,
    supportsVia: false,
  },
  whatsapp: {
    name: 'WhatsApp',
    icon: 'message-circle',
    color: '#25D366',
    maxTextLength: 0, // No limit
    supportsHashtags: false,
    supportsVia: false,
  },
  telegram: {
    name: 'Telegram',
    icon: 'send',
    color: '#0088CC',
    maxTextLength: 0, // No limit
    supportsHashtags: false,
    supportsVia: false,
  },
  email: {
    name: 'Email',
    icon: 'mail',
    color: '#EA4335',
    maxTextLength: 0, // No limit
    supportsHashtags: false,
    supportsVia: false,
  },
  sms: {
    name: 'SMS',
    icon: 'smartphone',
    color: '#34B7F1',
    maxTextLength: 160,
    supportsHashtags: false,
    supportsVia: false,
  },
} as const

/**
 * Generates platform-specific share text with length limits
 */
export function generateShareText(
  platform: SharePlatform,
  baseText: string,
  hashtags?: string[],
  via?: string
): string {
  const config = PLATFORM_CONFIG[platform]
  let text = baseText

  // Add hashtags if supported
  if (config.supportsHashtags && hashtags?.length) {
    const hashtagText = hashtags.map(tag => `#${tag}`).join(' ')
    text = `${text} ${hashtagText}`
  }

  // Add via if supported
  if (config.supportsVia && via) {
    text = `${text} via @${via.replace(/^@/, '')}`
  }

  // Truncate if over limit
  if (config.maxTextLength > 0 && text.length > config.maxTextLength) {
    text = text.substring(0, config.maxTextLength - 3) + '...'
  }

  return text
}

/**
 * Validates share input for security and correctness
 */
export function validateShareInput(input: ShareInput): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  try {
    new URL(input.url)
  } catch {
    errors.push('Invalid URL format')
  }

  if (input.text && input.text.length > 1000) {
    errors.push('Text too long (max 1000 characters)')
  }

  if (input.hashtags && input.hashtags.length > 10) {
    errors.push('Too many hashtags (max 10)')
  }

  if (input.via && !/^@?[a-zA-Z0-9_]+$/.test(input.via)) {
    errors.push('Invalid via username format')
  }

  return {
    valid: errors.length === 0,
    errors
  }
}
