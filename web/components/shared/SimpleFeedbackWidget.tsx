'use client'

import { 
  MessageCircle, 
  X, 
  Bug, 
  Lightbulb, 
  Camera, 
  CheckCircle,
  Star,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  Zap,
  Shield,
  Accessibility,
  Upload
} from 'lucide-react'
import React, { useState, useRef } from 'react'

// Simple feedback widget without analytics store to prevent infinite loops
type FeedbackData = {
  type: 'bug' | 'feature' | 'general' | 'performance' | 'accessibility' | 'security'
  title: string
  description: string
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  screenshot?: string
}

const SimpleFeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'closed' | 'type' | 'details' | 'sentiment' | 'screenshot' | 'success'>('closed')
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'general',
    title: '',
    description: '',
    sentiment: 'neutral'
  })
  const [showSuccess, setShowSuccess] = useState(false)
  const [capturingScreenshot, setCapturingScreenshot] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleOpen = () => {
    setIsOpen(true)
    setStep('type')
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep('closed')
    setFeedback({
      type: 'general',
      title: '',
      description: '',
      sentiment: 'neutral'
    })
  }

  const handleTypeSelect = (type: FeedbackData['type']) => {
    setFeedback(prev => ({ ...prev, type }))
    setStep('details')
  }

  const handleSentimentSelect = (sentiment: FeedbackData['sentiment']) => {
    setFeedback(prev => ({ ...prev, sentiment }))
    setStep('screenshot')
  }

  const handleScreenshotCapture = async () => {
    setCapturingScreenshot(true)
    try {
      // Simple screenshot capture - just set a placeholder
      setFeedback(prev => ({ ...prev, screenshot: 'data:image/png;base64,placeholder' }))
    } catch (error) {
      console.error('Failed to capture screenshot:', error)
    } finally {
      setCapturingScreenshot(false)
    }
    setStep('success')
  }

  const handleFileUpload = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setFeedback(prev => ({ 
          ...prev,
          screenshot: e.target?.result as string 
        }))
      }
      reader.readAsDataURL(file)
    }
  }

  const handleSubmit = async () => {
    if (isLoading) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      })

      const result = await response.json()

      if (result.success) {
        setShowSuccess(true)
        setStep('success')
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose()
          setShowSuccess(false)
        }, 3000)
      } else {
        throw new Error(result.error || 'Failed to submit feedback')
      }
    } catch (error) {
      console.error('Error submitting feedback:', error)
      setShowSuccess(false)
      setStep('sentiment')
      setError(error instanceof Error ? error.message : 'Failed to submit feedback')
    } finally {
      setIsLoading(false)
    }
  }

  const feedbackTypes = [
    { key: 'bug', label: 'Bug Report', icon: Bug, color: 'text-red-600', bgColor: 'bg-red-100' },
    { key: 'feature', label: 'Feature Request', icon: Lightbulb, color: 'text-blue-600', bgColor: 'bg-blue-100' },
    { key: 'performance', label: 'Performance', icon: Zap, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
    { key: 'accessibility', label: 'Accessibility', icon: Accessibility, color: 'text-purple-600', bgColor: 'bg-purple-100' },
    { key: 'security', label: 'Security', icon: Shield, color: 'text-green-600', bgColor: 'bg-green-100' },
    { key: 'general', label: 'General', icon: MessageCircle, color: 'text-gray-600', bgColor: 'bg-gray-100' }
  ]

  const sentimentOptions = [
    { key: 'positive', label: 'Positive', icon: Smile, color: 'text-green-600', bgColor: 'bg-green-100' },
    { key: 'neutral', label: 'Neutral', icon: Meh, color: 'text-gray-600', bgColor: 'bg-gray-100' },
    { key: 'negative', label: 'Negative', icon: Frown, color: 'text-red-600', bgColor: 'bg-red-100' },
    { key: 'mixed', label: 'Mixed', icon: AlertTriangle, color: 'text-yellow-600', bgColor: 'bg-yellow-100' }
  ]

  return (
    <>
      {/* Floating Feedback Button */}
      <button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Feedback Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
          onClick={handleClose}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <MessageCircle className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Feedback</h3>
                  <p className="text-sm text-gray-500">Help us improve</p>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {step === 'type' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">What type of feedback?</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {feedbackTypes.map(({ key, label, icon: Icon, color, bgColor }) => (
                      <button
                        key={key}
                        onClick={() => handleTypeSelect(key as FeedbackData['type'])}
                        className={`p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all ${bgColor}`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 'details' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Tell us more</h4>
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="Brief title"
                      value={feedback.title}
                      onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <textarea
                      placeholder="Detailed description..."
                      value={feedback.description}
                      onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    />
                  </div>
                  <div className="flex justify-end">
                    <button
                      onClick={() => setStep('sentiment')}
                      disabled={!feedback.title.trim() || !feedback.description.trim()}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}

              {step === 'sentiment' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">How do you feel?</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {sentimentOptions.map(({ key, label, icon: Icon, color, bgColor }) => (
                      <button
                        key={key}
                        onClick={() => handleSentimentSelect(key as FeedbackData['sentiment'])}
                        className={`p-4 rounded-lg border-2 border-transparent hover:border-blue-300 transition-all ${bgColor}`}
                      >
                        <Icon className={`w-6 h-6 mx-auto mb-2 ${color}`} />
                        <span className="text-sm font-medium text-gray-700">{label}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                    <button
                      onClick={() => setStep('screenshot')}
                      className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                    >
                      Add Screenshot
                    </button>
                  </div>
                </div>
              )}

              {step === 'screenshot' && (
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-gray-900">Add a screenshot?</h4>
                  <p className="text-sm text-gray-600">This helps us understand the context better</p>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleScreenshotCapture}
                      disabled={capturingScreenshot}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <Camera className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">
                        {capturingScreenshot ? 'Capturing...' : 'Capture Screenshot'}
                      </span>
                    </button>
                    
                    <button
                      onClick={handleFileUpload}
                      className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 transition-colors"
                    >
                      <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                      <span className="text-sm text-gray-600">Upload Screenshot</span>
                    </button>
                    
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    
                    <button
                      onClick={handleSubmit}
                      disabled={isLoading}
                      className="w-full p-3 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                    >
                      {isLoading ? 'Submitting...' : 'Submit Feedback'}
                    </button>
                  </div>
                </div>
              )}

              {step === 'success' && (
                <div className="text-center py-8">
                  {showSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex items-center justify-center gap-2 text-green-700">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm font-medium">Feedback submitted successfully!</span>
                      </div>
                    </div>
                  )}
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-green-600" />
                  </div>
                  
                  <h4 className="text-xl font-semibold text-gray-900 mb-2">
                    Thank You! 🎉
                  </h4>
                  <p className="text-gray-600 mb-4">
                    Your feedback has been submitted. We'll analyze it and get back to you soon!
                  </p>
                  
                  <div className="flex items-center justify-center gap-1 text-yellow-500">
                    {[1, 2, 3, 4, 5].map((star: any) => (
                      <Star key={star} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                  <p className="text-sm text-gray-500 mt-2">
                    Your feedback helps us create something amazing!
                  </p>
                  
                  <button
                    onClick={handleClose}
                    className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default SimpleFeedbackWidget
