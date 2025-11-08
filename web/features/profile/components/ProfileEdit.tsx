/**
 * Profile Edit Component
 * 
 * Profile editing form component
 * Consolidates profile editing functionality
 * 
 * Created: December 19, 2024
 * Status: ✅ CONSOLIDATED
 */

'use client';

import { 
  User, 
  Camera, 
  Save, 
  Shield, 
  ArrowLeft, 
  Heart, 
  Upload,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/useAuth';
import { 
  useUserAvatarFile,
  useUserAvatarPreview,
  useUserIsUploadingAvatar,
  useUserActions
} from '@/lib/stores';
import { useProfileUpdate, useProfileAvatar, useProfileDisplay } from '../hooks/use-profile';
import type { ProfileEditProps } from '../index';
import type { ProfileUpdateData, ProfileDemographics, PrivacySettings } from '@/types/profile';
import { PROFILE_DEFAULTS } from '@/types/profile';

// Constants for form options
const COMMUNITY_FOCUS_OPTIONS = [
  'Education',
  'Healthcare',
  'Environment',
  'Economic Development',
  'Public Safety',
  'Housing',
  'Transportation',
  'Social Services',
  'Arts & Culture',
  'Youth Programs'
];

const PRIMARY_CONCERNS_OPTIONS = [
  'Climate Change',
  'Healthcare Access',
  'Economic Inequality',
  'Education Quality',
  'Public Safety',
  'Infrastructure',
  'Social Justice',
  'Technology & Privacy',
  'Immigration',
  'National Security'
];

const PARTICIPATION_OPTIONS: ProfileUpdateData['participation_style'][] = [
  'observer',
  'participant',
  'leader',
  'organizer',
];

const basePrivacyDefaults: Partial<PrivacySettings> = {
  collectLocationData: false,
  collectVotingHistory: false,
  trackInterests: false,
  trackFeedActivity: false,
  collectAnalytics: false,
  trackRepresentativeInteractions: false,
  showReadHistory: false,
  showBookmarks: false,
  showLikes: false,
  shareActivity: false,
  participateInTrustTier: false,
  personalizeFeeds: false,
  personalizeRecommendations: false,
  retainVotingHistory: false,
  retainSearchHistory: false,
  retainLocationHistory: false,
  allow_analytics: false,
  show_activity: true,
  allow_messages: true,
  share_demographics: false,
  show_email: false,
  profile_visibility: 'public',
};

const defaultPrivacySettings: Partial<PrivacySettings> = {
  ...basePrivacyDefaults,
  ...(PROFILE_DEFAULTS.privacy_settings ?? {}),
};

const defaultDemographics: ProfileDemographics =
  PROFILE_DEFAULTS.demographics ? { ...PROFILE_DEFAULTS.demographics } : {};

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

const toParticipationStyle = (value: unknown): ProfileUpdateData['participation_style'] =>
  PARTICIPATION_OPTIONS.includes(value as ProfileUpdateData['participation_style'])
    ? (value as ProfileUpdateData['participation_style'])
    : 'observer';

const parsePrivacySettings = (value: unknown): Partial<PrivacySettings> => {
  if (!isRecord(value)) {
    return { ...defaultPrivacySettings };
  }

  const result: Partial<PrivacySettings> = { ...defaultPrivacySettings };
  Object.entries(value).forEach(([key, raw]) => {
    if (typeof raw === 'boolean') {
      result[key as keyof PrivacySettings] = raw;
    } else if (key === 'profile_visibility' && typeof raw === 'string') {
      result.profile_visibility = raw as PrivacySettings['profile_visibility'];
    }
  });

  return result;
};

const parseDemographics = (value: unknown): ProfileDemographics => {
  if (!isRecord(value)) {
    return { ...defaultDemographics };
  }
  return { ...defaultDemographics, ...(value as ProfileDemographics) };
};

const buildInitialFormData = (userProfile: ProfileEditProps['profile']): ProfileUpdateData => ({
  display_name: userProfile.display_name ?? '',
  bio: userProfile.bio ?? '',
  username: userProfile.username ?? '',
  primary_concerns: toStringArray(userProfile.primary_concerns ?? []),
  community_focus: toStringArray(userProfile.community_focus ?? []),
  participation_style: toParticipationStyle(userProfile.participation_style),
  privacy_settings: parsePrivacySettings(userProfile.privacy_settings),
  demographics: parseDemographics(userProfile.demographics),
});

export default function ProfileEdit({ 
  profile, 
  onSave, 
  onCancel, 
  isLoading: externalLoading, 
  error: externalError 
}: ProfileEditProps) {
  const { user: _authUser } = useAuth();
  const { updateProfile, isUpdating, error: updateError } = useProfileUpdate();
  const { uploadAvatar, isUploading: _isUploadingAvatar } = useProfileAvatar();
  const { displayName, initials } = useProfileDisplay();
  
  // Local form data state
  const [formData, setFormData] = useState<ProfileUpdateData>(() => buildInitialFormData(profile));
  const avatarFile = useUserAvatarFile();
  const avatarPreview = useUserAvatarPreview();
  const isUploadingAvatar = useUserIsUploadingAvatar();
  
  // Get actions from userStore
  const {
    setProfileEditData,
    updateProfileEditData,
    setAvatarFile,
    setAvatarPreview,
    setUploadingAvatar
  } = useUserActions();
  
  // Local UI state (not in store)
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Initialize form data (local and store)
  React.useEffect(() => {
    const initialData = buildInitialFormData(profile);
    setFormData(initialData);
    setProfileEditData(initialData);
  }, [profile, setProfileEditData]);

  // Use external props if provided, otherwise use hooks
  const finalLoading = externalLoading !== undefined ? externalLoading : isUpdating;
  const _finalError = externalError ?? updateError;
  
  // Guard clause for null formData
  if (!formData) {
    return <div>Loading...</div>;
  }

  // Handle form field changes
  const handleFieldChange = <K extends keyof ProfileUpdateData>(field: K, value: ProfileUpdateData[K]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    updateProfileEditData({ [field]: value } as Partial<ProfileUpdateData>);
    setError(null);
    setSuccess(null);
  };

  // Handle array field changes (concerns, focus)
  const handleArrayFieldChange = (field: 'primary_concerns' | 'community_focus', value: string) => {
    const currentValues = formData[field] ?? [];
    const updatedValues = currentValues.includes(value)
      ? currentValues.filter(item => item !== value)
      : [...currentValues, value];

    setFormData(prev => ({
      ...prev,
      [field]: updatedValues,
    }));
    updateProfileEditData({ [field]: updatedValues } as Partial<ProfileUpdateData>);
    
    // Note: Store sync handled by save action, not individual field updates
  };

  // Handle avatar file selection
  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle avatar upload
  const handleAvatarUpload = async () => {
    if (!avatarFile) return;

      setUploadingAvatar(true);
    try {
      const result = await uploadAvatar(avatarFile);
      if (result.success) {
        setSuccess('Avatar updated successfully');
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setError(result.error ?? 'Failed to update avatar');
      }
    } catch {
      setError('Failed to update avatar');
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      // Convert userStore ProfileUpdateData to profile types ProfileUpdateData
      const profileUpdateData: ProfileUpdateData = {
        ...(formData.display_name !== undefined ? { display_name: formData.display_name } : {}),
        ...(formData.bio !== undefined ? { bio: formData.bio } : {}),
        ...(formData.username !== undefined ? { username: formData.username } : {}),
        ...(formData.primary_concerns !== undefined ? { primary_concerns: formData.primary_concerns } : {}),
        ...(formData.community_focus !== undefined ? { community_focus: formData.community_focus } : {}),
        ...(formData.participation_style !== undefined ? { participation_style: formData.participation_style } : {}),
        ...(formData.privacy_settings !== undefined ? { privacy_settings: formData.privacy_settings } : {})
      };
      
      await updateProfile(profileUpdateData);
      setSuccess('Profile updated successfully');
      onSave?.(formData);
    } catch {
      setError('Failed to update profile');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData(buildInitialFormData(profile));
    setError(null);
    setSuccess(null);
    onCancel?.();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleCancel}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Edit Profile</h1>
          <p className="text-gray-600">Update your profile information and preferences</p>
        </div>
      </div>

      {/* Success/Error Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Avatar Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Camera className="h-5 w-5" />
              <span>Profile Picture</span>
            </CardTitle>
            <CardDescription>
              Upload a profile picture to personalize your account
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarPreview ?? profile.avatar_url ?? ''} alt={displayName} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-upload"
                />
                <Label htmlFor="avatar-upload" className="cursor-pointer">
                  <Button type="button" variant="outline" size="sm">
                    <Upload className="h-4 w-4 mr-2" />
                    Choose Photo
                  </Button>
                </Label>
                {avatarFile && (
                  <Button 
                    type="button" 
                    onClick={handleAvatarUpload}
                    disabled={isUploadingAvatar}
                    size="sm"
                  >
                    {isUploadingAvatar ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Uploading...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Upload
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Basic Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="display_name">Display Name</Label>
                <Input
                  id="display_name"
                  value={formData.display_name}
                  onChange={(e) => handleFieldChange('display_name', e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={100}
                />
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  placeholder="Enter your username"
                  maxLength={50}
                />
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={formData.bio}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={500}
                rows={3}
              />
              <p className="text-sm text-gray-500 mt-1">
                {formData.bio?.length ?? 0}/500 characters
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Interests and Concerns */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="h-5 w-5" />
              <span>Interests & Concerns</span>
            </CardTitle>
            <CardDescription>
              Help us personalize your experience
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Primary Concerns</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {PRIMARY_CONCERNS_OPTIONS.map((concern) => (
                  <Button
                    key={concern}
                    type="button"
                    variant={formData.primary_concerns?.includes(concern) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleArrayFieldChange('primary_concerns', concern)}
                  >
                    {concern}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label>Community Focus</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {COMMUNITY_FOCUS_OPTIONS.map((focus) => (
                  <Button
                    key={focus}
                    type="button"
                    variant={formData.community_focus?.includes(focus) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleArrayFieldChange('community_focus', focus)}
                  >
                    {focus}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="participation_style">Participation Style</Label>
              <Select
                value={formData.participation_style ?? ''}
                onValueChange={(value) => handleFieldChange('participation_style', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your participation style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observer">Observer</SelectItem>
                  <SelectItem value="contributor">Contributor</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Privacy Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Privacy Settings</span>
            </CardTitle>
            <CardDescription>
              Control how your information is shared
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-email">Show Email</Label>
                <p className="text-sm text-gray-500">Allow others to see your email address</p>
              </div>
              <Switch
                id="show-email"
                checked={formData.privacy_settings?.show_email ?? false}
                onChange={(e) => 
                  handleFieldChange('privacy_settings', {
                    ...formData.privacy_settings,
                    show_email: e.target.checked
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-activity">Show Activity</Label>
                <p className="text-sm text-gray-500">Allow others to see your activity</p>
              </div>
              <Switch
                id="show-activity"
                checked={formData.privacy_settings?.show_activity ?? false}
                onChange={(e) => 
                  handleFieldChange('privacy_settings', {
                    ...formData.privacy_settings,
                    show_activity: e.target.checked
                  })
                }
              />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="allow-messages">Allow Messages</Label>
                <p className="text-sm text-gray-500">Allow others to send you messages</p>
              </div>
              <Switch
                id="allow-messages"
                checked={formData.privacy_settings?.allow_messages ?? false}
                onChange={(e) => 
                  handleFieldChange('privacy_settings', {
                    ...formData.privacy_settings,
                    allow_messages: e.target.checked
                  })
                }
              />
            </div>
          </CardContent>
        </Card>

        {/* Form Actions */}
        <div className="flex justify-end space-x-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleCancel}
            disabled={finalLoading}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            disabled={finalLoading}
          >
            {finalLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
