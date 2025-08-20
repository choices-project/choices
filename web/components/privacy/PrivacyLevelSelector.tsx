'use client';

import React, { useState } from 'react';
import { Shield, Info, CheckCircle } from 'lucide-react'
import { PrivacyLevel, HybridPrivacyManager, PRIVACY_DESCRIPTIONS } from '@/lib/hybrid-privacy'

interface PrivacyLevelSelectorProps {
  value: PrivacyLevel;
  onChange: (level: PrivacyLevel) => void;
  disabled?: boolean;
  showRecommendation?: boolean;
  pollData?: {
    title: string;
    description: string;
    category?: string;
  };
}

export const PrivacyLevelSelector: React.FC<PrivacyLevelSelectorProps> = ({
  value,
  onChange,
  disabled = false,
  showRecommendation = true,
  pollData
}) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const recommendedLevel = pollData 
    ? HybridPrivacyManager.getRecommendedPrivacyLevel(pollData)
    : 'public';

  const levels: PrivacyLevel[] = ['public', 'private', 'high-privacy'];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">
          Privacy Level
        </label>
        {showRecommendation && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Info className="h-3 w-3" />
            <span>Recommended: {PRIVACY_DESCRIPTIONS[recommendedLevel].title}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {levels.map((level: any) => {
          const config = HybridPrivacyManager.getPrivacyConfig(level);
          const description = PRIVACY_DESCRIPTIONS[level];
          const isSelected = value === level;
          const isRecommended = recommendedLevel === level;

          return (
            <div
              key={level}
              className={`
                relative p-4 border rounded-lg cursor-pointer transition-all
                ${isSelected 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
              `}
              onClick={() => !disabled && onChange(level)}
            >
              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2">
                  <CheckCircle className="h-5 w-5 text-blue-500" />
                </div>
              )}

              {/* Recommended badge */}
              {isRecommended && !isSelected && (
                <div className="absolute top-2 right-2">
                  <div className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                    Recommended
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{description.icon}</span>
                <div>
                  <h3 className="font-medium text-gray-900">{description.title}</h3>
                  <p className="text-xs text-gray-500">{description.recommended}</p>
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 mb-3">{description.description}</p>

              {/* Performance indicators */}
              <div className="space-y-1 text-xs text-gray-500">
                <div className="flex justify-between">
                  <span>Response Time:</span>
                  <span>{config.responseTime}ms</span>
                </div>
                <div className="flex justify-between">
                  <span>Cost:</span>
                  <span>{config.costMultiplier}x</span>
                </div>
              </div>

              {/* Features */}
              {showDetails && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <ul className="text-xs text-gray-600 space-y-1">
                    {config.features.map((feature: any, index: any) => (
                      <li key={index} className="flex items-center gap-1">
                        <div className="w-1 h-1 bg-gray-400 rounded-full" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Toggle details */}
      <button
        type="button"
        onClick={() => setShowDetails(!showDetails)}
        className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
      >
        {showDetails ? 'Hide' : 'Show'} detailed features
      </button>

      {/* Privacy level info */}
      <div className="bg-gray-50 p-3 rounded-lg">
        <div className="flex items-start gap-2">
          <Shield className="h-4 w-4 text-gray-500 mt-0.5" />
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Privacy Protection:</p>
            <p>
              {value === 'public' && 'Basic privacy with fast voting'}
              {value === 'private' && 'Enhanced privacy with user authentication'}
              {value === 'high-privacy' && 'Maximum privacy with cryptographic guarantees'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
