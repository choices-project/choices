/**
 * Enhanced Infinite Scroll Component
 * 
 * Instagram-like infinite scroll with smooth performance
 * Features:
 * - Smooth scrolling with momentum
 * - Visual feedback
 * - Performance optimizations
 * - Accessibility compliance
 * - Touch gesture support
 */

'use client';

import { ChevronUpIcon, ArrowPathIcon } from '@heroicons/react/24/outline';
import React, { useRef, useEffect, useCallback, useState } from 'react';

import { useI18n } from '@/hooks/useI18n';

type InfiniteScrollProps = {
  children: React.ReactNode;
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  isLoading: boolean;
  threshold?: number;
  rootMargin?: string;
  className?: string;
  enableScrollToTop?: boolean;
  enablePullToRefresh?: boolean;
  onRefresh?: () => Promise<void>;
  loadingComponent?: React.ReactNode;
  endComponent?: React.ReactNode;
  scrollToTopThreshold?: number;
}

export default function InfiniteScroll({
  children,
  onLoadMore,
  hasMore,
  isLoading,
  threshold = 0.1,
  rootMargin = '100px',
  className = '',
  enableScrollToTop = true,
  enablePullToRefresh = true,
  onRefresh,
  loadingComponent,
  endComponent,
  scrollToTopThreshold = 5
}: InfiniteScrollProps) {
  const { t } = useI18n();
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const lastItemRef = useRef<HTMLDivElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [touchStart, setTouchStart] = useState<{ y: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);

  // Scroll to top functionality
  const handleScrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  }, []);

  // Handle scroll events for scroll-to-top button
  const handleScroll = useCallback(() => {
    if (containerRef.current) {
      const scrollTop = containerRef.current.scrollTop;
      setShowScrollToTop(scrollTop > scrollToTopThreshold * 100);
    }
  }, [scrollToTopThreshold]);

  // Touch gesture handling for pull-to-refresh
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (containerRef.current?.scrollTop === 0 && e.touches[0]) {
      setTouchStart({ y: e.touches[0].clientY });
      setIsPulling(true);
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStart || !isPulling || !e.touches[0]) return;

    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStart.y;

    if (deltaY > 0 && containerRef.current?.scrollTop === 0) {
      e.preventDefault();
      const distance = Math.min(deltaY, 100);
      setPullDistance(distance);
    }
  }, [touchStart, isPulling]);

  const handleTouchEnd = useCallback(async () => {
    if (pullDistance > 50 && onRefresh) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setTouchStart(null);
    setIsPulling(false);
  }, [pullDistance, onRefresh]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    if (hasMore && !isLoading) {
      observerRef.current = new IntersectionObserver(
        (entries) => {
          if (entries[0]?.isIntersecting) {
            onLoadMore();
          }
        },
        { 
          threshold,
          rootMargin 
        }
      );

      if (lastItemRef.current) {
        observerRef.current.observe(lastItemRef.current);
      }
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [hasMore, isLoading, onLoadMore, threshold, rootMargin]);

  // Add scroll event listener
  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener('scroll', handleScroll);
      return () => container.removeEventListener('scroll', handleScroll);
    }
    return undefined;
  }, [handleScroll]);

  // Default loading component
  const defaultLoadingComponent = (
    <div className="flex items-center justify-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
      <span className="ml-3 text-gray-500">{t('feeds.infiniteScroll.loadingMore')}</span>
    </div>
  );

  // Default end component
  const defaultEndComponent = (
    <div className="text-center py-8 text-gray-500">
      <p>{t('feeds.infiniteScroll.end.heading')}</p>
      <p className="text-sm mt-1">{t('feeds.infiniteScroll.end.body')}</p>
    </div>
  );

  return (
    <div className={`relative ${className}`}>
      {/* Pull-to-refresh indicator */}
      {enablePullToRefresh && isPulling && (
        <div 
          className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 transition-transform duration-200"
          style={{ 
            transform: `translateY(${Math.max(0, pullDistance - 50)}px)`,
            height: `${Math.min(pullDistance, 100)}px`
          }}
        >
          <div className="flex items-center justify-center h-full">
            {pullDistance > 50 ? (
              <div className="flex items-center space-x-2 text-blue-500">
                <ArrowPathIcon className="w-5 h-5 animate-spin" />
                <span className="text-sm font-medium">{t('feeds.infiniteScroll.pull.release')}</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2 text-gray-500">
                <ArrowPathIcon className="w-5 h-5" />
                <span className="text-sm">{t('feeds.infiniteScroll.pull.hint')}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Refreshing indicator */}
      {isRefreshing && (
        <div className="absolute top-0 left-0 right-0 z-10 bg-white border-b border-gray-200 py-4">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500" />
            <span className="ml-2 text-gray-500">{t('feeds.infiniteScroll.refreshing')}</span>
          </div>
        </div>
      )}

      {/* Scrollable container */}
      <div
        ref={containerRef}
        className="h-full overflow-y-auto"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform: isPulling ? `translateY(${Math.min(pullDistance, 50)}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease-out'
        }}
      >
        {/* Content */}
        <div className="space-y-4 p-4">
          {children}
        </div>

        {/* Loading indicator */}
        {isLoading && hasMore && (
          <div className="px-4">
            {loadingComponent ?? defaultLoadingComponent}
          </div>
        )}

        {/* End of feed */}
        {!hasMore && !isLoading && (
          <div className="px-4">
            {endComponent ?? defaultEndComponent}
          </div>
        )}

        {/* Last item ref for intersection observer */}
        <div ref={lastItemRef} className="h-1" />
      </div>

      {/* Scroll to top button */}
      {enableScrollToTop && showScrollToTop && (
        <button
          type="button"
          onClick={handleScrollToTop}
          className="fixed bottom-4 right-4 flex items-center justify-center min-h-[44px] min-w-[44px] p-3 bg-blue-500 text-white rounded-full shadow-lg hover:bg-blue-600 dark:bg-blue-600 dark:hover:bg-blue-500 transition-all duration-200 z-20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
          aria-label={t('feeds.infiniteScroll.scrollToTopAria')}
        >
          <ChevronUpIcon className="w-6 h-6" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
