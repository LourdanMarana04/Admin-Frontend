import historicalService from './historicalAnalyticsService';

class CSVReportService {
  constructor() {
    this.baseURL = 'http://localhost:8000/api';
  }

  // Get authentication headers
  getAuthHeaders() {
    const token = localStorage.getItem('token');
    return token ? { 'Authorization': `Bearer ${token}` } : {};
  }

  // Generate comprehensive analytics report
  async generateAnalyticsReport(departmentId, departmentName, timePeriod, selectedTransaction = null) {
    try {
      // Fetch historical data
      const rawData = await historicalService.getHistoricalData(
        departmentId,
        timePeriod,
        selectedTransaction
      );

      if (!rawData || !rawData.data) {
        throw new Error('No data available for the selected period');
      }

      const data = rawData.data;
      const reportData = this.processDataForReport(data, departmentName, timePeriod, selectedTransaction);
      
      return reportData;
    } catch (error) {
      console.error('Error generating analytics report:', error);
      throw error;
    }
  }

  // Process data for comprehensive report
  processDataForReport(data, departmentName, timePeriod, selectedTransaction) {
    const now = new Date();
    const reportDate = now.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Calculate key metrics
    const totalTransactions = data.transactions?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    const totalWaitTime = data.wait_times?.reduce((sum, item) => sum + (item.average_wait || 0), 0) || 0;
    const avgWaitTime = data.wait_times?.length > 0 ? (totalWaitTime / data.wait_times.length) : 0;
    const totalCanceled = data.canceled_transactions?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    const abandonmentRate = totalTransactions > 0 ? ((totalCanceled / totalTransactions) * 100) : 0;

    // Calculate service time (estimated based on wait time patterns)
    const avgServiceTime = avgWaitTime > 0 ? Math.max(5, avgWaitTime * 0.4) : 8; // Estimate service time as 40% of wait time, minimum 5 mins

    // Get peak performance day
    const peakDay = this.getPeakPerformanceDay(data.transactions);
    
    // Get worst performance day
    const worstDay = this.getWorstPerformanceDay(data.wait_times);

    // Generate insights
    const insights = this.generateInsights(data, avgWaitTime, abandonmentRate, totalTransactions, timePeriod);
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(data, avgWaitTime, abandonmentRate, totalTransactions, timePeriod);

    return {
      header: {
        title: `${departmentName} - Queuing Management System Analytics Report`,
        period: this.getPeriodDescription(timePeriod),
        reportDate: reportDate,
        department: departmentName
      },
      executiveSummary: {
        totalTransactions,
        avgWaitTime: Math.round(avgWaitTime * 10) / 10,
        avgServiceTime: Math.round(avgServiceTime * 10) / 10,
        abandonmentRate: Math.round(abandonmentRate * 10) / 10,
        peakDay,
        worstDay
      },
      kpis: this.generateKPIData(data, departmentName, avgWaitTime, avgServiceTime, abandonmentRate),
      insights,
      recommendations,
      rawData: data
    };
  }

  // Generate KPI data for the report
  generateKPIData(data, departmentName, avgWaitTime, avgServiceTime, abandonmentRate) {
    const totalTransactions = data.transactions?.reduce((sum, item) => sum + (item.count || 0), 0) || 0;
    
    return {
      department: departmentName,
      clientsServed: totalTransactions,
      avgWaitTime: Math.round(avgWaitTime * 10) / 10,
      avgServiceTime: Math.round(avgServiceTime * 10) / 10,
      abandonmentRate: Math.round(abandonmentRate * 10) / 10
    };
  }

