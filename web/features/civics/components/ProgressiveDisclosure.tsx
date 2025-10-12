/**
 * Progressive Disclosure Component
 * 
 * Reusable component for progressive disclosure of information
 * Features:
 * - Smooth animations
 * - Accessibility support
 * - Customizable trigger
 * - Keyboard navigation
 * - Mobile-optimized
 */

'use client';

import { ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import React, { useState, useRef, useEffect } from 'react';

interface ProgressiveDisclosureProps {
  children: React.ReactNode;
  trigger: React.ReactNode;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  className?: string;
  contentClassName?: string;
  animationDuration?: number;
  showIcon?: boolean;
  iconPosition?: 'left' | 'right';
  ariaLabel?: string;
}

export default function ProgressiveDisclosure({
  children,
  trigger,
  isExpanded: controlledExpanded,
  onToggle,
  className = '',
  contentClassName = '',
  animationDuration = 300,
  showIcon = true,
  iconPosition = 'right',
  ariaLabel
}: ProgressiveDisclosureProps) {
  
  const [internalExpanded, setInternalExpanded] = useState(false);
  const [contentHeight, setContentHeight] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const contentRef = useRef<HTMLDivElement>(null);
  const isControlled = controlledExpanded !== undefined;
  const expanded = isControlled ? controlledExpanded : internalExpanded;

  // Measure content height
  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight);
    }
  }, [children]);

  // Handle toggle
  const handleToggle = () => {
    if (isAnimating) return;
    
    setIsAnimating(true);
    
    if (isControlled) {
      onToggle?.(!controlledExpanded);
    } else {
      setInternalExpanded(!internalExpanded);
    }
    
    setTimeout(() => setIsAnimating(false), animationDuration);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  };

  return (
    <div className={`progressive-disclosure ${className}`}>
      {/* Trigger */}
      <button
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
        aria-expanded={expanded}
        aria-label={ariaLabel || (expanded ? 'Collapse content' : 'Expand content')}
        disabled={isAnimating}
      >
        <div className="flex-1">
          {trigger}
        </div>
        
        {showIcon && (
          <div className={`flex-shrink-0 ml-2 ${iconPosition === 'left' ? 'order-first mr-2 ml-0' : ''}`}>
            {expanded ? (
              <ChevronUpIcon className="w-5 h-5 text-gray-500 transition-transform duration-200" />
            ) : (
              <ChevronDownIcon className="w-5 h-5 text-gray-500 transition-transform duration-200" />
            )}
          </div>
        )}
      </button>

      {/* Content */}
      <div
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: expanded ? `${contentHeight}px` : '0px',
          transitionDuration: `${animationDuration}ms`
        }}
      >
        <div
          ref={contentRef}
          className={`progressive-disclosure-content ${contentClassName}`}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

// Hook for managing progressive disclosure state
export function useProgressiveDisclosure(initialExpanded = false) {
  const [expanded, setExpanded] = useState(initialExpanded);
  
  const toggle = () => setExpanded(!expanded);
  const expand = () => setExpanded(true);
  const collapse = () => setExpanded(false);
  
  return {
    expanded,
    toggle,
    expand,
    collapse,
    setExpanded
  };
}
