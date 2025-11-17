import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { User, BarChart3, LineChart, Building, Users, Clock } from 'lucide-react';
import RealTimeNotification from '../components/RealTimeNotification.jsx';
import { getDepartmentIcon } from '../utils/departmentIcons';

const Dashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useOutletContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState({ role: '', email: '', department: '' });
  const [currentlyServing, setCurrentlyServing] = useState([]);
  const [queueDetails, setQueueDetails] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentQueues, setDepartmentQueues] = useState({});
  const [servingTransactions, setServingTransactions] = useState([]);
  const [completedTransactions, setCompletedTransactions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTransactions, setExpandedTransactions] = useState({});

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    
    if (storedUser && token) {
      try {
      setUser(JSON.parse(storedUser));
        setIsLoading(false);
      } catch (error) {
        console.error('Error parsing user data:', error);
        // Clear invalid data
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        navigate('/login');
      }
    } else {
      // Redirect to login if no user or token
      navigate('/login');
    }
  }, [navigate]);

  // Fetch departments
  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/departments');
        if (response.ok) {
          const data = await response.json();
          setDepartments(data.filter(dept => dept.active !== false));
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
      }
    };
    fetchDepartments();
  }, []);

  // Fetch currently serving numbers and queue details
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [servingResponse, detailsResponse] = await Promise.all([
          fetch('http://localhost:8000/api/queue/currently-serving'),
          fetch('http://localhost:8000/api/queue/latest-updates')
        ]);
        
        if (servingResponse.ok) {
          const servingData = await servingResponse.json();
          setCurrentlyServing(servingData);
        } else if (servingResponse.status === 429) {
          console.warn('Rate limited for currently serving data, skipping this update');
        } else {
          console.warn('Failed to fetch currently serving data:', servingResponse.status);
        }
        
        if (detailsResponse.ok) {
          const detailsData = await detailsResponse.json();
          setQueueDetails(detailsData);
        } else if (detailsResponse.status === 429) {
          console.warn('Rate limited for queue details, skipping this update');
        } else {
          console.warn('Failed to fetch queue details:', detailsResponse.status);
        }
      } catch (e) {
        console.error('Error fetching queue data:', e);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 8000); // Increased to 8 seconds
    return () => clearInterval(interval);
  }, []);

  // Fetch queue data for all departments
  useEffect(() => {
    const fetchAllDepartmentQueues = async () => {
      const queueData = {};
      
      for (const dept of departments) {
        try {
          const response = await fetch(`http://localhost:8000/api/queue/status/${dept.id}`);
          if (response.ok) {
            const data = await response.json();
            queueData[dept.id] = data;
          } else if (response.status === 429) {
            console.warn(`Rate limited for ${dept.name}, skipping this update`);
            queueData[dept.id] = []; // Set empty array instead of undefined
          } else {
            console.warn(`Failed to fetch queue for ${dept.name}: ${response.status}`);
            queueData[dept.id] = []; // Set empty array instead of undefined
          }
        } catch (error) {
          console.error(`Error fetching queue for ${dept.name}:`, error);
          queueData[dept.id] = []; // Set empty array instead of undefined
        }
      }
      
      setDepartmentQueues(queueData);
    };

    if (departments.length > 0 && !isLoading) {
      fetchAllDepartmentQueues();
      const interval = setInterval(fetchAllDepartmentQueues, 8000); // Increased to 8 seconds
      return () => clearInterval(interval);
    }
  }, [departments, isLoading]);

  // Fetch serving and completed transactions
  useEffect(() => {
    const fetchTransactionData = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Only fetch completed transactions if user is authenticated
        if (!token) {
          console.warn('No authentication token found, skipping completed transactions fetch');
        }
        
        // Fetch serving transactions (pending status)
        const servingPromises = departments.map(async (dept) => {
          try {
            const response = await fetch(`http://localhost:8000/api/queue/status/${dept.id}`);
            if (response.ok) {
              const data = await response.json();
              return data.filter(item => item.status === 'pending').map(item => ({
                ...item,
                department_name: dept.name
              }));
            } else if (response.status === 429) {
              console.warn(`Rate limited for ${dept.name}, skipping this update`);
              return [];
            } else {
              console.warn(`Failed to fetch serving data for ${dept.name}: ${response.status}`);
            }
          } catch (error) {
            console.error(`Error fetching serving data for ${dept.name}:`, error);
          }
          return [];
        });

        // Fetch completed transactions (successful/failed status) only if authenticated
        // Only fetch for departments the user has access to
        const accessibleDepartments = user && user.role ? 
          (user.role === 'super_admin' ? departments : 
           departments.filter(dept => dept.name === user.department)) : 
          [];
        
        const completedPromises = token ? accessibleDepartments.map(async (dept) => {
          try {
            const response = await fetch(`http://localhost:8000/api/queue/today-completed/${dept.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              return data.map(item => ({
                ...item,
                department_name: dept.name
              }));
            } else if (response.status === 401) {
              console.warn('Authentication failed, skipping completed transactions');
              return [];
            } else if (response.status === 403) {
              console.warn(`Access denied for ${dept.name}, skipping completed transactions`);
              return [];
            } else if (response.status === 429) {
              console.warn(`Rate limited for ${dept.name}, skipping completed transactions`);
              return [];
            } else {
              console.warn(`Failed to fetch completed data for ${dept.name}: ${response.status}`);
            }
          } catch (error) {
            console.error(`Error fetching completed data for ${dept.name}:`, error);
          }
          return [];
        }) : [Promise.resolve([])];

        const [servingResults, completedResults] = await Promise.all([
          Promise.all(servingPromises),
          Promise.all(completedPromises)
        ]);

        const allServing = servingResults.flat();
        const allCompleted = completedResults.flat();

        // Detect changes and show notifications (limit to prevent spam)
        setServingTransactions(prevServing => {
          const newServing = allServing;
          const added = newServing.filter(newItem => 
            !prevServing.some(prevItem => prevItem.id === newItem.id)
          );
          
          // Limit notifications to prevent spam
          added.slice(0, 3).forEach(item => {
            addNotification(
              `Transaction ${item.full_queue_number || item.queue_number} is now being processed in ${item.department_name}`,
              'pending'
            );
          });
          
          return newServing;
        });

        setCompletedTransactions(prevCompleted => {
          const newCompleted = allCompleted;
          const added = newCompleted.filter(newItem => 
            !prevCompleted.some(prevItem => prevItem.id === newItem.id)
          );
          
          // Limit notifications to prevent spam
          added.slice(0, 3).forEach(item => {
            const statusText = item.status === 'successful' ? 'successfully' : 'was canceled';
            addNotification(
              `Transaction ${item.full_queue_number || item.queue_number} ${statusText} in ${item.department_name}`,
              item.status === 'successful' ? 'success' : 'error'
            );
          });
          
          return newCompleted;
        });
      } catch (error) {
        console.error('Error fetching transaction data:', error);
      }
    };

    if (departments.length > 0 && !isLoading) {
      fetchTransactionData();
      const interval = setInterval(fetchTransactionData, 10000); // Increased to 10 seconds to reduce rate limiting
      return () => clearInterval(interval);
    }
  }, [departments, isLoading]);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getQueueStats = (deptId) => {
    const queue = departmentQueues[deptId] || [];
    const waiting = queue.filter(item => item.status === 'waiting').length;
    const serving = queue.filter(item => item.status === 'pending').length;
    
    // Get completed count from the completedTransactions state
    const deptName = departments.find(dept => dept.id === deptId)?.name;
    const completed = completedTransactions.filter(item => 
      item.department_name === deptName || item.department_id === deptId
    ).length;
    
    return { waiting, serving, completed };
  };

  const getCurrentlyServing = (deptName) => {
    const serving = currentlyServing.find(cs => cs.department_name === deptName);
    return serving?.queue_number || 'None';
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('en-PH', { 
      timeZone: 'Asia/Manila',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-PH', { 
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'successful':
        return 'text-green-600 bg-green-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      case 'pending':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const addNotification = (message, type = 'info') => {
    const id = Date.now() + Math.random(); // Add randomness to prevent duplicate keys
    setNotifications(prev => {
      const newNotifications = [...prev, { id, message, type }];
      // Keep only the last 10 notifications to prevent memory issues
      return newNotifications.slice(-10);
    });
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllCurrentlyServing = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/queue/clear-all-serving', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        console.log('All currently serving data cleared');
      }
    } catch (error) {
      console.error('Error clearing currently serving data:', error);
    }
  };

  // Clear currently serving data on component mount (useful for server restarts)
  useEffect(() => {
    if (!isLoading) {
    clearAllCurrentlyServing();
    }
  }, [isLoading]);

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className={`text-lg ${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-8 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Real-time Notifications */}
      {notifications.map((notification) => (
        <RealTimeNotification
          key={notification.id}
          message={notification.message}
          type={notification.type}
          onClose={() => removeNotification(notification.id)}
        />
      ))}



      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${
            isDarkMode ? 'text-red-400' : 'text-red-700'
          }`}>Dashboard</h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Welcome back, {user.name}</p>
        </div>
        
        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
              isDarkMode 
                ? 'bg-gray-800 hover:bg-gray-700 text-white' 
                : 'bg-white hover:bg-gray-50 text-gray-700'
            } shadow-md`}
          >
            <User className="w-5 h-5" />
            <span className="font-medium">{user.name}</span>
          </button>
          
          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } ring-1 ring-black ring-opacity-5`}>
              <div className="py-1">
                <button
                  onClick={() => {
                    setDropdownOpen(false);
                    navigate('/settings');
                  }}
                  className={`block w-full text-left px-4 py-2 text-sm ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  Manage Account
                </button>

              </div>
            </div>
          )}
        </div>
      </div>

      {/* Department Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept) => {
          const stats = getQueueStats(dept.id);
          const currentServing = getCurrentlyServing(dept.name);
          
          return (
            <div
              key={dept.id}
              className={`p-6 rounded-lg shadow-md transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              }`}
            >
              {/* Department Header */}
              <div className="flex items-center mb-4">
                <div className="flex items-center space-x-3">
                  {React.createElement(getDepartmentIcon(dept.name), { 
                    className: `w-6 h-6 ${
                      isDarkMode ? 'text-blue-400' : 'text-blue-600'
                    }` 
                  })}
                  <h3 className={`text-lg font-semibold ${
                    isDarkMode ? 'text-white' : 'text-gray-800'
                  }`}>{dept.name}</h3>
                </div>
              </div>

              {/* Currently Serving */}
              <div className={`mb-4 p-3 rounded-lg ${
                isDarkMode ? 'bg-gray-700' : 'bg-blue-50'
              }`}>
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium ${
                    isDarkMode ? 'text-gray-300' : 'text-blue-700'
                  }`}>Now Serving:</span>
                  <span className={`text-lg font-bold ${
                    isDarkMode ? 'text-blue-400' : 'text-blue-600'
                  }`}>{currentServing}</span>
                </div>
              </div>

              {/* Queue Statistics */}
              <div className="grid grid-cols-3 gap-3">
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-yellow-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
                  }`}>{stats.waiting}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-yellow-700'
                  }`}>Waiting</div>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-green-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-green-400' : 'text-green-600'
                  }`}>{stats.serving}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-green-700'
                  }`}>Serving</div>
                </div>
                
                <div className={`text-center p-3 rounded-lg ${
                  isDarkMode ? 'bg-gray-700' : 'bg-purple-50'
                }`}>
                  <div className={`text-2xl font-bold ${
                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                  }`}>{stats.completed}</div>
                  <div className={`text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-purple-700'
                  }`}>Completed</div>
                </div>
              </div>

              {/* Transactions */}
              {dept.transactions && dept.transactions.length > 0 && (
                <div className="mt-4">
                  <h4 className={`text-sm font-medium mb-2 ${
                    isDarkMode ? 'text-gray-300' : 'text-gray-600'
                  }`}>Available Transactions:</h4>
                  <div className="space-y-1">
                    {dept.transactions
                      .slice(0, expandedTransactions[dept.id] ? dept.transactions.length : 3)
                      .map((transaction) => (
                      <div
                        key={transaction.id}
                        className={`text-xs p-2 rounded ${
                          isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {transaction.name}
                      </div>
                    ))}
                    {dept.transactions.length > 3 && (
                      <button
                        onClick={() => {
                          setExpandedTransactions(prev => ({
                            ...prev,
                            [dept.id]: !prev[dept.id]
                          }));
                        }}
                        className={`text-xs font-medium cursor-pointer hover:underline ${
                          isDarkMode ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                        }`}
                      >
                        {expandedTransactions[dept.id] ? 'less...' : 'more...'}
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Real-time Transaction Sections */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Serving Section */}
        <div className={`p-6 rounded-lg shadow-md border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Currently Serving</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
            }`}>
              {servingTransactions.length} Active
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {servingTransactions.length > 0 ? (
              servingTransactions.map((transaction, index) => (
                <div
                  key={`${transaction.id}-${index}`}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.priority ? 'bg-blue-500' : 'bg-yellow-500'
                      }`}></div>
                      <span className={`font-bold text-lg ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {transaction.full_queue_number || transaction.queue_number}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      isDarkMode ? 'bg-blue-900 text-blue-300' : 'bg-blue-100 text-blue-700'
                    }`}>
                      {transaction.department_name}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {transaction.transaction_name || 'Transaction'}
                    </span>
                    <span className={`${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {formatTime(transaction.updated_at || transaction.created_at)}
                    </span>
                  </div>
                  
                  {transaction.priority && (
                    <div className="mt-2">
                      <span className="text-xs text-blue-600 font-medium">⭐ Priority Queue</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <Clock className={`w-12 h-12 mx-auto mb-3 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p>No transactions currently being processed</p>
              </div>
            )}
          </div>
        </div>

        {/* Completed Transactions Section */}
        <div className={`p-6 rounded-lg shadow-md border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className={`text-xl font-bold ${
              isDarkMode ? 'text-white' : 'text-gray-800'
            }`}>Completed Transactions</h2>
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${
              isDarkMode ? 'bg-purple-900 text-purple-300' : 'bg-purple-100 text-purple-700'
            }`}>
              {completedTransactions.length} Total
            </div>
          </div>
          
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {completedTransactions.length > 0 ? (
              completedTransactions.slice(0, 10).map((transaction, index) => (
                <div
                  key={`${transaction.id}-${index}`}
                  className={`p-4 rounded-lg border ${
                    isDarkMode ? 'bg-gray-700 border-gray-600' : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${
                        transaction.status === 'successful' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      <span className={`font-bold text-lg ${
                        isDarkMode ? 'text-white' : 'text-gray-800'
                      }`}>
                        {transaction.full_queue_number || transaction.queue_number}
                      </span>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      transaction.status === 'successful' 
                        ? (isDarkMode ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-700')
                        : (isDarkMode ? 'bg-red-900 text-red-300' : 'bg-red-100 text-red-700')
                    }`}>
                      {transaction.status === 'successful' ? 'Success' : 'Failed'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between text-sm">
                    <span className={`${
                      isDarkMode ? 'text-gray-300' : 'text-gray-600'
                    }`}>
                      {transaction.transaction_name || 'Transaction'}
                    </span>
                    <span className={`${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {transaction.completed_at ? formatTime(transaction.completed_at) : 'N/A'}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {transaction.department_name || 'Unknown Department'}
                    </span>
                    <span className={`text-xs ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-500'
                    }`}>
                      {transaction.completed_at ? formatDate(transaction.completed_at) : 'N/A'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className={`text-center py-8 ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>
                <BarChart3 className={`w-12 h-12 mx-auto mb-3 ${
                  isDarkMode ? 'text-gray-600' : 'text-gray-400'
                }`} />
                <p>No completed transactions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className={`p-8 rounded-lg shadow-md border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <Users className={`w-10 h-10 ${
              isDarkMode ? 'text-blue-400' : 'text-blue-600'
            }`} />
            <div className="ml-6">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Departments</p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{departments.length}</p>
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-lg shadow-md border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <Clock className={`w-10 h-10 ${
              isDarkMode ? 'text-green-400' : 'text-green-600'
            }`} />
            <div className="ml-6">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Currently Serving</p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{servingTransactions.length}</p>
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-lg shadow-md border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <BarChart3 className={`w-10 h-10 ${
              isDarkMode ? 'text-yellow-400' : 'text-yellow-600'
            }`} />
            <div className="ml-6">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Waiting</p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {Object.values(departmentQueues).reduce((total, queue) => 
                  total + queue.filter(item => item.status === 'waiting').length, 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className={`p-8 rounded-lg shadow-md border ${
          isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
        }`}>
          <div className="flex items-center">
            <LineChart className={`w-10 h-10 ${
              isDarkMode ? 'text-purple-400' : 'text-purple-600'
            }`} />
            <div className="ml-6">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-gray-400' : 'text-gray-600'
              }`}>Total Completed</p>
              <p className={`text-2xl font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>
                {completedTransactions.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
