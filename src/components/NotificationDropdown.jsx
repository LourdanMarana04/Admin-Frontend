import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const NotificationDropdown = ({ isOpen, onClose, isDarkMode, unreadNotifications, unreadCount }) => {
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSeeAll = () => {
    navigate('/notifications');
    onClose();
  };

  const handleMarkAsRead = (notificationId) => {
    const token = localStorage.getItem('token');
    fetch('http://localhost:8000/api/notifications/mark-read', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notification_id: notificationId }),
    }).catch(error => console.error('Error marking notification as read:', error));
  };

  return (
    <div
      className={`absolute right-0 mt-2 w-80 rounded-lg shadow-xl z-50 ${
        isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
        <h3 className={`text-lg font-semibold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
          Notifications
        </h3>
      </div>

      <div className="max-h-96 overflow-y-auto">
        {unreadNotifications && unreadNotifications.length > 0 ? (
          <div className="space-y-2 p-3">
            {unreadNotifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors ${
                  isDarkMode
                    ? 'bg-gray-700 hover:bg-gray-600'
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => handleMarkAsRead(notification.id)}
              >
                <div className="flex items-start gap-2">
                  <div
                    className={`w-2 h-2 rounded-full mt-1 flex-shrink-0 ${
                      notification.type === 'error'
                        ? 'bg-red-500'
                        : notification.type === 'success'
                        ? 'bg-green-500'
                        : notification.type === 'warning'
                        ? 'bg-yellow-500'
                        : 'bg-blue-500'
                    }`}
                  ></div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold text-sm ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                      {notification.title}
                    </p>
                    <p className={`text-xs mt-1 line-clamp-2 ${isDarkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                      {notification.message}
                    </p>
                    <p className={`text-xs mt-1 ${isDarkMode ? 'text-gray-500' : 'text-gray-500'}`}>
                      {notification.time_ago}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={`p-8 text-center ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
            <p className="text-sm">No New Notifications</p>
          </div>
        )}
      </div>

      <div
        className={`p-4 border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} text-center cursor-pointer`}
        onClick={handleSeeAll}
      >
        <p className={`text-sm font-medium ${isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}>
          See all notifications
        </p>
      </div>
    </div>
  );
};

export default NotificationDropdown;
