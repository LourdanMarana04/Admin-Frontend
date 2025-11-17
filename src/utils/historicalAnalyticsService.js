import axios from 'axios';

class HistoricalAnalyticsService {
  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Get historical analytics data
  async getHistoricalData(departmentId, timePeriod, selectedTransaction = null) {
    try {
      const headers = this.getAuthHeaders();
      const params = {
        department_id: departmentId,
        time_period: timePeriod
      };
      
      // Handle transaction parameter properly
      if (selectedTransaction) {
        if (typeof selectedTransaction === 'object' && selectedTransaction.id) {
          params.transaction = selectedTransaction.id;
        } else if (typeof selectedTransaction === 'string') {
          params.transaction = selectedTransaction;
        } else {
          params.transaction = selectedTransaction;
        }
      }

      const response = await axios.get(`${this.baseURL}/analytics/historical`, { 
        params,
        headers,
        timeout: 30000 // 30 second timeout
      });
      
      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error('Failed to fetch historical data');
      }
    } catch (error) {
      console.error('Error fetching historical analytics:', error);
      throw error; // Don't return mock data, let the component handle the error
    }
  }

  // Get department transactions
  async getDepartmentTransactions(departmentId) {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/departments/${departmentId}`, { headers });
      return response.data.data?.transactions || [];
    } catch (error) {
      console.error('Error fetching department transactions:', error);
      return [];
    }
  }

  // Get number of days for time period
  getDaysForPeriod(timePeriod) {
    const periods = {
      'day': 1,
      'week': 7,
      'month': 30,
      '6months': 180,
      'year': 365
    };
    return periods[timePeriod] || 30;
  }

  // Generate empty data structure for fallback
  getEmptyDataStructure() {
    return {
      overall: {
        transactions: [],
        waitTimes: [],
        canceledTransactions: [],
        failedTransactions: [],
        cancellationReasons: [],
        kioskUsage: { webKiosk: 0, physicalKiosk: 0 }
      },
      byTransaction: {}
    };
  }

  // Get comparison data
  async getComparisonData(params) {
    try {
      const headers = this.getAuthHeaders();
      const response = await axios.get(`${this.baseURL}/analytics/comparison`, { 
        params,
        headers,
        timeout: 30000
      });
      
      if (response.data.status === 'success') {
        return response.data;
      } else {
        throw new Error('Failed to fetch comparison data');
      }
    } catch (error) {
      console.error('Error fetching comparison data:', error);
      throw error;
    }
  }

  // Process raw data into chart format
  processDataForCharts(rawData, timePeriod) {
    if (!rawData || !rawData.data) {
      return this.getEmptyDataStructure();
    }

    const data = rawData.data;
    
    // Process transactions data
    const transactions = data.transactions || [];
    const waitTimes = data.wait_times || [];
    const canceledTransactions = data.canceled_transactions || [];
    const failedTransactionsRaw = data.failed_transactions || data.canceled_transactions || [];
    const cancellationReasons = data.cancellation_reasons || [];
    const kioskUsage = data.kiosk_usage || { web: 0, physical: 0 };

    // Extract durations and transaction logs
    const durations = data.durations || { average_completed_minutes: 0, average_canceled_minutes: 0 };
    const transactionLogs = data.transaction_logs || [];

    // Build byTransaction in frontend-friendly shape
    const byTransaction = {};
    const rawByTx = data.by_transaction || {};
    Object.keys(rawByTx).forEach(name => {
      const item = rawByTx[name] || {};
      const tx = (item.transactions || []).map(d => ({ date: d.date, count: d.count || 0 }));
      const waits = (item.wait_times || []).map(d => ({ date: d.date, avgWait: d.average_wait || 0 }));
      const cancels = (item.canceled_transactions || []).map(d => ({ date: d.date, count: d.count || 0 }));
      const failed = (item.failed_transactions || item.canceled_transactions || []).map(d => ({ date: d.date, count: d.count || 0 }));
      byTransaction[name] = {
        transactions: tx,
        waitTimes: waits,
        canceledTransactions: cancels,
        failedTransactions: failed,
      };
    });

    return {
      overall: {
        transactions: transactions.map(item => ({
          date: item.date,
          count: item.count || 0
        })),
        waitTimes: waitTimes.map(item => ({
          date: item.date,
          avgWait: item.average_wait || 0
        })),
        canceledTransactions: canceledTransactions.map(item => ({
          date: item.date,
          count: item.count || 0
        })),
        failedTransactions: failedTransactionsRaw.map(item => ({
          date: item.date,
          count: item.count || 0
        })),
        cancellationReasons: cancellationReasons.map(item => ({
          reason: item.reason,
          count: item.count || 0,
          percentage: item.percentage || 0
        })),
        kioskUsage: {
          webKiosk: kioskUsage.web || 0,
          physicalKiosk: kioskUsage.physical || 0
        }
      },
      byTransaction,
      durations,
      transactionLogs
    };
  }
}

export default new HistoricalAnalyticsService(); 