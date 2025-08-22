'use client'

import React, { useState, useEffect, useRef, ReactNode } from 'react'
import { Skeleton } from './LoadingSkeleton'

interface LazyLoadProps {
  children: ReactNode
  fallback?: ReactNode
  rootMargin?: string
  threshold?: number
  className?: string
  height?: string | number
  once?: boolean
}

export const LazyLoad: React.FC<LazyLoadProps> = ({
  children,
  fallback,
  rootMargin = '50px',
  threshold = 0.1,
  className = '',
  height = 'auto',
  once = true,
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          if (once) {
            setHasLoaded(true)
            observer.unobserve(element)
          }
        } else if (!once) {
          setIsVisible(false)
        }
      },
      {
        rootMargin,
        threshold,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [rootMargin, threshold, once])

  const shouldRender = once ? hasLoaded || isVisible : isVisible

  return (
    <div
      ref={elementRef}
      className={className}
      style={{ height: typeof height === 'number' ? `${height}px` : height }}
    >
      {shouldRender ? children : (fallback || <Skeleton className="w-full h-full" />)}
    </div>
  )
}

interface LazyImageProps {
  src: string
  alt: string
  className?: string
  width?: number
  height?: number
  placeholder?: string
  onLoad?: () => void
  onError?: () => void
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className = '',
  width,
  height,
  placeholder,
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [isVisible, setIsVisible] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const img = imgRef.current
    if (!img) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(img)
        }
      },
      {
        rootMargin: '50px',
        threshold: 0.1,
      }
    )

    observer.observe(img)

    return () => {
      observer.unobserve(img)
    }
  }, [])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    onError?.()
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
          {placeholder || (
            <svg
              className="w-8 h-8 text-gray-400"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
      )}
      
      {hasError && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-gray-500 text-sm">Failed to load image</span>
        </div>
      )}

      <img
        ref={imgRef}
        src={isVisible ? src : ''}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={handleError}
        loading="lazy"
      />
    </div>
  )
}

interface LazyComponentProps {
  loader: () => Promise<{ default: React.ComponentType<any> }>
  fallback?: ReactNode
  errorFallback?: ReactNode
  props?: any
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  loader,
  fallback = <Skeleton className="w-full h-32" />,
  errorFallback = <div className="text-red-500">Failed to load component</div>,
  props = {},
}) => {
  const [Component, setComponent] = useState<React.ComponentType<any> | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [])

  useEffect(() => {
    if (!isVisible || Component || isLoading) return

    setIsLoading(true)
    loader()
      .then((module) => {
        setComponent(() => module.default)
        setError(null)
      })
      .catch((err) => {
        setError(err)
        console.error('Failed to load component:', err)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [isVisible, loader, Component, isLoading])

  return (
    <div ref={elementRef}>
      {error && errorFallback}
      {isLoading && fallback}
      {Component && <Component {...props} />}
      {!isVisible && !Component && !isLoading && !error && fallback}
    </div>
  )
}

// Hook for lazy loading data
export function useLazyData<T>(
  fetcher: () => Promise<T>,
  dependencies: any[] = []
) {
  const [data, setData] = useState<T | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const [isVisible, setIsVisible] = useState(false)
  const elementRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const element = elementRef.current
    if (!element) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.unobserve(element)
        }
      },
      {
        rootMargin: '100px',
        threshold: 0.1,
      }
    )

    observer.observe(element)

    return () => {
      observer.unobserve(element)
    }
  }, [])

  useEffect(() => {
    if (!isVisible || data || isLoading) return

    setIsLoading(true)
    fetcher()
      .then(setData)
      .catch(setError)
      .finally(() => setIsLoading(false))
  }, [isVisible, fetcher, data, isLoading, ...dependencies])

  return { data, isLoading, error, elementRef }
}

export default LazyLoad
