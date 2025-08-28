'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image';

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  sizes?: string
  srcSet?: string
  priority?: boolean
  className?: string
  placeholder?: string
  fallback?: string
  onLoad?: () => void
  onError?: () => void
  onClick?: () => void
  lazy?: boolean
  webp?: boolean
  quality?: number
}

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  sizes,
  srcSet,
  priority = false,
  className = '',
  placeholder,
  fallback,
  onLoad,
  onError,
  onClick,
  lazy = true,
  webp = true,
  quality = 80
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isError, setIsError] = useState(false)
  const [isInView, setIsInView] = useState(!lazy)
  const [currentSrc, setCurrentSrc] = useState(placeholder || src)
  const imgRef = useRef<HTMLImageElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Generate optimized src with WebP support
  const generateOptimizedSrc = useCallback((originalSrc: string): string => {
    if (!webp || !originalSrc) return originalSrc

    // Check if browser supports WebP
    const supportsWebP = typeof window !== 'undefined' && 
      typeof window.createImageBitmap === 'function' && 
      typeof window.fetch === 'function'

    if (!supportsWebP) return originalSrc

    // Convert to WebP if possible
    try {
      const url = new URL(originalSrc, window.location.origin)
      url.searchParams.set('format', 'webp')
      url.searchParams.set('quality', quality.toString())
      return url.toString()
    } catch {
      return originalSrc
    }
  }, [webp, quality])

  // Generate responsive srcSet
  const generateResponsiveSrcSet = useCallback((originalSrc: string): string => {
    if (!originalSrc || !width) return srcSet || ''

    const breakpoints = [320, 640, 768, 1024, 1280, 1920]
    const srcSetParts = breakpoints
      .filter(bp => bp <= width * 2) // Don't generate larger than 2x
      .map(bp => {
        const optimizedSrc = generateOptimizedSrc(originalSrc)
        const url = new URL(optimizedSrc, window.location.origin)
        url.searchParams.set('w', bp.toString())
        url.searchParams.set('q', quality.toString())
        return `${url.toString()} ${bp}w`
      })

    return srcSetParts.join(', ')
  }, [width, generateOptimizedSrc, quality, srcSet])

  // Generate sizes attribute
  const generateSizes = useCallback((): string => {
    if (sizes) return sizes
    if (!width) return '100vw'

    // Default responsive sizes
    return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${Math.min(width, 800)}px`
  }, [sizes, width])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            setCurrentSrc(generateOptimizedSrc(src))
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '50px 0px',
        threshold: 0.1
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
      observerRef.current = observer
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect()
      }
    }
  }, [lazy, isInView, src, generateOptimizedSrc])

  // Handle image load
  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    setIsError(false)
    onLoad?.()
  }, [onLoad])

  // Handle image error
  const handleError = useCallback(() => {
    setIsError(true)
    if (fallback && currentSrc !== fallback) {
      setCurrentSrc(fallback)
    }
    onError?.()
  }, [fallback, currentSrc, onError])

  // Preload image if priority
  useEffect(() => {
    if (priority && !isInView) {
      setIsInView(true)
      setCurrentSrc(generateOptimizedSrc(src))
    }
  }, [priority, isInView, src, generateOptimizedSrc])

  // Generate optimized props
  const optimizedProps = {
    src: currentSrc,
    alt,
    width,
    height,
    sizes: generateSizes(),
    srcSet: generateResponsiveSrcSet(src),
          loading: priority ? 'eager' as const : 'lazy' as const,
      decoding: 'async' as const,
    onLoad: handleLoad,
    onError: handleError,
    onClick,
    className: `optimized-image ${className}`,
    style: {
      width: width ? `${width}px` : 'auto',
      height: height ? `${height}px` : 'auto',
      opacity: isLoaded ? 1 : 0,
      transition: 'opacity 0.3s ease-in-out'
    }
  }

  return (
    <div className="optimized-image-container">
      {/* Placeholder */}
      {!isLoaded && placeholder && (
        <Image
          src={placeholder}
          alt=""
          className="optimized-image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: 'blur(10px)',
            transform: 'scale(1.1)'
          }}
         width={1} height={1} />
      )}

      {/* Main image */}
      <Image
        ref={imgRef}
        {...optimizedProps}
       alt="" width={1} height={1} />

      {/* Loading indicator */}
      {!isLoaded && !isError && (
        <div className="optimized-image-loading">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="optimized-image-error">
          <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-sm text-gray-500">Failed to load image</span>
        </div>
      )}
    </div>
  )
}

// Background image component
interface OptimizedBackgroundImageProps {
  src: string
  alt?: string
  className?: string
  children?: React.ReactNode
  webp?: boolean
  quality?: number
  lazy?: boolean
}

export function OptimizedBackgroundImage({
  src,
  alt,
  className = '',
  children,
  webp = true,
  quality = 80,
  lazy = true
}: OptimizedBackgroundImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(!lazy)
  const [currentSrc, setCurrentSrc] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  // Generate optimized background src
  const generateOptimizedBackgroundSrc = useCallback((originalSrc: string): string => {
    if (!webp || !originalSrc) return originalSrc

    try {
      const url = new URL(originalSrc, window.location.origin)
      url.searchParams.set('format', 'webp')
      url.searchParams.set('quality', quality.toString())
      return url.toString()
    } catch {
      return originalSrc
    }
  }, [webp, quality])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || isInView) return

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true)
            setCurrentSrc(generateOptimizedBackgroundSrc(src))
            observer.disconnect()
          }
        })
      },
      {
        rootMargin: '100px 0px',
        threshold: 0.1
      }
    )

    if (containerRef.current) {
      observer.observe(containerRef.current)
    }

    return () => observer.disconnect()
  }, [lazy, isInView, src, generateOptimizedBackgroundSrc])

  // Preload if priority
  useEffect(() => {
    if (!lazy) {
      setIsInView(true)
      setCurrentSrc(generateOptimizedBackgroundSrc(src))
    }
  }, [lazy, src, generateOptimizedBackgroundSrc])

  return (
    <div
      ref={containerRef}
      className={`optimized-background-image ${className}`}
      style={{
        backgroundImage: currentSrc ? `url(${currentSrc})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        position: 'relative',
        opacity: isLoaded ? 1 : 0,
        transition: 'opacity 0.3s ease-in-out'
      }}
      role={alt ? 'img' : undefined}
      aria-label={alt}
    >
      {/* Hidden image for loading detection */}
      {currentSrc && (
        <Image
          src={currentSrc}
          alt=""
          width={1}
          height={1}
          style={{ display: 'none' }}
          onLoad={() => setIsLoaded(true)}
        />
      )}

      {/* Content */}
      {children}
    </div>
  )
}

