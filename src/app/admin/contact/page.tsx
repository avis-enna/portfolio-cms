'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '@/components/Toast'

interface ContactSubmission {
  id: string
  name: string
  email: string
  message: string
  status: 'new' | 'read' | 'replied'
  createdAt: string
}

export default function ContactManagement() {
  const [contacts, setContacts] = useState<ContactSubmission[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedContact, setSelectedContact] = useState<ContactSubmission | null>(null)
  const [filter, setFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all')
  const router = useRouter()
  const { success, error } = useToast()

  useEffect(() => {
    loadContacts()
  }, [filter])

  useEffect(() => {
    // Check authentication on mount
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      router.push('/admin/login')
    }
  }, [])

  const loadContacts = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/admin/login')
        return
      }

      const response = await fetch(`/api/admin/contacts?filter=${filter}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          setContacts(data.data.contacts)
        } else {
          error('Failed to load contacts', data.error)
        }
      } else if (response.status === 401) {
        router.push('/admin/login')
      } else {
        error('Failed to load contacts', 'Server error occurred')
      }
    } catch (err) {
      console.error('Error loading contacts:', err)
      error('Failed to load contacts', 'Network error occurred')
    } finally {
      setIsLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const baseClasses = 'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium'
    
    switch (status) {
      case 'new':
        return `${baseClasses} bg-blue-100 text-blue-800`
      case 'read':
        return `${baseClasses} bg-yellow-100 text-yellow-800`
      case 'replied':
        return `${baseClasses} bg-green-100 text-green-800`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`
    }
  }

  const updateStatus = async (contactId: string, newStatus: ContactSubmission['status']) => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/admin/login')
        return
      }

      const response = await fetch('/api/admin/contacts', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contactId,
          status: newStatus
        })
      })

      if (response.ok) {
        const data = await response.json()
        if (data.success) {
          // Update local state
          setContacts(prev => prev.map(contact =>
            contact.id === contactId ? { ...contact, status: newStatus } : contact
          ))
          success('Contact status updated successfully')
        } else {
          error('Failed to update contact status', data.error)
        }
      } else if (response.status === 401) {
        router.push('/admin/login')
      } else {
        error('Failed to update contact status', 'Server error occurred')
      }
    } catch (err) {
      console.error('Error updating contact status:', err)
      error('Failed to update contact status', 'Network error occurred')
    }
  }

  const filteredContacts = contacts.filter(contact => 
    filter === 'all' || contact.status === filter
  )

  const getFilterCount = (status: 'all' | 'new' | 'read' | 'replied') => {
    if (status === 'all') return contacts.length
    return contacts.filter(c => c.status === status).length
  }

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </AdminLayout>
    )
  }

  return (
    <AdminLayout>
      <div className="space-y-6" data-testid="contact-management">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Submissions</h1>
          <p className="text-gray-600">Manage and respond to contact form submissions</p>
        </div>

        {/* Filters */}
        <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(['all', 'new', 'read', 'replied'] as const).map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setFilter(status)}
              className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                filter === status
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({getFilterCount(status)})
            </button>
          ))}
        </div>

        {/* Contacts List */}
        <div className="bg-white rounded-lg shadow">
          {filteredContacts.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <div
                  key={contact.id}
                  className={`p-6 hover:bg-gray-50 cursor-pointer ${
                    selectedContact?.id === contact.id ? 'bg-blue-50' : ''
                  }`}
                  onClick={() => setSelectedContact(contact)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <h3 className="text-sm font-medium text-gray-900">{contact.name}</h3>
                        <span className={getStatusBadge(contact.status)}>
                          {contact.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{contact.email}</p>
                      <p className="text-sm text-gray-700 mt-2 line-clamp-2">{contact.message}</p>
                    </div>
                    <div className="flex flex-col items-end space-y-2">
                      <span className="text-xs text-gray-500">{formatDate(contact.createdAt)}</span>
                      <div className="flex space-x-1">
                        {contact.status === 'new' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateStatus(contact.id, 'read')
                            }}
                            className="text-xs text-blue-600 hover:text-blue-800"
                          >
                            Mark Read
                          </button>
                        )}
                        {contact.status !== 'replied' && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              updateStatus(contact.id, 'replied')
                            }}
                            className="text-xs text-green-600 hover:text-green-800"
                          >
                            Mark Replied
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No contact submissions</h3>
              <p className="text-gray-600">Contact submissions will appear here when visitors use your contact form.</p>
            </div>
          )}
        </div>

        {/* Contact Detail Modal */}
        {selectedContact && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-medium text-gray-900">{selectedContact.name}</h2>
                    <p className="text-sm text-gray-600">{selectedContact.email}</p>
                    <p className="text-xs text-gray-500 mt-1">{formatDate(selectedContact.createdAt)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={getStatusBadge(selectedContact.status)}>
                      {selectedContact.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => setSelectedContact(null)}
                      className="text-gray-400 hover:text-gray-600"
                      aria-label="Close contact details"
                    >
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>

                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Message</h3>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedContact.message}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      window.location.href = `mailto:${selectedContact.email}?subject=Re: Your message&body=Hi ${selectedContact.name},%0D%0A%0D%0AThank you for your message.%0D%0A%0D%0ABest regards`
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
                  >
                    Reply via Email
                  </button>
                  {selectedContact.status !== 'replied' && (
                    <button
                      type="button"
                      onClick={() => {
                        updateStatus(selectedContact.id, 'replied')
                        setSelectedContact(null)
                      }}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium"
                    >
                      Mark as Replied
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-md flex items-center justify-center">
                  <span className="text-blue-600 text-lg">📧</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Submissions</p>
                <p className="text-2xl font-semibold text-gray-900">{contacts.length}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-yellow-100 rounded-md flex items-center justify-center">
                  <span className="text-yellow-600 text-lg">👁️</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Unread</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter(c => c.status === 'new').length}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-md flex items-center justify-center">
                  <span className="text-green-600 text-lg">✅</span>
                </div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Replied</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {contacts.filter(c => c.status === 'replied').length}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  )
}
