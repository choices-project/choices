'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  BarChart3, Vote, Shield, Users, ArrowRight, TrendingUp, Globe, Zap, 
  CheckCircle, Clock, Activity, Target, Award, Star, Heart, Sparkles,
  ArrowUpRight, Calendar, MapPin, Eye, TrendingDown, ChevronRight, Play, Pause, AlertTriangle, CheckCircle2, Filter
} from 'lucide-react';
import { SimpleBarChart } from '../components/SimpleBarChart';
import { FancyDonutChart, FancyBarChart, FancyProgressRing } from '../components/FancyCharts';

interface Poll {
  id: string;
  title: string;
  description: string;
  status: string;
  total_votes?: number;
  participation?: number;
  options: string[];
  sponsors: string[];
  created_at?: string;
  end_time?: string;
}

interface DataStory {
  id: string;
  title: string;
  subtitle: string;
  chart: 'bar' | 'line' | 'pie' | 'trend' | 'heatmap' | 'scatter' | 'radar';
  data: any;
  insight: string;
  trend: 'up' | 'down' | 'stable';
  color: string;
  filters?: {
    timeRange?: string[];
    categories?: string[];
    regions?: string[];
  };
  statistical_analysis?: {
    sample_size: string;
    margin_of_error: string;
    confidence_level: string;
    methodology: string;
    key_finding: string;
  };
}

// Mock poll data for the home page
const mockPolls: Poll[] = [
  {
    id: 'climate-action',
    title: 'Climate Action Priorities 2024',
    description: 'Help us determine the most important climate action initiatives for the coming year. Your vote will influence policy decisions and funding allocations.',
    status: 'active',
    total_votes: 2847,
    participation: 78,
    options: [
      'Renewable Energy Investment',
      'Carbon Tax Implementation', 
      'Electric Vehicle Infrastructure',
      'Green Building Standards',
      'Public Transportation Expansion'
    ],
    sponsors: ['Environmental Coalition', 'Green Future Initiative'],
    created_at: '2024-12-01T00:00:00Z',
    end_time: '2024-12-31T23:59:59Z'
  },
  {
    id: 'tech-priorities',
    title: 'Technology Development Priorities',
    description: 'Which technology areas should receive the most research and development funding? Your input will guide innovation strategy.',
    status: 'active',
    total_votes: 1563,
    participation: 65,
    options: [
      'Artificial Intelligence & Machine Learning',
      'Quantum Computing',
      'Renewable Energy Technology',
      'Biotechnology & Healthcare',
      'Space Exploration Technology'
    ],
    sponsors: ['Tech Innovation Council', 'Digital Society Foundation'],
    created_at: '2024-12-05T00:00:00Z',
    end_time: '2024-12-25T23:59:59Z'
  },
  {
    id: 'education-reform',
    title: 'Education System Reform Priorities',
    description: 'What should be the top priorities for reforming our education system? Your voice matters in shaping the future of learning.',
    status: 'active',
    total_votes: 3421,
    participation: 82,
    options: [
      'Digital Learning Infrastructure',
      'Teacher Training & Support',
      'Mental Health Services',
      'Career & Technical Education',
      'Parental Involvement Programs'
    ],
    sponsors: ['Education Foundation', 'Future of Learning Institute'],
    created_at: '2024-12-03T00:00:00Z',
    end_time: '2024-12-28T23:59:59Z'
  }
];