// Picture component with multiple formats
interface OptimizedPictureProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  formats?: string[]
  sizes?: string
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedPicture({
  src,
  alt,
  width,
  height,
  className = '',
  formats = ['webp', 'avif', 'jpeg'],
  sizes,
  onLoad,
  onError
}: OptimizedPictureProps) {
  const [isLoaded, setIsLoaded] = useState(false)

  // Generate srcSet for different formats
  const generateSrcSet = useCallback((format: string): string => {
    const breakpoints = [320, 640, 768, 1024, 1280, 1920]
    return breakpoints
      .filter(bp => !width || bp <= width * 2)
      .map(bp => {
        const url = new URL(src, window.location.origin)
        url.searchParams.set('format', format)
        url.searchParams.set('w', bp.toString())
        url.searchParams.set('q', '80')
        return `${url.toString()} ${bp}w`
      })
      .join(', ')
  }, [src, width])

  // Generate sizes attribute
  const generateSizes = useCallback((): string => {
    if (sizes) return sizes
    if (!width) return '100vw'
    return `(max-width: 640px) 100vw, (max-width: 1024px) 50vw, ${Math.min(width, 800)}px`
  }, [sizes, width])

  return (
    <picture className={`optimized-picture ${className}`}>
      {/* WebP source */}
      {formats.includes('webp') && (
        <source
          type="image/webp"
          srcSet={generateSrcSet('webp')}
          sizes={generateSizes()}
        />
      )}

      {/* AVIF source */}
      {formats.includes('avif') && (
        <source
          type="image/avif"
          srcSet={generateSrcSet('avif')}
          sizes={generateSizes()}
        />
      )}

      {/* Fallback image */}
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        decoding={"async" as "async"}
        onLoad={() => {
          setIsLoaded(true)
          onLoad?.()
        }}
        onError={onError}
        style={{
          width: width ? `${width}px` : 'auto',
          height: height ? `${height}px` : 'auto',
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
    </picture>
  )
}

// All components are already exported individually above
