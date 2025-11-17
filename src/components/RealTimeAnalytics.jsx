import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
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
} from 'chart.js';
import { 
  Activity, 
  Users, 
  Clock, 
  Monitor, 
  Smartphone, 
  TrendingUp,
  Wifi,
  WifiOff,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import realTimeService from '../utils/realTimeAnalyticsService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ChartTitle, Tooltip, Legend, Filler);

const RealTimeCard = ({ title, value, icon: Icon, color = "blue", subtitle = "", isLive = false }) => (
  <div className={`bg-white p-6 rounded-lg shadow-md border-l-4 border-l-${color}-500 relative`}>
    {isLive && (
      <div className="absolute top-2 right-2 flex items-center">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse mr-1"></div>
        <span className="text-xs text-green-600 font-medium">LIVE</span>
      </div>
    )}
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-600">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
      </div>
      <div className={`p-3 rounded-full bg-${color}-100`}>
        <Icon className={`w-6 h-6 text-${color}-600`} />
      </div>
    </div>
  </div>
);

const RealTimeChart = ({ data, title, type = 'line' }) => {
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({ responsive: true, maintainAspectRatio: false });

  useEffect(() => {
    if (data && data.trends && data.trends.length > 0) {
      const labels = data.trends.map(item => {
        const date = new Date(item.time);
        return date.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: false
        });
      });

      let datasets = [];
      if (type === 'queue') {
        datasets = [
          {
            label: 'Total Queue',
            data: data.trends.map(item => item.total_queue || 0),
            borderColor: 'rgb(59, 130, 246)',
            backgroundColor: 'rgba(59, 130, 246, 0.25)',
            tension: 0.35,
            fill: true,
            pointRadius: 0,
          },
          {
            label: 'Served',
            data: data.trends.map(item => item.served || 0),
            borderColor: 'rgb(34, 197, 94)',
            backgroundColor: 'rgba(34, 197, 94, 0.2)',
            tension: 0.35,
            fill: true,
            pointRadius: 0,
          },
          {
            label: 'Waiting',
            data: data.trends.map(item => item.waiting || 0),
            borderColor: 'rgb(245, 158, 11)',
            backgroundColor: 'rgba(245, 158, 11, 0.2)',
            tension: 0.35,
            fill: true,
            pointRadius: 0,
          }
        ];
      } else if (type === 'waitTime') {
        datasets = [
          {
            label: 'Average Wait Time (min)',
            data: data.trends.map(item => item.average_wait || 0),
            borderColor: 'rgb(239, 68, 68)',
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            tension: 0.35,
            fill: true,
            pointRadius: 0,
          }
        ];
      }

      setChartData({ labels, datasets });
      setChartOptions({
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: true, position: 'top' },
          title: { display: false }
        },
        scales: {
          x: { grid: { display: false } },
          y: { beginAtZero: true }
        }
      });
    } else {
      setChartData(null);
    }
  }, [data, type]);

  if (!chartData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">Loading chart data...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-64">
        {type === 'queue' || type === 'waitTime' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

const RealTimeAnalytics = ({ departmentId = null }) => {
  const [realTimeData, setRealTimeData] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Start real-time updates
    realTimeService.startRealTimeUpdates(departmentId, (data) => {
      if (data.error) {
        setError(data.error);
        setIsConnected(false);
      } else {
        setRealTimeData(data);
        setIsConnected(true);
        setError(null);
        setLastUpdate(new Date());
      }
    });

    // Cleanup on unmount
    return () => {
      realTimeService.stopRealTimeUpdates();
    };
  }, [departmentId]);

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertTriangle className="w-8 h-8 text-red-400 mx-auto mb-2" />
            <p className="text-red-500 mb-4">Error loading real-time data: {error}</p>
            <button
              onClick={() => {
                setError(null);
                realTimeService.startRealTimeUpdates(departmentId, (data) => {
                  if (data.error) {
                    setError(data.error);
                    setIsConnected(false);
                  } else {
                    setRealTimeData(data);
                    setIsConnected(true);
                    setError(null);
                    setLastUpdate(new Date());
                  }
                });
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!realTimeData) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Activity className="w-8 h-8 text-gray-400 mx-auto mb-2 animate-pulse" />
            <p className="text-gray-500">Connecting to real-time data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Connection Status and Reset Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {isConnected ? (
            <>
              <Wifi className="w-5 h-5 text-green-500" />
              <span className="text-green-600 font-medium">Connected to Real-time Data</span>
            </>
          ) : (
            <>
              <WifiOff className="w-5 h-5 text-red-500" />
              <span className="text-red-600 font-medium">Disconnected</span>
            </>
          )}
        </div>
        <div className="flex items-center space-x-4">
          {lastUpdate && (
            <span className="text-sm text-gray-500">
              Last update: {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <RealTimeCard
          title="Total Queue"
          value={realTimeData.queue?.data?.current?.total_queue || 0}
          icon={Users}
          color="blue"
          subtitle="Current queue size"
          isLive={true}
        />
        <RealTimeCard
          title="Average Wait Time"
          value={`${realTimeData.waitTime?.data?.current?.average_wait || 0} min`}
          icon={Clock}
          color="orange"
          subtitle="Current average"
          isLive={true}
        />
        <RealTimeCard
          title="Web Kiosk Users"
          value={realTimeData.kiosk?.data?.web_kiosk?.current_active || 0}
          icon={Monitor}
          color="green"
          subtitle="Currently active"
          isLive={true}
        />
        <RealTimeCard
          title="Physical Kiosk Users"
          value={realTimeData.kiosk?.data?.physical_kiosk?.current_active || 0}
          icon={Smartphone}
          color="purple"
          subtitle="Currently active"
          isLive={true}
        />
      </div>

      {/* Kiosk Usage Comparison */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <TrendingUp className="w-5 h-5 mr-2" />
          Kiosk Usage Comparison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-600">
              {realTimeData.kiosk?.data?.web_kiosk?.total_usage || 0}
            </div>
            <div className="text-sm text-gray-600">Web Kiosk Total Usage</div>
            <div className="text-xs text-gray-500 mt-1">
              Success Rate: {realTimeData.kiosk?.data?.web_kiosk?.success_rate || 0}%
            </div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-600">
              {realTimeData.kiosk?.data?.physical_kiosk?.total_usage || 0}
            </div>
            <div className="text-sm text-gray-600">Physical Kiosk Total Usage</div>
            <div className="text-xs text-gray-500 mt-1">
              Success Rate: {realTimeData.kiosk?.data?.physical_kiosk?.success_rate || 0}%
            </div>
          </div>
        </div>
        
        {/* Usage Percentage Bars */}
        <div className="mt-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Web Kiosk: {realTimeData.kiosk?.data?.comparison?.web_percentage || 0}%</span>
            <span>Physical Kiosk: {realTimeData.kiosk?.data?.comparison?.physical_percentage || 0}%</span>
          </div>
          <div className="flex h-4 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="bg-blue-500 h-full transition-all duration-500"
              style={{ width: `${realTimeData.kiosk?.data?.comparison?.web_percentage || 0}%` }}
            ></div>
            <div 
              className="bg-purple-500 h-full transition-all duration-500"
              style={{ width: `${realTimeData.kiosk?.data?.comparison?.physical_percentage || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Real-time Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RealTimeChart 
          data={realTimeData.queue?.data} 
          title="Queue Status Trends (Last 24 Hours)" 
          type="queue" 
        />
        <RealTimeChart 
          data={realTimeData.waitTime?.data} 
          title="Wait Time Trends (Last 24 Hours)" 
          type="waitTime" 
        />
      </div>

      {/* Department Efficiency */}
      {realTimeData.department?.data && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h3 className="text-lg font-semibold mb-4">Department Efficiency</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {realTimeData.department.data.total_transactions}
              </div>
              <div className="text-sm text-gray-600">Total Transactions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {realTimeData.department.data.completed_transactions}
              </div>
              <div className="text-sm text-gray-600">Completed</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {realTimeData.department.data.canceled_transactions}
              </div>
              <div className="text-sm text-gray-600">Canceled</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {realTimeData.department.data.efficiency_rate}%
              </div>
              <div className="text-sm text-gray-600">Efficiency Rate</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RealTimeAnalytics; 