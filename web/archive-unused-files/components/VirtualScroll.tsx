'use client'

import React, { useState, useCallback, useRef, useMemo } from 'react'
import { useDebounce } from '@/hooks/useDebounce'

type VirtualScrollProps = {
  items: any[]
  itemHeight?: number
  containerHeight?: number
  searchable?: boolean
  onLoadMore?: () => void
  renderItem: (item: any, index: number) => React.ReactNode
  className?: string
  searchPlaceholder?: string
  emptyStateMessage?: string
  loadingMessage?: string
  errorMessage?: string
  onError?: () => void
  hasMore?: boolean
  isLoading?: boolean
  hasError?: boolean
}


export const VirtualScroll: React.FC<VirtualScrollProps> = ({
  items,
  itemHeight = 50,
  containerHeight = 400,
  searchable = false,
  onLoadMore,
  renderItem,
  className = '',
  searchPlaceholder = 'Search items...',
  emptyStateMessage = 'No items found',
  loadingMessage = 'Loading...',
  errorMessage = 'Failed to load data',
  onError,
  hasMore = false,
  isLoading = false,
  hasError = false,
}) => {
  const [scrollTop, setScrollTop] = useState(0)
  const [searchTerm, setSearchTerm] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)
  const debouncedSearchTerm = useDebounce(searchTerm, 300)

  // Filter items based on search term
  const filteredItems = useMemo(() => {
    if (!debouncedSearchTerm) return items
    
    return items.filter((item) => {
      // Simple search implementation - can be enhanced based on item structure
      const searchableText = typeof item === 'string' 
        ? item 
        : JSON.stringify(item).toLowerCase()
      
      return searchableText.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
    })
  }, [items, debouncedSearchTerm])

  // Calculate total height and visible range
  const totalHeight = filteredItems.length * itemHeight
  const visibleItemCount = Math.ceil(containerHeight / itemHeight)
  const startIndex = Math.floor(scrollTop / itemHeight)
  const endIndex = Math.min(startIndex + visibleItemCount + 2, filteredItems.length)

  // Update visible range

  // Handle scroll events
  const handleScroll = useCallback((event: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop: newScrollTop } = event.currentTarget
    setScrollTop(newScrollTop)

    // Check if we need to load more items
    if (onLoadMore && hasMore && !isLoading) {
      const scrollPercentage = (newScrollTop + containerHeight) / totalHeight
      if (scrollPercentage > 0.8) {
        onLoadMore()
      }
    }
  }, [onLoadMore, hasMore, isLoading, containerHeight, totalHeight])

  // Handle search input
  const handleSearchChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value)
  }, [])

  // Handle retry
  const handleRetry = useCallback(() => {
    if (onError) {
      onError()
    }
  }, [onError])

  // Calculate transform for virtual positioning
  const transform = `translateY(${startIndex * itemHeight}px)`

  // Render visible items
  const visibleItems = filteredItems.slice(startIndex, endIndex).map((item, index) => (
    <div
      key={`${startIndex + index}-${JSON.stringify(item)}`}
      data-testid="virtual-scroll-item"
      style={{
        height: itemHeight,
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        transform: `translateY(${index * itemHeight}px)`,
      }}
    >
      {renderItem(item, startIndex + index)}
    </div>
  ))

  return (
    <div 
      className={`virtual-scroll ${className}`}
      data-testid="virtual-scroll-container"
    >
      {/* Search Input */}
      {searchable && (
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={searchPlaceholder}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            data-testid="search-input"
          />
        </div>
      )}

      {/* Scroll Container */}
      <div
        ref={containerRef}
        style={{
          height: containerHeight,
          overflow: 'auto',
          position: 'relative',
        }}
        onScroll={handleScroll}
        role="list"
        aria-label="Virtual scroll list"
      >
        {/* Loading State */}
        {isLoading && (
          <div 
            className="flex items-center justify-center p-4"
            data-testid="loading-indicator"
          >
            <span>{loadingMessage}</span>
          </div>
        )}

        {/* Error State */}
        {hasError && (
          <div 
            className="flex flex-col items-center justify-center p-4"
            data-testid="error-message"
          >
            <span className="text-red-600 mb-2">{errorMessage}</span>
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              data-testid="retry-button"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !hasError && filteredItems.length === 0 && (
          <div 
            className="flex items-center justify-center p-4"
            data-testid="empty-state"
          >
            <span>{emptyStateMessage}</span>
          </div>
        )}

        {/* Virtual Items */}
        {!isLoading && !hasError && filteredItems.length > 0 && (
          <div
            style={{
              height: totalHeight,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                transform,
              }}
            >
              {visibleItems}
            </div>
          </div>
        )}

        {/* Load More Indicator */}
        {hasMore && !isLoading && !hasError && (
          <div className="flex items-center justify-center p-4">
            <span>Scroll to load more...</span>
          </div>
        )}
      </div>
    </div>
  )
}

// Export for testing
export default VirtualScroll
