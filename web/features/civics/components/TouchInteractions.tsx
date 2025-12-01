/**
 * Touch Interactions Component
 * 
 * Utility component for handling touch gestures
 * Features:
 * - Swipe detection
 * - Pinch zoom
 * - Long press
 * - Touch feedback
 * - Accessibility support
 */

'use client';

import React, { useRef, useCallback, useState, useEffect } from 'react';

import { useI18n } from '@/hooks/useI18n';

import type { TouchPoint, TouchState } from '../lib/types/civics-types';


type TouchGesture = 'swipe-left' | 'swipe-right' | 'swipe-up' | 'swipe-down' | 'pinch-in' | 'pinch-out' | 'long-press' | 'tap';

type TouchInteractionsProps = {
  children: React.ReactNode;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
  className?: string;
  disabled?: boolean;
}

export default function TouchInteractions({
  children,
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  onPinchIn,
  onPinchOut,
  onLongPress,
  onTap,
  swipeThreshold = 50,
  longPressDelay = 500,
  className = '',
  disabled = false
}: TouchInteractionsProps) {
  const { t } = useI18n();
  const [touchState, setTouchState] = useState<TouchState>({
    start: null,
    end: null,
    last: null,
    longPressTimer: null,
    isLongPress: false,
    initialDistance: null,
    lastDistance: null
  });
  const [isTouching, setIsTouching] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);
  const [liveMessage, setLiveMessage] = useState('');

  const surfaceLabel = disabled
    ? t('civics.touchInteractions.surface.disabled')
    : t('civics.touchInteractions.surface.label');

  const announceLiveUpdate = useCallback(
    (key: string) => {
      setLiveMessage(t(`civics.touchInteractions.live.${key}`));
    },
    [t],
  );

  // Calculate distance between two touches
  const calculateDistance = useCallback((touch1: React.Touch, touch2: React.Touch) => {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }, []);

  // Clear long press timer
  const clearLongPressTimer = useCallback(() => {
    if (touchState.longPressTimer) {
      clearTimeout(touchState.longPressTimer);
      setTouchState(prev => ({
        ...prev,
        longPressTimer: null
      }));
    }
  }, [touchState.longPressTimer]);

  // Handle touch start
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    const touch = e.touches[0];
    if (!touch) return;

    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    // Check for pinch gesture (two touches)
    if (e.touches.length === 2) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (touch1 && touch2) {
        const distance = calculateDistance(touch1, touch2);
        setTouchState(prev => ({
          ...prev,
          initialDistance: distance,
          lastDistance: distance,
          isLongPress: false
        }));
        return; // Don't process single touch gestures when pinching
      }
    }

    setTouchState(prev => ({
      ...prev,
      start: point,
      end: null,
      last: point,
      isLongPress: false,
      initialDistance: null,
      lastDistance: null
    }));

    setIsTouching(true);
    announceLiveUpdate('touchStart');

    // Start long press timer
    const timer = setTimeout(() => {
      setTouchState(prev => ({
        ...prev,
        isLongPress: true
      }));
      onLongPress?.();
      announceLiveUpdate('longPress');
    }, longPressDelay);

    setTouchState(prev => ({
      ...prev,
      longPressTimer: timer
    }));
  }, [announceLiveUpdate, calculateDistance, disabled, longPressDelay, onLongPress]);

  // Handle touch move
  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    // Handle pinch gesture
    if (e.touches.length === 2 && touchState.initialDistance !== null) {
      const touch1 = e.touches[0];
      const touch2 = e.touches[1];
      if (touch1 && touch2) {
        const currentDistance = calculateDistance(touch1, touch2);
        const distanceChange = currentDistance - (touchState.lastDistance ?? touchState.initialDistance);
        
        setTouchState(prev => ({
          ...prev,
          lastDistance: currentDistance
        }));
        
        // Trigger pinch callbacks based on distance change
        if (Math.abs(distanceChange) > 10) { // Threshold for pinch detection
          if (distanceChange > 0) {
            onPinchOut?.();
            announceLiveUpdate('pinchOut');
          } else {
            onPinchIn?.();
            announceLiveUpdate('pinchIn');
          }
        }
        return;
      }
    }
    
    // Handle single touch move
    if (!touchState.start) return;
    
    const touch = e.touches[0];
    if (!touch) return;

    const point: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    setTouchState(prev => ({
      ...prev,
      last: point
    }));

    // Clear long press if moved too much
    if (touchState.start) {
      const distance = Math.sqrt(
        Math.pow(point.x - touchState.start.x, 2) + 
        Math.pow(point.y - touchState.start.y, 2)
      );
      
      if (distance > 10) {
        clearLongPressTimer();
      }
    }
  }, [
    announceLiveUpdate,
    calculateDistance,
    clearLongPressTimer,
    disabled,
    onPinchIn,
    onPinchOut,
    touchState.initialDistance,
    touchState.lastDistance,
    touchState.start,
  ]);

  // Handle touch end
  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (disabled) return;
    
    clearLongPressTimer();
    
    const touch = e.changedTouches[0];
    if (!touch || !touchState.start) return;

    const endPoint: TouchPoint = {
      x: touch.clientX,
      y: touch.clientY,
      time: Date.now()
    };

    setTouchState(prev => ({
      ...prev,
      end: endPoint
    }));
    setIsTouching(false);

    // Don't process gestures if it was a long press
    if (touchState.isLongPress) {
      setTouchState(prev => ({
        ...prev,
        isLongPress: false
      }));
      return;
    }

    // Calculate gesture
    const deltaX = endPoint.x - touchState.start.x;
    const deltaY = endPoint.y - touchState.start.y;
    const deltaTime = endPoint.time - touchState.start.time;
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

    // Only process if moved enough and quickly enough
    if (distance < swipeThreshold || deltaTime > 300) {
      // It's a tap
      onTap?.();
      announceLiveUpdate('tap');
      announceLiveUpdate('touchEnd');
      return;
    }

    // Determine swipe direction
    const absX = Math.abs(deltaX);
    const absY = Math.abs(deltaY);

    if (absX > absY) {
      // Horizontal swipe
      if (deltaX > 0) {
        onSwipeRight?.();
        announceLiveUpdate('swipeRight');
      } else {
        onSwipeLeft?.();
        announceLiveUpdate('swipeLeft');
      }
    } else {
      // Vertical swipe
      if (deltaY > 0) {
        onSwipeDown?.();
        announceLiveUpdate('swipeDown');
      } else {
        onSwipeUp?.();
        announceLiveUpdate('swipeUp');
      }
    }

    announceLiveUpdate('touchEnd');

    // Reset state
    setTouchState({
      start: null,
      end: null,
      last: null,
      longPressTimer: null,
      isLongPress: false,
      initialDistance: null,
      lastDistance: null
    });
  }, [
    announceLiveUpdate,
    clearLongPressTimer,
    disabled,
    onSwipeDown,
    onSwipeLeft,
    onSwipeRight,
    onSwipeUp,
    onTap,
    swipeThreshold,
    touchState.isLongPress,
    touchState.start,
  ]);

  // Handle touch cancel
  const handleTouchCancel = useCallback(() => {
    clearLongPressTimer();
    setIsTouching(false);
    setTouchState({
      start: null,
      end: null,
      last: null,
      longPressTimer: null,
      isLongPress: false,
      initialDistance: null,
      lastDistance: null
    });
    announceLiveUpdate('touchCancel');
  }, [clearLongPressTimer, announceLiveUpdate]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearLongPressTimer();
    };
  }, [clearLongPressTimer]);

  return (
    <div
      ref={elementRef}
      className={`touch-interactions ${className} ${isTouching ? 'touch-active' : ''}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={handleTouchCancel}
      aria-label={surfaceLabel}
      style={{
        touchAction: 'pan-x pan-y',
        userSelect: 'none'
      }}
    >
      {children}
      <div className="sr-only" aria-live="polite">
        {liveMessage}
      </div>
    </div>
  );
}

// Hook for touch interactions
export function useTouchInteractions(_options: {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
  onPinchIn?: () => void;
  onPinchOut?: () => void;
  onLongPress?: () => void;
  onTap?: () => void;
  swipeThreshold?: number;
  longPressDelay?: number;
}) {
  const [gesture, setGesture] = useState<TouchGesture | null>(null);
  const [isActive, setIsActive] = useState(false);

  const handleGesture = useCallback((gestureType: TouchGesture) => {
    setGesture(gestureType);
    setIsActive(true);
    
    // Reset after animation
    setTimeout(() => {
      setGesture(null);
      setIsActive(false);
    }, 300);
  }, []);

  return {
    gesture,
    isActive,
    handleGesture
  };
}

// Utility functions
export const touchUtils = {
  // Calculate distance between two points
  distance: (p1: TouchPoint, p2: TouchPoint) => {
    return Math.sqrt(
      Math.pow(p2.x - p1.x, 2) + 
      Math.pow(p2.y - p1.y, 2)
    );
  },
  
  // Calculate angle between two points
  angle: (p1: TouchPoint, p2: TouchPoint) => {
    return Math.atan2(p2.y - p1.y, p2.x - p1.x) * 180 / Math.PI;
  },
  
  // Check if gesture is valid
  isValidGesture: (start: TouchPoint, end: TouchPoint, threshold: number) => {
    const distance = touchUtils.distance(start, end);
    const time = end.time - start.time;
    return distance >= threshold && time <= 300;
  }
};

