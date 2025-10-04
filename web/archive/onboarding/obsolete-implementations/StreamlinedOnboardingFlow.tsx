// Streamlined Onboarding Flow
// Maintains 9-step structure for E2E test compatibility while providing streamlined UX
// Created: October 2, 2025

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSupabaseAuth } from '@/contexts/AuthContext';

// Types for streamlined onboarding
type OnboardingStep = 'welcome' | 'privacy' | 'tour' | 'data-usage' | 'auth' | 'profile' | 'interests' | 'experience' | 'complete';

type UserDemographics = {
  location: {
    state: string;
    district?: string;
    quantized: boolean;
  };
  age_range: '18-24' | '25-34' | '35-44' | '45-54' | '55-64' | '65+' | '';
  education: 'high_school' | 'some_college' | 'bachelor' | 'graduate' | '';
  political_engagement: 'casual' | 'moderate' | 'very_engaged' | '';
  preferred_contact: 'email' | 'none' | '';
};

type PrivacySettings = {
  location_sharing: 'enabled' | 'quantized' | 'disabled';
  demographic_sharing: 'enabled' | 'anonymous' | 'disabled';
  analytics_sharing: 'enabled' | 'limited' | 'disabled';
};

type OnboardingData = {
  completedSteps: OnboardingStep[];
  currentStep: OnboardingStep;
  demographics: UserDemographics;
  privacy: PrivacySettings;
  userPreferences: {
    primary_interest: 'representatives' | 'polls' | 'both';
    notification_frequency: 'all' | 'important' | 'none';
    content_complexity: 'simple' | 'detailed' | 'expert';
  };
};

// Welcome Step Component
const WelcomeStep: React.FC<{
  onNext: () => void;
  onSkip: () => void;
}> = ({ onNext, onSkip }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Choices
          </h1>
          <p className="text-xl text-gray-600 mb-6">
            Your voice matters. Let&apos;s get you set up to participate in democracy.
          </p>
          <p className="text-gray-500">
            ⏱️ This will take about 3 minutes to get you started
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onNext}
            data-testid="welcome-next"
            className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Get Started
          </button>
          <button
            onClick={onSkip}
            className="w-full text-gray-500 hover:text-gray-700 transition-colors"
          >
            I&apos;m a returning user
          </button>
        </div>
      </div>
    </div>
  );
};

