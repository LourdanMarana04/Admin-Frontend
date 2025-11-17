import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Clock, User, FileText } from 'lucide-react';

const ServingPanel = ({ queueDetails, departmentName, onClose, onAccept, onCancel }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [action, setAction] = useState(null);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancelDialog, setShowCancelDialog] = useState(false);

  // Common cancellation reasons
  const cancelReasons = [
    'Unattended',
    'No Response from Client',
    'Incomplete Requirements',
    'Technical Issue',
    'Client Requested Cancellation',
    'System Error',
    'Time Limit Exceeded',
    'Duplicate Transaction',
    'Invalid Transaction',
    'Other'
  ];

  const handleAccept = async () => {
    setIsLoading(true);
    setAction('accept');
    try {
      await onAccept(queueDetails);
    } catch (error) {
      console.error('Error accepting transaction:', error);
      alert('Failed to accept transaction. Please try again.');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const handleCancel = () => {
    // Show the cancel dialog instead of a simple confirm
    setShowCancelDialog(true);
  };

  const confirmCancel = async () => {
    if (!cancelReason.trim()) {
      alert('Please select a reason for cancellation.');
      return;
    }

    setIsLoading(true);
    setAction('cancel');
    try {
      await onCancel(queueDetails, cancelReason);
      setShowCancelDialog(false);
      setCancelReason('');
    } catch (error) {
      console.error('Error canceling transaction:', error);
      alert('Failed to cancel transaction. Please try again.');
    } finally {
      setIsLoading(false);
      setAction(null);
    }
  };

  const closeCancelDialog = () => {
    setShowCancelDialog(false);
    setCancelReason('');
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' });
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-PH', { timeZone: 'Asia/Manila' });
  };

  if (!queueDetails) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      {showCancelDialog ? (
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Cancel Transaction</h2>
          <p className="text-gray-600 mb-4">
            Please select a reason for canceling this transaction:
          </p>
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Queue: {queueDetails.full_queue_number || queueDetails.queue_number}</p>
            <p className="text-sm font-medium text-gray-700 mb-3">Transaction: {queueDetails.transaction_name || 'N/A'}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for Cancellation:
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              required
            >
              <option value="">Select a reason...</option>
              {cancelReasons.map((reason, index) => (
                <option key={index} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>
          <div className="flex justify-end space-x-3">
            <button
              onClick={closeCancelDialog}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              onClick={confirmCancel}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              disabled={!cancelReason.trim()}
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          {/* Header */}
          <div className="bg-blue-600 text-white px-6 py-4 rounded-t-lg">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold">Serving Panel</h2>
              <button
                onClick={onClose}
                className="text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <p className="text-blue-100 mt-1">{departmentName}</p>
          </div>

          {/* Queue Number Display */}
          <div className="px-6 py-6">
            <div className="text-center mb-6">
              <div className={`inline-block text-5xl font-extrabold border-4 px-10 py-6 mb-4 rounded-lg shadow-lg
                ${queueDetails.priority ? 'bg-blue-500 text-white border-blue-700' : 'bg-yellow-400 text-black border-yellow-600'}`}
              >
                {queueDetails.full_queue_number || queueDetails.queue_number}
              </div>
              {queueDetails.priority && (
                <div className="text-sm text-blue-600 font-semibold mb-2">
                  ⭐ Priority Queue
                </div>
              )}
              <div className="text-sm text-gray-600 font-medium">
                Status: {queueDetails.status === 'waiting' ? 'Waiting' : 'Pending'}
              </div>
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex items-center space-x-3 mb-3">
                <FileText className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-800">Transaction Details</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Transaction:</span>
                  <span className="font-medium">{queueDetails.transaction_name || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Source:</span>
                  <span className="font-medium capitalize">{queueDetails.source || 'kiosk'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">{formatDate(queueDetails.created_at)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Time:</span>
                  <span className="font-medium">{formatTime(queueDetails.created_at)}</span>
                </div>
                {queueDetails.senior_citizen && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Senior Citizen:</span>
                    <span className="font-medium text-green-600">Yes</span>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex space-x-4">
              <button
                onClick={handleAccept}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  isLoading && action === 'accept'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading && action === 'accept' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Accept</span>
                  </>
                )}
              </button>

              <button
                onClick={handleCancel}
                disabled={isLoading}
                className={`flex-1 flex items-center justify-center space-x-2 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                  isLoading && action === 'cancel'
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg'
                }`}
              >
                {isLoading && action === 'cancel' ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <X className="w-5 h-5" />
                    <span>Cancel</span>
                  </>
                )}
              </button>
            </div>

            {/* Info Text */}
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Accept to proceed to transaction processing, or Cancel to mark as failed.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServingPanel; 