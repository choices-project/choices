'use client'

import React, { useState, useRef, useEffect } from 'react'
import { devLog } from '@/lib/logger'
import { getFeedbackTracker, FeedbackContext } from '@/lib/feedback-tracker'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  MessageCircle, 
  X, 
  Bug, 
  Lightbulb, 
  Heart, 
  Camera, 
  Send,
  CheckCircle,
  Star,
  Smile,
  Frown,
  Meh,
  AlertTriangle,
  Zap,
  Shield,
  Accessibility,
  TrendingUp
} from 'lucide-react'

interface FeedbackData {
  type: 'bug' | 'feature' | 'general' | 'performance' | 'accessibility' | 'security'
  title: string
  description: string
  sentiment: 'positive' | 'negative' | 'neutral' | 'mixed'
  screenshot?: string
  userJourney: any
}

const EnhancedFeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'closed' | 'type' | 'details' | 'sentiment' | 'screenshot' | 'success'>('closed')
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'general',
    title: '',
    description: '',
    sentiment: 'neutral',
    userJourney: {}
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showSuccess, setShowSuccess] = useState(false)
  const [capturingScreenshot, setCapturingScreenshot] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const feedbackTracker = getFeedbackTracker()

  // Track user journey on mount
  useEffect(() => {
    const userJourney = feedbackTracker.captureUserJourney()
    setFeedback(prev => ({
      ...prev,
      userJourney
    }))
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setStep('type')
    
    // Update user journey when widget opens
    const userJourney = feedbackTracker.captureUserJourney()
    setFeedback(prev => ({
      ...prev,
      userJourney
    }))
    
    // Track analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'feedback_widget_opened', {
        page: window.location.pathname,
        session_id: userJourney.sessionId
      })
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setStep('closed')
    setFeedback({
      type: 'general',
      title: '',
      description: '',
      sentiment: 'neutral',
      userJourney: {}
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
      const screenshot = await feedbackTracker.captureScreenshot()
      setFeedback(prev => ({ ...prev, screenshot }))
    } catch (error) {
      devLog('Failed to capture screenshot:', error)
    } finally {
      setCapturingScreenshot(false)
    }
    setStep('success')
  }

  const handleSubmit = async () => {
    if (isSubmitting) return // Prevent double submission
    
    setIsSubmitting(true)
    
    try {
      // Generate comprehensive feedback context
      const feedbackContext = feedbackTracker.generateFeedbackContext(
        feedback.type,
        feedback.title,
        feedback.description,
        feedback.sentiment
      )

      // Update with current user journey
      const currentUserJourney = feedbackTracker.captureUserJourney()
      feedbackContext.userJourney = currentUserJourney

      // Submit to API
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: feedback.type,
          title: feedback.title,
          description: feedback.description,
          sentiment: feedback.sentiment,
          screenshot: feedback.screenshot,
          userJourney: currentUserJourney,
          feedbackContext // Include the full context for AI analysis
        }),
      })

      const result = await response.json()

      if (result.success) {
        setShowSuccess(true)
        setStep('success')
        
        // Track successful submission
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'feedback_submitted', {
            feedback_type: feedback.type,
            sentiment: feedback.sentiment,
            page: currentUserJourney.currentPage
          })
        }

        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose()
          setShowSuccess(false)
        }, 3000)
      } else {
        throw new Error(result.error || 'Failed to submit feedback')
      }
    } catch (error) {
      devLog('Error submitting feedback:', error)
      // Ensure we don't show success state if there was an error
      setShowSuccess(false)
      setStep('sentiment') // Go back to previous step
      
      // More user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Failed to submit feedback'
      alert(`Feedback submission failed: ${errorMessage}. Please try again.`)
    } finally {
      setIsSubmitting(false)
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
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 p-4 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition-colors"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 2 }}
      >
        <MessageCircle className="w-6 h-6" />
      </motion.button>

      {/* Feedback Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          >
            <motion.div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-hidden"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <MessageCircle className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Enhanced Feedback</h3>
                    <p className="text-sm text-gray-500">Help us improve with detailed context</p>
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
                <AnimatePresence mode="wait">
                  {step === 'type' && (
                    <motion.div
                      key="type"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h4 className="text-lg font-semibold text-gray-900">What type of feedback?</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {feedbackTypes.map(({ key: any, label: any, icon: Icon, color: any, bgColor }: any) => (
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
                    </motion.div>
                  )}

                  {step === 'details' && (
                    <motion.div
                      key="details"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
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
                    </motion.div>
                  )}

                  {step === 'sentiment' && (
                    <motion.div
                      key="sentiment"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
                      <h4 className="text-lg font-semibold text-gray-900">How do you feel?</h4>
                      <div className="grid grid-cols-2 gap-3">
                        {sentimentOptions.map(({ key: any, label: any, icon: Icon, color: any, bgColor }: any) => (
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
                          disabled={isSubmitting}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                        <button
                          onClick={() => setStep('screenshot')}
                          className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
                        >
                          Add Screenshot
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'screenshot' && (
                    <motion.div
                      key="screenshot"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      className="space-y-4"
                    >
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
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="w-full p-3 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50"
                        >
                          {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {step === 'success' && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-8"
                    >
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                        className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4"
                      >
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </motion.div>
                      
                      <h4 className="text-xl font-semibold text-gray-900 mb-2">
                        Thank You! 🎉
                      </h4>
                      <p className="text-gray-600 mb-4">
                        Your detailed feedback has been captured with full context. We'll analyze it and get back to you soon!
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
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default EnhancedFeedbackWidget
