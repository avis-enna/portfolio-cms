'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Admin Root Page
 * Redirects to appropriate admin page based on setup status
 */
export default function AdminPage() {
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)

  useEffect(() => {
    // Prevent multiple redirects
    if (isRedirecting) return

    const checkSetupAndRedirect = async () => {
      setIsRedirecting(true)

      try {
        // Check if user is already authenticated
        const accessToken = localStorage.getItem('accessToken')

        if (accessToken) {
          // User is authenticated, check setup status
          const response = await fetch('/api/admin/setup/status')
          const data = await response.json()

          if (data.success && data.isConfigured) {
            // Setup is complete, redirect to dashboard
            router.replace('/admin/dashboard')
          } else {
            // Setup is not complete, redirect to setup
            router.replace('/admin/setup')
          }
        } else {
          // User is not authenticated, redirect to login
          router.replace('/admin/login')
        }
      } catch (error) {
        console.error('Failed to check setup status:', error)
        // Default to login if we can't determine status
        router.replace('/admin/login')
      }
    }

    // Small delay to prevent immediate redirect loop
    const timer = setTimeout(checkSetupAndRedirect, 500)

    return () => clearTimeout(timer)
  }, [router, isRedirecting])

  // Show loading state while determining where to redirect
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <h2 className="text-lg font-medium text-gray-900 mb-2">Loading Admin Panel</h2>
        <p className="text-gray-600">Checking setup status...</p>
      </div>
    </div>
  )
}
