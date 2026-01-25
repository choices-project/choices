/**
 * Contact Validation Utilities
 *
 * Validation and normalization for contact information submissions.
 * Reuses validation logic from backend ingestion for consistency.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

/**
 * Basic email validation
 */
function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const trimmed = email.trim();
  if (trimmed.length === 0) return false;
  // Basic email regex - matches most valid email formats
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(trimmed);
}

/**
 * Basic phone validation
 * Accepts various formats: (123) 456-7890, 123-456-7890, 123.456.7890, +1 123 456 7890, etc.
 */
function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== 'string') return false;
  const trimmed = phone.trim();
  if (trimmed.length === 0) return false;
  // Remove common phone formatting characters
  const digitsOnly = trimmed.replace(/[\s\-\(\)\.\+]/g, '');
  // Must have 10-15 digits (allowing international formats)
  return /^\d{10,15}$/.test(digitsOnly);
}

/**
 * Basic address validation
 * Ensures address is not empty and has reasonable length
 */
function isValidAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();
  if (trimmed.length < 5) return false; // Minimum reasonable address length
  if (trimmed.length > 500) return false; // Maximum reasonable address length
  return true;
}

export type ContactType = 'email' | 'phone' | 'fax' | 'address';

export type ContactValidationResult = {
  isValid: boolean;
  normalized?: string;
  error?: string;
};

/**
 * Validate and normalize contact value based on type
 */
export function validateAndNormalizeContact(
  contactType: ContactType | string,
  value: string
): ContactValidationResult {
  if (!value || typeof value !== 'string') {
    return { isValid: false, error: 'Contact value is required' };
  }

  const trimmed = value.trim();
  if (trimmed.length === 0) {
    return { isValid: false, error: 'Contact value cannot be empty' };
  }

  switch (contactType.toLowerCase()) {
    case 'email':
      if (!isValidEmail(trimmed)) {
        return { isValid: false, error: 'Invalid email format' };
      }
      return { isValid: true, normalized: trimmed.toLowerCase() };
    
    case 'phone':
    case 'fax':
      if (!isValidPhone(trimmed)) {
        return { isValid: false, error: 'Invalid phone/fax format' };
      }
      // Normalize phone: remove formatting, keep digits and +
      const normalized = trimmed.replace(/[\s\-\(\)\.]/g, '').replace(/^\+?1/, '');
      return { isValid: true, normalized };
    
    case 'address':
      if (!isValidAddress(trimmed)) {
        return { isValid: false, error: 'Invalid address format' };
      }
      return { isValid: true, normalized: trimmed };
    
    default:
      return { isValid: true, normalized: trimmed };
  }
}

/**
 * Validate contact type
 */
export function validateContactType(type: string): type is ContactType {
  const validTypes: ContactType[] = ['email', 'phone', 'fax', 'address'];
  return validTypes.includes(type.toLowerCase() as ContactType);
}
