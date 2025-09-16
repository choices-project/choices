'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  TrendingUp, 
  MapPin, 
  Heart, 
  Eye,
  Shield,
  ChevronRight,
  X
} from 'lucide-react';
import { DiversityNudge } from '@/lib/social/network-effects';

interface DiversityNudgesProps {
  userId: string;
  pollId: string;
  onNudgeClick?: (nudge: DiversityNudge) => void;
  onDismiss?: (nudgeId: string) => void;
  className?: string;
}

export default function DiversityNudges({ 
  userId, 
  pollId, 
  onNudgeClick,
  onDismiss,
  className = '' 
}: DiversityNudgesProps) {
  const [nudges, setNudges] = useState<DiversityNudge[]>([]);
  const [loading, setLoading] = useState(true);
  const [dismissedNudges, setDismissedNudges] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadDiversityNudges();
  }, [userId, pollId]);

  const loadDiversityNudges = async () => {
    try {
      setLoading(true);
      // This would call the actual API
      const mockNudges: DiversityNudge[] = [
        {
          type: 'cross-demographic',
          message: 'People in different age groups rank Jane Smith highly',
          candidateId: 'candidate1',
          candidateName: 'Jane Smith',
          confidence: 0.85,
          source: 'aggregated_demographics',
          userCount: 75,
          privacyProtected: true
        },
        {
          type: 'geographic',
          message: 'Across town, John Doe is trending',
          candidateId: 'candidate2',
          candidateName: 'John Doe',
          confidence: 0.78,
          source: 'geographic_aggregates',
          userCount: 120,
          privacyProtected: true
        },
        {
          type: 'cross-interest',
          message: 'People with different interests also support Bob Johnson',
          candidateId: 'candidate3',
          candidateName: 'Bob Johnson',
          confidence: 0.72,
          source: 'interest_aggregates',
          userCount: 60,
          privacyProtected: true
        }
      ];
      
      setNudges(mockNudges);
    } catch (error) {
      console.error('Error loading diversity nudges:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = (nudge: DiversityNudge) => {
    const nudgeId = `${nudge.type}_${nudge.candidateId}`;
    setDismissedNudges(prev => new Set([...prev, nudgeId]));
    if (onDismiss) {
      onDismiss(nudgeId);
    }
  };

  const getNudgeIcon = (type: DiversityNudge['type']) => {
    switch (type) {
      case 'cross-demographic':
        return <Users className="w-5 h-5" />;
      case 'geographic':
        return <MapPin className="w-5 h-5" />;
      case 'cross-interest':
        return <Heart className="w-5 h-5" />;
      case 'similar-users':
        return <TrendingUp className="w-5 h-5" />;
      default:
        return <Eye className="w-5 h-5" />;
    }
  };

  const getNudgeColor = (type: DiversityNudge['type']) => {
    switch (type) {
      case 'cross-demographic':
        return 'border-blue-200 bg-blue-50';
      case 'geographic':
        return 'border-green-200 bg-green-50';
      case 'cross-interest':
        return 'border-purple-200 bg-purple-50';
      case 'similar-users':
        return 'border-orange-200 bg-orange-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  const getNudgeTitle = (type: DiversityNudge['type']) => {
    switch (type) {
      case 'cross-demographic':
        return 'Cross-Demographic Insight';
      case 'geographic':
        return 'Geographic Trend';
      case 'cross-interest':
        return 'Cross-Interest Support';
      case 'similar-users':
        return 'Similar User Preference';
      default:
        return 'Diversity Insight';
    }
  };

  const formatConfidence = (confidence: number) => {
    return `${Math.round(confidence * 100)}%`;
  };

  const visibleNudges = nudges.filter(nudge => {
    const nudgeId = `${nudge.type}_${nudge.candidateId}`;
    return !dismissedNudges.has(nudgeId);
  });

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <div className="flex items-center space-x-2 mb-4">
          <div className="w-6 h-6 bg-gray-200 rounded animate-pulse"></div>
          <div className="h-6 bg-gray-200 rounded w-48 animate-pulse"></div>
        </div>
        {[1, 2, 3].map(i => (
          <div key={i} className="p-4 border border-gray-200 rounded-lg animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (visibleNudges.length === 0) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 mb-2">
          <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Diversity Insights Available
          </h3>
          <p className="text-gray-600">
            We need more data to show you insights from different perspectives.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-6 h-6 text-blue-600" />
          <h2 className="text-lg font-semibold text-gray-900">
            Diversity Insights
          </h2>
        </div>
        <div className="text-sm text-gray-500">
          {visibleNudges.length} insight{visibleNudges.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Nudges */}
      <div className="space-y-3">
        {visibleNudges.map((nudge, index) => {
          const nudgeId = `${nudge.type}_${nudge.candidateId}`;
          
          return (
            <div
              key={nudgeId}
              className={`p-4 rounded-lg border-2 ${getNudgeColor(nudge.type)} transition-all hover:shadow-md`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`p-2 rounded-full ${
                      nudge.type === 'cross-demographic' ? 'bg-blue-100 text-blue-600' :
                      nudge.type === 'geographic' ? 'bg-green-100 text-green-600' :
                      nudge.type === 'cross-interest' ? 'bg-purple-100 text-purple-600' :
                      'bg-orange-100 text-orange-600'
                    }`}>
                      {getNudgeIcon(nudge.type)}
                    </div>
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="text-sm font-medium text-gray-900">
                        {getNudgeTitle(nudge.type)}
                      </h3>
                      <div className="flex items-center space-x-1 bg-white px-2 py-1 rounded-full text-xs">
                        <Shield className="w-3 h-3 text-green-600" />
                        <span className="text-green-600 font-medium">Privacy Protected</span>
                      </div>
                    </div>
                    
                    <p className="text-gray-700 text-sm leading-relaxed mb-2">
                      {nudge.message}
                    </p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <div className="flex items-center space-x-1">
                        <Users className="w-3 h-3" />
                        <span>{nudge.userCount} people</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <TrendingUp className="w-3 h-3" />
                        <span>{formatConfidence(nudge.confidence)} confidence</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => onNudgeClick?.(nudge)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="View candidate details"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  
                  <button
                    onClick={() => handleDismiss(nudge)}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                    title="Dismiss this insight"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer */}
      <div className="text-center pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          These insights are generated from aggregated, privacy-protected data. 
          Individual user preferences are never shared.
        </p>
      </div>
    </div>
  );
}
