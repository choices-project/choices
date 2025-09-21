'use client'

import Link from 'next/link'
import { 
  Search, Filter, Eye, Users, Calendar, Vote, 
  ArrowRight, Activity
} from 'lucide-react'

type Poll = {
  id: string
  title: string
  description: string
  status: string
  options: string[]
  sponsors: string[]
  totalvotes: number
  participation: number
  createdat: string
  endtime: string
}

// Mock poll data
const mockPolls: Poll[] = [
  {
    id: 'climate-action',
    title: 'Climate Action Priorities 2024',
    description: 'Help us determine the most important climate action initiatives for the coming year. Your vote will influence policy decisions and funding allocations.',
    status: 'active',
    options: [
      'Renewable Energy Investment',
      'Carbon Tax Implementation',
      'Electric Vehicle Infrastructure',
      'Green Building Standards',
      'Public Transportation Expansion'
    ],
    sponsors: ['Environmental Coalition', 'Green Future Initiative'],
    totalvotes: 2847,
    participation: 78,
    createdat: '2024-12-01T00:00:00Z',
    endtime: '2024-12-31T23:59:59Z'
  },
  {
    id: 'tech-priorities',
    title: 'Technology Development Priorities',
    description: 'Which technology areas should receive the most research and development funding? Your input will guide innovation strategy.',
    status: 'active',
    options: [
      'Artificial Intelligence & Machine Learning',
      'Quantum Computing',
      'Renewable Energy Technology',
      'Biotechnology & Healthcare',
      'Space Exploration Technology'
    ],
    sponsors: ['Tech Innovation Council', 'Digital Society Foundation'],
    totalvotes: 1563,
    participation: 65,
    createdat: '2024-12-05T00:00:00Z',
    endtime: '2024-12-25T23:59:59Z'
  },
  {
    id: 'education-reform',
    title: 'Education System Reform Priorities',
    description: 'What should be the top priorities for reforming our education system? Your voice matters in shaping the future of learning.',
    status: 'active',
    options: [
      'Digital Learning Infrastructure',
      'Teacher Training & Support',
      'Mental Health Services',
      'Career & Technical Education',
      'Parental Involvement Programs'
    ],
    sponsors: ['Education Foundation', 'Future of Learning Institute'],
    totalvotes: 3421,
    participation: 82,
    createdat: '2024-12-03T00:00:00Z',
    endtime: '2024-12-28T23:59:59Z'
  }
]

export default function PollsPage() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Active Polls
        </h1>
        <p className="text-gray-600 text-lg">
          Participate in community decisions and make your voice heard
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
          <input
            type="text"
            placeholder="Search polls..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter className="h-4 w-4" />
            Filter
          </button>
          <Link
            href="/polls/create"
            data-testid="create-poll-button"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Vote className="h-4 w-4" />
            Create Poll
          </Link>
        </div>
      </div>

      {/* Polls Grid */}
      <div className="grid gap-6">
        {mockPolls.map((poll) => (
          <div key={poll.id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2">
                  {poll.title}
                </h2>
                <p className="text-gray-600 mb-3">
                  {poll.description}
                </p>
                <div className="flex items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {poll.totalvotes.toLocaleString()} votes
                  </div>
                  <div className="flex items-center gap-1">
                    <Activity className="h-4 w-4" />
                    {poll.participation}% participation
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Ends {new Date(poll.endtime).toLocaleDateString()}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  poll.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {poll.status}
                </span>
              </div>
            </div>

            {/* Poll Options Preview */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Options:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {poll.options.slice(0, 4).map((option, index) => (
                  <div key={index} className="text-sm text-gray-600">
                    • {option}
                  </div>
                ))}
                {poll.options.length > 4 && (
                  <div className="text-sm text-gray-500">
                    +{poll.options.length - 4} more options
                  </div>
                )}
              </div>
            </div>

            {/* Sponsors */}
            <div className="mb-4">
              <h3 className="font-medium text-gray-900 mb-2">Sponsored by:</h3>
              <div className="flex flex-wrap gap-2">
                {poll.sponsors.map((sponsor, index) => (
                  <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    {sponsor}
                  </span>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Eye className="h-4 w-4" />
                View Details
              </div>
              <Link
                href={`/polls/${poll.id}`}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Vote Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {mockPolls.length === 0 && (
        <div className="text-center py-12">
          <Vote className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No active polls</h3>
          <p className="text-gray-600 mb-4">
            There are currently no active polls. Check back soon or create your own!
          </p>
          <Link
            href="/polls/create"
            data-testid="create-poll-button"
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Vote className="h-4 w-4" />
            Create First Poll
          </Link>
        </div>
      )}
    </div>
  )
}
