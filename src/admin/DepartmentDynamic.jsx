import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useParams, useOutletContext } from 'react-router-dom';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { useQueue } from '../utils/QueueContext.jsx';
import ServingPanel from '../components/ServingPanel.jsx';

const DepartmentDynamic = () => {
  const { isDarkMode } = useOutletContext();
  const navigate = useNavigate();
  const { name } = useParams();
  const { departments } = useDepartments();
  const user = JSON.parse(localStorage.getItem('user'));
  const { getLatestQueueNumber, getLatestQueueTransaction, getLatestQueueTimestamp } = useQueue();
  const [queueData, setQueueData] = useState([]);
  const [resetting, setResetting] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [showResetModal, setShowResetModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const pageSize = 10;

  const [kioskPage, setKioskPage] = useState(0);
  const [webPage, setWebPage] = useState(0);
  const [showServingPanel, setShowServingPanel] = useState(false);
  const [selectedQueueDetails, setSelectedQueueDetails] = useState(null);
  const [currentTransaction, setCurrentTransaction] = useState(null);

  // Decode and format the department name from the URL
  const displayName = decodeURIComponent(name || '').replace(/-/g, ' ');
  
  // Get department prefix using the same mapping as backend
  const getDepartmentPrefix = (departmentName) => {
    const prefixMap = {
      'Assessor': 'ASR',
      'Treasury': 'TRY',
      'Office of the City Mayor': 'OCM',
      'Office of the City Planning and Development Coordinator': 'CPDC',
      'City Planning and Development Coordinator': 'CPDC',
      'Human Resources Management Office': 'HRM',
      'Sangguniang Panglungsod': 'SP',
      'City Information Office': 'CIO',
      'Office of the City Administrator': 'OCA',
      'General Services Office': 'GSO',
      'Business Permits and Licensing Office': 'BPLO',
    };

    // Check for exact match first
    if (prefixMap[departmentName]) {
      return prefixMap[departmentName];
    }

    // Check for partial matches (case insensitive)
    const departmentNameLower = departmentName.toLowerCase();
    for (const [key, prefix] of Object.entries(prefixMap)) {
      if (departmentNameLower.includes(key.toLowerCase())) {
        return prefix;
      }
    }

    // Fallback to first 3 letters if no match found
    return departmentName.substring(0, 3).toUpperCase();
  };
  
  const prefix = getDepartmentPrefix(displayName);

  const departmentInfo = departments.find(d => d.name.toLowerCase() === displayName.toLowerCase());

  // Restrict admin access to their assigned department only
  if (user && user.role === 'admin' && user.department !== displayName) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="max-w-2xl mx-auto p-8 text-center">
          <h2 className={`text-2xl font-bold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Access Denied</h2>
          <p className={`${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>You do not have permission to access this department.</p>
        </div>
      </div>
    );
  }

  const handleBack = () => {
    navigate('/departments');
  };

  const handleQueueClick = (queueDetails) => {
    setSelectedQueueDetails(queueDetails);
    setShowServingPanel(true);
  };

  const handleAcceptTransaction = async (queueDetails) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/queue/accept', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          queue_id: queueDetails.id,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Transaction accepted: ${result.queue_number}`);
        setShowServingPanel(false);
        setSelectedQueueDetails(null);
        // Navigate to the now serving page for processing
        navigate(`/nowserving/${encodeURIComponent(displayName)}/${queueDetails.id}`, {
          state: { 
            queue: queueDetails.full_queue_number || `${prefix}#${String(queueDetails.queue_number).padStart(3, '0')}`, 
            queueDetails: queueDetails,
            department: displayName,
            prefix 
          },
        });
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to accept transaction');
      }
    } catch (error) {
      console.error('Error accepting transaction:', error);
      throw error;
    }
  };

  const handleCancelTransaction = async (queueDetails, cancelReason = null) => {
    try {
      const token = localStorage.getItem('token');
      
      const requestBody = {
        queue_id: queueDetails.id
      };
      
      // Add cancel_reason if provided
      if (cancelReason) {
        requestBody.cancel_reason = cancelReason;
      }
      
      const response = await fetch('http://localhost:8000/api/queue/cancel', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Transaction canceled: ${result.queue_number}`);
        setShowServingPanel(false);
        setSelectedQueueDetails(null);
      } else {
        const error = await response.json();
        throw new Error(error.message || 'Failed to cancel transaction');
      }
    } catch (error) {
      console.error('Error canceling transaction:', error);
      throw error;
    }
  };

  // Fetch real queue data from backend
  useEffect(() => {
    const fetchQueueData = async () => {
      if (departmentInfo) {
        try {
          const response = await fetch(`http://localhost:8000/api/queue/status/${departmentInfo.id}`);
          if (response.ok) {
            const data = await response.json();
            setQueueData(data);
          }
        } catch (error) {
          console.error('Error fetching queue data:', error);
        }
      }
    };

    fetchQueueData();
    const interval = setInterval(fetchQueueData, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, [departmentInfo]);

  // Get the latest queue number for this department
  const latestQueueNumber = departmentInfo ? getLatestQueueNumber(departmentInfo.id) : null;
  const latestTransaction = departmentInfo ? getLatestQueueTransaction(departmentInfo.id) : null;
  const latestTimestamp = departmentInfo ? getLatestQueueTimestamp(departmentInfo.id) : null;

  // Check if the queue number is recent (within last 5 minutes)
  const isRecent = latestTimestamp && 
    (new Date() - new Date(latestTimestamp)) < 5 * 60 * 1000;

  // Priority queue system: 3 priority → 1 normal → 3 priority → 1 normal
  const priorityQueueLogic = (queueItems) => {
    const priorityItems = queueItems.filter(item => item.priority);
    const normalItems = queueItems.filter(item => !item.priority);
    
    const result = [];
    let priorityIndex = 0;
    let normalIndex = 0;
    let priorityCount = 0;
    
    while (priorityIndex < priorityItems.length || normalIndex < normalItems.length) {
      // Add 3 priority items
      for (let i = 0; i < 3 && priorityIndex < priorityItems.length; i++) {
        result.push(priorityItems[priorityIndex]);
        priorityIndex++;
        priorityCount++;
      }
      
      // Add 1 normal item
      if (normalIndex < normalItems.length) {
        result.push(normalItems[normalIndex]);
        normalIndex++;
      }
    }
    
    return result;
  };

  // Filter users into their respective panels with priority logic
  const allKioskUsers = queueData.filter(item => (item.status === 'waiting' || item.status === 'pending') && item.source !== 'web');
  const allWebUsers = queueData.filter(item => item.status === 'waiting' && item.source === 'web');
  
  const kioskUsers = priorityQueueLogic(allKioskUsers);
  const webUsers = priorityQueueLogic(allWebUsers);

  // Get the next transaction to be processed (first in priority queue)
  const getNextTransaction = () => {
    const allUsers = [...kioskUsers, ...webUsers];
    return allUsers.length > 0 ? allUsers[0] : null;
  };

  const nextTransaction = getNextTransaction();

  // Pagination logic for each panel
  const kioskTotalPages = Math.ceil(kioskUsers.length / pageSize);
  const paginatedKioskUsers = kioskUsers.slice(kioskPage * pageSize, (kioskPage + 1) * pageSize);

  const webTotalPages = Math.ceil(webUsers.length / pageSize);
  const paginatedWebUsers = webUsers.slice(webPage * pageSize, (webPage + 1) * pageSize);

  // Reset queue handler
  const handleResetQueue = async () => {
    if (!departmentInfo) return;
    setResetting(true);
    setResetMessage('');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/queue/reset/${departmentInfo.id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to reset queue');
      }
      
      setShowResetModal(false);
      setShowSuccessModal(true);
      setTimeout(() => setShowSuccessModal(false), 2500);
      setKioskPage(0);
      setWebPage(0);
      // Refetch queue data
      const queueResponse = await fetch(`http://localhost:8000/api/queue/status/${departmentInfo.id}`);
      if (queueResponse.ok) {
        const data = await queueResponse.json();
        setQueueData(data);
      }
    } catch (error) {
      console.error('Reset queue error:', error);
      setResetMessage('Failed to reset queue.');
      setTimeout(() => setResetMessage(''), 3000);
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className={`flex flex-row h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Main Content */}
      <div className="flex-1 p-8 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h1 className={`text-3xl font-bold ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>{displayName.toUpperCase()} DEPARTMENT</h1>
          <button
            onClick={handleBack}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded shadow transition duration-300"
          >
            Back to Departments
          </button>
        </div>

        {/* Queue Monitoring */}
        <div className={`p-6 rounded-lg shadow-lg relative ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
          {/* Priority/Pending Indicator */}
          <div className={`absolute top-6 right-6 rounded-lg p-3 text-sm shadow-md ${isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'}`}>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-blue-500 rounded-sm border border-blue-700"></span>
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Priority</span>
              </div>
              <div className="flex items-center gap-1">
                <span className="w-4 h-4 bg-yellow-400 rounded-sm border border-yellow-600"></span>
                <span className={`${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>Pending</span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                disabled={resetting}
                className={`px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition duration-200 ${resetting ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {resetting ? 'Resetting...' : 'Reset Queue'}
              </button>
            </div>
          </div>

          {/* Current Transaction Button */}
          <div className="flex justify-center mb-6">
            <button
              onClick={() => {
                if (nextTransaction) {
                  setSelectedQueueDetails(nextTransaction);
                  setShowServingPanel(true);
                }
              }}
              disabled={!nextTransaction}
              className={`font-bold py-4 px-8 rounded-lg shadow-lg transition duration-200 border-2 ${
                nextTransaction 
                  ? nextTransaction.priority
                    ? 'bg-blue-500 hover:bg-blue-600 text-white border-blue-700 cursor-pointer'
                    : 'bg-yellow-400 hover:bg-yellow-500 text-black border-yellow-600 cursor-pointer'
                  : 'bg-gray-400 text-gray-600 border-gray-500 cursor-not-allowed'
              }`}
            >
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">
                  Current Transaction
                </div>
                <div className="text-2xl font-extrabold mb-2">
                  {nextTransaction ? (nextTransaction.full_queue_number || `${prefix}#${String(nextTransaction.queue_number).padStart(3, '0')}`) : ''}
                </div>
                <div className="text-sm opacity-90">
                   {nextTransaction ? (nextTransaction.transaction_name || '-') : '-'}
                </div>
                <div className="text-sm opacity-90">
                  Source: {nextTransaction ? (nextTransaction.source || '-') : '-'}
                </div>
              </div>
            </button>
          </div>

          {/* Reset Confirmation Modal */}
          {showResetModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className={`rounded-lg shadow-lg p-8 max-w-sm w-full text-center ${isDarkMode ? 'bg-gray-800' : 'bg-white'}`}>
                <h2 className={`text-xl font-bold mb-4 ${isDarkMode ? 'text-red-400' : 'text-red-700'}`}>Reset Queue?</h2>
                <p className={`mb-6 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>Are you sure you want to reset the queue for this department? <br/> <span className={`font-semibold ${isDarkMode ? 'text-red-400' : 'text-red-600'}`}>This action cannot be undone.</span></p>
                <div className="flex justify-center gap-4">
                  <button
                    className="px-4 py-2 bg-gray-300 hover:bg-gray-400 rounded font-semibold"
                    onClick={() => setShowResetModal(false)}
                    disabled={resetting}
                  >
                    Cancel
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold"
                    onClick={handleResetQueue}
                    disabled={resetting}
                  >
                    {resetting ? 'Resetting...' : 'Yes, Reset'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Success Modal */}
          {showSuccessModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-800 rounded-lg shadow-lg p-6 max-w-xs w-full text-center font-semibold">
                Queue has been reset for this department.
              </div>
            </div>
          )}

          {resetMessage && !showSuccessModal && (
            <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-800 rounded text-center font-semibold">
              {resetMessage}
            </div>
          )}

          <div className="flex flex-row rounded-lg p-4 gap-6">
            {/* Kiosk Users */}
            <div className={`flex-1 rounded-lg p-6 border overflow-y-auto max-h-[600px] ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
              <h2 className={`text-xl font-bold mb-6 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>KIOSK USERS</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                {paginatedKioskUsers.length > 0 ? paginatedKioskUsers.map((item, index) => {
                  // Determine button style based on status and priority
                  let buttonStyle = 'bg-yellow-400 text-black'; // default waiting
                  if (item.priority && item.status === 'waiting') {
                    buttonStyle = 'bg-blue-500 text-white'; // priority waiting
                  }
                  
                  // Format timestamp
                  const timestamp = new Date(item.created_at);
                  const timeString = timestamp.toLocaleTimeString('en-US', { 
                    hour: 'numeric', 
                    minute: '2-digit',
                    hour12: true 
                  });
                  const dateString = timestamp.toLocaleDateString('en-US', { 
                    month: 'short', 
                    day: 'numeric' 
                  }).toUpperCase();
                  
                  return (
                    <div key={index} className="text-center">
                      <div
                        className={`text-xl font-extrabold py-6 px-3 rounded-lg shadow flex flex-col items-center justify-center w-full min-h-[120px] ${buttonStyle} cursor-default`}
                      >
                        <span>{item.full_queue_number || `${prefix}#${String(item.queue_number).padStart(3, '0')}`}</span>
                        <span className="text-sm mt-2 opacity-90">Time: {timeString} {dateString}</span>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    No waiting kiosk users
                  </div>
                )}
              </div>
              {/* Pagination controls for KIOSK USERS */}
              {kioskUsers.length > pageSize && (
                <div className="flex justify-center items-center mt-4 gap-2">
                  <button
                    onClick={() => setKioskPage(kioskPage - 1)}
                    disabled={kioskPage === 0}
                    className={`px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold ${kioskPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {'<'}
                  </button>
                  <span className="mx-2 text-sm">Page {kioskPage + 1} of {kioskTotalPages}</span>
                  <button
                    onClick={() => setKioskPage(kioskPage + 1)}
                    disabled={kioskPage === kioskTotalPages - 1}
                    className={`px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold ${kioskPage === kioskTotalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {'>'}
                  </button>
                </div>
              )}
            </div>

            {/* Web Users */}
            <div className={`flex-1 rounded-lg p-6 border overflow-y-auto max-h-[600px] ${isDarkMode ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-300'}`}>
              <h2 className={`text-xl font-bold mb-6 text-center ${isDarkMode ? 'text-gray-200' : 'text-gray-800'}`}>WEB USERS</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 auto-rows-max">
                {paginatedWebUsers.length > 0 ? paginatedWebUsers.map((item, index) => {
                    // Color coding logic: blue for priority waiting, yellow for normal waiting
                    let buttonStyle = 'bg-yellow-400 text-black'; // default waiting
                    if (item.priority && item.status === 'waiting') {
                      buttonStyle = 'bg-blue-500 text-white'; // priority waiting
                    }
                    
                    // Format timestamp
                    const timestamp = new Date(item.created_at);
                    const timeString = timestamp.toLocaleTimeString('en-US', { 
                      hour: 'numeric', 
                      minute: '2-digit',
                      hour12: true 
                    });
                    const dateString = timestamp.toLocaleDateString('en-US', { 
                      month: 'short', 
                      day: 'numeric' 
                    }).toUpperCase();
                    
                    return (
                      <div key={index} className="text-center">
                        <div
                          className={`text-xl font-extrabold py-6 px-3 rounded-lg shadow flex flex-col items-center justify-center w-full min-h-[120px] ${buttonStyle} cursor-default`}
                        >
                          <span>{item.full_queue_number}</span>
                          <span className="text-sm mt-2 opacity-90">Time: {timeString} {dateString}</span>
                        </div>
                      </div>
                    );
                  }) : (
                  <div className="col-span-full text-center text-gray-500 py-8">
                    No waiting web users
                  </div>
                )}
              </div>
              {/* Pagination controls for WEB USERS */}
              {webUsers.length > pageSize && (
                <div className="flex justify-center items-center mt-4 gap-2">
                  <button
                    onClick={() => setWebPage(webPage - 1)}
                    disabled={webPage === 0}
                    className={`px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold ${webPage === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {'<'}
                  </button>
                  <span className="mx-2 text-sm">Page {webPage + 1} of {webTotalPages}</span>
                  <button
                    onClick={() => setWebPage(webPage + 1)}
                    disabled={webPage === webTotalPages - 1}
                    className={`px-3 py-1 rounded bg-gray-200 hover:bg-gray-300 text-lg font-bold ${webPage === webTotalPages - 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {'>'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Serving Panel */}
      {showServingPanel && selectedQueueDetails && (
        <ServingPanel
          queueDetails={selectedQueueDetails}
          departmentName={displayName}
          onClose={() => {
            setShowServingPanel(false);
            setSelectedQueueDetails(null);
          }}
          onAccept={handleAcceptTransaction}
          onCancel={handleCancelTransaction}
        />
      )}
    </div>
  );
};

export default DepartmentDynamic; 