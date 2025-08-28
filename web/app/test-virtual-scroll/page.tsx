'use client'

import { useState, useEffect } from 'react'
import { logger } from '@/lib/logger';
import { VirtualScrollWithSearch } from '@/components/performance/VirtualScroll'

export default function TestVirtualScrollPage() {
  const [testData, setTestData] = useState<any[]>([])
  const [searchQuery, setSearchQuery] = useState('')

  // Generate test data
  useEffect(() => {
    const generateData = (count: number) => {
      return Array.from({ length: count }, (_, i) => ({
        id: `item-${i}`,
        title: `Test Item ${i}`,
        description: `Description for item ${i}`,
        timestamp: new Date(Date.now() - i * 1000).toISOString()
      }))
    }

    setTestData(generateData(1000))
  }, [])

  const handleSearchChange = (value: string) => {
    setSearchQuery(value)
    logger.info('Search query:', { query: value })
  }



  const virtualScrollProps = {
    containerHeight: 400,
    itemHeight: 60,
    buffer: 5
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">VirtualScroll Component Test</h1>
      
      {/* Search input */}
      <div className="mb-4">
        <input
          data-testid="search-input"
          type="text"
          placeholder="Search items..."
          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Virtual scroll container */}
      <div className="bg-white rounded-lg shadow p-6">
        <VirtualScrollWithSearch
          items={testData}
          {...virtualScrollProps}
          searchTerm={searchQuery}
          searchFilter={(item: any, term: string) => 
            item.title.toLowerCase().includes(term.toLowerCase()) ||
            item.description.toLowerCase().includes(term.toLowerCase())
          }
          onSearchChange={handleSearchChange}
          renderItem={(item: any) => (
            <div
              key={item.id}
              data-testid="virtual-scroll-item"
              className="p-4 border-b border-gray-200 hover:bg-gray-50"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="text-gray-600">{item.description}</p>
              <p className="text-sm text-gray-400">{item.timestamp}</p>
            </div>
          )}
        />
      </div>

      {/* Test controls */}
      <div className="mt-6 space-y-4">
        <h2 className="text-lg font-semibold">Test Controls</h2>
        
        <div className="flex space-x-4">
          <button
            data-testid="refresh-data"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            onClick={() => window.location.reload()}
          >
            Refresh Data
          </button>
          
          <button
            data-testid="generate-data"
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            onClick={() => {
              const newData = Array.from({ length: 10000 }, (_, i) => ({
                id: `item-${i}`,
                title: `Generated Item ${i}`,
                description: `Generated description for item ${i}`,
                timestamp: new Date(Date.now() - i * 1000).toISOString()
              }))
              setTestData(newData)
            }}
          >
            Generate 10k Items
          </button>
        </div>
      </div>

      {/* Test data info */}
      <div className="mt-6">
        <h2 className="text-lg font-semibold mb-2">Test Data Info</h2>
        <div className="bg-gray-100 p-4 rounded">
          <p><strong>Total Items:</strong> {testData.length}</p>
          <p><strong>Search Query:</strong> {searchQuery || 'None'}</p>
          <p><strong>Container Height:</strong> {virtualScrollProps.containerHeight}px</p>
          <p><strong>Item Height:</strong> {virtualScrollProps.itemHeight}px</p>
        </div>
      </div>
    </div>
  )
}
