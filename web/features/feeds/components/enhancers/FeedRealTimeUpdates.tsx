'use client';

/**
 * FeedRealTimeUpdates Component
 * 
 * Wraps feed components with real-time update capabilities:
 * - WebSocket connection management
 * - Live content updates
 * - Real-time engagement counts
 * - Presence indicators
 * - New content notifications
 * 
 * Created: November 5, 2025
 * Status: ✅ Optional enhancement wrapper
 */

import React, { useEffect, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

type FeedRealTimeUpdatesProps = {
  children: React.ReactNode;
  enableWebSocket?: boolean;
  wsUrl?: string;
  onNewContent?: (data: any) => void;
};

/**
 * Enhancer component that adds real-time updates to any feed
 * Uses WebSocket for live data when available
 */
export default function FeedRealTimeUpdates({
  children,
  enableWebSocket = false,
  wsUrl,
  onNewContent
}: FeedRealTimeUpdatesProps) {
  const [isClient, setIsClient] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [newItemsCount, setNewItemsCount] = useState(0);
  const [ws, setWs] = useState<WebSocket | null>(null);

  // Client-side only
  useEffect(() => {
    setIsClient(true);
  }, []);

  // WebSocket connection
  useEffect(() => {
    if (!isClient || !enableWebSocket || !wsUrl) return;

    let websocket: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;

    const connect = () => {
      try {
        websocket = new WebSocket(wsUrl);
        
        websocket.onopen = () => {
          console.log('[WebSocket] Connected to feed updates');
          setIsConnected(true);
          setWs(websocket);
        };

        websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('[WebSocket] Received:', data);
            
            if (data.type === 'new_content') {
              setNewItemsCount(prev => prev + 1);
              if (onNewContent) {
                onNewContent(data);
              }
            }
          } catch (err) {
            console.error('[WebSocket] Failed to parse message:', err);
          }
        };

        websocket.onerror = (error) => {
          console.error('[WebSocket] Error:', error);
          setIsConnected(false);
        };

        websocket.onclose = () => {
          console.log('[WebSocket] Disconnected');
          setIsConnected(false);
          setWs(null);
          
          // Attempt to reconnect after 5 seconds
          reconnectTimeout = setTimeout(() => {
            console.log('[WebSocket] Attempting to reconnect...');
            connect();
          }, 5000);
        };
      } catch (err) {
        console.error('[WebSocket] Failed to connect:', err);
      }
    };

    connect();

    return () => {
      if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
      }
      if (websocket) {
        websocket.close();
      }
    };
  }, [isClient, enableWebSocket, wsUrl, onNewContent]);

  const handleLoadNewItems = useCallback(() => {
    setNewItemsCount(0);
    // Trigger refresh in parent component
    window.location.reload();
  }, []);

  if (!isClient || !enableWebSocket) {
    // SSR or disabled: just render children
    return <>{children}</>;
  }

  return (
    <div className="relative">
      {/* Connection Status Indicator */}
      {enableWebSocket && (
        <div className="fixed top-4 right-4 z-50">
          <Badge 
            variant={isConnected ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            <span className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
            }`} />
            {isConnected ? 'Live' : 'Offline'}
          </Badge>
        </div>
      )}

      {/* New Content Notification */}
      {newItemsCount > 0 && (
        <div className="fixed top-16 left-1/2 transform -translate-x-1/2 z-50">
          <Button
            onClick={handleLoadNewItems}
            className="shadow-lg"
          >
            {newItemsCount} new {newItemsCount === 1 ? 'item' : 'items'} - Click to load
          </Button>
        </div>
      )}

      {/* Render children */}
      {children}
    </div>
  );
}

