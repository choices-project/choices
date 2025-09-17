'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart3, 
  Clock, 
  TrendingUp, 
  Info,
  EyeOff,
  Lock
} from 'lucide-react';

export type ResultsMode = 'live' | 'baseline' | 'drift';

type ModeSwitchProps = {
  mode: ResultsMode;
  onModeChange: (mode: ResultsMode) => void;
  hasBaseline?: boolean;
  isLocked?: boolean;
  showModeDescriptions?: boolean;
  className?: string;
}

export function ModeSwitch({
  mode,
  onModeChange,
  hasBaseline = false,
  isLocked = false,
  showModeDescriptions = true,
  className
}: ModeSwitchProps) {
  const getModeInfo = (modeType: ResultsMode) => {
    switch (modeType) {
      case 'live':
        return {
          label: 'Live',
          icon: <BarChart3 className="h-4 w-4" />,
          description: 'Real-time results as votes are cast',
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          borderColor: 'border-blue-200'
        };
      case 'baseline':
        return {
          label: 'Baseline',
          icon: <Clock className="h-4 w-4" />,
          description: 'Results at the time the poll was closed',
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          borderColor: 'border-green-200'
        };
      case 'drift':
        return {
          label: 'Drift',
          icon: <TrendingUp className="h-4 w-4" />,
          description: 'Changes since the poll was closed',
          color: 'text-purple-600',
          bgColor: 'bg-purple-50',
          borderColor: 'border-purple-200'
        };
    }
  };

  const modes: ResultsMode[] = ['live', 'baseline', 'drift'];
  const availableModes = modes.filter(modeType => {
    if (modeType === 'baseline' || modeType === 'drift') {
      return hasBaseline;
    }
    return true;
  });

  const handleModeChange = (newMode: ResultsMode) => {
    if (isLocked && newMode !== 'baseline') {
      return; // Don't allow mode changes when locked
    }
    onModeChange(newMode);
  };

  if (availableModes.length <= 1) {
    return null; // Don't show switch if only one mode is available
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Mode Tabs */}
        <Tabs value={mode} onValueChange={(value) => handleModeChange(value as ResultsMode)}>
          <TabsList className="grid w-full grid-cols-3">
            {modes.map((modeType) => {
              const modeInfo = getModeInfo(modeType);
              const isAvailable = availableModes.includes(modeType);
              const isDisabled = !isAvailable || (isLocked && modeType !== 'baseline');
              
              return (
                <TabsTrigger
                  key={modeType}
                  value={modeType}
                  disabled={isDisabled}
                  className="flex items-center space-x-2"
                >
                  {modeInfo.icon}
                  <span>{modeInfo.label}</span>
                  {!isAvailable && (
                    <EyeOff className="h-3 w-3 opacity-50" />
                  )}
                  {isLocked && modeType !== 'baseline' && (
                    <Lock className="h-3 w-3 opacity-50" />
                  )}
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>

        {/* Mode Description */}
        {showModeDescriptions && (
          <div className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
            <Info className="h-4 w-4 text-gray-500 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                {getModeInfo(mode).description}
              </p>
              {mode === 'drift' && hasBaseline && (
                <p className="text-xs text-gray-500 mt-1">
                  Drift analysis shows how results have changed since the poll was closed.
                </p>
              )}
              {isLocked && (
                <div className="flex items-center space-x-1 mt-2">
                  <Lock className="h-3 w-3 text-gray-500" />
                  <span className="text-xs text-gray-500">
                    Poll is locked - only baseline results are available
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mode Status Indicators */}
        <div className="flex flex-wrap gap-2">
          {modes.map((modeType) => {
            const modeInfo = getModeInfo(modeType);
            const isActive = mode === modeType;
            const isAvailable = availableModes.includes(modeType);
            
            return (
              <Badge
                key={modeType}
                variant={isActive ? "default" : "outline"}
                className={`
                  flex items-center space-x-1 text-xs
                  ${isActive ? modeInfo.bgColor + ' ' + modeInfo.color : ''}
                  ${!isAvailable ? 'opacity-50' : ''}
                `}
              >
                {modeInfo.icon}
                <span>{modeInfo.label}</span>
                {!isAvailable && <EyeOff className="h-3 w-3" />}
              </Badge>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default ModeSwitch;
