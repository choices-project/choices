// ============================================================================
// PHASE 3: ACCESSIBLE RESULTS CHART
// ============================================================================
// Agent A3 - UX/Accessibility Specialist
// 
// This component provides an accessible results chart for the
// Ranked Choice Democracy Revolution platform.
// 
// Features:
// - Color-blind friendly palette
// - Reduced motion support
// - Screen reader accessible data tables
// - High contrast mode support
// - Keyboard navigation
// 
// Created: January 15, 2025
// Status: Phase 3 Implementation
// ============================================================================

import React, { useState, useEffect, useRef } from 'react';
import { ScreenReaderSupport } from '../../lib/accessibility/screen-reader';

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface ChartData {
  id: string;
  name: string;
  votes: number;
  percentage: number;
  color?: string | undefined;
  isWinner?: boolean;
  isEliminated?: boolean;
  round?: number;
}

export interface AccessibleResultsChartProps {
  data: ChartData[];
  title: string;
  'aria-label': string;
  showPercentages?: boolean;
  showVoteCounts?: boolean;
  showRoundInfo?: boolean;
  isAnimated?: boolean;
  className?: string;
  onDataPointClick?: (data: ChartData) => void;
  onDataPointFocus?: (data: ChartData) => void;
}

// ============================================================================
// COLOR-SAFE PALETTE
// ============================================================================

const COLOR_SAFE_PALETTE = [
  '#1f77b4', // Blue
  '#ff7f0e', // Orange
  '#2ca02c', // Green
  '#d62728', // Red
  '#9467bd', // Purple
  '#8c564b', // Brown
  '#e377c2', // Pink
  '#7f7f7f', // Gray
  '#bcbd22', // Olive
  '#17becf'  // Cyan
];

const HIGH_CONTRAST_PALETTE = [
  '#000000', // Black
  '#ffffff', // White
  '#ff0000', // Red
  '#00ff00', // Green
  '#0000ff', // Blue
  '#ffff00', // Yellow
  '#ff00ff', // Magenta
  '#00ffff', // Cyan
  '#800000', // Maroon
  '#008000'  // Dark Green
];

// ============================================================================
// ACCESSIBLE RESULTS CHART COMPONENT
// ============================================================================

