/**
 * DistrictBadge Component
 * 
 * Shows a badge indicating content is from the user's district.
 * Only displayed when the feed item's district matches the user's district.
 * 
 * Created: November 5, 2025
 */

'use client';

import React from 'react';
import { MapPin } from 'lucide-react';

type DistrictBadgeProps = {
  district: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  className?: string;
};

export function DistrictBadge({ 
  district, 
  size = 'md', 
  showIcon = true,
  className = '' 
}: DistrictBadgeProps) {
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  return (
    <span 
      className={`inline-flex items-center space-x-1 bg-blue-100 text-blue-800 rounded-full font-medium ${sizeClasses[size]} ${className}`}
      title={`This content is specific to district ${district}`}
    >
      {showIcon && <MapPin className={iconSizes[size]} />}
      <span>Your District ({district})</span>
    </span>
  );
}

type DistrictIndicatorProps = {
  feedItemDistrict?: string | null;
  userDistrict?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
};

/**
 * Smart district indicator that only shows when feed item matches user's district
 */
export function DistrictIndicator({ 
  feedItemDistrict, 
  userDistrict, 
  size = 'sm',
  showIcon = true 
}: DistrictIndicatorProps) {
  // Don't show badge if:
  // - Feed item has no district (platform-wide content)
  // - User has no district set
  // - Districts don't match
  if (!feedItemDistrict || !userDistrict || feedItemDistrict !== userDistrict) {
    return null;
  }

  return <DistrictBadge district={feedItemDistrict} size={size} showIcon={showIcon} />;
}

