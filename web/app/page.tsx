'use client';

import React, { useState, useEffect } from 'react';
import HeroSection from '../components/HeroSection';
import FeaturedPolls from '../components/FeaturedPolls';
import DataStories from '../components/DataStories';
import UserEngagement from '../components/UserEngagement';
import CreatePoll from '../components/CreatePoll';
import { pollService, Poll } from '../lib/poll-service';

// Mock data for data stories and engagement metrics
const mockDataStories = [
  {
    id: '1',
    title: 'Youth Participation Surge',
    subtitle: '18-25 age group shows unprecedented engagement',
    chart: 'trend' as const,
    data: [
      { name: '18-25', value: 78, trend: '+12%', color: '#3B82F6', sample_size: 1200 },
      { name: '26-35', value: 65, trend: '+8%', color: '#8B5CF6', sample_size: 1500 },
      { name: '36-45', value: 52, trend: '+5%', color: '#10B981', sample_size: 1800 },
      { name: '46-55', value: 41, trend: '+3%', color: '#F59E0B', sample_size: 1600 },
      { name: '55+', value: 28, trend: '+2%', color: '#EF4444', sample_size: 1400 }
    ],
    insight: 'Young voters are driving unprecedented participation rates, with 78% of 18-25 year olds engaging in climate and technology polls.',
    trend: 'up' as const,
    color: '#3B82F6',
    statistical_analysis: {
      sample_size: '7,500 respondents',
      margin_of_error: '±2.1%',
      confidence_level: '95%',
      methodology: 'Random sampling across demographic groups',
      key_finding: 'Youth engagement increased 12% year-over-year, highest in platform history.'
    }
  },
  {
    id: '2',
    title: 'Geographic Participation',
    subtitle: 'Urban vs rural voting patterns',
    chart: 'pie' as const,
    data: [
      { name: 'Urban Centers', value: 45, color: '#3B82F6', sample_size: 3400 },
      { name: 'Suburban Areas', value: 32, color: '#8B5CF6', sample_size: 2400 },
      { name: 'Rural Communities', value: 23, color: '#10B981', sample_size: 1700 }
    ],
    insight: 'Urban centers show highest participation, but rural communities are closing the gap with improved digital access.',
    trend: 'stable' as const,
    color: '#8B5CF6',
    statistical_analysis: {
      sample_size: '7,500 respondents',
      margin_of_error: '±2.8%',
      confidence_level: '95%',
      methodology: 'Geographic clustering analysis',
      key_finding: 'Rural participation increased 8% following broadband infrastructure improvements.'
    }
  },
  {
    id: '3',
    title: 'Topic Engagement Trends',
    subtitle: 'Most popular poll categories',
    chart: 'bar' as const,
    data: [
      { name: 'Climate Action', value: 85, trend: '+15%', color: '#10B981', sample_size: 2847 },
      { name: 'Technology', value: 72, trend: '+8%', color: '#3B82F6', sample_size: 1956 },
      { name: 'Education', value: 68, trend: '+12%', color: '#8B5CF6', sample_size: 3421 },
      { name: 'Healthcare', value: 65, trend: '+5%', color: '#F59E0B', sample_size: 4123 },
      { name: 'Transportation', value: 58, trend: '+3%', color: '#EF4444', sample_size: 1567 }
    ],
    insight: 'Climate action polls consistently receive the highest engagement, indicating strong public interest in environmental issues.',
    trend: 'up' as const,
    color: '#10B981',
    statistical_analysis: {
      sample_size: '13,914 total votes',
      margin_of_error: '±1.8%',
      confidence_level: '95%',
      methodology: 'Cross-category participation analysis',
      key_finding: 'Climate topics show 15% higher engagement than other categories.'
    }
  }
];

const mockEngagementMetrics = {
  totalUsers: 52480,
  activeUsers: 3421,
  totalVotes: 1234567,
  votesToday: 2847,
  participationRate: 78,
  averageResponseTime: 245,
  pollsCreated: 156,
  pollsActive: 23
};

const mockGeographicData = [
  { country: 'United States', users: 28470, votes: 456789, percentage: 45 },
  { country: 'Canada', users: 8234, votes: 123456, percentage: 18 },
  { country: 'United Kingdom', users: 6543, votes: 98765, percentage: 15 },
  { country: 'Germany', users: 4321, votes: 65432, percentage: 12 },
  { country: 'Australia', users: 3456, votes: 54321, percentage: 8 },
  { country: 'Other', users: 1456, votes: 21804, percentage: 2 }
];

