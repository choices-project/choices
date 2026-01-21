'use client';

import React, { useState, useEffect } from 'react';

type ClientOnlyProps = {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export default function ClientOnly({ children, fallback = null }: ClientOnlyProps) {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    // #region agent log - Track ClientOnly mount behavior
    const mountLogData = {
      location: 'ClientOnly.tsx:useEffect:mount',
      message: 'ClientOnly mounted - switching from fallback to children',
      data: {
        hasMountedBefore: hasMounted,
        hasFallback: fallback !== null,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'F',
    };
    if (process.env.NODE_ENV === 'development') {
      fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(mountLogData),
      }).catch(() => undefined);
    }
    // #endregion

    setHasMounted(true)
  }, [fallback, hasMounted])

  // #region agent log - Track render decisions
  if (typeof window !== 'undefined' && !hasMounted) {
    const renderLogData = {
      location: 'ClientOnly.tsx:render:fallback',
      message: 'ClientOnly rendering fallback (not mounted yet)',
      data: {
        hasMounted,
        hasFallback: fallback !== null,
        timestamp: Date.now(),
      },
      timestamp: Date.now(),
      sessionId: 'debug-session',
      runId: 'run1',
      hypothesisId: 'F',
    };
    if (process.env.NODE_ENV === 'development') {
      fetch('http://127.0.0.1:7242/ingest/6a732aed-2d72-4883-a63a-f3c892fc1216', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(renderLogData),
      }).catch(() => undefined);
    }
  }
  // #endregion

  if (!hasMounted) {
    return <>{fallback}</>
  }

  return <>{children}</>
}
