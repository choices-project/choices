/**
 * Comprehensive Privacy Onboarding Step
 * 
 * 🔒 PRIVACY PARAMOUNT: Complete opt-in for all 16 privacy controls
 * Replaces old 4-field privacy step with comprehensive system
 * 
 * Features:
 * - Grouped privacy controls (Collection, Visibility, Personalization, Retention)
 * - Clear explanations for each setting
 * - Default all to FALSE (opt-in required)
 * - Visual categorization
 * - Impact statements
 * - Can skip all (maximum privacy)
 * 
 * Created: November 5, 2025
 * Status: ✅ ACTIVE
 */

'use client';

import {
  Shield,
  Eye,
  MapPin,
  Vote,
  Hash,
  Activity,
  BarChart3,
  Users,
  Search,
  Lock,
  Sparkles,
  Database,
  TrendingUp,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { getDefaultPrivacySettings } from '@/lib/utils/privacy-guard';
import type { PrivacySettings } from '@/types/profile';

type PrivacyOption = {
  id: keyof PrivacySettings;
  label: string;
  description: string;
  impact: string;
  icon: React.ReactNode;
  category: 'collection' | 'visibility' | 'personalization' | 'retention' | 'trust';
  color: string;
  recommended: boolean;
};

type PrivacyCategory = {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  color: string;
};

type PrivacyStepComprehensiveProps = {
  onNext: () => void;
  onBack: () => void;
  onPrivacySettingsUpdate: (settings: PrivacySettings) => void;
  initialSettings?: Partial<PrivacySettings>;
};

export default function PrivacyStepComprehensive({
  onNext,
  onBack,
  onPrivacySettingsUpdate,
  initialSettings
}: PrivacyStepComprehensiveProps) {
  // Initialize with default (all false) or provided settings
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(() => {
    const defaults = getDefaultPrivacySettings();
    return { ...defaults, ...initialSettings };
  });

  const [expandedCategory, setExpandedCategory] = useState<string | null>('collection');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Privacy categories for organization
  const categories: PrivacyCategory[] = [
    {
      id: 'collection',
      name: 'Data Collection',
      description: 'What information we collect about you',
      icon: <Database className="w-5 h-5" />,
      color: 'blue'
    },
    {
      id: 'visibility',
      name: 'Visibility to Others',
      description: 'What other users can see',
      icon: <Eye className="w-5 h-5" />,
      color: 'purple'
    },
    {
      id: 'personalization',
      name: 'Personalization',
      description: 'Customize your experience',
      icon: <Sparkles className="w-5 h-5" />,
      color: 'green'
    },
    {
      id: 'retention',
      name: 'Data Retention',
      description: 'How long we keep your data',
      icon: <Database className="w-5 h-5" />,
      color: 'orange'
    },
    {
      id: 'trust',
      name: 'Trust & Security',
      description: 'Security and verification features',
      icon: <Shield className="w-5 h-5" />,
      color: 'indigo'
    }
  ];

  // Comprehensive privacy options
  const privacyOptions: PrivacyOption[] = [
    // DATA COLLECTION
    {
      id: 'collectLocationData',
      label: 'Location Data',
      description: 'Save your address to find representatives',
      impact: 'Enables finding elected officials in your area',
      icon: <MapPin className="w-4 h-4" />,
      category: 'collection',
      color: 'blue',
      recommended: true
    },
    {
      id: 'collectVotingHistory',
      label: 'Voting History',
      description: 'Save your poll votes and choices',
      impact: 'Lets you review past votes and track your positions',
      icon: <Vote className="w-4 h-4" />,
      category: 'collection',
      color: 'blue',
      recommended: false
    },
    {
      id: 'trackInterests',
      label: 'Hashtag Interests',
      description: 'Track hashtags you interact with',
      impact: 'Enables personalized poll recommendations',
      icon: <Hash className="w-4 h-4" />,
      category: 'collection',
      color: 'blue',
      recommended: true
    },
    {
      id: 'trackFeedActivity',
      label: 'Feed Activity',
      description: 'Track content you read, like, or bookmark',
      impact: 'Remembers your reading list and preferences',
      icon: <Activity className="w-4 h-4" />,
      category: 'collection',
      color: 'blue',
      recommended: false
    },
    {
      id: 'collectAnalytics',
      label: 'Analytics',
      description: 'Anonymous usage data to improve the platform',
      impact: 'Helps us fix bugs and improve features',
      icon: <BarChart3 className="w-4 h-4" />,
      category: 'collection',
      color: 'blue',
      recommended: true
    },
    {
      id: 'trackRepresentativeInteractions',
      label: 'Representative Interactions',
      description: 'Track representatives you follow or contact',
      impact: 'Shows your engagement history with officials',
      icon: <Users className="w-4 h-4" />,
      category: 'collection',
      color: 'blue',
      recommended: false
    },

    // VISIBILITY
    {
      id: 'showReadHistory',
      label: 'Show Read History',
      description: 'Let others see content you\'ve read',
      impact: 'Other users can see your reading activity',
      icon: <Eye className="w-4 h-4" />,
      category: 'visibility',
      color: 'purple',
      recommended: false
    },
    {
      id: 'showBookmarks',
      label: 'Show Bookmarks',
      description: 'Let others see your saved content',
      impact: 'Your bookmark list is visible to others',
      icon: <Eye className="w-4 h-4" />,
      category: 'visibility',
      color: 'purple',
      recommended: false
    },
    {
      id: 'showLikes',
      label: 'Show Likes',
      description: 'Let others see content you liked',
      impact: 'Your likes are public',
      icon: <Eye className="w-4 h-4" />,
      category: 'visibility',
      color: 'purple',
      recommended: false
    },
    {
      id: 'shareActivity',
      label: 'Share Activity',
      description: 'Share your general activity with the community',
      impact: 'Your participation is visible to others',
      icon: <TrendingUp className="w-4 h-4" />,
      category: 'visibility',
      color: 'purple',
      recommended: false
    },

    // TRUST & BIOMETRIC
    {
      id: 'participateInTrustTier',
      label: 'Trust Tier System',
      description: 'Participate in trust tier scoring for verified users',
      impact: 'Enables verification features and higher trust level',
      icon: <Shield className="w-4 h-4" />,
      category: 'trust',
      color: 'indigo',
      recommended: true
    },

    // PERSONALIZATION
    {
      id: 'personalizeFeeds',
      label: 'Personalized Feeds',
      description: 'Show content based on your interests',
      impact: 'Feeds customized to your preferences',
      icon: <Sparkles className="w-4 h-4" />,
      category: 'personalization',
      color: 'green',
      recommended: true
    },
    {
      id: 'personalizeRecommendations',
      label: 'Personalized Recommendations',
      description: 'Get poll and content recommendations',
      impact: 'See suggestions based on your activity',
      icon: <Sparkles className="w-4 h-4" />,
      category: 'personalization',
      color: 'green',
      recommended: true
    },

    // DATA RETENTION
    {
      id: 'retainVotingHistory',
      label: 'Retain Voting History',
      description: 'Keep your voting records long-term',
      impact: 'Voting history saved permanently',
      icon: <Database className="w-4 h-4" />,
      category: 'retention',
      color: 'orange',
      recommended: false
    },
    {
      id: 'retainSearchHistory',
      label: 'Retain Search History',
      description: 'Save your search queries',
      impact: 'Search history kept for quick access',
      icon: <Search className="w-4 h-4" />,
      category: 'retention',
      color: 'orange',
      recommended: false
    },
    {
      id: 'retainLocationHistory',
      label: 'Retain Location History',
      description: 'Keep record of addresses you\'ve used',
      impact: 'Location history saved',
      icon: <MapPin className="w-4 h-4" />,
      category: 'retention',
      color: 'orange',
      recommended: false
    }
  ];

  // Handle privacy setting toggle
  const handleToggle = (settingId: keyof PrivacySettings, value: boolean) => {
    const newSettings = {
      ...privacySettings,
      [settingId]: value
    };
    setPrivacySettings(newSettings);
  };

  // Enable recommended settings
  const enableRecommended = () => {
    const defaults = getDefaultPrivacySettings();
    const newSettings: PrivacySettings = { ...defaults };
    
    // Explicitly set recommended settings to true
    newSettings.collectLocationData = true;
    newSettings.trackInterests = true;
    newSettings.collectAnalytics = true;
    newSettings.personalizeFeeds = true;
    newSettings.personalizeRecommendations = true;
    newSettings.participateInTrustTier = true;
    
    setPrivacySettings(newSettings);
  };

  // Disable all (maximum privacy)
  const disableAll = () => {
    setPrivacySettings(getDefaultPrivacySettings());
  };

  // Handle continue
  const handleContinue = () => {
    onPrivacySettingsUpdate(privacySettings);
    onNext();
  };

  // Count enabled settings
  const enabledCount = Object.values(privacySettings).filter(v => v === true).length;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-3">
        <h2 className="text-3xl font-bold text-gray-900">
          Your Privacy, Your Choice
        </h2>
        <p className="text-lg text-gray-600">
          You decide what data is collected. Everything is opt-in.
        </p>
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full text-sm text-blue-700">
          <Lock className="w-4 h-4" />
          <span>{enabledCount} of {privacyOptions.length} settings enabled</span>
        </div>
      </div>

      {/* Privacy Commitment */}
      <Alert className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <Shield className="h-5 w-5 text-blue-600" />
        <AlertDescription className="text-blue-900">
          <p className="font-semibold mb-2">Our Privacy Guarantee:</p>
          <p className="text-sm">
            ✅ All settings default to OFF (maximum privacy)  
            ✅ You control every piece of data we collect  
            ✅ Change settings anytime  
            ✅ Export or delete your data anytime  
            ✅ We never sell or share your data
          </p>
        </AlertDescription>
      </Alert>

      {/* Quick presets */}
      <div className="flex gap-3 justify-center">
        <Button
          variant="outline"
          size="sm"
          onClick={enableRecommended}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Enable Recommended
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={disableAll}
          className="text-gray-600 border-gray-200"
        >
          <Lock className="w-4 h-4 mr-2" />
          Maximum Privacy (Disable All)
        </Button>
      </div>

      {/* Privacy Options by Category */}
      <div className="space-y-4">
        {categories.map((category) => {
          const categoryOptions = privacyOptions.filter(opt => opt.category === category.id);
          const isExpanded = expandedCategory === category.id;
          const enabledInCategory = categoryOptions.filter(opt => 
            privacySettings[opt.id] === true
          ).length;

          return (
            <Card key={category.id} className="border-2">
              <CardHeader
                className="cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`text-${category.color}-600`}>
                      {category.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription>{category.description}</CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-gray-500">
                      {enabledInCategory} of {categoryOptions.length} enabled
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </CardHeader>

              {isExpanded && (
                <CardContent className="space-y-3 pt-0">
                  {categoryOptions.map((option) => {
                    const isEnabled = privacySettings[option.id] === true;

                    return (
                      <div
                        key={option.id}
                        className={`
                          p-4 rounded-lg border-2 transition-all
                          ${isEnabled 
                            ? `bg-${option.color}-50 border-${option.color}-200` 
                            : 'bg-gray-50 border-gray-200'
                          }
                        `}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3 flex-1">
                            <div className={`${isEnabled ? `text-${option.color}-600` : 'text-gray-400'} mt-0.5`}>
                              {option.icon}
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold text-gray-900">
                                  {option.label}
                                </h3>
                                {option.recommended && (
                                  <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                                    Recommended
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 mb-2">
                                {option.description}
                              </p>
                              <div className="flex items-start gap-2 text-xs text-gray-500">
                                <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                <span>{option.impact}</span>
                              </div>
                            </div>
                          </div>

                          <Switch
                            checked={isEnabled}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => 
                              handleToggle(option.id, e.target.checked)
                            }
                          />
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Privacy Summary */}
      <Card className="bg-gray-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-gray-600 mt-1 flex-shrink-0" />
            <div className="text-sm text-gray-700 space-y-2">
              <p className="font-semibold">What does this mean?</p>
              
              {enabledCount === 0 && (
                <p className="text-gray-600">
                  <strong>Maximum privacy:</strong> No data collection enabled. You can use the platform,
                  but features like personalized feeds and saved preferences won&apos;t be available.
                </p>
              )}

              {enabledCount > 0 && enabledCount < 5 && (
                <p className="text-gray-600">
                  <strong>Minimal collection:</strong> You&apos;ve enabled {enabledCount} setting{enabledCount !== 1 ? 's' : ''}.
                  Only this data will be collected.
                </p>
              )}

              {enabledCount >= 5 && enabledCount < 10 && (
                <p className="text-gray-600">
                  <strong>Balanced approach:</strong> You&apos;ve enabled {enabledCount} settings for a good
                  balance of privacy and functionality.
                </p>
              )}

              {enabledCount >= 10 && (
                <p className="text-gray-600">
                  <strong>Full features:</strong> You&apos;ve enabled {enabledCount} settings. The platform
                  will provide personalized experiences while respecting your choices.
                </p>
              )}

              <p className="text-gray-500 text-xs mt-3">
                💡 You can always change these settings later in your profile under &quot;My Data & Privacy&quot;
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between items-center pt-6">
        <Button
          variant="outline"
          onClick={onBack}
        >
          ← Back
        </Button>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              // Skip with maximum privacy
              onPrivacySettingsUpdate(getDefaultPrivacySettings());
              onNext();
            }}
          >
            Skip (Maximum Privacy)
          </Button>
          <Button
            onClick={handleContinue}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Continue
          </Button>
        </div>
      </div>

      <div className="text-center text-sm text-gray-500">
        Privacy Settings • You have complete control
      </div>
    </div>
  );
}

