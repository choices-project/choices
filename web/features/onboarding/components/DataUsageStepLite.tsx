'use client';

import { Settings, Shield, ArrowRight } from 'lucide-react';
import React from 'react';


import type { DataUsageStepLiteProps } from '../types';

/**
 * Data Usage Step Lite Component
 * 
 * Simplified data usage and privacy explanation for onboarding:
 * - Clear explanation of what data is collected
 * - How data is used and protected
 * - Options to continue with default settings or customize
 * - Privacy-focused design
 * 
 * Features:
 * - Simple, non-technical language
 * - Visual icons and clear explanations
 * - Option to show advanced settings
 * - Responsive design
 * 
 * @param {DataUsageStepLiteProps} props - Component props
 * @returns {JSX.Element} Data usage explanation interface
 */
export default function DataUsageStepLite({ onNext, onShowAdvanced }: DataUsageStepLiteProps) {
  const handleShowAdvanced = () => {
    onShowAdvanced?.();
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <Shield className="h-12 w-12 text-blue-600 mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Your Privacy Matters</h2>
        <p className="text-lg text-gray-600">
          We use minimal data to improve your experience and keep the platform secure.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-blue-900 mb-3">What we collect:</h3>
        <ul className="space-y-2 text-blue-800">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
            Basic usage analytics (pages visited, time spent)
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
            Account information you provide
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-blue-600 rounded-full mr-3" />
            Security data to protect your account
          </li>
        </ul>
      </div>

      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-gray-900 mb-3">Your data is:</h3>
        <ul className="space-y-2 text-gray-700">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-3" />
            Never sold to third parties
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-3" />
            Encrypted and securely stored
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-green-600 rounded-full mr-3" />
            Used only to improve your experience
          </li>
        </ul>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        <button
          type="button"
          data-testid="data-usage-continue"
          onClick={onNext}
          className="bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
        >
          Continue with Default Settings
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={handleShowAdvanced}
          className="bg-white text-gray-700 border border-gray-300 px-8 py-3 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center justify-center"
        >
          <Settings className="mr-2 h-4 w-4" />
          Customize Privacy Settings
        </button>
      </div>

      <p className="text-sm text-gray-500 text-center mt-6">
        You can always change these settings later in your profile.
      </p>
    </div>
  );
}
