/**
 * UI Enhancements for SoundSwitch extension
 */

export class UIEnhancements {
  private statsModal: HTMLElement | null = null;
  
  constructor(private selectors: Record<string, string>) {}

  /**
   * Setup hover stats for follower counts
   */
  setupHoverStats(): void {
    // Find follower count element
    const followerElement = document.querySelector(this.selectors.FOLLOWER_COUNT);
    if (!followerElement) return;

    // Extract user ID from URL
    const userId = this.extractUserIdFromUrl();
    if (!userId) return;

    // Create stats tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'soundswitch-stats-tooltip';
    tooltip.style.display = 'none';
    document.body.appendChild(tooltip);

    // Add hover listeners
    followerElement.addEventListener('mouseenter', async (e) => {
      const target = e.target as HTMLElement;
      
      // Position tooltip
      const rect = target.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom + 5}px`;
      tooltip.style.left = `${rect.left}px`;
      tooltip.style.display = 'block';
      
      // Show loading state
      tooltip.innerHTML = '<div class="loading">Loading stats...</div>';
      
      try {
        // Fetch follower growth data
        const response = await chrome.runtime.sendMessage({
          action: 'getFollowerGrowth',
          userId: userId
        });
        
        if (response.growth) {
          tooltip.innerHTML = `
            <div class="stats-content">
              <div class="stat-item">
                <span class="stat-label">Total Followers:</span>
                <span class="stat-value">${response.growth.total.toLocaleString()}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">New This Week:</span>
                <span class="stat-value">+${response.growth.newThisWeek.toLocaleString()}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Growth Rate:</span>
                <span class="stat-value">${response.growth.growthRate}%</span>
              </div>
            </div>
          `;
        } else {
          tooltip.innerHTML = '<div class="error">Failed to load stats</div>';
        }
      } catch (error) {
        console.error('Error fetching stats:', error);
        tooltip.innerHTML = '<div class="error">Error loading stats</div>';
      }
    });

    followerElement.addEventListener('mouseleave', () => {
      tooltip.style.display = 'none';
    });
  }

  /**
   * Setup quick share functionality
   */
  setupQuickShare(): void {
    const trackItems = document.querySelectorAll(this.selectors.TRACK_ITEM);
    
    trackItems.forEach(track => {
      // Skip if already has share button
      if (track.querySelector('.soundswitch-quick-share')) return;
      
      // Find track stats container
      const statsContainer = track.querySelector(this.selectors.TRACK_STATS);
      if (!statsContainer) return;
      
      // Create share button
      const shareBtn = document.createElement('button');
      shareBtn.className = 'soundswitch-quick-share';
      shareBtn.innerHTML = '🔗';
      shareBtn.title = 'Quick share';
      
      shareBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.handleQuickShare(track);
      });
      
      statsContainer.appendChild(shareBtn);
    });
  }

  /**
   * Handle quick share action
   */
  private handleQuickShare(trackElement: Element): void {
    // Find track link
    const trackLink = trackElement.querySelector('a[href*="/tracks/"]') as HTMLAnchorElement;
    if (!trackLink) return;
    
    const url = new URL(trackLink.href);
    
    // Copy to clipboard
    navigator.clipboard.writeText(url.toString()).then(() => {
      this.showNotification('Track URL copied to clipboard!');
    }).catch(err => {
      console.error('Failed to copy URL:', err);
      this.showNotification('Failed to copy URL', 'error');
    });
  }

  /**
   * Apply dark mode
   */
  applyDarkMode(enable: boolean): void {
    if (enable) {
      document.documentElement.classList.add('soundswitch-dark-mode');
      this.injectDarkModeStyles();
    } else {
      document.documentElement.classList.remove('soundswitch-dark-mode');
      this.removeDarkModeStyles();
    }
  }

  /**
   * Inject dark mode styles
   */
  private injectDarkModeStyles(): void {
    // Remove existing styles if any
    this.removeDarkModeStyles();
    
    const style = document.createElement('style');
    style.id = 'soundswitch-dark-mode-styles';
    style.textContent = `
      .soundswitch-dark-mode {
        filter: invert(1) hue-rotate(180deg);
      }
      
      .soundswitch-dark-mode img,
      .soundswitch-dark-mode video,
      .soundswitch-dark-mode iframe,
      .soundswitch-dark-mode [style*="background-image"] {
        filter: invert(1) hue-rotate(180deg);
      }
      
      .soundswitch-dark-mode .waveform__layer {
        filter: none;
      }
    `;
    
    document.head.appendChild(style);
  }

  /**
   * Remove dark mode styles
   */
  private removeDarkModeStyles(): void {
    const existingStyle = document.getElementById('soundswitch-dark-mode-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
  }

  /**
   * Show stats modal
   */
  async showStatsModal(): Promise<void> {
    // Create modal if doesn't exist
    if (!this.statsModal) {
      this.createStatsModal();
    }
    
    // Show modal
    this.statsModal!.style.display = 'flex';
    
    // Load stats
    await this.loadStatsData();
  }

  /**
   * Create stats modal
   */
  private createStatsModal(): void {
    this.statsModal = document.createElement('div');
    this.statsModal.className = 'soundswitch-stats-modal';
    this.statsModal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h2>Profile Statistics</h2>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">
          <div class="stats-loading">Loading statistics...</div>
        </div>
      </div>
    `;
    
    document.body.appendChild(this.statsModal);
    
    // Close button
    const closeBtn = this.statsModal.querySelector('.modal-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => {
        this.statsModal!.style.display = 'none';
      });
    }
    
