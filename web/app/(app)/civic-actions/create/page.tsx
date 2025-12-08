'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { useAppActions } from '@/lib/stores/appStore';
import { logger } from '@/lib/utils/logger';

type ActionType = 'petition' | 'campaign' | 'survey' | 'event' | 'protest' | 'meeting';
type UrgencyLevel = 'low' | 'medium' | 'high' | 'critical';

type CreateActionForm = {
  title: string;
  description: string;
  action_type: ActionType | '';
  urgency_level: UrgencyLevel;
  required_signatures: string;
  category: string;
};

export default function CreateCivicActionPage() {
  const router = useRouter();
  const { setCurrentRoute, setBreadcrumbs } = useAppActions();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateActionForm>({
    title: '',
    description: '',
    action_type: '',
    urgency_level: 'medium',
    required_signatures: '',
    category: '',
  });
  const [errors, setErrors] = useState<Partial<Record<keyof CreateActionForm, string>>>({});

  useEffect(() => {
    setCurrentRoute('/civic-actions/create');
    setBreadcrumbs([
      { label: 'Home', href: '/' },
      { label: 'Civic Actions', href: '/civic-actions' },
      { label: 'Create Action', href: '/civic-actions/create' },
    ]);
  }, [setCurrentRoute, setBreadcrumbs]);

  if (!isFeatureEnabled('CIVIC_ENGAGEMENT_V2')) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Civic Engagement V2</h1>
          <p className="text-gray-600">This feature is currently disabled.</p>
        </div>
      </div>
    );
  }

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof CreateActionForm, string>> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.length > 200) {
      newErrors.title = 'Title must be less than 200 characters';
    }

    if (formData.description.length > 5000) {
      newErrors.description = 'Description must be less than 5000 characters';
    }

    if (!formData.action_type) {
      newErrors.action_type = 'Action type is required';
    }

    if (formData.required_signatures) {
      const num = parseInt(formData.required_signatures, 10);
      if (isNaN(num) || num < 1 || num > 1000000) {
        newErrors.required_signatures = 'Required signatures must be between 1 and 1,000,000';
      }
    }

    if (formData.category.length > 100) {
      newErrors.category = 'Category must be less than 100 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        action_type: formData.action_type,
        urgency_level: formData.urgency_level,
        status: 'active',
        is_public: true,
      };

      if (formData.required_signatures) {
        payload.required_signatures = parseInt(formData.required_signatures, 10);
      }

      if (formData.category.trim()) {
        payload.category = formData.category.trim();
      }

      const response = await fetch('/api/civic-actions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create civic action');
      }

      if (result.success && result.data?.id) {
        router.push(`/civic-actions/${result.data.id}`);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      logger.error('Error creating civic action', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Create Civic Action</h1>
        <p className="text-gray-600">
          Start a new petition, campaign, or civic engagement opportunity.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Action Details</CardTitle>
          <CardDescription>
            Fill out the form below to create your civic action.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} data-testid="action-form">
            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-6">
              <div>
                <Label htmlFor="title">
                  Title <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter action title"
                  data-testid="action-title-input"
                  className={errors.title ? 'border-red-500' : ''}
                />
                {errors.title && (
                  <p className="text-sm text-red-500 mt-1">{errors.title}</p>
                )}
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe your civic action"
                  data-testid="action-description-input"
                  rows={6}
                  className={errors.description ? 'border-red-500' : ''}
                />
                {errors.description && (
                  <p className="text-sm text-red-500 mt-1">{errors.description}</p>
                )}
              </div>

              <div>
                <Label htmlFor="action_type">
                  Action Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  onValueChange={(value) => setFormData({ ...formData, action_type: value as ActionType })}
                  value={formData.action_type}
                >
                  <SelectTrigger
                    id="action_type"
                    name="action_type"
                    data-testid="action-type-select"
                    className={errors.action_type ? 'border-red-500' : ''}
                  >
                    <SelectValue placeholder="Select action type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="petition">Petition</SelectItem>
                    <SelectItem value="campaign">Campaign</SelectItem>
                    <SelectItem value="survey">Survey</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="protest">Protest</SelectItem>
                    <SelectItem value="meeting">Meeting</SelectItem>
                  </SelectContent>
                </Select>
                {errors.action_type && (
                  <p className="text-sm text-red-500 mt-1">{errors.action_type}</p>
                )}
              </div>

              <div>
                <Label htmlFor="urgency_level">Urgency Level</Label>
                <Select
                  onValueChange={(value) => setFormData({ ...formData, urgency_level: value as UrgencyLevel })}
                  value={formData.urgency_level}
                >
                  <SelectTrigger
                    id="urgency_level"
                    name="urgency_level"
                    data-testid="action-priority-select"
                  >
                    <SelectValue placeholder="Select urgency level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="required_signatures">Required Signatures (for petitions)</Label>
                <Input
                  id="required_signatures"
                  name="required_signatures"
                  type="number"
                  value={formData.required_signatures}
                  onChange={(e) => setFormData({ ...formData, required_signatures: e.target.value })}
                  placeholder="e.g., 100"
                  data-testid="action-required-signatures-input"
                  min={1}
                  max={1000000}
                  className={errors.required_signatures ? 'border-red-500' : ''}
                />
                {errors.required_signatures && (
                  <p className="text-sm text-red-500 mt-1">{errors.required_signatures}</p>
                )}
              </div>

              <div>
                <Label htmlFor="category">Category (optional)</Label>
                <Input
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  placeholder="e.g., Environment, Education"
                  data-testid="action-category-input"
                  maxLength={100}
                  className={errors.category ? 'border-red-500' : ''}
                />
                {errors.category && (
                  <p className="text-sm text-red-500 mt-1">{errors.category}</p>
                )}
              </div>

              <div className="flex gap-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  data-testid="action-submit-button"
                >
                  {isSubmitting ? 'Creating...' : 'Create Action'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

