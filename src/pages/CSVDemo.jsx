import React, { useState } from 'react';
import { FileDown, Download, BarChart3, TrendingUp, Clock, Users } from 'lucide-react';
import csvReportService from '../utils/csvReportService';

const CSVDemo = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadResults, setDownloadResults] = useState(null);

  // Sample data that mimics the analytics structure
  const sampleAnalyticsData = {
    data: {
      transactions: [
        { date: '2025-08-01', count: 150 },
        { date: '2025-08-02', count: 180 },
        { date: '2025-08-03', count: 200 },
        { date: '2025-08-04', count: 165 },
        { date: '2025-08-05', count: 190 },
        { date: '2025-08-06', count: 220 },
        { date: '2025-08-07', count: 175 },
        { date: '2025-08-08', count: 210 },
        { date: '2025-08-09', count: 195 },
        { date: '2025-08-10', count: 185 },
        { date: '2025-08-11', count: 170 },
        { date: '2025-08-12', count: 205 },
        { date: '2025-08-13', count: 180 },
        { date: '2025-08-14', count: 160 },
        { date: '2025-08-15', count: 190 },
        { date: '2025-08-16', count: 220 },
        { date: '2025-08-17', count: 175 },
        { date: '2025-08-18', count: 195 },
        { date: '2025-08-19', count: 210 },
        { date: '2025-08-20', count: 185 },
        { date: '2025-08-21', count: 200 },
        { date: '2025-08-22', count: 180 },
        { date: '2025-08-23', count: 165 },
        { date: '2025-08-24', count: 190 },
        { date: '2025-08-25', count: 205 },
        { date: '2025-08-26', count: 175 },
        { date: '2025-08-27', count: 195 },
        { date: '2025-08-28', count: 220 },
        { date: '2025-08-29', count: 180 },
        { date: '2025-08-30', count: 160 },
        { date: '2025-08-31', count: 190 }
      ],
      wait_times: [
        { date: '2025-08-01', average_wait: 28 },
        { date: '2025-08-02', average_wait: 25 },
        { date: '2025-08-03', average_wait: 30 },
        { date: '2025-08-04', average_wait: 22 },
        { date: '2025-08-05', average_wait: 26 },
        { date: '2025-08-06', average_wait: 32 },
        { date: '2025-08-07', average_wait: 24 },
        { date: '2025-08-08', average_wait: 29 },
        { date: '2025-08-09', average_wait: 27 },
        { date: '2025-08-10', average_wait: 25 },
        { date: '2025-08-11', average_wait: 23 },
        { date: '2025-08-12', average_wait: 28 },
        { date: '2025-08-13', average_wait: 26 },
        { date: '2025-08-14', average_wait: 24 },
        { date: '2025-08-15', average_wait: 27 },
        { date: '2025-08-16', average_wait: 30 },
        { date: '2025-08-17', average_wait: 25 },
        { date: '2025-08-18', average_wait: 28 },
        { date: '2025-08-19', average_wait: 31 },
        { date: '2025-08-20', average_wait: 26 },
        { date: '2025-08-21', average_wait: 29 },
        { date: '2025-08-22', average_wait: 27 },
        { date: '2025-08-23', average_wait: 24 },
        { date: '2025-08-24', average_wait: 26 },
        { date: '2025-08-25', average_wait: 28 },
        { date: '2025-08-26', average_wait: 25 },
        { date: '2025-08-27', average_wait: 27 },
        { date: '2025-08-28', average_wait: 30 },
        { date: '2025-08-29', average_wait: 26 },
        { date: '2025-08-30', average_wait: 24 },
        { date: '2025-08-31', average_wait: 27 }
      ],
      canceled_transactions: [
        { date: '2025-08-01', count: 12 },
        { date: '2025-08-02', count: 15 },
        { date: '2025-08-03', count: 18 },
        { date: '2025-08-04', count: 10 },
        { date: '2025-08-05', count: 14 },
        { date: '2025-08-06', count: 20 },
        { date: '2025-08-07', count: 11 },
        { date: '2025-08-08', count: 16 },
        { date: '2025-08-09', count: 13 },
        { date: '2025-08-10', count: 12 },
        { date: '2025-08-11', count: 10 },
        { date: '2025-08-12', count: 15 },
        { date: '2025-08-13', count: 14 },
        { date: '2025-08-14', count: 11 },
        { date: '2025-08-15', count: 13 },
        { date: '2025-08-16', count: 18 },
        { date: '2025-08-17', count: 12 },
        { date: '2025-08-18', count: 15 },
        { date: '2025-08-19', count: 19 },
        { date: '2025-08-20', count: 13 },
        { date: '2025-08-21', count: 16 },
        { date: '2025-08-22', count: 14 },
        { date: '2025-08-23', count: 11 },
        { date: '2025-08-24', count: 13 },
        { date: '2025-08-25', count: 15 },
        { date: '2025-08-26', count: 12 },
        { date: '2025-08-27', count: 14 },
        { date: '2025-08-28', count: 17 },
        { date: '2025-08-29', count: 13 },
        { date: '2025-08-30', count: 11 },
        { date: '2025-08-31', count: 14 }
      ],
      cancellation_reasons: [
        { reason: 'Long wait time', count: 45, percentage: 35.2 },
        { reason: 'Service unavailable', count: 28, percentage: 21.9 },
        { reason: 'Changed mind', count: 22, percentage: 17.2 },
        { reason: 'Emergency', count: 18, percentage: 14.1 },
        { reason: 'Other', count: 15, percentage: 11.7 }
      ],
      kiosk_usage: {
        web: 1200,
        physical: 800
      }
    }
  };

  const handleDownloadCSV = async () => {
    setIsDownloading(true);
    setDownloadResults(null);

    try {
      // Mock the historical service to return our sample data
      const originalGetHistoricalData = csvReportService.generateAnalyticsReport;
      
      // Temporarily replace the method to use sample data
      csvReportService.generateAnalyticsReport = async (departmentId, departmentName, timePeriod, selectedTransaction) => {
        const reportData = csvReportService.processDataForReport(
          sampleAnalyticsData.data, 
          departmentName, 
          timePeriod, 
          selectedTransaction
        );
        return reportData;
      };

      const result = await csvReportService.generateAndDownloadReport(
        1, // Sample department ID
        'Treasury Department', // Sample department name
        'month', // Sample time period
        null // No specific transaction
      );

      // Restore original method
      csvReportService.generateAnalyticsReport = originalGetHistoricalData;

      setDownloadResults({
        success: true,
        message: `CSV report generated successfully!`,
        filename: result.filename
      });
    } catch (error) {
      setDownloadResults({
        success: false,
        message: `Error generating CSV: ${error.message}`,
        error: error
      });
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            CSV Analytics Report Demo
          </h1>
          <p className="text-lg text-gray-600">
            Experience the comprehensive analytics report generation based on your reference image
          </p>
        </div>

        {/* Sample Analytics Preview */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Sample Analytics Data Preview</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-blue-50 p-6 rounded-lg border-l-4 border-l-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Total Transactions</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">5,400</p>
                </div>
                <div className="p-3 rounded-full bg-blue-100">
                  <BarChart3 className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-6 rounded-lg border-l-4 border-l-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Average Wait Time</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">26.5 min</p>
                </div>
                <div className="p-3 rounded-full bg-green-100">
                  <Clock className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 p-6 rounded-lg border-l-4 border-l-yellow-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Abandonment Rate</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">7.2%</p>
                </div>
                <div className="p-3 rounded-full bg-yellow-100">
                  <TrendingUp className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </div>

            <div className="bg-purple-50 p-6 rounded-lg border-l-4 border-l-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium text-gray-600">Kiosk Usage</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-1">2,000</p>
                </div>
                <div className="p-3 rounded-full bg-purple-100">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* KPI Table Preview */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Key Performance Indicators (KPIs)</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Clients Served</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Wait Time (mins)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Avg Service Time (mins)</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abandonment Rate (%)</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">Treasury Department</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">5,400</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">26.5</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">10.6</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">7.2</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Download Section */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Generate CSV Report</h2>
          
          <div className="space-y-4">
            <p className="text-gray-600">
              Click the button below to generate and download a comprehensive CSV report that includes:
            </p>
            
            <ul className="list-disc list-inside space-y-2 text-gray-600 ml-4">
              <li>Executive Summary with key metrics</li>
              <li>Detailed KPIs table (similar to your reference image)</li>
              <li>Insights & Analysis based on the data</li>
              <li>System recommendations for improvement</li>
              <li>Detailed daily transaction and wait time data</li>
              <li>Cancellation reasons analysis</li>
              <li>Kiosk usage statistics</li>
              <li>System performance summary</li>
            </ul>

            <div className="pt-4">
              <button
                onClick={handleDownloadCSV}
                disabled={isDownloading}
                className={`flex items-center space-x-3 px-8 py-4 rounded-lg font-medium transition-all duration-200 ${
                  isDownloading
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600 text-white shadow-md hover:shadow-lg transform hover:scale-105'
                }`}
              >
                <FileDown className="w-6 h-6" />
                <span className="text-lg">
                  {isDownloading ? 'Generating Report...' : 'Download CSV Report'}
                </span>
              </button>
            </div>

            {downloadResults && (
              <div className={`mt-6 p-4 rounded-lg ${
                downloadResults.success 
                  ? 'bg-green-50 border border-green-200' 
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center space-x-2">
                  <Download className={`w-5 h-5 ${
                    downloadResults.success ? 'text-green-600' : 'text-red-600'
                  }`} />
                  <h3 className={`font-medium ${
                    downloadResults.success ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {downloadResults.success ? 'Report Generated Successfully!' : 'Error Generating Report'}
                  </h3>
                </div>
                <p className={`mt-2 ${
                  downloadResults.success ? 'text-green-700' : 'text-red-700'
                }`}>
                  {downloadResults.message}
                </p>
                {downloadResults.filename && (
                  <p className="mt-2 text-sm text-gray-600">
                    <strong>Filename:</strong> {downloadResults.filename}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Features Overview */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">CSV Report Features</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Report Structure</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Executive Summary with key metrics</li>
                <li>• KPI table matching your reference format</li>
                <li>• Insights & Analysis section</li>
                <li>• Actionable recommendations</li>
                <li>• Detailed data breakdowns</li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-3">Data Analysis</h3>
              <ul className="space-y-2 text-gray-600">
                <li>• Wait time performance analysis</li>
                <li>• Abandonment rate insights</li>
                <li>• Transaction volume patterns</li>
                <li>• Kiosk usage statistics</li>
                <li>• System performance summary</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CSVDemo;
