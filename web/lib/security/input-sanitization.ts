/**
 * Input Sanitization Utilities
 * 
 * Comprehensive input sanitization and validation for security
 * 
 * Created: January 26, 2025
 * Status: ✅ PRODUCTION
 */

/**
 * Sanitize text input to prevent XSS attacks
 */
export function sanitizeText(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  return input
    // Remove script tags and content
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove javascript: protocol
    .replace(/javascript:/gi, '')
    // Remove event handlers (onclick, onerror, etc.)
    .replace(/on\w+\s*=/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Remove object/embed tags
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove data URLs that could contain scripts
    .replace(/data:text\/html/gi, '')
    // Trim whitespace
    .trim();
}

/**
 * Sanitize HTML content (allows safe HTML, removes dangerous elements)
 */
export function sanitizeHTML(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }

  const sanitized = sanitizeText(input);
  
  // Additional HTML-specific sanitization
  return sanitized
    // Remove potentially dangerous attributes
    .replace(/\s*(href|src|action)\s*=\s*["']?javascript:/gi, '')
    // Remove dangerous protocols
    .replace(/src\s*=\s*["']?data:/gi, 'src="')
    .trim();
}

/**
 * Validate and sanitize message content
 */
export function sanitizeMessageContent(content: string, maxLength: number = 10000): {
  sanitized: string;
  isValid: boolean;
  error?: string;
} {
  if (!content || typeof content !== 'string') {
    return {
      sanitized: '',
      isValid: false,
      error: 'Message content is required',
    };
  }

  if (content.length > maxLength) {
    return {
      sanitized: '',
      isValid: false,
      error: `Message content is too long (max ${maxLength} characters)`,
    };
  }

  const sanitized = sanitizeText(content);

  // Check for suspicious patterns after sanitization
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /data:text\/html/i,
  ];

  for (const pattern of suspiciousPatterns) {
    if (pattern.test(sanitized)) {
      return {
        sanitized: '',
        isValid: false,
        error: 'Message contains potentially dangerous content',
      };
    }
  }

  return {
    sanitized,
    isValid: true,
  };
}

/**
 * Validate and sanitize subject line
 */
export function sanitizeSubject(subject: string, maxLength: number = 200): {
  sanitized: string;
  isValid: boolean;
  error?: string;
} {
  if (!subject || typeof subject !== 'string') {
    return {
      sanitized: '',
      isValid: false,
      error: 'Subject is required',
    };
  }

  if (subject.length > maxLength) {
    return {
      sanitized: '',
      isValid: false,
      error: `Subject is too long (max ${maxLength} characters)`,
    };
  }

  const sanitized = sanitizeText(subject);

  // Subjects should not contain HTML
  if (sanitized !== subject.replace(/<[^>]*>/g, '')) {
    return {
      sanitized: sanitized.replace(/<[^>]*>/g, ''),
      isValid: true,
    };
  }

  return {
    sanitized,
    isValid: true,
  };
}

/**
 * Validate representative ID (must be a valid integer)
 */
export function validateRepresentativeId(id: unknown): {
  isValid: boolean;
  parsedId?: number;
  error?: string;
} {
  if (typeof id === 'number') {
    if (id <= 0 || !Number.isInteger(id)) {
      return {
        isValid: false,
        error: 'Representative ID must be a positive integer',
      };
    }
    return {
      isValid: true,
      parsedId: id,
    };
  }

  if (typeof id === 'string') {
    const parsed = parseInt(id, 10);
    if (isNaN(parsed) || parsed <= 0 || parsed.toString() !== id.trim()) {
      return {
        isValid: false,
        error: 'Representative ID must be a valid positive integer',
      };
    }
    return {
      isValid: true,
      parsedId: parsed,
    };
  }

  return {
    isValid: false,
    error: 'Representative ID must be a number',
  };
}

/**
 * Validate thread ID (must be a valid UUID or null)
 */
export function validateThreadId(threadId: unknown): {
  isValid: boolean;
  parsedId?: string;
  error?: string;
} {
  if (threadId === null || threadId === undefined || threadId === '') {
    return {
      isValid: true,
      parsedId: undefined,
    };
  }

  if (typeof threadId !== 'string') {
    return {
      isValid: false,
      error: 'Thread ID must be a string',
    };
  }

  // UUID v4 format validation
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(threadId)) {
    return {
      isValid: false,
      error: 'Thread ID must be a valid UUID',
    };
  }

  return {
    isValid: true,
    parsedId: threadId,
  };
}

/**
 * Validate priority value
 */
export function validatePriority(priority: unknown): {
  isValid: boolean;
  parsedPriority?: 'low' | 'normal' | 'high' | 'urgent';
  error?: string;
} {
  const validPriorities = ['low', 'normal', 'high', 'urgent'] as const;
  
  if (typeof priority !== 'string') {
    return {
      isValid: false,
      error: 'Priority must be a string',
    };
  }

  if (!validPriorities.includes(priority as typeof validPriorities[number])) {
    return {
      isValid: false,
      error: `Priority must be one of: ${validPriorities.join(', ')}`,
    };
  }

  return {
    isValid: true,
    parsedPriority: priority as typeof validPriorities[number],
  };
}

/**
 * Validate message type
 */
export function validateMessageType(messageType: unknown): {
  isValid: boolean;
  parsedType?: 'text' | 'email' | 'attachment';
  error?: string;
} {
  const validTypes = ['text', 'email', 'attachment'] as const;
  
  if (typeof messageType !== 'string') {
    return {
      isValid: false,
      error: 'Message type must be a string',
    };
  }

  if (!validTypes.includes(messageType as typeof validTypes[number])) {
    return {
      isValid: false,
      error: `Message type must be one of: ${validTypes.join(', ')}`,
    };
  }

  return {
    isValid: true,
    parsedType: messageType as typeof validTypes[number],
  };
}

