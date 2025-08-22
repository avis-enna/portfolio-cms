'use client'

import React, { useState } from 'react'
import { Button } from '@/components/Button'
import { useToast } from '@/components/Toast'

interface LinkedInShareProps {
  type: 'portfolio' | 'project' | 'blog' | 'custom'
  content?: {
    title?: string
    description?: string
    excerpt?: string
    url?: string
    text?: string
  }
  customMessage?: string
  visibility?: 'PUBLIC' | 'CONNECTIONS'
  includePortfolioUrl?: boolean
  onShareSuccess?: (shareData: any) => void
  onShareError?: (error: string) => void
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary' | 'outline'
  showIcon?: boolean
  children?: React.ReactNode
}

export const LinkedInShare: React.FC<LinkedInShareProps> = ({
  type,
  content,
  customMessage,
  visibility = 'PUBLIC',
  includePortfolioUrl = true,
  onShareSuccess,
  onShareError,
  className = '',
  size = 'md',
  variant = 'primary',
  showIcon = true,
  children
}) => {
  const [isSharing, setIsSharing] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [shareMessage, setShareMessage] = useState(customMessage || '')
  const [shareVisibility, setShareVisibility] = useState<'PUBLIC' | 'CONNECTIONS'>(visibility)
  const [includeUrl, setIncludeUrl] = useState(includePortfolioUrl)
  const { showToast } = useToast()

  const getDefaultMessage = () => {
    switch (type) {
      case 'portfolio':
        return '🚀 Just updated my portfolio! Check out my latest work and projects.'
      case 'project':
        return content?.title 
          ? `🎯 Excited to share my latest project: ${content.title}! ${content.description || ''}`
          : '🎯 Excited to share my latest project!'
      case 'blog':
        return content?.title
          ? `📝 New blog post: ${content.title}! ${content.excerpt || ''}`
          : '📝 New blog post is live!'
      case 'custom':
        return content?.text || 'Check out my latest update!'
      default:
        return 'Check out my latest update!'
    }
  }

  const shareToLinkedIn = async (message?: string, useModal = false) => {
    try {
      setIsSharing(true)
      const accessToken = localStorage.getItem('accessToken')
      
      if (!accessToken) {
        showToast('Please log in to share to LinkedIn', 'error')
        onShareError?.('Authentication required')
        return
      }

      const shareData = {
        type,
        content,
        customMessage: message || shareMessage || getDefaultMessage(),
        visibility: shareVisibility,
        includePortfolioUrl: includeUrl
      }

      const response = await fetch('/api/linkedin/share', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(shareData),
      })

      const result = await response.json()

      if (result.success) {
        showToast('Successfully shared to LinkedIn!', 'success')
        onShareSuccess?.(result.data)
        if (useModal) {
          setShowModal(false)
          setShareMessage('')
        }
      } else {
        const errorMessage = result.error || 'Failed to share to LinkedIn'
        showToast(errorMessage, 'error')
        onShareError?.(errorMessage)

        // Handle specific error cases
        if (result.code === 'auth_failed') {
          showToast('LinkedIn connection expired. Please reconnect your account.', 'error')
        }
      }
    } catch (error) {
      console.error('LinkedIn share error:', error)
      const errorMessage = 'Failed to share to LinkedIn. Please try again.'
      showToast(errorMessage, 'error')
      onShareError?.(errorMessage)
    } finally {
      setIsSharing(false)
    }
  }

  const handleQuickShare = () => {
    shareToLinkedIn(getDefaultMessage())
  }

  const handleCustomShare = () => {
    setShareMessage(customMessage || getDefaultMessage())
    setShowModal(true)
  }

  const handleModalShare = () => {
    if (!shareMessage.trim()) {
      showToast('Please enter a message to share', 'error')
      return
    }
    shareToLinkedIn(shareMessage, true)
  }

  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'px-3 py-1.5 text-sm'
      case 'lg':
        return 'px-6 py-3 text-lg'
      case 'md':
      default:
        return 'px-4 py-2 text-base'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'secondary':
        return 'bg-gray-600 hover:bg-gray-700 text-white'
      case 'outline':
        return 'border border-blue-600 text-blue-600 hover:bg-blue-50'
      case 'primary':
      default:
        return 'bg-blue-600 hover:bg-blue-700 text-white'
    }
  }

  const LinkedInIcon = () => (
    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  )

  return (
    <>
      {children ? (
        <div onClick={handleCustomShare} className={`cursor-pointer ${className}`}>
          {children}
        </div>
      ) : (
        <div className={`flex items-center space-x-2 ${className}`}>
          <Button
            onClick={handleQuickShare}
            loading={isSharing}
            disabled={isSharing}
            className={`${getSizeClasses()} ${getVariantClasses()} flex items-center space-x-2`}
            data-testid="linkedin-quick-share"
          >
            {showIcon && <LinkedInIcon />}
            <span>{isSharing ? 'Sharing...' : 'Share to LinkedIn'}</span>
          </Button>
          
          <Button
            onClick={handleCustomShare}
            variant="outline"
            size={size}
            className="text-gray-600 border-gray-300 hover:bg-gray-50"
            data-testid="linkedin-custom-share"
          >
            Customize
          </Button>
        </div>
      )}

      {/* Custom Share Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" data-testid="linkedin-share-modal">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="flex items-center justify-between p-6 border-b">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center mr-3">
                  <LinkedInIcon />
                </div>
                <h3 className="text-lg font-medium text-gray-900">Share to LinkedIn</h3>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
                data-testid="close-modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={shareMessage}
                  onChange={(e) => setShareMessage(e.target.value)}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What would you like to share?"
                  maxLength={3000}
                  data-testid="share-message-input"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {shareMessage.length}/3000 characters
                </p>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Visibility
                </label>
                <select
                  value={shareVisibility}
                  onChange={(e) => setShareVisibility(e.target.value as 'PUBLIC' | 'CONNECTIONS')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="share-visibility-select"
                >
                  <option value="PUBLIC">Public</option>
                  <option value="CONNECTIONS">Connections only</option>
                </select>
              </div>

              {(type === 'portfolio' || content?.url) && (
                <div className="mb-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={includeUrl}
                      onChange={(e) => setIncludeUrl(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      data-testid="include-url-checkbox"
                    />
                    <span className="ml-2 text-sm text-gray-700">
                      Include link to {type === 'portfolio' ? 'portfolio' : 'content'}
                    </span>
                  </label>
                </div>
              )}

              {content && (
                <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm font-medium text-gray-700">Content Preview:</p>
                  {content.title && (
                    <p className="text-sm text-gray-900 font-medium mt-1">{content.title}</p>
                  )}
                  {(content.description || content.excerpt) && (
                    <p className="text-sm text-gray-600 mt-1">
                      {content.description || content.excerpt}
                    </p>
                  )}
                  {content.url && includeUrl && (
                    <p className="text-xs text-blue-600 mt-1">{content.url}</p>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end space-x-3 p-6 border-t bg-gray-50">
              <Button
                onClick={() => setShowModal(false)}
                variant="outline"
                className="text-gray-600 border-gray-300 hover:bg-gray-100"
                data-testid="cancel-share"
              >
                Cancel
              </Button>
              <Button
                onClick={handleModalShare}
                loading={isSharing}
                disabled={isSharing || !shareMessage.trim()}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="confirm-share"
              >
                {isSharing ? 'Sharing...' : 'Share to LinkedIn'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
