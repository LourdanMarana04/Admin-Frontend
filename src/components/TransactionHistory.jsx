import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import logo from '../assets/logo-seal.png';
import { useDepartments } from '../utils/DepartmentsContext.jsx';

const TransactionHistory = () => {
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
  const navigate = useNavigate();
  const location = useLocation();
  const { departments } = useDepartments();
  
  // Memoize department resolution to prevent excessive re-renders
  const { departmentId, departmentObj, rawDepartment } = useMemo(() => {
    // Use department from location state if available (from department page), otherwise use user's department
    const rawDept = location.state?.department || user?.department || 'Assessor';
    const departmentName = rawDept.replace(/-/g, ' ').toLowerCase();
    
    // More precise department matching - exact match first, then partial
    const foundDepartmentObj = departments.find(d => {
      const deptName = d.name.toLowerCase();
      // Exact match first (most important) - this should be the only match for "assessor"
      if (deptName === departmentName) {
        return true;
      }
      return false;
    });
    
    let resolvedDepartmentId = foundDepartmentObj?.id;
    
    // Ensure we have a valid department ID, fallback to 1 (Assessor)
    if (!resolvedDepartmentId) {
      resolvedDepartmentId = 1;
      console.warn('Using fallback department ID 1 (Assessor)');
    }
    
    return {
      departmentId: resolvedDepartmentId,
      departmentObj: foundDepartmentObj,
      rawDepartment: rawDept
    };
  }, [departments, location.state?.department, user?.department]);

  // Debug logging (only log when department changes)
  const prevDepartmentId = useRef();
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && prevDepartmentId.current !== departmentId) {
      console.log('TransactionHistory: Department resolved as', departmentId, 'for user:', user?.department);
      prevDepartmentId.current = departmentId;
    }
  }, [departmentId, user?.department]);

  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('date');
  const [filterDate, setFilterDate] = useState('');
  const [filterTimeFrom, setFilterTimeFrom] = useState('');
  const [filterTimeTo, setFilterTimeTo] = useState('');
  const [displayLimit, setDisplayLimit] = useState(5);
  const [isReasonModalOpen, setIsReasonModalOpen] = useState(false);
  const [activeReason, setActiveReason] = useState('');
  const [activeQueueNumber, setActiveQueueNumber] = useState('');

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        closeReasonModal();
      }
    };

    if (isReasonModalOpen) {
      window.addEventListener('keydown', handleEscape);
    }

    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isReasonModalOpen]);

  useEffect(() => {
    if (!departmentId) {
      console.warn('Invalid department ID, skipping API call');
      return;
    }
    const fetchHistory = async () => {
      setLoading(true);
      try {
        // Only log fetch in development mode
        if (process.env.NODE_ENV === 'development') {
          console.log(`Fetching history for department ID: ${departmentId}`);
        }
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/queue/history/${departmentId}`, {
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
          }
        });
        if (response.ok) {
          const data = await response.json();
          setHistoryData(data);
        } else {
          console.warn(`Failed to fetch transaction history: ${response.status}`);
        }
      } catch (e) {
        console.error('Error fetching transaction history:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [departmentId]);

  const handleBack = () => {
    navigate(-1);
  };

  const handleShowMore = () => {
    if (displayLimit === 5) {
      setDisplayLimit(filteredData.length);
    } else {
      setDisplayLimit(5);
    }
  };

  const openReasonModal = (reason, queueNumber) => {
    setActiveReason(reason || 'No reason provided');
    setActiveQueueNumber(queueNumber);
    setIsReasonModalOpen(true);
  };

  const closeReasonModal = () => {
    setIsReasonModalOpen(false);
    setActiveReason('');
    setActiveQueueNumber('');
  };

  // Format helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    // Ensure UTC dates are treated as UTC by appending 'Z' if not present
    const utcDateStr = dateStr.includes('Z') ? dateStr : dateStr + 'Z';
    return new Date(utcDateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // YYYY-MM-DD
  };
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    // Ensure UTC dates are treated as UTC by appending 'Z' if not present
    const utcDateStr = dateStr.includes('Z') ? dateStr : dateStr + 'Z';
    return new Date(utcDateStr).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  };
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    // Ensure UTC dates are treated as UTC by appending 'Z' if not present
    const utcDateStr = dateStr.includes('Z') ? dateStr : dateStr + 'Z';
    return new Date(utcDateStr).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' });
  };
  const getTimeString = (dateStr) => {
    if (!dateStr) return '';
    // Ensure UTC dates are treated as UTC by appending 'Z' if not present
    const utcDateStr = dateStr.includes('Z') ? dateStr : dateStr + 'Z';
    const d = new Date(utcDateStr);
    return d.toLocaleTimeString('en-GB', { hour12: false, timeZone: 'Asia/Manila' }).slice(0,5); // 'HH:MM'
  };

  // Filtered data
  const filteredData = historyData.filter(entry => {
    // Filter by date if date is selected
    if (filterDate) {
      if (formatDate(entry.completed_at) !== filterDate) return false;
    }
    
    // Filter by time range if time filters are set
    if (filterTimeFrom || filterTimeTo) {
      const entryTime = getTimeString(entry.completed_at);
      if (filterTimeFrom && entryTime < filterTimeFrom) return false;
      if (filterTimeTo && entryTime > filterTimeTo) return false;
    }
    
    return true;
  });

  // Display only the first 'displayLimit' entries
  const displayedData = filteredData.slice(0, displayLimit);
  const hasMoreData = filteredData.length > displayLimit;

  return (
    <div className="min-h-screen bg-white p-6">
      <div className="bg-white p-6 rounded-lg w-full border border-gray-300 shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-red-800">
            TRANSACTION HISTORY - {rawDepartment.replace(/-/g, ' ').toUpperCase()}
          </h1>
        </div>

        {/* Filter by Date and Time */}
        <div className="mb-6 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label htmlFor="date-filter" className="font-semibold text-gray-700">Filter by Date:</label>
            <input
              id="date-filter"
              type="date"
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 bg-white w-40"
              placeholder="mm/dd/yyyy"
            />
            {filterDate && (
              <button
                onClick={() => setFilterDate('')}
                className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="time-from" className="font-semibold text-gray-700">Time From:</label>
            <input
              id="time-from"
              type="time"
              value={filterTimeFrom}
              onChange={e => setFilterTimeFrom(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 bg-white w-32"
              placeholder="HH:MM"
            />
          </div>

          <div className="flex items-center gap-2">
            <label htmlFor="time-to" className="font-semibold text-gray-700">Time To:</label>
            <input
              id="time-to"
              type="time"
              value={filterTimeTo}
              onChange={e => setFilterTimeTo(e.target.value)}
              className="border border-gray-300 rounded px-3 py-1 bg-white w-32"
              placeholder="HH:MM"
            />
          </div>

          {(filterTimeFrom || filterTimeTo) && (
            <button
              onClick={() => { setFilterTimeFrom(''); setFilterTimeTo(''); }}
              className="px-2 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
            >
              Clear Time
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="px-4 py-2 border border-gray-300">Queue Number</th>
                <th className="px-4 py-2 border border-gray-300">Transaction</th>
                <th className="px-4 py-2 border border-gray-300">Source</th>
                <th className="px-4 py-2 border border-gray-300">Status</th>
                <th className="px-4 py-2 border border-gray-300">Time Start</th>
                <th className="px-4 py-2 border border-gray-300">Duration</th>
                <th className="px-4 py-2 border border-gray-300">End</th>
                <th className="px-4 py-2 border border-gray-300">Reason</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-8">Loading...</td></tr>
              ) : displayedData.length === 0 ? (
                <tr><td colSpan={8} className="text-center py-8">No transaction history found.</td></tr>
              ) : (
                displayedData.map((entry, index) => (
                  <tr key={entry.id} className={index % 2 === 0 ? '' : 'bg-gray-50'}>
                    <td className="px-4 py-2 border border-gray-300">{entry.full_queue_number || entry.queue_number}</td>
                    <td className="px-4 py-2 border border-gray-300">{entry.transaction_name}</td>
                    <td className="px-4 py-2 border border-gray-300 font-semibold">
                      {entry.source === 'web' ? 'Web' : 'Kiosk'}
                    </td>
                    <td className="px-4 py-2 border border-gray-300">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        entry.status === 'completed' || entry.status === 'successful'
                          ? 'bg-green-100 text-green-800'
                          : entry.status === 'failed' || entry.status === 'canceled'
                          ? 'bg-red-100 text-red-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-4 py-2 border border-gray-300">{entry.started_at ? formatDisplayDate(entry.started_at) + ' • ' + formatTime(entry.started_at) : '-'}</td>
                    <td className="px-4 py-2 border border-gray-300">{entry.duration_minutes ? entry.duration_minutes + ' min' : '-'}</td>
                    <td className="px-4 py-2 border border-gray-300">{entry.completed_at ? formatDisplayDate(entry.completed_at) + ' • ' + formatTime(entry.completed_at) : '-'}</td>
                    <td className="px-4 py-2 border border-gray-300">
                      {entry.cancel_reason ? (
                        <span className="text-red-600 font-medium">{entry.cancel_reason}</span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-6 text-right">
          {filteredData.length > 5 ? (
            <button
              onClick={handleShowMore}
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-lg transition duration-200"
            >
              {displayLimit === 5 ? 'Show More' : 'Show Less'}
            </button>
          ) : (
            <button
              onClick={handleBack}
              className="px-4 py-2 bg-green-700 hover:bg-green-800 text-white font-semibold rounded-lg transition duration-200"
            >
              Back
            </button>
          )}
        </div>
      </div>



      {isReasonModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reason-modal-title"
        >
          <div className="w-full max-w-md rounded-lg bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-200 p-4">
              <div>
                <h2 id="reason-modal-title" className="text-lg font-semibold text-gray-900">
                  Cancellation Reason
                </h2>
                <p className="text-sm text-gray-500">Queue Number: {activeQueueNumber}</p>
              </div>
              <button
                onClick={closeReasonModal}
                className="rounded-full p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
                aria-label="Close reason modal"
              >
                ×
              </button>
            </div>
            <div className="p-4">
              <p className="rounded-md bg-red-50 p-3 text-sm text-red-700">
                {activeReason}
              </p>
            </div>
            <div className="flex justify-end gap-2 border-t border-gray-200 bg-gray-50 p-4">
              <button
                onClick={closeReasonModal}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default TransactionHistory;
