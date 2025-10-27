/**
 * Screen Reader Support Module
 * 
 * Provides utilities for screen reader accessibility and ARIA support.
 * 
 * @author Choices Platform Team
 * @created 2025-10-26
 * @version 1.0.0
 * @since 1.0.0
 */

export interface ScreenReaderSupport {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
  announceLiveRegion: (message: string, priority?: 'polite' | 'assertive') => void;
  announceChartData: (data: any) => void;
  announcePollResults: (results: any) => void;
  announceVoteConfirmation: (option: string) => void;
  announceError: (error: string) => void;
  announceSuccess: (message: string) => void;
}

class ScreenReaderManager implements ScreenReaderSupport {
  private liveRegion: HTMLElement | null = null;
  private chartRegion: HTMLElement | null = null;
  private pollRegion: HTMLElement | null = null;

  constructor() {
    this.initializeLiveRegions();
  }

  /**
   * Initialize live regions for screen reader announcements
   */
  private initializeLiveRegions(): void {
    // Create live region for general announcements
    this.liveRegion = document.createElement('div');
    this.liveRegion.setAttribute('aria-live', 'polite');
    this.liveRegion.setAttribute('aria-atomic', 'true');
    this.liveRegion.className = 'sr-only';
    document.body.appendChild(this.liveRegion);

    // Create live region for chart data
    this.chartRegion = document.createElement('div');
    this.chartRegion.setAttribute('aria-live', 'polite');
    this.chartRegion.setAttribute('aria-atomic', 'true');
    this.chartRegion.className = 'sr-only';
    document.body.appendChild(this.chartRegion);

    // Create live region for poll results
    this.pollRegion = document.createElement('div');
    this.pollRegion.setAttribute('aria-live', 'polite');
    this.pollRegion.setAttribute('aria-atomic', 'true');
    this.pollRegion.className = 'sr-only';
    document.body.appendChild(this.pollRegion);
  }

  /**
   * Announce a message to screen readers
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    if (this.liveRegion) {
      this.liveRegion.setAttribute('aria-live', priority);
      this.liveRegion.textContent = message;
      
      // Clear after announcement
      setTimeout(() => {
        if (this.liveRegion) {
          this.liveRegion.textContent = '';
        }
      }, 1000);
    }
  }

  /**
   * Announce to live region
   */
  announceLiveRegion(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    this.announce(message, priority);
  }

  /**
   * Announce chart data in an accessible format
   */
  announceChartData(data: any): void {
    if (!this.chartRegion) return;

    let announcement = 'Chart data: ';
    
    if (Array.isArray(data)) {
      data.forEach((item, index) => {
        announcement += `Item ${index + 1}: ${item.label || item.name || 'Unknown'}, Value: ${item.value || item.count || 0}. `;
      });
    } else if (typeof data === 'object') {
      Object.entries(data).forEach(([key, value]) => {
        announcement += `${key}: ${value}. `;
      });
    } else {
      announcement += data.toString();
    }

    this.chartRegion.setAttribute('aria-live', 'polite');
    this.chartRegion.textContent = announcement;
    
    setTimeout(() => {
      if (this.chartRegion) {
        this.chartRegion.textContent = '';
      }
    }, 2000);
  }

  /**
   * Announce poll results
   */
  announcePollResults(results: any): void {
    if (!this.pollRegion) return;

    let announcement = 'Poll results: ';
    
    if (results.options && Array.isArray(results.options)) {
      results.options.forEach((option: any, index: number) => {
        const percentage = option.percentage ? ` (${option.percentage}%)` : '';
        announcement += `${option.text || option.name}: ${option.votes || option.count || 0} votes${percentage}. `;
      });
    }

    if (results.totalVotes) {
      announcement += `Total votes: ${results.totalVotes}. `;
    }

    this.pollRegion.setAttribute('aria-live', 'polite');
    this.pollRegion.textContent = announcement;
    
    setTimeout(() => {
      if (this.pollRegion) {
        this.pollRegion.textContent = '';
      }
    }, 3000);
  }

  /**
   * Announce vote confirmation
   */
  announceVoteConfirmation(option: string): void {
    this.announce(`Vote recorded for: ${option}`, 'assertive');
  }

  /**
   * Announce error message
   */
  announceError(error: string): void {
    this.announce(`Error: ${error}`, 'assertive');
  }

  /**
   * Announce success message
   */
  announceSuccess(message: string): void {
    this.announce(`Success: ${message}`, 'polite');
  }

  /**
   * Clean up live regions
   */
  destroy(): void {
    if (this.liveRegion && this.liveRegion.parentNode) {
      this.liveRegion.parentNode.removeChild(this.liveRegion);
    }
    if (this.chartRegion && this.chartRegion.parentNode) {
      this.chartRegion.parentNode.removeChild(this.chartRegion);
    }
    if (this.pollRegion && this.pollRegion.parentNode) {
      this.pollRegion.parentNode.removeChild(this.pollRegion);
    }
  }
}

// Global screen reader support instance
const screenReaderSupport = new ScreenReaderManager();

// Export the instance and interface
export { ScreenReaderSupport, ScreenReaderManager };
export default screenReaderSupport;

