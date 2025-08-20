'use client';

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import Link from 'next/link';
import { 
  Search, Filter, TrendingUp, TrendingDown, BarChart3, PieChart, 
  LineChart, Eye, Users, Target, Calendar, MapPin, Vote, 
  ChevronRight, ArrowRight, Activity, Globe, CheckCircle2
} from 'lucide-react';
import ReactECharts from 'echarts-for-react';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  options: string[];
  sponsors: string[];
  total_votes: number;
  participation: number;
  created_at: string;
  end_time: string;
}

interface PollInsight {
  id: string;
  title: string;
  insight: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  data: any[];
  statistical_analysis?: {
    sample_size: string;
    margin_of_error: string;
    confidence_level: string;
    methodology: string;
    key_finding: string;
  };
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
    total_votes: 2847,
    participation: 78,
    created_at: '2024-12-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z'
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
    total_votes: 1563,
    participation: 65,
    created_at: '2024-12-05T00:00:00Z',
    end_time: '2024-12-25T23:59:59Z'
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
    total_votes: 3421,
    participation: 82,
    created_at: '2024-12-03T00:00:00Z',
    end_time: '2024-12-28T23:59:59Z'
  },
  {
    id: 'healthcare-access',
    title: 'Healthcare Access Priorities',
    description: 'How should we prioritize healthcare access improvements? Your input will help shape healthcare policy and funding decisions.',
    status: 'active',
    options: [
      'Universal Healthcare Coverage',
      'Mental Health Services Expansion',
      'Rural Healthcare Infrastructure',
      'Preventive Care Programs',
      'Telemedicine Development'
    ],
    sponsors: ['Healthcare Foundation', 'Public Health Institute'],
    total_votes: 1987,
    participation: 71,
    created_at: '2024-12-07T00:00:00Z',
    end_time: '2024-12-30T23:59:59Z'
  },
  {
    id: 'urban-planning',
    title: 'Urban Planning & Development',
    description: 'What should be the focus of our urban development initiatives? Help us create better cities for everyone.',
    status: 'active',
    options: [
      'Affordable Housing Development',
      'Public Transportation Networks',
      'Green Spaces & Parks',
      'Smart City Technology',
      'Community Centers'
    ],
    sponsors: ['Urban Development Council', 'City Planning Institute'],
    total_votes: 1245,
    participation: 58,
    created_at: '2024-12-10T00:00:00Z',
    end_time: '2024-12-29T23:59:59Z'
  }
];

