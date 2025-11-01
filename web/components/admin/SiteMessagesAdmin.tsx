'use client'

import { 
  AlertCircle, 
  Info, 
  CheckCircle, 
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Calendar,
  Clock
} from 'lucide-react'
import React, { useState, useEffect } from 'react'

import { devLog } from '@/lib/utils/logger'

type SiteMessage = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'feedback'
  priority: 'low' | 'medium' | 'high' | 'critical'
  created_at: string
  updated_at: string
  expires_at?: string
  is_active: boolean
}

type SiteMessagesAdminProps = {
  className?: string
}

export default function SiteMessagesAdmin({
  className = ''
}: SiteMessagesAdminProps) {
  const [messages, setMessages] = useState<SiteMessage[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingMessage, setEditingMessage] = useState<SiteMessage | null>(null)
  const [newMessage, setNewMessage] = useState<Partial<SiteMessage>>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    is_active: true
  })

  // Load messages on mount
  useEffect(() => {
    loadMessages()
  }, [])

  const loadMessages = async () => {
    try {
      setIsLoading(true)
      // In a real implementation, this would fetch from an API
      // For now, we'll use mock data
      const mockMessages: SiteMessage[] = [
        {
          id: '1',
          title: 'Welcome to Choices!',
          message: 'Thank you for joining our platform. We are excited to have you here!',
          type: 'success',
          priority: 'medium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        },
        {
          id: '2',
          title: 'System Maintenance',
          message: 'We will be performing scheduled maintenance on Sunday at 2 AM EST.',
          type: 'warning',
          priority: 'high',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          is_active: true
        }
      ]
      setMessages(mockMessages)
    } catch (error) {
      devLog('Error loading messages:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateMessage = async () => {
    try {
      const message: SiteMessage = {
        id: Date.now().toString(),
        title: newMessage.title || '',
        message: newMessage.message || '',
        type: newMessage.type || 'info',
        priority: newMessage.priority || 'medium',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: newMessage.is_active || true,
        expires_at: newMessage.expires_at
      }
      
      setMessages(prev => [...prev, message])
      setNewMessage({
        title: '',
        message: '',
        type: 'info',
        priority: 'medium',
        is_active: true
      })
      setShowCreateForm(false)
    } catch (error) {
      devLog('Error creating message:', error)
    }
  }

  const handleUpdateMessage = async (message: SiteMessage) => {
    try {
      setMessages(prev => prev.map(m => 
        m.id === message.id 
          ? { ...message, updated_at: new Date().toISOString() }
          : m
      ))
      setEditingMessage(null)
    } catch (error) {
      devLog('Error updating message:', error)
    }
  }

  const handleDeleteMessage = async (id: string) => {
    try {
      setMessages(prev => prev.filter(m => m.id !== id))
    } catch (error) {
      devLog('Error deleting message:', error)
    }
  }

  const handleToggleActive = async (id: string) => {
    try {
      setMessages(prev => prev.map(m => 
        m.id === id 
          ? { ...m, is_active: !m.is_active, updated_at: new Date().toISOString() }
          : m
      ))
    } catch (error) {
      devLog('Error toggling message status:', error)
    }
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    )
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Site Messages</h2>
          <p className="text-gray-600">Manage site-wide messages and announcements</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          New Message
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Create New Message</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                value={newMessage.title}
                onChange={(e) => setNewMessage(prev => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Message title"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
              <textarea
                value={newMessage.message}
                onChange={(e) => setNewMessage(prev => ({ ...prev, message: e.target.value }))}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Message content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  value={newMessage.type}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, type: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="success">Success</option>
                  <option value="error">Error</option>
                  <option value="feedback">Feedback</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={newMessage.priority}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, priority: e.target.value as any }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={newMessage.is_active}
                  onChange={(e) => setNewMessage(prev => ({ ...prev, is_active: e.target.checked }))}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Active</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
                <input
                  type="datetime-local"
                  value={newMessage.expires_at ? new Date(newMessage.expires_at).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setNewMessage(prev => ({ 
                    ...prev, 
                    expires_at: e.target.value ? new Date(e.target.value).toISOString() : undefined 
                  }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateMessage}
                disabled={!newMessage.title || !newMessage.message}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Messages List */}
      <div className="space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`p-4 rounded-lg border ${getTypeColor(message.type)} ${!message.is_active ? 'opacity-50' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3 flex-1">
                <div className="flex-shrink-0 mt-0.5">
                  {getTypeIcon(message.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-sm font-medium leading-5">
                      {message.title}
                    </h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                    {!message.is_active && (
                      <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                        Inactive
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-5 mb-2">
                    {message.message}
                  </p>
                  <div className="flex items-center gap-4 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(message.created_at).toLocaleDateString()}
                    </span>
                    {message.expires_at && (
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Expires: {new Date(message.expires_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => setEditingMessage(message)}
                  className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Edit message"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(message.id)}
                  className={`p-1 transition-colors ${message.is_active ? 'text-green-400 hover:text-green-600' : 'text-gray-400 hover:text-gray-600'}`}
                  title={message.is_active ? 'Deactivate message' : 'Activate message'}
                >
                  <CheckCircle className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteMessage(message.id)}
                  className="p-1 text-red-400 hover:text-red-600 transition-colors"
                  title="Delete message"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {messages.length === 0 && (
        <div className="text-center py-8">
          <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-600 mb-4">Create your first site message to get started.</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Message
          </button>
        </div>
      )}
    </div>
  )
}