  // Generate insights based on data analysis with trend analysis
  generateInsights(data, avgWaitTime, abandonmentRate, totalTransactions, timePeriod) {
    const insights = [];

    // Calculate trends and patterns
    const trends = this.calculateTrends(data, timePeriod);
    const patterns = this.analyzePatterns(data);

    // Wait time analysis with trends
    if (avgWaitTime > 20) {
      if (trends.waitTimeTrend > 10) {
        insights.push(`CRITICAL: Wait times are extremely high (${Math.round(avgWaitTime)} minutes) and increasing by ${trends.waitTimeTrend}% - immediate intervention required.`);
      } else if (trends.waitTimeTrend > 0) {
        insights.push(`URGENT: Wait times are high (${Math.round(avgWaitTime)} minutes) and trending upward by ${trends.waitTimeTrend}% - staffing review needed.`);
      } else {
        insights.push(`High wait times (${Math.round(avgWaitTime)} minutes) but stable - consider process optimization and additional staffing.`);
      }
    } else if (avgWaitTime < 10) {
      if (trends.waitTimeTrend < -5) {
        insights.push(`EXCELLENT: Wait times are low (${Math.round(avgWaitTime)} minutes) and improving by ${Math.abs(trends.waitTimeTrend)}% - maintain current practices.`);
      } else {
        insights.push(`Excellent wait times (${Math.round(avgWaitTime)} minutes) - department is performing optimally.`);
      }
    } else {
      if (trends.waitTimeTrend > 5) {
        insights.push(`Moderate wait times (${Math.round(avgWaitTime)} minutes) but increasing by ${trends.waitTimeTrend}% - monitor closely and consider preventive measures.`);
      } else if (trends.waitTimeTrend < -5) {
        insights.push(`Good wait times (${Math.round(avgWaitTime)} minutes) and improving by ${Math.abs(trends.waitTimeTrend)}% - positive trend continues.`);
      } else {
        insights.push(`Moderate wait times (${Math.round(avgWaitTime)} minutes) with stable performance - room for optimization.`);
      }
    }

    // Abandonment rate analysis with trends
    if (abandonmentRate > 10) {
      if (trends.abandonmentTrend > 5) {
        insights.push(`CRITICAL: Abandonment rate is very high (${Math.round(abandonmentRate)}%) and increasing by ${trends.abandonmentTrend}% - client satisfaction crisis.`);
      } else {
        insights.push(`URGENT: High abandonment rate (${Math.round(abandonmentRate)}%) indicates serious client satisfaction issues - immediate action required.`);
      }
    } else if (abandonmentRate < 3) {
      if (trends.abandonmentTrend < -2) {
        insights.push(`EXCELLENT: Low abandonment rate (${Math.round(abandonmentRate)}%) and improving by ${Math.abs(trends.abandonmentTrend)}% - outstanding client service.`);
      } else {
        insights.push(`Excellent abandonment rate (${Math.round(abandonmentRate)}%) - client satisfaction is high.`);
      }
    } else {
      if (trends.abandonmentTrend > 3) {
        insights.push(`Moderate abandonment rate (${Math.round(abandonmentRate)}%) but increasing by ${trends.abandonmentTrend}% - monitor and address client concerns.`);
      } else if (trends.abandonmentTrend < -2) {
        insights.push(`Good abandonment rate (${Math.round(abandonmentRate)}%) and improving by ${Math.abs(trends.abandonmentTrend)}% - positive client experience trend.`);
      } else {
        insights.push(`Moderate abandonment rate (${Math.round(abandonmentRate)}%) - some clients leaving, but within acceptable range.`);
      }
    }

    // Transaction volume analysis with trends
    if (totalTransactions > 3000) {
      if (trends.transactionTrend > 15) {
        insights.push(`HIGH DEMAND: Very high transaction volume (${totalTransactions}) and increasing by ${trends.transactionTrend}% - consider capacity expansion.`);
      } else if (trends.transactionTrend > 5) {
        insights.push(`High transaction volume (${totalTransactions}) and growing by ${trends.transactionTrend}% - ensure adequate staffing and process efficiency.`);
      } else {
        insights.push(`High transaction volume (${totalTransactions}) - maintain robust staffing and efficient processes.`);
      }
    } else if (totalTransactions < 1000) {
      if (trends.transactionTrend < -10) {
        insights.push(`DECLINING: Low transaction volume (${totalTransactions}) and decreasing by ${Math.abs(trends.transactionTrend)}% - investigate demand factors.`);
      } else if (trends.transactionTrend < -5) {
        insights.push(`Moderate transaction volume (${totalTransactions}) but declining by ${Math.abs(trends.transactionTrend)}% - monitor demand patterns.`);
      } else {
        insights.push(`Moderate transaction volume (${totalTransactions}) - allows for focused client attention.`);
      }
    } else {
      if (trends.transactionTrend > 10) {
        insights.push(`Growing transaction volume (${totalTransactions}) and increasing by ${trends.transactionTrend}% - prepare for higher demand.`);
      } else if (trends.transactionTrend < -5) {
        insights.push(`Stable transaction volume (${totalTransactions}) but declining by ${Math.abs(trends.transactionTrend)}% - assess service accessibility.`);
      } else {
        insights.push(`Good transaction volume (${totalTransactions}) - steady client demand.`);
      }
    }

    // Peak performance analysis
    if (patterns.peakDay) {
      insights.push(`Peak performance day: ${patterns.peakDay} (${patterns.peakDayTransactions} transactions) - consider replicating successful practices.`);
    }
    if (patterns.worstDay) {
      insights.push(`Challenging day: ${patterns.worstDay} (${patterns.worstDayWaitTime} min avg wait) - investigate and improve processes.`);
    }

    // Kiosk usage analysis with trends
    const kioskUsage = data.kiosk_usage || { web: 0, physical: 0 };
    const totalKioskUsage = kioskUsage.web + kioskUsage.physical;
    if (totalKioskUsage > 0) {
      const webPercentage = Math.round((kioskUsage.web / totalKioskUsage) * 100);
      if (trends.kioskTrend > 10) {
        insights.push(`Digital adoption growing: ${webPercentage}% web kiosk usage (up ${trends.kioskTrend}%) - expand digital services.`);
      } else if (trends.kioskTrend < -10) {
        insights.push(`Physical kiosk preference: ${100 - webPercentage}% physical usage (up ${Math.abs(trends.kioskTrend)}%) - maintain physical infrastructure.`);
      } else {
        insights.push(`Balanced kiosk usage: ${webPercentage}% web-based, ${100 - webPercentage}% physical - good service accessibility.`);
      }
    }

    // Time period specific insights (2-3 per period)
    if (timePeriod === 'month') {
      insights.push(`Monthly analysis shows ${patterns.weeklyPattern} - consider weekly staffing adjustments.`);
      insights.push(`Short-term operational focus: Monitor daily performance metrics for immediate improvements.`);
    } else if (timePeriod === '6months') {
      insights.push(`Six-month trend analysis reveals ${patterns.seasonalPattern} - plan for seasonal variations.`);
      insights.push(`Mid-year performance review: Evaluate operational efficiency against annual targets.`);
      insights.push(`Seasonal planning: Prepare for demand fluctuations based on historical patterns.`);
    } else if (timePeriod === 'year') {
      insights.push(`Annual analysis indicates ${patterns.yearlyPattern} - strategic planning opportunities identified.`);
      insights.push(`Year-end evaluation: Comprehensive performance review across all operational metrics.`);
      insights.push(`Strategic planning: Use annual data for long-term capacity and resource planning.`);
    }

    return insights;
  }

