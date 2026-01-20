'use client';

import { AlertTriangle } from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { logger } from '@/lib/utils/logger';

type ReportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'poll' | 'comment' | 'user' | 'message';
  targetId: string;
  targetLabel?: string;
};

const REASONS = [
  'spam',
  'harassment',
  'manipulation',
  'misinformation',
  'other',
] as const;

export default function ReportModal({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetLabel,
}: ReportModalProps) {
  const [reason, setReason] = useState<(typeof REASONS)[number]>('spam');
  const [details, setDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/moderation/reports', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_type: targetType,
          target_id: targetId,
          reason,
          details: details.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => '');
        throw new Error(text || 'Failed to submit report');
      }

      setSubmitted(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit report';
      setError(message);
      logger.error('Report submission failed', err instanceof Error ? err : new Error(message));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setSubmitted(false);
      setReason('spam');
      setDetails('');
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Report {targetType}</DialogTitle>
          <DialogDescription>
            Help us keep the community trustworthy. Reports are reviewed by the moderation team.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
            Thanks for reporting. We’ll review it shortly.
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <Label>Reported item</Label>
              <Input value={targetLabel ?? targetId} readOnly />
            </div>

            <div>
              <Label>Reason</Label>
              <select
                value={reason}
                onChange={(event) => setReason(event.target.value as (typeof REASONS)[number])}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {REASONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label>Details (optional)</Label>
              <Textarea
                value={details}
                onChange={(event) => setDetails(event.target.value)}
                rows={4}
                placeholder="Provide any additional context that might help."
              />
            </div>

            {error && (
              <Alert className="bg-red-50 border-red-200">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">{error}</AlertDescription>
              </Alert>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
            Close
          </Button>
          {!submitted && (
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Submit report'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