// Data stories that tell narratives - inspired by FiveThirtyEight and Our World in Data
const dataStories: DataStory[] = [
  {
    id: 'climate-trend',
    title: 'Climate Action Gains Momentum',
    subtitle: 'Renewable energy investment leads with 45% support',
    chart: 'heatmap',
    data: [
      { name: 'Renewable Energy', value: 45, color: '#10B981', trend: '+8%', confidence: '95%' },
      { name: 'Carbon Tax', value: 23, color: '#3B82F6', trend: '+3%', confidence: '92%' },
      { name: 'EV Infrastructure', value: 18, color: '#8B5CF6', trend: '+12%', confidence: '89%' },
      { name: 'Green Buildings', value: 9, color: '#F59E0B', trend: '+5%', confidence: '87%' },
      { name: 'Public Transit', value: 5, color: '#EF4444', trend: '-2%', confidence: '85%' }
    ],
    insight: 'Renewable energy investment is the clear frontrunner, with nearly half of voters prioritizing clean energy infrastructure over other climate solutions. This represents a significant shift from previous polling cycles.',
    trend: 'up',
    color: '#10B981',
    filters: {
      timeRange: ['2024-01-01', '2024-12-31'],
      categories: ['Climate', 'Energy', 'Infrastructure'],
      regions: ['North America', 'Europe', 'Asia']
    },
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
    title: 'AI & Quantum Computing Lead Tech Race',
    subtitle: 'Emerging technologies dominate public interest',
    chart: 'scatter',
    data: [
      { name: 'AI/ML', value: 37, color: '#3B82F6', trend: '+15%', confidence: '94%' },
      { name: 'Quantum Computing', value: 28, color: '#8B5CF6', trend: '+22%', confidence: '91%' },
      { name: 'Biotech', value: 18, color: '#10B981', trend: '+7%', confidence: '88%' },
      { name: 'Space Tech', value: 12, color: '#F59E0B', trend: '+4%', confidence: '86%' },
      { name: 'Energy Tech', value: 5, color: '#EF4444', trend: '-1%', confidence: '84%' }
    ],
    insight: 'Artificial intelligence and quantum computing together represent 65% of public interest, showing strong appetite for cutting-edge technology development. This suggests a growing awareness of transformative technologies.',
    trend: 'up',
    color: '#3B82F6',
    filters: {
      timeRange: ['2024-06-01', '2024-12-31'],
      categories: ['Technology', 'Research', 'Innovation'],
      regions: ['Global']
    },
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
    title: 'Education System Reform Priorities',
    subtitle: 'Digital infrastructure and teacher support lead priorities',
    chart: 'pie',
    data: [
      { name: 'Digital Infrastructure', value: 46, color: '#8B5CF6', trend: '+11%', confidence: '93%' },
      { name: 'Teacher Support', value: 32, color: '#10B981', trend: '+6%', confidence: '90%' },
      { name: 'Mental Health', value: 15, color: '#3B82F6', trend: '+9%', confidence: '87%' },
      { name: 'Career Ed', value: 5, color: '#F59E0B', trend: '+2%', confidence: '85%' },
      { name: 'Parent Involvement', value: 2, color: '#EF4444', trend: '-1%', confidence: '83%' }
    ],
    insight: 'Digital learning infrastructure and teacher support are the top priorities, indicating a focus on both technological advancement and human capital investment. Mental health services show the fastest growth.',
    trend: 'up',
    color: '#8B5CF6',
    filters: {
      timeRange: ['2024-03-01', '2024-12-31'],
      categories: ['Education', 'Technology', 'Health'],
      regions: ['North America', 'Europe']
    },
    statistical_analysis: {
      sample_size: '3,421 respondents',
      margin_of_error: '±1.9%',
      confidence_level: '95%',
      methodology: 'Weighted by parental status and education level',
      key_finding: 'Digital infrastructure support has grown 11 points, while mental health services show 9-point increase'
    }
  }
];