  // Calculate trends from data
  calculateTrends(data, timePeriod) {
    const trends = {
      waitTimeTrend: 0,
      abandonmentTrend: 0,
      transactionTrend: 0,
      kioskTrend: 0
    };

    // Calculate wait time trend
    if (data.wait_times && data.wait_times.length > 1) {
      const firstHalf = data.wait_times.slice(0, Math.floor(data.wait_times.length / 2));
      const secondHalf = data.wait_times.slice(Math.floor(data.wait_times.length / 2));
      
      const firstHalfAvg = firstHalf.reduce((sum, item) => sum + (item.average_wait || 0), 0) / firstHalf.length;
      const secondHalfAvg = secondHalf.reduce((sum, item) => sum + (item.average_wait || 0), 0) / secondHalf.length;
      
      if (firstHalfAvg > 0) {
        trends.waitTimeTrend = Math.round(((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100);
      }
    }

    // Calculate transaction trend
    if (data.transactions && data.transactions.length > 1) {
      const firstHalf = data.transactions.slice(0, Math.floor(data.transactions.length / 2));
      const secondHalf = data.transactions.slice(Math.floor(data.transactions.length / 2));
      
      const firstHalfTotal = firstHalf.reduce((sum, item) => sum + (item.count || 0), 0);
      const secondHalfTotal = secondHalf.reduce((sum, item) => sum + (item.count || 0), 0);
      
      if (firstHalfTotal > 0) {
        trends.transactionTrend = Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100);
      }
    }

    // Calculate abandonment trend (simplified)
    if (data.canceled_transactions && data.canceled_transactions.length > 1) {
      const firstHalf = data.canceled_transactions.slice(0, Math.floor(data.canceled_transactions.length / 2));
      const secondHalf = data.canceled_transactions.slice(Math.floor(data.canceled_transactions.length / 2));
      
      const firstHalfTotal = firstHalf.reduce((sum, item) => sum + (item.count || 0), 0);
      const secondHalfTotal = secondHalf.reduce((sum, item) => sum + (item.count || 0), 0);
      
      if (firstHalfTotal > 0) {
        trends.abandonmentTrend = Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100);
      }
    }

    return trends;
  }

