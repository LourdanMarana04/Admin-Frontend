class SessionMonitorService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.checkInterval = null;
    this.isChecking = false;
    this.listeners = [];
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Start monitoring user session
  startMonitoring(intervalMs = 30000) { // Check every 30 seconds
    if (this.checkInterval) {
      this.stopMonitoring();
    }

    this.checkInterval = setInterval(() => {
      this.checkUserStatus();
    }, intervalMs);

    // Also check immediately
    this.checkUserStatus();
  }

  // Stop monitoring
  stopMonitoring() {
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
  }

  // Check if user still exists and is active
  async checkUserStatus() {
    if (this.isChecking) return;
    
    const token = localStorage.getItem('token');
    if (!token) {
      this.notifyListeners('no_token');
      return;
    }

    this.isChecking = true;

    try {
      const response = await fetch(`${this.baseURL}/user`, {
        method: 'GET',
        headers: this.getAuthHeaders(),
      });

      if (response.status === 401) {
        const errorData = await response.json();
        
        if (errorData.code === 'ACCOUNT_DELETED') {
          this.handleAccountDeleted();
        } else {
          this.handleSessionExpired();
        }
      } else if (response.ok) {
        // User is still valid
        this.notifyListeners('valid');
      } else {
        this.handleSessionExpired();
      }
    } catch (error) {
      console.error('Session check failed:', error);
      // Don't logout on network errors, just skip this check
    } finally {
      this.isChecking = false;
    }
  }

  // Handle account deletion
  handleAccountDeleted() {
    console.log('Account has been deleted by administrator');
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Notify listeners
    this.notifyListeners('account_deleted');
    
    // Show notification and redirect
    this.showAccountDeletedNotification();
    
    // Redirect to login after a delay
    setTimeout(() => {
      window.location.href = '/login';
    }, 3000);
  }

  // Handle session expiration
  handleSessionExpired() {
    console.log('Session has expired');
    
    // Clear local storage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Notify listeners
    this.notifyListeners('session_expired');
    
    // Redirect to login
    window.location.href = '/login';
  }

  // Show account deleted notification
  showAccountDeletedNotification() {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white p-4 rounded-lg shadow-lg z-50 max-w-md';
    notification.innerHTML = `
      <div class="flex items-center space-x-3">
        <div class="flex-shrink-0">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
          </svg>
        </div>
        <div>
          <h3 class="font-semibold">Account Deleted</h3>
          <p class="text-sm">Your account has been deleted by an administrator. You will be redirected to the login page.</p>
        </div>
      </div>
    `;

    // Add to page
    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 5000);
  }

  // Add event listener
  addListener(callback) {
    this.listeners.push(callback);
  }

  // Remove event listener
  removeListener(callback) {
    this.listeners = this.listeners.filter(listener => listener !== callback);
  }

  // Notify all listeners
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in session monitor listener:', error);
      }
    });
  }

  // Manual check (for immediate verification)
  async manualCheck() {
    await this.checkUserStatus();
  }

  // Check if user is currently logged in
  isLoggedIn() {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    return !!(token && user);
  }

  // Get current user info
  getCurrentUser() {
    try {
      const userStr = localStorage.getItem('user');
      return userStr ? JSON.parse(userStr) : null;
    } catch (error) {
      console.error('Error parsing user data:', error);
      return null;
    }
  }
}

// Create singleton instance
const sessionMonitor = new SessionMonitorService();

export default sessionMonitor;


