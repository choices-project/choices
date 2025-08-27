'use client'

import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { performanceUtils } from '@/lib/performance/component-optimization'

interface VirtualScrollProps<T> {
  items: T[]
  itemHeight: number
  containerHeight: number
  renderItem: (item: T, index: number) => React.ReactNode
  overscan?: number
  className?: string
  onScroll?: (scrollTop: number) => void
  onVisibleItemsChange?: (visibleItems: T[]) => void
}

export default function VirtualScroll<T>({
  items,
  itemHeight,
  containerHeight,
  renderItem,
  overscan = 5,
  className = '',
  onScroll,
  onVisibleItemsChange
}: VirtualScrollProps<T>) {
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const scrollElementRef = useRef<HTMLDivElement>(null)

  // Calculate visible items using performance utilities
  const visibleItems = useMemo(() => {
    const { startIndex, endIndex, offsetY } = performanceUtils.virtualScroll.getVisibleItems(
      items.length,
      itemHeight,
      containerHeight,
      scrollTop
    )

    // Add overscan
    const overscanStart = Math.max(0, startIndex - overscan)
    const overscanEnd = Math.min(items.length, endIndex + overscan)

    return {
      startIndex: overscanStart,
      endIndex: overscanEnd,
      offsetY: overscanStart * itemHeight,
      visibleItems: items.slice(overscanStart, overscanEnd)
    }
  }, [items, itemHeight, containerHeight, scrollTop, overscan])

  // Calculate total height
  const totalHeight = useMemo(() => {
    return performanceUtils.virtualScroll.getTotalHeight(items.length, itemHeight)
  }, [items.length, itemHeight])

  // Handle scroll events with throttling
  const handleScroll = useCallback(
    performanceUtils.throttle((event: React.UIEvent<HTMLDivElement>) => {
      const scrollTop = event.currentTarget.scrollTop
      setScrollTop(scrollTop)
      onScroll?.(scrollTop)
    }, 16), // 60fps throttling
    [onScroll]
  )

  // Notify parent of visible items change
  useEffect(() => {
    onVisibleItemsChange?.(visibleItems.visibleItems)
  }, [visibleItems.visibleItems, onVisibleItemsChange])

  // Scroll to specific item
  const scrollToItem = useCallback((index: number) => {
    if (containerRef.current) {
      const scrollTop = index * itemHeight
      containerRef.current.scrollTop = scrollTop
    }
  }, [itemHeight])

  // Scroll to top
  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [])

  // Scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight - containerHeight
    }
  }, [totalHeight, containerHeight])

  // Expose scroll methods
  React.useImperativeHandle(
    React.useRef(),
    () => ({
      scrollToItem,
      scrollToTop,
      scrollToBottom,
      scrollTop,
      totalHeight
    }),
    [scrollToItem, scrollToTop, scrollToBottom, scrollTop, totalHeight]
  )

  return (
    <div
      ref={containerRef}
      className={`virtual-scroll-container ${className}`}
      style={{
        height: containerHeight,
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      {/* Spacer for total height */}
      <div
        ref={scrollElementRef}
        style={{
          height: totalHeight,
          position: 'relative'
        }}
      >
        {/* Visible items */}
        <div
          style={{
            position: 'absolute',
            top: visibleItems.offsetY,
            left: 0,
            right: 0
          }}
        >
          {visibleItems.visibleItems.map((item, index) => {
            const actualIndex = visibleItems.startIndex + index
            return (
              <div
                key={actualIndex}
                style={{
                  height: itemHeight,
                  position: 'relative'
                }}
              >
                {renderItem(item, actualIndex)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// Optimized list item component
interface VirtualListItemProps {
  children: React.ReactNode
  height: number
  className?: string
  onClick?: () => void
  onMouseEnter?: () => void
  onMouseLeave?: () => void
}

export const VirtualListItem = React.memo(function VirtualListItem({
  children,
  height,
  className = '',
  onClick,
  onMouseEnter,
  onMouseLeave
}: VirtualListItemProps) {
  return (
    <div
      className={`virtual-list-item ${className}`}
      style={{
        height,
        display: 'flex',
        alignItems: 'center',
        padding: '0 16px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'background-color 0.2s ease'
      }}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {children}
    </div>
  )
})

// Virtual scroll with search functionality
interface VirtualScrollWithSearchProps<T> extends VirtualScrollProps<T> {
  searchTerm: string
  searchFilter: (item: T, searchTerm: string) => boolean
  placeholder?: string
  onSearchChange?: (searchTerm: string) => void
}

export function VirtualScrollWithSearch<T>({
  items,
  searchTerm,
  searchFilter,
  placeholder = 'Search...',
  onSearchChange,
  ...virtualScrollProps
}: VirtualScrollWithSearchProps<T>) {
  // Filter items based on search
  const filteredItems = useMemo(() => {
    if (!searchTerm) return items
    return items.filter(item => searchFilter(item, searchTerm))
  }, [items, searchTerm, searchFilter])

  // Debounced search handler
  const handleSearchChange = useCallback(
    performanceUtils.debounce((value: string) => {
      onSearchChange?.(value)
    }, 300),
    [onSearchChange]
  )

  return (
    <div className="virtual-scroll-with-search">
      {/* Search input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder={placeholder}
          defaultValue={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {/* Results count */}
      <div className="mb-2 text-sm text-gray-600">
        {filteredItems.length} of {items.length} items
      </div>

      {/* Virtual scroll */}
      <VirtualScroll
        {...virtualScrollProps}
        items={filteredItems}
      />
    </div>
  )
}

// Virtual scroll with infinite loading
interface VirtualScrollWithInfiniteProps<T> extends VirtualScrollProps<T> {
  hasMore: boolean
  isLoading: boolean
  onLoadMore: () => void
  loadingComponent?: React.ReactNode
}

export function VirtualScrollWithInfinite<T>({
  items,
  hasMore,
  isLoading,
  onLoadMore,
  loadingComponent,
  onScroll,
  ...virtualScrollProps
}: VirtualScrollWithInfiniteProps<T>) {
  const [isNearBottom, setIsNearBottom] = useState(false)

  // Check if near bottom
  const checkNearBottom = useCallback((scrollTop: number) => {
    const { containerHeight } = virtualScrollProps
    const totalHeight = performanceUtils.virtualScroll.getTotalHeight(items.length, virtualScrollProps.itemHeight)
    const threshold = 100 // pixels from bottom

    const nearBottom = scrollTop + containerHeight >= totalHeight - threshold
    setIsNearBottom(nearBottom)
  }, [items.length, virtualScrollProps.itemHeight, virtualScrollProps.containerHeight])

  // Handle scroll with bottom detection
  const handleScroll = useCallback((scrollTop: number) => {
    onScroll?.(scrollTop)
    checkNearBottom(scrollTop)
  }, [onScroll, checkNearBottom])

  // Load more when near bottom
  useEffect(() => {
    if (isNearBottom && hasMore && !isLoading) {
      onLoadMore()
    }
  }, [isNearBottom, hasMore, isLoading, onLoadMore])

  return (
    <div className="virtual-scroll-with-infinite">
      <VirtualScroll
        {...virtualScrollProps}
        onScroll={handleScroll}
      />
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="mt-4 text-center">
          {loadingComponent || (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span className="text-gray-600">Loading more...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// Export all components
export {
  VirtualScroll,
  VirtualListItem,
  VirtualScrollWithSearch,
  VirtualScrollWithInfinite
}