  // Analyze patterns in data
  analyzePatterns(data) {
    const patterns = {
      peakDay: null,
      peakDayTransactions: 0,
      worstDay: null,
      worstDayWaitTime: 0,
      weeklyPattern: 'consistent daily patterns',
      seasonalPattern: 'stable performance across months',
      yearlyPattern: 'consistent annual performance'
    };

    // Find peak and worst days
    if (data.transactions && data.transactions.length > 0) {
      const peakDayData = data.transactions.reduce((max, current) => 
        (current.count || 0) > (max.count || 0) ? current : max
      );
      patterns.peakDay = peakDayData.date;
      patterns.peakDayTransactions = peakDayData.count || 0;
    }

    if (data.wait_times && data.wait_times.length > 0) {
      const worstDayData = data.wait_times.reduce((max, current) => 
        (current.average_wait || 0) > (max.average_wait || 0) ? current : max
      );
      patterns.worstDay = worstDayData.date;
      patterns.worstDayWaitTime = worstDayData.average_wait || 0;
    }

    // Analyze weekly patterns
    if (data.transactions && data.transactions.length >= 7) {
      const dayOfWeekCounts = {};
      data.transactions.forEach(item => {
        const day = new Date(item.date).getDay();
        dayOfWeekCounts[day] = (dayOfWeekCounts[day] || 0) + (item.count || 0);
      });
      
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const sortedDays = Object.entries(dayOfWeekCounts)
        .sort(([,a], [,b]) => b - a)
        .map(([day, count]) => ({ day: days[day], count }));
      
      if (sortedDays.length > 0) {
        patterns.weeklyPattern = `peak activity on ${sortedDays[0].day} (${sortedDays[0].count} transactions)`;
      }
    }

    return patterns;
  }

