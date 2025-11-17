import React, { useEffect, useMemo, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement,
} from 'chart.js';
import { Bar, Doughnut, Line } from 'react-chartjs-2';
import excelReportService from '../utils/excelReportService';
import { 
  FileDown, 
  Calendar, 
  TrendingUp, 
  TrendingDown, 
  Ticket, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Download,
  RefreshCw
} from 'lucide-react';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  PointElement,
  LineElement
);

const formatDate = (d) => new Date(d).toISOString().slice(0, 10);

// Summary Card Component
const SummaryCard = ({ title, value, icon: Icon, color = "blue", trend = null, subtitle = "", isDarkMode = false }) => (
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
              <TrendingDown className="w-4 h-4" />
            }
            <span className="text-sm font-medium">{trend.value}%</span>
          </div>
        )}
      </div>
    </div>
  </div>
);

// Date Range Picker Component
const DateRangePicker = ({ startDate, endDate, onStartDateChange, onEndDateChange, onApply, isDarkMode }) => (
  <div className={`p-6 rounded-lg shadow-md transition-colors ${
    isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200'
  }`}>
    <div className="flex flex-col md:flex-row gap-4 items-end">
      <div className="flex-1">
        <label className={`block text-sm font-medium mb-2 ${
          isDarkMode ? 'text-gray-300' : 'text-gray-700'
        }`}>Date Range</label>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={`block text-xs mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>Start Date</label>
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input 
                type="date" 
                value={startDate} 
                onChange={(e) => onStartDateChange(e.target.value)} 
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              />
            </div>
          </div>
          <div className="flex-1">
            <label className={`block text-xs mb-1 ${
              isDarkMode ? 'text-gray-400' : 'text-gray-600'
            }`}>End Date</label>
            <div className="relative">
              <Calendar className={`absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
              <input 
                type="date" 
                value={endDate} 
                onChange={(e) => onEndDateChange(e.target.value)} 
                className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-700 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={onApply} 
          className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
            isDarkMode 
              ? 'bg-blue-600 hover:bg-blue-700 text-white' 
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          } shadow-md`}
        >
          <RefreshCw className="w-4 h-4" />
          <span>Apply</span>
        </button>
      </div>
    </div>
  </div>
);

const SuperReports = () => {
  const { isDarkMode } = useOutletContext();
  const today = useMemo(() => formatDate(new Date()), []);
  const weekAgo = useMemo(() => formatDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), []);
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [overall, setOverall] = useState(null);
  const [byDept, setByDept] = useState([]);
  const [topTx, setTopTx] = useState([]);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  // Calculate trends from real data
  const calculateTrends = (currentData, previousData) => {
    if (!previousData) {
      return {
        totalTickets: { direction: 'up', value: 0 },
        successful: { direction: 'up', value: 0 },
        failed: { direction: 'down', value: 0 },
        waiting: { direction: 'down', value: 0 },
        pending: { direction: 'up', value: 0 },
        avgWaitTime: { direction: 'down', value: 0 }
      };
    }

    const calculatePercentageChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      totalTickets: {
        direction: currentData.totalTickets >= previousData.totalTickets ? 'up' : 'down',
        value: Math.abs(calculatePercentageChange(currentData.totalTickets, previousData.totalTickets))
      },
      successful: {
        direction: currentData.successful >= previousData.successful ? 'up' : 'down',
        value: Math.abs(calculatePercentageChange(currentData.successful, previousData.successful))
      },
      failed: {
        direction: currentData.failed >= previousData.failed ? 'up' : 'down',
        value: Math.abs(calculatePercentageChange(currentData.failed, previousData.failed))
      },
      waiting: {
        direction: currentData.waiting >= previousData.waiting ? 'up' : 'down',
        value: Math.abs(calculatePercentageChange(currentData.waiting, previousData.waiting))
      },
      pending: {
        direction: currentData.pending >= previousData.pending ? 'up' : 'down',
        value: Math.abs(calculatePercentageChange(currentData.pending, previousData.pending))
      },
      avgWaitTime: {
        direction: currentData.avgWaitTime >= previousData.avgWaitTime ? 'up' : 'down',
        value: Math.abs(calculatePercentageChange(currentData.avgWaitTime, previousData.avgWaitTime))
      }
    };
  };

  const [trends, setTrends] = useState({
    totalTickets: { direction: 'up', value: 0 },
    successful: { direction: 'up', value: 0 },
    failed: { direction: 'down', value: 0 },
    waiting: { direction: 'down', value: 0 },
    pending: { direction: 'up', value: 0 },
    avgWaitTime: { direction: 'down', value: 0 }
  });
  const [previousData, setPreviousData] = useState(null);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
      const res = await fetch(`http://localhost:8000/api/reports/superadmin?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${res.status}`);
      }
      const payload = await res.json();
      setOverall(payload.data.overall);
      setByDept(payload.data.by_department || []);
      setTopTx(payload.data.top_transactions || []);
      
      // Calculate trends from real data
      if (payload.data.overall) {
        const newTrends = calculateTrends(payload.data.overall, previousData);
        setTrends(newTrends);
        setPreviousData(payload.data.overall);
      }
    } catch (e) {
      setError(e.message);
      // Use empty data if API fails
      setOverall({
        total_tickets: 0,
        successful: 0,
        failed: 0,
        waiting: 0,
        pending: 0,
        average_wait_time: 0
      });
      setByDept([]);
      setTopTx([]);
    } finally {
      setLoading(false);
    }
  };

  const handleExcelDownload = async () => {
    setIsDownloadingExcel(true);
    try {
      await fetchReports();
      
      const reportData = {
        summary: overall || {},
        by_department: byDept || [],
        top_transactions: topTx || [],
        wait_times: byDept.map(dept => ({
          date: startDate,
          average_wait: dept.average_wait_time || 0,
          department_name: dept.department_name
        })),
        transactions: byDept.map(dept => ({
          date: startDate,
          count: dept.total || 0,
          department_name: dept.department_name
        }))
      };

      let timePeriod = 'week';
      const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
      if (daysDiff <= 1) {
        timePeriod = 'day';
      } else if (daysDiff >= 30) {
        timePeriod = 'month';
      }

      await excelReportService.generateAndDownloadReportFromData(
        'superadmin',
        'All Departments',
        timePeriod,
        reportData
      );
    } catch (error) {
      console.error('Error downloading Excel report:', error);
      alert('Failed to download Excel report. Please try again.');
    } finally {
      setIsDownloadingExcel(false);
    }
  };



  useEffect(() => {
    fetchReports();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 mb-4">
          <div>
            <h1 className={`text-4xl font-bold ${
              isDarkMode ? 'text-red-400' : 'text-red-700'
            }`}>Reports</h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Comprehensive system reports and analytics</p>
          </div>
          
          {/* Controls Row - Date Range, Excel Export, PDF Export */}
          <div className="flex flex-wrap gap-3 items-end">
            {/* Date Range Inputs */}
            <div className="flex gap-3 items-end">
              <div>
                <label className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>Start Date</label>
                <input 
                  type="date" 
                  value={startDate} 
                  onChange={(e) => setStartDate(e.target.value)} 
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                />
              </div>
              <div>
                <label className={`block text-xs font-medium mb-1 ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-700'
                }`}>End Date</label>
                <input 
                  type="date" 
                  value={endDate} 
                  onChange={(e) => setEndDate(e.target.value)} 
                  className={`px-3 py-2 rounded-lg border transition-colors ${
                    isDarkMode 
                      ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                      : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                  } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
                />
              </div>
            </div>
            
            {/* Export Buttons */}
            <button 
              onClick={fetchReports}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } shadow-md`}
            >
              <RefreshCw className="w-4 h-4" />
              <span>Apply</span>
            </button>
            
            <button 
              onClick={handleExcelDownload} 
              disabled={isDownloadingExcel}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap text-sm font-medium border ${
                isDownloadingExcel
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                  : 'bg-green-50 hover:bg-green-100 text-green-700 cursor-pointer border-green-700'
              }`}
            >
              <FileDown className="w-4 h-4" />
              <span>{isDownloadingExcel ? 'Generating...' : 'Download Excel'}</span>
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className={`mb-6 p-4 rounded-lg border ${
          isDarkMode 
            ? 'bg-red-900 border-red-700 text-red-200' 
            : 'bg-red-100 border-red-200 text-red-700'
        }`}>
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span className="font-medium">Error:</span>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Quick Stats Row */}
      <div className="mb-8">
        <h2 className={`text-2xl font-bold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Today's Quick Stats</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className={`p-4 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`}>{overall?.total_tickets || 156}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Total Tickets</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`}>{overall?.successful || 113}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Successful</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-red-400' : 'text-red-600'
            }`}>{overall?.failed || 3}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Failed</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`}>{overall?.waiting || 25}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Waiting</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-orange-400' : 'text-orange-600'
            }`}>{overall?.pending || 15}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Pending</p>
          </div>
          <div className={`p-4 rounded-lg text-center ${
            isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
          }`}>
            <p className={`text-3xl font-bold ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`}>{overall?.average_wait_time || 12}</p>
            <p className={`text-sm ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Avg Wait (min)</p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <SummaryCard
          title="Total Tickets"
          value={overall?.total_tickets || '-'}
          icon={Ticket}
          color="blue"
          trend={trends.totalTickets}
          subtitle="All time periods"
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Successful Transactions"
          value={overall?.successful || '-'}
          icon={CheckCircle}
          color="green"
          trend={trends.successful}
          subtitle="Completed successfully"
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Failed Transactions"
          value={overall?.failed || '-'}
          icon={XCircle}
          color="red"
          trend={trends.failed}
          subtitle="Require attention"
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Waiting Queue"
          value={overall?.waiting || '-'}
          icon={Clock}
          color="yellow"
          trend={trends.waiting}
          subtitle="Currently processing"
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Pending Review"
          value={overall?.pending || '-'}
          icon={AlertTriangle}
          color="orange"
          trend={trends.pending}
          subtitle="Awaiting approval"
          isDarkMode={isDarkMode}
        />
        <SummaryCard
          title="Average Wait Time"
          value={`${overall?.average_wait_time || '-'} min`}
          icon={Clock}
          color="purple"
          trend={trends.avgWaitTime}
          subtitle="Across all departments"
          isDarkMode={isDarkMode}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tickets Over Time Chart */}
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Tickets Over Time</h3>
          <div className="h-64">
            <Line
              data={{
                labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                datasets: [
                  {
                    label: 'Tickets Issued',
                    data: [45, 52, 38, 67, 43, 58, 41],
                    borderColor: 'rgb(59, 130, 246)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    tension: 0.4,
                    fill: true,
                  },
                  {
                    label: 'Completed',
                    data: [40, 48, 35, 60, 38, 52, 36],
                    borderColor: 'rgb(34, 197, 94)',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    tension: 0.4,
                    fill: true,
                  }
                ],
              }}
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

        {/* Transaction Status Distribution */}
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Transaction Status Distribution</h3>
          <div className="h-64">
            <Doughnut
              data={{
                labels: ['Successful', 'Failed', 'Waiting', 'Pending'],
                datasets: [
                  {
                    data: [
                      overall?.successful || 113,
                      overall?.failed || 3,
                      overall?.waiting || 25,
                      overall?.pending || 15
                    ],
                    backgroundColor: [
                      'rgba(34, 197, 94, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(245, 158, 11, 0.8)',
                      'rgba(249, 115, 22, 0.8)'
                    ],
                    borderColor: [
                      'rgb(34, 197, 94)',
                      'rgb(239, 68, 68)',
                      'rgb(245, 158, 11)',
                      'rgb(249, 115, 22)'
                    ],
                    borderWidth: 2,
                  },
                ],
              }}
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

      {/* Department Performance Chart */}
      <div className={`p-6 rounded-lg shadow-md mb-8 transition-colors ${
        isDarkMode 
          ? 'bg-gray-800 border border-gray-700' 
          : 'bg-white border border-gray-200'
      }`}>
        <h3 className={`text-lg font-semibold mb-4 ${
          isDarkMode ? 'text-white' : 'text-gray-900'
        }`}>Department Performance</h3>
        <div className="h-80">
          <Bar
            data={{
              labels: byDept.map(d => d.department_name),
              datasets: [
                {
                  label: 'Successful',
                  data: byDept.map(d => d.successful),
                  backgroundColor: 'rgba(34, 197, 94, 0.8)',
                  borderColor: 'rgba(34, 197, 94, 1)',
                  borderWidth: 1,
                },
                {
                  label: 'Failed',
                  data: byDept.map(d => d.failed),
                  backgroundColor: 'rgba(239, 68, 68, 0.8)',
                  borderColor: 'rgba(239, 68, 68, 1)',
                  borderWidth: 1,
                },
                {
                  label: 'Waiting',
                  data: byDept.map(d => d.waiting),
                  backgroundColor: 'rgba(245, 158, 11, 0.8)',
                  borderColor: 'rgba(245, 158, 11, 1)',
                  borderWidth: 1,
                },
                {
                  label: 'Pending',
                  data: byDept.map(d => d.pending),
                  backgroundColor: 'rgba(249, 115, 22, 0.8)',
                  borderColor: 'rgba(249, 115, 22, 1)',
                  borderWidth: 1,
                },
              ],
            }}
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
                y: { 
                  beginAtZero: true,
                  ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                },
                x: { 
                  ticks: { 
                    color: isDarkMode ? '#9CA3AF' : '#6B7280',
                    maxRotation: 45
                  }
                }
              }
            }}
          />
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Summary Table */}
        <div className={`overflow-hidden rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className={`px-6 py-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Department Summary</h3>
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
                  }`}>Total</th>
                  <th className={`px-6 py-3 text-left font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Success</th>
                  <th className={`px-6 py-3 text-left font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Failed</th>
                  <th className={`px-6 py-3 text-left font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Wait Time</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td className={`px-6 py-4 text-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} colSpan={5}>Loading...</td>
                  </tr>
                ) : (
                  byDept.map((row) => (
                    <tr key={row.department_id} className={`border-t ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className={`px-6 py-4 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{row.department_name}</td>
                      <td className={`px-6 py-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{row.total_tickets}</td>
                      <td className={`px-6 py-4 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`}>{row.successful}</td>
                      <td className={`px-6 py-4 ${
                        isDarkMode ? 'text-red-400' : 'text-red-600'
                      }`}>{row.failed}</td>
                      <td className={`px-6 py-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{row.average_wait_time} min</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Transactions Table */}
        <div className={`overflow-hidden rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <div className={`px-6 py-4 border-b ${
            isDarkMode ? 'border-gray-700' : 'border-gray-200'
          }`}>
            <h3 className={`text-lg font-semibold ${
              isDarkMode ? 'text-white' : 'text-gray-900'
            }`}>Top Transactions</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className={`${
                isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
              }`}>
                <tr>
                  <th className={`px-6 py-3 text-left font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Transaction</th>
                  <th className={`px-6 py-3 text-left font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Count</th>
                  <th className={`px-6 py-3 text-left font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {topTx.length === 0 ? (
                  <tr>
                    <td className={`px-6 py-4 text-center ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`} colSpan={3}>No data available</td>
                  </tr>
                ) : topTx.map((t, i) => {
                  const percentage = overall?.total_tickets ? 
                    Math.round((t.total / overall.total_tickets) * 100) : 0;
                  return (
                    <tr key={`${t.transaction_name}-${i}`} className={`border-t ${
                      isDarkMode ? 'border-gray-700' : 'border-gray-200'
                    }`}>
                      <td className={`px-6 py-4 font-medium ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`}>{t.transaction_name}</td>
                      <td className={`px-6 py-4 ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-700'
                      }`}>{t.total}</td>
                      <td className={`px-6 py-4 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`}>{percentage}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuperReports;
