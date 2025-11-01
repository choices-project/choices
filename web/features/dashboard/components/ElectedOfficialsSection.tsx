'use client';

/**
 * Elected Officials Section Component
 * 
 * Enhanced component inspired by candidate cards with:
 * - Expandable contact information
 * - Social media integration
 * - Professional styling
 * - Mobile-optimized interactions
 * 
 * Created: January 19, 2025
 * Status: ✅ ACTIVE
 */

import { 
  MapPin, 
  Users, 
  Phone, 
  Mail, 
  Globe, 
  Twitter, 
  Facebook,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import React, { useState } from 'react';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

type ElectedOfficial = {
  id: string;
  name: string;
  title: string;
  party: string;
  district: string;
  photo_url?: string;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
    social_media?: {
      twitter?: string;
      facebook?: string;
    };
  };
}

type ElectedOfficialsSectionProps = {
  electedOfficials: ElectedOfficial[];
}

export default function ElectedOfficialsSection({ electedOfficials }: ElectedOfficialsSectionProps) {
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const handleContact = (type: string, value: string) => {
    switch (type) {
      case 'email':
        window.open(`mailto:${value}`, '_blank');
        break;
      case 'phone':
        window.open(`tel:${value}`, '_blank');
        break;
      case 'website':
        window.open(value, '_blank');
        break;
    }
  };

  const handleSocialMedia = (platform: string, handle: string) => {
    const urls: Record<string, string> = {
      twitter: `https://twitter.com/${handle.replace('@', '')}`,
      facebook: `https://facebook.com/${handle}`,
    };
    const url = urls[platform];
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <Card data-testid="elected-officials-section">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Your Representatives
        </CardTitle>
        <CardDescription>
          Your elected officials and how to contact them
        </CardDescription>
      </CardHeader>
      <CardContent>
        {electedOfficials.length > 0 ? (
          <div className="space-y-4">
            {electedOfficials.map((official) => {
              const isExpanded = expandedCards.has(official.id);
              return (
                <div 
                  key={official.id} 
                  className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden"
                  data-testid={`official-card-${official.id}`}
                >
                  {/* Header */}
                  <div className="p-4">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12 flex-shrink-0">
                        <AvatarImage src={official.photo_url} alt={official.name} />
                        <AvatarFallback className="bg-gradient-to-br from-blue-500 to-purple-600 text-white font-semibold">
                          {official.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-sm" data-testid={`official-name-${official.id}`}>
                              {official.name}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1" data-testid={`official-title-${official.id}`}>
                              {official.title}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {official.party}
                              </Badge>
                              <span className="text-xs text-gray-500">{official.district}</span>
                            </div>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleExpanded(official.id)}
                            className="h-6 w-6 p-0"
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="border-t border-gray-100 bg-gray-50/50">
                      {/* Contact Information */}
                      <div className="p-4 space-y-3">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Contact Information</h4>
                        
                        {official.contact.email && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{official.contact.email}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContact('email', official.contact.email!)}
                              className="h-7 px-3 text-xs"
                              data-testid={`official-email-${official.id}`}
                            >
                              Email
                            </Button>
                          </div>
                        )}

                        {official.contact.phone && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700">{official.contact.phone}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContact('phone', official.contact.phone!)}
                              className="h-7 px-3 text-xs"
                              data-testid={`official-phone-${official.id}`}
                            >
                              Call
                            </Button>
                          </div>
                        )}

                        {official.contact.website && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Globe className="h-4 w-4 text-gray-400" />
                              <span className="text-sm text-gray-700 truncate max-w-[200px]">{official.contact.website}</span>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleContact('website', official.contact.website!)}
                              className="h-7 px-3 text-xs"
                            >
                              Visit
                            </Button>
                          </div>
                        )}

                        {/* Social Media */}
                        {(official.contact.social_media?.twitter || official.contact.social_media?.facebook) && (
                          <div className="pt-2 border-t border-gray-200">
                            <h5 className="text-xs font-medium text-gray-600 mb-2">Social Media</h5>
                            <div className="space-y-2">
                              {official.contact.social_media.twitter && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Twitter className="h-4 w-4 text-blue-400" />
                                    <span className="text-sm text-gray-700">{official.contact.social_media.twitter}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSocialMedia('twitter', official.contact.social_media!.twitter!)}
                                    className="h-7 px-3 text-xs"
                                  >
                                    Follow
                                  </Button>
                                </div>
                              )}
                              
                              {official.contact.social_media.facebook && (
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <Facebook className="h-4 w-4 text-blue-600" />
                                    <span className="text-sm text-gray-700">{official.contact.social_media.facebook}</span>
                                  </div>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleSocialMedia('facebook', official.contact.social_media!.facebook!)}
                                    className="h-7 px-3 text-xs"
                                  >
                                    Follow
                                  </Button>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <MapPin className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-sm font-medium text-gray-900 mb-2">No location set</h3>
            <p className="text-xs text-gray-600 mb-4">Set your location to see your elected officials</p>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => window.location.href = '/profile/preferences'}
              className="h-8 px-4 text-xs"
            >
              Set Your Location
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}