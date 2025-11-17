import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { getDepartmentIcon } from '../utils/departmentIcons';
import { 
  User, 
  Building, 
  Ticket, 
  Clock, 
  CheckCircle, 
  XCircle, 
  BarChart3, 
  PieChart, 
  TrendingUp, 
  Bell, 
  Plus, 
  FileText, 
  Settings, 
  Users, 
  LogOut,
  Calendar,
  Activity,
  AlertTriangle,
  Eye
} from 'lucide-react';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
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
  ArcElement,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ChartTitle,
  Tooltip,
  Legend,
  Filler,
  ArcElement
);

// Date/Time Widget Component
const DateTimeWidget = ({ isDarkMode }) => {
  const [dateTime, setDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = dateTime.toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
  const formattedDate = dateTime.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className={`p-4 rounded-lg shadow-md transition-colors ${
      isDarkMode 
        ? 'bg-gray-800 border border-gray-700' 
        : 'bg-white border border-gray-200'
    }`}>
      <div className="flex items-center space-x-3">
        <Calendar className={`w-5 h-5 ${isDarkMode ? 'text-red-400' : 'text-red-600'}`} />
        <div>
          <p className={`text-lg font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
            {formattedTime}
          </p>
          <p className={`text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
            {formattedDate}
          </p>
        </div>
      </div>
    </div>
  );
};

// Statistics Card Component
const StatCard = ({ title, value, icon: Icon, color = "blue", isLoading = false, subtitle = "" }) => (
  <div className={`p-6 rounded-lg shadow-sm transition-colors bg-white border border-gray-100 ${
    isLoading ? 'animate-pulse' : ''
  }`}>
    <div className="flex items-center justify-between">
      <div className="flex-1">
        <h3 className={`text-sm font-medium ${
          isLoading ? 'text-gray-400' : 'text-gray-600'
        }`}>{title}</h3>
        {isLoading ? (
          <div className="h-8 w-20 bg-gray-200 animate-pulse mt-2 rounded-md"></div>
        ) : (
          <p className={`text-2xl font-bold mt-1 ${
            color === 'red' ? 'text-red-600' : 
            color === 'green' ? 'text-green-600' : 
            color === 'yellow' ? 'text-yellow-600' : 
            'text-blue-600'
          }`}>{value}</p>
        )}
        {subtitle && (
          <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
        )}
      </div>
      <div className={`p-3 rounded-full ${
        color === 'red' ? 'bg-red-100' : 
        color === 'green' ? 'bg-green-100' : 
        color === 'yellow' ? 'bg-yellow-100' : 
        'bg-blue-100'
      }`}>
        <Icon className={`w-6 h-6 ${
          color === 'red' ? 'text-red-600' : 
          color === 'green' ? 'text-green-600' : 
          color === 'yellow' ? 'text-yellow-600' : 
          'text-blue-600'
        }`} />
      </div>
    </div>
  </div>
);

// Quick Actions Component
const QuickActions = ({ isDarkMode, onAction }) => (
  <div className={`p-6 rounded-lg shadow-md transition-colors ${
    isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200'
  }`}>
    <h3 className={`text-lg font-semibold mb-4 ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>Quick Actions</h3>
    <div className="grid grid-cols-2 gap-3">
      <button
        onClick={() => onAction('addDepartment')}
        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        }`}
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-medium">Add Department</span>
      </button>
      <button
        onClick={() => onAction('generateReport')}
        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        }`}
      >
        <FileText className="w-4 h-4" />
        <span className="text-sm font-medium">Generate Report</span>
      </button>
      <button
        onClick={() => onAction('viewAnalytics')}
        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        }`}
      >
        <BarChart3 className="w-4 h-4" />
        <span className="text-sm font-medium">View Analytics</span>
      </button>
      <button
        onClick={() => onAction('manageAdmins')}
        className={`flex items-center space-x-2 p-3 rounded-lg transition-colors ${
          isDarkMode 
            ? 'bg-gray-700 hover:bg-gray-600 text-white' 
            : 'bg-gray-50 hover:bg-gray-100 text-gray-700'
        }`}
      >
        <Users className="w-4 h-4" />
        <span className="text-sm font-medium">Manage Admins</span>
      </button>
    </div>
  </div>
);

