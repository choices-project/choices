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
import { useEffect, useMemo, useRef, useState } from 'react';

import { PROFILE_DEFAULTS } from '@/types/profile';

import {
  validateBio,
  validateDisplayName,
  validateUsername,
} from '@/features/profile/utils/profile-validation';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

import {
  useUserAvatarFile,
  useUserAvatarPreview,
  useUserActions,
} from '@/lib/stores';
import {
  useProfileCurrentProfile,
  useProfileActions,
} from '@/lib/stores/profileStore';
import type {
  ProfileEditDraft,
  ProfileEditErrorKey,
  PrivacySettingKey,
  PrivacySettingValue,
} from '@/lib/stores/userStore';

import {
  useProfileUpdate,
  useProfileAvatar,
  useProfileDisplay,
  useProfileDraft,
  useProfileDraftActions,
} from '../hooks/use-profile';

import type { ProfileEditProps } from '../index';
import type {
  ProfileUpdateData,
  ProfileDemographics,
  PrivacySettings,
} from '@/types/profile';
import type { ChangeEvent, FormEvent } from 'react';

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

const PARTICIPATION_OPTIONS: NonNullable<ProfileUpdateData['participation_style']>[] = [
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
  collectIntegritySignals: false,
  collectIntegrityAdvancedSignals: false,
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

const defaultDemographics: ProfileDemographics = {
  ...(PROFILE_DEFAULTS.demographics ?? {}),
} as ProfileDemographics;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const toStringArray = (value: unknown): string[] =>
  Array.isArray(value)
    ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    : [];

const PROFILE_VISIBILITY_OPTIONS = ['public', 'private', 'friends'] as const;
type ProfileVisibilityOption = (typeof PROFILE_VISIBILITY_OPTIONS)[number];

const isProfileVisibility = (value: unknown): value is ProfileVisibilityOption =>
  typeof value === 'string' &&
  PROFILE_VISIBILITY_OPTIONS.includes(value as ProfileVisibilityOption);

const toParticipationStyle = (
  value: unknown
): ProfileUpdateData['participation_style'] =>
  typeof value === 'string' && PARTICIPATION_OPTIONS.includes(value as NonNullable<ProfileUpdateData['participation_style']>)
    ? (value as ProfileUpdateData['participation_style'])
    : undefined;

const parsePrivacySettings = (value: unknown): Partial<PrivacySettings> => {
  if (!isRecord(value)) {
    return { ...defaultPrivacySettings };
  }

  const extras: Partial<PrivacySettings> = {};
  Object.entries(value).forEach(([key, raw]) => {
    if (typeof raw === 'boolean') {
      (extras as Record<string, boolean>)[key] = raw;
    } else if (key === 'profile_visibility' && isProfileVisibility(raw)) {
      extras.profile_visibility = raw;
    }
  });

  return { ...defaultPrivacySettings, ...extras };
};

const parseDemographics = (value: unknown): ProfileDemographics => {
  if (!isRecord(value)) {
    return { ...defaultDemographics };
  }
  return { ...defaultDemographics, ...(value as ProfileDemographics) };
};

const buildInitialFormData = (
  userProfile?: ProfileEditProps['profile'] | null,
): ProfileUpdateData => {
  const participationStyle = toParticipationStyle(userProfile?.participation_style);

  return {
    display_name: userProfile?.display_name ?? '',
    bio: userProfile?.bio ?? '',
    username: userProfile?.username ?? '',
    primary_concerns: toStringArray(userProfile?.primary_concerns ?? []),
    community_focus: toStringArray(userProfile?.community_focus ?? []),
    privacy_settings: parsePrivacySettings(userProfile?.privacy_settings),
    demographics: parseDemographics(userProfile?.demographics),
    ...(participationStyle ? { participation_style: participationStyle } : {}),
  };
};

const buildProfileUpdatePayload = (draft: ProfileEditDraft): ProfileUpdateData => {
  const payload: ProfileUpdateData = {};

  if (draft.display_name !== undefined) {
    payload.display_name = draft.display_name;
  }
  if (draft.bio !== undefined) {
    payload.bio = draft.bio;
  }
  if (draft.username !== undefined) {
    payload.username = draft.username;
  }
  if (draft.primary_concerns !== undefined) {
    payload.primary_concerns = draft.primary_concerns;
  }
  if (draft.community_focus !== undefined) {
    payload.community_focus = draft.community_focus;
  }
  if (draft.participation_style !== undefined) {
    payload.participation_style = draft.participation_style;
  }
  if (draft.privacy_settings !== undefined) {
    payload.privacy_settings = draft.privacy_settings;
  }
  if (draft.demographics !== undefined) {
    payload.demographics = draft.demographics;
  }

  return payload;
};

type FormFieldErrors = Partial<Record<'display_name' | 'username' | 'bio', string>>;

const validateDraft = (draft: ProfileEditDraft): FormFieldErrors => {
  const errors: FormFieldErrors = {};

  const displayName = draft.display_name ?? '';
  const displayNameCheck = validateDisplayName(displayName);
  if (!displayNameCheck.isValid && displayNameCheck.error) {
    errors.display_name = displayNameCheck.error;
  }

  const username = draft.username ?? '';
  const usernameCheck = validateUsername(username);
  if (!usernameCheck.isValid && usernameCheck.error) {
    errors.username = usernameCheck.error;
  }

  const bio = draft.bio ?? '';
  const bioCheck = validateBio(bio);
  if (!bioCheck.isValid && bioCheck.error) {
    errors.bio = bioCheck.error;
  }

  return errors;
};

export default function ProfileEdit({
  profile,
  onSave,
  onCancel,
  isLoading: externalLoading,
  error: externalError,
}: ProfileEditProps) {
  const { updateProfile, isUpdating, error: updateError } = useProfileUpdate();
  const { uploadAvatar, isUploading: isUploadingAvatar } = useProfileAvatar();
  const { displayName, initials } = useProfileDisplay();

  const storeProfile = useProfileCurrentProfile();
  const { setUserProfile: setUserProfileInStore } = useProfileActions();
  const setUserProfileInStoreRef = useRef(setUserProfileInStore);

  useEffect(() => {
    setUserProfileInStoreRef.current = setUserProfileInStore;
  }, [setUserProfileInStore]);

  const storeProfileId = storeProfile?.id ?? null;
  const effectiveProfile = profile ?? storeProfile;

  const profileDraft = useProfileDraft();
  const {
    initializeDraft,
    setDraftField,
    toggleDraftArrayField,
    setDraftPrivacySetting,
    setProfileEditing,
    clearDraft,
    clearDraftErrors,
    clearFieldError,
  } = useProfileDraftActions();

  const avatarFile = useUserAvatarFile();
  const avatarPreview = useUserAvatarPreview();
  const {
    setAvatarFile,
    setAvatarPreview,
    clearAvatar,
  } = useUserActions();

  const lastProfileKeyRef = useRef<string | null>(null);

  // Local UI state (not in store)
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FormFieldErrors>({});

  const fallbackDraft = useMemo(
    () => buildInitialFormData(effectiveProfile),
    [effectiveProfile],
  );
  const draft = profileDraft ?? fallbackDraft;

  const privacySettings = useMemo(
    () => ({ ...defaultPrivacySettings, ...(draft.privacy_settings ?? {}) }),
    [draft.privacy_settings],
  );

  const primaryConcerns = draft.primary_concerns ?? [];
  const communityFocus = draft.community_focus ?? [];

  useEffect(() => {
    if (!effectiveProfile) {
      clearDraft();
      clearDraftErrors();
      setProfileEditing(false);
      lastProfileKeyRef.current = null;
      return;
    }

    const profileKey = `${effectiveProfile.id ?? 'no-id'}:${effectiveProfile.updated_at ?? ''}`;
    if (lastProfileKeyRef.current === profileKey) {
      return;
    }

    initializeDraft(buildInitialFormData(effectiveProfile));
    clearDraftErrors();
    setProfileEditing(true);
    lastProfileKeyRef.current = profileKey;
  }, [effectiveProfile, initializeDraft, clearDraft, clearDraftErrors, setProfileEditing]);

  useEffect(
    () => () => {
      clearDraft();
      clearDraftErrors();
      setProfileEditing(false);
      clearAvatar();
      lastProfileKeyRef.current = null;
    },
    [clearDraft, clearDraftErrors, setProfileEditing, clearAvatar],
  );

  useEffect(() => {
    if (profile && storeProfileId !== profile.id && setUserProfileInStoreRef.current) {
      setUserProfileInStoreRef.current(profile);
    }
  }, [profile, storeProfileId]);

  // Use external props if provided, otherwise use hooks
  const finalLoading = externalLoading !== undefined ? externalLoading : isUpdating;
  const combinedError = formError ?? externalError ?? updateError ?? null;

  const resetUiFeedback = () => {
    setFormError(null);
    setSuccess(null);
  };

  const handleFieldChange = <K extends keyof ProfileEditDraft>(
    field: K,
    value: ProfileEditDraft[K],
  ) => {
    setDraftField(field, value);
    clearFieldError(field as ProfileEditErrorKey);
    resetUiFeedback();
    if (field === 'display_name' || field === 'username' || field === 'bio') {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleArrayFieldChange = (field: 'primary_concerns' | 'community_focus', value: string) => {
    toggleDraftArrayField(field, value);
    clearFieldError(field);
    resetUiFeedback();
  };

  const handlePrivacyChange = <K extends PrivacySettingKey>(
    setting: K,
    value: PrivacySettingValue<K>,
  ) => {
    setDraftPrivacySetting(setting, value);
    clearFieldError(`privacy_settings.${setting}` as ProfileEditErrorKey);
    resetUiFeedback();
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setAvatarPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      clearAvatar();
    }
    resetUiFeedback();
  };

  const handleAvatarUpload = async () => {
    if (!avatarFile) {
      return;
    }

    try {
      const result = await uploadAvatar(avatarFile);
      if (result.success) {
        setSuccess('Avatar updated successfully');
        clearAvatar();
      } else {
        setFormError(result.error ?? 'Failed to update avatar');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update avatar';
      setFormError(message);
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    resetUiFeedback();

    try {
      const validationErrors = validateDraft(draft);
      if (Object.keys(validationErrors).length > 0) {
        setFieldErrors(validationErrors);
        setFormError('Please fix the highlighted fields.');
        return;
      }

      const profileUpdateData = buildProfileUpdatePayload(draft);
      const result = await updateProfile(profileUpdateData);
      if (result.success) {
        setSuccess('Profile updated successfully');
        if (result.data) {
          initializeDraft(buildInitialFormData(result.data));
        }
        await onSave?.(profileUpdateData);
        setFieldErrors({});
      } else {
        setFormError(result.error ?? 'Failed to update profile');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setFormError(message);
    }
  };

  const handleCancel = () => {
    if (effectiveProfile) {
      initializeDraft(buildInitialFormData(effectiveProfile));
    } else {
      clearDraft();
    }
    clearDraftErrors();
    clearAvatar();
    resetUiFeedback();
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

      {combinedError && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{combinedError}</AlertDescription>
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
                <AvatarImage
                  src={avatarPreview ?? effectiveProfile?.avatar_url ?? ''}
                  alt={displayName}
                />
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
                  value={draft.display_name ?? ''}
                  onChange={(e) => handleFieldChange('display_name', e.target.value)}
                  placeholder="Enter your display name"
                  maxLength={100}
                  aria-invalid={Boolean(fieldErrors.display_name)}
                  aria-describedby={fieldErrors.display_name ? 'display_name-error' : undefined}
                />
                {fieldErrors.display_name && (
                  <p id="display_name-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.display_name}
                  </p>
                )}
              </div>
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={draft.username ?? ''}
                  onChange={(e) => handleFieldChange('username', e.target.value)}
                  placeholder="Enter your username"
                  maxLength={50}
                  aria-invalid={Boolean(fieldErrors.username)}
                  aria-describedby={fieldErrors.username ? 'username-error' : undefined}
                />
                {fieldErrors.username && (
                  <p id="username-error" className="mt-1 text-sm text-red-600">
                    {fieldErrors.username}
                  </p>
                )}
              </div>
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={draft.bio ?? ''}
                onChange={(e) => handleFieldChange('bio', e.target.value)}
                placeholder="Tell us about yourself"
                maxLength={500}
                rows={3}
                aria-invalid={Boolean(fieldErrors.bio)}
                aria-describedby={fieldErrors.bio ? 'bio-error' : undefined}
              />
              {fieldErrors.bio && (
                <p id="bio-error" className="mt-1 text-sm text-red-600">
                  {fieldErrors.bio}
                </p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                {draft.bio?.length ?? 0}/500 characters
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
                    variant={primaryConcerns.includes(concern) ? 'default' : 'outline'}
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
                    variant={communityFocus.includes(focus) ? 'default' : 'outline'}
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
                value={draft.participation_style ?? ''}
                onValueChange={(value) =>
                  handleFieldChange(
                    'participation_style',
                    (value || undefined) as ProfileUpdateData['participation_style']
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your participation style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="observer">Observer</SelectItem>
                  <SelectItem value="participant">Participant</SelectItem>
                  <SelectItem value="leader">Leader</SelectItem>
                  <SelectItem value="organizer">Organizer</SelectItem>
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
                checked={privacySettings.show_email ?? false}
                onCheckedChange={(checked) =>
                  handlePrivacyChange('show_email', checked)
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
                checked={privacySettings.show_activity ?? false}
                onCheckedChange={(checked) =>
                  handlePrivacyChange('show_activity', checked)
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
                checked={privacySettings.allow_messages ?? false}
                onCheckedChange={(checked) =>
                  handlePrivacyChange('allow_messages', checked)
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
