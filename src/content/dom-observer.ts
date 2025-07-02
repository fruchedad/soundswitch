/**
 * DOM Observer for detecting page changes in SPA
 */

export class DOMObserver {
  private observer: MutationObserver | null = null;
  private currentUrl: string = window.location.href;
  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  /**
   * Start observing DOM changes
   */
  observe(callback: () => void): void {
    // Create mutation observer
    this.observer = new MutationObserver(() => {
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
      }, 300);
    });

    // Observe the entire document
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });

    // Also listen to popstate for browser navigation
    window.addEventListener('popstate', () => {
      if (this.currentUrl !== window.location.href) {
        this.currentUrl = window.location.href;
        callback();
      }
    });

    // Listen to pushstate/replacestate
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;
    const observer = this;

    history.pushState = function(data: any, unused: string, url?: string | URL | null) {
      originalPushState.apply(history, [data, unused, url]);
      if (observer.currentUrl !== window.location.href) {
        observer.currentUrl = window.location.href;
        callback();
      }
    };

    history.replaceState = function(data: any, unused: string, url?: string | URL | null) {
      originalReplaceState.apply(history, [data, unused, url]);
      if (observer.currentUrl !== window.location.href) {
        observer.currentUrl = window.location.href;
        callback();
      }
    };
  }

  /**
   * Stop observing
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
  }
} 