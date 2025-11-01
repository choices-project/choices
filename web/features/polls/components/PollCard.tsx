'use client';

import { 
  Users, 
  BarChart3, 
  Eye, 
  Clock,
  Calendar,
  User
} from 'lucide-react';
import Link from 'next/link';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


type Poll = {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'closed' | 'draft';
  options: string[];
  totalvotes: number;
  participation: number;
  createdBy: string;
  createdAt: string;
  endTime?: string;
  votingMethod: 'single' | 'approval' | 'ranked' | 'quadratic' | 'range';
}

type PollCardProps = {
  poll: Poll;
  showActions?: boolean;
  className?: string;
}

const PollCard: React.FC<PollCardProps> = ({ 
  poll, 
  showActions = true, 
  className = '' 
}) => {
  const getStatusColor = (status: Poll['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'closed':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getVotingMethodLabel = (method: Poll['votingMethod']) => {
    switch (method) {
      case 'single':
        return 'Single Choice';
      case 'approval':
        return 'Approval';
      case 'ranked':
        return 'Ranked Choice';
      case 'quadratic':
        return 'Quadratic';
      case 'range':
        return 'Range';
      default:
        return 'Unknown';
    }
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);
    if (Number.isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className={`hover:shadow-md transition-shadow duration-200 ${className}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg font-semibold text-gray-900 line-clamp-2">
              {poll.title}
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">
              {poll.description}
            </p>
          </div>
          <Badge className={`ml-2 shrink-0 ${getStatusColor(poll.status)}`}>
            {poll.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {/* Poll metadata */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center text-sm text-gray-600">
            <User className="w-4 h-4 mr-2" />
            <span>Created by {poll.createdBy}</span>
          </div>
          
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-2" />
            <span>Created {formatDate(poll.createdAt)}</span>
          </div>

          {poll.endTime && (
            <div className="flex items-center text-sm text-gray-600">
              <Clock className="w-4 h-4 mr-2" />
              <span>Ends {formatDate(poll.endTime)} at {formatTime(poll.endTime)}</span>
            </div>
          )}

          <div className="flex items-center text-sm text-gray-600">
            <BarChart3 className="w-4 h-4 mr-2" />
            <span>{getVotingMethodLabel(poll.votingMethod)}</span>
          </div>
        </div>

        {/* Poll options preview */}
        <div className="mb-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Options:</h4>
          <div className="space-y-1">
            {poll.options.slice(0, 3).map((option, index) => (
              <div key={`option-${option}-${index}`} className="text-sm text-gray-600 truncate">
                {index + 1}. {option}
              </div>
            ))}
            {poll.options.length > 3 && (
              <div className="text-sm text-gray-500">
                +{poll.options.length - 3} more options
              </div>
            )}
          </div>
        </div>

        {/* Poll statistics */}
        <div className="flex items-center justify-between text-sm text-gray-600 mb-4">
          <div className="flex items-center">
            <Users className="w-4 h-4 mr-1" />
            <span>{poll.totalvotes} votes</span>
          </div>
          <div className="flex items-center">
            <BarChart3 className="w-4 h-4 mr-1" />
            <span>{poll.participation}% participation</span>
          </div>
        </div>

        {/* Actions */}
        {showActions && (
          <div className="flex gap-2">
            <Button asChild variant="default" className="flex-1">
              <Link href={`/polls/${poll.id}`}>
                <Eye className="w-4 h-4 mr-2" />
                View Poll
              </Link>
            </Button>
            
            {poll.status === 'active' && (
              <Button asChild variant="outline" className="flex-1">
                <Link href={`/polls/${poll.id}/vote`}>
                  Vote Now
                </Link>
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default PollCard;
