import React, { useState, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { useDepartments } from '../utils/DepartmentsContext.jsx';
import { useUser } from '../utils/UserContext.jsx';
import { 
  Building, 
  Search, 
  Filter, 
  Plus, 
  Edit, 
  ChevronDown, 
  ChevronUp, 
  Users, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  BarChart3
} from 'lucide-react';
import { getDepartmentIcon } from '../utils/departmentIcons';

const API_BASE_URL = 'http://localhost:8000/api';
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

const SuperDepartments = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useOutletContext();
  const { departments, loading } = useDepartments();
  const { user } = useUser();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [expandedCards, setExpandedCards] = useState(new Set());
  const [departmentStats, setDepartmentStats] = useState({});
  const [isLoadingStats, setIsLoadingStats] = useState(false);

  // Fetch real department statistics from API
  const fetchDepartmentStats = async () => {
    if (!departments || departments.length === 0) return;
    
    setIsLoadingStats(true);
    const stats = {};
    
    try {
      for (const dept of departments) {
        try {
          // Fetch department metrics
          const metricsResponse = await fetch(`${API_BASE_URL}/analytics/department-metrics?departmentId=${dept.id}`, {
            headers: getAuthHeaders()
          });
          
          if (metricsResponse.ok) {
            const metrics = await metricsResponse.json();
            stats[dept.name] = {
              activeTickets: metrics.pending || 0,
              completedToday: metrics.totalToday || 0,
              avgWaitTime: Math.round((metrics.avgProcessingTimeHrs || 0) * 60), // Convert hours to minutes
              completionRate: metrics.completionRate || 0,
              totalTransactions: metrics.totalTransactions || 0,
              avgProcessingTime: metrics.avgProcessingTimeHrs || 0
            };
          } else {
            // Fallback to basic stats if metrics endpoint fails
            stats[dept.name] = {
              activeTickets: 0,
              completedToday: 0,
              avgWaitTime: 0,
              completionRate: 0,
              totalTransactions: 0,
              avgProcessingTime: 0
            };
          }
          
          // Set default transaction types (since API endpoint doesn't exist)
          stats[dept.name].transactionTypes = ['General Inquiry', 'Document Processing', 'Payment'];
          
        } catch (error) {
          console.warn(`Failed to fetch stats for department ${dept.name}:`, error);
          stats[dept.name] = {
            activeTickets: 0,
            completedToday: 0,
            avgWaitTime: 0,
            completionRate: 0,
            totalTransactions: 0,
            avgProcessingTime: 0,
            transactionTypes: []
          };
        }
      }
      
      setDepartmentStats(stats);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    } finally {
      setIsLoadingStats(false);
    }
  };

  useEffect(() => {
    fetchDepartmentStats();
  }, [departments]);

  const handleManageDepartment = (departmentName) => {
    try {
      navigate('/manage-departments', { state: { department: departmentName } });
    } catch (error) {
      console.error('Navigation error:', error);
      navigate('/manage-departments');
    }
  };

  const handleEditDepartments = () => {
    navigate('/edit-departments');
  };

  const handleAddDepartment = () => {
    navigate('/edit-departments');
  };

  const toggleCardExpansion = (deptId) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(deptId)) {
      newExpanded.delete(deptId);
    } else {
      newExpanded.add(deptId);
    }
    setExpandedCards(newExpanded);
  };

  const filteredDepartments = departments?.filter(dept => {
    const matchesSearch = dept.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
      (filterStatus === 'active' && dept.active) ||
      (filterStatus === 'inactive' && !dept.active);
    return matchesSearch && matchesFilter;
  }) || [];

  if (loading) {
    return (
      <div className={`min-h-screen p-8 flex items-center justify-center transition-colors duration-300 ${
        isDarkMode ? 'bg-gray-900' : 'bg-white'
      }`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className={`${isDarkMode ? 'text-white' : 'text-gray-600'}`}>Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col gap-4 mb-4">
          <div>
            <h1 className={`text-4xl font-bold ${
              isDarkMode ? 'text-red-400' : 'text-red-700'
            }`}>Departments</h1>
            <p className={`text-lg ${
              isDarkMode ? 'text-gray-300' : 'text-gray-600'
            }`}>Manage and monitor all departments</p>
          </div>
          
          {/* Controls Row - Buttons, Search, Filter */}
          <div className="flex flex-wrap gap-3 items-center">
            <button
              onClick={handleAddDepartment}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDarkMode 
                  ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              } shadow-md`}
            >
              <Plus className="w-4 h-4" />
              <span>Add Department</span>
            </button>
            <button
              onClick={handleEditDepartments}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                isDarkMode 
                  ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              } shadow-md`}
            >
              <Edit className="w-4 h-4" />
              <span>Edit Departments</span>
            </button>
            
            {/* Search Input */}
            <input
              type="text"
              placeholder="Search departments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`flex-1 min-w-[200px] px-4 py-2 rounded-lg border transition-colors ${
                isDarkMode 
                  ? 'bg-gray-800 border-gray-600 text-white placeholder-gray-400 focus:border-blue-500' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-blue-500'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50`}
            />
            
            {/* Filter Dropdown */}
            <div className="relative">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                style={{
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  MozAppearance: 'none',
                  backgroundImage: 'none'
                }}
                className={`px-4 py-2 pr-10 rounded-lg border transition-colors ${
                  isDarkMode 
                    ? 'bg-gray-800 border-gray-600 text-white focus:border-blue-500' 
                    : 'bg-white border-gray-300 text-gray-900 focus:border-blue-500'
                } focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 cursor-pointer`}
              >
                <option value="all">All Departments</option>
                <option value="active">Active Only</option>
                <option value="inactive">Inactive Only</option>
              </select>
              <ChevronDown className={`absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 pointer-events-none ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`} />
            </div>
          </div>
        </div>
      </div>

      {/* Departments Grid - 2 Columns Layout */}
      <div className="grid gap-6 mb-8" style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        {filteredDepartments.map((dept, index) => {
          const isExpanded = expandedCards.has(dept.id);
          const stats = departmentStats[dept.name] || {};
          const transactionTypes = stats.transactionTypes || [];
          
          // Check if this is the last item and total count is odd
          const isLastItem = index === filteredDepartments.length - 1;
          const isOddCount = filteredDepartments.length % 2 !== 0;
          const shouldCenter = isLastItem && isOddCount;
          
          console.log(`Department ${dept.name}: index=${index}, total=${filteredDepartments.length}, isLast=${isLastItem}, isOdd=${isOddCount}, shouldCenter=${shouldCenter}`);
          
          return (
            <div
              key={dept.id}
              className={`rounded-lg shadow-md transition-all duration-300 hover:shadow-lg flex flex-col h-full ${
                isDarkMode 
                  ? 'bg-gray-800 border border-gray-700' 
                  : 'bg-white border border-gray-200'
              } ${dept.active ? '' : 'opacity-75'} ${
                shouldCenter ? 'md:col-span-2 md:max-w-md md:mx-auto' : ''
              }`}
            >
              {/* Department Header */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-3 flex-1">
                    <div className={`p-3 rounded-full flex-shrink-0 ${
                      dept.active ? 'bg-blue-100' : 'bg-gray-100'
                    }`}>
                      {React.createElement(getDepartmentIcon(dept.name), { 
                        className: `w-6 h-6 ${
                          dept.active ? 'text-blue-600' : 'text-gray-500'
                        }` 
                      })}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-lg font-semibold leading-tight ${
                        isDarkMode ? 'text-white' : 'text-gray-900'
                      }`} style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '2.5rem'
                      }}>{dept.name}</h3>
                      <p className={`text-sm mt-1 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {dept.active ? 'Active' : 'Inactive'}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => toggleCardExpansion(dept.id)}
                    className={`p-2 rounded-lg transition-colors active:bg-transparent ${
                      isDarkMode
                        ? 'hover:bg-gray-700 text-gray-400'
                        : 'hover:bg-gray-100 text-gray-500'
                    }`}
                  >
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>

                {/* Statistics Badges */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <Activity className={`w-4 h-4 ${
                        isDarkMode ? 'text-blue-400' : 'text-blue-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>Pending</span>
                    </div>
                    <p className={`text-lg font-bold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{isLoadingStats ? '...' : (stats.activeTickets || 0)}</p>
                  </div>
                  
                  <div className={`p-3 rounded-lg ${
                    isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
                  }`}>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className={`w-4 h-4 ${
                        isDarkMode ? 'text-green-400' : 'text-green-600'
                      }`} />
                      <span className={`text-xs font-medium ${
                        isDarkMode ? 'text-gray-300' : 'text-gray-600'
                      }`}>Completed Today</span>
                    </div>
                    <p className={`text-lg font-bold mt-1 ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{isLoadingStats ? '...' : (stats.completedToday || 0)}</p>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="space-y-2 mb-4 flex-1">
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Avg Processing Time</span>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{stats.avgProcessingTime ? `${stats.avgProcessingTime.toFixed(1)}h` : '0h'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Total Transactions</span>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{stats.totalTransactions || 0}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className={`text-sm ${
                      isDarkMode ? 'text-gray-400' : 'text-gray-600'
                    }`}>Transaction Types</span>
                    <span className={`text-sm font-medium ${
                      isDarkMode ? 'text-white' : 'text-gray-900'
                    }`}>{transactionTypes.length}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-auto">
                  <button
                    onClick={() => handleManageDepartment(dept.name)}
                    className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                      isDarkMode 
                        ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    }`}
                  >
                    <BarChart3 className="w-4 h-4" />
                    <span>Manage</span>
                  </button>
                </div>
              </div>

              {/* Expandable Transaction Types */}
              {isExpanded && (
                <div className={`border-t px-6 py-4 ${
                  isDarkMode ? 'border-gray-700 bg-gray-750' : 'border-gray-200 bg-gray-50'
                }`}>
                  <h4 className={`text-sm font-semibold mb-3 ${
                    isDarkMode ? 'text-white' : 'text-gray-900'
                  }`}>Transaction Types</h4>
                  <div className="space-y-2">
                    {transactionTypes.length > 0 ? (
                      transactionTypes.map((type, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded ${
                          isDarkMode ? 'bg-gray-700' : 'bg-white'
                        }`}>
                          <span className={`text-sm ${
                            isDarkMode ? 'text-gray-300' : 'text-gray-700'
                          }`}>{type}</span>
                          <div className={`w-2 h-2 rounded-full bg-green-500`}></div>
                        </div>
                      ))
                    ) : (
                      <div className={`text-center py-4 ${
                        isDarkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        <p className="text-sm">No transaction types configured</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {filteredDepartments.length === 0 && (
        <div className={`text-center py-12 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Building className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium">No departments found</p>
          <p className="text-sm mt-2">
            {searchTerm ? 'Try adjusting your search criteria' : 'No departments match the selected filter'}
          </p>
        </div>
      )}
    </div>
  );
};

export default SuperDepartments;