export default function HomePage() {
  const [polls, setPolls] = useState<Poll[]>(mockPolls);
  const [loading, setLoading] = useState(false);
  const [liveVotes, setLiveVotes] = useState(2847);
  const [activeTab, setActiveTab] = useState('featured');

  useEffect(() => {
    // Simulate live vote counter
    const interval = setInterval(() => {
      setLiveVotes(prev => prev + Math.floor(Math.random() * 3) + 1);
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const featuredPolls = polls.filter(poll => poll.status === 'active').slice(0, 3);
  const recentPolls = polls.slice(0, 3);

  const renderChart = (story: DataStory) => {
    const chartData = story.data.map(item => ({
      name: item.name,
      value: item.value,
      color: item.color,
      trend: item.trend,
      confidence: item.confidence
    }));

    const getChartOption = () => {
      switch (story.chart) {
        case 'bar':
          return {
            title: {
              text: story.title,
              left: 'center',
              top: 0,
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
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              textStyle: {
                color: '#374151'
              },
              formatter: function(params: any) {
                const data = params[0];
                return `
                  <div style="padding: 8px; font-family: system-ui;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: #111827;">${data.name}</div>
                    <div style="color: ${data.color}; font-weight: 500;">Support: ${data.value}%</div>
                    <div style="color: #6B7280; font-size: 12px;">Trend: ${data.data.trend}</div>
                    <div style="color: #6B7280; font-size: 12px;">Confidence: ±${data.data.confidence}</div>
                  </div>
                `;
              }
            },
            grid: {
              left: '8%',
              right: '8%',
              bottom: '20%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: chartData.map(item => item.name),
              axisLabel: {
                rotate: 45,
                fontSize: 10,
                color: '#6B7280',
                margin: 8
              },
              axisLine: {
                lineStyle: {
                  color: '#E5E7EB'
                }
              },
              axisTick: {
                show: false
              }
            },
            yAxis: {
              type: 'value',
              name: 'Support (%)',
              nameLocation: 'middle',
              nameGap: 35,
              nameTextStyle: {
                fontSize: 10,
                color: '#6B7280'
              },
              axisLabel: {
                fontSize: 10,
                color: '#6B7280'
              },
              axisLine: {
                show: false
              },
              axisTick: {
                show: false
              },
              splitLine: {
                lineStyle: {
                  color: '#F3F4F6',
                  type: 'dashed'
                }
              }
            },
            series: [{
              data: chartData.map(item => ({
                value: item.value,
                itemStyle: {
                  color: item.color,
                  borderRadius: [4, 4, 0, 0]
                },
                trend: item.trend,
                confidence: item.confidence
              })),
              type: 'bar',
              barWidth: '50%',
              emphasis: {
                itemStyle: {
                  shadowBlur: 15,
                  shadowColor: 'rgba(0,0,0,0.2)',
                  shadowOffsetX: 0,
                  shadowOffsetY: 4
                }
              },
              animationDuration: 1000,
              animationEasing: 'cubicOut'
            }]
          };

        case 'heatmap':
          // Create heatmap data from the story data
          const heatmapData = chartData.map((item, index) => [
            index,
            0,
            item.value
          ]);
          
          return {
            title: {
              text: story.title,
              left: 'center',
              top: 0,
              textStyle: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#374151'
              }
            },
            tooltip: {
              position: 'top',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              formatter: function(params: any) {
                return `${chartData[params.data[0]].name}: ${params.data[2]}%`;
              }
            },
            grid: {
              left: '8%',
              right: '8%',
              bottom: '20%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'category',
              data: chartData.map(item => item.name),
              splitArea: {
                show: true
              },
              axisLabel: {
                rotate: 45,
                fontSize: 10,
                color: '#6B7280'
              }
            },
            yAxis: {
              type: 'category',
              data: ['Support Level'],
              splitArea: {
                show: true
              },
              axisLabel: {
                fontSize: 10,
                color: '#6B7280'
              }
            },
            visualMap: {
              min: 0,
              max: Math.max(...chartData.map(item => item.value)),
              calculable: true,
              orient: 'horizontal',
              left: 'center',
              bottom: '5%',
              inRange: {
                color: ['#F3F4F6', '#3B82F6', '#1E40AF']
              }
            },
            series: [{
              name: 'Support Level',
              type: 'heatmap',
              data: heatmapData,
              label: {
                show: true,
                fontSize: 10,
                formatter: function(params: any) {
                  return `${params.data[2]}%`;
                }
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: 'rgba(0,0,0,0.3)'
                }
              }
            }]
          };

        case 'pie':
          return {
            title: {
              text: story.title,
              left: 'center',
              top: 0,
              textStyle: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#374151'
              }
            },
            tooltip: {
              trigger: 'item',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              formatter: function(params: any) {
                return `
                  <div style="padding: 8px; font-family: system-ui;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: #111827;">${params.name}</div>
                    <div style="color: ${params.color}; font-weight: 500;">Support: ${params.value}%</div>
                    <div style="color: #6B7280; font-size: 12px;">Share: ${params.percent}%</div>
                  </div>
                `;
              }
            },
            legend: {
              orient: 'vertical',
              left: 'left',
              top: 'middle',
              textStyle: {
                fontSize: 10,
                color: '#6B7280'
              }
            },
            series: [{
              name: 'Support',
              type: 'pie',
              radius: ['30%', '60%'],
              center: ['60%', '50%'],
              data: chartData.map(item => ({
                value: item.value,
                name: item.name,
                itemStyle: {
                  color: item.color
                }
              })),
              label: {
                show: false
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowOffsetX: 0,
                  shadowColor: 'rgba(0,0,0,0.3)'
                }
              }
            }]
          };

        case 'scatter':
          return {
            title: {
              text: story.title,
              left: 'center',
              top: 0,
              textStyle: {
                fontSize: 14,
                fontWeight: 'bold',
                color: '#374151'
              }
            },
            tooltip: {
              trigger: 'item',
              backgroundColor: 'rgba(255, 255, 255, 0.95)',
              borderColor: '#E5E7EB',
              borderWidth: 1,
              formatter: function(params: any) {
                return `
                  <div style="padding: 8px; font-family: system-ui;">
                    <div style="font-weight: 600; margin-bottom: 4px; color: #111827;">${params.data.name}</div>
                    <div style="color: ${params.color}; font-weight: 500;">Support: ${params.data.value}%</div>
                    <div style="color: #6B7280; font-size: 12px;">Trend: ${params.data.trend}</div>
                  </div>
                `;
              }
            },
            grid: {
              left: '8%',
              right: '8%',
              bottom: '20%',
              top: '15%',
              containLabel: true
            },
            xAxis: {
              type: 'value',
              name: 'Support Level',
              nameTextStyle: {
                fontSize: 10,
                color: '#6B7280'
              },
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
                  color: '#F3F4F6',
                  type: 'dashed'
                }
              }
            },
            yAxis: {
              type: 'value',
              name: 'Confidence',
              nameTextStyle: {
                fontSize: 10,
                color: '#6B7280'
              },
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
                  color: '#F3F4F6',
                  type: 'dashed'
                }
              }
            },
            series: [{
              type: 'scatter',
              data: chartData.map(item => ({
                value: [item.value, parseInt(item.confidence)],
                name: item.name,
                itemStyle: {
                  color: item.color
                },
                trend: item.trend,
                confidence: item.confidence
              })),
              symbolSize: function(data: any) {
                return Math.sqrt(data[0]) * 3;
              },
              emphasis: {
                itemStyle: {
                  shadowBlur: 10,
                  shadowColor: 'rgba(0,0,0,0.3)'
                }
              }
            }]
          };

        default:
          return {};
      }
    };

    return (
      <div className="h-64 w-full p-4">
        <div className="space-y-3">
          {story.data.map((item: any, index: number) => (
            <div key={index}>
              <div className="flex justify-between mb-2">
                <span className="font-medium text-gray-700">{item.name}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-gray-900">{item.value}%</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    item.trend.startsWith('+') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {item.trend}
                  </span>
                </div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div 
                  className="h-3 rounded-full transition-all duration-1000" 
                  style={{ 
                    width: `${item.value}%`,
                    backgroundColor: item.color
                  }}
                ></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/5 via-purple-600/5 to-pink-600/5"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-8">
              <Activity className="h-4 w-4" />
              <span>Live data from 2.5M+ engaged citizens</span>
            </div>
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
              Your Voice
              <span className="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                Matters
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed">
              Discover what the data reveals about our collective priorities.
              <span className="block text-blue-600 font-semibold">Every vote tells a story.</span>
            </p>
            
            {/* Live Stats with Rich Data */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">{liveVotes.toLocaleString()}</div>
                    <div className="text-sm text-gray-500">Live Votes</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <TrendingUp className="h-4 w-4" />
                  <span>+12% from yesterday</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-gray-900">2.5M+</div>
                    <div className="text-sm text-gray-500">Active Users</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-600 text-sm">
                  <Globe className="h-4 w-4" />
                  <span>150+ countries</span>
                </div>
              </div>
              
              <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Vote className="h-5 w-5 text-purple-600" />
                  </div>
            <div>
                    <div className="text-2xl font-bold text-gray-900">15K+</div>
                    <div className="text-sm text-gray-500">Active Polls</div>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-purple-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  <span>99.9% uptime</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/polls">
                <button className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 hover:-translate-y-1">
                  <Vote className="h-5 w-5" />
                  Explore the Data
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
              <Link href="/dashboard">
                <button className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:-translate-y-1">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  View Analytics
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Professional Data Stories Section - FiveThirtyEight/Our World in Data Style */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">What the Data Reveals</h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Professional analysis of public opinion trends. Every data point tells a story.
          </p>
        </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {dataStories.map((story) => (
            <div key={story.id} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 hover:shadow-md transition-all duration-200">
                {/* Header with Professional Stats */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: story.color }} />
                      <span className="text-sm font-medium text-gray-500">LIVE DATA</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Sample: {story.statistical_analysis?.sample_size}</span>
                      <span>Margin: {story.statistical_analysis?.margin_of_error}</span>
                      <span>Confidence: {story.statistical_analysis?.confidence_level}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {story.trend === 'up' && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {story.trend === 'down' && <TrendingDown className="h-5 w-5 text-red-500" />}
                    {story.trend === 'stable' && <div className="w-5 h-5 rounded-full bg-gray-300" />}
                  </div>
                </div>
                
                {/* Interactive Filters */}
                {story.filters && (
                  <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4 mb-3">
                      <Filter className="h-4 w-4 text-gray-600" />
                      <span className="text-sm font-medium text-gray-700">Filter Data</span>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      {story.filters.categories && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Categories:</span>
                          <div className="flex gap-1">
                            {story.filters.categories.map((cat, idx) => (
                              <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {story.filters.regions && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Regions:</span>
                          <div className="flex gap-1">
                            {story.filters.regions.map((region, idx) => (
                              <span key={idx} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
                                {region}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {story.filters.timeRange && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-600">Time:</span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full">
                            {story.filters.timeRange[0]} to {story.filters.timeRange[1]}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Title and Subtitle */}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{story.title}</h3>
                <p className="text-gray-600 mb-6">{story.subtitle}</p>
                
                {/* Professional Chart with Enhanced Styling */}
                <div className="mb-6">
                  <div className="mb-3">
                    <h4 className="text-sm font-semibold text-gray-900 mb-1">Data Visualization</h4>
                    <p className="text-xs text-gray-500">Interactive chart with trend analysis</p>
                  </div>
                  {renderChart(story)}
                </div>
                
                {/* Statistical Analysis */}
                <div className="grid grid-cols-1 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-blue-900 mb-1">Key Finding</h4>
                    <p className="text-xs text-blue-800">{story.statistical_analysis?.key_finding}</p>
                  </div>
                  <div className="bg-green-50 rounded-lg p-3">
                    <h4 className="text-xs font-semibold text-green-900 mb-1">Methodology</h4>
                    <p className="text-xs text-green-800">{story.statistical_analysis?.methodology}</p>
                  </div>
                </div>
                
                {/* Enhanced Insight with Trend Indicators */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <h4 className="text-sm font-semibold text-gray-900 mb-2">Analysis</h4>
                  <p className="text-gray-700 text-sm leading-relaxed mb-3">{story.insight}</p>
                  
                  {/* Trend Indicators */}
                  <div className="grid grid-cols-3 gap-2">
                    {story.data.slice(0, 3).map((item, index) => (
                      <div key={index} className="text-center">
                        <div className="text-xs text-gray-500 mb-1 truncate">{item.name}</div>
                        <div className="text-sm font-bold" style={{ color: item.color }}>
                          {item.value}%
                        </div>
                        <div className={`text-xs ${item.trend?.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
                          {item.trend}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Professional CTA */}
                <div className="flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    Updated: {new Date().toLocaleDateString()}
                  </div>
                  <Link href={`/polls/${story.id}`}>
                    <button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 hover:bg-gray-800 flex items-center gap-1">
                      <BarChart3 className="h-3 w-3" />
                      View Details
                      <ChevronRight className="h-3 w-3" />
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
            </div>
      </section>

      {/* Featured Polls with Rich Data */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Trending Polls</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Join the conversation on today's most important topics
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredPolls.map((poll) => (
              <div key={poll.id} className="group bg-white rounded-2xl p-8 shadow-lg border border-gray-100 hover:shadow-xl transition-all duration-300 hover:-translate-y-2">
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    LIVE
                  </span>
                  <div className="flex items-center gap-2 text-gray-500">
                    <Eye className="h-4 w-4" />
                    <span className="text-sm">{Math.floor((poll.id.charCodeAt(0) + poll.id.length) * 10) + 100}</span>
                  </div>
            </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors">
                  {poll.title}
                </h3>
                <p className="text-gray-600 text-sm mb-6 line-clamp-2">
                  {poll.description}
                </p>
                
                {/* Rich Data Visualization */}
                <div className="space-y-3 mb-6">
                  {poll.options.slice(0, 2).map((option, optIndex) => (
                    <div key={option} className="bg-gray-50 rounded-lg p-3">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700 text-sm font-medium line-clamp-1">{option}</span>
                        <span className="text-gray-500 text-xs">
                          {Math.floor((option.length + optIndex * 10) % 40) + 10}%
                        </span>
                      </div>
                      <div className="mt-2 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.floor((option.length + optIndex * 10) % 40) + 10}%` }}
                        />
                      </div>
                    </div>
                  ))}
                  <div className="text-center">
                    <span className="text-sm text-gray-500">+{poll.options.length - 2} more options</span>
                  </div>
                </div>
                
                <div className="flex items-center justify-between text-gray-500 text-sm mb-6">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{poll.total_votes?.toLocaleString()} votes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    <span>{poll.participation}%</span>
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="text-xs text-gray-500 mb-2">Sponsored by:</div>
                  <div className="flex flex-wrap gap-2">
                    {poll.sponsors.map((sponsor) => (
                      <span key={sponsor} className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded-full">
                        {sponsor}
                      </span>
                    ))}
                  </div>
                </div>
                
                <Link href={`/polls/${poll.id}`}>
                  <button className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-xl font-semibold transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                    Vote Now
                  </button>
                </Link>
              </div>
            ))}
          </div>

          <div className="text-center mt-12">
            <Link href="/polls">
              <button className="group bg-white text-gray-700 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 border border-gray-200 hover:-translate-y-1 mx-auto">
                <Vote className="h-5 w-5 text-blue-600" />
                View All Polls
                <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </Link>
          </div>
            </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose Choices?</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built for the future of democracy with cutting-edge technology
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="h-6 w-6 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Privacy First</h3>
              <p className="text-gray-600 mb-4">
                Your votes are completely anonymous and protected by advanced cryptography. We can't see your choices, and neither can anyone else.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Zero-knowledge proofs
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  End-to-end encryption
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Anonymous voting
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
                <Zap className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Real-Time Results</h3>
              <p className="text-gray-600 mb-4">
                See live results and participate in ongoing polls instantly. Watch democracy in action as votes come in real-time.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Live vote counting
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Instant updates
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Interactive charts
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-900 mb-4">Verified Results</h3>
              <p className="text-gray-600 mb-4">
                Every vote is cryptographically verified and tamper-proof. Trust in the integrity of democratic decision-making.
              </p>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Cryptographic verification
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Tamper-proof records
                </li>
                <li className="flex items-center gap-2 text-sm text-gray-600">
                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                  Transparent audit trail
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

        {/* Data Visualization Section */}
        <section className="py-20 bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-4">Real-Time Insights</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how your community is engaging with important issues through live data visualizations.
              </p>
        </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
              {/* Live Poll Activity */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <Activity className="h-6 w-6 text-blue-600" />
                  Live Poll Activity
                </h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Climate Action</span>
                      <span className="font-bold text-green-600">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-green-500 h-4 rounded-full transition-all duration-1000" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Education Reform</span>
                      <span className="font-bold text-blue-600">82%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-blue-500 h-4 rounded-full transition-all duration-1000" style={{ width: '82%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Tech Development</span>
                      <span className="font-bold text-purple-600">65%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-purple-500 h-4 rounded-full transition-all duration-1000" style={{ width: '65%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Healthcare Access</span>
                      <span className="font-bold text-orange-600">71%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div className="bg-orange-500 h-4 rounded-full transition-all duration-1000" style={{ width: '71%' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Community Engagement Trends */}
              <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                  Community Engagement
                </h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Monday</span>
                      <span className="font-bold text-gray-900">156 votes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000" style={{ width: '45%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Tuesday</span>
                      <span className="font-bold text-gray-900">234 votes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000" style={{ width: '67%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Wednesday</span>
                      <span className="font-bold text-gray-900">189 votes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000" style={{ width: '54%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="font-medium">Today</span>
                      <span className="font-bold text-gray-900">342 votes</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000" style={{ width: '98%' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Category Distribution */}
            <div className="bg-white rounded-2xl p-8 shadow-lg border border-gray-100">
              <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2">
                <BarChart3 className="h-6 w-6 text-green-600" />
                Vote Distribution by Category
              </h3>
              <div className="flex justify-center">
                <FancyDonutChart
                  data={[
                    { name: 'Environment', value: 35, color: '#10b981' },
                    { name: 'Education', value: 28, color: '#3b82f6' },
                    { name: 'Technology', value: 22, color: '#8b5cf6' },
                    { name: 'Healthcare', value: 15, color: '#f59e0b' }
                  ]}
                  size={300}
                  strokeWidth={30}
                  title="Categories"
                />
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">Ready to Make Your Voice Heard?</h2>
          <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Join millions of users participating in secure, privacy-preserving polls that shape the future of democracy.
          </p>
          <Link href="/polls">
            <button className="group bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-3 hover:-translate-y-1 mx-auto">
              <Vote className="h-5 w-5" />
              Start Voting Now
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>
            </Link>
        </div>
      </section>
    </div>
  );
}