// Recent Activity Component
const RecentActivity = ({ isDarkMode, activities = [] }) => (
  <div className={`p-6 rounded-lg shadow-md transition-colors ${
    isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200'
  }`}>
    <div className="flex items-center justify-between mb-4">
      <h3 className={`text-lg font-semibold ${
        isDarkMode ? 'text-white' : 'text-gray-900'
      }`}>Recent Activity</h3>
      <Bell className={`w-5 h-5 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`} />
    </div>
    <div className="space-y-3">
      {activities.length > 0 ? (
        activities.map((activity, index) => (
          <div key={index} className={`flex items-start space-x-3 p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className={`p-1 rounded-full ${
              activity.type === 'success' ? 'bg-green-100' :
              activity.type === 'warning' ? 'bg-yellow-100' :
              activity.type === 'error' ? 'bg-red-100' :
              'bg-blue-100'
            }`}>
              {activity.type === 'success' ? <CheckCircle className="w-4 h-4 text-green-600" /> :
               activity.type === 'warning' ? <AlertTriangle className="w-4 h-4 text-yellow-600" /> :
               activity.type === 'error' ? <XCircle className="w-4 h-4 text-red-600" /> :
               <Activity className="w-4 h-4 text-blue-600" />}
            </div>
            <div className="flex-1">
              <p className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{activity.message}</p>
              <p className={`text-xs ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>{activity.time}</p>
            </div>
          </div>
        ))
      ) : (
        <div className={`text-center py-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No recent activity</p>
        </div>
      )}
    </div>
  </div>
);

// Department Breakdown Component
const DepartmentBreakdown = ({ isDarkMode, departments = [] }) => (
  <div className={`p-6 rounded-lg shadow-md transition-colors ${
    isDarkMode 
      ? 'bg-gray-800 border border-gray-700' 
      : 'bg-white border border-gray-200'
  }`}>
    <h3 className={`text-lg font-semibold mb-4 ${
      isDarkMode ? 'text-white' : 'text-gray-900'
    }`}>Department Breakdown</h3>
    <div className="space-y-3">
      {departments.length > 0 ? (
        departments.map((dept, index) => (
          <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${
            isDarkMode ? 'bg-gray-700' : 'bg-gray-50'
          }`}>
            <div className="flex items-center space-x-3">
              {React.createElement(getDepartmentIcon(dept.name), { 
                className: `w-4 h-4 ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}` 
              })}
              <span className={`text-sm font-medium ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{dept.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-300' : 'text-gray-600'
              }`}>{dept.pendingTickets} pending</span>
              <div className={`w-2 h-2 rounded-full ${
                dept.pendingTickets > 10 ? 'bg-red-500' :
                dept.pendingTickets > 5 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}></div>
            </div>
          </div>
        ))
      ) : (
        <div className={`text-center py-4 ${
          isDarkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          <Building className="w-8 h-8 mx-auto mb-2 opacity-50" />
          <p className="text-sm">No department data available</p>
        </div>
      )}
    </div>
  </div>
);

const SuperDashboard = () => {
  const navigate = useNavigate();
  const { isDarkMode } = useOutletContext();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const [user, setUser] = useState({ role: '', email: '' });
  const [overviewData, setOverviewData] = useState([
    { name: 'Total Departments', value: '-', icon: Building, color: 'blue' },
    { name: 'Total Tickets Issued Today', value: '-', icon: Ticket, color: 'blue' },
    { name: 'Pending Tickets', value: '-', icon: Clock, color: 'yellow' },
    { name: 'Successful Transactions', value: '-', icon: CheckCircle, color: 'green' },
    { name: 'Failed Transactions', value: '-', icon: XCircle, color: 'red' },
  ]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState({
    ticketsPerDay: null,
    transactionStatus: null,
    performanceMetrics: {
      avgWaitTime: '-',
      avgCompletionTime: '-'
    }
  });
  const [recentActivities, setRecentActivities] = useState([]);
  const [departmentBreakdown, setDepartmentBreakdown] = useState([]);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('user');
    navigate('/login');
  };

  const handleQuickAction = (action) => {
    switch (action) {
      case 'addDepartment':
        navigate('/superdepartments');
        break;
      case 'generateReport':
        navigate('/superreports');
        break;
      case 'viewAnalytics':
        navigate('/superanalytics');
        break;
      case 'manageAdmins':
        navigate('/manage-admins');
        break;
      default:
        break;
    }
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

  // Generate sample chart data
  const generateChartData = () => {
    // Tickets per day chart (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    });

    const ticketsPerDayData = {
      labels: last7Days,
      datasets: [
        {
          label: 'Tickets Issued',
          data: [45, 52, 38, 67, 43, 58, 41],
          backgroundColor: 'rgba(59, 130, 246, 0.5)',
          borderColor: 'rgb(59, 130, 246)',
          borderWidth: 2,
          tension: 0.4,
          fill: true,
        }
      ]
    };

    // Transaction status pie chart
    const transactionStatusData = {
      labels: ['Completed', 'Pending', 'Failed'],
      datasets: [
        {
          data: [75, 20, 5],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(245, 158, 11, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(245, 158, 11)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 2,
        }
      ]
    };

    setChartData({
      ticketsPerDay: ticketsPerDayData,
      transactionStatus: transactionStatusData,
      performanceMetrics: {
        avgWaitTime: '12 min',
        avgCompletionTime: '8 min'
      }
    });
  };

  // Generate sample activities
  const generateSampleActivities = () => {
    const activities = [
      {
        type: 'success',
        message: 'New department "Health Services" added successfully',
        time: '2 minutes ago'
      },
      {
        type: 'warning',
        message: 'High ticket volume detected in Treasury Department',
        time: '15 minutes ago'
      },
      {
        type: 'success',
        message: 'Daily report generated and sent to administrators',
        time: '1 hour ago'
      },
      {
        type: 'error',
        message: 'System maintenance scheduled for tonight',
        time: '2 hours ago'
      }
    ];
    setRecentActivities(activities);
  };

  // Generate sample department breakdown
  const generateDepartmentBreakdown = () => {
    const departments = [
      { name: 'Treasury', pendingTickets: 15 },
      { name: 'Health Services', pendingTickets: 8 },
      { name: 'Business Permit', pendingTickets: 12 },
      { name: 'Civil Registry', pendingTickets: 5 },
      { name: 'Engineering', pendingTickets: 3 }
    ];
    setDepartmentBreakdown(departments);
  };

  // Fetch real-time overview data from backend
  useEffect(() => {
    let interval;
    const fetchOverview = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/superadmin/overview', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setOverviewData([
            { name: 'Total Departments', value: data.total_departments, icon: Building, color: 'blue' },
            { name: 'Total Tickets Issued Today', value: data.tickets_today, icon: Ticket, color: 'blue' },
            { name: 'Pending Tickets', value: data.pending_tickets, icon: Clock, color: 'yellow' },
            { name: 'Successful Transactions', value: data.successful_transactions, icon: CheckCircle, color: 'green' },
            { name: 'Failed Transactions', value: data.failed_transactions, icon: XCircle, color: 'red' },
          ]);
        }
        setLoading(false);
      } catch (err) {
        // Use sample data if API fails
        setOverviewData([
          { name: 'Total Departments', value: '8', icon: Building, color: 'blue' },
          { name: 'Total Tickets Issued Today', value: '156', icon: Ticket, color: 'blue' },
          { name: 'Pending Tickets', value: '43', icon: Clock, color: 'yellow' },
          { name: 'Successful Transactions', value: '113', icon: CheckCircle, color: 'green' },
          { name: 'Failed Transactions', value: '3', icon: XCircle, color: 'red' },
        ]);
        setLoading(false);
      }
    };
    
    fetchOverview();
    generateChartData();
    generateSampleActivities();
    generateDepartmentBreakdown();
    
    interval = setInterval(fetchOverview, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`min-h-screen p-6 transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900' : 'bg-white'
    }`}>
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className={`text-4xl font-bold ${
            isDarkMode ? 'text-red-400' : 'text-red-700'
          }`}>Super Admin Dashboard</h1>
          <p className={`text-lg ${
            isDarkMode ? 'text-gray-300' : 'text-gray-600'
          }`}>Welcome back{user?.name ? `, ${user.name}` : ''}</p>
        </div>

        {/* Simplified User Profile Panel */}
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
            <span className="font-medium">{user.name || 'Super Admin'}</span>
          </button>
          {dropdownOpen && (
            <div className={`absolute right-0 mt-2 w-48 rounded-md shadow-lg z-50 ${
              isDarkMode ? 'bg-gray-800' : 'bg-white'
            } ring-1 ring-black ring-opacity-5`}>
              <div className="py-1">
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/manage-admins'); }}
                  className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-sm ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  <span>Manage Admins</span>
                </button>
                <button
                  onClick={() => { setDropdownOpen(false); navigate('/supersettings'); }}
                  className={`flex items-center space-x-2 w-full text-left px-4 py-2 text-sm ${
                    isDarkMode 
                      ? 'text-gray-300 hover:bg-gray-700' 
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Settings className="w-4 h-4" />
                  <span>Settings</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Key Statistics Cards */}
      <div className="space-y-6 mb-8">
        {/* First Row: Total Departments, Total Tickets Issued Today, Pending Tickets */}
        <div className="grid grid-cols-3 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className={`${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Loading dashboard...</p>
            </div>
          ) : (
            overviewData.slice(0, 3).map((item, index) => (
              <StatCard
                key={index}
                title={item.name}
                value={item.value}
                icon={item.icon}
                color={item.color}
                isLoading={loading}
              />
            ))
          )}
        </div>

        {/* Second Row: Successful Transactions, Failed Transactions */}
        <div className="grid grid-cols-2 gap-6">
          {loading ? (
            <div className="col-span-full text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className={`${isDarkMode ? 'text-white' : 'text-gray-700'}`}>Loading dashboard...</p>
            </div>
          ) : (
            overviewData.slice(3, 5).map((item, index) => (
              <StatCard
                key={index + 3}
                title={item.name}
                value={item.value}
                icon={item.icon}
                color={item.color}
                isLoading={loading}
              />
            ))
          )}
        </div>
      </div>

      {/* Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Performance Indicators</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Clock className={`w-5 h-5 ${isDarkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Average Wait Time</span>
              </div>
              <span className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{chartData.performanceMetrics.avgWaitTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <TrendingUp className={`w-5 h-5 ${isDarkMode ? 'text-green-400' : 'text-green-600'}`} />
                <span className={`text-sm font-medium ${
                  isDarkMode ? 'text-gray-300' : 'text-gray-600'
                }`}>Avg Completion Time</span>
              </div>
              <span className={`text-lg font-bold ${
                isDarkMode ? 'text-white' : 'text-gray-900'
              }`}>{chartData.performanceMetrics.avgCompletionTime}</span>
            </div>
          </div>
        </div>

        <QuickActions isDarkMode={isDarkMode} onAction={handleQuickAction} />
      </div>

      {/* Visual Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Tickets per Day Chart */}
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Tickets Issued (Last 7 Days)</h3>
          <div className="h-64">
            {chartData.ticketsPerDay ? (
              <Line 
                data={chartData.ticketsPerDay} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                    title: { display: false }
                  },
                  scales: {
                    x: { 
                      grid: { display: false },
                      ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                    },
                    y: { 
                      beginAtZero: true,
                      ticks: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                    }
                  }
                }} 
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading chart data...
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction Status Pie Chart */}
        <div className={`p-6 rounded-lg shadow-md transition-colors ${
          isDarkMode 
            ? 'bg-gray-800 border border-gray-700' 
            : 'bg-white border border-gray-200'
        }`}>
          <h3 className={`text-lg font-semibold mb-4 ${
            isDarkMode ? 'text-white' : 'text-gray-900'
          }`}>Transaction Status Distribution</h3>
          <div className="h-64">
            {chartData.transactionStatus ? (
              <Doughnut 
                data={chartData.transactionStatus} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { 
                      position: 'bottom',
                      labels: { color: isDarkMode ? '#9CA3AF' : '#6B7280' }
                    },
                    title: { display: false }
                  }
                }} 
              />
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className={`${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  Loading chart data...
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row - Recent Activity and Department Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivity isDarkMode={isDarkMode} activities={recentActivities} />
        <DepartmentBreakdown isDarkMode={isDarkMode} departments={departmentBreakdown} />
      </div>
    </div>
  );
};

export default SuperDashboard;
