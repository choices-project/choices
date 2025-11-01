'use client'

import { Clock, WifiOff } from 'lucide-react'
import React, { useState, useEffect } from 'react';


import { usePWA } from '@/hooks/usePWA'
import { logger } from '@/lib/utils/logger'

type OfflineQueueProps = {
  className?: string
}

export default function OfflineQueue({ className = '' }: OfflineQueueProps) {
  const pwa = usePWA()
  const [queueItems, setQueueItems] = useState<any[]>([])
  const [isSyncing, setIsSyncing] = useState(false)

  useEffect(() => {
    // Simulate offline queue items
    const mockQueueItems = [
      { id: '1', type: 'vote', pollId: 'poll-1', timestamp: Date.now() - 300000 },
      { id: '2', type: 'comment', pollId: 'poll-1', timestamp: Date.now() - 180000 },
      { id: '3', type: 'vote', pollId: 'poll-2', timestamp: Date.now() - 60000 }
    ]
    setQueueItems(mockQueueItems)
  }, [])

  const handleSync = async () => {
    setIsSyncing(true)
    try {
      await pwa.syncOfflineData()
      setQueueItems([])
    } catch (error) {
      logger.error('Sync failed:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setIsSyncing(false)
    }
  }

  if (!pwa.hasOfflineData && queueItems.length === 0) {
    return null
  }

  return (
    <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`} data-testid="offline-queue-component">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <WifiOff className="w-5 h-5 text-yellow-600" />
          <h3 className="text-sm font-medium text-yellow-800">Offline Actions</h3>
        </div>
        <span className="text-sm text-yellow-700">{queueItems.length} pending</span>
      </div>

      <div className="space-y-2">
        {queueItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">
                {item.label === 'vote' ? 'Vote' : 'Comment'} on Poll {item.pollId}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(item.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {pwa.isOnline && (
        <button
          onClick={handleSync}
          disabled={isSyncing}
          className="w-full mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          {isSyncing ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  )
}
