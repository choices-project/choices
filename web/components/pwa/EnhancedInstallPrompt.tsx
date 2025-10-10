/**
 * Enhanced PWA Install Prompt
 * 
 * Beautiful, engaging install prompt with:
 * - Animated illustrations
 * - Platform-specific instructions
 * - Smart timing and user engagement
 * - Accessibility features
 * - Analytics tracking
 * 
 * Created: October 9, 2025
 * Updated: October 9, 2025
 */

'use client';

import React, { useState, useEffect } from 'react';
import { X, Download, Smartphone, Monitor, Sparkles, Zap, Shield, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePWA } from '@/hooks/usePWA';
import { logger } from '@/lib/logger';
import { analyticsEngine } from '@/lib/analytics/AnalyticsEngine';

type EnhancedInstallPromptProps = {
  onInstall?: () => void;
  onDismiss?: () => void;
  variant?: 'default' | 'minimal' | 'detailed';
  showBenefits?: boolean;
  showPlatformInstructions?: boolean;
}

export default function EnhancedInstallPrompt({
  onInstall,
  onDismiss,
  variant = 'default',
  showBenefits = true,
  showPlatformInstructions = true
}: EnhancedInstallPromptProps) {
  const { promptInstallation, isSupported, installation } = usePWA();
  const [isVisible, setIsVisible] = useState(false);
  const [platform, setPlatform] = useState<string>('unknown');
  const [userEngagement, setUserEngagement] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);

  // Detect platform
  useEffect(() => {
    const userAgent = navigator.userAgent;
    if (/iPhone|iPad|iPod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/Android/.test(userAgent)) {
      setPlatform('android');
    } else if (/Chrome/.test(userAgent)) {
      setPlatform('chrome');
    } else if (/Safari/.test(userAgent)) {
      setPlatform('safari');
    } else if (/Firefox/.test(userAgent)) {
      setPlatform('firefox');
    } else {
      setPlatform('other');
    }
  }, []);

  // Track user engagement
  useEffect(() => {
    const trackEngagement = () => {
      setUserEngagement(prev => Math.min(prev + 1, 10));
    };

    // Track clicks, scrolls, and time on page
    document.addEventListener('click', trackEngagement);
    document.addEventListener('scroll', trackEngagement);
    
    // Time-based engagement
    const engagementTimer = setInterval(() => {
      setUserEngagement(prev => Math.min(prev + 0.1, 10));
    }, 10000); // +0.1 every 10 seconds

    return () => {
      document.removeEventListener('click', trackEngagement);
      document.removeEventListener('scroll', trackEngagement);
      clearInterval(engagementTimer);
    };
  }, []);

  // Show prompt based on engagement and timing
  useEffect(() => {
    if (!isSupported || installation.isInstalled) return;

    // Check if user has dismissed before
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    const dismissTime = dismissed ? parseInt(dismissed) : 0;
    const timeSinceDismiss = Date.now() - dismissTime;
    
    // Don't show if dismissed within last 24 hours
    if (timeSinceDismiss < 24 * 60 * 60 * 1000) return;

    // Show based on engagement level
    const shouldShow = userEngagement >= 3 || (userEngagement >= 1 && Date.now() - performance.now() > 30000);
    
    if (shouldShow) {
      setIsVisible(true);
      setIsAnimating(true);
      
      // Track prompt shown
      analyticsEngine.track({
        type: 'pwa_install_prompt_shown',
        category: 'pwa',
        action: 'prompt_displayed',
        properties: {
          platform,
          userEngagement,
          variant
        }
      });
    }
  }, [isSupported, installation.isInstalled, userEngagement, platform, variant]);

  const handleInstall = async () => {
    try {
      setIsAnimating(true);
      
      const result = await promptInstallation();
      
      if (result.outcome === 'accepted') {
        // Track successful installation
        analyticsEngine.track({
          type: 'pwa_install_accepted',
          category: 'pwa',
          action: 'install_accepted',
          properties: {
            platform,
            userEngagement,
            variant
          }
        });
        
        onInstall?.();
      } else {
        // Track dismissal
        analyticsEngine.track({
          type: 'pwa_install_dismissed',
          category: 'pwa',
          action: 'install_dismissed',
          properties: {
            platform,
            userEngagement,
            variant
          }
        });
      }
    } catch (error) {
      logger.error('PWA: Install prompt failed:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  const handleDismiss = () => {
    // Store dismissal timestamp
    localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    
    // Track dismissal
    analyticsEngine.track({
      type: 'pwa_install_dismissed',
      category: 'pwa',
      action: 'install_dismissed',
      properties: {
        platform,
        userEngagement,
        variant
      }
    });
    
    setIsVisible(false);
    onDismiss?.();
  };

  const getPlatformInstructions = () => {
    switch (platform) {
      case 'ios':
        return {
          icon: <Smartphone className="w-5 h-5" />,
          title: 'Add to Home Screen',
          steps: [
            'Tap the Share button',
            'Scroll down and tap "Add to Home Screen"',
            'Tap "Add" to install'
          ]
        };
      case 'android':
        return {
          icon: <Download className="w-5 h-5" />,
          title: 'Install App',
          steps: [
            'Tap the menu (⋮) in your browser',
            'Select "Add to Home screen"',
            'Tap "Add" to install'
          ]
        };
      case 'chrome':
        return {
          icon: <Download className="w-5 h-5" />,
          title: 'Install App',
          steps: [
            'Click the install icon in the address bar',
            'Or click the three dots menu',
            'Select "Install Choices"'
          ]
        };
      default:
        return {
          icon: <Monitor className="w-5 h-5" />,
          title: 'Install App',
          steps: [
            'Look for the install button in your browser',
            'Or add to bookmarks for quick access',
            'Enjoy the app-like experience'
          ]
        };
    }
  };

  const benefits = [
    {
      icon: <Zap className="w-4 h-4 text-yellow-500" />,
      title: 'Lightning Fast',
      description: 'Instant loading and smooth performance'
    },
    {
      icon: <Shield className="w-4 h-4 text-green-500" />,
      title: 'Secure & Private',
      description: 'Your data stays safe and private'
    },
    {
      icon: <Clock className="w-4 h-4 text-blue-500" />,
      title: 'Works Offline',
      description: 'Vote even without internet connection'
    }
  ];

  if (!isVisible) return null;

  const platformInstructions = getPlatformInstructions();

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all duration-300 ${
      isAnimating ? 'animate-in fade-in zoom-in-95' : ''
    }`}>
      <Card className={`w-full max-w-md mx-auto transform transition-all duration-300 ${
        isAnimating ? 'animate-in slide-in-from-bottom-4' : ''
      }`}>
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Sparkles className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Install Choices</h3>
                <p className="text-sm text-gray-500">Get the full app experience</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Benefits */}
          {showBenefits && (
            <div className="mb-6">
              <div className="grid grid-cols-1 gap-3">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                    {benefit.icon}
                    <div>
                      <p className="font-medium text-sm text-gray-900">{benefit.title}</p>
                      <p className="text-xs text-gray-600">{benefit.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Platform Instructions */}
          {showPlatformInstructions && (
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-3">
                {platformInstructions.icon}
                <h4 className="font-medium text-blue-900">{platformInstructions.title}</h4>
              </div>
              <ol className="space-y-2">
                {platformInstructions.steps.map((step, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-blue-800">
                    <span className="flex-shrink-0 w-5 h-5 bg-blue-200 rounded-full flex items-center justify-center text-xs font-medium text-blue-700">
                      {index + 1}
                    </span>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              onClick={handleInstall}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
              disabled={isAnimating}
            >
              {isAnimating ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Installing...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4" />
                  Install Now
                </div>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={handleDismiss}
              className="px-4"
            >
              Later
            </Button>
          </div>

          {/* Engagement Badge */}
          {userEngagement >= 5 && (
            <div className="mt-4 flex justify-center">
              <Badge variant="secondary" className="text-xs">
                 🎉 You&apos;re really engaged! This app is perfect for you
              </Badge>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
