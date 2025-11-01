'use client';

import { Shield, MapPin, Users, BarChart3, Eye } from 'lucide-react';
import React from 'react';

type DataUsageExplanationProps = {
  className?: string;
}

const DataUsageExplanation: React.FC<DataUsageExplanationProps> = ({ className = '' }) => {
  const dataUsageItems = [
    {
      icon: <MapPin className="h-5 w-5 text-green-600" />,
      title: "Find Your Representatives",
      description: "Location data helps us show you who represents you in government.",
      benefit: "Essential for civic engagement",
      required: true
    },
    {
      icon: <Users className="h-5 w-5 text-blue-600" />,
      title: "Personalize Your Experience", 
      description: "Demographics help us show you relevant polls and content.",
      benefit: "Better content recommendations",
      required: false
    },
    {
      icon: <BarChart3 className="h-5 w-5 text-purple-600" />,
      title: "Improve Our Platform",
      description: "Anonymous usage data helps us make the platform better for everyone.",
      benefit: "Continuous platform improvements",
      required: false
    }
  ];

  return (
    <div className={`bg-white rounded-lg border border-gray-200 p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Shield className="h-6 w-6 text-blue-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">How We Use Your Data</h3>
          <p className="text-sm text-gray-600">Transparency is key. Here&apos;s exactly how we use your information:</p>
        </div>
      </div>

      <div className="space-y-4">
        {dataUsageItems.map((item, index) => (
          <div key={index} className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg">
            <div className="flex-shrink-0 mt-1">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-gray-900">{item.title}</h4>
                {item.required && (
                  <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded-full">
                    Required
                  </span>
                )}
              </div>
              <p className="text-gray-600 text-sm mb-2">{item.description}</p>
              <p className="text-green-700 text-sm font-medium">{item.benefit}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-start space-x-3">
          <Eye className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-semibold text-blue-900 mb-1">Your Privacy Rights</h4>
            <p className="text-blue-800 text-sm mb-2">
              You have full control over your data. You can:
            </p>
            <ul className="text-blue-800 text-sm space-y-1">
              <li>• View and download your data anytime</li>
              <li>• Delete your account and all associated data</li>
              <li>• Opt out of non-essential data collection</li>
              <li>• Update your privacy preferences</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Questions about your data? <a href="/privacy" className="text-blue-600 hover:text-blue-800">Read our privacy policy</a>
        </p>
        <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
          Update Privacy Settings
        </button>
      </div>
    </div>
  );
};

export default DataUsageExplanation;
