'use client'

import { Clock, WifiOff } from 'lucide-react'
import React, { useState } from 'react';

import { usePWAStore } from '@/lib/stores/pwaStore'
import { logger } from '@/lib/utils/logger'

type OfflineQueueProps = {
  className?: string
}

export default function OfflineQueue({ className = '' }: OfflineQueueProps) {
  const { offline, syncData, isSyncing } = usePWAStore()
  const [localSyncing, setLocalSyncing] = useState(false)
  
  // Use real queued actions from store
  const queueItems = offline.offlineData.queuedActions
  const hasOfflineData = queueItems.length > 0

  const handleSync = async () => {
    setLocalSyncing(true)
    try {
      await syncData()
    } catch (error) {
      logger.error('Sync failed:', error instanceof Error ? error : new Error(String(error)))
    } finally {
      setLocalSyncing(false)
    }
  }

  if (!hasOfflineData) {
    return null
  }
  
  const isSyncingNow = isSyncing || localSyncing

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
                {item.action}
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(item.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>

      {offline.isOnline && (
        <button
          onClick={handleSync}
          disabled={isSyncingNow}
          className="w-full mt-3 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50 transition-colors"
        >
          {isSyncingNow ? 'Syncing...' : 'Sync Now'}
        </button>
      )}
    </div>
  )
}
