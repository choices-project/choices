'use client'

import React from 'react';


type PWAFeaturesSimpleProps = {
  className?: string
  showDetails?: boolean
}

/**
 * Simplified PWA Features Component
 * 
 * A minimal version that doesn't use complex Zustand stores to avoid infinite loops.
 * This component provides basic PWA feature information for E2E testing.
 */
export default function PWAFeaturesSimple({ className = '', showDetails: _showDetails = false }: PWAFeaturesSimpleProps) {
  return (
    <div className={`space-y-4 ${className}`} data-testid="pwa-features">
      {/* Offline Features */}
      <div data-testid="offline-features">
        <h3>Offline Features</h3>
        <ul>
          <li>Offline Voting</li>
          <li>Offline Poll Creation</li>
          <li>Offline Data Sync</li>
        </ul>
      </div>

      {/* Installation Features */}
      <div data-testid="installation-features">
        <h3>PWA Installation</h3>
        <ul>
          <li>Add to Home Screen</li>
          <li>Native App Experience</li>
          <li>Background Sync</li>
        </ul>
      </div>

      {/* Performance Features */}
      <div data-testid="performance-features">
        <h3>Performance Features</h3>
        <ul>
          <li>Fast Loading</li>
          <li>Efficient Caching</li>
          <li>Optimized Resources</li>
        </ul>
      </div>

      {/* Notification Features */}
      <div data-testid="notification-features">
        <h3>Notification Features</h3>
        <ul>
          <li>Push Notifications</li>
          <li>Poll Updates</li>
          <li>System Integration</li>
        </ul>
      </div>
    </div>
  )
}
