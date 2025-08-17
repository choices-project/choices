'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Play, BarChart3, Share2 } from 'lucide-react'

export default function TestSPAPage() {
  const router = useRouter()
  const [currentView, setCurrentView] = useState<'demo' | 'results' | 'share'>('demo')

  const views = [
    { id: 'demo', label: 'Demo', icon: Play },
    { id: 'results', label: 'Results', icon: BarChart3 },
    { id: 'share', label: 'Share', icon: Share2 }
  ]

  const renderView = () => {
    switch (currentView) {
      case 'demo':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">SPA Demo</h2>
            <p className="text-gray-600 mb-6">
              This demonstrates the Single Page Application functionality. 
              The content changes without page reloads!
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-blue-900 mb-2">Features:</h3>
              <ul className="text-sm text-blue-800 space-y-1 text-left">
                <li>• Dynamic component swapping</li>
                <li>• No page reloads</li>
                <li>• Smooth transitions</li>
                <li>• State preservation</li>
                <li>• Fast navigation</li>
              </ul>
            </div>
          </div>
        )
      case 'results':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Results View</h2>
            <p className="text-gray-600 mb-6">
              This would show poll results with charts and analytics.
            </p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-green-900 mb-2">Results Features:</h3>
              <ul className="text-sm text-green-800 space-y-1 text-left">
                <li>• Real-time vote counts</li>
                <li>• Interactive charts</li>
                <li>• Demographic breakdowns</li>
                <li>• Trend analysis</li>
                <li>• Export capabilities</li>
              </ul>
            </div>
          </div>
        )
      case 'share':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Share View</h2>
            <p className="text-gray-600 mb-6">
              This would show sharing options and social media integration.
            </p>
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-6 max-w-md mx-auto">
              <h3 className="font-semibold text-purple-900 mb-2">Sharing Features:</h3>
              <ul className="text-sm text-purple-800 space-y-1 text-left">
                <li>• Social media sharing</li>
                <li>• QR code generation</li>
                <li>• Embed codes</li>
                <li>• Direct links</li>
                <li>• Analytics tracking</li>
              </ul>
            </div>
          </div>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/polls')}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Polls</span>
              </button>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">SPA Demo</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Demo Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Single Page Application Demo</h1>
              <p className="text-gray-600 text-lg">
                Experience the power of dynamic component swapping without page reloads!
              </p>
              
              {/* Demo Badge */}
              <div className="mt-4 flex items-center space-x-2">
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                  🚀 SPA Demo
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  ⚡ No Page Reloads
                </span>
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="border-t border-gray-200 pt-4">
            <nav className="flex space-x-8">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id as any)}
                  className={`
                    flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors
                    ${currentView === view.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }
                  `}
                >
                  <view.icon className="w-4 h-4" />
                  <span>{view.label}</span>
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Dynamic Content Area */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {renderView()}
        </div>
      </main>
    </div>
  )
}
