import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import logo from '../assets/logo-seal.png';

const NowServing = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { department, queueId, id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [liveEstimatedWait, setLiveEstimatedWait] = useState(null);
  const [queueData, setQueueData] = useState([]);
  const [avgProcessingTime, setAvgProcessingTime] = useState(10); // default 10 mins
  const [cancelReason, setCancelReason] = useState('');
  const [showFailureDialog, setShowFailureDialog] = useState(false);

  // Fallback queue number
  const queueNumber = location.state?.queue || queueId || id || 'QUE#0';
  const queueDetails = location.state?.queueDetails;
  const departmentName = location.state?.department || department || '';
  const prefix = location.state?.prefix || '';

  // Fetch latest queue and recalculate estimated wait time
  useEffect(() => {
    const fetchQueue = async () => {
      if (!queueDetails?.department_id) return;
      try {
        const response = await fetch(`http://localhost:8000/api/queue/status/${queueDetails.department_id}`);
        if (response.ok) {
          const data = await response.json();
          setQueueData(data);
          // Find this queue's position in the waiting queue
          const waitingQueue = data.filter(item => item.status === 'waiting' || item.status === 'pending');
          const index = waitingQueue.findIndex(item => item.id === queueDetails.id);
          // Get avg processing time from backend if available (optional: you can add this to backend response)
          // For now, use default 10 mins
          const est = index >= 0 ? (index) * avgProcessingTime : 0;
          setLiveEstimatedWait(est);
        }
      } catch (e) {
        // ignore
      }
    };
    fetchQueue();
    const interval = setInterval(fetchQueue, 30000); // every 30s
    return () => clearInterval(interval);
  }, [queueDetails]);

  // Set currently serving queue number when this page is opened
  useEffect(() => {
    if (queueDetails?.department_id && queueNumber) {
      fetch('http://localhost:8000/api/queue/currently-serving', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department_id: queueDetails.department_id,
          queue_number: queueNumber,
        }),
      });
    }
  }, [queueDetails?.department_id, queueNumber]);

  // Determine correct department for back navigation
  const resolvedDepartment = department || 'treasury'; // fallback to treasury if department is undefined

  // Map department names to their correct routes
  const getDepartmentPath = (dept) => {
    const departmentPathMap = {
      treasury: '/treasury',
      assessor: '/assessor',
      cio: '/cio',
      'city-mayor': '/Office-of-the-City-Mayor',
      'city-planning': '/City-Planning-and-Development-Coordinator',
      'human-resources': '/Human-Resources-Management-Office',
      'sangguniang-panglungsod': '/Sangguniang-Panglungsod',
      'general-services': '/General-Services-Office',
      'business-permits': '/Business-Permits-and-Licensing-Office',
      'citymayor': '/Office-of-the-City-Mayor',
      'cityplanning': '/City-Planning-and-Development-Coordinator',
      'humanresources': '/Human-Resources-Management-Office',
      'sangguniangpanglungsod': '/Sangguniang-Panglungsod',
      'generalservices': '/General-Services-Office',
      'businesspermits': '/Business-Permits-and-Licensing-Office',
    };
    return departmentPathMap[dept] || '/departments';
  };

  const updateQueueStatus = async (status, cancelReason = null) => {
    if (!queueDetails?.id) {
      console.error('No queue ID found');
      return false;
    }

    try {
      const requestBody = {
        queue_id: queueDetails.id,
        status: status,
      };

      // Add cancel_reason if provided and status is failed
      if (status === 'failed' && cancelReason) {
        requestBody.cancel_reason = cancelReason;
      }

      const response = await fetch('http://localhost:8000/api/queue/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (response.ok) {
        return true;
      } else {
        console.error('Failed to update queue status');
        return false;
      }
    } catch (error) {
      console.error('Error updating queue status:', error);
      return false;
    }
  };

  const handleSuccess = async () => {
    setIsLoading(true);
    const success = await updateQueueStatus('successful');
    setIsLoading(false);
    
    if (success) {
      navigate(-1);
    } else {
      alert('Failed to update queue status. Please try again.');
    }
  };

  const handleFailed = () => {
    // Show the failure dialog
    setShowFailureDialog(true);
  };

  const confirmFailure = async () => {
    if (!cancelReason.trim()) {
      alert('Please provide a reason for the failed transaction.');
      return;
    }

    setIsLoading(true);
    const success = await updateQueueStatus('failed', cancelReason);
    setIsLoading(false);
    
    if (success) {
      setShowFailureDialog(false);
      navigate(-1);
    } else {
      alert('Failed to update queue status. Please try again.');
    }
  };

  const closeFailureDialog = () => {
    setShowFailureDialog(false);
    setCancelReason('');
  };

  // Format helpers
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' });
  };
  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' });
  };
  const formatWait = (minutes) => {
    if (minutes < 1) return 'Now';
    if (minutes < 60) return `${minutes} min${minutes > 1 ? 's' : ''}`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ' ' + m + 'm' : ''}`;
  };

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Failure Dialog */}
      {showFailureDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-4">Failed Transaction</h2>
            <p className="text-gray-600 mb-4">
              Please provide a reason why this transaction failed:
            </p>
            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-1">Queue: {queueNumber}</p>
              <p className="text-sm font-medium text-gray-700 mb-3">Transaction: {queueDetails?.transaction_name || 'N/A'}</p>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows="4"
                placeholder="Enter reason for failure..."
                required
              ></textarea>
            </div>
            <div className="flex justify-end space-x-3">
              <button
                onClick={closeFailureDialog}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={confirmFailure}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                disabled={!cancelReason.trim() || isLoading}
              >
                {isLoading ? 'Processing...' : 'Confirm Failure'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Back Arrow beside navbar */}
      <div className="flex items-center px-8 pt-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-700 hover:text-blue-900 font-semibold focus:outline-none"
          aria-label="Back"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          <span className="hidden sm:inline">Back</span>
        </button>
      </div>
      {/* Queue Display */}
      <div className="flex justify-center">
        <div className="max-w-xl w-full mt-8">
          <div className="bg-white px-10 py-10 rounded-2xl shadow-lg border border-black mx-auto">
            <div className="text-xl font-bold text-black-700 mb-8 text-center">NOW SERVING</div>
            <div className="text-center">
              <div className={`inline-block text-6xl font-extrabold border-4 px-16 py-6 mb-6 rounded-lg shadow-md
                ${queueDetails?.priority ? 'bg-blue-500 text-white border-blue-700' : 'bg-yellow-400 text-black border-yellow-600'}`}
              >
                {queueNumber}
              </div>
              {/* Transaction and Time Info */}
              <div className="mb-8 text-center">
                <div className="text-lg font-semibold text-blue-700 mb-2">
                  {queueDetails?.transaction_name || 'Transaction'}
                </div>
                <div className="text-sm text-gray-600">
                  {formatDate(queueDetails?.created_at)} • {formatTime(queueDetails?.created_at)}
                </div>
              </div>
              <div className="flex gap-4 justify-center mb-8">
                <button
                  onClick={handleSuccess}
                  disabled={isLoading}
                  className={`bg-green-600 hover:bg-green-700 text-white px-8 py-3 font-semibold rounded-lg shadow-md text-xl transition duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Updating...' : 'Successful'}
                </button>
                <button
                  onClick={handleFailed}
                  disabled={isLoading}
                  className={`bg-red-600 hover:bg-red-700 text-white px-8 py-3 font-semibold rounded-lg shadow-md text-xl transition duration-200 ${
                    isLoading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isLoading ? 'Updating...' : 'Failed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NowServing;
