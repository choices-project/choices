'use client'

import { 
  AlertCircle, 
  Info, 
  CheckCircle, 
  MessageSquare, 
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import React, { useState } from 'react'


type SiteMessage = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'feedback'
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  updated_at: string
  expires_at?: string
}

type SiteMessagesProps = {
  className?: string
  maxMessages?: number
  showDismiss?: boolean
  messages?: SiteMessage[] // Messages should be passed as props from server-side rendering
}

export default function SiteMessages({
  className = '',
  maxMessages = 3,
  showDismiss = true,
  messages: propMessages = [] // Messages passed from server-side rendering
}: SiteMessagesProps) {
  const [messages, setMessages] = useState<SiteMessage[]>(propMessages)
  const [dismissedMessages, setDismissedMessages] = useState<Set<string>>(new Set())
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set())

  // Initialize messages from props (server-side rendering) - no useEffect needed
  // Messages are already set in useState initial value

  // No longer needed - messages are passed as props from server-side rendering

  const handleDismiss = (messageId: string) => {
    setDismissedMessages(prev => new Set([...prev, messageId]))
    
    // Store dismissal in localStorage for persistence
    const stored = JSON.parse(localStorage.getItem('dismissedSiteMessages') || '[]')
    stored.push(messageId)
    localStorage.setItem('dismissedSiteMessages', JSON.stringify(stored))
  }

  const handleToggleExpand = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev)
      if (newSet.has(messageId)) {
        newSet.delete(messageId)
      } else {
        newSet.add(messageId)
      }
      return newSet
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4" />
      case 'warning': return <AlertCircle className="h-4 w-4" />
      case 'success': return <CheckCircle className="h-4 w-4" />
      case 'error': return <AlertCircle className="h-4 w-4" />
      case 'feedback': return <MessageSquare className="h-4 w-4" />
      default: return <Info className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800'
      case 'warning': return 'bg-yellow-50 border-yellow-200 text-yellow-800'
      case 'success': return 'bg-green-50 border-green-200 text-green-800'
      case 'error': return 'bg-red-50 border-red-200 text-red-800'
      case 'feedback': return 'bg-purple-50 border-purple-200 text-purple-800'
      default: return 'bg-gray-50 border-gray-200 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  // Filter out dismissed messages and expired messages
  const activeMessages = messages
    .filter(message => !dismissedMessages.has(message.id))
    .filter(message => {
      if (!message.expires_at) return true
      return new Date(message.expires_at) > new Date()
    })
    .slice(0, maxMessages)

  // No loading state needed - messages are passed as props

  if (activeMessages.length === 0) {
    return null
  }

  return (
    <div className={`space-y-3 ${className}`}>
      {activeMessages.map((message) => {
        const isExpanded = expandedMessages.has(message.id)
        const isLongMessage = message.message.length > 150
        
        return (
          <div
            key={message.id}
            className={`relative p-4 rounded-lg border ${getTypeColor(message.type)} transition-all duration-200`}
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 mt-0.5">
                {getTypeIcon(message.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between">
                  <h3 className="text-sm font-medium leading-5">
                    {message.title}
                  </h3>
                  
                  <div className="flex items-center space-x-2 ml-2">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                    
                    {showDismiss && (
                      <button
                        onClick={() => handleDismiss(message.id)}
                        className="flex-shrink-0 p-1 text-gray-400 hover:text-gray-600 transition-colors"
                        aria-label="Dismiss message"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="mt-2">
                  <p className={`text-sm leading-5 ${isLongMessage && !isExpanded ? 'line-clamp-2' : ''}`}>
                    {message.message}
                  </p>
                  
                  {isLongMessage && (
                    <button
                      onClick={() => handleToggleExpand(message.id)}
                      className="mt-2 text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors flex items-center space-x-1"
                    >
                      {isExpanded ? (
                        <>
                          <ChevronUp className="h-3 w-3" />
                          <span>Show less</span>
                        </>
                      ) : (
                        <>
                          <ChevronDown className="h-3 w-3" />
                          <span>Show more</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
                
                <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
                  <span>
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                  
                  {message.expires_at && (
                    <span>
                      Expires: {new Date(message.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// Utility function to trigger site message refresh when new messages are posted
export const triggerSiteMessageRefresh = () => {
  window.dispatchEvent(new CustomEvent('newSiteMessage'))
}

