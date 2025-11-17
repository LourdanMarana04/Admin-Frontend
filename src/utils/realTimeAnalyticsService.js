import axios from 'axios';

class RealTimeAnalyticsService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
    this.pollingInterval = 60000; // 1 minute (60 seconds)
    this.subscribers = new Set();
    this.isPolling = false;
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Real-time queue status
  async getRealTimeQueueStatus(departmentId = null) {
    try {
      const params = departmentId ? { department_id: departmentId } : {};
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/analytics/queue-metrics`, { 
        params,
        headers
      });
      
      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error('Failed to fetch queue metrics');
      }
    } catch (error) {
      console.error('Error fetching real-time queue status:', error);
      throw error;
    }
  }

  // Real-time kiosk usage
  async getRealTimeKioskUsage(departmentId = null) {
    try {
      const params = departmentId ? { department_id: departmentId } : {};
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/analytics/kiosk-usage-metrics`, { 
        params,
        headers
      });
      
      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error('Failed to fetch kiosk usage metrics');
      }
    } catch (error) {
      console.error('Error fetching real-time kiosk usage:', error);
      throw error;
    }
  }

  // Real-time wait times
  async getRealTimeWaitTimes(departmentId = null) {
    try {
      const params = departmentId ? { department_id: departmentId } : {};
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/analytics/wait-time-metrics`, { 
        params,
        headers
      });
      
      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error('Failed to fetch wait time metrics');
      }
    } catch (error) {
      console.error('Error fetching real-time wait times:', error);
      throw error;
    }
  }

  // Real-time department metrics
  async getRealTimeDepartmentMetrics(departmentId = null) {
    try {
      const params = departmentId ? { department_id: departmentId } : {};
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/analytics/department-metrics`, { 
        params,
        headers
      });
      
      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error('Failed to fetch department metrics');
      }
    } catch (error) {
      console.error('Error fetching real-time department metrics:', error);
      throw error;
    }
  }

  // Start real-time polling
  startRealTimeUpdates(departmentId = null, callback) {
    if (this.isPolling) {
      this.stopRealTimeUpdates();
    }

    this.isPolling = true;
    this.subscribers.add(callback);

    const poll = async () => {
      if (!this.isPolling) return;

      try {
        const [queueData, kioskData, waitTimeData, departmentData] = await Promise.all([
          this.getRealTimeQueueStatus(departmentId),
          this.getRealTimeKioskUsage(departmentId),
          this.getRealTimeWaitTimes(departmentId),
          this.getRealTimeDepartmentMetrics(departmentId)
        ]);

        const realTimeData = {
          timestamp: new Date().toISOString(),
          queue: queueData,
          kiosk: kioskData,
          waitTime: waitTimeData,
          department: departmentData
        };

        this.subscribers.forEach(callback => callback(realTimeData));
      } catch (error) {
        console.error('Error in real-time polling:', error);
        // Notify subscribers of error
        this.subscribers.forEach(callback => callback({ error: error.message }));
      }

      if (this.isPolling) {
        setTimeout(poll, this.pollingInterval);
      }
    };

    // Start polling immediately
    poll();
  }

  // Stop real-time polling
  stopRealTimeUpdates() {
    this.isPolling = false;
    this.subscribers.clear();
  }
}

export default new RealTimeAnalyticsService(); 