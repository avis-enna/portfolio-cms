/**
 * Performance monitoring utilities for the Portfolio CMS
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  type: 'render' | 'api' | 'navigation' | 'bundle';
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private observers: PerformanceObserver[] = [];

  constructor() {
    if (typeof window !== 'undefined') {
      this.initializeObservers();
    }
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      const navObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming;
            this.recordMetric('page-load', navEntry.loadEventEnd - navEntry.fetchStart, 'navigation');
            this.recordMetric('dom-content-loaded', navEntry.domContentLoadedEventEnd - navEntry.fetchStart, 'navigation');
            this.recordMetric('first-paint', navEntry.loadEventEnd - navEntry.fetchStart, 'navigation');
          }
        }
      });

      try {
        navObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navObserver);
      } catch (e) {
        console.warn('Navigation timing observer not supported');
      }

      // Observe resource timing for API calls
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name.includes('/api/')) {
            this.recordMetric(
              `api-${entry.name.split('/api/')[1]}`,
              entry.duration,
              'api'
            );
          }
        }
      });

      try {
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);
      } catch (e) {
        console.warn('Resource timing observer not supported');
      }

      // Observe largest contentful paint
      const lcpObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('largest-contentful-paint', entry.startTime, 'render');
        }
      });

      try {
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observer not supported');
      }

      // Observe first input delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          this.recordMetric('first-input-delay', entry.processingStart - entry.startTime, 'render');
        }
      });

      try {
        fidObserver.observe({ entryTypes: ['first-input'] });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observer not supported');
      }
    }
  }

  recordMetric(name: string, value: number, type: PerformanceMetric['type']) {
    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      type,
    };

    this.metrics.push(metric);

    // Keep only last 100 metrics to prevent memory leaks
    if (this.metrics.length > 100) {
      this.metrics = this.metrics.slice(-100);
    }

    // Log slow operations in development
    if (process.env.NODE_ENV === 'development') {
      if (type === 'api' && value > 1000) {
        console.warn(`Slow API call detected: ${name} took ${value.toFixed(2)}ms`);
      }
      if (type === 'render' && value > 16) {
        console.warn(`Slow render detected: ${name} took ${value.toFixed(2)}ms`);
      }
    }
  }

  getMetrics(type?: PerformanceMetric['type']): PerformanceMetric[] {
    if (type) {
      return this.metrics.filter(metric => metric.type === type);
    }
    return [...this.metrics];
  }

  getAverageMetric(name: string): number {
    const relevantMetrics = this.metrics.filter(metric => metric.name === name);
    if (relevantMetrics.length === 0) return 0;
    
    const sum = relevantMetrics.reduce((acc, metric) => acc + metric.value, 0);
    return sum / relevantMetrics.length;
  }

  clearMetrics() {
    this.metrics = [];
  }

  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics = [];
  }

  // Helper method to measure component render time
  measureRender<T>(componentName: string, renderFn: () => T): T {
    const start = performance.now();
    const result = renderFn();
    const end = performance.now();
    
    this.recordMetric(`component-${componentName}`, end - start, 'render');
    return result;
  }

  // Helper method to measure API call time
  async measureApiCall<T>(apiName: string, apiCall: () => Promise<T>): Promise<T> {
    const start = performance.now();
    try {
      const result = await apiCall();
      const end = performance.now();
      this.recordMetric(`api-${apiName}`, end - start, 'api');
      return result;
    } catch (error) {
      const end = performance.now();
      this.recordMetric(`api-${apiName}-error`, end - start, 'api');
      throw error;
    }
  }

  // Get performance summary
  getSummary() {
    const summary = {
      totalMetrics: this.metrics.length,
      apiCalls: this.getMetrics('api').length,
      renderMetrics: this.getMetrics('render').length,
      navigationMetrics: this.getMetrics('navigation').length,
      averages: {
        apiResponseTime: this.getAverageMetric('api'),
        renderTime: this.getAverageMetric('render'),
        pageLoad: this.getAverageMetric('page-load'),
      },
      slowOperations: this.metrics.filter(metric => 
        (metric.type === 'api' && metric.value > 1000) ||
        (metric.type === 'render' && metric.value > 16)
      ),
    };

    return summary;
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor();

// React hook for measuring component performance
export function usePerformanceMonitor(componentName: string) {
  const measureRender = (renderFn: () => void) => {
    return performanceMonitor.measureRender(componentName, renderFn);
  };

  const measureApiCall = async <T>(apiName: string, apiCall: () => Promise<T>): Promise<T> => {
    return performanceMonitor.measureApiCall(apiName, apiCall);
  };

  return { measureRender, measureApiCall };
}

// Utility to measure bundle size impact
export function measureBundleSize() {
  if (typeof window === 'undefined') return;

  const scripts = Array.from(document.querySelectorAll('script[src]'));
  const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"]'));

  let totalSize = 0;

  scripts.forEach(script => {
    const src = (script as HTMLScriptElement).src;
    if (src.includes('/_next/static/')) {
      // Estimate size based on typical Next.js bundle patterns
      if (src.includes('chunks/pages/')) {
        performanceMonitor.recordMetric('bundle-page-chunk', 50000, 'bundle'); // ~50KB estimate
        totalSize += 50000;
      } else if (src.includes('chunks/main-')) {
        performanceMonitor.recordMetric('bundle-main-chunk', 200000, 'bundle'); // ~200KB estimate
        totalSize += 200000;
      }
    }
  });

  styles.forEach(style => {
    const href = (style as HTMLLinkElement).href;
    if (href.includes('/_next/static/')) {
      performanceMonitor.recordMetric('bundle-css', 20000, 'bundle'); // ~20KB estimate
      totalSize += 20000;
    }
  });

  performanceMonitor.recordMetric('bundle-total-estimated', totalSize, 'bundle');
}

// Initialize bundle size measurement on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', measureBundleSize);
}

export default performanceMonitor;
