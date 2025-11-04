'use client'

import { RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react'
import React, { useState } from 'react';

import { usePWAStore } from '@/lib/stores/pwaStore'

type OfflineSyncProps = {
  className?: string
}

export default function OfflineSync({ className = '' }: OfflineSyncProps) {
  const { offline, syncData } = usePWAStore()
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'success' | 'error'>('idle')
  const [lastSync, setLastSync] = useState<Date | null>(null)
  
  const queuedActions = offline.offlineData.queuedActions
  const hasOfflineData = queuedActions.length > 0

  const handleSync = async () => {
    setSyncStatus('syncing')
    try {
      await syncData()
      setSyncStatus('success')
      setLastSync(new Date())
      setTimeout(() => setSyncStatus('idle'), 3000)
    } catch {
      setSyncStatus('error')
      setTimeout(() => setSyncStatus('idle'), 3000)
    }
  }

  if (!hasOfflineData) {
    return null
  }

  return (
    <div className={`bg-blue-50 border border-blue-200 rounded-lg p-4 ${className}`} data-testid="offline-sync">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <RefreshCw className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-medium text-blue-800">Background Sync</h3>
        </div>
        {lastSync && (
          <span className="text-xs text-blue-600">
            Last sync: {lastSync.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="space-y-2">
        {queuedActions.slice(0, 3).map((action) => (
          <div key={action.id} className="flex items-center justify-between p-2 bg-white rounded border">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-700">{action.action} pending</span>
            </div>
            <span className="text-xs text-gray-500">
              {new Date(action.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
        {queuedActions.length > 3 && (
          <div className="text-xs text-center text-gray-500">
            +{queuedActions.length - 3} more actions
          </div>
        )}
      </div>

      <button
        onClick={handleSync}
        disabled={syncStatus === 'syncing'}
        className="w-full mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
      >
        {syncStatus === 'syncing' ? 'Syncing...' : 'Sync Now'}
      </button>

      {syncStatus === 'success' && (
        <div className="mt-2 p-2 bg-green-100 rounded border">
          <div className="flex items-center space-x-2 text-green-800">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">Sync completed successfully</span>
          </div>
        </div>
      )}

      {syncStatus === 'error' && (
        <div className="mt-2 p-2 bg-red-100 rounded border">
          <div className="flex items-center space-x-2 text-red-800">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm">Sync failed. Please try again.</span>
          </div>
        </div>
      )}
    </div>
  )
}
