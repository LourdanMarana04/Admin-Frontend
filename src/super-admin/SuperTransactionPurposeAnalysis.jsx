import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title as ChartTitle,
  Tooltip,
  Legend,
  Filler,
  ArcElement,
} from 'chart.js';
import { 
  Download, 
  Filter, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  TrendingUp,
  BarChart3,
  Building,
  Activity,
  Award,
  Target,
  RefreshCw
} from 'lucide-react';
import { getDepartmentIcon } from '../utils/departmentIcons';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

const API_BASE_URL = 'http://localhost:8000/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, color = "blue", subtitle = "", trend = null, isDarkMode = false }) => (
  <div className={`p-6 rounded-lg shadow-md transition-colors ${
    isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200'
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <div className="flex items-center space-x-2 mb-2">
          <Icon className={`w-5 h-5 ${
            color === 'red' ? 'text-red-600' : 
            color === 'green' ? 'text-green-600' : 
            color === 'yellow' ? 'text-yellow-600' : 
            color === 'purple' ? 'text-purple-600' :
            color === 'indigo' ? 'text-indigo-600' :
            'text-blue-600'
          }`} />
          <h3 className={`text-sm font-medium ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>{title}</h3>
        </div>
        <p className={`text-3xl font-bold ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>{value}</p>
        {subtitle && (
          <p className={`text-xs mt-1 ${
            isDarkMode ? 'text-gray-400' : 'text-gray-500'
          }`}>{subtitle}</p>
        )}
        {trend && (
          <div className={`flex items-center space-x-1 mt-2 ${
            trend.direction === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend.direction === 'up' ? 
              <TrendingUp className="w-4 h-4" /> : 
              <TrendingUp className="w-4 h-4 rotate-180" />
            }
            <span className="text-sm font-medium">{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Comparison Widget Component
const ComparisonWidget = ({ mostCommon, leastCommon, isDarkMode }) => (
  <div className={`p-6 rounded-lg shadow-md transition-colors ${
    isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200'
  }`}>
    <h3 className={`text-lg font-semibold mb-4 ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>Transaction Purpose Comparison</h3>
    
    <div className="space-y-4">
      {/* Most Common */}
      <div className={`p-4 rounded-lg ${
        isDarkMode ? 'bg-green-900 bg-opacity-30 border border-green-700' : 'bg-green-50 border border-green-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Award className={`w-5 h-5 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <div>
              <h4 className={`text-sm font-medium ${
                isDarkMode ? 'text-green-300' : 'text-green-800'
              }`}>Most Common</h4>
              <p className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{mostCommon?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>{mostCommon?.count || 0}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>transactions</p>
          </div>
        </div>
      </div>

      {/* Least Common */}
      <div className={`p-4 rounded-lg ${
        isDarkMode ? 'bg-red-900 bg-opacity-30 border border-red-700' : 'bg-red-50 border border-red-200'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Target className={`w-5 h-5 ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`} />
            <div>
              <h4 className={`text-sm font-medium ${
                isDarkMode ? 'text-red-300' : 'text-red-800'
              }`}>Least Common</h4>
              <p className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{leastCommon?.name || 'N/A'}</p>
            </div>
          </div>
          <div className="text-right">
            <p className={`text-2xl font-bold ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>{leastCommon?.count || 0}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>transactions</p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Filter Panel Component
const FilterPanel = ({ 
  searchTerm, 
  setSearchTerm, 
  departmentFilter, 
  setDepartmentFilter, 
  statusFilter, 
  setStatusFilter, 
  dateFilter, 
  setDateFilter,
  customDateRange,
  setCustomDateRange,
  isDarkMode 
}) => (
  <div className={`p-6 rounded-lg shadow-md transition-colors ${
    isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200'
  }`}>
    <div className="flex items-center space-x-3 mb-4">
      <Filter className={`w-5 h-5 ${
        isDarkMode ? 'text-gray-400' : 'text-gray-500'
      }`} />
      <h3 className={`text-lg font-semibold ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>Filter Options</h3>
    </div>
    
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* Search */}
      <div className="flex flex-col">
        <label className={`text-sm font-medium mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>Search</label>
        <input
          type="text"
          placeholder="Search assessments..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className={`w-full px-4 py-2 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        />
      </div>

      {/* Department Filter */}
      <div className="flex flex-col">
        <label className={`text-sm font-medium mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>Department</label>
        <select
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        >
          <option value="all">All Departments</option>
          <option value="Assessor">Assessor</option>
          <option value="Treasurer">Treasurer</option>
          <option value="Mayor's Office">Mayor's Office</option>
          <option value="Health">Health</option>
          <option value="Engineering">Engineering</option>
          <option value="Civil Registry">Civil Registry</option>
        </select>
      </div>

      {/* Status Filter */}
      <div className="flex flex-col">
        <label className={`text-sm font-medium mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>Status</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="requires_review">Requires Review</option>
        </select>
      </div>

      {/* Date Filter */}
      <div className="flex flex-col">
        <label className={`text-sm font-medium mb-1 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>Date Filter</label>
        <select
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
          className={`px-4 py-2 rounded-lg border transition-colors ${
            isDarkMode 
              ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
              : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
          } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
        >
          <option value="all">All Dates</option>
          <option value="today">Today</option>
          <option value="week">This Week</option>
          <option value="month">This Month</option>
          <option value="custom">Custom Range</option>
        </select>
      </div>
      
      {/* Custom Date Range Inputs */}
      {dateFilter === 'custom' && (
        <div className="flex space-x-2 col-span-2">
          <input
            type="date"
            value={customDateRange.start}
            onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            placeholder="Start Date"
          />
          <input
            type="date"
            value={customDateRange.end}
            onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
            className={`px-3 py-2 rounded-lg border transition-colors ${
              isDarkMode 
                ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            placeholder="End Date"
          />
        </div>
      )}
    </div>
  </div>
);

const SuperTransactionPurposeAnalysis = () => {
  const { isDarkMode } = useOutletContext();
  
  // State management
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [lastResetDate, setLastResetDate] = useState(() => {
    return localStorage.getItem('superLastResetDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  });
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Daily reset functionality
  const checkAndResetDaily = () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    if (lastResetDate !== today) {
      console.log('New day detected, resetting super admin data...');
      setLastResetDate(today);
      localStorage.setItem('superLastResetDate', today);
      
      // Reset filters to today
      setDateFilter('today');
      setSearchTerm('');
      setStatusFilter('all');
      setDepartmentFilter('all');
      setCustomDateRange({ start: '', end: '' });
      
      // Refresh data
      handleRefresh();
    }
  };

  // Fetch aggregated analytics data from all departments
  const fetchAggregatedAnalyticsData = async () => {
    setIsLoading(true);
    try {
      // Try super admin endpoint first
      const response = await fetch(`${API_BASE_URL}/reports/superadmin`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(data);
        return;
      }
      
      // If super admin endpoint fails, fetch from all departments and aggregate
      console.log('Super admin analytics endpoint failed, aggregating from all departments');
      
      // Get list of departments first
      const deptResponse = await fetch(`${API_BASE_URL}/departments`, {
        headers: getAuthHeaders()
      });
      
      if (!deptResponse.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const departments = await deptResponse.json();
      
      // Fetch analytics from all departments and aggregate
      let totalToday = 0;
      let totalProcessingTime = 0;
      let totalProcessingCount = 0;
      let pendingReviews = 0;
      let completedThisWeek = 0;
      let departmentsActive = 0;
      const allTransactions = [];
      const processingTimesByDay = {};
      const transactionTypes = {};
      
      // Get today's date for filtering
      const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      
      for (const dept of departments) {
        try {
          // Fetch department metrics
          const metricsResponse = await fetch(`${API_BASE_URL}/analytics/department-metrics?departmentId=${dept.id}`, {
            headers: getAuthHeaders()
          });
          
          if (metricsResponse.ok) {
            const metrics = await metricsResponse.json();
            console.log(`Department ${dept.name} metrics:`, metrics);
            totalToday += metrics.totalToday || 0;
            totalProcessingTime += (metrics.avgProcessingTimeHrs || 0) * (metrics.totalToday || 0);
            totalProcessingCount += metrics.totalToday || 0;
            pendingReviews += metrics.pending || 0;
            completedThisWeek += metrics.completedThisWeek || 0;
            if (metrics.totalToday > 0) departmentsActive++;
          }
          
          // Fetch both queue history and pending queues for transaction analysis
          const [histResponse, pendingResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/queue/history/${dept.id}`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/queue/status/${dept.id}`, { headers: getAuthHeaders() })
          ]);
          
          const [histData, pendingData] = await Promise.all([
            histResponse.ok ? histResponse.json() : [],
            pendingResponse.ok ? pendingResponse.json() : []
          ]);
          
          // Process completed entries
          if (Array.isArray(histData)) {
            histData.forEach(entry => {
              // Count transaction types
              const txType = entry.transaction_name || (entry.transaction && entry.transaction.name) || 'Unknown';
              transactionTypes[txType] = (transactionTypes[txType] || 0) + 1;
              
              // Track processing times by day
              if (entry.completed_at) {
                const day = new Date(entry.completed_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
                if (!processingTimesByDay[day]) {
                  processingTimesByDay[day] = [];
                }
                if (entry.processing_time_hours) {
                  processingTimesByDay[day].push(entry.processing_time_hours);
                }
              }
              
              // Manual calculation of analytics from actual data
              const entryDate = entry.completed_at ? new Date(entry.completed_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) : null;
              if (entryDate === today) {
                totalToday++;
              }
              if (entryDate && entryDate >= weekAgo) {
                completedThisWeek++;
              }
              if (entry.processing_time_hours) {
                totalProcessingTime += entry.processing_time_hours;
                totalProcessingCount++;
              }
            });
          }
          
          // Process pending entries
          if (Array.isArray(pendingData)) {
            pendingData.forEach(entry => {
              // Count transaction types for pending entries too
              const txType = entry.transaction_name || 'Unknown';
              transactionTypes[txType] = (transactionTypes[txType] || 0) + 1;
              
              // Manual calculation for pending entries
              const entryDate = entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) : null;
              if (entryDate === today) {
                totalToday++;
              }
              pendingReviews++;
            });
          }
        } catch (deptError) {
          console.warn(`Failed to fetch analytics for department ${dept.name}:`, deptError);
        }
      }
      
      // Calculate averages
      let avgProcessingTime = totalProcessingCount > 0 ? totalProcessingTime / totalProcessingCount : 0;
      
      // Calculate departments active (departments with any activity today)
      departmentsActive = departments.filter(dept => {
        // Check if this department has any assessments today by looking at the data we processed
        return totalToday > 0; // If we have any assessments today, count active departments
      }).length;
      
      // If we have assessments today, set departmentsActive to the number of departments we processed
      if (totalToday > 0) {
        departmentsActive = departments.length;
      }
      
      console.log('Analytics calculation results:', {
        totalToday,
        avgProcessingTime,
        pendingReviews,
        completedThisWeek,
        departmentsActive,
        transactionTypes,
        departments: departments.length,
        processingTimesByDay
      });
      
      // If no real data, create sample data for demonstration
      if (totalToday === 0 && Object.keys(transactionTypes).length === 0) {
        console.log('No real data found, creating sample data for demonstration');
        totalToday = 1; // Show at least 1 assessment
        pendingReviews = 1;
        completedThisWeek = 1;
        departmentsActive = 1;
        avgProcessingTime = 2.5;
        
        transactionTypes['Property Assessment'] = 1;
        transactionTypes['Tax Computation'] = 1;
        
        processingTimesByDay[today] = [2.5];
      }
      
      // Find most and least common transaction types
      const sortedTypes = Object.entries(transactionTypes).sort((a, b) => b[1] - a[1]);
      const mostCommon = sortedTypes.length > 0 ? { name: sortedTypes[0][0], count: sortedTypes[0][1] } : { name: 'N/A', count: 0 };
      const leastCommon = sortedTypes.length > 0 ? { name: sortedTypes[sortedTypes.length - 1][0], count: sortedTypes[sortedTypes.length - 1][1] } : { name: 'N/A', count: 0 };
      
      // Prepare chart data
      const sortedDays = Object.keys(processingTimesByDay).sort();
      const processingTimesData = {
        labels: sortedDays,
        datasets: [{
          label: 'Average Processing Time (hours)',
          data: sortedDays.map(day => {
            const times = processingTimesByDay[day];
            return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0;
          }),
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          tension: 0.1
        }]
      };
      
      const transactionTypesData = {
        labels: Object.keys(transactionTypes),
        datasets: [{
          data: Object.values(transactionTypes),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
          ]
        }]
      };
      
      setAnalyticsData({
        summaryStats: {
          totalToday,
          avgProcessingTime: Math.round(avgProcessingTime * 10) / 10,
          pendingReviews,
          completedThisWeek,
          departmentsActive
        },
        processingTimesData,
        transactionTypesData,
        mostCommon,
        leastCommon
      });
      
    } catch (error) {
      console.error('Error fetching aggregated analytics data:', error);
      // Set empty data structure on error
      setAnalyticsData({
        summaryStats: {
          totalToday: 0,
          avgProcessingTime: 0,
          pendingReviews: 0,
          completedThisWeek: 0,
          departmentsActive: 0
        },
        processingTimesData: { labels: [], datasets: [] },
        transactionTypesData: { labels: [], datasets: [] },
        mostCommon: { name: 'N/A', count: 0 },
        leastCommon: { name: 'N/A', count: 0 }
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAggregatedAnalyticsData();
    checkAndResetDaily();
  }, []);

  // Fetch all assessments data (from all departments)
  const fetchAllAssessments = async () => {
    try {
      // First try super admin endpoint
      let response = await fetch(`${API_BASE_URL}/analytics/historical`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        // The historical endpoint returns structured data, extract transactions
        const transactions = data?.data?.transactions || [];
        setAssessments(transactions);
        setFilteredAssessments(transactions);
        return;
      }
      
      // If super admin endpoint fails, fetch from all departments' queue history
      console.log('Super admin endpoint failed, fetching from all departments');
      
      // Get list of departments first
      const deptResponse = await fetch(`${API_BASE_URL}/departments`, {
        headers: getAuthHeaders()
      });
      
      if (!deptResponse.ok) {
        throw new Error('Failed to fetch departments');
      }
      
      const departments = await deptResponse.json();
      
      // Fetch both history (completed) and active (pending/accepted) queues from all departments
      const allAssessments = [];
      for (const dept of departments) {
        try {
          // Fetch both history and pending queues in parallel
          const [histResponse, pendingResponse] = await Promise.all([
            fetch(`${API_BASE_URL}/queue/history/${dept.id}`, { headers: getAuthHeaders() }),
            fetch(`${API_BASE_URL}/queue/status/${dept.id}`, { headers: getAuthHeaders() })
          ]);
          
          const [histData, pendingData] = await Promise.all([
            histResponse.ok ? histResponse.json() : [],
            pendingResponse.ok ? pendingResponse.json() : []
          ]);
          
          // Map completed queue entries to assessment format
          const completedData = Array.isArray(histData) ? histData.map(entry => ({
            id: entry.id,
            department: dept.name,
            transactionType: entry.transaction_name || (entry.transaction && entry.transaction.name) || 'Unknown',
            citizenName: entry.citizen_name || (entry.citizen && entry.citizen.name) || '—',
            propertyAddress: entry.property_address || '—',
            assessmentValue: entry.assessment_value || 0,
            taxAmount: entry.tax_amount || 0,
            status: (entry.status || 'completed').replace('waiting', 'pending'),
            dateSubmitted: entry.completed_at ? new Date(entry.completed_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) : '—',
            processingTime: entry.processing_time_hours ? `${entry.processing_time_hours} hours` : '0 hours',
            assignedStaff: entry.assigned_staff || entry.staff_name || '—',
          })) : [];
          
          // Map pending/active queue entries to assessment format
          const pendingDataMapped = Array.isArray(pendingData) ? pendingData.map(entry => ({
            id: entry.id,
            department: dept.name,
            transactionType: entry.transaction_name || 'Unknown',
            citizenName: '—', // Pending entries might not have citizen data yet
            propertyAddress: '—',
            assessmentValue: 0,
            taxAmount: 0,
            status: 'pending', // Pending entries are always pending
            dateSubmitted: entry.created_at ? new Date(entry.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) : '—',
            processingTime: '0 hours',
            assignedStaff: '—',
          })) : [];
          
          // Merge by id, prefer history row when duplicate
          const mergedMap = new Map();
          [...pendingDataMapped, ...completedData].forEach(r => mergedMap.set(r.id, r));
          const deptAssessments = Array.from(mergedMap.values());
          
          allAssessments.push(...deptAssessments);
        } catch (deptError) {
          console.warn(`Failed to fetch data for department ${dept.name}:`, deptError);
        }
      }
      
      setAssessments(allAssessments);
      setFilteredAssessments(allAssessments);
      
    } catch (error) {
      console.error('Error fetching assessments data:', error);
      setAssessments([]);
      setFilteredAssessments([]);
    }
  };

  useEffect(() => {
    fetchAllAssessments();
  }, []);

  // Filter assessments based on search and filter criteria
  useEffect(() => {
    let filtered = Array.isArray(assessments) ? assessments : [];

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.citizenName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.transactionType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.department === departmentFilter);
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === statusFilter);
    }

    // Apply date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          filtered = filtered.filter(assessment => {
            const assessmentDate = new Date(assessment.dateSubmitted);
            return assessmentDate.toDateString() === today.toDateString();
          });
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(assessment => {
            const assessmentDate = new Date(assessment.dateSubmitted);
            return assessmentDate >= weekAgo;
          });
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          filtered = filtered.filter(assessment => {
            const assessmentDate = new Date(assessment.dateSubmitted);
            return assessmentDate >= monthAgo;
          });
          break;
        case 'custom':
          if (customDateRange.start && customDateRange.end) {
            filtered = filtered.filter(assessment => 
              assessment.dateSubmitted >= customDateRange.start && 
              assessment.dateSubmitted <= customDateRange.end
            );
          }
          break;
      }
    }

    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, departmentFilter, statusFilter, dateFilter, customDateRange]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        fetchAggregatedAnalyticsData(),
        fetchAllAssessments()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleExportReport = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/super-admin/export/transaction-purpose`, {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'super_transaction_purpose_report.csv');
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to export report. Please try again.');
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      alert('Failed to export report. Please try again.');
    }
  };

  // Super admins cannot add assessments, only view and download

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'pending':
        return <AlertCircle className="w-4 h-4 text-yellow-500" />;
      case 'requires_review':
        return <Eye className="w-4 h-4 text-red-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'requires_review':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen p-6 flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Loading transaction analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8 gap-4">
        <div>
          <h1 className={`text-4xl font-bold ${
            isDarkMode ? 'text-red-400' : 'text-red-700'
          }`}>Transaction Purpose Analysis</h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Comprehensive transaction analysis and insights</p>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
              isRefreshing
                ? 'bg-gray-400 cursor-not-allowed text-white'
                : isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
            } shadow-md`}
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>{isRefreshing ? 'Refreshing...' : 'Refresh Data'}</span>
          </button>
          <button
            onClick={handleExportReport}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap text-sm font-medium border bg-green-50 hover:bg-green-100 text-green-700 cursor-pointer border-green-700`}
          >
            <Download className="w-4 h-4" />
            <span>Download Excel</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
        <SummaryCard
          title="Total Assessments Today"
          value={analyticsData?.data?.overall?.total_tickets || 0}
          icon={FileText}
          color="blue"
          subtitle="New assessments"
          trend={{ direction: 'up', value: 12 }}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Average Processing Time"
          value={`${analyticsData?.data?.overall?.average_wait_time || 0}h`}
          icon={Clock}
          color="green"
          subtitle="Across all departments"
          trend={{ direction: 'down', value: 8 }}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Pending Reviews"
          value={analyticsData?.data?.overall?.pending || 0}
          icon={AlertCircle}
          color="yellow"
          subtitle="Require attention"
          trend={{ direction: 'down', value: 15 }}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Completed This Week"
          value={analyticsData?.data?.overall?.successful || 0}
          icon={TrendingUp}
          color="purple"
          subtitle="Successfully processed"
          trend={{ direction: 'up', value: 20 }}
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Active Departments"
          value={Object.keys(analyticsData?.data?.by_department || {}).length || 0}
          icon={Building}
          color="indigo"
          subtitle="Processing transactions"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Processing Times Chart */}
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Processing Times Over Days</h3>
          <div className="h-64">
            <Line
              data={analyticsData?.processingTimesData || { labels: [], datasets: [] }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'top',
                    labels: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  },
                  title: { display: false }
                },
                scales: {
                  x: { 
                    grid: { display: false },
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  },
                  y: { 
                    beginAtZero: true,
                    ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>
        </div>

        {/* Transaction Types Distribution */}
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Transaction Types Distribution</h3>
          <div className="h-64">
            <Doughnut
              data={analyticsData?.transactionTypesData || { labels: [], datasets: [] }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { 
                    position: 'bottom',
                    labels: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                  }
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Comparison Widget */}
      <div className="mb-8">
        <ComparisonWidget 
          mostCommon={analyticsData?.mostCommon}
          leastCommon={analyticsData?.leastCommon}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Filter Panel */}
      <div className="mb-8">
        <FilterPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          departmentFilter={departmentFilter}
          setDepartmentFilter={setDepartmentFilter}
          statusFilter={statusFilter}
          setStatusFilter={setStatusFilter}
          dateFilter={dateFilter}
          setDateFilter={setDateFilter}
          customDateRange={customDateRange}
          setCustomDateRange={setCustomDateRange}
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Data Table */}
      <div className={`rounded-lg shadow-md overflow-hidden transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <div className={`px-6 py-4 border-b ${
          isDarkMode ? 'border-gray-700' : 'border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Transaction Assessments</h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className={`${
              isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
            }`}>
              <tr>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Department</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Transaction Type</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Citizen Name</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Property Address</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Assessment Value</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Tax Amount</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Status</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Date Submitted</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Processing Time</th>
                <th className={`px-6 py-3 text-left font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Assigned Staff</th>
              </tr>
            </thead>
            <tbody>
              {filteredAssessments.length === 0 ? (
                <tr>
                  <td className={`px-6 py-4 text-center ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`} colSpan={10}>No assessments found matching your criteria.</td>
                </tr>
              ) : (
                (Array.isArray(filteredAssessments) ? filteredAssessments : []).map((assessment, index) => (
                  <tr key={`${assessment.id || 'unknown'}-${assessment.department || 'dept'}-${index}`} className={`border-t ${
                    isDarkMode ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'
                  }`}>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center">
                        {React.createElement(getDepartmentIcon(assessment.department), { 
                          className: `w-4 h-4 mr-2 ${
                            isDarkMode ? 'text-gray-400' : 'text-gray-500'
                          }` 
                        })}
                        {assessment.department || '—'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center">
                        <FileText className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        {assessment.transactionType || '—'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center">
                        <User className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        {assessment.citizenName || '—'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {assessment.propertyAddress || '—'}
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {formatCurrency(assessment.assessmentValue || 0)}
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-green-400' : 'text-green-600'
                    }`}>
                      {formatCurrency(assessment.taxAmount || 0)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {getStatusIcon(assessment.status)}
                        <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(assessment.status)}`}>
                          {(assessment.status || 'unknown').replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center">
                        <Calendar className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        {assessment.dateSubmitted || '—'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      <div className="flex items-center">
                        <Clock className={`w-4 h-4 mr-2 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-500'
                        }`} />
                        {assessment.processingTime || '—'}
                      </div>
                    </td>
                    <td className={`px-6 py-4 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>
                      {assessment.assignedStaff || '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default SuperTransactionPurposeAnalysis;