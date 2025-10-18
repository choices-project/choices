'use client';

import { 
  MessageSquare, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  TrendingUp,
  Star
} from 'lucide-react';
import React from 'react';

interface Feedback {
  id: string;
  type: string;
  sentiment: string;
  status: string;
  priority: string;
  createdat: string;
  updatedat: string;
}

interface FeedbackStatsProps {
  feedback: Feedback[];
}


export const FeedbackStats: React.FC<FeedbackStatsProps> = ({ feedback }) => {
  const stats = React.useMemo(() => {
    const total = feedback.length;
    const open = feedback.filter(f => f.status === 'open').length;
    const resolved = feedback.filter(f => f.status === 'resolved').length;
    const inProgress = feedback.filter(f => f.status === 'inprogress').length;
    const positive = feedback.filter(f => f.sentiment === 'positive').length;
    const negative = feedback.filter(f => f.sentiment === 'negative').length;
    const neutral = feedback.filter(f => f.sentiment === 'neutral').length;
    const highPriority = feedback.filter(f => f.priority === 'high' || f.priority === 'urgent').length;
    
    // Calculate response time (time from creation to first status change)
    const responseTimes = feedback
      .filter(f => f.status !== 'open' && f.updatedat && f.updatedat !== f.createdat)
      .map(f => {
        const createdTime = new Date(f.createdat).getTime();
        const updatedTime = new Date(f.updatedat).getTime();
        return updatedTime - createdTime; // Response time in milliseconds
      });
    
    const avgResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a: number, b: number) => a + b, 0) / responseTimes.length 
      : 0;

    return {
      total,
      open,
      resolved,
      inProgress,
      positive,
      negative,
      neutral,
      highPriority,
      avgResponseTime
    };
  }, [feedback]);

  const statCards = [
    {
      title: 'Total Feedback',
      value: stats.total,
      icon: MessageSquare,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Open',
      value: stats.open,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    },
    {
      title: 'In Progress',
      value: stats.inProgress,
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Positive',
      value: stats.positive,
      icon: Star,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'High Priority',
      value: stats.highPriority,
      icon: AlertCircle,
      color: 'text-red-600',
      bgColor: 'bg-red-50'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {statCards.map((stat) => {
        const Icon = stat.icon;
        return (
          <div key={stat.title} className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center">
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
