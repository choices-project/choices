'use client';

import { Settings, Heart, Shield, Save } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import DataUsageExplanation from '@/components/shared/DataUsageExplanation';
import InterestSelection from '@/features/onboarding/components/InterestSelection';
import { useUser } from '@/lib/stores';

export default function ProfilePreferencesPage() {
  const user = useUser();
  const [userInterests, setUserInterests] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Load user interests
  useEffect(() => {
    const loadUserInterests = async () => {
      if (!user) return;
      
      try {
        const response = await fetch('/api/v1/user/interests');
        if (response.ok) {
          const data = await response.json();
          setUserInterests(data.interests || []);
        }
      } catch (error) {
        console.error('Failed to load user interests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserInterests();
  }, [user]);

  const handleSaveInterests = async (interests: string[]) => {
    setSaving(true);
    setMessage(null);

    try {
      const response = await fetch('/api/v1/user/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ interests }),
      });

      if (response.ok) {
        setUserInterests(interests);
        setMessage('Your interests have been saved successfully!');
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to save interests');
      }
    } catch (error) {
      console.error('Failed to save interests:', error);
      setMessage('Failed to save interests. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Settings className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Preferences</h1>
              <p className="text-gray-600">Customize your experience and manage your data</p>
            </div>
          </div>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 border border-green-200 text-green-800'
              : 'bg-red-50 border border-red-200 text-red-800'
          }`}>
            <div className="flex items-center space-x-2">
              <Save className="h-5 w-5" />
              <span>{message}</span>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {/* Interest Selection */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Heart className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-semibold text-gray-900">Content Preferences</h2>
            </div>
            <InterestSelection
              initialInterests={userInterests}
              onSave={handleSaveInterests}
            />
          </div>

          {/* Data Usage Explanation */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <Shield className="h-5 w-5 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Data & Privacy</h2>
            </div>
            <DataUsageExplanation />
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-between">
          <a
            href="/profile"
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            <span>← Back to Profile</span>
          </a>
          <div className="text-sm text-gray-500">
            Your preferences are automatically saved
          </div>
        </div>
      </div>
    </div>
  );
}
