'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useToast } from '@/components/Toast'

export type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

interface UseAutoSaveOptions<T> {
  data: T
  saveFunction: (data: T) => Promise<void>
  delay?: number
  enabled?: boolean
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

interface UseAutoSaveReturn {
  saveStatus: SaveStatus
  lastSaved: Date | null
  forceSave: () => Promise<void>
  saveIndicator: React.ReactNode
}

export function useAutoSave<T>({
  data,
  saveFunction,
  delay = 2000,
  enabled = true,
  onSaveSuccess,
  onSaveError
}: UseAutoSaveOptions<T>): UseAutoSaveReturn {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const timeoutRef = useRef<NodeJS.Timeout>()
  const lastDataRef = useRef<T>(data)
  const { success, error } = useToast()

  const performSave = useCallback(async () => {
    if (!enabled) return

    try {
      setSaveStatus('saving')
      await saveFunction(data)
      setSaveStatus('saved')
      setLastSaved(new Date())
      onSaveSuccess?.()
      
      // Show success toast
      success('Changes saved', 'Your changes have been automatically saved.')
      
      // Reset to idle after showing saved state
      setTimeout(() => setSaveStatus('idle'), 2000)
    } catch (err) {
      setSaveStatus('error')
      const errorObj = err instanceof Error ? err : new Error('Save failed')
      onSaveError?.(errorObj)
      
      // Show error toast with retry option
      error('Save failed', 'Failed to save changes. Click to retry.')
      
      // Reset to idle after showing error state
      setTimeout(() => setSaveStatus('idle'), 3000)
    }
  }, [data, saveFunction, enabled, onSaveSuccess, onSaveError, success, error])

  const forceSave = useCallback(async () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    await performSave()
  }, [performSave])

  // Auto-save effect
  useEffect(() => {
    if (!enabled) return

    // Check if data has actually changed
    const hasChanged = JSON.stringify(data) !== JSON.stringify(lastDataRef.current)
    if (!hasChanged) return

    lastDataRef.current = data

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set new timeout for auto-save
    timeoutRef.current = setTimeout(() => {
      performSave()
    }, delay)

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [data, delay, enabled, performSave])

  // Save indicator component
  const saveIndicator = (
    <div className="flex items-center gap-2 text-sm">
      {saveStatus === 'saving' && (
        <>
          <svg className="animate-spin w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-blue-600">Saving...</span>
        </>
      )}
      {saveStatus === 'saved' && (
        <>
          <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <span className="text-green-600">Saved</span>
          {lastSaved && (
            <span className="text-gray-500">
              at {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </>
      )}
      {saveStatus === 'error' && (
        <>
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <span className="text-red-600">Save failed</span>
          <button
            onClick={forceSave}
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Retry
          </button>
        </>
      )}
    </div>
  )

  return {
    saveStatus,
    lastSaved,
    forceSave,
    saveIndicator
  }
}

// Utility hook for form auto-save
export function useFormAutoSave<T extends Record<string, any>>(
  formData: T,
  saveEndpoint: string,
  options?: Partial<UseAutoSaveOptions<T>>
) {
  const saveFunction = useCallback(async (data: T) => {
    const response = await fetch(saveEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      throw new Error(`Save failed: ${response.statusText}`)
    }
  }, [saveEndpoint])

  return useAutoSave({
    data: formData,
    saveFunction,
    ...options
  })
}