// Privacy Philosophy Step (Combined with Data Usage)
const PrivacyStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  privacy: PrivacySettings;
  setPrivacy: (privacy: PrivacySettings) => void;
}> = ({ onNext, onBack, privacy, setPrivacy }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your Privacy, Your Choice
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            We believe in transparent data practices. Here&apos;s how we protect your information:
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h3 className="font-semibold text-green-800 mb-2">🔒 Location Privacy</h3>
            <p className="text-green-700 text-sm">
              We only use your location to find your representatives. You can choose to share your exact location or just your state.
            </p>
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={privacy.location_sharing === 'quantized'}
                onChange={(e) => setPrivacy({
                  ...privacy,
                  location_sharing: e.target.checked ? 'quantized' : 'disabled'
                })}
                className="mr-2"
              />
              <span className="text-sm text-green-700">Share my state (recommended)</span>
            </label>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">📊 Demographic Insights</h3>
            <p className="text-blue-700 text-sm">
              Help us understand diverse perspectives by sharing basic demographics (age, education level).
            </p>
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={privacy.demographic_sharing === 'enabled'}
                onChange={(e) => setPrivacy({
                  ...privacy,
                  demographic_sharing: e.target.checked ? 'enabled' : 'disabled'
                })}
                className="mr-2"
              />
              <span className="text-sm text-blue-700">Share demographics for better insights</span>
            </label>
          </div>

          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <h3 className="font-semibold text-purple-800 mb-2">📈 Usage Analytics</h3>
            <p className="text-purple-700 text-sm">
              Help us improve the platform by sharing anonymous usage data.
            </p>
            <label className="flex items-center mt-3">
              <input
                type="checkbox"
                checked={privacy.analytics_sharing === 'enabled'}
                onChange={(e) => setPrivacy({
                  ...privacy,
                  analytics_sharing: e.target.checked ? 'enabled' : 'limited'
                })}
                className="mr-2"
              />
              <span className="text-sm text-purple-700">Share usage data to improve the platform</span>
            </label>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            data-testid="privacy-next"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Platform Tour Step (Streamlined)
const TourStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What You Can Do Here
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Discover how to make your voice heard in democracy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <div className="text-3xl mb-3">🗳️</div>
            <h3 className="font-semibold text-lg mb-2">Vote on Polls</h3>
            <p className="text-gray-600 text-sm">
              Participate in polls about current issues and see how your views compare to others.
            </p>
          </div>
          <div className="bg-green-50 rounded-lg p-6">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="font-semibold text-lg mb-2">Find Representatives</h3>
            <p className="text-gray-600 text-sm">
              Discover who represents you and track their voting records.
            </p>
          </div>
          <div className="bg-purple-50 rounded-lg p-6">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="font-semibold text-lg mb-2">Campaign Finance</h3>
            <p className="text-gray-600 text-sm">
              See who&apos;s funding campaigns and understand the money in politics.
            </p>
          </div>
          <div className="bg-orange-50 rounded-lg p-6">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="font-semibold text-lg mb-2">Track Progress</h3>
            <p className="text-gray-600 text-sm">
              Monitor how your representatives vote on issues you care about.
            </p>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            data-testid="tour-next"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Data Usage Step (Combined with Privacy)
const DataUsageStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            How We Use Your Data
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Transparency is key. Here&apos;s exactly how we use your information:
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Find Your Representatives</h3>
              <p className="text-gray-600 text-sm">Location data helps us show you who represents you in government.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Personalize Your Experience</h3>
              <p className="text-gray-600 text-sm">Demographics help us show you relevant polls and content.</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-green-600 text-sm">✓</span>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Improve Our Platform</h3>
              <p className="text-gray-600 text-sm">Anonymous usage data helps us make the platform better for everyone.</p>
            </div>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            data-testid="data-usage-next"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Auth Step (Streamlined)
const AuthStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}> = ({ onNext, onBack, onSkip }) => {
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (method: 'email' | 'passkey' | 'google') => {
    setIsLoading(true);
    try {
      // Simulate auth process
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (method === 'email') {
        console.log('Email auth selected');
      } else if (method === 'passkey') {
        console.log('Passkey auth selected');
      } else if (method === 'google') {
        console.log('Google auth selected');
      }
      onNext();
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Create Your Account
          </h2>
          <p className="text-lg text-gray-600 mb-2">
            Choose how you&apos;d like to sign in
          </p>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={() => handleAuth('email')}
            data-testid="auth-next"
            disabled={isLoading}
            className="w-full flex items-center space-x-4 p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <span className="text-3xl">📧</span>
            <div className="text-left">
              <div className="text-lg font-semibold">Email & Password</div>
              <div className="text-gray-500">Simple and secure</div>
            </div>
          </button>

          <button
            onClick={() => handleAuth('passkey')}
            disabled={isLoading}
            className="w-full flex items-center space-x-4 p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <span className="text-3xl">🔐</span>
            <div className="text-left">
              <div className="text-lg font-semibold">Passkey</div>
              <div className="text-gray-500">Most secure option</div>
            </div>
          </button>

          <button
            onClick={() => handleAuth('google')}
            disabled={isLoading}
            className="w-full flex items-center space-x-4 p-6 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            <span className="text-3xl">📱</span>
            <div className="text-left">
              <div className="text-lg font-semibold">Continue with Google</div>
              <div className="text-gray-500">Quick and easy</div>
            </div>
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Why do we need authentication?</h3>
          <ul className="text-gray-600 space-y-1 text-sm">
            <li>• Save your poll responses and preferences</li>
            <li>• Track your representatives over time</li>
            <li>• Get personalized recommendations</li>
            <li>• Ensure one person, one vote</li>
          </ul>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onSkip}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Continue without account
          </button>
        </div>
      </div>
    </div>
  );
};

