'use client';

import { Shield, MapPin, Users, BarChart3, Eye } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useCallback } from 'react';

type DataUsageExplanationProps = {
  className?: string;
}

const DataUsageExplanation: React.FC<DataUsageExplanationProps> = ({ className = '' }) => {
  const router = useRouter();
  const handleUpdatePrivacy = useCallback(() => {
    router.push('/account/privacy');
  }, [router]);

  const dataUsageItems = [
    {
      icon: <MapPin className="h-5 w-5 text-green-600" />,
      title: "Find Your Representatives",
      description: "Location data helps us show you who represents you in government.",
      benefit: "Essential for civic engagement",
      required: true
    },
    {
      icon: <Users className="h-5 w-5 text-primary" />,
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
    <div className={`bg-card rounded-lg border border-border p-6 ${className}`}>
      <div className="flex items-center space-x-3 mb-6">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-foreground">How We Use Your Data</h3>
          <p className="text-sm text-muted-foreground">Transparency is key. Here&apos;s exactly how we use your information:</p>
        </div>
      </div>

      <div className="space-y-4">
        {dataUsageItems.map((item, index) => (
          <div key={index} className="flex items-start space-x-3 p-4 bg-muted rounded-lg">
            <div className="flex-shrink-0 mt-1">
              {item.icon}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-2 mb-1">
                <h4 className="font-semibold text-foreground">{item.title}</h4>
                {item.required && (
                  <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 text-xs rounded-full">
                    Required
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-sm mb-2">{item.description}</p>
              <p className="text-green-700 dark:text-green-400 text-sm font-medium">{item.benefit}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
        <div className="flex items-start space-x-3">
          <Eye className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold text-primary mb-1">Your Privacy Rights</h4>
            <p className="text-primary text-sm mb-2">
              You have full control over your data. You can:
            </p>
            <ul className="text-primary text-sm space-y-1">
              <li>• View and download your data anytime</li>
              <li>• Delete your account and all associated data</li>
              <li>• Opt out of non-essential data collection</li>
              <li>• Update your privacy preferences</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Questions about your data? <Link href="/privacy" className="text-primary hover:text-primary/90">Read our privacy policy</Link>
        </p>
        <button
          onClick={handleUpdatePrivacy}
          className="text-sm text-primary hover:text-primary/90 font-medium"
        >
          Update Privacy Settings
        </button>
      </div>
    </div>
  );
};

export default DataUsageExplanation;
