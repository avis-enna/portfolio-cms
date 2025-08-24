'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'

/**
 * Admin Root Page
 * Redirects to appropriate admin page based on authentication and setup status
 */
export default function AdminPage() {
  const router = useRouter()
  const { user, isLoading } = useAuth()

  useEffect(() => {
    if (isLoading) {
      return // Wait for auth to load
    }

    if (!user) {
      // Not authenticated, redirect to login
      router.replace('/admin/login')
      return
    }

    // Check if setup is complete by making a request to setup status
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/admin/setup/status')
        const data = await response.json()

        if (data.success && data.isConfigured) {
          // Setup is complete, redirect to dashboard
          router.replace('/admin/dashboard')
        } else {
          // Setup is not complete, redirect to setup
          router.replace('/admin/setup')
        }
      } catch (error) {
        console.error('Failed to check setup status:', error)
        // Default to setup if we can't determine status
        router.replace('/admin/setup')
      }
    }

    checkSetupStatus()
  }, [user, isLoading, router])

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Loading Admin Panel</h2>
        <p className="text-gray-600">Redirecting to the appropriate page...</p>
      </div>
    </div>
  )
}
