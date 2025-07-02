/**
 * View Manager for handling public/user view switching
 */

export class ViewManager {
  private privateTracksVisible = true;
  private hiddenElements: Set<Element> = new Set();
  
  constructor(private selectors: Record<string, string>) {}

  /**
   * Apply view mode (public or user)
   */
  async applyViewMode(mode: 'public' | 'user'): Promise<void> {
    if (mode === 'public') {
      await this.applyPublicView();
    } else {
      await this.applyUserView();
    }
  }

  /**
   * Apply public view - hide private elements
   */
  private async applyPublicView(): Promise<void> {
    // Hide private tracks
    this.hideElements(this.selectors.PRIVATE_TRACK);
    
    // Hide likes and reposts tabs
    this.hideElements(this.selectors.LIKES_TAB);
    this.hideElements(this.selectors.REPOSTS_TAB);
    
    // Hide comments section
    this.hideElements(this.selectors.COMMENT_SECTION);
    
    // Add view indicator
    this.addViewIndicator('public');
    
    // Check authentication
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      if (!response.authenticated) {
        // If not authenticated, also hide following count
        this.hideElements(this.selectors.FOLLOWING_COUNT);
      }
    } catch (error) {
      console.error('Error checking authentication:', error);
    }
  }

  /**
   * Apply user view - show all elements
   */
  private async applyUserView(): Promise<void> {
    // Show all hidden elements
    this.hiddenElements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.display = '';
        element.classList.remove('soundswitch-hidden');
      }
    });
    this.hiddenElements.clear();
    
    // Remove view indicator
    this.removeViewIndicator();
  }

  /**
   * Hide elements matching selector
   */
  private hideElements(selector: string): void {
    const elements = document.querySelectorAll(selector);
    elements.forEach(element => {
      if (element instanceof HTMLElement) {
        element.style.display = 'none';
        element.classList.add('soundswitch-hidden');
        this.hiddenElements.add(element);
      }
    });
  }

  /**
   * Add view mode indicator
   */
  private addViewIndicator(mode: string): void {
    this.removeViewIndicator();
    
    const header = document.querySelector(this.selectors.PROFILE_HEADER);
    if (header) {
      const indicator = document.createElement('div');
      indicator.className = 'soundswitch-view-indicator';
      indicator.innerHTML = `
        <span class="indicator-icon">👀</span>
        <span class="indicator-text">Viewing as: ${mode === 'public' ? 'Public visitor' : 'Authenticated user'}</span>
      `;
      header.appendChild(indicator);
    }
  }

  /**
   * Remove view mode indicator
   */
  private removeViewIndicator(): void {
    const indicators = document.querySelectorAll('.soundswitch-view-indicator');
    indicators.forEach(indicator => indicator.remove());
  }

  /**
   * Setup private track toggle functionality
   */
  setupPrivateTrackToggle(): void {
    // Create observer for new tracks
    const trackObserver = new MutationObserver(() => {
      this.processPrivateTracks();
    });

    // Start observing track list
    const trackList = document.querySelector(this.selectors.TRACK_LIST);
    if (trackList) {
      trackObserver.observe(trackList.parentElement!, {
        childList: true,
        subtree: true
      });
    }

    // Process existing tracks
    this.processPrivateTracks();
  }

  /**
   * Process private tracks - add toggle links
   */
  private processPrivateTracks(): void {
    const privateTracks = document.querySelectorAll(this.selectors.PRIVATE_TRACK);
    
    privateTracks.forEach(track => {
      // Skip if already processed
      if (track.querySelector('.soundswitch-private-toggle')) return;
      
      // Find the track item container
      const trackItem = track.closest(this.selectors.TRACK_ITEM);
      if (!trackItem) return;
      
      // Create toggle link
      const toggleLink = document.createElement('a');
      toggleLink.className = 'soundswitch-private-toggle';
      toggleLink.href = '#';
      toggleLink.innerHTML = '🔓 Show Private Track';
      
      toggleLink.addEventListener('click', (e) => {
        e.preventDefault();
        this.togglePrivateTrack(trackItem);
      });
      
      // Insert before track content
      trackItem.insertBefore(toggleLink, trackItem.firstChild);
      
      // Initially hide private track content
      if (!this.privateTracksVisible) {
        this.hidePrivateTrack(trackItem);
      }
    });
  }

  /**
   * Toggle visibility of a private track
   */
  private togglePrivateTrack(trackItem: Element): void {
    const isHidden = trackItem.classList.contains('soundswitch-private-hidden');
    
    if (isHidden) {
      this.showPrivateTrack(trackItem);
    } else {
      this.hidePrivateTrack(trackItem);
    }
  }

  /**
   * Hide a private track
   */
  private hidePrivateTrack(trackItem: Element): void {
    trackItem.classList.add('soundswitch-private-hidden');
    
    const toggleLink = trackItem.querySelector('.soundswitch-private-toggle');
    if (toggleLink) {
      toggleLink.innerHTML = '🔓 Show Private Track';
    }
    
    // Hide all content except toggle link
    Array.from(trackItem.children).forEach(child => {
      if (!child.classList.contains('soundswitch-private-toggle') && child instanceof HTMLElement) {
        child.style.display = 'none';
      }
    });
  }

  /**
   * Show a private track
   */
  private showPrivateTrack(trackItem: Element): void {
    trackItem.classList.remove('soundswitch-private-hidden');
    
    const toggleLink = trackItem.querySelector('.soundswitch-private-toggle');
    if (toggleLink) {
      toggleLink.innerHTML = '🔒 Hide Private Track';
    }
    
    // Show all content
    Array.from(trackItem.children).forEach(child => {
      if (child instanceof HTMLElement) {
        child.style.display = '';
      }
    });
  }

  /**
   * Toggle all private tracks
   */
  togglePrivateTracks(): void {
    this.privateTracksVisible = !this.privateTracksVisible;
    
    const privateTracks = document.querySelectorAll(this.selectors.PRIVATE_TRACK);
    privateTracks.forEach(track => {
      const trackItem = track.closest(this.selectors.TRACK_ITEM);
      if (trackItem) {
        if (this.privateTracksVisible) {
          this.showPrivateTrack(trackItem);
        } else {
          this.hidePrivateTrack(trackItem);
        }
      }
    });
  }
} 