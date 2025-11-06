/**
 * Representative Profile Page
 * 
 * Comprehensive profile page displaying detailed information about a representative
 * Includes contact info, photos, activity timeline, and social media
 * 
 * Created: October 28, 2025
 * Status: ✅ FOUNDATION
 */

'use client';

import { 
  Mail, 
  Phone, 
  Globe, 
  Users, 
  ExternalLink,
  Loader2,
  AlertCircle,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Youtube
} from 'lucide-react';
import { useParams } from 'next/navigation';
import React, { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { logger } from '@/lib/utils/logger';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { representativeStore } from '@/lib/stores/representativeStore';
import type { Representative } from '@/types/representative';

export default function RepresentativeProfilePage() {
  const params = useParams();
  const representativeId = params?.id as string;
  
  const [representative, setRepresentative] = useState<Representative | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!representativeId) return;

    const loadRepresentative = async () => {
      setLoading(true);
      setError(null);

      try {
        logger.debug('🔄 Loading representative:', representativeId);
        await representativeStore.getState().getRepresentativeById(parseInt(representativeId));
        
        const state = representativeStore.getState();
        setRepresentative(state.currentRepresentative);
        
        if (!state.currentRepresentative) {
          setError('Representative not found');
        }
      } catch (err: any) {
        console.error('❌ Error loading representative:', err);
        setError(err.message || 'Failed to load representative');
      } finally {
        setLoading(false);
      }
    };

    loadRepresentative();
  }, [representativeId]);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading representative...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!representative) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Representative not found</AlertDescription>
        </Alert>
      </div>
    );
  }

  const getPartyColor = (party: string) => {
    switch (party.toLowerCase()) {
      case 'democratic': return 'bg-blue-100 text-blue-800';
      case 'republican': return 'bg-red-100 text-red-800';
      case 'independent': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'federal': return 'bg-blue-100 text-blue-800';
      case 'state': return 'bg-green-100 text-green-800';
      case 'local': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row gap-6">
          {/* Photo */}
          <div className="flex-shrink-0">
            {representative.primary_photo_url ? (
              <img
                src={representative.primary_photo_url}
                alt={representative.name}
                className="w-48 h-48 object-cover rounded-lg shadow-lg"
              />
            ) : (
              <div className="w-48 h-48 bg-gray-200 rounded-lg shadow-lg flex items-center justify-center">
                <Users className="h-16 w-16 text-gray-400" />
              </div>
            )}
          </div>

          {/* Basic Info */}
          <div className="flex-1">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {representative.name}
            </h1>
            
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge className={getPartyColor(representative.party)}>
                {representative.party}
              </Badge>
              <Badge className={getLevelColor(representative.level)}>
                {representative.level.toUpperCase()}
              </Badge>
              <Badge variant="outline">
                {representative.office}
              </Badge>
              {representative.district && (
                <Badge variant="outline">
                  District {representative.district}
                </Badge>
              )}
            </div>

            <div className="text-lg text-gray-600 mb-4">
              {representative.state} • Data Quality: {representative.data_quality_score}%
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap gap-2">
              {representative.primary_email && (
                <Button variant="outline" size="sm">
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </Button>
              )}
              {representative.primary_phone && (
                <Button variant="outline" size="sm">
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              )}
              {representative.primary_website && (
                <Button variant="outline" size="sm" asChild>
                  <a href={representative.primary_website} target="_blank" rel="noopener noreferrer">
                    <Globe className="h-4 w-4 mr-2" />
                    Website
                    <ExternalLink className="h-3 w-3 ml-1" />
                  </a>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          <TabsTrigger value="activity">Activity</TabsTrigger>
          <TabsTrigger value="social">Social Media</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <span className="font-medium">Office:</span> {representative.office}
                </div>
                <div>
                  <span className="font-medium">Level:</span> {representative.level}
                </div>
                <div>
                  <span className="font-medium">State:</span> {representative.state}
                </div>
                {representative.district && (
                  <div>
                    <span className="font-medium">District:</span> {representative.district}
                  </div>
                )}
                <div>
                  <span className="font-medium">Party:</span> {representative.party}
                </div>
                <div>
                  <span className="font-medium">Data Quality:</span> {representative.data_quality_score}%
                </div>
                <div>
                  <span className="font-medium">Last Updated:</span> {new Date(representative.updated_at).toLocaleDateString()}
                </div>
              </CardContent>
            </Card>

            {/* External IDs */}
            <Card>
              <CardHeader>
                <CardTitle>External Identifiers</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {representative.bioguide_id && (
                  <div>
                    <span className="font-medium">Bioguide ID:</span> {representative.bioguide_id}
                  </div>
                )}
                {representative.openstates_id && (
                  <div>
                    <span className="font-medium">OpenStates ID:</span> {representative.openstates_id}
                  </div>
                )}
                {representative.fec_id && (
                  <div>
                    <span className="font-medium">FEC ID:</span> {representative.fec_id}
                  </div>
                )}
                {representative.google_civic_id && (
                  <div>
                    <span className="font-medium">Google Civic ID:</span> {representative.google_civic_id}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="contact" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Contact */}
            <Card>
              <CardHeader>
                <CardTitle>Primary Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {representative.primary_email && (
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Email</div>
                      <a href={`mailto:${representative.primary_email}`} className="text-blue-600 hover:underline">
                        {representative.primary_email}
                      </a>
                    </div>
                  </div>
                )}
                {representative.primary_phone && (
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Phone</div>
                      <a href={`tel:${representative.primary_phone}`} className="text-blue-600 hover:underline">
                        {representative.primary_phone}
                      </a>
                    </div>
                  </div>
                )}
                {representative.primary_website && (
                  <div className="flex items-center gap-3">
                    <Globe className="h-5 w-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Website</div>
                      <a href={representative.primary_website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                        {representative.primary_website}
                      </a>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Contacts */}
            <Card>
              <CardHeader>
                <CardTitle>Additional Contact Methods</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-4 text-gray-500">
                  Additional contact methods not available
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Activity data not available
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="social" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Social Media & Online Presence</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {representative.twitter_handle && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Twitter className="h-5 w-5 text-blue-400" />
                    <div>
                      <div className="font-medium">Twitter</div>
                      <a 
                        href={`https://twitter.com/${representative.twitter_handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        @{representative.twitter_handle}
                      </a>
                    </div>
                  </div>
                )}
                
                {representative.facebook_url && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Facebook className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Facebook</div>
                      <a 
                        href={representative.facebook_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Facebook Page
                      </a>
                    </div>
                  </div>
                )}
                
                {representative.instagram_handle && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Instagram className="h-5 w-5 text-pink-500" />
                    <div>
                      <div className="font-medium">Instagram</div>
                      <a 
                        href={`https://instagram.com/${representative.instagram_handle}`} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        @{representative.instagram_handle}
                      </a>
                    </div>
                  </div>
                )}
                
                {representative.linkedin_url && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Linkedin className="h-5 w-5 text-blue-700" />
                    <div>
                      <div className="font-medium">LinkedIn</div>
                      <a 
                        href={representative.linkedin_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        LinkedIn Profile
                      </a>
                    </div>
                  </div>
                )}
                
                {representative.youtube_channel && (
                  <div className="flex items-center gap-3 p-3 border rounded-lg">
                    <Youtube className="h-5 w-5 text-red-500" />
                    <div>
                      <div className="font-medium">YouTube</div>
                      <a 
                        href={representative.youtube_channel} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        YouTube Channel
                      </a>
                    </div>
                  </div>
                )}
              </div>
              
              {!representative.twitter_handle && !representative.facebook_url && !representative.instagram_handle && !representative.linkedin_url && !representative.youtube_channel && (
                <div className="text-center py-8 text-gray-500">
                  No social media information available
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
