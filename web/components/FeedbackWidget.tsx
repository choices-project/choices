'use client'

import React, { useState, useRef, useEffect } from 'react'
import { devLog } from '@/lib/logger';
import { motion, AnimatePresence } from 'framer-motion'
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
  Send
} from 'lucide-react'

interface FeedbackData {
  type: 'bug' | 'feature' | 'general'
  title: string
  description: string
  sentiment: 'positive' | 'negative' | 'neutral'
  screenshot?: string
  userJourney: {
    page: string
    action: string
    timestamp: Date
  }
}

const FeedbackWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false)
  const [step, setStep] = useState<'closed' | 'type' | 'details' | 'sentiment' | 'screenshot' | 'success'>('closed')
  const [feedback, setFeedback] = useState<FeedbackData>({
    type: 'general',
    title: '',
    description: '',
    sentiment: 'neutral',
    userJourney: {
      page: typeof window !== 'undefined' ? window.location.pathname : '/',
      action: 'feedbackwidgetopened',
      timestamp: new Date()
    }
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [_showSuccess, setShowSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Track user journey
  useEffect(() => {
    const handlePageChange = () => {
      setFeedback(prev => ({
        ...prev,
        userJourney: {
          ...prev.userJourney,
          page: window.location.pathname,
          timestamp: new Date()
        }
      }))
    }

    window.addEventListener('popstate', handlePageChange)
    return () => window.removeEventListener('popstate', handlePageChange)
  }, [])

  const handleOpen = () => {
    setIsOpen(true)
    setStep('type')
    // Track analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', 'feedbackwidgetopened', {
        page: window.location.pathname
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
      userJourney: {
        page: typeof window !== 'undefined' ? window.location.pathname : '/',
        action: 'feedbackwidgetclosed',
        timestamp: new Date()
      }
    })
  }

  const handleTypeSelect = (type: 'bug' | 'feature' | 'general') => {
    setFeedback(prev => ({ ...prev, type }))
    setStep('details')
  }

  const handleSentimentSelect = (sentiment: 'positive' | 'negative' | 'neutral') => {
    setFeedback(prev => ({ ...prev, sentiment }))
    setStep('screenshot')
  }

  const handleScreenshotCapture = () => {
    fileInputRef.current?.click()
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
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
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(feedback),
      })

      if (response.ok) {
        setStep('success')
        setShowSuccess(true)
        
        // Track success
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'feedbacksubmitted', {
            feedbacktype: feedback.type,
            sentiment: feedback.sentiment
          })
        }

        // Auto-close after 3 seconds
        setTimeout(() => {
          handleClose()
          setShowSuccess(false)
        }, 3000)
      } else {
        throw new Error('Failed to submit feedback')
      }
    } catch (error) {
      devLog('Error submitting feedback:', error)
      // Show error message to user
    } finally {
      setIsSubmitting(false)
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'bug': return <Bug className="w-5 h-5" />
      case 'feature': return <Lightbulb className="w-5 h-5" />
      default: return <MessageCircle className="w-5 h-5" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'bug': return 'bg-red-500 hover:bg-red-600'
      case 'feature': return 'bg-blue-500 hover:bg-blue-600'
      default: return 'bg-green-500 hover:bg-green-600'
    }
  }

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 flex items-center justify-center text-white"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
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
                    <h3 className="text-lg font-semibold text-gray-900">Share Your Feedback</h3>
                    <p className="text-sm text-gray-500">Help us improve your experience</p>
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
                      <h4 className="text-lg font-medium text-gray-900">What type of feedback do you have?</h4>
                      <div className="space-y-3">
                        {[
                          { type: 'bug', label: 'Report a Bug', description: 'Something isn\'t working' },
                          { type: 'feature', label: 'Feature Request', description: 'I have an idea' },
                          { type: 'general', label: 'General Feedback', description: 'Thoughts or suggestions' }
                        ].map((option: any) => (
                          <motion.button
                            key={option.type}
                            onClick={() => handleTypeSelect(option.type as any)}
                            className="w-full p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-left group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-lg ${getTypeColor(option.type)} text-white`}>
                                {getTypeIcon(option.type)}
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 group-hover:text-blue-600">
                                  {option.label}
                                </div>
                                <div className="text-sm text-gray-500">{option.description}</div>
                              </div>
                            </div>
                          </motion.button>
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
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setStep('type')}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <h4 className="text-lg font-medium text-gray-900">Tell us more</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Title
                          </label>
                          <input
                            type="text"
                            value={feedback.title}
                            onChange={(e) => setFeedback(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Brief summary of your feedback"
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                          </label>
                          <textarea
                            value={feedback.description}
                            onChange={(e) => setFeedback(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Please provide more details..."
                            rows={4}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                          />
                        </div>
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setStep('type')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => setStep('sentiment')}
                          disabled={!feedback.title.trim() || !feedback.description.trim()}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setStep('details')}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <h4 className="text-lg font-medium text-gray-900">How do you feel about this?</h4>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { sentiment: 'positive', icon: <Smile className="w-8 h-8" />, label: 'Happy' },
                          { sentiment: 'neutral', icon: <Meh className="w-8 h-8" />, label: 'Okay' },
                          { sentiment: 'negative', icon: <Frown className="w-8 h-8" />, label: 'Frustrated' }
                        ].map((option: any) => (
                          <motion.button
                            key={option.sentiment}
                            onClick={() => handleSentimentSelect(option.sentiment as any)}
                            className="p-4 border border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all duration-200 text-center group"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <div className="space-y-2">
                              <div className="text-gray-600 group-hover:text-blue-600">
                                {option.icon}
                              </div>
                              <div className="text-sm font-medium text-gray-900">
                                {option.label}
                              </div>
                            </div>
                          </motion.button>
                        ))}
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
                      <div className="flex items-center gap-3 mb-4">
                        <button
                          onClick={() => setStep('sentiment')}
                          className="p-1 hover:bg-gray-100 rounded-lg"
                        >
                          <X className="w-4 h-4 text-gray-500" />
                        </button>
                        <h4 className="text-lg font-medium text-gray-900">Add a screenshot (optional)</h4>
                      </div>
                      
                      <div className="space-y-4">
                        <button
                          onClick={handleScreenshotCapture}
                          className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all duration-200 text-center group"
                        >
                          <Camera className="w-8 h-8 text-gray-400 group-hover:text-blue-600 mx-auto mb-2" />
                          <div className="text-gray-600 group-hover:text-blue-600">
                            Click to upload screenshot
                          </div>
                          <div className="text-sm text-gray-500">
                            PNG, JPG up to 5MB
                          </div>
                        </button>
                        
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          onChange={handleFileUpload}
                          className="hidden"
                        />

                        {feedback.screenshot && (
                          <div className="relative">
                            <img
                              src={feedback.screenshot}
                              alt="Screenshot"
                              className="w-full rounded-lg border border-gray-200"
                            />
                            <button
                              onClick={() => setFeedback(prev => ({ ...prev, screenshot: undefined }))}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-3 pt-4">
                        <button
                          onClick={() => setStep('sentiment')}
                          className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                          Back
                        </button>
                        <button
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
                        >
                          {isSubmitting ? (
                            <>
                              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Sending...
                            </>
                          ) : (
                            <>
                              <Send className="w-4 h-4" />
                              Send Feedback
                            </>
                          )}
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
                        Your feedback has been submitted successfully. We'll review it and get back to you soon!
                      </p>
                      
                      <div className="flex items-center justify-center gap-1 text-yellow-500">
                        {[1, 2, 3, 4, 5].map((star: any) => (
                          <Star key={star} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        You're helping us create something amazing!
                      </p>
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

export default FeedbackWidget
