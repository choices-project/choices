'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

import { createPollRequest } from '@/lib/polls/api';
import type { PollCreatePayload } from '@/lib/polls/wizard/submission';

import { useAuth } from '@/hooks/useAuth';
import { useI18n } from '@/hooks/useI18n';

const MIN_OPTIONS = 2;
const MAX_OPTIONS = 6;

function buildPayload(
  title: string,
  description: string,
  options: string[],
): PollCreatePayload {
  const trimmedOptions = options.map((o) => o.trim()).filter(Boolean);
  return {
    title: title.trim(),
    question: title.trim(),
    description: description.trim(),
    options: trimmedOptions.map((text) => ({ text })),
    category: 'general',
    tags: [],
    settings: {
      allowMultipleVotes: false,
      showResultsBeforeClose: true,
      allowSharing: true,
      privacyLevel: 'public',
    },
    metadata: {
      wizardVersion: 'minimal-core-v0.1',
      votingMethod: 'single_choice',
      submittedAt: new Date().toISOString(),
      optionCount: trimmedOptions.length,
    },
    poll_type: 'standard',
  };
}

export default function CreatePollForm() {
  const { t } = useI18n();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateOption = (index: number, value: string) => {
    setOptions((prev) => prev.map((opt, i) => (i === index ? value : opt)));
  };

  const addOption = () => {
    if (options.length >= MAX_OPTIONS) return;
    setOptions((prev) => [...prev, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= MIN_OPTIONS) return;
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!user) {
      setError('Please sign in to create a poll.');
      return;
    }

    const filledOptions = options.map((o) => o.trim()).filter(Boolean);
    if (!title.trim()) {
      setError('Title is required.');
      return;
    }
    if (filledOptions.length < MIN_OPTIONS) {
      setError(`Add at least ${MIN_OPTIONS} options.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await createPollRequest(buildPayload(title, description, filledOptions));
      if (!result.success) {
        setError(result.message);
        return;
      }

      router.push(`/polls/${result.data.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong while creating your poll.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="mx-auto max-w-lg py-12 text-center text-sm text-muted-foreground" role="status">
        Checking sign-in…
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg space-y-4 py-8 text-center">
        <h1 className="text-2xl font-bold text-foreground">Create a poll</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to create a single-choice poll. Voting and creating polls require an account.
        </p>
        <Button asChild>
          <Link href="/auth?redirectTo=%2Fpolls%2Fcreate">Sign in to continue</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="mx-auto max-w-lg space-y-6" data-testid="create-poll-form">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          {t('polls.create.page.title') || 'Create a poll'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Single-choice poll. You can add more voting methods in a future release.
        </p>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="poll-title">Title</Label>
        <Input
          id="poll-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          data-testid="poll-title-input"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="poll-description">Description (optional)</Label>
        <Textarea
          id="poll-description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          data-testid="poll-description-input"
        />
      </div>

      <fieldset className="space-y-3">
        <legend className="text-sm font-medium">Options</legend>
        {options.map((option, index) => (
          <div key={index} className="flex gap-2">
            <Input
              value={option}
              onChange={(e) => updateOption(index, e.target.value)}
              placeholder={`Option ${index + 1}`}
              data-testid={`poll-option-${index}`}
            />
            {options.length > MIN_OPTIONS ? (
              <Button type="button" variant="ghost" size="sm" onClick={() => removeOption(index)}>
                Remove
              </Button>
            ) : null}
          </div>
        ))}
        {options.length < MAX_OPTIONS ? (
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            Add option
          </Button>
        ) : null}
      </fieldset>

      <Button type="submit" disabled={isSubmitting} className="w-full" data-testid="poll-create-submit">
        {isSubmitting ? 'Creating…' : 'Create poll'}
      </Button>
    </form>
  );
}
