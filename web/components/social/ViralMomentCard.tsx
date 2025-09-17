'use client';

import React, { useState } from 'react';
import { 
  TrendingUp, 
  Share2, 
  Clock, 
  Users, 
  AlertTriangle,
  ExternalLink,
  Check
} from 'lucide-react';
import type { ViralMoment } from '@/lib/social/viral-detection';

type ViralMomentCardProps = {
  moment: ViralMoment;
  onShare?: (moment: ViralMoment) => void;
  onViewDetails?: (moment: ViralMoment) => void;
  className?: string;
}

export default function ViralMomentCard({ 
  moment, 
  onShare, 
  onViewDetails,
  className = '' 
}: ViralMomentCardProps) {
  const [copied, setCopied] = useState(false);
  const [showDisclaimer, setShowDisclaimer] = useState(false);

  const handleShare = () => {
    if (onShare) {
      onShare(moment);
    } else {
      // Default share behavior
      const shareText = `${moment.headline}\n\n${moment.description}\n\n${moment.disclaimer}`;
      const shareUrl = `${window.location.origin}/poll/${moment.pollId}`;
      
      if (navigator.share) {
        navigator.share({
          title: moment.headline,
          text: shareText,
          url: shareUrl
        });
      } else {
        navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const getMomentIcon = () => {
    switch (moment.type) {
      case 'independent-leading':
        return '🏆';
      case 'surprising-second-choice':
        return '🤔';
      case 'local-surge':
        return '📈';
      case 'trending-candidate':
        return '🔥';
      default:
        return '📊';
    }
  };

  const getMomentColor = () => {
    switch (moment.type) {
      case 'independent-leading':
        return 'border-yellow-200 bg-yellow-50';
      case 'surprising-second-choice':
        return 'border-purple-200 bg-purple-50';
      case 'local-surge':
        return 'border-green-200 bg-green-50';
      case 'trending-candidate':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-blue-200 bg-blue-50';
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const formatShareability = (shareability: number) => {
    return `${Math.round(shareability * 100)}%`;
  };

  return (
    <div className={`rounded-xl border-2 ${getMomentColor()} p-6 shadow-lg transition-all hover:shadow-xl ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="text-2xl">{getMomentIcon()}</div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                {moment.type.replace('-', ' ')}
              </span>
              <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full text-xs">
                <TrendingUp className="w-3 h-3 text-green-600" />
                <span className="text-green-600 font-medium">
                  {formatShareability(moment.shareability)} viral
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2 mt-1">
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Clock className="w-3 h-3" />
                <span>{new Date(moment.createdAt).toLocaleString()}</span>
              </div>
              <div className="flex items-center space-x-1 text-xs text-gray-500">
                <Users className="w-3 h-3" />
                <span>{moment.metadata.totalVotes?.toLocaleString() || 'N/A'} votes</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {formatConfidence(moment.confidence)} confidence
            </div>
            <div className="text-xs text-gray-500">
              {moment.metadata.margin ? `${(moment.metadata.margin * 100).toFixed(1)}% margin` : 'Stable trend'}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mb-4">
        <h3 className="text-lg font-bold text-gray-900 mb-2">
          {moment.headline}
        </h3>
        <p className="text-gray-700 leading-relaxed">
          {moment.description}
        </p>
      </div>

      {/* Metadata */}
      {moment.metadata.candidateName && (
        <div className="mb-4 p-3 bg-white rounded-lg border">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-gray-900">
                {moment.metadata.candidateName}
              </div>
              {moment.metadata.isIndependent && (
                <div className="text-sm text-blue-600 font-medium">
                  Independent Candidate
                </div>
              )}
            </div>
            {moment.metadata.trendDirection && (
              <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${
                moment.metadata.trendDirection === 'up' 
                  ? 'bg-green-100 text-green-700'
                  : moment.metadata.trendDirection === 'down'
                  ? 'bg-red-100 text-red-700'
                  : 'bg-gray-100 text-gray-700'
              }`}>
                <TrendingUp className={`w-3 h-3 ${
                  moment.metadata.trendDirection === 'down' ? 'rotate-180' : ''
                }`} />
                <span className="capitalize">{moment.metadata.trendDirection}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mb-4">
        <button
          onClick={() => setShowDisclaimer(!showDisclaimer)}
          className="flex items-center space-x-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          <AlertTriangle className="w-4 h-4" />
          <span>View disclaimer</span>
        </button>
        
        {showDisclaimer && (
          <div className="mt-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              {moment.disclaimer}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <button
            onClick={handleShare}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-4 h-4" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </>
            )}
          </button>
          
          {onViewDetails && (
            <button
              onClick={() => onViewDetails(moment)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              <span>View Details</span>
            </button>
          )}
        </div>

        {/* OG Image Preview */}
        {moment.ogImageUrl && (
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <span>Share image ready</span>
            <div className="w-4 h-4 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-2 h-2 text-green-600" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
