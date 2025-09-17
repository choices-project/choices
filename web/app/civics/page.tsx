// app/civics/page.tsx
'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, MapPin, Phone, Mail, Globe, Users, Building2, Home, Database, CheckCircle, AlertCircle, Clock } from 'lucide-react';

type Representative = {
  name: string;
  party: string | null;
  office: string;
  level: 'federal' | 'state' | 'local';
  jurisdiction: string;
  district: string | null;
  contact: {
    email?: string;
    phone?: string;
    website?: string;
  } | null;
  data_source?: string;
  last_verified?: string;
  data_quality_score?: number;
  verification_notes?: string;
}

type CivicsData = {
  ok: boolean;
  count: number;
  data: Representative[];
}

export default function CivicsPage() {
  const [representatives, setRepresentatives] = useState<Representative[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('CA');
  const [selectedLevel, setSelectedLevel] = useState<'federal' | 'state' | 'local'>('federal');
  const [activeTab, setActiveTab] = useState('federal');
  const [selectedCity, setSelectedCity] = useState<'sf' | 'la'>('sf');

  const states = [
    'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
    'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
    'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
    'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
    'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'
  ];

  const fetchRepresentatives = useCallback(async (state: string, level: 'federal' | 'state' | 'local') => {
    try {
      setLoading(true);
      setError(null);

      let url = '';
      if (level === 'local' && state === 'CA') {
        // CA local data - choose city
        if (selectedCity === 'la') {
          url = '/api/civics/local/la';
        } else {
          url = '/api/civics/local/sf';
        }
      } else {
        // Federal and state data
        url = `/api/civics/by-state?state=${state}&level=${level}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`Failed to fetch ${level} data: ${response.status}`);
      }

      const data: CivicsData = await response.json();
      setRepresentatives(data.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setRepresentatives([]);
    } finally {
      setLoading(false);
    }
  }, [selectedCity]);

  useEffect(() => {
    fetchRepresentatives(selectedState, selectedLevel);
  }, [selectedState, selectedLevel, selectedCity, fetchRepresentatives]);

  const filteredRepresentatives = representatives.filter(rep =>
    rep.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rep.office.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (rep.party && rep.party.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'federal': return <Building2 className="h-4 w-4" />;
      case 'state': return <MapPin className="h-4 w-4" />;
      case 'local': return <Home className="h-4 w-4" />;
      default: return <Users className="h-4 w-4" />;
    }
  };

  const getPartyColor = (party: string | null) => {
    if (!party) return 'bg-gray-100 text-gray-800';
    if (party.toLowerCase().includes('democrat')) return 'bg-blue-100 text-blue-800';
    if (party.toLowerCase().includes('republican')) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'federal': return 'bg-purple-100 text-purple-800';
      case 'state': return 'bg-blue-100 text-blue-800';
      case 'local': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getDataSourceInfo = (source?: string) => {
    switch (source) {
      case 'govtrack_api': return { name: 'GovTrack.us', color: 'bg-blue-100 text-blue-800', icon: <Database className="h-3 w-3" /> };
      case 'openstates_api': return { name: 'OpenStates', color: 'bg-green-100 text-green-800', icon: <Database className="h-3 w-3" /> };
      case 'manual_verification_sf': return { name: 'Verified SF', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-3 w-3" /> };
      case 'manual_verification_la': return { name: 'Verified LA', color: 'bg-emerald-100 text-emerald-800', icon: <CheckCircle className="h-3 w-3" /> };
      default: return { name: 'Unknown', color: 'bg-gray-100 text-gray-800', icon: <AlertCircle className="h-3 w-3" /> };
    }
  };

  const getQualityColor = (score?: number) => {
    if (!score) return 'text-gray-500';
    if (score >= 90) return 'text-green-600';
    if (score >= 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getQualityIcon = (score?: number) => {
    if (!score) return <AlertCircle className="h-3 w-3" />;
    if (score >= 90) return <CheckCircle className="h-3 w-3" />;
    if (score >= 80) return <Clock className="h-3 w-3" />;
    return <AlertCircle className="h-3 w-3" />;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">🗳️ Your Representatives</h1>
        <p className="text-gray-600 mb-4">
          Browse and contact your federal, state, and local government representatives
        </p>
        
        {/* Data Quality Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Database className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-blue-900">Data Sources & Quality</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Badge className="bg-blue-100 text-blue-800">
                <Database className="h-3 w-3 mr-1" />
                GovTrack.us
              </Badge>
              <span className="text-gray-600">Federal (95% quality)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                <Database className="h-3 w-3 mr-1" />
                OpenStates
              </Badge>
              <span className="text-gray-600">State (85% quality)</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-emerald-100 text-emerald-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Verified
              </Badge>
              <span className="text-gray-600">Local SF & LA (100% quality)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search representatives..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={selectedState} onValueChange={setSelectedState}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {states.map(state => (
                <SelectItem key={state} value={state}>{state}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Tabs value={activeTab} onValueChange={(value) => {
          setActiveTab(value);
          setSelectedLevel(value as 'federal' | 'state' | 'local');
        }}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="federal" className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Federal
            </TabsTrigger>
            <TabsTrigger value="state" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              State
            </TabsTrigger>
            <TabsTrigger value="local" className="flex items-center gap-2">
              <Home className="h-4 w-4" />
              Local
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* City selector for California local government */}
        {selectedState === 'CA' && selectedLevel === 'local' && (
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">City:</label>
            <div className="flex gap-2">
              <Button
                variant={selectedCity === 'sf' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCity('sf')}
              >
                San Francisco
              </Button>
              <Button
                variant={selectedCity === 'la' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCity('la')}
              >
                Los Angeles
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading representatives...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">❌ {error}</p>
          <Button 
            onClick={() => fetchRepresentatives(selectedState, selectedLevel)}
            className="mt-2"
            variant="outline"
            size="sm"
          >
            Try Again
          </Button>
        </div>
      )}

      {!loading && !error && (
        <div className="mb-4">
          <p className="text-gray-600">
            Found {filteredRepresentatives.length} representative{filteredRepresentatives.length !== 1 ? 's' : ''}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>
      )}

      {/* Representative Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredRepresentatives.map((rep, index) => (
          <Card key={`${rep.name}-${rep.office}-${index}`} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-2">{rep.name}</CardTitle>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge className={getLevelColor(rep.level)}>
                      {getLevelIcon(rep.level)}
                      <span className="ml-1 capitalize">{rep.level}</span>
                    </Badge>
                    {rep.party && (
                      <Badge className={getPartyColor(rep.party)}>
                        {rep.party}
                      </Badge>
                    )}
                    {rep.data_source && (
                      <Badge className={getDataSourceInfo(rep.data_source).color}>
                        {getDataSourceInfo(rep.data_source).icon}
                        <span className="ml-1">{getDataSourceInfo(rep.data_source).name}</span>
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-600 font-medium">{rep.office}</p>
              {rep.district && (
                <p className="text-xs text-gray-500">District: {rep.district}</p>
              )}
            </CardHeader>
            <CardContent className="pt-0">
              {rep.contact && (
                <div className="space-y-2">
                  {rep.contact.email && (
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`mailto:${rep.contact.email}`}
                        className="text-blue-600 hover:underline"
                      >
                        {rep.contact.email}
                      </a>
                    </div>
                  )}
                  {rep.contact.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-gray-400" />
                      <a 
                        href={`tel:${rep.contact.phone}`}
                        className="text-blue-600 hover:underline"
                      >
                        {rep.contact.phone}
                      </a>
                    </div>
                  )}
                  {rep.contact.website && (
                    <div className="flex items-center gap-2 text-sm">
                      <Globe className="h-4 w-4 text-gray-400" />
                      <a 
                        href={rep.contact.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Website
                      </a>
                    </div>
                  )}
                </div>
              )}
              {!rep.contact && (
                <p className="text-sm text-gray-500 italic">No contact information available</p>
              )}
              
              {/* Data Quality Information */}
              {(rep.data_quality_score || rep.last_verified) && (
                <div className="mt-4 pt-3 border-t border-gray-100">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {rep.data_quality_score && (
                      <div className="flex items-center gap-1">
                        {getQualityIcon(rep.data_quality_score)}
                        <span className={getQualityColor(rep.data_quality_score)}>
                          Quality: {rep.data_quality_score}/100
                        </span>
                      </div>
                    )}
                    {rep.last_verified && (
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span>
                          Verified: {new Date(rep.last_verified).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                  {rep.verification_notes && (
                    <p className="text-xs text-gray-400 mt-1 italic">
                      {rep.verification_notes}
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !error && filteredRepresentatives.length === 0 && (
        <div className="text-center py-8">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">
            {searchTerm ? 'No representatives found matching your search.' : 'No representatives found for this selection.'}
          </p>
        </div>
      )}
    </div>
  );
}

