/**
 * Representative Card Component
 * 
 * Displays a single representative with their key information
 * Includes follow/unfollow functionality and contact options
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

import React, { useState } from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Mail, 
  Phone, 
  Globe, 
  Twitter, 
  Facebook, 
  Instagram,
  Heart,
  HeartOff,
  ExternalLink
} from 'lucide-react';

import type { RepresentativeCardProps } from '@/types/representative';
import { representativeStore } from '@/lib/stores/representativeStore';

export function RepresentativeCard({ 
  representative, 
  showDetails = true, 
  showActions = true,
  onFollow,
  onContact,
  onClick,
  className = ''
}: RepresentativeCardProps) {
  const [isFollowed, setIsFollowed] = useState(false);

  const handleFollow = async () => {
    if (isFollowed) {
      representativeStore.getState().unfollowRepresentative(representative.id);
      setIsFollowed(false);
    } else {
      representativeStore.getState().followRepresentative(representative.id);
      setIsFollowed(true);
    }
    onFollow?.(representative);
  };

  const handleContact = () => {
    onContact?.(representative);
  };

  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case 'democratic':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'republican':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'independent':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getOfficeColor = (office: string) => {
    if (office.toLowerCase().includes('senator')) {
      return 'bg-purple-100 text-purple-800 border-purple-200';
    } else if (office.toLowerCase().includes('representative')) {
      return 'bg-green-100 text-green-800 border-green-200';
    } else if (office.toLowerCase().includes('governor')) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    }
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  return (
    <Card 
      className={`w-full max-w-md mx-auto cursor-pointer hover:shadow-lg transition-shadow ${className}`}
      onClick={() => onClick?.(representative)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start space-x-4">
          {/* Representative Photo */}
          <div className="relative w-16 h-16 rounded-full overflow-hidden bg-gray-200">
            {representative.primary_photo_url ? (
              <Image
                src={representative.primary_photo_url}
                alt={representative.name}
                fill
                className="object-cover"
                sizes="64px"
              />
            ) : (
              <div className="w-full h-full bg-gray-300 flex items-center justify-center text-gray-600 text-sm font-medium">
                {representative.name.split(' ').map(n => n[0]).join('')}
              </div>
            )}
          </div>

          {/* Representative Info */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {representative.name}
            </h3>
            <div className="flex flex-wrap gap-2 mt-1">
              <Badge className={`text-xs ${getPartyColor(representative.party)}`}>
                {representative.party}
              </Badge>
              <Badge className={`text-xs ${getOfficeColor(representative.office)}`}>
                {representative.office}
              </Badge>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {representative.state}
              {representative.district && ` • District ${representative.district}`}
            </p>
          </div>
        </div>
      </CardHeader>

      {showDetails && (
        <CardContent className="pt-0">
          {/* Committees */}
          {representative.committees && representative.committees.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Committees</h4>
              <div className="space-y-1">
                {representative.committees.slice(0, 3).map((committee, index) => (
                  <div key={index} className="text-xs text-gray-600">
                    <span className="font-medium">{committee.role}:</span> {committee.committee_name}
                  </div>
                ))}
                {representative.committees.length > 3 && (
                  <div className="text-xs text-gray-500">
                    +{representative.committees.length - 3} more committees
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Contact Information */}
          <div className="space-y-2">
            {representative.primary_email && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="w-4 h-4" />
                <a 
                  href={`mailto:${representative.primary_email}`}
                  className="hover:text-blue-600 truncate"
                >
                  {representative.primary_email}
                </a>
              </div>
            )}
            
            {representative.primary_phone && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="w-4 h-4" />
                <a 
                  href={`tel:${representative.primary_phone}`}
                  className="hover:text-blue-600"
                >
                  {representative.primary_phone}
                </a>
              </div>
            )}

            {representative.primary_website && (
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Globe className="w-4 h-4" />
                <a 
                  href={representative.primary_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-blue-600 truncate flex items-center space-x-1"
                >
                  <span>Website</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>

          {/* Social Media */}
          <div className="flex space-x-3 mt-3">
            {representative.twitter_handle && (
              <a
                href={`https://twitter.com/${representative.twitter_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-400 transition-colors"
              >
                <Twitter className="w-4 h-4" />
              </a>
            )}
            {representative.facebook_url && (
              <a
                href={representative.facebook_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-blue-600 transition-colors"
              >
                <Facebook className="w-4 h-4" />
              </a>
            )}
            {representative.instagram_handle && (
              <a
                href={`https://instagram.com/${representative.instagram_handle}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-pink-500 transition-colors"
              >
                <Instagram className="w-4 h-4" />
              </a>
            )}
          </div>

          {/* Data Quality Indicator */}
          <div className="mt-3 pt-3 border-t border-gray-200">
            <div className="flex items-center justify-between text-xs text-gray-500">
              <span>Data Quality</span>
              <div className="flex items-center space-x-1">
                <div className="w-16 h-1 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${
                      representative.data_quality_score >= 90 ? 'bg-green-500' :
                      representative.data_quality_score >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${representative.data_quality_score}%` }}
                  />
                </div>
                <span>{representative.data_quality_score}%</span>
              </div>
            </div>
          </div>
        </CardContent>
      )}

      {showActions && (
        <div className="px-6 pb-4">
          <div className="flex space-x-2">
            <Button
              variant={isFollowed ? "outline" : "default"}
              size="sm"
              onClick={handleFollow}
              className="flex-1"
            >
              {isFollowed ? (
                <>
                  <HeartOff className="w-4 h-4 mr-1" />
                  Unfollow
                </>
              ) : (
                <>
                  <Heart className="w-4 h-4 mr-1" />
                  Follow
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={handleContact}
              className="flex-1"
            >
              Contact
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
}
