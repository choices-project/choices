/**
 * Example Component: Feedback Widget with React Query
 *
 * Shows best practices for:
 * - Form handling with typed API
 * - Submitting data
 * - Success/error feedback
 * - Loading states
 *
 * Created: November 6, 2025
 * Status: ✅ EXAMPLE CODE
 */

'use client';

import { useState } from 'react';

import type { FeedbackType, FeedbackSentiment } from '@/lib/api';
import { useSubmitFeedback } from '@/lib/hooks/useApi';

export default function FeedbackExample() {
  const [type, setType] = useState<FeedbackType>('general');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [sentiment, setSentiment] = useState<FeedbackSentiment>('neutral');
  const [showSuccess, setShowSuccess] = useState(false);

  // Submit feedback mutation
  const submitFeedback = useSubmitFeedback({
    onSuccess: () => {
      setShowSuccess(true);
      // Reset form
      setTitle('');
      setDescription('');
      setSentiment('neutral');
      // Hide success message after 3 seconds
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await submitFeedback.mutateAsync({
      feedback_type: type,
      title,
      description,
      sentiment,
    } as any);
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Submit Feedback</h1>

      {/* Success message */}
      {showSuccess && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Thank you! Your feedback has been submitted.
        </div>
      )}

      {/* Error message */}
      {submitFeedback.isError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {submitFeedback.error.message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Type selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Type</label>
          <select
            value={type}
            onChange={(e) => setType(e.target.value as FeedbackType)}
            className="w-full border p-2 rounded"
          >
            <option value="bug">Bug Report</option>
            <option value="feature">Feature Request</option>
            <option value="general">General Feedback</option>
            <option value="performance">Performance Issue</option>
            <option value="security">Security Concern</option>
          </select>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-medium mb-1">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={200}
            className="w-full border p-2 rounded"
            placeholder="Brief summary..."
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            maxLength={1000}
            rows={5}
            className="w-full border p-2 rounded"
            placeholder="Provide details..."
          />
        </div>

        {/* Sentiment */}
        <div>
          <label className="block text-sm font-medium mb-1">Sentiment</label>
          <div className="flex space-x-2">
            {['positive', 'neutral', 'negative', 'mixed'].map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSentiment(s as FeedbackSentiment)}
                className={`px-4 py-2 rounded ${
                  sentiment === s ? 'bg-blue-500 text-white' : 'bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <button
          type="submit"
          disabled={submitFeedback.isPending || !title || !description}
          className="w-full bg-blue-500 text-white py-2 rounded disabled:opacity-50"
        >
          {submitFeedback.isPending ? 'Submitting...' : 'Submit Feedback'}
        </button>
      </form>

      {/* Show what happens behind the scenes */}
      <div className="mt-8 p-4 bg-gray-100 rounded">
        <h3 className="font-bold mb-2">Behind the Scenes:</h3>
        <ul className="text-sm space-y-1">
          <li>✅ Type-safe form data</li>
          <li>✅ Automatic error handling</li>
          <li>✅ Loading states handled by React Query</li>
          <li>✅ Success/error callbacks</li>
          <li>✅ Cache invalidation (feedback list will auto-refresh)</li>
          <li>✅ No manual fetch() calls</li>
        </ul>
      </div>
    </div>
  );
}

