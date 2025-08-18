'use client';

import React from 'react';
import { Shield, Lock, Globe, Info } from 'lucide-react';
import { PrivacyLevel, PRIVACY_DESCRIPTIONS } from '@/lib/hybrid-privacy';

interface PrivacyLevelIndicatorProps {
  level: PrivacyLevel;
  size?: 'sm' | 'md' | 'lg';
  showTooltip?: boolean;
  className?: string;
}

export const PrivacyLevelIndicator: React.FC<PrivacyLevelIndicatorProps> = ({
  level,
  size = 'md',
  showTooltip = true,
  className = ''
}) => {
  const description = PRIVACY_DESCRIPTIONS[level];
  
  const sizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const getIcon = () => {
    switch (level) {
      case 'public':
        return <Globe className={iconSizes[size]} />;
      case 'private':
        return <Lock className={iconSizes[size]} />;
      case 'high-privacy':
        return <Shield className={iconSizes[size]} />;
      default:
        return <Globe className={iconSizes[size]} />;
    }
  };

  const getColorClasses = () => {
    switch (level) {
      case 'public':
        return 'text-green-600 bg-green-100 border-green-200';
      case 'private':
        return 'text-blue-600 bg-blue-100 border-blue-200';
      case 'high-privacy':
        return 'text-purple-600 bg-purple-100 border-purple-200';
      default:
        return 'text-gray-600 bg-gray-100 border-gray-200';
    }
  };

  const getEmoji = () => {
    switch (level) {
      case 'public':
        return '🌐';
      case 'private':
        return '🔒';
      case 'high-privacy':
        return '🛡️';
      default:
        return '🌐';
    }
  };

  return (
    <div className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border ${getColorClasses()} ${sizeClasses[size]} ${className}`}>
      <span className="text-lg leading-none">{getEmoji()}</span>
      <span className="font-medium">{description.title}</span>
      {showTooltip && (
        <div className="group relative">
          <Info className={`${iconSizes[size]} text-gray-400 cursor-help`} />
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            {description.description}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Compact version for small spaces
export const CompactPrivacyIndicator: React.FC<Omit<PrivacyLevelIndicatorProps, 'size'>> = ({
  level,
  showTooltip = false,
  className = ''
}) => {
  const getEmoji = () => {
    switch (level) {
      case 'public':
        return '🌐';
      case 'private':
        return '🔒';
      case 'high-privacy':
        return '🛡️';
      default:
        return '🌐';
    }
  };

  const getColorClasses = () => {
    switch (level) {
      case 'public':
        return 'text-green-600';
      case 'private':
        return 'text-blue-600';
      case 'high-privacy':
        return 'text-purple-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <span className={`text-lg ${getColorClasses()} ${className}`} title={PRIVACY_DESCRIPTIONS[level].description}>
      {getEmoji()}
    </span>
  );
};