    // Close on backdrop click
    this.statsModal.addEventListener('click', (e) => {
      if (e.target === this.statsModal) {
        this.statsModal!.style.display = 'none';
      }
    });
  }

  /**
   * Load stats data into modal
   */
  private async loadStatsData(): Promise<void> {
    const modalBody = this.statsModal!.querySelector('.modal-body');
    if (!modalBody) return;
    
    const userId = this.extractUserIdFromUrl();
    if (!userId) {
      modalBody.innerHTML = '<div class="error">Could not determine user ID</div>';
      return;
    }
    
    try {
      // Fetch user data
      const userResponse = await chrome.runtime.sendMessage({
        action: 'getUserData',
        userId: userId
      });
      
      // Fetch follower growth
      const growthResponse = await chrome.runtime.sendMessage({
        action: 'getFollowerGrowth',
        userId: userId
      });
      
      if (userResponse.userData) {
        const user = userResponse.userData;
        const growth = growthResponse.growth;
        
        modalBody.innerHTML = `
          <div class="stats-grid">
            <div class="stat-card">
              <h3>Profile Overview</h3>
              <div class="stat-row">
                <span>Username:</span>
                <strong>${user.username}</strong>
              </div>
              <div class="stat-row">
                <span>Tracks:</span>
                <strong>${(user.track_count || 0).toLocaleString()}</strong>
              </div>
              <div class="stat-row">
                <span>Playlists:</span>
                <strong>${(user.playlist_count || 0).toLocaleString()}</strong>
              </div>
            </div>
            
            <div class="stat-card">
              <h3>Follower Statistics</h3>
              <div class="stat-row">
                <span>Total Followers:</span>
                <strong>${(user.followers_count || 0).toLocaleString()}</strong>
              </div>
              ${growth ? `
                <div class="stat-row">
                  <span>New This Week:</span>
                  <strong class="positive">+${growth.newThisWeek.toLocaleString()}</strong>
                </div>
                <div class="stat-row">
                  <span>Growth Rate:</span>
                  <strong class="positive">${growth.growthRate}%</strong>
                </div>
              ` : ''}
            </div>
            
            <div class="stat-card">
              <h3>Following</h3>
              <div class="stat-row">
                <span>Following:</span>
                <strong>${(user.followings_count || 0).toLocaleString()}</strong>
              </div>
              <div class="stat-row">
                <span>Follow Ratio:</span>
                <strong>${this.calculateFollowRatio(user.followers_count, user.followings_count)}</strong>
              </div>
            </div>
          </div>
        `;
      } else {
        modalBody.innerHTML = '<div class="error">Failed to load user data</div>';
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      modalBody.innerHTML = '<div class="error">Error loading statistics</div>';
    }
  }

  /**
   * Calculate follow ratio
   */
  private calculateFollowRatio(followers?: number, following?: number): string {
    if (!followers || !following || following === 0) return 'N/A';
    const ratio = followers / following;
    return ratio.toFixed(2);
  }

  /**
   * Extract user ID from URL
   */
  private extractUserIdFromUrl(): string | null {
    const path = window.location.pathname;
    const match = path.match(/^\/([^/]+)/);
    return match ? match[1] : null;
  }

  /**
   * Show notification
   */
  private showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    const notification = document.createElement('div');
    notification.className = `soundswitch-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);
    
    // Remove after 3 seconds
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
} 