// Poll insights that tell data stories
const pollInsights: PollInsight[] = [
  {
    id: 'climate-trend',
    title: 'Climate Action Momentum',
    insight: 'Renewable energy investment leads with 45% support, showing strong public backing for clean energy transition. This represents a significant shift from previous polling cycles.',
    trend: 'up',
    color: '#10B981',
    data: [
      { name: 'Renewable Energy', value: 45, color: '#10B981', trend: '+8%', confidence: '95%' },
      { name: 'Carbon Tax', value: 23, color: '#3B82F6', trend: '+3%', confidence: '92%' },
      { name: 'EV Infrastructure', value: 18, color: '#8B5CF6', trend: '+12%', confidence: '89%' },
      { name: 'Green Buildings', value: 9, color: '#F59E0B', trend: '+5%', confidence: '87%' },
      { name: 'Public Transit', value: 5, color: '#EF4444', trend: '-2%', confidence: '85%' }
    ],
    statistical_analysis: {
      sample_size: '2,847 respondents',
      margin_of_error: '±2.1%',
      confidence_level: '95%',
      methodology: 'Weighted by age, gender, and region',
      key_finding: 'Support for renewable energy has increased 8 percentage points since last quarter'
    }
  },
  {
    id: 'tech-priorities',
    title: 'Emerging Tech Dominance',
    insight: 'AI/ML and quantum computing represent 65% of public interest in technology development. This suggests a growing awareness of transformative technologies.',
    trend: 'up',
    color: '#3B82F6',
    data: [
      { name: 'AI/ML', value: 37, color: '#3B82F6', trend: '+15%', confidence: '94%' },
      { name: 'Quantum Computing', value: 28, color: '#8B5CF6', trend: '+22%', confidence: '91%' },
      { name: 'Biotech', value: 18, color: '#10B981', trend: '+7%', confidence: '88%' },
      { name: 'Space Tech', value: 12, color: '#F59E0B', trend: '+4%', confidence: '86%' },
      { name: 'Energy Tech', value: 5, color: '#EF4444', trend: '-1%', confidence: '84%' }
    ],
    statistical_analysis: {
      sample_size: '1,563 respondents',
      margin_of_error: '±2.8%',
      confidence_level: '95%',
      methodology: 'Weighted by education level and tech familiarity',
      key_finding: 'AI/ML interest has surged 15 points, while quantum computing shows the fastest growth at +22 points'
    }
  },
  {
    id: 'education-reform',
    title: 'Education Reform Consensus',
    insight: 'Digital infrastructure and teacher support are top priorities across all demographics. Mental health services show the fastest growth.',
    trend: 'stable',
    color: '#8B5CF6',
    data: [
      { name: 'Digital Infrastructure', value: 46, color: '#8B5CF6', trend: '+11%', confidence: '93%' },
      { name: 'Teacher Support', value: 32, color: '#10B981', trend: '+6%', confidence: '90%' },
      { name: 'Mental Health', value: 15, color: '#3B82F6', trend: '+9%', confidence: '87%' },
      { name: 'Career Ed', value: 5, color: '#F59E0B', trend: '+2%', confidence: '85%' },
      { name: 'Parent Involvement', value: 2, color: '#EF4444', trend: '-1%', confidence: '83%' }
    ],
    statistical_analysis: {
      sample_size: '3,421 respondents',
      margin_of_error: '±1.9%',
      confidence_level: '95%',
      methodology: 'Weighted by parental status and education level',
      key_finding: 'Digital infrastructure support has grown 11 points, while mental health services show 9-point increase'
    }
  }
];

