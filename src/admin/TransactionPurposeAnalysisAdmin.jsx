import React, { useState, useEffect } from 'react';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import SortableTable from '../components/SortableTable';
import { 
  Download, 
  Plus, 
  Filter, 
  Search, 
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  FileText,
  TrendingUp,
  BarChart3,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';
import AddAssessmentModal from '../components/AddAssessmentModal';

const API_BASE_URL = 'http://localhost:8000/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const TransactionPurposeAnalysis = () => {
  const user = JSON.parse(localStorage.getItem('user'));
  const { departments } = useDepartments();
  const userDepartmentName = (user && user.department) ? String(user.department).toLowerCase() : '';
  
  // State management
  const [assessments, setAssessments] = useState([]);
  const [filteredAssessments, setFilteredAssessments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('today');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [lastResetDate, setLastResetDate] = useState(() => {
    return localStorage.getItem('lastResetDate') || new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  });
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]); // store IDs as strings for consistent comparisons
  const [showAddModal, setShowAddModal] = useState(false);
  const [departmentId, setDepartmentId] = useState(null);
  const [transactionsByName, setTransactionsByName] = useState({});
  const [metrics, setMetrics] = useState(null);
  const [viewItem, setViewItem] = useState(null);
  // Broadcast channel for notifying other dashboards (e.g., superadmin)
  const [bc] = useState(() => {
    try { return new BroadcastChannel('queue_updates'); } catch { return null; }
  });

  // Local cache for extra fields not provided by backend (temporary until API supports them)
  const readAssessmentMeta = () => {
    try { return JSON.parse(localStorage.getItem('assessment_meta') || '{}'); } catch { return {}; }
  };
  const writeAssessmentMeta = (meta) => {
    try { localStorage.setItem('assessment_meta', JSON.stringify(meta)); } catch {}
  };
  const getMetaFor = (queueId) => {
    const meta = readAssessmentMeta();
    return meta && queueId ? meta[String(queueId)] : null;
  };
  const removeMetaFor = (queueId) => {
    if (!queueId) return;
    const meta = readAssessmentMeta();
    if (meta && Object.prototype.hasOwnProperty.call(meta, String(queueId))) {
      delete meta[String(queueId)];
      writeAssessmentMeta(meta);
    }
  };

  // Helper to format YYYY-MM-DD in PH timezone (Asia/Manila)
  const formatYmdPH = (dateLike) => {
    if (!dateLike) return '';
    const d = new Date(dateLike);
    return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }); // YYYY-MM-DD
  };

  // Daily reset functionality
  const checkAndResetDaily = () => {
    const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    if (lastResetDate !== today) {
      console.log('New day detected, resetting data...');
      setLastResetDate(today);
      localStorage.setItem('lastResetDate', today);
      
      // Reset filters to today
      setDateFilter('today');
      setSearchTerm('');
      setStatusFilter('all');
      setTypeFilter('all');
      
      // Clear any cached assessment metadata
      localStorage.removeItem('assessment_meta');
      
      // Refresh data
      refreshHistory();
    }
  };

  // Map backend queue history entries to UI rows
  const mapQueueEntryToRow = (entry) => {
    const meta = getMetaFor(entry.id);
    return {
      id: entry.id,
      transactionType: entry.transaction_name || (entry.transaction && entry.transaction.name) || (meta && meta.transactionType) || 'Unknown',
      citizenName: entry.citizen_name || (entry.citizen && entry.citizen.name) || (meta && meta.citizenName) || '—',
      propertyAddress: entry.property_address || (meta && meta.propertyAddress) || '—',
      assessmentValue: entry.assessment_value || (meta && meta.assessmentValue) || 0,
      taxAmount: entry.tax_amount || (meta && meta.taxAmount) || 0,
      status: (entry.status || 'pending').replace('waiting', 'pending'),
      dateSubmitted: formatYmdPH(entry.completed_at || entry.created_at),
      processingTime: entry.processing_time_hours ? `${entry.processing_time_hours} hours` : (meta && meta.processingTime) || '0 hours',
      assignedStaff: entry.assigned_staff || entry.staff_name || (meta && meta.assignedStaff) || '—',
      fullQueueNumber: entry.full_queue_number || entry.queue_number,
    };
  };

  // Map pending/active queue entries to UI rows (from /queue/status)
  const mapPendingEntryToRow = (entry) => {
    const meta = getMetaFor(entry.id);
    return {
      id: entry.id,
      transactionType: entry.transaction_name || (meta && meta.transactionType) || 'Unknown',
      citizenName: meta && meta.citizenName || '—',
      propertyAddress: meta && meta.propertyAddress || '—',
      assessmentValue: meta && meta.assessmentValue || 0,
      taxAmount: meta && meta.taxAmount || 0,
      status: 'in_progress',
      dateSubmitted: formatYmdPH(entry.created_at),
      processingTime: meta && meta.processingTime || '0 hours',
      assignedStaff: (meta && meta.assignedStaff) || '—',
      fullQueueNumber: entry.full_queue_number || entry.queue_number,
    };
  };

  // Summary statistics
  const today = new Date().toISOString().split('T')[0];
  const summaryStats = {
    totalToday: (metrics && metrics.totalToday) ?? assessments.filter(a => a.dateSubmitted === today).length,
    avgProcessingTime: (metrics && metrics.avgProcessingTimeHrs) ?? (assessments.length > 0 ? 
      Math.round(assessments.reduce((sum, a) => sum + (parseInt(a.processingTime) || 0), 0) / Math.max(assessments.length, 1)) : 0),
    pendingReviews: (metrics && metrics.pending) ?? assessments.filter(a => a.status === 'pending' || a.status === 'requires_review').length,
    completedThisWeek: (metrics && metrics.completedThisWeek) ?? assessments.filter(a => a.status === 'completed').length,
    completedToday: (metrics && metrics.completedToday) ?? assessments.filter(a => a.status === 'completed' && a.dateSubmitted === today).length
  };

  // Resolve department id and transactions
  useEffect(() => {
    if (!userDepartmentName || !departments || departments.length === 0) return;
    const dept = departments.find(d => d.name && d.name.toLowerCase() === userDepartmentName);
    if (!dept) return;
    if (departmentId !== dept.id) {
      setDepartmentId(dept.id);
    }
    const byName = {};
    (dept.transactions || []).forEach(t => { byName[(t.name || '').toLowerCase()] = t; });
    setTransactionsByName(prev => {
      const prevKeys = Object.keys(prev || {});
      const newKeys = Object.keys(byName);
      if (prevKeys.length === newKeys.length && prevKeys.every(k => prev[k] === byName[k])) return prev;
      return byName;
    });
    
    // Check for daily reset
    checkAndResetDaily();
  }, [departments, userDepartmentName, departmentId]);

  // Fetch both history (completed) and active (pending/accepted) queues
  useEffect(() => {
    if (!departmentId) return;
    const fetchAll = async () => {
      setIsLoading(true);
      try {
        const [histRes, pendingRes] = await Promise.all([
          fetch(`${API_BASE_URL}/queue/history/${departmentId}`, { headers: getAuthHeaders() }),
          fetch(`${API_BASE_URL}/queue/status/${departmentId}`, { headers: getAuthHeaders() })
        ]);
        const [hist, pending] = await Promise.all([histRes.json(), pendingRes.json()]);
        if (!histRes.ok) throw new Error(hist.message || 'Failed to fetch queue history');
        if (!pendingRes.ok) throw new Error(pending.message || 'Failed to fetch pending queue');
        let histRows = Array.isArray(hist) ? hist.map(mapQueueEntryToRow) : [];
        histRows = histRows.filter(r => r.status === 'completed');
        const pendingRows = Array.isArray(pending) ? pending.map(mapPendingEntryToRow) : [];
        // Merge by id, prefer history row when duplicate
        const mergedMap = new Map();
        [...pendingRows, ...histRows].forEach(r => mergedMap.set(r.id, r));
        const rows = Array.from(mergedMap.values());
        setAssessments(rows);
        setFilteredAssessments(rows);
      } catch (e) {
        console.error('Failed to fetch queues:', e);
        setAssessments([]);
        setFilteredAssessments([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAll();
  }, [departmentId]);

  // Helper to refresh history on-demand
  const refreshHistory = async () => {
    if (!departmentId) return;
    try {
      const [histRes, pendingRes] = await Promise.all([
        fetch(`${API_BASE_URL}/queue/history/${departmentId}`, { headers: getAuthHeaders() }),
        fetch(`${API_BASE_URL}/queue/status/${departmentId}`, { headers: getAuthHeaders() })
      ]);
      const [hist, pending] = await Promise.all([histRes.json(), pendingRes.json()]);
      if (!histRes.ok) throw new Error(hist.message || 'Failed to fetch queue history');
      if (!pendingRes.ok) throw new Error(pending.message || 'Failed to fetch pending queue');
      let histRows = Array.isArray(hist) ? hist.map(mapQueueEntryToRow) : [];
      histRows = histRows.filter(r => r.status === 'completed');
      const pendingRows = Array.isArray(pending) ? pending.map(mapPendingEntryToRow) : [];
      const mergedMap = new Map();
      [...pendingRows, ...histRows].forEach(r => mergedMap.set(r.id, r));
      const rows = Array.from(mergedMap.values());
      setAssessments(rows);
      setFilteredAssessments(rows);
      // Also broadcast a lightweight update signal
      try {
        if (bc) {
          bc.postMessage({ type: 'refresh', departmentId });
          // send current row fields as meta for superadmin to mirror exactly
          const payload = rows.map(r => ({
            id: r.id,
            meta: {
              transactionType: r.transactionType,
              citizenName: r.citizenName,
              propertyAddress: r.propertyAddress,
              assessmentValue: r.assessmentValue,
              taxAmount: r.taxAmount,
              assignedStaff: r.assignedStaff,
            }
          }));
          bc.postMessage({ type: 'meta_bulk', items: payload });
        }
        else localStorage.setItem('queue_update_broadcast', JSON.stringify({ ts: Date.now(), departmentId }));
      } catch {}
    } catch (e) {
      console.error('Failed to refresh queue history:', e);
    }
  };

  // Fetch analytics metrics (best-effort)
  useEffect(() => {
    if (!departmentId) return;
    const fetchMetrics = async () => {
      try {
        const resp = await fetch(`${API_BASE_URL}/analytics/department-metrics?departmentId=${departmentId}`, { headers: getAuthHeaders() });
        const data = await resp.json();
        if (resp.ok) setMetrics(data);
      } catch (e) {
        // ignore errors
      }
    };
    fetchMetrics();
  }, [departmentId]);

  useEffect(() => {
    // Apply filters
    let filtered = assessments;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(assessment =>
        assessment.citizenName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.propertyAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
        assessment.transactionType.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.status === statusFilter);
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(assessment => assessment.transactionType === typeFilter);
    }

    // Date filter (PH timezone)
    const now = new Date();
    const today = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

    switch (dateFilter) {
      case 'today':
        filtered = filtered.filter(assessment => assessment.dateSubmitted === today);
        break;
      case 'week':
        filtered = filtered.filter(assessment => assessment.dateSubmitted >= weekAgo);
        break;
      case 'month':
        filtered = filtered.filter(assessment => assessment.dateSubmitted >= monthAgo);
        break;
      case 'custom':
        if (customDateRange.start && customDateRange.end) {
          filtered = filtered.filter(assessment => 
            assessment.dateSubmitted >= customDateRange.start && 
            assessment.dateSubmitted <= customDateRange.end
          );
        }
        break;
      default:
        break;
    }

    setFilteredAssessments(filtered);
  }, [assessments, searchTerm, statusFilter, typeFilter, dateFilter]);


  const handleExportReport = () => {
    const headers = ['Queue Number','Transaction Type','Citizen Name','Property Address','Assessment Value','Tax Amount','Status','Date Submitted','Processing Time','Assigned Staff'];
    const rows = filteredAssessments.map(a => [
      a.fullQueueNumber || '',
      a.transactionType || '',
      a.citizenName || '',
      a.propertyAddress || '',
      a.assessmentValue || 0,
      a.taxAmount || 0,
      a.status || '',
      a.dateSubmitted || '',
      a.processingTime || '',
      a.assignedStaff || ''
    ]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'transaction_purpose_report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleAddNewAssessment = () => {
    setShowAddModal(true);
  };

  const handleAssessmentSubmit = async (newAssessment) => {
    try {
      if (!departmentId) throw new Error('No department id');
      const tx = transactionsByName[String(newAssessment.transactionType || '').toLowerCase()];
      if (!tx) throw new Error('Unknown transaction type for this department');
      const response = await fetch(`${API_BASE_URL}/queue/generate`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          department_id: departmentId,
          transaction_id: tx.id,
          // Admin-created assessments should not require kiosk confirmation
          source: 'kiosk',
          // Persist details to backend
          citizen_name: newAssessment.citizenName || null,
          property_address: newAssessment.propertyAddress || null,
          assessment_value: parseFloat(String(newAssessment.assessmentValue || '0').replace(/[^0-9.]/g, '')) || 0,
          tax_amount: parseFloat(String(newAssessment.taxAmount || '0').replace(/[^0-9.]/g, '')) || 0,
          assigned_staff: newAssessment.assignedStaff || null,
        })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to create assessment');
      
      // Persist details again for safety (covers older servers not handling fields on generate)
      if (data && data.queue_id) {
        try {
          await fetch(`${API_BASE_URL}/queue/update-details`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({
              queue_id: data.queue_id,
              citizen_name: newAssessment.citizenName || null,
              property_address: newAssessment.propertyAddress || null,
              assessment_value: parseFloat(String(newAssessment.assessmentValue || '0').replace(/[^0-9.]/g, '')) || 0,
              tax_amount: parseFloat(String(newAssessment.taxAmount || '0').replace(/[^0-9.]/g, '')) || 0,
              assigned_staff: newAssessment.assignedStaff || null,
            })
          });
          
          // Immediately complete the admin-created assessment so it appears in Transaction Purpose Analysis
          await fetch(`${API_BASE_URL}/queue/complete`, {
            method: 'POST',
            headers: getAuthHeaders(),
            body: JSON.stringify({ queue_id: data.queue_id })
          });
        } catch (e) {
          // non-fatal
        }
      }
      // Store metadata for the new assessment
      if (data && data.queue_id) {
        // Persist extra fields locally keyed by queue id (temporary until backend supports these fields)
        const existingMeta = readAssessmentMeta();
        const newMeta = {
          transactionType: newAssessment.transactionType,
          citizenName: newAssessment.citizenName,
          propertyAddress: newAssessment.propertyAddress,
          assessmentValue: parseFloat(String(newAssessment.assessmentValue || '0').replace(/[^0-9.]/g, '')) || 0,
          taxAmount: parseFloat(String(newAssessment.taxAmount || '0').replace(/[^0-9.]/g, '')) || 0,
          assignedStaff: newAssessment.assignedStaff,
          processingTime: '0 hours'
        };
        existingMeta[String(data.queue_id)] = newMeta;
        writeAssessmentMeta(existingMeta);
        // broadcast metadata payload for other tabs (superadmin)
        try {
          if (bc) bc.postMessage({ type: 'meta', queueId: data.queue_id, meta: newMeta });
          else localStorage.setItem('assessment_meta_update', JSON.stringify({ id: String(data.queue_id), meta: newMeta, ts: Date.now() }));
        } catch {}
        // Broadcast update event
        try {
          if (bc) bc.postMessage({ type: 'added', departmentId, queueId: data.queue_id });
          else localStorage.setItem('queue_update_broadcast', JSON.stringify({ ts: Date.now(), departmentId }));
        } catch {}
      }
      // After completion, refetch history to reflect latest
      const refresh = await fetch(`${API_BASE_URL}/queue/history/${departmentId}`, { headers: getAuthHeaders() });
      const hist = await refresh.json();
      const rows = Array.isArray(hist) ? hist.map(mapQueueEntryToRow) : [];
      setAssessments(rows);
      setFilteredAssessments(rows);
      alert('Assessment created successfully!');
    } catch (e) {
      console.error('Failed to submit assessment:', e);
      alert(`Failed to create assessment: ${e.message}`);
    }
  };

  const updateStatus = async (id, action) => {
    let endpoint = '';
    switch (action) {
      case 'accept': endpoint = '/queue/accept'; break;
      case 'cancel': endpoint = '/queue/cancel'; break;
      case 'complete': endpoint = '/queue/complete'; break;
      default: return;
    }
    const res = await fetch(`${API_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ queue_id: id })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || `Failed to ${action}`);
    }
    // Broadcast on any successful status update
    try {
      if (bc) bc.postMessage({ type: 'status', departmentId, queueId: id, action });
      else localStorage.setItem('queue_update_broadcast', JSON.stringify({ ts: Date.now(), departmentId }));
    } catch {}
  };

  const handleBulkAction = async (action) => {
    if (selectedItems.length === 0) {
      alert('Please select items first');
      return;
    }
    try {
      setIsLoading(true);
      const doAction = action === 'process' ? 'accept' : action === 'complete' ? 'complete' : 'accept';
      await Promise.all(selectedItems.map((id) => updateStatus(String(id), doAction)));
      // Optimistically reflect changes
      if (doAction === 'accept') {
        setAssessments(prev => prev.map(row => selectedItems.includes(String(row.id)) ? { ...row, status: 'in_progress' } : row));
        setFilteredAssessments(prev => prev.map(row => selectedItems.includes(String(row.id)) ? { ...row, status: 'in_progress' } : row));
      } else if (doAction === 'complete') {
        // completed items should remain visible with updated status
        setAssessments(prev => prev.map(row => selectedItems.includes(String(row.id)) ? { ...row, status: 'completed', dateSubmitted: formatYmdPH(new Date()) } : row));
        setFilteredAssessments(prev => prev.map(row => selectedItems.includes(String(row.id)) ? { ...row, status: 'completed', dateSubmitted: formatYmdPH(new Date()) } : row));
      }
      await refreshHistory();
      setSelectedItems([]);
      alert(`Bulk ${doAction === 'accept' ? 'Process' : 'Complete'} finished`);
    } catch (e) {
      console.error(e);
      alert(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(String(id)) 
        ? prev.filter(item => item !== String(id))
        : [...prev.map(String), String(id)]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === filteredAssessments.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredAssessments.map(item => String(item.id)));
    }
  };

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

  return (
    <div className="p-6 bg-white min-h-screen">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-red-500">
          {user && user.role === 'admin' && user.department 
            ? `${user.department} Transaction Purpose Analysis`
            : 'TRANSACTION PURPOSE ANALYSIS'
          }
        </h1>
      </div>

      {/* Department-specific welcome message */}
      {user && user.role === 'admin' && user.department && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h2 className="text-lg font-semibold mb-2 text-blue-800">
            Transaction Analysis for {user.department}
          </h2>
          <p className="text-sm text-blue-700">
            Analyze transaction purposes and patterns for your department.
          </p>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Total Assessments Today</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.totalToday}</p>
            </div>
            <div className="p-3 rounded-full bg-blue-100">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Average Processing Time</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.avgProcessingTime}h</p>
            </div>
            <div className="p-3 rounded-full bg-green-100">
              <Clock className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Pending Reviews</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.pendingReviews}</p>
            </div>
            <div className="p-3 rounded-full bg-yellow-100">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-600">Completed This Week</h3>
              <p className="text-2xl font-bold text-gray-900 mt-1">{summaryStats.completedThisWeek}</p>
            </div>
            <div className="p-3 rounded-full bg-purple-100">
              <TrendingUp className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <h3 className="text-lg font-semibold mb-4">Daily Completion Rate</h3>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className="bg-green-500 h-3 rounded-full transition-all duration-300"
            style={{ width: `${Math.min((summaryStats.completedToday / Math.max(summaryStats.totalToday, 1)) * 100, 100)}%` }}
          ></div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          {Math.round(Math.min((summaryStats.completedToday / Math.max(summaryStats.totalToday, 1)) * 100, 100))}% completed
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-4 mb-6">
        <button
          onClick={handleExportReport}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-lg transition-colors flex-shrink-0 whitespace-nowrap text-sm font-medium border bg-green-50 hover:bg-green-100 text-green-700 cursor-pointer border-green-700"
        >
          <Download className="w-4 h-4" />
          <span>Download Excel</span>
        </button>
        
        <button
          onClick={handleAddNewAssessment}
          className="bg-blue-500 hover:bg-blue-600 active:bg-blue-700 hover:opacity-90 active:opacity-100 transition-colors text-white px-4 py-2 rounded-lg flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Assessment</span>
        </button>

        <div className="flex space-x-2">
          {/* Process Selected (bulk mark in progress) */}
          <button
            onClick={() => {
              if (selectedItems.length === 0) { alert('Please select items first'); return; }
              handleBulkAction('process');
            }}
            className="bg-purple-500 hover:bg-purple-600 active:bg-purple-700 hover:opacity-90 active:opacity-100 transition-colors text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Process Selected</span>
          </button>
          
          <button
            onClick={() => {
              if (selectedItems.length === 0) { alert('Please select items first'); return; }
              handleBulkAction('complete');
            }}
            className="bg-green-500 hover:bg-green-600 active:bg-green-700 hover:opacity-90 active:opacity-100 transition-colors text-white px-4 py-2 rounded-lg flex items-center space-x-2"
          >
            <CheckCircle className="w-4 h-4" />
            <span>Complete Selected</span>
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow-md mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Filters</h3>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center space-x-2 text-blue-600 hover:text-blue-800"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? 'Hide' : 'Show'} Advanced Filters</span>
          </button>
        </div>

        {/* Always visible date filter */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">Date Filter</label>
          <div className="flex flex-wrap gap-4">
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Dates</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
              <option value="custom">Custom Range</option>
            </select>
            
            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={customDateRange.start}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Start Date"
                />
                <input
                  type="date"
                  value={customDateRange.end}
                  onChange={(e) => setCustomDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="End Date"
                />
              </div>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search assessments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-full"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
              <option value="requires_review">Requires Review</option>
            </select>

            {/* Type Filter */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="Property Assessment">Property Assessment</option>
              <option value="Tax Computation">Tax Computation</option>
              <option value="Valuation Request">Valuation Request</option>
            </select>

          </div>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <SortableTable
          data={filteredAssessments}
          columns={[
            {
              key: 'select',
              header: (
                <input
                  type="checkbox"
                  checked={selectedItems.length === filteredAssessments.length && filteredAssessments.length > 0}
                  onChange={handleSelectAll}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              ),
              sortable: false,
              render: (value, assessment) => (
                <input
                  type="checkbox"
                  checked={selectedItems.includes(String(assessment.id))}
                  onChange={() => handleSelectItem(assessment.id)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
              )
            },
            {
              key: 'transactionType',
              header: 'Transaction Type',
              sortable: true,
              render: (value) => (
                <div className="flex items-center whitespace-nowrap">
                  <FileText className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm font-medium text-gray-900">{value}</span>
                </div>
              )
            },
            {
              key: 'citizenName',
              header: 'Citizen Name',
              sortable: true,
              render: (value) => (
                <div className="flex items-center whitespace-nowrap">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{value}</span>
                </div>
              )
            },
            {
              key: 'propertyAddress',
              header: 'Property Address',
              sortable: true,
              render: (value) => <span className="text-sm text-gray-900">{value}</span>
            },
            {
              key: 'assessmentValue',
              header: 'Assessment Value',
              sortable: true,
              className: 'whitespace-nowrap',
              render: (value) => <span className="text-sm font-medium text-gray-900">{formatCurrency(value)}</span>
            },
            {
              key: 'taxAmount',
              header: 'Tax Amount',
              sortable: true,
              className: 'whitespace-nowrap',
              render: (value) => <span className="text-sm font-medium text-green-600">{formatCurrency(value)}</span>
            },
            {
              key: 'status',
              header: 'Status',
              sortable: true,
              className: 'whitespace-nowrap',
              render: (value) => (
                <div className="flex items-center">
                  {getStatusIcon(value)}
                  <span className={`ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(value)}`}>
                    {value.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
              )
            },
            {
              key: 'dateSubmitted',
              header: 'Date Submitted',
              sortable: true,
              className: 'whitespace-nowrap',
              render: (value) => (
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{value}</span>
                </div>
              )
            },
            {
              key: 'processingTime',
              header: 'Processing Time',
              sortable: true,
              className: 'whitespace-nowrap',
              render: (value) => (
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-sm text-gray-900">{value}</span>
                </div>
              )
            },
            {
              key: 'assignedStaff',
              header: 'Assigned Staff',
              sortable: true,
              className: 'whitespace-nowrap',
              render: (value) => <span className="text-sm text-gray-900">{value}</span>
            },
            {
              key: 'actions',
              header: 'Actions | Reason',
              sortable: false,
              className: 'whitespace-nowrap text-sm font-medium',
              render: (value, assessment) => (
                <div className="flex space-x-3">
                  <button
                    className="text-blue-600 hover:text-blue-900 focus:outline-none"
                    title="View Details"
                    aria-label="View Details"
                    onClick={() => setViewItem(assessment)}
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    className="text-green-600 hover:text-green-900 focus:outline-none"
                    title="Mark Complete"
                    aria-label="Mark Complete"
                    onClick={async () => {
                      try { 
                        setIsLoading(true); 
                        await updateStatus(assessment.id, 'complete'); 
                        await refreshHistory(); 
                        alert('Assessment marked as completed'); 
                      }
                      catch(e){ alert(e.message);} 
                      finally { setIsLoading(false);} 
                    }}
                  >
                    <CheckCircle className="w-4 h-4" />
                  </button>
                  <button
                    className="text-orange-600 hover:text-orange-900 focus:outline-none"
                    title="Mark for Review"
                    aria-label="Mark for Review"
                    onClick={async () => {
                      try { 
                        setIsLoading(true); 
                        await updateStatus(assessment.id, 'accept'); 
                        await refreshHistory(); 
                        alert('Assessment marked for review (in progress)'); 
                      }
                      catch(e){ alert(e.message);} 
                      finally { setIsLoading(false);} 
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-900 focus:outline-none"
                    title="Delete Assessment"
                    aria-label="Delete Assessment"
                    onClick={async () => {
                      try {
                        if (!window.confirm('Are you sure you want to delete this assessment?')) return;
                        setIsLoading(true);
                        await updateStatus(assessment.id, 'cancel');
                        setAssessments(prev => prev.filter(item => item.id !== assessment.id));
                        setFilteredAssessments(prev => prev.filter(item => item.id !== assessment.id));
                        removeMetaFor(assessment.id);
                        alert('Assessment deleted.');
                      } catch(e){
                        alert(e.message);
                      } finally {
                        setIsLoading(false);
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            }
          ]}
          isLoading={isLoading}
          emptyMessage="No assessments found matching your criteria."
        />
      </div>

      {/* Selected Items Info */}
      {selectedItems.length > 0 && (
        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            {selectedItems.length} item(s) selected
          </p>
        </div>
      )}

      {/* Add Assessment Modal */}
      <AddAssessmentModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onSubmit={handleAssessmentSubmit}
        departments={[user?.department ? { id: departmentId || 0, name: user.department } : null].filter(Boolean)}
        transactionOptions={(Object.values(transactionsByName || {}).map(t => t.name))}
        isSuperAdmin={false}
      />

      {/* View Details Modal */}
      {viewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setViewItem(null)}>
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-semibold">Assessment Details</h3>
              <button className="text-gray-500 hover:text-gray-700" onClick={() => setViewItem(null)}>✕</button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Transaction Type</div>
                <div className="font-medium">{viewItem.transactionType || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Status</div>
                <div className="font-medium capitalize">{String(viewItem.status || '').replace('_',' ') || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Citizen Name</div>
                <div className="font-medium">{viewItem.citizenName || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Property Address</div>
                <div className="font-medium">{viewItem.propertyAddress || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Assessment Value</div>
                <div className="font-medium">{formatCurrency(viewItem.assessmentValue || 0)}</div>
              </div>
              <div>
                <div className="text-gray-500">Tax Amount</div>
                <div className="font-medium text-green-600">{formatCurrency(viewItem.taxAmount || 0)}</div>
              </div>
              <div>
                <div className="text-gray-500">Date Submitted</div>
                <div className="font-medium">{viewItem.dateSubmitted || '—'}</div>
              </div>
              <div>
                <div className="text-gray-500">Assigned Staff</div>
                <div className="font-medium">{viewItem.assignedStaff || '—'}</div>
              </div>
              <div className="md:col-span-2">
                <div className="text-gray-500">Queue Number</div>
                <div className="font-medium">{viewItem.fullQueueNumber || '—'}</div>
              </div>
            </div>
            <div className="p-4 border-t flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700" onClick={() => setViewItem(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransactionPurposeAnalysis;