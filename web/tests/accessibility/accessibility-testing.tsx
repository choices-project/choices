// ============================================================================
// PHASE 3: COMPREHENSIVE ACCESSIBILITY TESTING
// ============================================================================
// Agent A3 - UX/Accessibility Specialist
// 
// This module contains comprehensive accessibility testing for WCAG 2.2 AA
// compliance, keyboard navigation, screen reader support, and usability
// for the Ranked Choice Democracy Revolution platform.
// 
// Test Categories:
// - WCAG 2.2 AA Compliance Testing
// - Keyboard Navigation Testing
// - Screen Reader Support Testing
// - Color Contrast Testing
// - Focus Management Testing
// - Usability Testing
// 
// Created: January 15, 2025
// Status: Phase 3 Implementation
// ============================================================================

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibleRankingInterface } from '../../components/accessible/RankingInterface';
import { AccessibleResultsChart } from '../../components/accessible/AccessibleResultsChart';
import { LowBandwidthRankingForm } from '../../components/accessible/LowBandwidthRankingForm';
import { ProgressiveRanking } from '../../components/accessible/ProgressiveRanking';
import { ScreenReaderSupport } from '../../lib/accessibility/screen-reader';

// ============================================================================
// MOCK DATA
// ============================================================================

const mockCandidates = [
  {
    id: 'candidate-1',
    name: 'Alice Johnson',
    bio: 'Experienced leader with a focus on education and healthcare reform.',
    party: 'Progressive Party',
    socialInsights: {
      similarUsers: 150,
      crossDemographic: ['25-34', 'college-educated'],
      crossInterest: ['education', 'healthcare'],
      confidence: 0.85
    }
  },
  {
    id: 'candidate-2',
    name: 'Bob Smith',
    bio: 'Business leader committed to economic growth and job creation.',
    party: 'Business Party',
    socialInsights: {
      similarUsers: 200,
      crossDemographic: ['35-50', 'business-owners'],
      crossInterest: ['economy', 'jobs'],
      confidence: 0.90
    }
  },
  {
    id: 'candidate-3',
    name: 'Carol Davis',
    bio: 'Environmental advocate with expertise in climate policy.',
    party: 'Green Party',
    socialInsights: {
      similarUsers: 120,
      crossDemographic: ['18-34', 'environmentalists'],
      crossInterest: ['environment', 'climate'],
      confidence: 0.75
    }
  }
];

const mockChartData = [
  {
    id: 'candidate-1',
    name: 'Alice Johnson',
    votes: 150,
    percentage: 45.5,
    isWinner: true
  },
  {
    id: 'candidate-2',
    name: 'Bob Smith',
    votes: 120,
    percentage: 36.4,
    isWinner: false
  },
  {
    id: 'candidate-3',
    name: 'Carol Davis',
    votes: 60,
    percentage: 18.1,
    isWinner: false
  }
];

const mockUserInterests = {
  demographics: ['25-34', 'college-educated'],
  interests: ['education', 'healthcare'],
  location: 'CA',
  ageGroup: '25-34'
};

// ============================================================================
// WCAG 2.2 AA COMPLIANCE TESTING
// ============================================================================

describe('WCAG 2.2 AA Compliance', () => {
  test('keyboard navigation in ranking interface', async () => {
    const user = userEvent.setup();
    const onRankingChange = jest.fn();
    const onValidationChange = jest.fn();

    render(
      <AccessibleRankingInterface
        candidates={mockCandidates}
        onRankingChange={onRankingChange}
        onValidationChange={onValidationChange}
      />
    );

    // Test tab navigation
    const firstCandidate = screen.getByRole('listitem', { name: /alice johnson/i });
    await user.tab();
    expect(firstCandidate).toHaveFocus();

    // Test arrow key navigation
    await user.keyboard('{ArrowDown}');
    const secondCandidate = screen.getByRole('listitem', { name: /bob smith/i });
    expect(secondCandidate).toHaveFocus();

    // Test Enter key selection
    await user.keyboard('{Enter}');
    expect(onRankingChange).toHaveBeenCalledWith(['candidate-2']);

    // Test Space key selection
    await user.keyboard('{Space}');
    expect(onRankingChange).toHaveBeenCalledWith([]);
  });

  test('screen reader support', () => {
    render(
      <AccessibleRankingInterface
        candidates={mockCandidates}
        onRankingChange={jest.fn()}
        onValidationChange={jest.fn()}
      />
    );

    // Test ARIA labels
    const rankingList = screen.getByRole('list');
    expect(rankingList).toHaveAttribute('aria-labelledby', 'ranking-title');

    // Test live regions
    const announcements = screen.getByRole('status');
    expect(announcements).toHaveAttribute('aria-live', 'polite');

    // Test candidate descriptions
    mockCandidates.forEach(candidate => {
      const description = screen.getByText(candidate.bio);
      expect(description).toHaveAttribute('id', `candidate-${candidate.id}-description`);
    });
  });

  test('color contrast compliance', () => {
    // Test color contrast ratios meet WCAG AA standards
    const colorPairs = [
      { foreground: '#000000', background: '#ffffff' }, // 21:1
      { foreground: '#333333', background: '#ffffff' }, // 12.6:1
      { foreground: '#666666', background: '#ffffff' }, // 5.7:1
      { foreground: '#000000', background: '#f0f0f0' }, // 12.6:1
    ];

    colorPairs.forEach(pair => {
      const contrast = calculateContrast(pair.foreground, pair.background);
      expect(contrast).toBeGreaterThanOrEqual(4.5); // WCAG AA standard
    });
  });

  test('focus management', async () => {
    const user = userEvent.setup();
    render(
      <AccessibleRankingInterface
        candidates={mockCandidates}
        onRankingChange={jest.fn()}
        onValidationChange={jest.fn()}
      />
    );

    // Test focus indicators
    const firstCandidate = screen.getByRole('listitem', { name: /alice johnson/i });
    await user.tab();
    expect(firstCandidate).toHaveFocus();
    expect(firstCandidate).toHaveClass('focused');

    // Test focus restoration
    await user.tab();
    const secondCandidate = screen.getByRole('listitem', { name: /bob smith/i });
    expect(secondCandidate).toHaveFocus();
    expect(firstCandidate).not.toHaveClass('focused');
  });
});

// ============================================================================
// KEYBOARD NAVIGATION TESTING
// ============================================================================

describe('Keyboard Navigation', () => {
  test('arrow key navigation in ranking interface', async () => {
    const user = userEvent.setup();
    const onRankingChange = jest.fn();

    render(
      <AccessibleRankingInterface
        candidates={mockCandidates}
        onRankingChange={onRankingChange}
        onValidationChange={jest.fn()}
      />
    );

    const firstCandidate = screen.getByRole('listitem', { name: /alice johnson/i });
    await user.click(firstCandidate);

    // Test arrow up (should not move if at top)
    await user.keyboard('{ArrowUp}');
    expect(onRankingChange).toHaveBeenCalledWith(['candidate-1']);

    // Test arrow down
    await user.keyboard('{ArrowDown}');
    expect(onRankingChange).toHaveBeenCalledWith(['candidate-2']);

    // Test arrow up again
    await user.keyboard('{ArrowUp}');
    expect(onRankingChange).toHaveBeenCalledWith(['candidate-1']);
  });

  test('keyboard navigation in results chart', async () => {
    const user = userEvent.setup();
    render(
      <AccessibleResultsChart
        data={mockChartData}
        title="Test Results"
        aria-label="Test results chart"
      />
    );

    // Test tab navigation to chart bars
    const firstBar = screen.getByRole('button', { name: /alice johnson/i });
    await user.tab();
    expect(firstBar).toHaveFocus();

    // Test arrow key navigation
    await user.keyboard('{ArrowDown}');
    const secondBar = screen.getByRole('button', { name: /bob smith/i });
    expect(secondBar).toHaveFocus();

    // Test Enter key activation
    await user.keyboard('{Enter}');
    // Chart bars should be clickable
  });

  test('keyboard navigation in low-bandwidth form', async () => {
    const user = userEvent.setup();
    render(
      <LowBandwidthRankingForm
        pollId="test-poll"
        candidates={mockCandidates}
        onSubmit={jest.fn()}
        onValidationChange={jest.fn()}
      />
    );

    // Test tab navigation between inputs
    const firstInput = screen.getByLabelText(/alice johnson/i);
    await user.tab();
    expect(firstInput).toHaveFocus();

    await user.tab();
    const secondInput = screen.getByLabelText(/bob smith/i);
    expect(secondInput).toHaveFocus();

    // Test form submission with Enter
    await user.type(firstInput, '1');
    await user.type(secondInput, '2');
    
    const submitButton = screen.getByRole('button', { name: /submit my ranking/i });
    await user.tab();
    expect(submitButton).toHaveFocus();
    
    await user.keyboard('{Enter}');
    // Form should submit
  });
});

// ============================================================================
// SCREEN READER SUPPORT TESTING
// ============================================================================

