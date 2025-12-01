/**
 * Create Civic Action Form Component
 * 
 * Form for creating new civic actions (petitions, campaigns, etc.)
 * 
 * Feature Flag: CIVIC_ENGAGEMENT_V2
 */

'use client';

import { AlertCircle, Loader2, Save, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useMemo, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/hooks/useI18n';
import { isFeatureEnabled } from '@/lib/core/feature-flags';
import { logger } from '@/lib/utils/logger';

type CreateCivicActionFormProps = {
  onSuccess?: (actionId: string) => void;
  onCancel?: () => void;
  className?: string;
};

const ACTION_TYPES = [
  { value: 'petition', label: 'Petition' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'survey', label: 'Survey' },
  { value: 'event', label: 'Event' },
  { value: 'protest', label: 'Protest' },
  { value: 'meeting', label: 'Meeting' },
] as const;

const URGENCY_LEVELS = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
] as const;

export function CreateCivicActionForm({
  onSuccess,
  onCancel,
  className = '',
}: CreateCivicActionFormProps) {
  const { t } = useI18n();
  const featureEnabled = isFeatureEnabled('CIVIC_ENGAGEMENT_V2');
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    action_type: 'petition' as const,
    category: '',
    urgency_level: 'medium' as const,
    required_signatures: '',
    end_date: '',
    is_public: true,
    target_state: '',
    target_district: '',
  });

  const handleChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('civics.actions.create.validation.titleRequired');
    } else if (formData.title.length > 200) {
      newErrors.title = t('civics.actions.create.validation.titleMax');
    }

    if (formData.description && formData.description.length > 5000) {
      newErrors.description = t('civics.actions.create.validation.descriptionMax');
    }

    if (formData.required_signatures) {
      const num = parseInt(formData.required_signatures, 10);
      if (isNaN(num) || num < 1 || num > 1000000) {
        newErrors.required_signatures = t('civics.actions.create.validation.signaturesRange');
      }
    }

    if (formData.end_date) {
      const date = new Date(formData.end_date);
      if (isNaN(date.getTime()) || date < new Date()) {
        newErrors.end_date = t('civics.actions.create.validation.endDateFuture');
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const payload: any = {
        title: formData.title.trim(),
        description: formData.description.trim() || undefined,
        action_type: formData.action_type,
        urgency_level: formData.urgency_level,
        is_public: formData.is_public,
        status: 'draft', // Start as draft, user can publish later
      };

      if (formData.category) {
        payload.category = formData.category.trim();
      }

      if (formData.required_signatures) {
        payload.required_signatures = parseInt(formData.required_signatures, 10);
      }

      if (formData.end_date) {
        payload.end_date = new Date(formData.end_date).toISOString();
      }

      if (formData.target_state) {
        payload.target_state = formData.target_state;
      }

      if (formData.target_district) {
        payload.target_district = formData.target_district;
      }

      const response = await fetch('/api/civic-actions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.error || t('civics.actions.create.errors.submitRequest'));
      }

      const actionId = data.data.id;
      logger.info('Civic action created', { actionId });

      if (onSuccess) {
        onSuccess(actionId);
      } else {
        router.push(`/civic-actions/${actionId}`);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : t('civics.actions.create.errors.generic');
      setErrors({ submit: errorMessage });
      logger.error('Error creating civic action', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const actionTypeLabels = useMemo(
    () =>
      ACTION_TYPES.reduce<Record<string, string>>((acc, type) => {
        acc[type.value] = t(`civics.actions.create.actionTypes.${type.value}`);
        return acc;
      }, {}),
    [t],
  );

  const urgencyLabels = useMemo(
    () =>
      URGENCY_LEVELS.reduce<Record<string, string>>((acc, level) => {
        acc[level.value] = t(`civics.actions.create.urgencyLevels.${level.value}`);
        return acc;
      }, {}),
    [t],
  );

  if (!featureEnabled) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>{t('civics.actions.create.header.title')}</CardTitle>
        <CardDescription>
          {t('civics.actions.create.header.description')}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form noValidate onSubmit={handleSubmit} className="space-y-6">
          {/* Title */}
          <div>
            <Label htmlFor="title">
              {t('civics.actions.create.fields.title.label')} <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => handleChange('title', e.target.value)}
              placeholder={t('civics.actions.create.fields.title.placeholder')}
              maxLength={200}
              required
            />
            {errors.title && (
              <p className="text-sm text-red-600 mt-1">{errors.title}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {t('civics.actions.create.fields.commonCounter', {
                current: formData.title.length,
                max: 200,
              })}
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">{t('civics.actions.create.fields.description.label')}</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleChange('description', e.target.value)}
              placeholder={t('civics.actions.create.fields.description.placeholder')}
              rows={4}
              maxLength={5000}
            />
            {errors.description && (
              <p className="text-sm text-red-600 mt-1">{errors.description}</p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              {t('civics.actions.create.fields.commonCounter', {
                current: formData.description.length,
                max: 5000,
              })}
            </p>
          </div>

          {/* Action Type and Urgency */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="action_type">
                {t('civics.actions.create.fields.actionType.label')}{' '}
                <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.action_type}
                onValueChange={(value) => handleChange('action_type', value)}
              >
                <SelectTrigger id="action_type">
                  <SelectValue placeholder={t('civics.actions.create.fields.actionType.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {actionTypeLabels[type.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="urgency_level">{t('civics.actions.create.fields.urgency.label')}</Label>
              <Select
                value={formData.urgency_level}
                onValueChange={(value) => handleChange('urgency_level', value)}
              >
                <SelectTrigger id="urgency_level">
                  <SelectValue placeholder={t('civics.actions.create.fields.urgency.placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {URGENCY_LEVELS.map((level) => (
                    <SelectItem key={level.value} value={level.value}>
                      {urgencyLabels[level.value]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Category */}
          <div>
            <Label htmlFor="category">{t('civics.actions.create.fields.category.label')}</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => handleChange('category', e.target.value)}
              placeholder={t('civics.actions.create.fields.category.placeholder')}
              maxLength={100}
            />
          </div>

          {/* Signatures and End Date */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="required_signatures">
                {t('civics.actions.create.fields.signatures.label')}
              </Label>
              <Input
                id="required_signatures"
                type="number"
                value={formData.required_signatures}
                onChange={(e) => handleChange('required_signatures', e.target.value)}
                placeholder={t('civics.actions.create.fields.signatures.placeholder')}
                min={1}
                max={1000000}
              />
              {errors.required_signatures && (
                <p className="text-sm text-red-600 mt-1">{errors.required_signatures}</p>
              )}
            </div>

            <div>
              <Label htmlFor="end_date">{t('civics.actions.create.fields.endDate.label')}</Label>
              <Input
                id="end_date"
                type="datetime-local"
                value={formData.end_date}
                onChange={(e) => handleChange('end_date', e.target.value)}
              />
              {errors.end_date && (
                <p className="text-sm text-red-600 mt-1">{errors.end_date}</p>
              )}
            </div>
          </div>

          {/* Target Location */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="target_state">
                {t('civics.actions.create.fields.targetState.label')}
              </Label>
              <Input
                id="target_state"
                value={formData.target_state}
                onChange={(e) => handleChange('target_state', e.target.value.toUpperCase())}
                placeholder={t('civics.actions.create.fields.targetState.placeholder')}
                maxLength={2}
              />
            </div>

            <div>
              <Label htmlFor="target_district">
                {t('civics.actions.create.fields.targetDistrict.label')}
              </Label>
              <Input
                id="target_district"
                value={formData.target_district}
                onChange={(e) => handleChange('target_district', e.target.value)}
                placeholder={t('civics.actions.create.fields.targetDistrict.placeholder')}
                maxLength={50}
              />
            </div>
          </div>

          {/* Visibility */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="is_public"
              checked={formData.is_public}
              onChange={(e) => handleChange('is_public', e.target.checked)}
              className="rounded"
            />
            <Label htmlFor="is_public" className="cursor-pointer">
              {t('civics.actions.create.fields.visibility.label')}
            </Label>
          </div>

          {/* Error Message */}
          {errors.submit && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-4">
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel}>
                <X className="w-4 h-4 mr-2" />
                {t('common.actions.cancel')}
              </Button>
            )}
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t('civics.actions.create.buttons.creating')}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {t('civics.actions.create.buttons.create')}
                </>
              )}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