  // Generate recommendations based on data analysis with enhanced insights
  generateRecommendations(data, avgWaitTime, abandonmentRate, totalTransactions, timePeriod) {
    const recommendations = [];
    const trends = this.calculateTrends(data, timePeriod);
    const patterns = this.analyzePatterns(data);

    // Time-period specific context
    const timeContext = this.getTimePeriodContext(timePeriod);
    
    // Wait time recommendations with trend awareness (1-2 per category)
    if (avgWaitTime > 20) {
      if (trends.waitTimeTrend > 10) {
        recommendations.push(`URGENT: Wait times are increasing by ${trends.waitTimeTrend}% - implement immediate staffing surge for ${timeContext.period}`);
        recommendations.push(`CRITICAL: Deploy emergency staff allocation during peak hours (${patterns.peakDay || 'identified peak days'})`);
      } else if (trends.waitTimeTrend > 0) {
        recommendations.push(`Deploy additional staff during peak hours - trend shows ${trends.waitTimeTrend}% increase over ${timeContext.period}`);
        recommendations.push(`Implement appointment scheduling system to better distribute client load across ${timeContext.period}`);
      } else {
        recommendations.push(`Deploy additional staff during peak hours to reduce wait times (stable but high)`);
        recommendations.push(`Implement appointment scheduling system to better distribute client load`);
      }
    } else if (avgWaitTime < 10) {
      if (trends.waitTimeTrend < -5) {
        recommendations.push(`EXCELLENT: Maintain current practices - wait times improving by ${Math.abs(trends.waitTimeTrend)}% over ${timeContext.period}`);
        recommendations.push(`Share best practices with other departments - ${timeContext.period} performance is exemplary`);
      } else {
        recommendations.push(`Maintain current staffing levels - excellent performance for ${timeContext.period}`);
        recommendations.push(`Consider expanding services or taking on additional responsibilities`);
      }
    } else {
      if (trends.waitTimeTrend > 5) {
        recommendations.push(`Monitor closely - wait times increasing by ${trends.waitTimeTrend}% over ${timeContext.period}, consider preventive measures`);
        recommendations.push(`Implement early warning system for queue management`);
      } else if (trends.waitTimeTrend < -5) {
        recommendations.push(`Good progress - wait times improving by ${Math.abs(trends.waitTimeTrend)}% over ${timeContext.period}, continue current initiatives`);
        recommendations.push(`Consider expanding successful optimization strategies`);
      } else {
        recommendations.push(`Monitor queue patterns to identify peak hours and adjust staffing accordingly for ${timeContext.period}`);
        recommendations.push(`Implement process improvements to optimize current performance`);
      }
    }

    // Abandonment rate recommendations with trend awareness (1-2 per category)
    if (abandonmentRate > 10) {
      if (trends.abandonmentTrend > 5) {
        recommendations.push(`CRITICAL: Abandonment rate increasing by ${trends.abandonmentTrend}% - implement emergency client retention measures`);
        recommendations.push(`URGENT: Deploy mobile queue management with real-time updates to reduce client frustration`);
      } else {
        recommendations.push(`URGENT: Implement comprehensive client retention strategy for ${timeContext.period}`);
        recommendations.push(`Deploy SMS notifications with estimated wait times and queue position updates`);
      }
    } else if (abandonmentRate < 3) {
      if (trends.abandonmentTrend < -2) {
        recommendations.push(`EXCELLENT: Client satisfaction improving by ${Math.abs(trends.abandonmentTrend)}% - maintain current service quality`);
        recommendations.push(`Document client satisfaction strategies for ${timeContext.period} success`);
      } else {
        recommendations.push(`Maintain current client service standards - excellent satisfaction for ${timeContext.period}`);
        recommendations.push(`Consider expanding service hours or capacity based on high demand`);
      }
    } else {
      if (trends.abandonmentTrend > 3) {
        recommendations.push(`Monitor client satisfaction - abandonment rate increasing by ${trends.abandonmentTrend}% over ${timeContext.period}`);
        recommendations.push(`Implement client feedback system to identify specific concerns`);
      } else if (trends.abandonmentTrend < -2) {
        recommendations.push(`Good progress - client satisfaction improving by ${Math.abs(trends.abandonmentTrend)}% over ${timeContext.period}`);
        recommendations.push(`Continue current client service initiatives`);
      } else {
        recommendations.push(`Implement client feedback system to identify specific pain points for ${timeContext.period}`);
        recommendations.push(`Introduce estimated wait time display to set proper expectations`);
      }
    }

    // Volume-based recommendations with trend awareness (1-2 per category)
    if (totalTransactions > 3000) {
      if (trends.transactionTrend > 15) {
        recommendations.push(`HIGH DEMAND: Transaction volume increasing by ${trends.transactionTrend}% - prepare for capacity expansion`);
        recommendations.push(`URGENT: Implement online pre-filing forms to handle growing ${timeContext.period} demand`);
      } else if (trends.transactionTrend > 5) {
        recommendations.push(`Growing demand: Transaction volume up ${trends.transactionTrend}% over ${timeContext.period} - ensure adequate capacity`);
        recommendations.push(`Implement online pre-filing forms to reduce in-person service time`);
      } else {
        recommendations.push(`High volume department - maintain robust staffing and efficient processes for ${timeContext.period}`);
        recommendations.push(`Consider implementing online pre-filing forms to reduce in-person service time`);
      }
    } else if (totalTransactions < 1000) {
      if (trends.transactionTrend < -10) {
        recommendations.push(`DECLINING: Transaction volume decreasing by ${Math.abs(trends.transactionTrend)}% - investigate demand factors`);
        recommendations.push(`Analyze service accessibility and marketing strategies for ${timeContext.period}`);
      } else if (trends.transactionTrend < -5) {
        recommendations.push(`Monitor demand - transaction volume declining by ${Math.abs(trends.transactionTrend)}% over ${timeContext.period}`);
        recommendations.push(`Assess service accessibility and client awareness`);
      } else {
        recommendations.push(`Moderate volume allows for focused client attention - maintain service quality`);
        recommendations.push(`Consider expanding services or taking on additional responsibilities`);
      }
    } else {
      if (trends.transactionTrend > 10) {
        recommendations.push(`Growing demand: Transaction volume up ${trends.transactionTrend}% over ${timeContext.period} - prepare for higher demand`);
        recommendations.push(`Implement scalable processes and technology solutions`);
      } else if (trends.transactionTrend < -5) {
        recommendations.push(`Monitor demand patterns - volume declining by ${Math.abs(trends.transactionTrend)}% over ${timeContext.period}`);
        recommendations.push(`Assess service accessibility and client satisfaction`);
      } else {
        recommendations.push(`Stable demand - maintain current service levels and focus on efficiency`);
        recommendations.push(`Consider process improvements and technology upgrades`);
      }
    }

    // Time-period specific recommendations (3-5 per period)
    if (timePeriod === 'month') {
      recommendations.push(`Monthly planning: Analyze weekly patterns (${patterns.weeklyPattern}) for staffing optimization`);
      recommendations.push(`Week-to-week adjustments: Implement flexible staffing based on ${timeContext.period} demand patterns`);
      recommendations.push(`Short-term process improvements: Focus on immediate operational efficiency gains`);
    } else if (timePeriod === '6months') {
      recommendations.push(`Six-month strategic planning: Address seasonal variations (${patterns.seasonalPattern}) in staffing and processes`);
      recommendations.push(`Mid-year review: Evaluate ${timeContext.period} performance against annual goals and adjust strategies`);
      recommendations.push(`Seasonal preparation: Plan for upcoming demand changes based on historical patterns`);
      recommendations.push(`Resource allocation: Adjust staffing and equipment based on mid-year performance trends`);
    } else if (timePeriod === 'year') {
      recommendations.push(`Annual strategic planning: Use ${timeContext.period} data for long-term capacity and technology planning`);
      recommendations.push(`Year-end evaluation: Assess ${timeContext.period} performance for next year's budget and resource allocation`);
      recommendations.push(`Long-term investment: Plan major infrastructure and technology upgrades based on annual trends`);
      recommendations.push(`Policy development: Create operational policies based on year-long performance patterns`);
      recommendations.push(`Goal setting: Establish next year's targets based on current year's achievements and challenges`);
    }

    // Add 1-2 general technology recommendations (total 3-5 per period)
    recommendations.push(`Implement digital queue management with mobile app integration for ${timeContext.period} efficiency`);
    if (timePeriod === 'year') {
      recommendations.push(`Establish performance monitoring dashboard for real-time ${timeContext.period} insights`);
    }

    return recommendations;
  }

