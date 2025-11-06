/**
 * Representative List Component
 * 
 * Displays a list of representatives with loading states and error handling
 * Supports different display modes and interactions
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import { AlertCircle, Users } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import type { RepresentativeListProps } from '@/types/representative';

import { RepresentativeCard } from './RepresentativeCard';

export function RepresentativeList({
  representatives,
  loading = false,
  error,
  onRepresentativeClick,
  className = ''
}: RepresentativeListProps) {
  
  if (loading) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <div className="flex items-center justify-center p-8">
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
        <p className="mt-4 text-gray-600">Loading representatives...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Users className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No representatives found</h3>
        <p className="text-gray-600 text-center">
          Try adjusting your search criteria or location.
        </p>
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {representatives.map((representative) => (
          <RepresentativeCard
            key={representative.id}
            representative={representative}
            onFollow={(rep) => {
              console.log('Followed:', rep.name);
            }}
            onContact={(rep) => {
              console.log('Contact:', rep.name);
            }}
            onClick={() => {
              if (onRepresentativeClick) {
                onRepresentativeClick(representative);
              }
            }}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Representative Grid Component
 * 
 * Alternative grid layout for representatives
 */
export function RepresentativeGrid({
  representatives,
  loading = false,
  error,
  onRepresentativeClick,
  className = ''
}: RepresentativeListProps) {
  
  if (loading) {
    return (
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-200 rounded-lg h-64 w-full" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className={className}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!representatives || representatives.length === 0) {
    return (
      <div className={`flex flex-col items-center justify-center py-12 ${className}`}>
        <Users className="w-12 h-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No representatives found</h3>
        <p className="text-gray-600 text-center">
          Try adjusting your search criteria or location.
        </p>
      </div>
    );
  }

  return (
    <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
      {representatives.map((representative) => (
        <RepresentativeCard
          key={representative.id}
          representative={representative}
          showDetails={false}
          onFollow={(rep) => {
            console.log('Followed:', rep.name);
          }}
          onContact={(rep) => {
            console.log('Contact:', rep.name);
          }}
          {...(onRepresentativeClick && { onClick: () => onRepresentativeClick(representative) })}
        />
      ))}
    </div>
  );
}
