import React, { useEffect, useMemo, useState } from 'react';
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
import SortableTable from '../components/SortableTable';
import { FileDown } from 'lucide-react';

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

const Reports = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  if (user && user.role === 'admin' && !user.department) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h2 className="text-2xl font-bold text-red-700 mb-4">Access Denied</h2>
          <p className="text-gray-700">You do not have an assigned department.</p>
        </div>
      </div>
    );
  }
  const today = useMemo(() => formatDate(new Date()), []);
  const weekAgo = useMemo(() => formatDate(new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)), []);
  const monthAgo = useMemo(() => formatDate(new Date(Date.now() - 29 * 24 * 60 * 60 * 1000)), []);
  const yearAgo = useMemo(() => formatDate(new Date(Date.now() - 364 * 24 * 60 * 60 * 1000)), []);
  const [startDate, setStartDate] = useState(weekAgo);
  const [endDate, setEndDate] = useState(today);
  const [rangeType, setRangeType] = useState('week'); // 'day' | 'week' | 'month' | 'year'
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [summary, setSummary] = useState(null);
  const [byTx, setByTx] = useState([]);
  const [canceled, setCanceled] = useState([]);
  const [showCanceled, setShowCanceled] = useState(true);
  const [reasonFilter, setReasonFilter] = useState('');
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);
  const [availableReasons, setAvailableReasons] = useState([]);
  const [showAllCanceled, setShowAllCanceled] = useState(false);
  const [showAllTransactions, setShowAllTransactions] = useState(false);
  const CANCELED_DISPLAY_LIMIT = 5;
  const TRANSACTION_DISPLAY_LIMIT = 5;


  const fetchReports = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!user?.department_id) {
        setError('Department ID not found. Please contact administrator to assign you to a department.');
        return;
      }
      
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        department_id: user.department_id,
        start_date: startDate,
        end_date: endDate,
      });
      const res = await fetch(`http://localhost:8000/api/reports/department?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.message || `Request failed: ${res.status}`);
      }
      const payload = await res.json();
      setSummary(payload.data.summary);
      setByTx(payload.data.by_transaction || []);
      // Try to include canceled transactions with reasons if provided by API
      setCanceled(payload.data.canceled_transactions || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  // Fallback: dedicated fetch for canceled transactions if not included in main payload
  const fetchCanceled = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        department_id: user.department_id,
        start_date: startDate,
        end_date: endDate,
        status: 'canceled'
      });
      const res = await fetch(`http://localhost:8000/api/reports/department/canceled?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setCanceled(json.data || []);
      } else {
        console.warn('Canceled transactions API failed, using empty array');
        setCanceled([]);
      }
    } catch (error) {
      console.warn('Canceled transactions API error:', error);
      setCanceled([]);
    }
  };

  // Fetch available cancellation reasons for dropdown
  const fetchCancellationReasons = async () => {
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        department_id: user.department_id
      });
      const res = await fetch(`http://localhost:8000/api/reports/cancellation-reasons?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const json = await res.json();
        setAvailableReasons(['All Reasons', ...(json.data || [])]);
      } else {
        console.warn('Cancellation reasons API failed, using defaults');
        setAvailableReasons([
          'All Reasons',
          'Missing required documents',
          'Incorrect information provided', 
          'User requested cancellation',
          'Technical system error',
          'Service temporarily unavailable',
          'No show',
          'Other'
        ]);
      }
    } catch (error) {
      console.warn('Cancellation reasons API error:', error);
      setAvailableReasons([
        'All Reasons',
        'Missing required documents',
        'Incorrect information provided',
        'User requested cancellation', 
        'Technical system error',
        'Service temporarily unavailable',
        'No show',
        'Other'
      ]);
    }
  };

  useEffect(() => {
    if (user?.department_id) {
      fetchReports().then(() => {
        fetchCanceled();
        fetchCancellationReasons();
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-fetch when date inputs change
  useEffect(() => {
    if (user?.department_id && startDate && endDate) {
      fetchReports().then(() => fetchCanceled());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate]);

  const setPresetRange = async (type) => {
    setRangeType(type);
    if (type === 'day') {
      setStartDate(today);
      setEndDate(today);
    } else if (type === 'week') {
      setStartDate(weekAgo);
      setEndDate(today);
    } else if (type === 'month') {
      setStartDate(monthAgo);
      setEndDate(today);
    } else if (type === 'year') {
      setStartDate(yearAgo);
      setEndDate(today);
    }
    
    // Automatically fetch data when time period changes
    if (user?.department_id) {
      await fetchReports();
      await fetchCanceled();
      await fetchCancellationReasons();
    }
  };

  const handleExcelDownload = async () => {
    if (!user?.department_id) {
      alert('No department selected');
      return;
    }

    setIsDownloadingExcel(true);
    try {
      // Ensure data reflects current selected range
      await fetchReports();
      await fetchCanceled();
      
      // Prepare data in the format expected by excelReportService
      const reportData = {
        summary: summary || {},
        by_transaction: byTx || [],
        canceled_transactions: canceled || [],
        wait_times: (byTx || []).map(tx => ({
          date: startDate,
          average_wait: tx.average_wait_time || 0,
          transaction_name: tx.transaction_name
        })),
        transactions: (byTx || []).map(tx => ({
          date: startDate,
          count: tx.total || 0,
          transaction_name: tx.transaction_name
        }))
      };

      // Determine time period based on range type
      let timePeriod = 'week';
      if (rangeType === 'day') {
        timePeriod = 'day';
      } else if (rangeType === 'month') {
        timePeriod = 'month';
      } else if (rangeType === 'year') {
        timePeriod = 'year';
      }

      await excelReportService.generateAndDownloadReportFromData(
        user.department_id,
        user.department || 'Department',
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

  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-end md:justify-between p-4 bg-white shadow-md mt-0 pt-0 gap-3">
        <h1 className="text-2xl font-bold text-gray-800">
          {user && user.role === 'admin' && user.department ? `${user.department} Reports` : 'REPORTS'}
        </h1>
        <div className="flex items-end gap-3">
          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded">
            <button
              onClick={() => setPresetRange('day')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                rangeType === 'day'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >Day</button>
            <button
              onClick={() => setPresetRange('week')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                rangeType === 'week'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >Week</button>
            <button
              onClick={() => setPresetRange('month')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                rangeType === 'month'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >Month</button>
            <button
              onClick={() => setPresetRange('year')}
              className={`px-3 py-2 rounded text-sm transition-colors ${
                rangeType === 'year'
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-100'
              }`}
            >Year</button>
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border rounded px-3 py-2 bg-white" />
          </div>
          <div>
            <label className="block text-xs text-gray-600 mb-1">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border rounded px-3 py-2 bg-white" />
          </div>
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

      {error && (
        <div className="mt-4 p-3 rounded bg-red-100 text-red-700 border border-red-200">{error}</div>
      )}

      {/* Summary removed per request */}

      {/* Charts Section - Compact */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
        {/* Transaction Performance Bar Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Transaction Performance</h3>
          <div style={{ height: '200px' }}>
            <Bar
              data={{
                labels: byTx.map(t => t.transaction_name),
                datasets: [
                  {
                    label: 'Successful',
                    data: byTx.map(t => t.successful),
                    backgroundColor: 'rgba(34, 197, 94, 0.25)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    borderSkipped: 'bottom',
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                    hoverBackgroundColor: 'rgba(34, 197, 94, 0.4)'
                  },
                  {
                    label: 'Failed',
                    data: byTx.map(t => t.failed),
                    backgroundColor: 'rgba(239, 68, 68, 0.2)',
                    borderColor: 'rgba(239, 68, 68, 1)',
                    borderWidth: 2,
                    borderSkipped: 'bottom',
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                    hoverBackgroundColor: 'rgba(239, 68, 68, 0.35)'
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                    align: 'center',
                    labels: {
                      font: { size: 10 },
                      usePointStyle: true,
                      boxWidth: 10
                    }
                  },
                  title: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { font: { size: 9 } }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 9 }, maxRotation: 45 }
                  }
                },
                categoryPercentage: 0.8,
                barPercentage: 0.8,
                maxBarThickness: 40,
              }}
            />
          </div>
        </div>

        {/* Transaction Distribution Doughnut Chart */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Transaction Distribution</h3>
          <div style={{ height: '200px' }}>
            <Doughnut
              data={{
                labels: byTx.map(t => t.transaction_name),
                datasets: [
                  {
                    data: byTx.map(t => t.total),
                    backgroundColor: [
                      'rgba(59, 130, 246, 0.8)',
                      'rgba(16, 185, 129, 0.8)',
                      'rgba(245, 158, 11, 0.8)',
                      'rgba(239, 68, 68, 0.8)',
                      'rgba(139, 92, 246, 0.8)',
                      'rgba(236, 72, 153, 0.8)',
                      'rgba(14, 165, 233, 0.8)',
                    ],
                    borderColor: [
                      'rgba(59, 130, 246, 1)',
                      'rgba(16, 185, 129, 1)',
                      'rgba(245, 158, 11, 1)',
                      'rgba(239, 68, 68, 1)',
                      'rgba(139, 92, 246, 1)',
                      'rgba(236, 72, 153, 1)',
                      'rgba(14, 165, 233, 1)',
                    ],
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom',
                    labels: {
                      font: { size: 9 },
                      boxWidth: 10
                    }
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Wait Time Analysis */}
        <div className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-sm font-semibold text-gray-800 mb-2">Avg Wait Time</h3>
          <div style={{ height: '200px' }}>
            <Bar
              data={{
                labels: byTx.map(t => t.transaction_name),
                datasets: [
                  {
                    label: 'Minutes',
                    data: byTx.map(t => t.average_wait_time || 0),
                    backgroundColor: 'rgba(34, 197, 94, 0.25)',
                    borderColor: 'rgba(34, 197, 94, 1)',
                    borderWidth: 2,
                    borderSkipped: 'bottom',
                    borderRadius: { topLeft: 6, topRight: 6, bottomLeft: 0, bottomRight: 0 },
                    hoverBackgroundColor: 'rgba(34, 197, 94, 0.4)'
                  },
                ],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: { display: false },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    grid: { color: 'rgba(0,0,0,0.05)' },
                    ticks: { font: { size: 9 } }
                  },
                  x: {
                    grid: { display: false },
                    ticks: { font: { size: 9 }, maxRotation: 45 }
                  }
                },
                categoryPercentage: 0.8,
                barPercentage: 0.8,
                maxBarThickness: 40,
              }}
            />
          </div>
        </div>
      </div>

      {/* By Transaction */}
      <div className="mt-6 bg-white shadow-md rounded-lg">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-800">Transaction Performance</h2>
        </div>
        <SortableTable
          data={(showAllTransactions ? byTx : byTx.slice(0, TRANSACTION_DISPLAY_LIMIT)).map((row, i) => ({
            id: i,
            transaction_name: row.transaction_name,
            total: row.total,
            successful: row.successful,
            failed: row.failed,
            average_wait_time: row.average_wait_time
          }))}
          columns={[
            { key: 'transaction_name', header: 'Transaction', sortable: true },
            { key: 'total', header: 'Total', sortable: true },
            { key: 'successful', header: 'Successful', sortable: true },
            { key: 'failed', header: 'Failed', sortable: true },
            { key: 'average_wait_time', header: 'Avg Wait (min)', sortable: true }
          ]}
          isLoading={loading}
          emptyMessage="No transaction data available"
          className="text-sm text-gray-700"
        />
        
        {/* Show More Button */}
        {byTx && byTx.length > TRANSACTION_DISPLAY_LIMIT && (
          <div className="p-4 border-t border-gray-200 flex justify-center">
            <button
              onClick={() => setShowAllTransactions(!showAllTransactions)}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
            >
              {showAllTransactions ? 'Show less' : 'Show more'}
            </button>
          </div>
        )}
      </div>

      {/* Canceled Transactions (with reasons) */}
      <div className="mt-8 bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold mb-4">Canceled Transactions</h2>
          <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Reason</label>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {availableReasons.map((reason, index) => (
                  <option key={index} value={reason === 'All Reasons' ? '' : reason}>
                    {reason}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-3">
              <button
                onClick={() => { fetchReports().then(() => fetchCanceled()); }}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded"
              >Refresh</button>
              <button
                onClick={() => setShowCanceled(!showCanceled)}
                className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold px-4 py-2 rounded"
              >{showCanceled ? 'Hide' : 'Show'}</button>
            </div>
          </div>
        </div>

        {showCanceled && (
          <>
            <div className="p-6">
              <SortableTable
                data={(canceled || [])
                  .filter(it => {
                    if (!reasonFilter) return true;
                    return (it.cancellation_reason || it.reason) === reasonFilter;
                  })
                  .slice(0, showAllCanceled ? undefined : CANCELED_DISPLAY_LIMIT)
                  .map((it, idx) => ({
                    id: it.id || it.queue_number || idx,
                    queue_number: it.full_queue_number || it.queue_number || '-',
                    transaction_name: it.transaction_name || it.transaction || '-',
                    department_name: it.department_name || user?.department || '-',
                    status: it.status || 'canceled',
                    cancellation_reason: it.cancellation_reason || it.reason || '-',
                    cancellation_notes: it.cancellation_notes || it.notes || '-',
                    date_time: it.updated_at || it.completed_at || it.created_at || '-'
                  }))
                }
                columns={[
                  { key: 'queue_number', header: 'Queue No.', sortable: true },
                  { key: 'transaction_name', header: 'Transaction', sortable: true },
                  { key: 'department_name', header: 'Department', sortable: true },
                  { 
                    key: 'status', 
                    header: 'Status', 
                    sortable: true,
                    render: (value) => <span className="capitalize">{value}</span>
                  },
                  { key: 'cancellation_reason', header: 'Cancellation Reason', sortable: true },
                  { key: 'cancellation_notes', header: 'Notes', sortable: true },
                  { key: 'date_time', header: 'Date/Time', sortable: true }
                ]}
                isLoading={loading}
                emptyMessage="No canceled transactions in range."
                className="text-sm text-gray-700"
              />
            </div>
            
            {/* Show More Button */}
            {canceled && canceled.length > CANCELED_DISPLAY_LIMIT && (
              <div className="p-4 border-t border-gray-200 flex justify-center">
                <button
                  onClick={() => setShowAllCanceled(!showAllCanceled)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-lg transition-colors"
                >
                  {showAllCanceled ? 'Show less' : 'Show more'}
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reports;