'use client';

import React, { useState, useEffect } from 'react';
import { 
  Share2, 
  TrendingUp, 
  Clock, 
  Users,
  Crown,
  Star,
  MessageCircle,
  ExternalLink
} from 'lucide-react';
import CivicsLure from '../civics/CivicsLure';

type LivePoll = {
  id: string;
  title: string;
  description: string;
  category: 'drag-race' | 'reality-tv' | 'sports' | 'awards' | 'politics' | 'other';
  options: PollOption[];
  totalVotes: number;
  timeRemaining: string;
  isLive: boolean;
  trendingScore: number;
  shareCount: number;
  imageUrl?: string;
  externalLink?: string;
}

type PollOption = {
  id: string;
  name: string;
  votes: number;
  percentage: number;
  imageUrl?: string;
  isWinning?: boolean;
}

export default function LiveVotingFeed() {
  const [polls, setPolls] = useState<LivePoll[]>([]);
  const [userVotes, setUserVotes] = useState<Record<string, string>>({});
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Mock data - in real app this would come from API
  useEffect(() => {
    const mockPolls: LivePoll[] = [
      {
        id: 'drag-race-finale',
        title: 'RuPaul\'s Drag Race Finale - Who Should Win? 👑',
        description: 'The final lipsync is happening NOW! Who do you think deserves the crown?',
        category: 'drag-race',
        totalVotes: 15420,
        timeRemaining: '2:34',
        isLive: true,
        trendingScore: 95,
        shareCount: 2340,
        imageUrl: '/images/drag-race-finale.jpg',
        options: [
          {
            id: 'queen-1',
            name: 'Sasha Colby',
            votes: 6234,
            percentage: 40.4,
            imageUrl: '/images/sasha-colby.jpg',
            isWinning: true
          },
          {
            id: 'queen-2', 
            name: 'Anetra',
            votes: 5678,
            percentage: 36.8,
            imageUrl: '/images/anetra.jpg'
          },
          {
            id: 'queen-3',
            name: 'Luxx Noir London',
            votes: 3508,
            percentage: 22.8,
            imageUrl: '/images/luxx-noir.jpg'
          }
        ]
      },
      {
        id: 'oscars-best-picture',
        title: 'Oscars 2024 - Best Picture Predictions 🎬',
        description: 'Who do you think will take home the big prize tonight?',
        category: 'awards',
        totalVotes: 8934,
        timeRemaining: '45:12',
        isLive: true,
        trendingScore: 87,
        shareCount: 1567,
        options: [
          {
            id: 'movie-1',
            name: 'Everything Everywhere All at Once',
            votes: 3456,
            percentage: 38.7,
            isWinning: true
          },
          {
            id: 'movie-2',
            name: 'The Banshees of Inisherin',
            votes: 2890,
            percentage: 32.4
          },
          {
            id: 'movie-3',
            name: 'Top Gun: Maverick',
            votes: 2588,
            percentage: 29.0
          }
        ]
      },
      {
        id: 'super-bowl-mvp',
        title: 'Super Bowl MVP - Who\'s Your Pick? 🏈',
        description: 'The game is heating up! Who do you think will be MVP?',
        category: 'sports',
        totalVotes: 23456,
        timeRemaining: '12:45',
        isLive: true,
        trendingScore: 92,
        shareCount: 3456,
        options: [
          {
            id: 'player-1',
            name: 'Patrick Mahomes',
            votes: 12345,
            percentage: 52.6,
            isWinning: true
          },
          {
            id: 'player-2',
            name: 'Jalen Hurts',
            votes: 6789,
            percentage: 28.9
          },
          {
            id: 'player-3',
            name: 'Travis Kelce',
            votes: 4322,
            percentage: 18.4
          }
        ]
      }
    ];
    setPolls(mockPolls);
  }, []);

  const categories = [
    { id: 'all', name: 'All', icon: '🔥' },
    { id: 'drag-race', name: 'Drag Race', icon: '👑' },
    { id: 'reality-tv', name: 'Reality TV', icon: '📺' },
    { id: 'sports', name: 'Sports', icon: '🏈' },
    { id: 'awards', name: 'Awards', icon: '🏆' },
    { id: 'politics', name: 'Politics', icon: '🗳️' }
  ];

  const handleVote = (pollId: string, optionId: string) => {
    setUserVotes(prev => ({
      ...prev,
      [pollId]: optionId
    }));
    
    // In real app, this would update the backend
    setPolls(prev => prev.map(poll => {
      if (poll.id === pollId) {
        const newOptions = poll.options.map(option => {
          if (option.id === optionId) {
            return {
              ...option,
              votes: option.votes + 1,
              percentage: ((option.votes + 1) / (poll.totalVotes + 1)) * 100
            };
          }
          return {
            ...option,
            percentage: (option.votes / (poll.totalVotes + 1)) * 100
          };
        });
        
        return {
          ...poll,
          options: newOptions,
          totalVotes: poll.totalVotes + 1
        };
      }
      return poll;
    }));
  };

  const handleShare = (poll: LivePoll) => {
    const shareText = `Just voted on "${poll.title}" - who do you think will win? 🗳️`;
    const shareUrl = `https://choices.app/poll/${poll.id}`;
    
    if (navigator.share) {
      navigator.share({
        title: poll.title,
        text: shareText,
        url: shareUrl
      });
    } else {
      // Fallback to copying to clipboard
      navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
    }
  };

  const filteredPolls = selectedCategory === 'all' 
    ? polls 
    : polls.filter(poll => poll.category === selectedCategory);

  return (
    <div className="max-w-4xl mx-auto p-4">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          Live Voting Feed 🔥
        </h1>
        <p className="text-lg text-gray-600">
          Vote on the biggest moments happening right now - from Drag Race to the Oscars!
        </p>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-6 justify-center">
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="mr-2">{category.icon}</span>
            {category.name}
          </button>
        ))}
      </div>

      {/* Live Polls */}
      <div className="space-y-6">
        {filteredPolls.map((poll) => (
          <div key={poll.id} className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {/* Poll Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    {poll.isLive && (
                      <div className="flex items-center space-x-1 bg-red-100 text-red-700 px-2 py-1 rounded-full text-xs font-medium">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span>LIVE</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-1 bg-orange-100 text-orange-700 px-2 py-1 rounded-full text-xs font-medium">
                      <TrendingUp className="w-3 h-3" />
                      <span>#{poll.trendingScore} trending</span>
                    </div>
                  </div>
                  
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    {poll.title}
                  </h2>
                  <p className="text-gray-600 mb-3">
                    {poll.description}
                  </p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Users className="w-4 h-4" />
                      <span>{poll.totalVotes.toLocaleString()} votes</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Clock className="w-4 h-4" />
                      <span>{poll.timeRemaining} left</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Share2 className="w-4 h-4" />
                      <span>{poll.shareCount.toLocaleString()} shares</span>
                    </div>
                  </div>
                </div>
                
                {poll.imageUrl && (
                  <div className="ml-4">
                    <img
                      src={poll.imageUrl}
                      alt={poll.title}
                      className="w-24 h-24 object-cover rounded-lg"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Poll Options */}
            <div className="p-6">
              <div className="space-y-3">
                {poll.options.map((option) => {
                  const hasVoted = userVotes[poll.id] === option.id;
                  const canVote = !userVotes[poll.id] && poll.isLive;
                  
                  return (
                    <div
                      key={option.id}
                      className={`relative p-4 rounded-lg border-2 transition-all ${
                        hasVoted
                          ? 'border-blue-500 bg-blue-50'
                          : canVote
                          ? 'border-gray-200 hover:border-gray-300 cursor-pointer'
                          : 'border-gray-100 bg-gray-50'
                      }`}
                      onClick={() => canVote && handleVote(poll.id, option.id)}
                    >
                      <div className="flex items-center space-x-4">
                        {option.imageUrl && (
                          <img
                            src={option.imageUrl}
                            alt={option.name}
                            className="w-12 h-12 object-cover rounded-full"
                          />
                        )}
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-semibold text-gray-900">
                              {option.name}
                              {option.isWinning && (
                                <Crown className="w-4 h-4 text-yellow-500 ml-2 inline" />
                              )}
                            </h3>
                            <div className="text-right">
                              <div className="font-bold text-gray-900">
                                {option.percentage.toFixed(1)}%
                              </div>
                              <div className="text-sm text-gray-500">
                                {option.votes.toLocaleString()} votes
                              </div>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full transition-all duration-500 ${
                                option.isWinning ? 'bg-yellow-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${option.percentage}%` }}
                            />
                          </div>
                        </div>
                        
                        {hasVoted && (
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                              <Star className="w-4 h-4 text-white fill-current" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Poll Actions */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => handleShare(poll)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Share2 className="w-4 h-4" />
                    <span>Share</span>
                  </button>
                  
                  <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
                    <MessageCircle className="w-4 h-4" />
                    <span>Discuss</span>
                  </button>
                </div>
                
                {poll.externalLink && (
                  <a
                    href={poll.externalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center space-x-2 px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span>Watch Live</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Civics Lure */}
      <CivicsLure
        userLocation="San Francisco, CA"
        onEngage={() => console.log('Navigate to civics')}
      />
    </div>
  );
}