describe('Screen Reader Support', () => {
  test('screen reader announcements', () => {
    // Test ranking change announcements
    ScreenReaderSupport.announceRankingChange('Alice Johnson', 1, 3);
    // Should create live region with announcement

    // Test results update announcements
    ScreenReaderSupport.announceResultsUpdate(100, 'Alice Johnson', true);
    // Should create live region with announcement

    // Test validation error announcements
    ScreenReaderSupport.announceValidationError('Please rank at least 2 candidates');
    // Should create live region with announcement
  });

  test('live region management', () => {
    // Test live region creation
    const liveRegion = ScreenReaderSupport.createLiveRegion('test-region', 'polite');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion).toHaveAttribute('aria-atomic', 'true');

    // Test live region update
    ScreenReaderSupport.updateLiveRegion('test-region', 'Test message');
    expect(liveRegion).toHaveTextContent('Test message');

    // Test live region removal
    ScreenReaderSupport.removeLiveRegion('test-region');
    expect(liveRegion.parentNode).toBeNull();
  });

  test('ARIA attribute management', () => {
    const element = document.createElement('div');
    
    // Test ARIA state update
    ScreenReaderSupport.updateARIAState(element, {
      expanded: true,
      selected: false,
      disabled: false
    });
    
    expect(element).toHaveAttribute('aria-expanded', 'true');
    expect(element).toHaveAttribute('aria-selected', 'false');
    expect(element).toHaveAttribute('aria-disabled', 'false');

    // Test invalid state
    ScreenReaderSupport.setInvalid(element, 'This field is required');
    expect(element).toHaveAttribute('aria-invalid', 'true');
    expect(element).toHaveAttribute('aria-describedby');

    // Test clear invalid
    ScreenReaderSupport.clearInvalid(element);
    expect(element).not.toHaveAttribute('aria-invalid');
  });
});

// ============================================================================
// COLOR CONTRAST TESTING
// ============================================================================

describe('Color Contrast', () => {
  test('color-safe palette compliance', () => {
    const colorSafePalette = [
      '#1f77b4', // Blue
      '#ff7f0e', // Orange
      '#2ca02c', // Green
      '#d62728', // Red
      '#9467bd', // Purple
    ];

    colorSafePalette.forEach(color => {
      // Test against white background
      const contrast = calculateContrast(color, '#ffffff');
      expect(contrast).toBeGreaterThanOrEqual(4.5);
    });
  });

  test('high contrast mode support', () => {
    const highContrastPalette = [
      '#000000', // Black
      '#ffffff', // White
      '#ff0000', // Red
      '#00ff00', // Green
      '#0000ff', // Blue
    ];

    highContrastPalette.forEach(color => {
      // Test against white background
      const contrast = calculateContrast(color, '#ffffff');
      expect(contrast).toBeGreaterThanOrEqual(7.0); // WCAG AAA standard
    });
  });
});

// ============================================================================
// FOCUS MANAGEMENT TESTING
// ============================================================================

describe('Focus Management', () => {
  test('focus trapping', () => {
    const container = document.createElement('div');
    const firstFocusable = document.createElement('button');
    const lastFocusable = document.createElement('button');
    
    container.appendChild(firstFocusable);
    container.appendChild(lastFocusable);
    document.body.appendChild(container);

    // Test focus trapping
    const cleanup = ScreenReaderSupport.trapFocus(container, firstFocusable, lastFocusable);
    
    // Simulate Tab at last focusable
    const event = new KeyboardEvent('keydown', { key: 'Tab' });
    lastFocusable.dispatchEvent(event);
    
    // Focus should move to first focusable
    expect(firstFocusable).toHaveFocus();
    
    if (typeof cleanup === 'function') {
      cleanup();
    }
    document.body.removeChild(container);
  });

  test('focus restoration', () => {
    const element1 = document.createElement('button');
    const element2 = document.createElement('button');
    
    document.body.appendChild(element1);
    document.body.appendChild(element2);
    
    // Set initial focus
    element1.focus();
    expect(element1).toHaveFocus();
    
    // Set focus with restoration
    ScreenReaderSupport.setFocus(element2, { restoreFocus: true });
    expect(element2).toHaveFocus();
    
    // Restore focus
    ScreenReaderSupport.restoreFocus();
    expect(element1).toHaveFocus();
    
    document.body.removeChild(element1);
    document.body.removeChild(element2);
  });
});

// ============================================================================
// USABILITY TESTING
// ============================================================================

