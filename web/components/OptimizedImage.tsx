'use client'

import Image from 'next/image'
import React, { useState, useCallback, useRef, useEffect } from 'react'

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

  // Refs for stable callback props
  const onLoadRef = useRef(onLoad);
  useEffect(() => { onLoadRef.current = onLoad; }, [onLoad]);
  const onErrorRef = useRef(onError);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);

  const handleLoad = useCallback(() => {
    setIsLoading(false)
    onLoadRef.current?.()
  }, [])  

  const handleError = useCallback(() => {
    setIsLoading(false)
    setHasError(true)
    onErrorRef.current?.()
  }, [])  

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
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
