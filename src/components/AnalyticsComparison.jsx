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
  BarChart3, 
  TrendingUp, 
  Clock, 
  Users, 
  XCircle, 
  Activity,
  GitCompare,
  Calendar,
  ChevronDown,
  ChevronUp,
  Filter,
  Download
} from 'lucide-react';
import historicalService from '../utils/historicalAnalyticsService';
import { useDepartments } from '../utils/DepartmentsContext.jsx';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ChartTitle, Tooltip, Legend, Filler);

const ComparisonCard = ({ title, value1, value2, label1, label2, icon: Icon, color = "blue", format = "number" }) => {
  const formatValue = (val) => {
    if (format === "percentage") return `${val}%`;
    if (format === "time") return `${val} min`;
    if (format === "currency") return `₱${val}`;
    return val;
  };

  const getChangeColor = (value1, value2) => {
    if (value1 > value2) return "text-red-600";
    if (value1 < value2) return "text-green-600";
    return "text-gray-600";
  };

  const getChangeIcon = (value1, value2) => {
    if (value1 > value2) return "↗";
    if (value1 < value2) return "↘";
    return "→";
  };

  const change = value1 - value2;
  const changePercent = value2 !== 0 ? ((change / value2) * 100).toFixed(1) : 0;

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-gray-600">{title}</h3>
        <div className={`p-2 rounded-full bg-${color}-100`}>
          <Icon className={`w-5 h-5 text-${color}-600`} />
        </div>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-xs text-gray-500">{label1}</p>
            <p className="text-xl font-bold text-gray-900">{formatValue(value1)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">{label2}</p>
            <p className="text-xl font-bold text-gray-900">{formatValue(value2)}</p>
          </div>
        </div>
        
        <div className="pt-2 border-t border-gray-100">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Change</span>
            <div className="flex items-center space-x-1">
              <span className={`text-sm font-medium ${getChangeColor(value1, value2)}`}>
                {getChangeIcon(value1, value2)} {formatValue(Math.abs(change))}
              </span>
              <span className={`text-xs ${getChangeColor(value1, value2)}`}>
                ({changePercent}%)
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ComparisonChart = ({ title, data1, data2, label1, label2, type = "line", color1 = "blue", color2 = "green" }) => {
  const [chartData, setChartData] = useState(null);
  const [chartOptions, setChartOptions] = useState({});

  useEffect(() => {
    if (!data1 || !data2) return;

    // Combine and sort dates
    const allDates = new Set([
      ...(data1 || []).map(d => d.date),
      ...(data2 || []).map(d => d.date)
    ]);
    const sortedDates = Array.from(allDates).sort((a, b) => new Date(a) - new Date(b));

    // Create maps for quick lookup
    const data1Map = new Map((data1 || []).map(d => [d.date, d.count || d.avgWait || 0]));
    const data2Map = new Map((data2 || []).map(d => [d.date, d.count || d.avgWait || 0]));

    const processedData = {
      labels: sortedDates.map(date => 
        new Date(date).toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric' 
        })
      ),
      datasets: [
        {
          label: label1,
          data: sortedDates.map(date => data1Map.get(date) || 0),
          borderColor: color1 === 'blue' ? 'rgb(59, 130, 246)' : 
                      color1 === 'green' ? 'rgb(34, 197, 94)' : 
                      color1 === 'red' ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)',
          backgroundColor: color1 === 'blue' ? 'rgba(59, 130, 246, 0.1)' : 
                          color1 === 'green' ? 'rgba(34, 197, 94, 0.1)' : 
                          color1 === 'red' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: type === 'line'
        },
        {
          label: label2,
          data: sortedDates.map(date => data2Map.get(date) || 0),
          borderColor: color2 === 'blue' ? 'rgb(59, 130, 246)' : 
                      color2 === 'green' ? 'rgb(34, 197, 94)' : 
                      color2 === 'red' ? 'rgb(239, 68, 68)' : 'rgb(99, 102, 241)',
          backgroundColor: color2 === 'blue' ? 'rgba(59, 130, 246, 0.1)' : 
                          color2 === 'green' ? 'rgba(34, 197, 94, 0.1)' : 
                          color2 === 'red' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)',
          borderWidth: 2,
          tension: 0.4,
          fill: type === 'line'
        }
      ]
    };

    setChartData(processedData);
    setChartOptions({
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { 
          display: true, 
          position: 'top',
          labels: {
            boxWidth: 12,
            boxHeight: 12,
            padding: 15,
            font: { size: 12 }
          }
        },
        title: { 
          display: true, 
          text: title,
          font: { size: 16, weight: 'bold' }
        }
      },
      scales: {
        x: { 
          grid: { display: false },
          ticks: { maxTicksLimit: 8 }
        },
        y: { 
          beginAtZero: true,
          grid: { color: 'rgba(0, 0, 0, 0.1)' }
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      }
    });
  }, [data1, data2, label1, label2, type, color1, color2, title]);

  if (!chartData) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-lg font-semibold mb-4">{title}</h3>
        <div className="h-64 flex items-center justify-center">
          <div className="text-gray-500">No data available for comparison</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      <div className="h-80">
        {type === 'line' ? (
          <Line data={chartData} options={chartOptions} />
        ) : (
          <Bar data={chartData} options={chartOptions} />
        )}
      </div>
    </div>
  );
};

