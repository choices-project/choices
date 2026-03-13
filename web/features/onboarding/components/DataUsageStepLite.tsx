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
        <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
        <h2 className="text-3xl font-bold text-foreground mb-4">Your Privacy Matters</h2>
        <p className="text-lg text-muted-foreground">
          We use minimal data to improve your experience and keep the platform secure.
        </p>
      </div>

      <div className="bg-primary/10 border border-border rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-primary mb-3">What we collect:</h3>
        <ul className="space-y-2 text-primary">
          <li className="flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-3" />
            Basic usage analytics (pages visited, time spent)
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-3" />
            Account information you provide
          </li>
          <li className="flex items-center">
            <div className="w-2 h-2 bg-primary rounded-full mr-3" />
            Security data to protect your account
          </li>
        </ul>
      </div>

      <div className="bg-muted border border-border rounded-lg p-6 mb-8">
        <h3 className="font-semibold text-foreground mb-3">Your data is:</h3>
        <ul className="space-y-2 text-foreground/80">
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
          className="bg-primary text-primary-foreground px-8 py-3 rounded-lg hover:bg-primary/90 transition-colors font-medium flex items-center justify-center"
        >
          Continue with Default Settings
          <ArrowRight className="ml-2 h-4 w-4" />
        </button>
        
        <button
          type="button"
          onClick={handleShowAdvanced}
          className="bg-card text-foreground/80 border border-border px-8 py-3 rounded-lg hover:bg-muted transition-colors font-medium flex items-center justify-center"
        >
          <Settings className="mr-2 h-4 w-4" />
          Customize Privacy Settings
        </button>
      </div>

      <p className="text-sm text-muted-foreground text-center mt-6">
        You can always change these settings later in your profile.
      </p>
    </div>
  );
}