export function AccessibleResultsChart({
  data,
  title,
  'aria-label': ariaLabel,
  showPercentages = true,
  showVoteCounts = true,
  showRoundInfo = false,
  isAnimated = true,
  className = '',
  onDataPointClick,
  onDataPointFocus
}: AccessibleResultsChartProps) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================
  
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [prefersHighContrast, setPrefersHighContrast] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  
  const chartRef = useRef<HTMLDivElement>(null);
  const tableRef = useRef<HTMLTableElement>(null);

  // ============================================================================
  // MEDIA QUERY DETECTION
  // ============================================================================

  useEffect(() => {
    // Check for reduced motion preference
    const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(reducedMotionQuery.matches);
    
    const handleReducedMotionChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };
    
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange);
    
    // Check for high contrast preference
    const highContrastQuery = window.matchMedia('(prefers-contrast: high)');
    setPrefersHighContrast(highContrastQuery.matches);
    
    const handleHighContrastChange = (e: MediaQueryListEvent) => {
      setPrefersHighContrast(e.matches);
    };
    
    highContrastQuery.addEventListener('change', handleHighContrastChange);
    
    return () => {
      reducedMotionQuery.removeEventListener('change', handleReducedMotionChange);
      highContrastQuery.removeEventListener('change', handleHighContrastChange);
    };
  }, []);

  // ============================================================================
  // CHART LOGIC
  // ============================================================================

  const getColorPalette = (): string[] => {
    return prefersHighContrast ? HIGH_CONTRAST_PALETTE : COLOR_SAFE_PALETTE;
  };

  const getDataWithColors = (): ChartData[] => {
    const palette = getColorPalette();
    return data.map((item, index) => {
      const result: ChartData = {
        ...item,
        color: item.color ?? palette[index % palette.length]
      };
      return result;
    });
  };

  const getMaxValue = (): number => {
    return Math.max(...data.map(item => item.votes));
  };

  const getTotalVotes = (): number => {
    return data.reduce((sum, item) => sum + item.votes, 0);
  };

  const formatPercentage = (value: number): string => {
    return `${value.toFixed(1)}%`;
  };

  const formatVoteCount = (count: number): string => {
    return count.toLocaleString();
  };

  // ============================================================================
  // KEYBOARD NAVIGATION
  // ============================================================================

  const handleKeyDown = (event: React.KeyboardEvent, index: number) => {
    ScreenReaderSupport.handleKeyboardNavigation(event.nativeEvent, {
      onArrowUp: () => {
        if (index > 0) {
          setFocusedIndex(index - 1);
          const prevData = data[index - 1];
          if (prevData) onDataPointFocus?.(prevData);
        }
      },
      onArrowDown: () => {
        if (index < data.length - 1) {
          setFocusedIndex(index + 1);
          const nextData = data[index + 1];
          if (nextData) onDataPointFocus?.(nextData);
        }
      },
      onEnter: () => {
        const dataPoint = data[index];
        if (dataPoint) onDataPointClick?.(dataPoint);
      },
      onSpace: () => {
        const dataPoint = data[index];
        if (dataPoint) onDataPointClick?.(dataPoint);
      }
    });
  };

  // ============================================================================
  // ACCESSIBILITY HELPERS
  // ============================================================================

  const getDataPointAriaLabel = (item: ChartData): string => {
    let label = `${item.name}: ${formatVoteCount(item.votes)} votes`;
    
    if (showPercentages) {
      label += `, ${formatPercentage(item.percentage)}`;
    }
    
    if (item.isWinner) {
      label += ', Winner';
    }
    
    if (item.isEliminated) {
      label += ', Eliminated';
    }
    
    if (showRoundInfo && item.round) {
      label += `, Round ${item.round}`;
    }
    
    return label;
  };

  const announceDataPoint = (item: ChartData): void => {
    const announcement = getDataPointAriaLabel(item);
    ScreenReaderSupport.announce(announcement, 'polite');
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  const chartData = getDataWithColors();
  const maxValue = getMaxValue();
  const totalVotes = getTotalVotes();

  return (
    <div 
      ref={chartRef}
      className={`accessible-results-chart ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      {/* Chart Title */}
      <h3 className="chart-title">{title}</h3>
      
      {/* Data Table for Screen Readers */}
      <table 
        ref={tableRef}
        className="sr-only" 
        aria-label={`${title} data table`}
      >
        <thead>
          <tr>
            <th scope="col">Candidate</th>
            <th scope="col">Votes</th>
            {showPercentages && <th scope="col">Percentage</th>}
            {showRoundInfo && <th scope="col">Round</th>}
            <th scope="col">Status</th>
          </tr>
        </thead>
        <tbody>
          {chartData.map((item, index) => (
            <tr key={item.id}>
              <td>{item.name}</td>
              <td>{formatVoteCount(item.votes)}</td>
              {showPercentages && <td>{formatPercentage(item.percentage)}</td>}
              {showRoundInfo && <td>{item.round || 'N/A'}</td>}
              <td>
                {item.isWinner && 'Winner'}
                {item.isEliminated && 'Eliminated'}
                {!item.isWinner && !item.isEliminated && 'Active'}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <th scope="row">Total</th>
            <td>{formatVoteCount(totalVotes)}</td>
            {showPercentages && <td>100.0%</td>}
            {showRoundInfo && <td>-</td>}
            <td>-</td>
          </tr>
        </tfoot>
      </table>
      
      {/* Visual Chart */}
      <div className="chart-container" aria-hidden="true">
        <div className="chart-bars">
          {chartData.map((item, index) => (
            <div
              key={item.id}
              className={`chart-bar ${focusedIndex === index ? 'focused' : ''} ${item.isWinner ? 'winner' : ''} ${item.isEliminated ? 'eliminated' : ''}`}
              style={{
                height: `${(item.votes / maxValue) * 100}%`,
                backgroundColor: item.color,
                transition: prefersReducedMotion ? 'none' : 'height 0.3s ease, background-color 0.3s ease'
              }}
              tabIndex={0}
              role="button"
              aria-label={getDataPointAriaLabel(item)}
              onKeyDown={(e) => handleKeyDown(e, index)}
              onClick={() => onDataPointClick?.(item)}
              onFocus={() => {
                setFocusedIndex(index);
                announceDataPoint(item);
              }}
            >
              <div className="bar-content">
                <span className="bar-label">{item.name}</span>
                <span className="bar-value">
                  {showVoteCounts && formatVoteCount(item.votes)}
                  {showVoteCounts && showPercentages && ' '}
                  {showPercentages && formatPercentage(item.percentage)}
                </span>
                {item.isWinner && (
                  <span className="winner-indicator" aria-label="Winner">👑</span>
                )}
                {item.isEliminated && (
                  <span className="eliminated-indicator" aria-label="Eliminated">❌</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {/* Chart Legend */}
        <div className="chart-legend" role="list" aria-label="Chart legend">
          {chartData.map((item, index) => (
            <div
              key={`legend-${item.id}`}
              className="legend-item"
              role="listitem"
            >
              <span 
                className="legend-color"
                style={{ backgroundColor: item.color }}
                aria-hidden="true"
              />
              <span className="legend-label">{item.name}</span>
              {item.isWinner && (
                <span className="legend-winner" aria-label="Winner">👑</span>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {/* Chart Metadata */}
      <div className="chart-metadata">
        <p>Sample size: {formatVoteCount(totalVotes)} respondents</p>
        <p>Last updated: {new Date().toLocaleString()}</p>
        {prefersReducedMotion && (
          <p>Reduced motion mode enabled</p>
        )}
        {prefersHighContrast && (
          <p>High contrast mode enabled</p>
        )}
      </div>
      
      {/* Expand/Collapse Button for Large Datasets */}
      {data.length > 10 && (
        <button
          type="button"
          className="expand-chart-button"
          onClick={() => setIsExpanded(!isExpanded)}
          aria-expanded={isExpanded}
          aria-controls="detailed-chart-data"
        >
          {isExpanded ? 'Show Summary' : 'Show Detailed Data'}
        </button>
      )}
      
      {/* Detailed Data View */}
      {isExpanded && data.length > 10 && (
        <div id="detailed-chart-data" className="detailed-chart-data">
          <h4>Detailed Results</h4>
          <div className="detailed-results">
            {chartData.map((item, index) => (
              <div key={`detailed-${item.id}`} className="detailed-result-item">
                <div className="result-candidate">
                  <span className="candidate-name">{item.name}</span>
                  {item.isWinner && <span className="winner-badge">Winner</span>}
                  {item.isEliminated && <span className="eliminated-badge">Eliminated</span>}
                </div>
                <div className="result-stats">
                  <span className="vote-count">{formatVoteCount(item.votes)} votes</span>
                  {showPercentages && (
                    <span className="percentage">{formatPercentage(item.percentage)}</span>
                  )}
                  {showRoundInfo && item.round && (
                    <span className="round">Round {item.round}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Screen Reader Announcements */}
      <div 
        aria-live="polite" 
        aria-atomic="true" 
        className="sr-only"
        id="chart-announcements"
      >
        {/* Dynamic announcements will be inserted here */}
      </div>
    </div>
  );
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get color-safe palette
 * @returns Array of color-safe colors
 */
export function getColorSafePalette(): string[] {
  return [...COLOR_SAFE_PALETTE];
}

/**
 * Get high contrast palette
 * @returns Array of high contrast colors
 */
export function getHighContrastPalette(): string[] {
  return [...HIGH_CONTRAST_PALETTE];
}

/**
 * Calculate color contrast ratio
 * @param foreground - Foreground color
 * @param background - Background color
 * @returns Contrast ratio
 */
export function calculateContrast(foreground: string, background: string): number {
  // Simplified contrast calculation
  // In production, use a proper contrast calculation library
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
// EXPORTED COMPONENT
// ============================================================================

export default AccessibleResultsChart;
