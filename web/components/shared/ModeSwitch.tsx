'use client'

import React from 'react'

import { Button } from '@/components/ui/button'

export type ResultsMode = 'live' | 'final'

type ModeSwitchProps = {
  mode: ResultsMode
  onModeChange: (mode: ResultsMode) => void
  className?: string
}

export default function ModeSwitch({ 
  mode, 
  onModeChange, 
  className = '' 
}: ModeSwitchProps) {
  return (
    <div className={`flex rounded-lg border border-gray-200 p-1 ${className}`}>
      <Button
        variant={mode === 'live' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('live')}
        className="flex-1"
      >
        Live Results
      </Button>
      <Button
        variant={mode === 'final' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onModeChange('final')}
        className="flex-1"
      >
        Final Results
      </Button>
    </div>
  )
}

