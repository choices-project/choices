'use client';

import React from 'react';
import { ExternalLink, Database, CheckCircle } from 'lucide-react';

type AttributionFooterProps = {
  sources: Array<{
    name: string;
    url?: string;
    type: string;
  }>;
  className?: string;
}

export function AttributionFooter({ sources, className = '' }: AttributionFooterProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'govtrack_api':
        return <Database className="h-3 w-3" />;
      case 'openstates_api':
        return <Database className="h-3 w-3" />;
      case 'propublica_api':
        return <Database className="h-3 w-3" />;
      case 'google_civic_api':
        return <Database className="h-3 w-3" />;
      case 'manual_verification_sf':
      case 'manual_verification_la':
        return <CheckCircle className="h-3 w-3" />;
      default:
        return <Database className="h-3 w-3" />;
    }
  };

  const getSourceColor = (type: string) => {
    switch (type) {
      case 'govtrack_api':
        return 'text-blue-600';
      case 'openstates_api':
        return 'text-green-600';
      case 'propublica_api':
        return 'text-purple-600';
      case 'google_civic_api':
        return 'text-red-600';
      case 'manual_verification_sf':
      case 'manual_verification_la':
        return 'text-emerald-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className={`mt-4 pt-3 border-t border-gray-200 ${className}`}>
      <div className="flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-2">
          <span className="font-medium">Data Sources:</span>
          <div className="flex items-center gap-3">
            {sources.map((source, index) => (
              <div key={index} className="flex items-center gap-1">
                <span className={getSourceColor(source.type)}>
                  {getSourceIcon(source.type)}
                </span>
                {source.url ? (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-gray-700 transition-colors flex items-center gap-1"
                  >
                    {source.name}
                    <ExternalLink className="h-2 w-2" />
                  </a>
                ) : (
                  <span>{source.name}</span>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Last updated: {new Date().toLocaleDateString()}
        </div>
      </div>
    </div>
  );
}

// Compact version for cards
export function AttributionBadge({ sources, className = '' }: AttributionFooterProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  const primarySource = sources[0];
  const getSourceColor = (type: string) => {
    switch (type) {
      case 'govtrack_api':
        return 'bg-blue-100 text-blue-800';
      case 'openstates_api':
        return 'bg-green-100 text-green-800';
      case 'propublica_api':
        return 'bg-purple-100 text-purple-800';
      case 'google_civic_api':
        return 'bg-red-100 text-red-800';
      case 'manual_verification_sf':
      case 'manual_verification_la':
        return 'bg-emerald-100 text-emerald-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`flex items-center gap-1 ${className}`}>
      {primarySource && (
        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSourceColor(primarySource.type)}`}>
          <Database className="h-3 w-3 mr-1" />
          {primarySource.name}
        </span>
      )}
      {sources.length > 1 && (
        <span className="text-xs text-gray-500">
          +{sources.length - 1} more
        </span>
      )}
    </div>
  );
}

// API response attribution component
export function APIAttribution({ sources, className = '' }: AttributionFooterProps) {
  if (!sources || sources.length === 0) {
    return null;
  }

  return (
    <div className={`text-xs text-gray-500 ${className}`}>
      <div className="font-medium mb-1">Data Sources:</div>
      <ul className="space-y-1">
        {sources.map((source, index) => (
          <li key={index} className="flex items-center gap-2">
            <Database className="h-3 w-3" />
            {source.url ? (
              <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-gray-700 transition-colors flex items-center gap-1"
              >
                {source.name}
                <ExternalLink className="h-2 w-2" />
              </a>
            ) : (
              <span>{source.name}</span>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AttributionFooter;
