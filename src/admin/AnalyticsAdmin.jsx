import React, { useState, useEffect } from 'react';
import { useRef } from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import { useNavigate } from 'react-router-dom';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { jsPDF } from 'jspdf';
import RealTimeAnalytics from '../components/RealTimeAnalytics';
import AnalyticsComparison from '../components/AnalyticsComparison';
import SortableTable from '../components/SortableTable';
import historicalService from '../utils/historicalAnalyticsService';
import excelReportService from '../utils/excelReportService';
import {
  BarChart3,
  LineChart,
  PieChart,
  TrendingUp,
  Clock,
  Users,
  XCircle,
  Monitor,
  Smartphone,
  Calendar,
  ArrowLeft,
  FileText,
  Download,
  AlertTriangle,
  FileDown,
  Activity
} from 'lucide-react';

// Historical analytics now uses real data from the database

const StatCard = ({ title, value, icon: Icon, color = "blue", isLoading = false }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between">
      <div>
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
    {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 animate-pulse mt-2 rounded-md"></div>
    ) : (
          <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
    )}
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const periods = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: '6months', label: '6 Months' },
    { value: 'year', label: 'Year' }
  ];

  return (
    <div className="flex space-x-2 bg-white p-2 rounded-lg shadow-sm">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedPeriod === period.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

const TransactionSelector = ({ transactions, selectedTransaction, onTransactionChange }) => {
  return (
    <select
      value={selectedTransaction ? selectedTransaction.id : ''}
      onChange={(e) => {
        const value = e.target.value;
        if (value === '') {
          onTransactionChange(null);
        } else {
          const transaction = transactions.find(t => t.id === value);
          onTransactionChange(transaction);
        }
      }}
      className="px-2 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs font-medium text-gray-700"
      style={{ minWidth: '100px', maxWidth: '160px' }}
    >
      <option value="">All Transactions</option>
      {transactions && transactions.length > 0 && transactions.map((transaction) => (
        <option key={transaction.id} value={transaction.id}>
          {transaction.name}
        </option>
      ))}
    </select>
  );
};

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ChartTitle, Tooltip, Legend, Filler);

