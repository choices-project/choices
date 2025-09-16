// ============================================================================
// PHASE 3: SCREEN READER SUPPORT
// ============================================================================
// Agent A3 - UX/Accessibility Specialist
// 
// This module provides comprehensive screen reader support for the
// Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Dynamic screen reader announcements
// - Live region management
// - Focus management
// - ARIA attribute helpers
// - Accessibility event handling
// 
// Created: January 15, 2025
// Status: Phase 3 Implementation
// ============================================================================

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ScreenReaderAnnouncement {
  message: string;
  priority: 'polite' | 'assertive';
  duration?: number;
  id?: string;
}

export interface FocusManagement {
  element: HTMLElement;
  previousElement?: HTMLElement;
  restoreFocus?: boolean;
}

export interface ARIAState {
  expanded?: boolean;
  selected?: boolean;
  checked?: boolean;
  disabled?: boolean;
  hidden?: boolean;
  invalid?: boolean;
  required?: boolean;
}

// ============================================================================
// SCREEN READER SUPPORT MANAGER
// ============================================================================

export class ScreenReaderSupport {
  private static announcementQueue: ScreenReaderAnnouncement[] = [];
  private static isProcessingQueue = false;
  private static liveRegions: Map<string, HTMLElement> = new Map();
  private static focusHistory: HTMLElement[] = [];

  // ============================================================================
  // ANNOUNCEMENT SYSTEM
  // ============================================================================

