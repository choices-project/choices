'use client'

import { useState } from 'react'
import Image from 'next/image';
import { logger } from '@/lib/logger';
import OptimizedImage from '@/components/performance/OptimizedImage'
import { safeReload, safeBrowserAccess } from '@/lib/ssr-safe'

export default function TestOptimizedImagePage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')

  const testImages = [
    {
      src: '/test-images/valid.jpg',
      alt: 'Test image 1 - Beautiful landscape',
      width: 400,
      height: 300
    },
    {
      src: '/test-images/valid.png',
      alt: 'Test image 2 - Abstract design',
      width: 300,
      height: 400
    },
    {
      src: '/test-images/valid.webp',
      alt: 'Test image 3 - Modern interface',
      width: 500,
      height: 250
    }
  ]

  const handleImageClick = (src: string) => {
    setSelectedImage(src)
    setShowModal(true)
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">OptimizedImage Component Test</h1>
      
      {/* Image grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {testImages.map((image, index) => (
          <div
            key={index}
            data-testid="optimized-image"
            className="bg-white rounded-lg shadow p-4 cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => handleImageClick(image.src)}
            role="img"
            aria-label={image.alt}
            tabIndex={0}
          >
            <OptimizedImage
              src={image.src}
              alt={image.alt}
              width={image.width}
              height={image.height}
              className="w-full h-auto rounded"
              priority={index === 0}
            />
            <div className="mt-2">
              <p className="text-sm font-medium">{image.alt}</p>
              <p className="text-xs text-gray-500">
                {image.width} × {image.height}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Test controls */}
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold">Test Controls</h2>
        
        <div className="flex space-x-4">
          <button
            data-testid="retry-button"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => safeReload()}
          >
            Retry Loading
          </button>
          
          <button
            data-testid="test-accessibility"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              // Test accessibility features
              const doc = safeBrowserAccess.document()
              if (doc) {
                const images = doc.querySelectorAll('[data-testid="optimized-image"]')
                images.forEach((img, index) => {
                  const ariaLabel = img.getAttribute('aria-label')
                  logger.info(`Image ${index + 1} alt text:`, { ariaLabel: ariaLabel || 'none' })
                })
              }
            }}
          >
            Test Accessibility
          </button>
        </div>
      </div>

      {/* Test info */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Test Information</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Total Images:</strong> {testImages.length}</p>
          <p><strong>Formats:</strong> JPG, PNG, WebP</p>
          <p><strong>Lazy Loading:</strong> Enabled</p>
          <p><strong>Accessibility:</strong> ARIA labels and alt text</p>
        </div>
      </div>

      {/* Image Modal */}
      {showModal && (
        <div
          data-testid="image-modal"
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div className="bg-white rounded-lg p-6 max-w-2xl mx-4">
            <div className="text-center">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Image Preview
              </h3>
              <Image
                src={selectedImage}
                alt="Preview"
                className="max-w-full h-auto rounded"
               width={1} height={1} />
              <div className="mt-4 flex space-x-3">
                <button
                  data-testid="close-modal"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  data-testid="copy-image-url"
                  onClick={() => {
                    const nav = safeBrowserAccess.navigator()
                    if (nav && nav.clipboard) {
                      nav.clipboard.writeText(selectedImage)
                      logger.info('Image URL copied to clipboard')
                    }
                  }}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  Copy URL
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading states */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Loading States</h2>
        <div className="space-y-2">
          <div
            data-testid="loading-indicator"
            className="hidden bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded"
          >
            Loading images...
          </div>
          <div
            data-testid="image-error"
            className="hidden bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          >
            Failed to load image
          </div>
          <div
            data-testid="fallback-image"
            className="hidden bg-gray-100 border border-gray-400 text-gray-700 px-4 py-3 rounded"
          >
            Fallback image displayed
          </div>
        </div>
      </div>
    </div>
  )
}