// Profile Step (Combined Demographics)
const ProfileStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
  demographics: UserDemographics;
  setDemographics: (demographics: UserDemographics) => void;
}> = ({ onNext, onBack, onSkip, demographics, setDemographics }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Tell Us About Yourself
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            This helps us show you relevant content and understand diverse perspectives.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
            <div className="grid grid-cols-2 gap-4">
              <select
                value={demographics.location.state}
                onChange={(e) => setDemographics({
                  ...demographics,
                  location: { ...demographics.location, state: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select State</option>
                <option value="CA">California</option>
                <option value="NY">New York</option>
                <option value="TX">Texas</option>
                <option value="FL">Florida</option>
                <option value="IL">Illinois</option>
              </select>
              <input
                type="text"
                placeholder="District (optional)"
                value={demographics.location.district || ''}
                onChange={(e) => setDemographics({
                  ...demographics,
                  location: { ...demographics.location, district: e.target.value }
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Age Range</label>
              <select
                value={demographics.age_range}
                onChange={(e) => setDemographics({
                  ...demographics,
                  age_range: e.target.value as UserDemographics['age_range']
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Age Range</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55-64">55-64</option>
                <option value="65+">65+</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Education</label>
              <select
                value={demographics.education}
                onChange={(e) => setDemographics({
                  ...demographics,
                  education: e.target.value as UserDemographics['education']
                })}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Education</option>
                <option value="high_school">High School</option>
                <option value="some_college">Some College</option>
                <option value="bachelor">Bachelor&apos;s Degree</option>
                <option value="graduate">Graduate Degree</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Political Engagement</label>
            <select
              value={demographics.political_engagement}
              onChange={(e) => setDemographics({
                ...demographics,
                political_engagement: e.target.value as UserDemographics['political_engagement']
              })}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Engagement Level</option>
              <option value="casual">Casual - I vote occasionally</option>
              <option value="moderate">Moderate - I follow politics regularly</option>
              <option value="very_engaged">Very Engaged - I&apos;m very active in politics</option>
            </select>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div className="space-x-4">
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={onNext}
              data-testid="profile-next"
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
        
        <p className="text-sm text-gray-500 text-center mt-4">
          You can always add this information later
        </p>
      </div>
    </div>
  );
};

// Interests Step (Streamlined)
const InterestsStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
  onSkip: () => void;
}> = ({ onNext, onBack, onSkip }) => {
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  
  const interests = [
    'Climate Change', 'Healthcare', 'Education', 'Economy', 'Immigration',
    'Criminal Justice', 'Voting Rights', 'Technology', 'Foreign Policy', 'Social Security'
  ];

  const toggleInterest = (interest: string) => {
    setSelectedInterests(prev => 
      prev.includes(interest) 
        ? prev.filter(i => i !== interest)
        : [...prev, interest]
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            What Issues Interest You?
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Select topics you&apos;d like to see polls about. You can change these anytime.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-8">
          {interests.map((interest) => (
            <button
              key={interest}
              onClick={() => toggleInterest(interest)}
              className={`p-3 rounded-lg border-2 transition-colors ${
                selectedInterests.includes(interest)
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {interest}
            </button>
          ))}
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <div className="space-x-4">
            <button
              onClick={onSkip}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip for now
            </button>
            <button
              onClick={onNext}
              data-testid="interests-next"
              className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Experience Step (Streamlined)
const ExperienceStep: React.FC<{
  onNext: () => void;
  onBack: () => void;
}> = ({ onNext, onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Your First Experience
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Let&apos;s get you started with your first poll or representative lookup.
          </p>
        </div>

        <div className="space-y-6 mb-8">
          <div className="bg-blue-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">🎯 Try a Poll</h3>
            <p className="text-gray-600 text-sm mb-4">
              Participate in a current poll to see how the voting system works.
            </p>
            <button className="bg-blue-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-blue-700 transition-colors">
              Browse Polls
            </button>
          </div>

          <div className="bg-green-50 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">👥 Find Representatives</h3>
            <p className="text-gray-600 text-sm mb-4">
              Discover who represents you and see their voting records.
            </p>
            <button className="bg-green-600 text-white py-2 px-4 rounded-lg text-sm hover:bg-green-700 transition-colors">
              Find My Reps
            </button>
          </div>
        </div>

        <div className="flex justify-between">
          <button
            onClick={onBack}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={onNext}
            data-testid="experience-next"
            className="bg-blue-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
};

// Complete Step
const CompleteStep: React.FC<{
  onFinish: () => void;
  demographics: UserDemographics;
}> = ({ onFinish, demographics }) => {
  const router = useRouter();

  const handleFindRepresentatives = () => {
    onFinish();
    router.push('/civics');
  };

  const handleBrowsePolls = () => {
    onFinish();
    router.push('/polls');
  };

  const handleExploreFeatures = () => {
    onFinish();
    router.push('/dashboard');
  };

  // Use demographics to personalize the completion message
  const getPersonalizedMessage = () => {
    if (demographics.location.state) {
      return `Great! Let's find your representatives in ${demographics.location.state}`;
    }
    return "Let's find your representatives and explore what's available";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎉</span>
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            You&apos;re All Set!
          </h2>
          <p className="text-xl text-gray-600">
            {getPersonalizedMessage()}
          </p>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Personalized Dashboard</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl mb-2">🗳️</div>
              <h4 className="font-semibold text-blue-900">Vote on Polls</h4>
              <p className="text-blue-700 text-sm">Share your opinion on current issues</p>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl mb-2">👥</div>
              <h4 className="font-semibold text-green-900">Track Representatives</h4>
              <p className="text-green-700 text-sm">See how your reps vote</p>
            </div>
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <div className="text-2xl mb-2">📊</div>
              <h4 className="font-semibold text-purple-900">Campaign Finance</h4>
              <p className="text-purple-700 text-sm">Follow the money in politics</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-8">
          <button
            onClick={handleFindRepresentatives}
            data-testid="complete-onboarding"
            className="w-full bg-blue-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-blue-700 transition-colors"
          >
            Find My Representatives
          </button>
          <button
            onClick={handleBrowsePolls}
            className="w-full bg-green-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-green-700 transition-colors"
          >
            Browse Current Polls
          </button>
          <button
            onClick={handleExploreFeatures}
            className="w-full bg-purple-600 text-white py-4 px-8 rounded-lg font-semibold text-lg hover:bg-purple-700 transition-colors"
          >
            Explore All Features
          </button>
        </div>

        <div className="bg-gray-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s Next?</h3>
          <ul className="text-left text-gray-600 space-y-2">
            <li>• Vote on polls that interest you</li>
            <li>• Track how your representatives vote</li>
            <li>• See campaign finance data</li>
            <li>• Get notified about important issues</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

// Main Streamlined Onboarding Component
const StreamlinedOnboardingFlow: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [onboardingData, setOnboardingData] = useState<OnboardingData>({
    completedSteps: [],
    currentStep: 'welcome',
    demographics: {
      location: { state: '', district: '', quantized: true },
      age_range: '',
      education: '',
      political_engagement: '',
      preferred_contact: ''
    },
    privacy: {
      location_sharing: 'quantized',
      demographic_sharing: 'enabled',
      analytics_sharing: 'enabled'
    },
    userPreferences: {
      primary_interest: 'both',
      notification_frequency: 'important',
      content_complexity: 'detailed'
    }
  });

  const { user, isLoading } = useSupabaseAuth();

  // Skip onboarding if user is already authenticated
  useEffect(() => {
    if (!isLoading && user) {
      window.location.href = '/civics';
    }
  }, [user, isLoading]);

  const handleNext = () => {
    const steps: OnboardingStep[] = ['welcome', 'privacy', 'tour', 'data-usage', 'auth', 'profile', 'interests', 'experience', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex < steps.length - 1) {
      const nextStep = steps[currentIndex + 1];
      if (nextStep) {
        setCurrentStep(nextStep);
        setOnboardingData(prev => ({
          ...prev,
          completedSteps: [...prev.completedSteps, currentStep],
          currentStep: nextStep
        }));
      }
    }
  };

  const handleBack = () => {
    const steps: OnboardingStep[] = ['welcome', 'privacy', 'tour', 'data-usage', 'auth', 'profile', 'interests', 'experience', 'complete'];
    const currentIndex = steps.indexOf(currentStep);
    
    if (currentIndex > 0) {
      const prevStep = steps[currentIndex - 1];
      if (prevStep) {
        setCurrentStep(prevStep);
        setOnboardingData(prev => ({
          ...prev,
          currentStep: prevStep
        }));
      }
    }
  };

  const handleSkip = () => {
    // Skip to auth setup
    setCurrentStep('auth');
  };

  const handleFinish = () => {
    // Complete onboarding
    setOnboardingData(prev => ({
      ...prev,
      completedSteps: [...prev.completedSteps, currentStep]
    }));
    
    // Redirect to main app
    window.location.href = '/civics';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="streamlined-onboarding">
      {currentStep === 'welcome' && (
        <WelcomeStep onNext={handleNext} onSkip={handleSkip} />
      )}
      {currentStep === 'privacy' && (
        <PrivacyStep 
          onNext={handleNext} 
          onBack={handleBack}
          privacy={onboardingData.privacy}
          setPrivacy={(privacy) => setOnboardingData(prev => ({ ...prev, privacy }))}
        />
      )}
      {currentStep === 'tour' && (
        <TourStep onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 'data-usage' && (
        <DataUsageStep onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 'auth' && (
        <AuthStep onNext={handleNext} onBack={handleBack} onSkip={handleNext} />
      )}
      {currentStep === 'profile' && (
        <ProfileStep 
          onNext={handleNext} 
          onBack={handleBack}
          onSkip={handleNext}
          demographics={onboardingData.demographics}
          setDemographics={(demographics) => setOnboardingData(prev => ({ ...prev, demographics }))}
        />
      )}
      {currentStep === 'interests' && (
        <InterestsStep onNext={handleNext} onBack={handleBack} onSkip={handleNext} />
      )}
      {currentStep === 'experience' && (
        <ExperienceStep onNext={handleNext} onBack={handleBack} />
      )}
      {currentStep === 'complete' && (
        <CompleteStep 
          onFinish={handleFinish}
          demographics={onboardingData.demographics}
        />
      )}
    </div>
  );
};

export default StreamlinedOnboardingFlow;