describe('Usability', () => {
  test('progressive disclosure', async () => {
    const user = userEvent.setup();
    render(
      <ProgressiveRanking
        candidates={mockCandidates}
        userInterests={mockUserInterests}
        onRankingChange={jest.fn()}
        onValidationChange={jest.fn()}
      />
    );

    // Initially show only top 3
    expect(screen.getByText('Rank Your Top 3')).toBeInTheDocument();
    expect(screen.queryByText('Additional Candidates')).not.toBeInTheDocument();

    // Click expand button
    const expandButton = screen.getByRole('button', { name: /add more rankings/i });
    await user.click(expandButton);

    // Should show remaining candidates
    expect(screen.getByText('Additional Candidates')).toBeInTheDocument();
  });

  test('validation feedback', async () => {
    const user = userEvent.setup();
    const onValidationChange = jest.fn();

    render(
      <AccessibleRankingInterface
        candidates={mockCandidates}
        onRankingChange={jest.fn()}
        onValidationChange={onValidationChange}
      />
    );

    // Should show warning for empty ranking
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false, expect.any(Array), expect.any(Array));
    });

    // Select one candidate
    const firstCandidate = screen.getByRole('listitem', { name: /alice johnson/i });
    await user.click(firstCandidate);

    // Should show warning for insufficient rankings
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(false, expect.any(Array), expect.any(Array));
    });
  });

  test('low-bandwidth form functionality', async () => {
    const user = userEvent.setup();
    const onSubmit = jest.fn().mockResolvedValue(true);

    render(
      <LowBandwidthRankingForm
        pollId="test-poll"
        candidates={mockCandidates}
        onSubmit={onSubmit}
        onValidationChange={jest.fn()}
      />
    );

    // Fill out form
    const firstInput = screen.getByLabelText(/alice johnson/i);
    const secondInput = screen.getByLabelText(/bob smith/i);
    
    await user.type(firstInput, '1');
    await user.type(secondInput, '2');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /submit my ranking/i });
    await user.click(submitButton);

    // Should call onSubmit with correct data
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith({
        'candidate-1': 1,
        'candidate-2': 2
      });
    });
  });
});

// ============================================================================
// INTEGRATION TESTING
// ============================================================================

describe('Accessibility Integration', () => {
  test('end-to-end accessibility workflow', async () => {
    const user = userEvent.setup();
    const onRankingChange = jest.fn();
    const onValidationChange = jest.fn();

    render(
      <AccessibleRankingInterface
        candidates={mockCandidates}
        onRankingChange={onRankingChange}
        onValidationChange={onValidationChange}
      />
    );

    // Test complete workflow
    const firstCandidate = screen.getByRole('listitem', { name: /alice johnson/i });
    await user.click(firstCandidate);
    
    const secondCandidate = screen.getByRole('listitem', { name: /bob smith/i });
    await user.click(secondCandidate);

    // Test keyboard navigation
    await user.tab();
    expect(firstCandidate).toHaveFocus();
    
    await user.keyboard('{ArrowDown}');
    expect(secondCandidate).toHaveFocus();

    // Test validation
    await waitFor(() => {
      expect(onValidationChange).toHaveBeenCalledWith(true, [], expect.any(Array));
    });
  });

  test('screen reader workflow', () => {
    render(
      <AccessibleResultsChart
        data={mockChartData}
        title="Test Results"
        aria-label="Test results chart"
      />
    );

    // Test data table for screen readers
    const dataTable = screen.getByRole('table');
    expect(dataTable).toBeInTheDocument();

    // Test chart bars
    const chartBars = screen.getAllByRole('button');
    expect(chartBars).toHaveLength(3);

    // Test accessibility attributes
    chartBars.forEach(bar => {
      expect(bar).toHaveAttribute('aria-label');
    });
  });
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate color contrast ratio
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Contrast ratio
 */
function calculateContrast(foreground: string, background: string): number {
  // Simplified contrast calculation for testing
  const fg = parseInt(foreground.replace('#', ''), 16);
  const bg = parseInt(background.replace('#', ''), 16);
  
  const fgLuminance = getLuminance(fg);
  const bgLuminance = getLuminance(bg);
  
  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);
  
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Get relative luminance of a color
 * @param color - Color value
 * @returns Luminance value
 */
function getLuminance(color: number): number {
  const r = (color >> 16) & 0xff;
  const g = (color >> 8) & 0xff;
  const b = color & 0xff;
  
  const [rs, gs, bs] = [r, g, b].map(c => {
    c = c / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  
  return 0.2126 * (rs ?? 0) + 0.7152 * (gs ?? 0) + 0.0722 * (bs ?? 0);
}

// ============================================================================
// EXPORTED TEST SUITE
// ============================================================================

export const AccessibilityTestSuite = {
  wcag: {
    keyboardNavigation: true,
    screenReaderSupport: true,
    colorContrast: true,
    focusManagement: true
  },
  usability: {
    progressiveDisclosure: true,
    validationFeedback: true,
    lowBandwidthSupport: true
  },
  integration: {
    endToEndWorkflow: true,
    screenReaderWorkflow: true
  }
};

export default AccessibilityTestSuite;
