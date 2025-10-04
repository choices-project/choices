'use client';

import React, { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

type PlatformTourProps = {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const PlatformTour: React.FC<PlatformTourProps> = ({ isOpen, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const tourSteps = [
    {
      title: "Vote on Polls",
      description: "Participate in polls about current issues and see how your views compare to others.",
      icon: "🗳️",
      color: "bg-blue-50",
      buttonColor: "bg-blue-600 hover:bg-blue-700"
    },
    {
      title: "Find Representatives", 
      description: "Discover who represents you and track their voting records.",
      icon: "👥",
      color: "bg-green-50",
      buttonColor: "bg-green-600 hover:bg-green-700"
    },
    {
      title: "Campaign Finance",
      description: "See who's funding campaigns and understand the money in politics.",
      icon: "📊", 
      color: "bg-purple-50",
      buttonColor: "bg-purple-600 hover:bg-purple-700"
    },
    {
      title: "Track Progress",
      description: "Monitor how your representatives vote on issues you care about.",
      icon: "📈",
      color: "bg-orange-50", 
      buttonColor: "bg-orange-600 hover:bg-orange-700"
    }
  ];

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete?.();
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const currentTourStep = tourSteps[currentStep];
  if (!currentTourStep) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center space-x-2">
            <span className="text-2xl">{currentTourStep.icon}</span>
            <h2 className="text-xl font-bold text-gray-900">Platform Tour</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Progress Indicator */}
        <div className="flex space-x-2 mb-6">
          {tourSteps.map((_, index) => (
            <div
              key={index}
              className={`h-2 flex-1 rounded-full transition-colors ${
                index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        {/* Content */}
        <div className={`${currentTourStep.color} rounded-lg p-6 mb-6`}>
          <h3 className="font-semibold text-lg mb-2">{currentTourStep.title}</h3>
          <p className="text-gray-600 text-sm">{currentTourStep.description}</p>
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <div className="flex space-x-2">
            {currentStep > 0 && (
              <button
                onClick={handlePrevious}
                className="flex items-center space-x-1 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous</span>
              </button>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={handleSkip}
              className="px-4 py-2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              Skip Tour
            </button>
            <button
              onClick={handleNext}
              className={`${currentTourStep.buttonColor} text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center space-x-1`}
            >
              <span>{currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}</span>
              {currentStep < tourSteps.length - 1 && <ChevronRight className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlatformTour;
