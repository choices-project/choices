'use client'

import React, { useState, useEffect } from 'react'
import { logger } from '@/lib/utils/logger';
import { withOptional } from '@/lib/utils/objects';
import { 
  MessageSquare, 
  Plus, 
  Edit, 
  Trash2, 
  AlertCircle,
  Info,
  CheckCircle,
  Clock,
  Save,
  X,
  Smartphone,
  Monitor
} from 'lucide-react'

type SiteMessage = {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'feedback'
  priority: 'low' | 'medium' | 'high' | 'critical'
  is_active: boolean
  expires_at?: string
  created_at: string
  updated_at: string
}

type MessageFormData = {
  title: string
  message: string
  type: 'info' | 'warning' | 'success' | 'error' | 'feedback'
  priority: 'low' | 'medium' | 'high' | 'critical'
  isActive: boolean
  expiresAt?: string
}

export default function SiteMessagesPage() {
  const [messages, setMessages] = useState<SiteMessage[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingMessage, setEditingMessage] = useState<SiteMessage | null>(null)
  const [formData, setFormData] = useState<MessageFormData>({
    title: '',
    message: '',
    type: 'info',
    priority: 'medium',
    isActive: true
  })
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile')

  useEffect(() => {
    fetchMessages()
  }, [])

  const fetchMessages = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/admin/site-messages?includeInactive=true', {
        headers: {
          'Content-Type': 'application/json'
        }
      })

      if (response.ok) {
        const data = await response.json()
        setMessages(data.messages || [])
      } else {
        logger.error('Failed to fetch messages:', new Error(`HTTP ${response.status}`))
      }
    } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error fetching messages:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      const url = editingMessage 
        ? '/api/admin/site-messages'
        : '/api/admin/site-messages'
      
      const method = editingMessage ? 'PUT' : 'POST'
      const body = editingMessage 
        ? withOptional({ id: editingMessage.id }, formData)
        : formData

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      })

      if (response.ok) {
        await fetchMessages()
        resetForm()
        setShowForm(false)
      } else {
        logger.error('Failed to save message:', new Error(`HTTP ${response.status}`))
      }
    } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error saving message:', err)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return

    try {
      const response = await fetch(`/api/admin/site-messages?id=${id}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        await fetchMessages()
      } else {
        logger.error('Failed to delete message:', new Error(`HTTP ${response.status}`))
      }
    } catch (error) {
      // narrow 'unknown' → Error
      const err = error instanceof Error ? error : new Error(String(error));
      logger.error('Error deleting message:', err)
    }
  }

  const handleEdit = (message: SiteMessage) => {
    setEditingMessage(message)
    setFormData({
      title: message.title,
      message: message.message,
      type: message.type,
      priority: message.priority,
      isActive: message.is_active,
      expiresAt: message.expires_at || ''
    })
    setShowForm(true)
  }

  const resetForm = () => {
    setFormData({
      title: '',
      message: '',
      type: 'info',
      priority: 'medium',
      isActive: true
    })
    setEditingMessage(null)
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
      case 'info': return 'bg-blue-100 text-blue-800'
      case 'warning': return 'bg-yellow-100 text-yellow-800'
      case 'success': return 'bg-green-100 text-green-800'
      case 'error': return 'bg-red-100 text-red-800'
      case 'feedback': return 'bg-purple-100 text-purple-800'
      default: return 'bg-gray-100 text-gray-800'
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

  const renderPreview = () => {
    const activeMessages = messages.filter(m => m.is_active)
    
    return (
      <div className={`border rounded-lg p-4 ${previewMode === 'mobile' ? 'max-w-sm mx-auto' : 'w-full'}`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900">Preview ({previewMode})</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setPreviewMode('mobile')}
              className={`p-2 rounded ${previewMode === 'mobile' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <Smartphone className="h-4 w-4" />
            </button>
            <button
              onClick={() => setPreviewMode('desktop')}
              className={`p-2 rounded ${previewMode === 'desktop' ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-600'}`}
            >
              <Monitor className="h-4 w-4" />
            </button>
          </div>
        </div>
        
        {activeMessages.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No active messages to display
          </div>
        ) : (
          <div className="space-y-3">
            {activeMessages.map((message) => (
              <div
                key={message.id}
                className={`p-3 rounded-lg border ${getTypeColor(message.type)}`}
              >
                <div className="flex items-start space-x-2">
                  {getTypeIcon(message.type)}
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{message.title}</h4>
                    <p className="text-sm mt-1">{message.message}</p>
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(message.priority)}`}>
                        {message.priority}
                      </span>
                      {message.expires_at && (
                        <span className="flex items-center text-xs text-gray-600">
                          <Clock className="h-3 w-3 mr-1" />
                          Expires: {new Date(message.expires_at).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Site Messages</h1>
              <p className="text-gray-600 mt-1">Manage site-wide announcements and feedback requests</p>
            </div>
            <button
              onClick={() => {
                resetForm()
                setShowForm(true)
              }}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>New Message</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Message List */}
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b">
              <h2 className="text-lg font-semibold text-gray-900">All Messages</h2>
              <p className="text-sm text-gray-600 mt-1">
                {messages.length} total, {messages.filter(m => m.is_active).length} active
              </p>
            </div>
            
            <div className="divide-y">
              {messages.map((message) => (
                <div key={message.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        {getTypeIcon(message.type)}
                        <h3 className="font-medium text-gray-900">{message.title}</h3>
                        {!message.is_active && (
                          <span className="text-xs text-gray-500">(inactive)</span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{message.message}</p>
                      <div className="flex items-center space-x-2">
                        <span className={`px-2 py-1 text-xs rounded ${getTypeColor(message.type)}`}>
                          {message.type}
                        </span>
                        <span className={`px-2 py-1 text-xs rounded ${getPriorityColor(message.priority)}`}>
                          {message.priority}
                        </span>
                        {message.expires_at && (
                          <span className="text-xs text-gray-500">
                            Expires: {new Date(message.expires_at).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEdit(message)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="bg-white rounded-lg shadow-sm border">
            {renderPreview()}
          </div>
        </div>

        {/* Message Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {editingMessage ? 'Edit Message' : 'New Message'}
                  </h2>
                  <button
                    onClick={() => setShowForm(false)}
                    className="p-2 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => setFormData(withOptional(formData, { title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(withOptional(formData, { message: e.target.value }))}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={formData.type}
                        onChange={(e) => setFormData(withOptional(formData, { type: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="info">Info</option>
                        <option value="warning">Warning</option>
                        <option value="success">Success</option>
                        <option value="error">Error</option>
                        <option value="feedback">Feedback Request</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={formData.priority}
                        onChange={(e) => setFormData(withOptional(formData, { priority: e.target.value as any }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expires At (Optional)
                    </label>
                    <input
                      type="datetime-local"
                      value={formData.expiresAt || ''}
                      onChange={(e) => setFormData(withOptional(formData, { expiresAt: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={(e) => setFormData(withOptional(formData, { isActive: e.target.checked }))}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                      Active
                    </label>
                  </div>

                  <div className="flex space-x-3 pt-4">
                    <button
                      type="submit"
                      className="flex-1 flex items-center justify-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
                    >
                      <Save className="h-4 w-4" />
                      <span>{editingMessage ? 'Update' : 'Create'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="flex-1 bg-gray-200 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-300 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