const TimePeriodSelector = ({ selectedPeriod, onPeriodChange }) => {
  const periods = [
    { value: 'day', label: 'Day' },
    { value: 'week', label: 'Week' },
    { value: 'month', label: 'Month' },
    { value: '6months', label: '6 Months' },
    { value: 'year', label: 'Year' }
  ];

  return (
    <div className="flex space-x-2 bg-white p-2 rounded-lg shadow-sm">
      {periods.map((period) => (
        <button
          key={period.value}
          onClick={() => onPeriodChange(period.value)}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            selectedPeriod === period.value
              ? 'bg-blue-500 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {period.label}
        </button>
      ))}
    </div>
  );
};

const DepartmentSelector = ({ departments, selectedDepartment, onDepartmentChange, label }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <span className="text-sm font-medium text-gray-700">
          {selectedDepartment ? selectedDepartment.name : 'Select Department'}
        </span>
        {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>
      
      {isOpen && (
        <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          {departments.filter(dept => dept.active !== false).map((department) => (
            <button
              key={department.id}
              onClick={() => {
                onDepartmentChange(department);
                setIsOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
            >
              {department.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const AnalyticsComparison = ({ userRole = 'admin', assignedDepartment = null }) => {
  const { departments } = useDepartments();
  const [comparisonType, setComparisonType] = useState('time'); // 'time', 'department', 'metric'
  const [selectedPeriod1, setSelectedPeriod1] = useState('month');
  const [selectedPeriod2, setSelectedPeriod2] = useState('week');
  const [selectedDepartment1, setSelectedDepartment1] = useState(null);
  const [selectedDepartment2, setSelectedDepartment2] = useState(null);
  const [data1, setData1] = useState(null);
  const [data2, setData2] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Initialize department selections based on user role
  useEffect(() => {
    if (userRole === 'admin' && assignedDepartment) {
      setSelectedDepartment1(assignedDepartment);
      setSelectedDepartment2(assignedDepartment);
    } else if (userRole === 'super_admin' && departments.length > 0) {
      setSelectedDepartment1(departments[0]);
      setSelectedDepartment2(departments[1] || departments[0]);
    }
  }, [userRole, assignedDepartment, departments]);

  // Fetch comparison data
  useEffect(() => {
    if (comparisonType === 'time' && selectedDepartment1) {
      fetchComparisonData();
    } else if (comparisonType === 'department' && selectedDepartment1 && selectedDepartment2) {
      fetchComparisonData();
    }
  }, [comparisonType, selectedPeriod1, selectedPeriod2, selectedDepartment1, selectedDepartment2]);

  const fetchComparisonData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const promises = [];

      if (comparisonType === 'time') {
        // Compare different time periods for the same department
        promises.push(
          historicalService.getHistoricalData(selectedDepartment1.id, selectedPeriod1, null),
          historicalService.getHistoricalData(selectedDepartment1.id, selectedPeriod2, null)
        );
      } else if (comparisonType === 'department') {
        // Compare different departments for the same time period
        promises.push(
          historicalService.getHistoricalData(selectedDepartment1.id, selectedPeriod1, null),
          historicalService.getHistoricalData(selectedDepartment2.id, selectedPeriod1, null)
        );
      }

      const [response1, response2] = await Promise.all(promises);
      
      const processedData1 = historicalService.processDataForCharts(response1, selectedPeriod1);
      const processedData2 = historicalService.processDataForCharts(response2, selectedPeriod2);

      setData1(processedData1);
      setData2(processedData2);
    } catch (err) {
      console.error('Error fetching comparison data:', err);
      setError('Failed to load comparison data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const getComparisonLabels = () => {
    if (comparisonType === 'time') {
      return {
        label1: `${selectedPeriod1.charAt(0).toUpperCase() + selectedPeriod1.slice(1)} Period`,
        label2: `${selectedPeriod2.charAt(0).toUpperCase() + selectedPeriod2.slice(1)} Period`
      };
    } else if (comparisonType === 'department') {
      return {
        label1: selectedDepartment1?.name || 'Department 1',
        label2: selectedDepartment2?.name || 'Department 2'
      };
    }
    return { label1: 'Period 1', label2: 'Period 2' };
  };

  const getComparisonTitle = () => {
    if (comparisonType === 'time') {
      return `${selectedDepartment1?.name || 'Department'} - Time Period Comparison`;
    } else if (comparisonType === 'department') {
      return `Department Comparison - ${selectedPeriod1.charAt(0).toUpperCase() + selectedPeriod1.slice(1)} Period`;
    }
    return 'Analytics Comparison';
  };

  const calculateMetrics = (data) => {
    if (!data?.overall) return {};

    const overall = data.overall;
    const transactions = overall.transactions || [];
    const waitTimes = overall.waitTimes || [];
    const canceledTransactions = overall.canceledTransactions || [];

    const totalTransactions = transactions.reduce((sum, item) => sum + (item.count || 0), 0);
    const totalCanceled = canceledTransactions.reduce((sum, item) => sum + (item.count || 0), 0);
    const avgWaitTime = waitTimes.length ? 
      waitTimes.reduce((sum, item) => sum + (item.avgWait || 0), 0) / waitTimes.length : 0;
    const cancelRate = totalTransactions > 0 ? (totalCanceled / totalTransactions) * 100 : 0;
    const slaCompliance = waitTimes.length ? 
      (waitTimes.filter(p => (p.avgWait || 0) <= 15).length / waitTimes.length) * 100 : 0;

    return {
      totalTransactions,
      totalCanceled,
      avgWaitTime,
      cancelRate,
      slaCompliance,
      avgCompletedDuration: data.durations?.average_completed_minutes || 0,
      avgCanceledDuration: data.durations?.average_canceled_minutes || 0,
      kioskUsage: (overall.kioskUsage?.webKiosk || 0) + (overall.kioskUsage?.physicalKiosk || 0)
    };
  };

  const metrics1 = calculateMetrics(data1);
  const metrics2 = calculateMetrics(data2);
  const labels = getComparisonLabels();

  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Error Loading Comparison</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={fetchComparisonData}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <GitCompare className="w-6 h-6 text-blue-600" />
            <h2 className="text-2xl font-bold text-gray-800">Analytics Comparison</h2>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Comparison Tools</span>
          </div>
        </div>

        {/* Comparison Type Selector */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setComparisonType('time')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              comparisonType === 'time'
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Calendar className="w-4 h-4 inline mr-2" />
            Time Period Comparison
          </button>
          {userRole === 'super_admin' && (
            <button
              onClick={() => setComparisonType('department')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                comparisonType === 'department'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <BarChart3 className="w-4 h-4 inline mr-2" />
              Department Comparison
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {comparisonType === 'time' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period 1</label>
                <TimePeriodSelector 
                  selectedPeriod={selectedPeriod1} 
                  onPeriodChange={setSelectedPeriod1} 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Period 2</label>
                <TimePeriodSelector 
                  selectedPeriod={selectedPeriod2} 
                  onPeriodChange={setSelectedPeriod2} 
                />
              </div>
              {userRole === 'super_admin' && (
                <div className="md:col-span-2">
                  <DepartmentSelector
                    departments={departments}
                    selectedDepartment={selectedDepartment1}
                    onDepartmentChange={setSelectedDepartment1}
                    label="Department"
                  />
                </div>
              )}
            </>
          ) : (
            <>
              <div>
                <DepartmentSelector
                  departments={departments}
                  selectedDepartment={selectedDepartment1}
                  onDepartmentChange={setSelectedDepartment1}
                  label="Department 1"
                />
              </div>
              <div>
                <DepartmentSelector
                  departments={departments}
                  selectedDepartment={selectedDepartment2}
                  onDepartmentChange={setSelectedDepartment2}
                  label="Department 2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Time Period</label>
                <TimePeriodSelector 
                  selectedPeriod={selectedPeriod1} 
                  onPeriodChange={setSelectedPeriod1} 
                />
              </div>
            </>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white p-6 rounded-lg shadow-md">
              <div className="h-8 bg-gray-200 animate-pulse rounded mb-2"></div>
              <div className="h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
          ))}
        </div>
      ) : data1 && data2 ? (
        <>
          {/* Metrics Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <ComparisonCard
              title="Total Transactions"
              value1={metrics1.totalTransactions}
              value2={metrics2.totalTransactions}
              label1={labels.label1}
              label2={labels.label2}
              icon={TrendingUp}
              color="green"
            />
            <ComparisonCard
              title="Average Wait Time"
              value1={metrics1.avgWaitTime}
              value2={metrics2.avgWaitTime}
              label1={labels.label1}
              label2={labels.label2}
              icon={Clock}
              color="blue"
              format="time"
            />
            <ComparisonCard
              title="Cancellation Rate"
              value1={metrics1.cancelRate}
              value2={metrics2.cancelRate}
              label1={labels.label1}
              label2={labels.label2}
              icon={XCircle}
              color="red"
              format="percentage"
            />
            <ComparisonCard
              title="SLA Compliance"
              value1={metrics1.slaCompliance}
              value2={metrics2.slaCompliance}
              label1={labels.label1}
              label2={labels.label2}
              icon={Activity}
              color="purple"
              format="percentage"
            />
          </div>

          {/* Charts Comparison */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ComparisonChart
              title="Transaction Volume Comparison"
              data1={data1.overall.transactions}
              data2={data2.overall.transactions}
              label1={labels.label1}
              label2={labels.label2}
              type="bar"
              color1="green"
              color2="blue"
            />
            <ComparisonChart
              title="Average Wait Time Comparison"
              data1={data1.overall.waitTimes}
              data2={data2.overall.waitTimes}
              label1={labels.label1}
              label2={labels.label2}
              type="line"
              color1="blue"
              color2="red"
            />
            <ComparisonChart
              title="Canceled Transactions Comparison"
              data1={data1.overall.canceledTransactions}
              data2={data2.overall.canceledTransactions}
              label1={labels.label1}
              label2={labels.label2}
              type="bar"
              color1="red"
              color2="orange"
            />
            <ComparisonChart
              title="Failed Transactions Comparison"
              data1={data1.overall.failedTransactions}
              data2={data2.overall.failedTransactions}
              label1={labels.label1}
              label2={labels.label2}
              type="line"
              color1="yellow"
              color2="purple"
            />
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h3 className="text-lg font-semibold mb-4">Comparison Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-800 mb-2">{labels.label1}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-medium">{metrics1.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Wait Time:</span>
                    <span className="font-medium">{metrics1.avgWaitTime.toFixed(1)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation Rate:</span>
                    <span className="font-medium">{metrics1.cancelRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SLA Compliance:</span>
                    <span className="font-medium">{metrics1.slaCompliance.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-800 mb-2">{labels.label2}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Total Transactions:</span>
                    <span className="font-medium">{metrics2.totalTransactions}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Avg Wait Time:</span>
                    <span className="font-medium">{metrics2.avgWaitTime.toFixed(1)} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cancellation Rate:</span>
                    <span className="font-medium">{metrics2.cancelRate.toFixed(1)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>SLA Compliance:</span>
                    <span className="font-medium">{metrics2.slaCompliance.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-6 rounded-lg shadow-md text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">No Data Available</h3>
          <p className="text-gray-600">Please select departments and time periods to view comparison data.</p>
        </div>
      )}
    </div>
  );
};

export default AnalyticsComparison;