  // Get time period context for recommendations
  getTimePeriodContext(timePeriod) {
    const contexts = {
      'day': { period: 'today', scope: 'daily operations' },
      'week': { period: 'this week', scope: 'weekly planning' },
      'month': { period: 'this month', scope: 'monthly operations' },
      '6months': { period: 'the past 6 months', scope: 'semi-annual planning' },
      'year': { period: 'this year', scope: 'annual strategic planning' }
    };
    return contexts[timePeriod] || { period: 'the selected period', scope: 'operational planning' };
  }

  // Get peak performance day
  getPeakPerformanceDay(transactions) {
    if (!transactions || transactions.length === 0) return 'N/A';
    
    const peakDay = transactions.reduce((max, current) => 
      (current.count || 0) > (max.count || 0) ? current : max
    );
    
    return peakDay.date || 'N/A';
  }

  // Get worst performance day (highest wait time)
  getWorstPerformanceDay(waitTimes) {
    if (!waitTimes || waitTimes.length === 0) return 'N/A';
    
    const worstDay = waitTimes.reduce((max, current) => 
      (current.average_wait || 0) > (max.average_wait || 0) ? current : max
    );
    
    return worstDay.date || 'N/A';
  }

  // Get period description
  getPeriodDescription(timePeriod) {
    const periods = {
      'day': 'Today',
      'week': 'Last 7 Days',
      'month': 'Last 30 Days',
      '6months': 'Last 6 Months',
      'year': 'Last 12 Months'
    };
    return periods[timePeriod] || 'Selected Period';
  }

