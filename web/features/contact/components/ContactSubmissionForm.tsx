/**
 * Contact Information Submission Form
 *
 * User-facing form for submitting contact information for representatives.
 * Feature-flagged and only visible when CONTACT_INFORMATION_SYSTEM is enabled.
 *
 * Created: January 26, 2026
 * Status: ✅ ACTIVE
 */

'use client';

import { Mail, Phone, MapPin, FileText, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useFeatureFlag } from '@/features/pwa/hooks/useFeatureFlags';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { useContactNotifications } from '@/lib/hooks/useContactNotifications';
import { logger } from '@/lib/utils/logger';

type ContactType = 'email' | 'phone' | 'fax' | 'address';

type ContactSubmissionFormProps = {
  representativeId: number;
  representativeName: string;
  onSuccess?: () => void;
  onCancel?: () => void;
  className?: string;
};

export default function ContactSubmissionForm({
  representativeId,
  representativeName,
  onSuccess,
  onCancel,
  className = '',
}: ContactSubmissionFormProps) {
  const { enabled: contactSystemEnabled } = useFeatureFlag('CONTACT_INFORMATION_SYSTEM');
  const { notifySubmissionSuccess } = useContactNotifications();

  const [contactType, setContactType] = useState<ContactType>('email');
  const [contactValue, setContactValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!contactValue.trim()) {
        setError('Please enter a contact value');
        return;
      }

      setIsSubmitting(true);
      setError(null);

      try {
        const response = await fetch('/api/contact/submit', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            representative_id: representativeId,
            contact_type: contactType,
            value: contactValue.trim(),
          }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(data.error || 'Failed to submit contact information');
        }

        // Success
        setSuccess(true);
        notifySubmissionSuccess();
        onSuccess?.();

        // Reset form after a moment
        setTimeout(() => {
          setContactValue('');
          setSuccess(false);
        }, 2000);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to submit contact information';
        setError(errorMessage);
        logger.error('Contact submission failed', err instanceof Error ? err : new Error(String(err)), {
          representativeId,
          contactType,
        });
      } finally {
        setIsSubmitting(false);
      }
    },
    [contactType, contactValue, representativeId, notifySubmissionSuccess, onSuccess]
  );

  const getContactIcon = (type: ContactType) => {
    switch (type) {
      case 'email':
        return Mail;
      case 'phone':
        return Phone;
      case 'fax':
        return FileText;
      case 'address':
        return MapPin;
      default:
        return Mail;
    }
  };

  const getPlaceholder = (type: ContactType) => {
    switch (type) {
      case 'email':
        return 'example@email.com';
      case 'phone':
        return '(555) 123-4567';
      case 'fax':
        return '(555) 123-4567';
      case 'address':
        return '123 Main St, City, State ZIP';
      default:
        return '';
    }
  };

  const ContactIcon = getContactIcon(contactType);

  // Don't render if feature flag is disabled
  if (!contactSystemEnabled) {
    return null;
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Submit Contact Information</CardTitle>
          <CardDescription>
          Help keep {representativeName}&apos;s contact information up to date. Your submission will be reviewed by administrators.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Contact Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="contact-type">Contact Type</Label>
            <Select
              value={contactType}
              onValueChange={(value) => {
                setContactType(value as ContactType);
                setError(null);
              }}
            >
              <SelectTrigger id="contact-type">
                <div className="flex items-center gap-2">
                  <ContactIcon className="h-4 w-4" />
                  <SelectValue />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">
                  <div className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    <span>Email</span>
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    <span>Phone</span>
                  </div>
                </SelectItem>
                <SelectItem value="fax">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    <span>Fax</span>
                  </div>
                </SelectItem>
                <SelectItem value="address">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    <span>Address</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Contact Value Input */}
          <div className="space-y-2">
            <Label htmlFor="contact-value">
              {contactType === 'email' && 'Email Address'}
              {contactType === 'phone' && 'Phone Number'}
              {contactType === 'fax' && 'Fax Number'}
              {contactType === 'address' && 'Address'}
            </Label>
            <div className="relative">
              <ContactIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="contact-value"
                type={contactType === 'email' ? 'email' : 'text'}
                placeholder={getPlaceholder(contactType)}
                value={contactValue}
                onChange={(e) => {
                  setContactValue(e.target.value);
                  setError(null);
                }}
                className="pl-10"
                disabled={isSubmitting || success}
                required
                aria-invalid={Boolean(error)}
                aria-describedby={error ? 'contact-value-error' : undefined}
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert id="contact-value-error" variant="destructive" role="alert">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {success && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Contact information submitted successfully! It will be reviewed by administrators.
              </AlertDescription>
            </Alert>
          )}

          {/* Submit Button */}
          <div className="flex gap-2">
            <Button
              type="submit"
              disabled={isSubmitting || success || !contactValue.trim()}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Submitted
                </>
              ) : (
                'Submit Contact Information'
              )}
            </Button>
            {onCancel && (
              <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                Cancel
              </Button>
            )}
          </div>

          {/* Help Text */}
          <p className="text-sm text-gray-500">
            Your submission will be reviewed before being added to the representative&apos;s profile. You&apos;ll be notified when it&apos;s approved or rejected.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
