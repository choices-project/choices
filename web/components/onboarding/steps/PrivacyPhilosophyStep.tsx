'use client'

import * as React from 'react';
import type { StepDataMap, OnStepUpdate } from '../types';

interface PrivacyPhilosophyStepProps {
  data?: StepDataMap['privacyPhilosophy'];
  onStepUpdate?: OnStepUpdate<'privacyPhilosophy'>;
  onNext?: () => void;
  onBack?: () => void;
}

export default function PrivacyPhilosophyStep({
  data,
  onStepUpdate,
  onNext,
  onBack,
}: PrivacyPhilosophyStepProps) {
  const [privacyLevel, setPrivacyLevel] = React.useState(
    data?.privacyLevel ?? 'medium'
  );
  const [profileVisibility, setProfileVisibility] = React.useState(
    data?.profileVisibility ?? 'public'
  );
  const [dataSharing, setDataSharing] = React.useState(
    data?.dataSharing ?? 'analytics_only'
  );
  const [completed, setCompleted] = React.useState(
    Boolean(data?.privacyPhilosophyCompleted)
  );

  const saveAndNext = () => {
    onStepUpdate?.({
      privacyLevel,
      profileVisibility,
      dataSharing,
      privacyPhilosophyCompleted: true,
    });
    onNext?.();
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h2 className="text-xl font-semibold mb-4">Privacy Philosophy</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Privacy Level</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={privacyLevel}
            onChange={(e) => setPrivacyLevel(e.target.value)}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="maximum">Maximum</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Profile Visibility</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={profileVisibility}
            onChange={(e) => setProfileVisibility(e.target.value)}
          >
            <option value="public">Public</option>
            <option value="friends_only">Friends Only</option>
            <option value="anonymous">Anonymous</option>
            <option value="private">Private</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Data Sharing</label>
          <select
            className="w-full border rounded-lg px-3 py-2"
            value={dataSharing}
            onChange={(e) => setDataSharing(e.target.value)}
          >
            <option value="none">None</option>
            <option value="analytics_only">Analytics Only</option>
            <option value="research">Research</option>
            <option value="full">Full</option>
          </select>
        </div>

        <label className="inline-flex items-center gap-2 mt-2">
          <input
            type="checkbox"
            checked={completed}
            onChange={(e) => setCompleted(e.target.checked)}
          />
          <span>Mark this step complete</span>
        </label>
      </div>

      <div className="flex justify-between mt-6">
        <button
          type="button"
          onClick={onBack}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </button>

        <button
          type="button"
          onClick={saveAndNext}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Save & Continue
        </button>
      </div>
    </div>
  );
}
