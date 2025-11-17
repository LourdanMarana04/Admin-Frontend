import React, { useState, useEffect, useMemo } from 'react';
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
import historicalService from '../utils/historicalAnalyticsService';
import excelReportService from '../utils/excelReportService';
import { getDepartmentIcon } from '../utils/departmentIcons';
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
  AlertTriangle,
  FileDown,
  Eye,
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
      className="px-3 py-2.5 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-medium text-gray-700 flex-shrink-0 max-w-[180px]"
      style={{ minWidth: '100px', maxWidth: '180px' }}
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
        <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
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

  const chartData = {
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
      <h3 className="text-lg font-semibold text-gray-800 mb-4">{title}</h3>
      <div className="h-96">
        <Line data={chartData} options={options} />
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
  const baseClasses = "flex items-center space-x-2 px-3 py-1.5 rounded-lg font-medium transition-all duration-200 text-sm";
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

const SuperAnalytics = () => {
  try {
    const navigate = useNavigate();
    const { departments } = useDepartments();
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [selectedPeriod, setSelectedPeriod] = useState('month');
    const [analyticsData, setAnalyticsData] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showRealTime, setShowRealTime] = useState(false);
    const [showComparison, setShowComparison] = useState(false);
    const [isDownloadingCSV, setIsDownloadingCSV] = useState(false);
    const [showAllTransactionLogs, setShowAllTransactionLogs] = useState(false);
    const lastSeenUpdateTsRef = useRef(null);
    const lastSeenQueueNumberRef = useRef(null);
    const isFetchingRef = useRef(false);

    // Overview metrics (when no department is selected)
    const [overviewTotals, setOverviewTotals] = useState({});
    const [isOverviewLoading, setIsOverviewLoading] = useState(false);

    useEffect(() => {
      if (selectedDepartment) {
        console.log('selectedDepartment updated:', selectedDepartment);
        console.log('selectedDepartment.transactions:', selectedDepartment.transactions);
        fetchAnalyticsData();
      }
    }, [selectedDepartment, selectedPeriod, selectedTransaction]);

    // Fetch overview totals per department when no department is selected
    useEffect(() => {
      if (selectedDepartment) return;
      const active = (departments || []).filter(d => d.active !== false);
      if (!active.length) return;

      let cancelled = false;
      const load = async () => {
        try {
          setIsOverviewLoading(true);
          const results = await Promise.all(active.map(async (d) => {
            try {
              const raw = await historicalService.getHistoricalData(d.id, selectedPeriod, null);
              const processed = historicalService.processDataForCharts(raw, selectedPeriod);
              const overall = processed?.overall || {};
              const tx = overall?.transactions?.[overall.transactions.length - 1]?.count || 0;
              const waits = overall?.waitTimes || [];
              const slaPct = waits.length ? Math.round((waits.filter(p => (p?.avgWait || 0) <= 15).length / waits.length) * 100) : 0;
              return [d.id, { transactions: tx, slaPct }];
            } catch (_) {
              return [d.id, { transactions: 0, slaPct: 0 }];
            }
          }));
          if (cancelled) return;
          const map = {};
          results.forEach(([id, val]) => { map[id] = val; });
          setOverviewTotals(map);
        } finally {
          if (!cancelled) setIsOverviewLoading(false);
        }
      };

      load();
      return () => { cancelled = true; };
    }, [selectedDepartment, departments, selectedPeriod]);

    // Refresh only when a new update is detected for the selected department
    useEffect(() => {
      if (!selectedDepartment || showRealTime) return;

      let isCancelled = false;
      const token = localStorage.getItem('token');

      const checkForUpdate = async () => {
        try {
          const res = await fetch(`http://localhost:8000/api/queue/latest-update/${selectedDepartment.id}`, {
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
          // ignore
        }
      };

      checkForUpdate();
      const intervalId = setInterval(checkForUpdate, 15000);
      return () => { isCancelled = true; clearInterval(intervalId); };
    }, [selectedDepartment, showRealTime]);

    const fetchAnalyticsData = async () => {
      if (!selectedDepartment) return;

      setIsLoading(true);
      setError(null);

      try {
        const historicalService = (await import('../utils/historicalAnalyticsService')).default;
        const rawData = await historicalService.getHistoricalData(
          selectedDepartment.id,
          selectedPeriod,
          selectedTransaction
        );
        
        const processedData = historicalService.processDataForCharts(rawData, selectedPeriod);
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
      if (!selectedDepartment) {
        alert('No department selected');
        return;
      }

      setIsDownloadingCSV(true);
      try {
        await excelReportService.generateAndDownloadReport(
          selectedDepartment.id,
          selectedDepartment.name,
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

    const handleDepartmentSelect = (department) => {
      console.log('Department clicked:', department);
      console.log('Department transactions on click:', department.transactions);
      console.log('Full department object:', JSON.stringify(department));
      setSelectedDepartment(department);
      setSelectedTransaction(null);
    };

    const handleBack = () => {
      setSelectedDepartment(null);
      setSelectedTransaction(null);
      setAnalyticsData(null);
      setError(null);
    };

    const generatePDF = (type) => {
      // PDF generation logic here
      console.log('Generating PDF for:', type);
    };

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

    // Derived KPIs for cards (SLA target: 15 minutes)
    const waitPoints = currentData?.waitTimes || [];
    const sumCounts = (arr = []) => arr.reduce((sum, item) => sum + (item?.count || 0), 0);
    const totalTxCount = sumCounts(currentData?.transactions || []);
    const totalCanceledCount = sumCounts(currentData?.canceledTransactions || []);
    const avgWaitOverall = waitPoints.length ? (waitPoints.reduce((sum, p) => sum + (p?.avgWait || 0), 0) / waitPoints.length) : 0;
    const cancelRateStr = (totalTxCount > 0 ? ((totalCanceledCount / totalTxCount) * 100).toFixed(1) : '0.0') + '%';
    const slaComplianceStr = (waitPoints.length ? Math.round((waitPoints.filter(p => (p?.avgWait || 0) <= 15).length / waitPoints.length) * 100) : 0) + '%';

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

    if (!selectedDepartment) {
      return (
        <div className="p-6 bg-white min-h-screen">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Department Analytics</h1>
                <p className="text-gray-600 mt-2">Select a department to view detailed analytics</p>
              </div>
            </div>

            {/** Removed two overview sections as requested: Transactions by Department and SLA Compliance */}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {departments.filter(dept => dept.active !== false).map((department) => (
                <button
                  key={department.id}
                  onClick={() => handleDepartmentSelect(department)}
                  className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 hover:border-blue-300 text-left"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-full">
                      {React.createElement(getDepartmentIcon(department.name), { className: "w-6 h-6 text-blue-600" })}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-800">{department.name}</h3>
                      <p className="text-sm text-gray-500">
                        {department.transactions?.length || 0} transaction types
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
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
              <button
                onClick={handleBack}
                className="p-2 bg-white rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex-shrink-0"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{selectedDepartment.name}</h1>
                <p className="text-gray-600">Analytics Dashboard</p>
              </div>
            </div>
            
            {/* Controls Section - Single Row */}
            <div className="flex items-center gap-3 flex-nowrap">
              <button
                onClick={() => setShowRealTime(!showRealTime)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 text-sm font-medium ${
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
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors whitespace-nowrap flex-shrink-0 text-sm font-medium ${
                  showComparison 
                    ? 'bg-purple-50 hover:bg-purple-100 text-purple-700' 
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <BarChart3 className="w-4 h-4" />
                <span>{showComparison ? 'Hide' : 'Show'} Data Comparison</span>
              </button>
              <TransactionSelector
                transactions={selectedDepartment.transactions}
                selectedTransaction={selectedTransaction}
                onTransactionChange={setSelectedTransaction}
              />
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
                    isDownloadingCSV
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
            <RealTimeAnalytics departmentId={selectedDepartment.id} />
          ) : showComparison ? (
            <AnalyticsComparison 
              userRole="super_admin" 
              assignedDepartment={selectedDepartment} 
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
              {selectedDepartment.transactions && selectedDepartment.transactions.length > 0 && (
                <div className="mb-8">
                  <TransactionComparisonChart
                    transactions={selectedDepartment.transactions}
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
                <div className="mt-8 bg-white rounded-lg shadow-md p-6">
                  <h2 className="text-xl font-semibold mb-4">Transaction Logs</h2>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Transaction</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration (min)</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Start</th>
                          <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">End</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(showAllTransactionLogs ? analyticsData.transactionLogs : analyticsData.transactionLogs.slice(0, 5)).map((log) => (
                          <tr key={log.id}>
                            <td className="px-4 py-2 text-sm text-gray-700">{log.id}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{log.transaction_name || log.transaction_id}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{(log.user_name && log.user_name !== 'Unknown') ? log.user_name : 'Kiosk User'}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                log.status === 'completed' || log.status === 'successful' 
                                  ? 'bg-green-100 text-green-800' 
                                  : log.status === 'failed' || log.status === 'canceled'
                                  ? 'bg-red-100 text-red-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {log.status}
                              </span>
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">
                              {log.cancel_reason ? (
                                <span className="text-red-600 font-medium">{log.cancel_reason}</span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                            <td className="px-4 py-2 text-sm text-gray-700">{log.duration_minutes ?? ''}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{log.started_at ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(log.started_at)) : ''}</td>
                            <td className="px-4 py-2 text-sm text-gray-700">{log.completed_at ? new Intl.DateTimeFormat('en-PH', { timeZone: 'Asia/Manila', year: 'numeric', month: 'numeric', day: 'numeric', hour: 'numeric', minute: '2-digit', second: '2-digit' }).format(new Date(log.completed_at)) : ''}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {analyticsData.transactionLogs.length > 5 && (
                    <div className="mt-4 flex justify-center">
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
  } catch (error) {
    console.error('Error in SuperAnalytics component:', error);
    return (
      <div className="p-6 bg-gray-100 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-800">Error</h1>
          <p className="text-gray-600 mt-2">An unexpected error occurred. Please try again later.</p>
          <p className="text-sm text-gray-500 mt-1">{error.message || 'Unknown error'}</p>
        </div>
      </div>
    );
  }
};

export default SuperAnalytics;