const mockActivityData = [
  { time: '00:00', votes: 45, users: 23, polls: 12 },
  { time: '02:00', votes: 32, users: 18, polls: 8 },
  { time: '04:00', votes: 28, users: 15, polls: 6 },
  { time: '06:00', votes: 67, users: 34, polls: 15 },
  { time: '08:00', votes: 123, users: 67, polls: 23 },
  { time: '10:00', votes: 234, users: 128, polls: 31 },
  { time: '12:00', votes: 189, users: 98, polls: 28 },
  { time: '14:00', votes: 256, users: 145, polls: 35 },
  { time: '16:00', votes: 198, users: 112, polls: 29 },
  { time: '18:00', votes: 167, users: 89, polls: 25 },
  { time: '20:00', votes: 145, users: 76, polls: 22 },
  { time: '22:00', votes: 89, users: 45, polls: 18 }
];

export default function HomePage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [polls, setPolls] = useState<Poll[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreatePoll, setShowCreatePoll] = useState(false);
  const [userStats, setUserStats] = useState({
    totalVotes: 47,
    activePolls: 3,
    participationRate: 85
  });

  // Load polls from service
  useEffect(() => {
    const loadPolls = async () => {
      try {
        setIsLoading(true);
        const pollsData = await pollService.getPolls();
        setPolls(pollsData);
      } catch (error) {
        console.error('Error loading polls:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadPolls();
  }, []);

  // Simulate authentication check
  useEffect(() => {
    const checkAuth = () => {
      // Mock: 30% chance of being authenticated
      setIsAuthenticated(Math.random() > 0.7);
    };
    
    checkAuth();
  }, []);

  const handleVote = async (pollId: string, choice: number) => {
    try {
      const response = await pollService.submitVote(pollId, choice);
      
      if (response.success) {
        // Update user stats
        setUserStats(prev => ({
          ...prev,
          totalVotes: prev.totalVotes + 1
        }));

        // Refresh polls to get updated vote counts
        const updatedPolls = await pollService.getPolls();
        setPolls(updatedPolls);
      }
      
      return response;
    } catch (error) {
      console.error('Error submitting vote:', error);
      return {
        success: false,
        voteId: '',
        message: 'Failed to submit vote'
      };
    }
  };

  const handleVerify = async (voteId: string) => {
    return await pollService.verifyVote(voteId);
  };

  const handleViewDetails = (pollId: string) => {
    console.log(`Viewing details for poll ${pollId}`);
    // In a real app, this would navigate to the poll detail page
  };

  const handlePollCreated = (newPoll: Poll) => {
    // Add the new poll to the list
    setPolls(prev => [newPoll, ...prev]);
    
    // Update user stats
    setUserStats(prev => ({
      ...prev,
      activePolls: prev.activePolls + 1
    }));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <HeroSection 
        isAuthenticated={isAuthenticated}
        userStats={userStats}
      />

      {/* Onboarding CTA for new users */}
      {!isAuthenticated && (
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-4">
              Ready to make your voice heard?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join our community and start participating in polls that matter. 
              It only takes 2 minutes to get started.
            </p>
            <a
              href="/onboarding"
              className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              Get Started
            </a>
          </div>
        </div>
      )}

      {/* Featured Polls */}
      <FeaturedPolls
        polls={polls}
        onVote={handleVote}
        onViewDetails={handleViewDetails}
        title="Active Polls"
        subtitle="Participate in important decisions that shape our future"
        maxPolls={6}
      />

      {/* Create Poll Button */}
      <div className="text-center py-8">
        <button
          onClick={() => setShowCreatePoll(true)}
          className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-lg hover:shadow-xl"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Your Own Poll
        </button>
      </div>

      {/* Data Stories */}
      <DataStories
        stories={mockDataStories}
        title="Voting Insights"
        subtitle="Discover trends and patterns in democratic participation"
        maxStories={3}
      />

      {/* User Engagement */}
      <UserEngagement
        metrics={mockEngagementMetrics}
        geographicData={mockGeographicData}
        activityData={mockActivityData}
        title="Live Platform Activity"
        subtitle="Real-time participation and engagement metrics"
      />

      {/* Create Poll Modal */}
      <CreatePoll
        isOpen={showCreatePoll}
        onPollCreated={handlePollCreated}
        onCancel={() => setShowCreatePoll(false)}
      />

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4">Choices Platform</h3>
              <p className="text-gray-400 text-sm">
                Empowering democratic decision-making through secure, transparent, and accessible voting technology.
              </p>
            </div>
            <div>
              <h4 className="font-medium mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">How It Works</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Security</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Transparency</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API Reference</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Support</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li><a href="#" className="hover:text-white transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Cookie Policy</a></li>
                <li><a href="#" className="hover:text-white transition-colors">GDPR</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Choices Platform. All rights reserved. Built with privacy and transparency in mind.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