  /**
   * Announce a message to screen readers
   * @param message - Message to announce
   * @param priority - Priority level (polite or assertive)
   * @param duration - How long to display the message (default: 1000ms)
   */
  static announce(message: string, priority: 'polite' | 'assertive' = 'polite', duration: number = 1000): void {
    const announcement: ScreenReaderAnnouncement = {
      message,
      priority,
      duration,
      id: `announcement-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };

    this.announcementQueue.push(announcement);
    this.processAnnouncementQueue();
  }

  /**
   * Announce ranking changes
   * @param candidateName - Name of the candidate
   * @param newRank - New rank position
   * @param totalCandidates - Total number of candidates
   */
  static announceRankingChange(candidateName: string, newRank: number, totalCandidates: number): void {
    const message = `${candidateName} moved to rank ${newRank} of ${totalCandidates}`;
    this.announce(message, 'polite');
  }

  /**
   * Announce results updates
   * @param totalVotes - Total number of votes
   * @param leadingCandidate - Name of the leading candidate
   * @param isOfficial - Whether these are official results
   */
  static announceResultsUpdate(totalVotes: number, leadingCandidate: string, isOfficial: boolean = false): void {
    const resultType = isOfficial ? 'Official results' : 'Trend results';
    const message = `${resultType} updated. ${totalVotes} total votes. ${leadingCandidate} is currently leading.`;
    this.announce(message, 'polite');
  }

  /**
   * Announce validation errors
   * @param error - Error message
   * @param fieldName - Name of the field with the error
   */
  static announceValidationError(error: string, fieldName?: string): void {
    const message = fieldName ? `Error in ${fieldName}: ${error}` : `Error: ${error}`;
    this.announce(message, 'assertive');
  }

  /**
   * Announce validation success
   * @param message - Success message
   */
  static announceValidationSuccess(message: string): void {
    this.announce(message, 'polite');
  }

  /**
   * Announce form submission status
   * @param status - Submission status
   * @param details - Additional details
   */
  static announceFormSubmission(status: 'submitting' | 'success' | 'error', details?: string): void {
    let message: string;
    
    switch (status) {
      case 'submitting':
        message = 'Submitting your ranking. Please wait.';
        break;
      case 'success':
        message = 'Your ranking has been submitted successfully. Thank you for participating!';
        break;
      case 'error':
        message = `Submission failed. ${details || 'Please try again.'}`;
        break;
    }
    
    this.announce(message, status === 'error' ? 'assertive' : 'polite');
  }

  // ============================================================================
  // LIVE REGION MANAGEMENT
  // ============================================================================

  /**
   * Create a live region for dynamic content
   * @param id - Unique identifier for the live region
   * @param priority - Priority level
   * @returns The created live region element
   */
  static createLiveRegion(id: string, priority: 'polite' | 'assertive' = 'polite'): HTMLElement {
    let liveRegion = this.liveRegions.get(id);
    
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = id;
      liveRegion.setAttribute('aria-live', priority);
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      liveRegion.style.cssText = `
        position: absolute;
        left: -10000px;
        width: 1px;
        height: 1px;
        overflow: hidden;
      `;
      
      document.body.appendChild(liveRegion);
      this.liveRegions.set(id, liveRegion);
    }
    
    return liveRegion;
  }

  /**
   * Update a live region with new content
   * @param id - Live region identifier
   * @param content - New content to announce
   * @param priority - Priority level
   */
  static updateLiveRegion(id: string, content: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const liveRegion = this.liveRegions.get(id) || this.createLiveRegion(id, priority);
    
    // Clear existing content
    liveRegion.textContent = '';
    
    // Set new content
    liveRegion.textContent = content;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, 1000);
  }

  /**
   * Remove a live region
   * @param id - Live region identifier
   */
  static removeLiveRegion(id: string): void {
    const liveRegion = this.liveRegions.get(id);
    if (liveRegion && liveRegion.parentNode) {
      liveRegion.parentNode.removeChild(liveRegion);
      this.liveRegions.delete(id);
    }
  }

  // ============================================================================
  // FOCUS MANAGEMENT
  // ============================================================================

  /**
   * Set focus to an element with proper focus management
   * @param element - Element to focus
   * @param options - Focus options
   */
  static setFocus(element: HTMLElement, options: {
    preventScroll?: boolean;
    restoreFocus?: boolean;
    announce?: string;
  } = {}): void {
    // Store current focus for restoration
    if (options.restoreFocus && document.activeElement instanceof HTMLElement) {
      this.focusHistory.push(document.activeElement);
    }
    
    // Set focus
    element.focus({ preventScroll: options.preventScroll });
    
    // Announce focus change if requested
    if (options.announce) {
      this.announce(options.announce, 'polite');
    }
  }

  /**
   * Restore focus to the previous element
   */
  static restoreFocus(): void {
    const previousElement = this.focusHistory.pop();
    if (previousElement && previousElement.focus) {
      previousElement.focus();
    }
  }

  /**
   * Trap focus within a container
   * @param container - Container element
   * @param firstFocusable - First focusable element
   * @param lastFocusable - Last focusable element
   */
  static trapFocus(container: HTMLElement, firstFocusable: HTMLElement, lastFocusable: HTMLElement): () => void {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          // Shift + Tab
          if (document.activeElement === firstFocusable) {
            e.preventDefault();
            lastFocusable.focus();
          }
        } else {
          // Tab
          if (document.activeElement === lastFocusable) {
            e.preventDefault();
            firstFocusable.focus();
          }
        }
      }
    };
    
    container.addEventListener('keydown', handleKeyDown);
    
    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  // ============================================================================
  // ARIA ATTRIBUTE HELPERS
  // ============================================================================

  /**
   * Set ARIA attributes on an element
   * @param element - Target element
   * @param attributes - ARIA attributes to set
   */
  static setARIAAttributes(element: HTMLElement, attributes: Record<string, string | boolean>): void {
    Object.entries(attributes).forEach(([key, value]) => {
      if (key.startsWith('aria-')) {
        element.setAttribute(key, String(value));
      }
    });
  }

  /**
   * Update ARIA state
   * @param element - Target element
   * @param state - State to update
   */
  static updateARIAState(element: HTMLElement, state: ARIAState): void {
    Object.entries(state).forEach(([key, value]) => {
      if (value !== undefined) {
        element.setAttribute(`aria-${key}`, String(value));
      }
    });
  }

  /**
   * Set element as invalid with error message
   * @param element - Target element
   * @param errorMessage - Error message
   */
  static setInvalid(element: HTMLElement, errorMessage: string): void {
    element.setAttribute('aria-invalid', 'true');
    element.setAttribute('aria-describedby', `error-${element.id}`);
    
    // Create or update error message element
    let errorElement = document.getElementById(`error-${element.id}`);
    if (!errorElement) {
      errorElement = document.createElement('div');
      errorElement.id = `error-${element.id}`;
      errorElement.className = 'error-message sr-only';
      errorElement.setAttribute('role', 'alert');
      element.parentNode?.insertBefore(errorElement, element.nextSibling);
    }
    
    errorElement.textContent = errorMessage;
  }

  /**
   * Clear invalid state
   * @param element - Target element
   */
  static clearInvalid(element: HTMLElement): void {
    element.removeAttribute('aria-invalid');
    element.removeAttribute('aria-describedby');
    
    const errorElement = document.getElementById(`error-${element.id}`);
    if (errorElement) {
      errorElement.remove();
    }
  }

  // ============================================================================
  // KEYBOARD NAVIGATION HELPERS
  // ============================================================================

  /**
   * Handle keyboard navigation for ranking interface
   * @param event - Keyboard event
   * @param options - Navigation options
   */
  static handleKeyboardNavigation(event: KeyboardEvent, options: {
    onArrowUp?: () => void;
    onArrowDown?: () => void;
    onArrowLeft?: () => void;
    onArrowRight?: () => void;
    onEnter?: () => void;
    onSpace?: () => void;
    onEscape?: () => void;
    onTab?: () => void;
  }): void {
    switch (event.key) {
      case 'ArrowUp':
        event.preventDefault();
        options.onArrowUp?.();
        break;
      case 'ArrowDown':
        event.preventDefault();
        options.onArrowDown?.();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        options.onArrowLeft?.();
        break;
      case 'ArrowRight':
        event.preventDefault();
        options.onArrowRight?.();
        break;
      case 'Enter':
        event.preventDefault();
        options.onEnter?.();
        break;
      case ' ':
        event.preventDefault();
        options.onSpace?.();
        break;
      case 'Escape':
        event.preventDefault();
        options.onEscape?.();
        break;
      case 'Tab':
        // Allow default tab behavior
        options.onTab?.();
        break;
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  /**
   * Process the announcement queue
   */
  private static processAnnouncementQueue(): void {
    if (this.isProcessingQueue || this.announcementQueue.length === 0) {
      return;
    }
    
    this.isProcessingQueue = true;
    
    const announcement = this.announcementQueue.shift()!;
    this.makeAnnouncement(announcement);
    
    setTimeout(() => {
      this.isProcessingQueue = false;
      this.processAnnouncementQueue();
    }, announcement.duration);
  }

  /**
   * Make an announcement to screen readers
   * @param announcement - Announcement to make
   */
  private static makeAnnouncement(announcement: ScreenReaderAnnouncement): void {
    const liveRegion = this.createLiveRegion(announcement.id!, announcement.priority);
    liveRegion.textContent = announcement.message;
    
    // Clear after announcement
    setTimeout(() => {
      liveRegion.textContent = '';
    }, announcement.duration);
  }

  /**
   * Get all focusable elements within a container
   * @param container - Container element
   * @returns Array of focusable elements
   */
  static getFocusableElements(container: HTMLElement): HTMLElement[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[contenteditable="true"]'
    ];
    
    return Array.from(container.querySelectorAll(focusableSelectors.join(', '))) as HTMLElement[];
  }

  /**
   * Check if an element is visible to screen readers
   * @param element - Element to check
   * @returns Whether element is visible to screen readers
   */
  static isVisibleToScreenReader(element: HTMLElement): boolean {
    const style = window.getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    
    return (
      style.display !== 'none' &&
      style.visibility !== 'hidden' &&
      style.opacity !== '0' &&
      rect.width > 0 &&
      rect.height > 0 &&
      element.getAttribute('aria-hidden') !== 'true'
    );
  }

  /**
   * Get accessible name for an element
   * @param element - Element to get name for
   * @returns Accessible name
   */
  static getAccessibleName(element: HTMLElement): string {
    // Check for aria-label
    const ariaLabel = element.getAttribute('aria-label');
    if (ariaLabel) return ariaLabel;
    
    // Check for aria-labelledby
    const ariaLabelledBy = element.getAttribute('aria-labelledby');
    if (ariaLabelledBy) {
      const labelElement = document.getElementById(ariaLabelledBy);
      if (labelElement) return labelElement.textContent || '';
    }
    
    // Check for associated label
    if (element.id) {
      const label = document.querySelector(`label[for="${element.id}"]`);
      if (label) return label.textContent || '';
    }
    
    // Check for text content
    if (element.textContent) return element.textContent.trim();
    
    // Check for alt text (images)
    if (element instanceof HTMLImageElement) {
      return element.alt || '';
    }
    
    // Check for title attribute
    const title = element.getAttribute('title');
    if (title) return title;
    
    return '';
  }
}

// ============================================================================
// EXPORTED UTILITY FUNCTIONS
// ============================================================================

/**
 * Quick announcement function
 * @param message - Message to announce
 * @param priority - Priority level
 */
export function announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
  ScreenReaderSupport.announce(message, priority);
}

/**
 * Quick focus function
 * @param element - Element to focus
 * @param announce - Optional announcement
 */
export function focusElement(element: HTMLElement, announce?: string): void {
  ScreenReaderSupport.setFocus(element, { announce });
}

/**
 * Quick ARIA state update
 * @param element - Target element
 * @param state - State to update
 */
export function updateARIAState(element: HTMLElement, state: ARIAState): void {
  ScreenReaderSupport.updateARIAState(element, state);
}

// ============================================================================
// EXPORTED CLASS
// ============================================================================

export default ScreenReaderSupport;
