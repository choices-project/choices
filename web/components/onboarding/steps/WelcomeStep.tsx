'use client'

import type { StepDataMap, OnStepUpdate } from '../types';

interface WelcomeStepProps {
  data?: StepDataMap['welcome'];
  onStepUpdate?: OnStepUpdate<'welcome'>;
  onNext?: () => void;
}

export default function WelcomeStep({ onNext }: WelcomeStepProps) {
  // Intentionally not destructuring onStepUpdate here since we don't use it
  const handleStart = () => onNext?.();

  return (
    <div className="text-center space-y-8">
      <h1 className="text-4xl font-bold text-gray-900">Welcome to Choices</h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Let&apos;s get you set up with your personalized experience.
      </p>
      <button
        onClick={handleStart}
        className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
      >
        Get Started
      </button>
    </div>
  );
}
