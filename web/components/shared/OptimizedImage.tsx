'use client'

import React, { useState, useCallback } from 'react'
import Image from 'next/image'

type OptimizedImageProps = {
  src: string
  alt: string
  width?: number
  height?: number
  lazy?: boolean
  onError?: () => void
  onLoad?: () => void
  className?: string
  priority?: boolean
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width = 400,
  height = 300,
  lazy = true,
  onError,
  onLoad,
  className = '',
  priority = false,
}) => {
  const [isLoading, setIsLoading] = useState(true)
  const [hasError, setHasError] = useState(false)

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    if (onLoad) {
      onLoad()
    }
  }, [onLoad])

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    if (onError) {
      onError()
    }
  }, [onError])

  const handleRetry = useCallback(() => {
    setHasError(false)
    setIsLoading(true)
  }, [])

  return (
    <div 
      className={`optimized-image ${className}`}
      data-testid="optimized-image"
    >
      {/* Loading State */}
      {isLoading && !hasError && (
        <div 
          className="flex items-center justify-center bg-gray-100"
          style={{ width, height }}
          data-testid="loading-indicator"
        >
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div 
          className="flex flex-col items-center justify-center bg-gray-100"
          style={{ width, height }}
          data-testid="image-error"
        >
          <span className="text-red-600 mb-2">Failed to load image</span>
          <button
            onClick={handleRetry}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            data-testid="retry-button"
          >
            Retry
          </button>
        </div>
      )}

      {/* Image */}
      {!hasError && (
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          loading={lazy ? 'lazy' : 'eager'}
          priority={priority}
          onLoad={handleLoad}
          onError={handleError}
          className={`${isLoading ? 'hidden' : ''}`}
          style={{ width, height }}
        />
      )}
    </div>
  )
}

// Export for testing
export default OptimizedImage