  // Convert report data to CSV format
  convertToCSV(reportData) {
    const csvRows = [];

    // Header section
    csvRows.push('CABUYAO CITY HALL - QUEUING MANAGEMENT SYSTEM ANALYTICS REPORT');
    csvRows.push('');
    csvRows.push(`Department: ${reportData.header.department}`);
    csvRows.push(`Period: ${reportData.header.period}`);
    csvRows.push(`Report Date: ${reportData.header.reportDate}`);
    csvRows.push('');

    // Executive Summary
    csvRows.push('EXECUTIVE SUMMARY');
    csvRows.push('================');
    csvRows.push(`Total Client Transactions: ${reportData.executiveSummary.totalTransactions}`);
    csvRows.push(`Average Wait Time: ${reportData.executiveSummary.avgWaitTime} minutes`);
    csvRows.push(`Average Service Time: ${reportData.executiveSummary.avgServiceTime} minutes`);
    csvRows.push(`Abandonment Rate: ${reportData.executiveSummary.abandonmentRate}%`);
    csvRows.push(`Peak Performance Day: ${reportData.executiveSummary.peakDay}`);
    csvRows.push(`Worst Performance Day: ${reportData.executiveSummary.worstDay}`);
    csvRows.push('');

    // Key Performance Indicators
    csvRows.push('KEY PERFORMANCE INDICATORS (KPIs)');
    csvRows.push('=================================');
    csvRows.push('Department,Clients Served,Avg Wait Time (mins),Avg Service Time (mins),Abandonment Rate (%)');
    csvRows.push(`${reportData.kpis.department},${reportData.kpis.clientsServed},${reportData.kpis.avgWaitTime},${reportData.kpis.avgServiceTime},${reportData.kpis.abandonmentRate}`);
    csvRows.push('');

    // Insights & Analysis
    csvRows.push('INSIGHTS & ANALYSIS');
    csvRows.push('==================');
    reportData.insights.forEach((insight, index) => {
      csvRows.push(`${index + 1}. ${insight}`);
    });
    csvRows.push('');

    // Recommendations
    csvRows.push('RECOMMENDATIONS');
    csvRows.push('===============');
    reportData.recommendations.forEach((recommendation, index) => {
      csvRows.push(`${index + 1}. ${recommendation}`);
    });
    csvRows.push('');

    // Detailed Data Analysis
    csvRows.push('DETAILED DATA ANALYSIS');
    csvRows.push('======================');
    
    // Transaction trends
    if (reportData.rawData.transactions && reportData.rawData.transactions.length > 0) {
      csvRows.push('Daily Transaction Count:');
      csvRows.push('Date,Transaction Count');
      reportData.rawData.transactions.forEach(item => {
        csvRows.push(`${item.date},${item.count || 0}`);
      });
      csvRows.push('');
    }

    // Wait time trends
    if (reportData.rawData.wait_times && reportData.rawData.wait_times.length > 0) {
      csvRows.push('Daily Average Wait Times:');
      csvRows.push('Date,Average Wait Time (minutes)');
      reportData.rawData.wait_times.forEach(item => {
        csvRows.push(`${item.date},${item.average_wait || 0}`);
      });
      csvRows.push('');
    }

    // Cancellation analysis
    if (reportData.rawData.cancellation_reasons && reportData.rawData.cancellation_reasons.length > 0) {
      csvRows.push('Cancellation Reasons Analysis:');
      csvRows.push('Reason,Count,Percentage');
      reportData.rawData.cancellation_reasons.forEach(item => {
        csvRows.push(`${item.reason},${item.count || 0},${item.percentage || 0}%`);
      });
      csvRows.push('');
    }

    // Kiosk usage
    if (reportData.rawData.kiosk_usage) {
      csvRows.push('Kiosk Usage Statistics:');
      csvRows.push('Platform,Usage Count');
      csvRows.push(`Web Kiosk,${reportData.rawData.kiosk_usage.web || 0}`);
      csvRows.push(`Physical Kiosk,${reportData.rawData.kiosk_usage.physical || 0}`);
      csvRows.push('');
    }

    // System Performance Summary
    csvRows.push('SYSTEM PERFORMANCE SUMMARY');
    csvRows.push('==========================');
    csvRows.push(`Overall Efficiency: ${reportData.executiveSummary.abandonmentRate < 5 ? 'Excellent' : reportData.executiveSummary.abandonmentRate < 10 ? 'Good' : 'Needs Improvement'}`);
    csvRows.push(`Service Quality: ${reportData.executiveSummary.avgWaitTime < 15 ? 'Excellent' : reportData.executiveSummary.avgWaitTime < 25 ? 'Good' : 'Needs Improvement'}`);
    csvRows.push(`Client Satisfaction: ${reportData.executiveSummary.abandonmentRate < 3 ? 'High' : reportData.executiveSummary.abandonmentRate < 7 ? 'Moderate' : 'Low'}`);
    csvRows.push('');

    return csvRows.join('\n');
  }

  // Download CSV file
  downloadCSV(csvContent, filename) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', filename);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  }

  // Main method to generate and download CSV report
  async generateAndDownloadReport(departmentId, departmentName, timePeriod, selectedTransaction = null) {
    try {
      const reportData = await this.generateAnalyticsReport(departmentId, departmentName, timePeriod, selectedTransaction);
      const csvContent = this.convertToCSV(reportData);
      
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `${departmentName.replace(/\s+/g, '_')}_Analytics_Report_${timestamp}.csv`;
      
      this.downloadCSV(csvContent, filename);
      
      return { success: true, filename };
    } catch (error) {
      console.error('Error generating CSV report:', error);
      throw error;
    }
  }
}

export default new CSVReportService();