const ChartComponent = ({ data, title, type = "line", color = "blue", multiDatasets = null, labelsOverride = null, legendPosition = 'top' }) => {
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({ responsive: true, maintainAspectRatio: false });
  const useExternalLegend = legendPosition === 'right';
  const chartRef = useRef(null);
  const [legendTick, setLegendTick] = useState(0);

  useEffect(() => {
    if (multiDatasets && multiDatasets.length > 0) {
      const labels = (labelsOverride && labelsOverride.length ? labelsOverride : [])
        .map(d => new Date(d))
        .map(date => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }));
      const processedData = {
        labels,
        datasets: multiDatasets.map(ds => ({
          label: ds.label,
          data: ds.data,
          backgroundColor: ds.backgroundColor,
          borderColor: ds.borderColor || ds.backgroundColor,
          borderWidth: 1,
        }))
      };
      setChartData(processedData);
      const extraRightPadding = 0;
      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: !useExternalLegend, 
            position: legendPosition,
            align: 'start',
            labels: {
              boxWidth: 14,
              boxHeight: 14,
              padding: 10,
              font: { size: 11 }
            }
          },
          title: { display: true, text: title }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        },
        layout: { padding: { right: extraRightPadding } }
      });
    } else if (data && data.length > 0) {
      const processedData = {
        labels: data.map(item => {
          const date = new Date(item.date);
          return date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric',
            year: 'numeric'
          });
        }),
        datasets: [{
          label: title,
          data: data.map(item => type === 'line' ? item.avgWait : item.count),
          borderColor: color === 'red' ? 'rgb(239, 68, 68)' : 
                      color === 'green' ? 'rgb(34, 197, 94)' : 
                      color === 'blue' ? 'rgb(59, 130, 246)' : 
                      color === 'yellow' ? 'rgb(234, 179, 8)' : 'rgb(99, 102, 241)',
          backgroundColor: color === 'red' ? 'rgba(239, 68, 68, 0.3)' : 
                          color === 'green' ? 'rgba(34, 197, 94, 0.3)' : 
                          color === 'blue' ? 'rgba(59, 130, 246, 0.3)' : 
                          color === 'yellow' ? 'rgba(234, 179, 8, 0.3)' : 'rgba(99, 102, 241, 0.3)',
          borderWidth: 2,
          tension: 0.4,
          fill: type === 'line'
        }]
      };
      setChartData(processedData);
      const extraRightPadding = 0;
      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            display: !useExternalLegend, 
            position: legendPosition,
            align: 'start',
            labels: {
              boxWidth: 14,
              boxHeight: 14,
              padding: 10,
              font: { size: 11 }
            }
          },
          title: { display: true, text: title }
        },
        scales: type === 'line' ? {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        } : {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        },
        layout: { padding: { right: extraRightPadding } }
      });
    } else {
      setChartData(null);
    }
  }, [data, title, type, color, multiDatasets, labelsOverride]);

  if (!chartData || chartData.datasets[0].data.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No data available for this period</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {useExternalLegend ? (
        <div className="flex gap-6 items-start">
          <div className="h-80 flex-1">
            {type === 'line' ? (
              <Line ref={chartRef} data={chartData} options={chartOptions} />
            ) : (
              <Bar ref={chartRef} data={chartData} options={chartOptions} />
            )}
          </div>
          <div className="w-72 max-w-xs">
            <ul className="space-y-2">
              {(chartData?.datasets || []).map((ds, idx) => {
                const visible = chartRef.current ? chartRef.current.isDatasetVisible(idx) : true;
                return (
                  <li
                    key={idx}
                    className={`flex items-start gap-2 text-sm leading-snug break-words cursor-pointer select-none ${visible ? '' : 'opacity-50 line-through'}`}
                    onClick={() => {
                      const chart = chartRef.current;
                      if (!chart) return;
                      const currentlyVisible = chart.isDatasetVisible(idx);
                      chart.setDatasetVisibility(idx, !currentlyVisible);
                      chart.update();
                      setLegendTick(v => v + 1);
                    }}
                  >
                    <span
                      className="inline-block mt-1 rounded"
                      style={{ width: 14, height: 14, backgroundColor: ds.backgroundColor, border: `1px solid ${ds.borderColor || ds.backgroundColor}` }}
                    />
                    <span className="text-gray-600">{ds.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      ) : (
        <div className="h-64">
          {type === 'line' ? (
            <Line ref={chartRef} data={chartData} options={chartOptions} />
          ) : (
            <Bar ref={chartRef} data={chartData} options={chartOptions} />
          )}
        </div>
      )}
    </div>
  );
};

// Multi-axis line chart for Failed Transactions vs Average Wait Time
const MultiAxisLineChart = ({ title, transactions = [], waitTimes = [] }) => {
  const hasData = (transactions && transactions.length) || (waitTimes && waitTimes.length);
  if (!hasData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No data available</div>
        </div>
      </div>
    );
  }

  const dateSet = new Set([
    ...(transactions || []).map(d => d.date),
    ...(waitTimes || []).map(d => d.date)
  ].filter(Boolean));
  const labels = Array.from(dateSet).sort((a, b) => new Date(a) - new Date(b));

  const txMap = new Map();
  (transactions || []).forEach(d => txMap.set(d.date, d.count || 0));
  const waitMap = new Map();
  (waitTimes || []).forEach(d => waitMap.set(d.date, d.avgWait || 0));

  const data = {
    labels,
    datasets: [
      {
        label: 'Failed Transactions',
        data: labels.map(l => txMap.get(l) || 0),
        borderColor: 'rgb(99, 102, 241)',
        backgroundColor: 'rgba(99, 102, 241, 0.25)',
        tension: 0.3,
        pointRadius: 4,
        pointHoverRadius: 6,
        pointBackgroundColor: 'rgb(99, 102, 241)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        showLine: true,
        yAxisID: 'y'
      },
      {
        label: 'Avg Wait (min)',
        data: labels.map(l => waitMap.get(l) || 0),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.15)',
        tension: 0.3,
        yAxisID: 'y1'
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: true, text: title }
    },
    scales: {
      x: { grid: { display: false } },
      y: {
        type: 'linear',
        display: true,
        position: 'left',
        beginAtZero: true,
        title: { display: true, text: 'Count' }
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: { drawOnChartArea: false },
        beginAtZero: true,
        title: { display: true, text: 'Minutes' }
      }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-96">
        <Line data={data} options={options} />
      </div>
    </div>
  );
};

const CancellationReasonsChart = ({ reasons }) => {
  if (!reasons || reasons.length === 0) return null;

  const totalCancellations = reasons.reduce((sum, reason) => sum + reason.count, 0);
  const maxCount = Math.max(...reasons.map(r => r.count));

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Cancellation Reasons Analysis</h3>
      <div className="space-y-4">
        {reasons.map((reason, index) => (
          <div key={index} className="border-b border-gray-200 pb-3 last:border-b-0">
            <div className="flex justify-between items-center mb-2">
              <h4 className="font-medium text-gray-800 text-sm">
                {reason.reason}
              </h4>
              <div className="text-sm text-gray-500">
                {reason.count} ({((reason.count / totalCancellations) * 100).toFixed(1)}%)
              </div>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div 
                className="bg-red-500 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(reason.count / maxCount) * 100}%` }}
              ></div>
            </div>
            {/* Display detailed reason with better formatting */}
            {reason.reason !== "System Error" && 
             reason.reason !== "User Cancellation" && 
             reason.reason !== "Other" && (
              <div className="mt-1 text-xs text-gray-600 italic bg-red-50 p-2 rounded-md">
                <span className="font-semibold">Reason:</span> "{reason.reason}"
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Total Cancellations:</strong> {totalCancellations}
        </p>
      </div>
    </div>
  );
};

const KioskUsageChart = ({ webKiosk, physicalKiosk }) => {
  const total = webKiosk + physicalKiosk;
  const webPercentage = total > 0 ? (webKiosk / total) * 100 : 0;
  const physicalPercentage = total > 0 ? (physicalKiosk / total) * 100 : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Kiosk Usage Distribution</h3>
      <div className="flex items-center space-x-4">
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Web Kiosk</span>
            <span className="text-sm text-gray-500">{webKiosk} ({webPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-blue-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${webPercentage}%` }}
            ></div>
          </div>
        </div>
        <div className="flex-1">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Physical Kiosk</span>
            <span className="text-sm text-gray-500">{physicalKiosk} ({physicalPercentage.toFixed(1)}%)</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div 
              className="bg-green-500 h-3 rounded-full transition-all duration-300"
              style={{ width: `${physicalPercentage}%` }}
            ></div>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-center mt-4 space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Web Kiosk</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
          <span className="text-sm text-gray-600">Physical Kiosk</span>
        </div>
      </div>
    </div>
  );
};

const TransactionComparisonChart = ({ transactions, analyticsData }) => {
  if (!transactions || transactions.length === 0) return null;

  const transactionStats = transactions.map(transaction => {
    const data = analyticsData?.byTransaction?.[transaction.name];
    const lastTx = data?.transactions && data.transactions.length ? data.transactions[data.transactions.length - 1].count : 0;
    const lastWait = data?.waitTimes && data.waitTimes.length ? data.waitTimes[data.waitTimes.length - 1].avgWait : 0;
    const lastCancel = data?.canceledTransactions && data.canceledTransactions.length ? data.canceledTransactions[data.canceledTransactions.length - 1].count : 0;
    return {
      name: transaction.name,
      totalTransactions: lastTx || 0,
      avgWaitTime: lastWait || 0,
      canceledTransactions: lastCancel || 0
    };
  });

  const labels = transactionStats.map(t => t.name);
  const txValues = transactionStats.map(t => t.totalTransactions);
  const waitValues = transactionStats.map(t => t.avgWaitTime);
  const cancelValues = transactionStats.map(t => t.canceledTransactions);

  const chartData = {
    labels,
    datasets: [
      {
        label: 'Transactions',
        data: txValues,
        backgroundColor: 'rgba(16, 185, 129, 0.6)',
        borderColor: 'rgb(16, 185, 129)',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 16
      },
      {
        label: 'Avg Wait Time (min)',
        data: waitValues,
        backgroundColor: 'rgba(59, 130, 246, 0.6)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 16
      },
      {
        label: 'Canceled',
        data: cancelValues,
        backgroundColor: 'rgba(239, 68, 68, 0.6)',
        borderColor: 'rgb(239, 68, 68)',
        borderWidth: 1,
        borderRadius: 6,
        barThickness: 16
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    indexAxis: 'y',
    plugins: {
      legend: { display: true, position: 'top' },
      title: { display: false }
    },
    scales: {
      x: { beginAtZero: true, grid: { display: true }, ticks: { precision: 0 }, stacked: true },
      y: { grid: { display: false }, stacked: true }
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaction Performance Comparison</h3>
      <div className="h-96">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

const DownloadButton = ({ onClick, children, variant = "primary" }) => {
  const baseClasses = "flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200";
  const variantClasses = {
    primary: "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg",
    secondary: "bg-gray-500 hover:bg-gray-600 text-white shadow-md hover:shadow-lg"
  };

  return (
    <button
      onClick={onClick}
      className={`${baseClasses} ${variantClasses[variant]}`}
    >
      {children}
    </button>
  );
};

const AnalyticsAdmin = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const navigate = useNavigate();
  const { departments } = useDepartments();
  
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAllTransactionLogs, setShowAllTransactionLogs] = useState(false);
  const [showRealTime, setShowRealTime] = useState(false);
  const [showComparison, setShowComparison] = useState(false);
  const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [availableReasons, setAvailableReasons] = useState([]);
  const [selectedReason, setSelectedReason] = useState('');
  const lastSeenUpdateTsRef = useRef(null);
  const lastSeenQueueNumberRef = useRef(null);
  const isFetchingRef = useRef(false);

  // Resolve admin's department from JWT token first, then fall back to user object
  const token = localStorage.getItem('token');
  const decodeJwtPayload = (t) => {
    try {
      if (!t || t.split('.').length !== 3) return null;
      const b64 = t.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      const json = decodeURIComponent(atob(b64).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
      return JSON.parse(json);
    } catch (_) {
      return null;
    }
  };
  const payload = decodeJwtPayload(token);
  const depIdFromToken = payload?.department_id ?? payload?.departmentId ?? payload?.dept_id ?? payload?.deptId ?? null;
  const depNameFromToken = payload?.department ?? payload?.dept ?? null;

  const assignedDepartment = depIdFromToken
    ? departments.find(dept => String(dept.id) === String(depIdFromToken))
    : departments.find(dept => dept.name === depNameFromToken) || departments.find(dept => dept.name === user?.department);
  const assignedDepartmentId = assignedDepartment?.id;

  // Determine access but do not early-return before hooks to preserve hooks order
  const denyAccess = (user?.role === 'admin') && !assignedDepartmentId;

  // Handle initialization loading
  useEffect(() => {
    // If we have a department, stop loading immediately
    if (assignedDepartmentId) {
      setIsInitializing(false);
      return;
    }

    // If departments are loaded and we're an admin but no department found, stop loading
    if (user?.role === 'admin' && departments.length > 0 && !assignedDepartmentId) {
      setIsInitializing(false);
      return;
    }

    // If we're not an admin, stop loading (super admin or other roles)
    if (user?.role !== 'admin') {
      setIsInitializing(false);
      return;
    }

    // If we don't have user data yet, keep loading
    if (!user) {
      return;
    }

    // If departments are still loading (length is 0), keep loading
    if (departments.length === 0) {
      return;
    }

    // Give some time for departments to load and token to be processed
    const timer = setTimeout(() => {
      setIsInitializing(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, [assignedDepartmentId, user?.role, departments.length, user]);

  useEffect(() => {
    if (assignedDepartmentId) {
      fetchAnalyticsData();
    }
  }, [assignedDepartmentId, selectedPeriod, selectedTransaction]);

  // Refresh only when there is a new backend update for this department
  useEffect(() => {
    if (!assignedDepartmentId || showRealTime) return;

    let isCancelled = false;
    const token = localStorage.getItem('token');

    const checkForUpdate = async () => {
      try {
        const res = await fetch(`http://localhost:8000/api/queue/latest-update/${assignedDepartmentId}`, {
          headers: {
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
          }
        });
        if (!res.ok) return;
        const json = await res.json();
        if (isCancelled) return;
        const backendTs = json?.timestamp || json?.updated_at || null;
        const backendQueueNumber = json?.queue_number || null;
        const lastSeenTs = lastSeenUpdateTsRef.current;
        const lastSeenQueue = lastSeenQueueNumberRef.current;
        const hasMeaningfulChange = (
          (backendQueueNumber && backendQueueNumber !== lastSeenQueue) ||
          (!backendQueueNumber && backendTs && backendTs !== lastSeenTs)
        );
        if (hasMeaningfulChange && !isFetchingRef.current) {
          lastSeenUpdateTsRef.current = backendTs || lastSeenTs;
          lastSeenQueueNumberRef.current = backendQueueNumber || lastSeenQueue;
          isFetchingRef.current = true;
          await fetchAnalyticsData();
          isFetchingRef.current = false;
        }
      } catch (_) {
        // ignore network errors
      }
    };

    // Initial check, then poll lightly
    checkForUpdate();
    const intervalId = setInterval(checkForUpdate, 15000);

    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [assignedDepartmentId, showRealTime]);

  const fetchAnalyticsData = async () => {
    if (!assignedDepartment) return;

    setIsLoading(true);
    setError(null);

    try {
      console.log('Fetching analytics data for department:', assignedDepartment.id);
      const historicalService = (await import('../utils/historicalAnalyticsService')).default;
      const rawData = await historicalService.getHistoricalData(
        assignedDepartment.id,
        selectedPeriod,
        selectedTransaction
      );
      
      console.log('Raw analytics data received:', rawData);
      const processedData = historicalService.processDataForCharts(rawData, selectedPeriod);
      console.log('Processed analytics data:', processedData);
      setAnalyticsData(processedData);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      
      // Handle specific error types
      if (err.code === 'ECONNABORTED' || err.message.includes('timeout')) {
        setError('Request timed out. The server is taking too long to respond. Please try again.');
      } else if (err.code === 'ERR_CONNECTION_RESET' || err.message.includes('ERR_CONNECTION_RESET')) {
        setError('Connection was reset. Please check your network connection and try again.');
      } else if (err.response?.status === 500) {
        setError('Server error occurred. Please try again later.');
      } else if (err.response?.status === 403) {
        setError('Access denied. You do not have permission to view this data.');
      } else {
        setError('Failed to load analytics data. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleExcelDownload = async () => {
    if (!assignedDepartment) {
      alert('No department selected');
      return;
    }

    setIsDownloadingCSV(true);
    try {
      await excelReportService.generateAndDownloadReport(
        assignedDepartment.id,
        assignedDepartment.name,
        selectedPeriod,
        selectedTransaction
      );
    } catch (error) {
      console.error('Error downloading Excel report:', error);
      alert('Failed to download Excel report. Please try again.');
    } finally {
      setIsDownloadingCSV(false);
    }
  };

  const fetchCancellationReasons = async () => {
    if (!assignedDepartmentId) return;

    // Use hardcoded cancellation reasons
    const hardcodedReasons = [
      'Unattended',
      'No Response from Client',
      'Incomplete Requirements',
      'Technical Issue',
      'Client Requested Cancellation',
      'System Error',
      'Time Limit Exceeded',
      'Duplicate Transaction',
      'Invalid Transaction'
    ];
    const allReasons = ['All Reasons', ...hardcodedReasons];
    setAvailableReasons(allReasons);
  };

  // Fetch cancellation reasons when department changes
  useEffect(() => {
    if (assignedDepartmentId) {
      fetchCancellationReasons();
    }
  }, [assignedDepartmentId]);

  const currentData = analyticsData?.overall || {
    transactions: [],
    waitTimes: [],
    canceledTransactions: [],
    failedTransactions: [],
    cancellationReasons: [],
    kioskUsage: { webKiosk: 0, physicalKiosk: 0 }
  };

  // Build multi-series data for "All Transactions" view (per transaction type colors)
  const palette = [
    { bg: 'rgba(59, 130, 246, 0.5)', stroke: 'rgb(59, 130, 246)' },     // blue
    { bg: 'rgba(16, 185, 129, 0.5)', stroke: 'rgb(16, 185, 129)' },     // emerald
    { bg: 'rgba(234, 179, 8, 0.5)', stroke: 'rgb(234, 179, 8)' },       // amber
    { bg: 'rgba(99, 102, 241, 0.5)', stroke: 'rgb(99, 102, 241)' },     // indigo
    { bg: 'rgba(244, 63, 94, 0.5)', stroke: 'rgb(244, 63, 94)' },       // rose
    { bg: 'rgba(20, 184, 166, 0.5)', stroke: 'rgb(20, 184, 166)' },     // teal
    { bg: 'rgba(168, 85, 247, 0.5)', stroke: 'rgb(168, 85, 247)' },     // purple
    { bg: 'rgba(234, 88, 12, 0.5)', stroke: 'rgb(234, 88, 12)' },       // orange
  ];

  const buildPerTypeSeries = (seriesKey, valueKey) => {
    if (!analyticsData?.byTransaction || selectedTransaction) return null;
    const byTx = analyticsData.byTransaction;
    const typeNames = Object.keys(byTx);
    if (typeNames.length === 0) return null;

    const labelDates = Array.from(new Set(typeNames.flatMap(name => ((byTx[name]?.[seriesKey] || []).map(d => d.date)))))
      .sort((a, b) => new Date(a) - new Date(b));

    const datasets = typeNames.map((name, idx) => {
      const series = byTx[name]?.[seriesKey] || [];
      const valueByDate = new Map(series.map(p => [p.date, (p?.[valueKey] ?? 0)]));
      const totalsum = series.reduce((s, p) => s + (p?.[valueKey] ?? 0), 0);
      const color = palette[idx % palette.length];
      return {
        label: name,
        data: labelDates.map(d => valueByDate.get(d) || 0),
        backgroundColor: color.bg,
        borderColor: color.stroke,
        total: totalsum,
      };
    });

    const top = datasets.slice().sort((a, b) => b.total - a.total)[0];
    return { labelDates, datasets, topName: top?.label || null };
  };

  const allTransactionsPerType = (() => {
    if (!analyticsData?.byTransaction || selectedTransaction) return null;
    const byTx = analyticsData.byTransaction;
    const typeNames = Object.keys(byTx);
    if (typeNames.length === 0) return null;

    // Collect and sort all dates present across types
    const labelDates = Array.from(new Set(typeNames.flatMap(name => (byTx[name]?.transactions || []).map(d => d.date))))
      .sort((a, b) => new Date(a) - new Date(b));

    const datasets = typeNames.map((name, idx) => {
      const series = byTx[name]?.transactions || [];
      const valueByDate = new Map(series.map(p => [p.date, p.count || 0]));
      const totalsum = series.reduce((s, p) => s + (p.count || 0), 0);
      const color = palette[idx % palette.length];
      return {
        label: name,
        data: labelDates.map(d => valueByDate.get(d) || 0),
        backgroundColor: color.bg,
        borderColor: color.stroke,
        total: totalsum,
      };
    });

    // Determine top transaction by total volumes
    const top = datasets.slice().sort((a, b) => b.total - a.total)[0];
    return { labelDates, datasets, topName: top?.label || null };
  })();

  const allWaitTimesPerType = buildPerTypeSeries('waitTimes', 'avgWait');
  const allCanceledPerType = buildPerTypeSeries('canceledTransactions', 'count');
  const allFailedPerType = buildPerTypeSeries('failedTransactions', 'count');

  // Derived KPIs for cards (aggregated over selected period)
  const waitPoints = currentData?.waitTimes || [];
  const sumCounts = (arr = []) => arr.reduce((sum, item) => sum + (item?.count || 0), 0);
  const totalTxCount = sumCounts(currentData?.transactions || []);
  const totalCanceledCount = sumCounts(currentData?.canceledTransactions || []);
  const avgWaitOverall = waitPoints.length ? (waitPoints.reduce((sum, p) => sum + (p?.avgWait || 0), 0) / waitPoints.length) : 0;
  const cancelRateStr = (totalTxCount > 0 ? ((totalCanceledCount / totalTxCount) * 100).toFixed(1) : '0.0') + '%';
  const slaComplianceStr = (waitPoints.length ? Math.round((waitPoints.filter(p => (p?.avgWait || 0) <= 15).length / waitPoints.length) * 100) : 0) + '%';

  const generatePDF = async () => {
    if (!assignedDepartment) {
      alert('No department selected');
      return;
    }

    try {
      const pdf = new jsPDF();
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      pdf.setFontSize(20);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${assignedDepartment.name} - Analytics Report`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'normal');
      const currentDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      pdf.text(`Generated on: ${currentDate}`, pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      pdf.text(`Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`, pageWidth / 2, yPosition, { align: 'center' });
      if (selectedTransaction) {
        yPosition += 10;
        pdf.text(`Transaction: ${selectedTransaction.name}`, pageWidth / 2, yPosition, { align: 'center' });
      }
      yPosition += 20;

      // Key Metrics Section
      pdf.setFontSize(16);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Key Performance Indicators', 20, yPosition);
      yPosition += 15;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');

      const metrics = [
        { label: 'Average Wait Time', value: `${Number.isFinite(avgWaitOverall) ? avgWaitOverall.toFixed(1) : '0.0'} minutes` },
        { label: 'Avg Completion Duration', value: `${Number.isFinite(analyticsData?.durations?.average_completed_minutes) ? analyticsData.durations.average_completed_minutes.toFixed(1) : '0.0'} minutes` },
        { label: 'Avg Cancellation Duration', value: `${Number.isFinite(analyticsData?.durations?.average_canceled_minutes) ? analyticsData.durations.average_canceled_minutes.toFixed(1) : '0.0'} minutes` },
        { label: 'Total Transactions', value: totalTxCount.toString() },
        { label: 'Canceled Transactions', value: totalCanceledCount.toString() },
        { label: 'Active Users', value: ((currentData?.kioskUsage?.webKiosk || 0) + (currentData?.kioskUsage?.physicalKiosk || 0)).toString() },
        { label: 'Cancellation Rate', value: cancelRateStr },
        { label: 'SLA Compliance (≤15m)', value: slaComplianceStr }
      ];

      metrics.forEach(metric => {
        if (yPosition > pageHeight - 30) {
          pdf.addPage();
          yPosition = 20;
        }
        pdf.text(`${metric.label}: ${metric.value}`, 25, yPosition);
        yPosition += 8;
      });

      yPosition += 10;

      // Transaction Summary
      if (assignedDepartment?.transactions && assignedDepartment.transactions.length > 0) {
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('Transaction Summary', 20, yPosition);
        yPosition += 12;

        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'normal');

        assignedDepartment.transactions.forEach(transaction => {
          if (yPosition > pageHeight - 40) {
            pdf.addPage();
            yPosition = 20;
          }

          const txData = analyticsData?.byTransaction?.[transaction.name];
          const lastTx = txData?.transactions && txData.transactions.length ? txData.transactions[txData.transactions.length - 1].count : 0;
          const lastWait = txData?.waitTimes && txData.waitTimes.length ? txData.waitTimes[txData.waitTimes.length - 1].avgWait : 0;
          const lastCancel = txData?.canceledTransactions && txData.canceledTransactions.length ? txData.canceledTransactions[txData.canceledTransactions.length - 1].count : 0;

          pdf.text(`${transaction.name}:`, 25, yPosition);
          yPosition += 6;
          pdf.text(`  - Transactions: ${lastTx}`, 30, yPosition);
          yPosition += 5;
          pdf.text(`  - Avg Wait Time: ${lastWait.toFixed(1)} min`, 30, yPosition);
          yPosition += 5;
          pdf.text(`  - Canceled: ${lastCancel}`, 30, yPosition);
          yPosition += 8;
        });
      }

      // Kiosk Usage
      yPosition += 5;
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('Kiosk Usage Distribution', 20, yPosition);
      yPosition += 12;

      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      const webKiosk = currentData?.kioskUsage?.webKiosk || 0;
      const physicalKiosk = currentData?.kioskUsage?.physicalKiosk || 0;
      const total = webKiosk + physicalKiosk;

      pdf.text(`Web Kiosk: ${webKiosk} (${total > 0 ? ((webKiosk / total) * 100).toFixed(1) : 0}%)`, 25, yPosition);
      yPosition += 6;
      pdf.text(`Physical Kiosk: ${physicalKiosk} (${total > 0 ? ((physicalKiosk / total) * 100).toFixed(1) : 0}%)`, 25, yPosition);
      yPosition += 15;

      // Footer
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'italic');
      pdf.text('This report contains summarized analytics data. For detailed charts and real-time data, please access the dashboard.', 20, pageHeight - 20);

      // Save the PDF
      const fileName = `${assignedDepartment.name.replace(/\s+/g, '_')}_Analytics_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(fileName);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report. Please try again.');
    }
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Error Loading Analytics</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchAnalyticsData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Show loading during initialization
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Loading Analytics</h2>
          <p className="text-gray-600">Please wait while we load your department data...</p>
          <p className="text-sm text-gray-500 mt-2">
            {assignedDepartmentId ? 'Department found' : 'Searching for department...'} | 
            Role: {user?.role} | 
            Departments: {departments.length}
          </p>
        </div>
      </div>
    );
  }

  // Show access denied only after initialization is complete and we're sure there's no department
  if (denyAccess && !isInitializing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Access Denied</h2>
          <p className="text-gray-600 mb-4">Your department could not be determined from your token.</p>
          <p className="text-sm text-gray-500 mb-4">
            Role: {user?.role} | Department ID: {assignedDepartmentId} | 
            Token Dept ID: {depIdFromToken} | Token Dept Name: {depNameFromToken}
          </p>
          <button
            onClick={() => navigate('/admin/dashboard')}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          {/* Title Section */}
          <div className="flex items-center space-x-4 mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">{assignedDepartment?.name}</h1>
              <p className="text-gray-600">Analytics Dashboard</p>
            </div>
          </div>
          
          {/* Controls Section - Single Row */}
          <div className="flex flex-nowrap items-center gap-3">
            <button
              onClick={() => setShowRealTime(!showRealTime)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap text-sm flex-shrink-0 font-medium ${
                showRealTime 
                  ? 'bg-green-50 hover:bg-green-100 text-green-700' 
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>{showRealTime ? 'Historical' : 'Real-time'} Analytics</span>
            </button>
            <button
              onClick={() => setShowComparison(!showComparison)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap text-sm flex-shrink-0 font-medium ${
                showComparison
                  ? 'bg-purple-50 hover:bg-purple-100 text-purple-700'
                  : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>{showComparison ? 'Hide' : 'Show'} Data Comparison</span>
            </button>
            <select
              value={selectedTransaction ? selectedTransaction.id : ''}
              onChange={(e) => {
                const value = e.target.value;
                if (value === '') {
                  setSelectedTransaction(null);
                } else {
                  const transaction = (assignedDepartment?.transactions || []).find(t => t.id === value);
                  setSelectedTransaction(transaction);
                }
              }}
              className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 flex-shrink-0 max-w-[180px]"
            >
              <option value="">All Transactions</option>
              {(assignedDepartment?.transactions || []).map((transaction) => (
                <option key={transaction.id} value={transaction.id}>
                  {transaction.name}
                </option>
              ))}
            </select>
            <div className="flex gap-4 flex-shrink-0 flex-nowrap items-center">
              <div className="flex gap-1 bg-white p-1.5 rounded-lg shadow-sm flex-shrink-0">
                {[
                  { value: 'day', label: 'Day' },
                  { value: 'week', label: 'Week' },
                  { value: 'month', label: 'Month' },
                  { value: '6months', label: '6 Months' },
                  { value: 'year', label: 'Year' }
                ].map((period) => (
                  <button
                    key={period.value}
                    onClick={() => setSelectedPeriod(period.value)}
                    className={`px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                      selectedPeriod === period.value
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {period.label}
                  </button>
                ))}
              </div>
              <button
                onClick={handleExcelDownload}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap text-sm font-medium border ${
                  isDownloadingCSV || !assignedDepartment
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-300'
                    : 'bg-green-50 hover:bg-green-100 text-green-700 cursor-pointer border-green-700'
                }`}
              >
                <FileDown className="w-4 h-4" />
                <span>{isDownloadingCSV ? 'Generating...' : 'Download Excel'}</span>
              </button>
            </div>
          </div>
        </div>

        {showRealTime ? (
          <RealTimeAnalytics departmentId={assignedDepartment.id} />
        ) : showComparison ? (
          <AnalyticsComparison 
            userRole="admin" 
            assignedDepartment={assignedDepartment} 
          />
        ) : isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md">
                <div className="h-8 bg-gray-200 animate-pulse rounded mb-2"></div>
                <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Average Wait Time"
                value={`${Number.isFinite(avgWaitOverall) ? avgWaitOverall.toFixed(1) : '0.0'} min`}
                icon={Clock}
                color="blue"
              />
              <StatCard
                title="Avg Completion Duration"
                value={`${Number.isFinite(analyticsData?.durations?.average_completed_minutes) ? analyticsData.durations.average_completed_minutes.toFixed(1) : '0.0'} min`}
                icon={Clock}
                color="green"
              />
              <StatCard
                title="Avg Cancellation Duration"
                value={`${Number.isFinite(analyticsData?.durations?.average_canceled_minutes) ? analyticsData.durations.average_canceled_minutes.toFixed(1) : '0.0'} min`}
                icon={Clock}
                color="red"
              />
              <StatCard
                title="Total Transactions"
                value={totalTxCount}
                icon={TrendingUp}
                color="green"
              />
              <StatCard
                title="Canceled Transactions"
                value={totalCanceledCount}
                icon={XCircle}
                color="red"
              />
              <StatCard
                title="Active Users"
                value={(currentData?.kioskUsage?.webKiosk || 0) + (currentData?.kioskUsage?.physicalKiosk || 0)}
                icon={Users}
                color="purple"
              />
              {/* Derived KPIs aligned with reference dashboards */}
              <StatCard
                title="Cancellation Rate"
                value={cancelRateStr}
                icon={AlertTriangle}
                color="yellow"
              />
              <StatCard
                title="SLA Compliance (<=15m)"
                value={slaComplianceStr}
                icon={Activity}
                color="blue"
              />
            </div>

            {/* Transaction Comparison Chart */}
            {assignedDepartment?.transactions && assignedDepartment.transactions.length > 0 && (
              <div className="mb-8">
                <TransactionComparisonChart
                  transactions={assignedDepartment.transactions}
                  analyticsData={analyticsData}
                />
              </div>
            )}

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <ChartComponent
                data={selectedTransaction ? (currentData?.transactions || []) : []}
                title={`Transaction Volume${selectedTransaction ? ` - ${selectedTransaction.name}` : ''}`}
                type="bar"
                color="green"
                multiDatasets={!selectedTransaction && allTransactionsPerType ? allTransactionsPerType.datasets : null}
                labelsOverride={!selectedTransaction && allTransactionsPerType ? allTransactionsPerType.labelDates : null}
                legendPosition="right"
              />
              <ChartComponent
                data={selectedTransaction ? (currentData?.waitTimes || []) : []}
                title={`Average Wait Time${selectedTransaction ? ` - ${selectedTransaction.name}` : ''}`}
                type="bar"
                color="blue"
                multiDatasets={!selectedTransaction && allWaitTimesPerType ? allWaitTimesPerType.datasets : null}
                labelsOverride={!selectedTransaction && allWaitTimesPerType ? allWaitTimesPerType.labelDates : null}
                legendPosition="right"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ChartComponent
                data={selectedTransaction ? (currentData?.canceledTransactions || []) : []}
                title={`Canceled Transactions${selectedTransaction ? ` - ${selectedTransaction.name}` : ''}`}
                type="bar"
                color="red"
                multiDatasets={!selectedTransaction && allCanceledPerType ? allCanceledPerType.datasets : null}
                labelsOverride={!selectedTransaction && allCanceledPerType ? allCanceledPerType.labelDates : null}
                legendPosition="right"
              />
              <ChartComponent
                data={selectedTransaction ? ((currentData?.failedTransactions || []).map(d => ({ date: d.date, avgWait: d.count || 0 }))) : []}
                title={`Failed Transactions${selectedTransaction ? ` - ${selectedTransaction.name}` : ''}`}
                type="bar"
                color="yellow"
                multiDatasets={!selectedTransaction && allFailedPerType ? allFailedPerType.datasets : null}
                labelsOverride={!selectedTransaction && allFailedPerType ? allFailedPerType.labelDates : null}
                legendPosition="right"
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <KioskUsageChart
                webKiosk={currentData?.kioskUsage?.webKiosk || 0}
                physicalKiosk={currentData?.kioskUsage?.physicalKiosk || 0}
              />
            </div>

            {/* Transaction Logs Table */}
            {analyticsData?.transactionLogs && analyticsData.transactionLogs.length > 0 && (
              <div className="mt-8 bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <h2 className="text-xl font-semibold mb-4">Transaction Logs</h2>
                  <div className="mt-4 flex flex-col sm:flex-row gap-4">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Reason</label>
                      <select
                        value={selectedReason}
                        onChange={(e) => setSelectedReason(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        {availableReasons.map((reason) => (
                          <option key={reason} value={reason === 'All Reasons' ? '' : reason}>
                            {reason}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
                <SortableTable
                  data={(showAllTransactionLogs ? analyticsData.transactionLogs : analyticsData.transactionLogs.slice(0, 5))
                    .filter(log => {
                      if (!selectedReason) return true;
                      return log.cancel_reason === selectedReason;
                    })
                    .map((log) => ({
                    id: log.id,
                    transaction_name: log.transaction_name || log.transaction_id,
                    user_name: (log.user_name && log.user_name !== 'Unknown') ? log.user_name : 'Kiosk User',
                    status: log.status,
                    cancel_reason: log.cancel_reason,
                    duration_minutes: log.duration_minutes ?? '',
                    started_at: log.started_at ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(log.started_at)) : '',
                    completed_at: log.completed_at ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(log.completed_at)) : ''
                  }))}
                  columns={[
                    { key: 'id', header: 'ID', sortable: true },
                    { key: 'transaction_name', header: 'Transaction', sortable: true },
                    { key: 'user_name', header: 'User', sortable: true },
                    { 
                      key: 'status', 
                      header: 'Status', 
                      sortable: true,
                      render: (value) => (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          value === 'completed' || value === 'successful' 
                            ? 'bg-green-100 text-green-800' 
                            : value === 'failed' || value === 'canceled'
                            ? 'bg-red-100 text-red-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {value}
                        </span>
                      )
                    },
                    { key: 'duration_minutes', header: 'Duration (min)', sortable: true },
                    { key: 'started_at', header: 'Start', sortable: true },
                    { key: 'completed_at', header: 'End', sortable: true },
                    { 
                      key: 'cancel_reason', 
                      header: 'Reason', 
                      sortable: true,
                      render: (value) => value ? (
                        <span className="text-red-600 font-medium">{value}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )
                    }
                  ]}
                  isLoading={isLoading}
                  emptyMessage="No transaction logs available"
                  className="text-sm text-gray-700"
                />
                {analyticsData.transactionLogs.length > 5 && (
                  <div className="p-4 border-t border-gray-200 flex justify-center">
                    <button
                      onClick={() => setShowAllTransactionLogs(!showAllTransactionLogs)}
                      className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                    >
                      {showAllTransactionLogs ? 'Show less' : 'Show more'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AnalyticsAdmin;