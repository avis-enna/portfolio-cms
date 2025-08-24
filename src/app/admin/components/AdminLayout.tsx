'use client'

import React, { useState, useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

interface AdminLayoutProps {
  children: React.ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [userInfo, setUserInfo] = useState({ username: 'admin', email: 'admin@test.com' })
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check authentication with protection against multiple redirects
    if (isRedirecting) return

    const checkAuth = async () => {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        console.log('AdminLayout: No access token found, redirecting to login')
        setIsRedirecting(true)
        // Add delay to prevent rapid redirects
        setTimeout(() => {
          router.push('/admin/login')
        }, 500)
      }
    }

    checkAuth()
  }, [router, isRedirecting])

  const handleLogout = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken }),
        })
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/admin/login')
    }
  }

  const handleLogoutAll = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken')
      if (refreshToken) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ refreshToken, logoutAll: true }),
        })
      }
    } catch (error) {
      console.error('Logout all error:', error)
    } finally {
      localStorage.removeItem('accessToken')
      localStorage.removeItem('refreshToken')
      router.push('/admin/login')
    }
  }

  const navigation = [
    {
      name: 'Dashboard',
      href: '/admin/dashboard',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
        </svg>
      ),
      testId: 'nav-dashboard'
    },
    {
      name: 'Portfolio Content',
      href: '/admin/content',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
      testId: 'nav-portfolio'
    },
    {
      name: 'Blog Posts',
      href: '/admin/blog',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
        </svg>
      ),
      testId: 'nav-blog'
    },
    {
      name: 'Contact Messages',
      href: '/admin/contact',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      testId: 'nav-contact'
    },
    {
      name: 'Media Library',
      href: '/admin/media',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      ),
      testId: 'nav-media'
    },
    {
      name: 'Analytics',
      href: '/admin/analytics',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
        </svg>
      ),
      testId: 'nav-analytics'
    },
    {
      name: 'Settings',
      href: '/admin/settings',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
      ),
      testId: 'nav-settings'
    },
    {
      name: 'API Keys',
      href: '/admin/settings/api-keys',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 10h.01" />
        </svg>
      ),
      testId: 'nav-api-keys'
    },
    {
      name: 'Content',
      href: '/admin/content',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      testId: 'nav-content'
    },
    {
      name: 'Blog',
      href: '/admin/blog',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
        </svg>
      ),
      testId: 'nav-blog-editor'
    },
    {
      name: 'Contact',
      href: '/admin/contact',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      testId: 'nav-contact'
    },
  ]

  const isActive = (href: string) => pathname === href

  return (
    <div className="min-h-screen bg-black flex">
      {/* Mobile sidebar overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        >
          <div className="fixed inset-0 bg-black bg-opacity-90"></div>
        </div>
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-gray-900 border-r border-gray-800 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:relative lg:flex lg:flex-shrink-0 ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`} data-testid="admin-sidebar">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-800">
            <div className="flex items-center">
              <span className="text-xl font-semibold text-white tracking-wide" data-testid="site-logo">
                Portfolio CMS
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              aria-label="Close sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-1">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                data-testid={item.testId}
                className={`flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(item.href)
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                <span className="mr-3">{item.icon}</span>
                {item.name}
              </Link>
            ))}
          </nav>

          {/* User info */}
          <div className="border-t border-gray-800 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {userInfo.username.charAt(0).toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white" data-testid="user-name">
                  {userInfo.username}
                </p>
                <p className="text-xs text-gray-400" data-testid="user-email">
                  {userInfo.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col lg:pl-0">
        {/* Top header */}
        <header className="bg-gray-900 border-b border-gray-800 flex-shrink-0" data-testid="admin-header">
          <div className="flex items-center justify-between h-16 px-6">
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-gray-400 hover:text-white transition-colors"
              data-testid="mobile-menu-button"
              aria-label="Open sidebar"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <button type="button" className="text-gray-400 hover:text-white transition-colors" data-testid="notifications-button" aria-label="View notifications">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM10.5 3.5a6 6 0 0 1 6 6v2l1.5 3h-15l1.5-3v-2a6 6 0 0 1 6-6z" />
                </svg>
              </button>

              {/* User menu */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center text-sm rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="user-menu"
                  aria-label="Open user menu"
                >
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-medium text-sm">
                      {userInfo.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-gray-800 border border-gray-700 rounded-md shadow-lg py-1 z-50">
                    <button
                      type="button"
                      onClick={() => router.push('/admin/settings/profile')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      data-testid="user-profile"
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      onClick={() => router.push('/admin/settings')}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      data-testid="user-settings"
                    >
                      Settings
                    </button>
                    <hr className="my-1 border-gray-700" />
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      data-testid="logout-button"
                    >
                      Sign out
                    </button>
                    <button
                      type="button"
                      onClick={handleLogoutAll}
                      className="block w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white transition-colors"
                      data-testid="logout-all-button"
                    >
                      Sign out all sessions
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 bg-black overflow-auto" data-testid="admin-main-content">
          {children}
        </main>
      </div>
    </div>
  )
}
