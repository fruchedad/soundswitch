/**
 * Optimized DOM Observer for detecting page changes in SPA
 * Reduces performance impact through targeted observation and efficient debouncing
 */

export class DOMObserver {
  private observer: MutationObserver | null = null;
  private currentUrl: string = window.location.href;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private observationTarget: Element | null = null;
  private isObserving = false;
  
  // Performance optimization: Only observe specific elements
  private static readonly OBSERVATION_TARGETS = [
    '#app', 
    '.l-main', 
    '.l-content',
    'main'
  ];
  
  // Reduced debounce time for better responsiveness
  private static readonly DEBOUNCE_DELAY = 150;
  
  // Throttle frequent mutations
  private lastMutationTime = 0;
  private static readonly MUTATION_THROTTLE = 100;

  /**
   * Start observing DOM changes with optimized configuration
   */
  observe(callback: () => void): void {
    if (this.isObserving) return;
    
    this.findOptimalObservationTarget();
    
    // Create optimized mutation observer
    this.observer = new MutationObserver((mutations) => {
      const now = Date.now();
      
      // Throttle mutations to prevent performance issues
      if (now - this.lastMutationTime < DOMObserver.MUTATION_THROTTLE) {
        return;
      }
      this.lastMutationTime = now;
      
      // Check if any mutations are relevant
      const hasRelevantMutations = mutations.some(mutation => 
        this.isRelevantMutation(mutation)
      );
      
      if (!hasRelevantMutations) return;
      
      // Debounce to avoid excessive callbacks
      if (this.debounceTimer) {
        clearTimeout(this.debounceTimer);
      }

      this.debounceTimer = setTimeout(() => {
        // Check if URL has changed
        if (this.currentUrl !== window.location.href) {
          this.currentUrl = window.location.href;
          callback();
        }
      }, DOMObserver.DEBOUNCE_DELAY);
    });

    // Observe with optimized configuration
    if (this.observationTarget) {
      this.observer.observe(this.observationTarget, {
        childList: true,
        subtree: true,
        attributes: false, // Reduced observation scope
        characterData: false
      });
    }

    this.setupNavigationListeners(callback);
    this.isObserving = true;
  }

  /**
   * Find the most optimal element to observe (reduces observation scope)
   */
  private findOptimalObservationTarget(): void {
    for (const selector of DOMObserver.OBSERVATION_TARGETS) {
      const element = document.querySelector(selector);
      if (element) {
        this.observationTarget = element;
        return;
      }
    }
    // Fallback to body if no optimal target found
    this.observationTarget = document.body;
  }

  /**
   * Check if a mutation is relevant to our needs
   */
  private isRelevantMutation(mutation: MutationRecord): boolean {
    // Only care about significant DOM changes
    if (mutation.type === 'childList') {
      // Ignore trivial changes (text nodes, small elements)
      return Array.from(mutation.addedNodes).some(node => 
        node.nodeType === Node.ELEMENT_NODE && 
        (node as Element).tagName !== 'SCRIPT' &&
        (node as Element).tagName !== 'STYLE'
      );
    }
    return false;
  }

  /**
   * Setup optimized navigation listeners
   */
  private setupNavigationListeners(callback: () => void): void {
    // Listen to popstate for browser navigation
    window.addEventListener('popstate', this.handleNavigation.bind(this, callback), { passive: true });

    // Listen to pushstate/replacestate with minimal overhead
    this.interceptHistoryMethods(callback);
  }

  /**
   * Handle navigation events efficiently
   */
  private handleNavigation(callback: () => void): void {
    if (this.currentUrl !== window.location.href) {
      this.currentUrl = window.location.href;
      
      // Use requestIdleCallback for better performance
      if ('requestIdleCallback' in window) {
        requestIdleCallback(() => callback());
      } else {
        setTimeout(callback, 0);
      }
    }
  }

  /**
   * Intercept history methods with minimal performance impact
   */
  private interceptHistoryMethods(callback: () => void): void {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const self = this; // Capture context

    history.pushState = function(data: any, unused: string, url?: string | URL | null) {
      originalPushState.apply(history, [data, unused, url]);
      // Use microtask for immediate but non-blocking execution
      queueMicrotask(() => {
        if (window.location.href !== self.currentUrl) {
          self.currentUrl = window.location.href;
          callback();
        }
      });
    };

    history.replaceState = function(data: any, unused: string, url?: string | URL | null) {
      originalReplaceState.apply(history, [data, unused, url]);
      queueMicrotask(() => {
        if (window.location.href !== self.currentUrl) {
          self.currentUrl = window.location.href;
          callback();
        }
      });
    };
  }

  /**
   * Stop observing with cleanup
   */
  disconnect(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }

    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }

    this.isObserving = false;
    this.observationTarget = null;
  }

  /**
   * Get performance metrics for monitoring
   */
  getPerformanceMetrics(): { isObserving: boolean; targetSelector: string | null } {
    return {
      isObserving: this.isObserving,
      targetSelector: this.observationTarget?.tagName || null
    };
  }
} 