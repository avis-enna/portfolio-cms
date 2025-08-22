'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import AdminLayout from '../components/AdminLayout'
import { useToast } from '@/components/Toast'
import { Button } from '@/components/Button'

interface MediaFile {
  id: string
  filename: string
  originalName: string
  mimeType: string
  size: number
  url: string
  uploadedAt: string
  tags: string[]
  alt?: string
  description?: string
}

interface MediaUploadResponse {
  success: boolean
  data?: {
    file: MediaFile
  }
  error?: string
}

export default function MediaLibrary() {
  const [mediaFiles, setMediaFiles] = useState<MediaFile[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isUploading, setIsUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'images' | 'documents' | 'videos'>('all')
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'size'>('date')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const router = useRouter()
  const { showToast } = useToast()

  useEffect(() => {
    // Check authentication
    const accessToken = localStorage.getItem('accessToken')
    if (!accessToken) {
      router.push('/admin/login')
      return
    }

    loadMediaFiles()
  }, [router])

  const loadMediaFiles = async () => {
    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/admin/login')
        return
      }

      const response = await fetch('/api/admin/media', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        if (response.status === 401) {
          router.push('/admin/login')
          return
        }
        throw new Error('Failed to fetch media files')
      }

      const result = await response.json()
      if (result.success) {
        setMediaFiles(result.data.files || [])
      } else {
        showToast('Failed to load media files', 'error')
      }
    } catch (error) {
      console.error('Error loading media files:', error)
      showToast('Failed to load media files', 'error')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsUploading(true)

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/admin/login')
        return
      }

      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append('file', file)

        const response = await fetch('/api/admin/media/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
          body: formData,
        })

        const result: MediaUploadResponse = await response.json()

        if (result.success && result.data) {
          setMediaFiles(prev => [result.data!.file, ...prev])
          showToast(`${file.name} uploaded successfully`, 'success')
        } else {
          showToast(`Failed to upload ${file.name}: ${result.error}`, 'error')
        }
      }
    } catch (error) {
      console.error('Error uploading files:', error)
      showToast('Failed to upload files', 'error')
    } finally {
      setIsUploading(false)
      // Reset file input
      event.target.value = ''
    }
  }

  const deleteSelectedFiles = async () => {
    if (selectedFiles.size === 0) return

    try {
      const accessToken = localStorage.getItem('accessToken')
      if (!accessToken) {
        router.push('/admin/login')
        return
      }

      const fileIds = Array.from(selectedFiles)
      
      for (const fileId of fileIds) {
        const response = await fetch(`/api/admin/media/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
          },
        })

        if (response.ok) {
          setMediaFiles(prev => prev.filter(file => file.id !== fileId))
        }
      }

      setSelectedFiles(new Set())
      showToast(`${fileIds.length} file(s) deleted successfully`, 'success')
    } catch (error) {
      console.error('Error deleting files:', error)
      showToast('Failed to delete files', 'error')
    }
  }

  const copyToClipboard = (url: string) => {
    navigator.clipboard.writeText(url)
    showToast('URL copied to clipboard', 'success')
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) {
      return '🖼️'
    } else if (mimeType.startsWith('video/')) {
      return '🎥'
    } else if (mimeType.includes('pdf')) {
      return '📄'
    } else if (mimeType.includes('document') || mimeType.includes('word')) {
      return '📝'
    } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
      return '📊'
    } else {
      return '📁'
    }
  }

  const filteredFiles = mediaFiles
    .filter(file => {
      // Search filter
      if (searchTerm && !file.originalName.toLowerCase().includes(searchTerm.toLowerCase())) {
        return false
      }

      // Type filter
      if (filterType !== 'all') {
        switch (filterType) {
          case 'images':
            return file.mimeType.startsWith('image/')
          case 'videos':
            return file.mimeType.startsWith('video/')
          case 'documents':
            return file.mimeType.includes('pdf') || file.mimeType.includes('document') || file.mimeType.includes('word')
          default:
            return true
        }
      }

      return true
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.originalName.localeCompare(b.originalName)
        case 'size':
          return b.size - a.size
        case 'date':
        default:
          return new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
      }
    })

  const toggleFileSelection = (fileId: string) => {
    const newSelected = new Set(selectedFiles)
    if (newSelected.has(fileId)) {
      newSelected.delete(fileId)
    } else {
      newSelected.add(fileId)
    }
    setSelectedFiles(newSelected)
  }

  const selectAllFiles = () => {
    if (selectedFiles.size === filteredFiles.length) {
      setSelectedFiles(new Set())
    } else {
      setSelectedFiles(new Set(filteredFiles.map(file => file.id)))
    }
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
      <div className="space-y-6" data-testid="media-library">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Media Library</h1>
            <p className="text-gray-600">Manage your portfolio images, documents, and media files</p>
          </div>
          
          <div className="flex items-center gap-3">
            {selectedFiles.size > 0 && (
              <Button
                onClick={deleteSelectedFiles}
                variant="outline"
                className="text-red-600 border-red-300 hover:bg-red-50"
                data-testid="delete-selected"
              >
                Delete Selected ({selectedFiles.size})
              </Button>
            )}
            
            <label className="cursor-pointer">
              <input
                type="file"
                multiple
                accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isUploading}
                data-testid="file-upload-input"
              />
              <Button
                as="span"
                loading={isUploading}
                disabled={isUploading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                data-testid="upload-button"
              >
                {isUploading ? 'Uploading...' : 'Upload Files'}
              </Button>
            </label>
          </div>
        </div>

        {/* Filters and Controls */}
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  data-testid="search-input"
                />
                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>

              {/* Type Filter */}
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="type-filter"
              >
                <option value="all">All Types</option>
                <option value="images">Images</option>
                <option value="videos">Videos</option>
                <option value="documents">Documents</option>
              </select>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                data-testid="sort-select"
              >
                <option value="date">Sort by Date</option>
                <option value="name">Sort by Name</option>
                <option value="size">Sort by Size</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              {/* Select All */}
              <Button
                onClick={selectAllFiles}
                variant="outline"
                size="sm"
                data-testid="select-all"
              >
                {selectedFiles.size === filteredFiles.length ? 'Deselect All' : 'Select All'}
              </Button>

              {/* View Mode Toggle */}
              <div className="flex border border-gray-300 rounded-md">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 py-2 text-sm ${viewMode === 'grid' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  data-testid="grid-view"
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 py-2 text-sm border-l border-gray-300 ${viewMode === 'list' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50'}`}
                  data-testid="list-view"
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* File Count */}
        <div className="text-sm text-gray-600">
          Showing {filteredFiles.length} of {mediaFiles.length} files
        </div>

        {/* Media Grid/List */}
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-lg shadow">
            <div className="text-gray-400 text-6xl mb-4">📁</div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No files found</h3>
            <p className="text-gray-600 mb-6">
              {mediaFiles.length === 0 
                ? "Upload your first file to get started" 
                : "Try adjusting your search or filter criteria"
              }
            </p>
            {mediaFiles.length === 0 && (
              <label className="cursor-pointer">
                <input
                  type="file"
                  multiple
                  accept="image/*,video/*,.pdf,.doc,.docx,.txt"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  as="span"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Upload Your First File
                </Button>
              </label>
            )}
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4" data-testid="media-grid">
            {filteredFiles.map((file) => (
              <div
                key={file.id}
                className={`relative bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer ${
                  selectedFiles.has(file.id) ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => toggleFileSelection(file.id)}
                data-testid={`media-item-${file.id}`}
              >
                <div className="aspect-square p-4 flex items-center justify-center">
                  {file.mimeType.startsWith('image/') ? (
                    <img
                      src={file.url}
                      alt={file.alt || file.originalName}
                      className="w-full h-full object-cover rounded"
                    />
                  ) : (
                    <div className="text-4xl">{getFileIcon(file.mimeType)}</div>
                  )}
                </div>
                
                <div className="p-3 border-t">
                  <p className="text-sm font-medium text-gray-900 truncate" title={file.originalName}>
                    {file.originalName}
                  </p>
                  <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
                </div>

                {/* Selection checkbox */}
                <div className="absolute top-2 left-2">
                  <input
                    type="checkbox"
                    checked={selectedFiles.has(file.id)}
                    onChange={() => toggleFileSelection(file.id)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                {/* Copy URL button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    copyToClipboard(file.url)
                  }}
                  className="absolute top-2 right-2 p-1 bg-white bg-opacity-80 rounded hover:bg-opacity-100 transition-opacity"
                  title="Copy URL"
                >
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden" data-testid="media-list">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={selectedFiles.size === filteredFiles.length && filteredFiles.length > 0}
                      onChange={selectAllFiles}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className={selectedFiles.has(file.id) ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedFiles.has(file.id)}
                        onChange={() => toggleFileSelection(file.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {file.mimeType.startsWith('image/') ? (
                            <img
                              src={file.url}
                              alt={file.alt || file.originalName}
                              className="h-10 w-10 object-cover rounded"
                            />
                          ) : (
                            <div className="h-10 w-10 flex items-center justify-center text-2xl">
                              {getFileIcon(file.mimeType)}
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{file.originalName}</div>
                          <div className="text-sm text-gray-500">{file.filename}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {file.mimeType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(file.uploadedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => copyToClipboard(file.url)}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                      >
                        Copy URL
                      </button>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-900"
                      >
                        View
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AdminLayout>
  )
}