export default function PollsPage() {
  const [polls, setPolls] = useState<Poll[]>(mockPolls)
  const [loading, setLoading] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortBy, setSortBy] = useState('recent')

  const filteredPolls = polls.filter(poll => {
    const matchesSearch = poll.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         poll.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || poll.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const sortedPolls = [...filteredPolls].sort((a, b) => {
    switch (sortBy) {
      case 'votes':
        return b.total_votes - a.total_votes
      case 'participation':
        return b.participation - a.participation
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      default:
        return 0
    }
  })

  const renderChart = (insight: PollInsight) => {
  const chartData = insight.data.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
    trend: item.trend,
    confidence: item.confidence
  }));

  const option = {
    title: {
      text: insight.title,
      left: 'center',
      textStyle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#374151'
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow'
      },
      formatter: function(params: any) {
        const data = params[0];
        return `
          <div style="padding: 6px;">
            <div style="font-weight: bold; margin-bottom: 2px;">${data.name}</div>
            <div style="color: ${data.color};">Support: ${data.value}%</div>
            <div style="color: #6B7280;">Trend: ${data.data.trend}</div>
            <div style="color: #6B7280;">Confidence: ±${data.data.confidence}</div>
          </div>
        `;
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      top: '20%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: chartData.map(item => item.name),
      axisLabel: {
        rotate: 45,
        fontSize: 10,
        color: '#6B7280'
      },
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: 'Percentage (%)',
      nameLocation: 'middle',
      nameGap: 30,
      axisLabel: {
        fontSize: 10,
        color: '#6B7280'
      },
      axisLine: {
        lineStyle: {
          color: '#E5E7EB'
        }
      },
      splitLine: {
        lineStyle: {
          color: '#F3F4F6'
        }
      }
    },
    series: [{
      data: chartData.map(item => ({
        value: item.value,
        itemStyle: {
          color: item.color
        },
        trend: item.trend,
        confidence: item.confidence
      })),
      type: 'bar',
      barWidth: '60%',
      itemStyle: {
        borderRadius: [4, 4, 0, 0]
      },
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowColor: 'rgba(0,0,0,0.3)'
        }
      }
    }]
  };

  return (
    <div className="h-56 w-full">
      <ReactECharts
        option={option}
        style={{ height: '100%', width: '100%' }}
        opts={{ renderer: 'canvas' }}
      />
    </div>
  )
}

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Header */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">All Polls</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Explore active polls and discover what the data reveals about public priorities
            </p>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{polls.length}</div>
              <div className="text-sm text-gray-600">Active Polls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {polls.reduce((sum: any, poll: any) => sum + poll.total_votes, 0).toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Total Votes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">
                {Math.round(polls.reduce((sum: any, poll: any) => sum + poll.participation, 0) / polls.length)}%
              </div>
              <div className="text-sm text-gray-600">Avg Participation</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">5</div>
              <div className="text-sm text-gray-600">Categories</div>
            </div>
          </div>
        </div>
      </section>

      {/* Data Insights Section */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Key Insights</h2>
            <p className="text-gray-600">What the data tells us about public priorities</p>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {pollInsights.map((insight: any) => (
              <div key={insight.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: insight.color }}
                    />
                    <span className="text-sm font-medium text-gray-500">LIVE DATA</span>
                  </div>
                  {insight.trend === 'up' && <TrendingUp className="h-4 w-4 text-green-500" />}
                  {insight.trend === 'down' && <TrendingDown className="h-4 w-4 text-red-500" />}
                  {insight.trend === 'stable' && <div className="w-4 h-4 rounded-full bg-gray-300" />}
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-2">{insight.title}</h3>
                <p className="text-sm text-gray-600 mb-4">{insight.insight}</p>
                
                {renderChart(insight)}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search polls..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex gap-4">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="draft">Draft</option>
                <option value="closed">Closed</option>
              </select>
              
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="recent">Most Recent</option>
                <option value="votes">Most Votes</option>
                <option value="participation">Highest Participation</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Polls Grid */}
      <section className="py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Loading polls...</p>
            </div>
          ) : sortedPolls.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No polls found</h3>
              <p className="text-gray-600">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {sortedPolls.map((poll: any) => (
                <div key={poll.id} className="group bg-white rounded-2xl p-6 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                  {/* Status and Views */}
                  <div className="flex items-center justify-between mb-4">
                    <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      {poll.status.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-2 text-gray-500">
                      <Eye className="h-4 w-4" />
                      <span className="text-sm">{Math.floor((poll.id.charCodeAt(0) + poll.id.length) * 10) + 100} views</span>
                    </div>
                  </div>

                  {/* Title and Description */}
                  <h3 className="text-lg font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors line-clamp-2">
                    {poll.title}
                  </h3>
                  <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                    {poll.description}
                  </p>

                  {/* Data Visualization */}
                  <div className="space-y-3 mb-6">
                    {poll.options.slice(0, 2).map((option, idx: any) => (
                      <div key={option} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700 text-sm font-medium line-clamp-1">{option}</span>
                          <span className="text-gray-500 text-sm">
                            {Math.floor((option.length + idx * 10) % 50) + 10}%
                          </span>
                        </div>
                        <div className="mt-2 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                            style={{ width: `${Math.floor((option.length + idx * 10) % 50) + 10}%` }}
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-center">
                      <span className="text-sm text-gray-500">+{poll.options.length - 2} more options</span>
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-gray-500 text-sm mb-6">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{poll.total_votes.toLocaleString()} votes</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      <span>{poll.participation}%</span>
                    </div>
                  </div>

                  {/* Sponsors */}
                  <div className="mb-6">
                    <div className="text-xs text-gray-500 mb-2">Sponsored by:</div>
                    <div className="flex flex-wrap gap-2">
                      {poll.sponsors.map((sponsor: any) => (
                        <span key={sponsor} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                          {sponsor}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link href={`/polls/${poll.id}`}>
                    <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-1 flex items-center justify-center gap-2">
                      <Vote className="h-4 w-4" />
                      View Details
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
