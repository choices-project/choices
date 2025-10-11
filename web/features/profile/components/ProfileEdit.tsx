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

import { useState } from 'react';
import { withOptional } from '@/lib/utils/objects';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { useProfileUpdate, useProfileAvatar, useProfileDisplay } from '../hooks/use-profile';
import { useAuth } from '@/hooks/useAuth';
import type { ProfileEditProps, ProfileUpdateData } from '../types';

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
  
  // Form state
  const [formData, setFormData] = useState<ProfileUpdateData>({
    displayname: profile.display_name || '',
    bio: profile.bio || '',
    username: profile.username || '',
    primaryconcerns: profile.primary_concerns || [],
    communityfocus: profile.community_focus || [],
    participationstyle: profile.participation_style || 'observer',
    privacysettings: profile.privacy_settings || {
      profile_visibility: 'public',
      show_email: false,
      show_activity: true,
      allow_messages: true,
      share_demographics: false,
      allow_analytics: true
    }
  });

  // Avatar state
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [isUploadingAvatarLocal, setIsUploadingAvatarLocal] = useState(false);

  // Error and success states
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Use external props if provided, otherwise use hooks
  const finalLoading = externalLoading !== undefined ? externalLoading : isUpdating;
  const _finalError = externalError || updateError;

  // Handle form field changes
  const handleFieldChange = (field: keyof ProfileUpdateData, value: any) => {
    setFormData(prev => withOptional(prev, {
      [field]: value
    }));
    setError(null);
    setSuccess(null);
  };

  // Handle array field changes (concerns, focus)
  const handleArrayFieldChange = (field: 'primaryconcerns' | 'communityfocus', value: string) => {
    setFormData(prev => withOptional(prev, {
      [field]: prev[field]?.includes(value) 
        ? prev[field]?.filter(item => item !== value)
        : [...(prev[field] || []), value]
    }));
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

    setIsUploadingAvatarLocal(true);
    try {
      const result = await uploadAvatar(avatarFile);
      if (result.success) {
        setSuccess('Avatar updated successfully');
        setAvatarFile(null);
        setAvatarPreview(null);
      } else {
        setError(result.error || 'Failed to update avatar');
      }
    } catch {
      setError('Failed to update avatar');
    } finally {
      setIsUploadingAvatarLocal(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      await updateProfile(formData);
      setSuccess('Profile updated successfully');
      onSave?.(formData);
    } catch {
      setError('Failed to update profile');
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setFormData({
      displayname: profile.display_name || '',
      bio: profile.bio || '',
      username: profile.username || '',
      primaryconcerns: profile.primary_concerns || [],
      communityfocus: profile.community_focus || [],
      participationstyle: profile.participation_style || 'observer',
      privacysettings: profile.privacy_settings || {
        profile_visibility: 'public',
        show_email: false,
        show_activity: true,
        allow_messages: true,
        share_demographics: false,
        allow_analytics: true
      }
    });
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
                <AvatarImage src={avatarPreview || profile.avatar_url || ''} alt={displayName} />
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
                    disabled={isUploadingAvatarLocal}
                    size="sm"
                  >
                    {isUploadingAvatarLocal ? (
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
                <Label htmlFor="displayname">Display Name</Label>
                <Input
                  id="displayname"
                  value={formData.displayname}
                  onChange={(e) => handleFieldChange('displayname', e.target.value)}
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
                {formData.bio?.length || 0}/500 characters
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
                    variant={formData.primaryconcerns?.includes(concern) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleArrayFieldChange('primaryconcerns', concern)}
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
                    variant={formData.communityfocus?.includes(focus) ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleArrayFieldChange('communityfocus', focus)}
                  >
                    {focus}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="participationstyle">Participation Style</Label>
              <Select
                value={formData.participationstyle || ''}
                onValueChange={(value) => handleFieldChange('participationstyle', value)}
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
                checked={formData.privacysettings?.show_email || false}
                onChange={(e) => 
                  handleFieldChange('privacysettings', {
                    ...formData.privacysettings,
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
                checked={formData.privacysettings?.show_activity || false}
                onChange={(e) => 
                  handleFieldChange('privacysettings', {
                    ...formData.privacysettings,
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
                checked={formData.privacysettings?.allow_messages || false}
                onChange={(e) => 
                  handleFieldChange('privacysettings', {
                    ...formData.privacysettings,
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
