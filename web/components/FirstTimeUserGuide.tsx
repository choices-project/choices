'use client';

import React, { useState } from 'react';
import { ArrowRight, Vote, Users, BarChart3, X, CheckCircle } from 'lucide-react';

type FirstTimeUserGuideProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const FirstTimeUserGuide: React.FC<FirstTimeUserGuideProps> = ({ isOpen, onClose, onComplete }) => {
  const [completedActions, setCompletedActions] = useState<string[]>([]);

  const actions = [
    {
      id: 'browse-polls',
      title: 'Try a Poll',
      description: 'Participate in a current poll to see how the voting system works.',
      icon: <Vote className="h-6 w-6" />,
      color: 'bg-blue-50 border-blue-200',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
      href: '/polls'
    },
    {
      id: 'find-representatives',
      title: 'Find Representatives',
      description: 'Discover who represents you and see their voting records.',
      icon: <Users className="h-6 w-6" />,
      color: 'bg-green-50 border-green-200',
      buttonColor: 'bg-green-600 hover:bg-green-700',
      href: '/representatives'
    },
    {
      id: 'explore-data',
      title: 'Explore Campaign Finance',
      description: 'See who\'s funding campaigns and understand the money in politics.',
      icon: <BarChart3 className="h-6 w-6" />,
      color: 'bg-purple-50 border-purple-200',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
      href: '/campaign-finance'
    }
  ];

  const handleActionComplete = (actionId: string) => {
    if (!completedActions.includes(actionId)) {
      setCompletedActions([...completedActions, actionId]);
    }
  };

  const handleComplete = () => {
    onComplete?.();
    onClose();
  };

  const allCompleted = completedActions.length === actions.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your First Experience</h2>
            <p className="text-gray-600 mt-1">
              Let&apos;s get you started with your first poll or representative lookup.
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Progress</span>
            <span className="text-sm text-gray-600">
              {completedActions.length} of {actions.length} completed
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(completedActions.length / actions.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-4 mb-6">
          {actions.map((action) => {
            const isCompleted = completedActions.includes(action.id);
            return (
              <div
                key={action.id}
                className={`p-4 rounded-lg border-2 transition-all duration-200 ${
                  isCompleted 
                    ? 'bg-green-50 border-green-200' 
                    : action.color
                }`}
              >
                <div className="flex items-start space-x-4">
                  <div className={`p-2 rounded-lg ${
                    isCompleted ? 'bg-green-100' : 'bg-white'
                  }`}>
                    {isCompleted ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      action.icon
                    )}
                  </div>
                  <div className="flex-1">
                    <h3 className={`font-semibold text-lg ${
                      isCompleted ? 'text-green-800' : 'text-gray-900'
                    }`}>
                      {action.title}
                    </h3>
                    <p className={`text-sm ${
                      isCompleted ? 'text-green-700' : 'text-gray-600'
                    }`}>
                      {action.description}
                    </p>
                  </div>
                  <div className="flex flex-col space-y-2">
                    <a
                      href={action.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`${action.buttonColor} text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-1`}
                    >
                      <span>{action.title}</span>
                      <ArrowRight className="h-4 w-4" />
                    </a>
                    {!isCompleted && (
                      <button
                        onClick={() => handleActionComplete(action.id)}
                        className="text-xs text-gray-500 hover:text-gray-700 transition-colors"
                      >
                        Mark as completed
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Completion */}
        {allCompleted && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <span className="text-green-800 font-medium">
                Great job! You&apos;ve completed all the introductory actions.
              </span>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            Skip for now
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Close
            </button>
            {allCompleted && (
              <button
                onClick={handleComplete}
                className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
              >
                Get Started
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FirstTimeUserGuide;
