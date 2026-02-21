import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { PieChart, LineChart } from 'react-native-chart-kit';
import { AttendanceService } from '../../services/AttendanceService';

const AttendanceHistoryScreen = () => {
  const [history, setHistory] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    loadHistory();
  }, [selectedMonth, selectedYear]);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);

      const [records, stats] = await Promise.all([
        AttendanceService.getAttendanceHistory(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ).catch(() => []),
        AttendanceService.getStatistics(
          startDate.toISOString().split('T')[0],
          endDate.toISOString().split('T')[0]
        ).catch(() => null)
      ]);

      setHistory(records || []);
      setMonthlyStats(stats);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const calculateDuration = (checkIn: string, checkOut?: string) => {
    if (!checkIn) return '--';
    const start = new Date(checkIn);
    const end = checkOut ? new Date(checkOut) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);

    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const getMonthName = () => {
    return new Date(selectedYear, selectedMonth).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric'
    });
  };

  const goToPreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  const totalDays = history.length;
  const totalHours = history.reduce((sum, record) => {
    if (record.checkInTime && record.checkOutTime) {
      // Ensure proper date parsing - backend sends LocalDateTime like "2026-02-21T09:00:00"
      const checkIn = record.checkInTime.includes('Z') || record.checkInTime.includes('+')
        ? record.checkInTime : record.checkInTime + 'Z';
      const checkOut = record.checkOutTime.includes('Z') || record.checkOutTime.includes('+')
        ? record.checkOutTime : record.checkOutTime + 'Z';
      const start = new Date(checkIn);
      const end = new Date(checkOut);
      if (!isNaN(start.getTime()) && !isNaN(end.getTime())) {
        const hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
        return sum + Math.max(0, hours);
      }
    }
    return sum;
  }, 0);

  const displayHours = Math.floor(totalHours);
  const displayMinutes = Math.round((totalHours - displayHours) * 60);

  const getChartData = () => {
    // Sort history chronologically
    const sortedHistory = [...history].sort((a, b) => {
      const dateA = new Date(a.date || a.checkInTime).getTime();
      const dateB = new Date(b.date || b.checkInTime).getTime();
      return dateA - dateB;
    });

    // Get up to the last 7 records
    const recentRecords = sortedHistory.slice(-7);

    if (recentRecords.length === 0) {
      return {
        labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        data: [0, 0, 0, 0, 0, 0, 0]
      };
    }

    const labels: string[] = [];
    const data: number[] = [];

    recentRecords.forEach(record => {
      const date = new Date(record.date || record.checkInTime);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));

      let hours = 0;
      if (record.checkInTime && record.checkOutTime) {
        const checkIn = record.checkInTime.includes('Z') || record.checkInTime.includes('+')
          ? record.checkInTime : record.checkInTime + 'Z';
        const checkOut = record.checkOutTime.includes('Z') || record.checkOutTime.includes('+')
          ? record.checkOutTime : record.checkOutTime + 'Z';
        const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
        if (!isNaN(diff)) {
          hours = Math.max(0, diff / 1000 / 3600);
        }
      }
      data.push(parseFloat(hours.toFixed(1)));
    });

    // Pad array if less than 7 days
    while (labels.length < 7) {
      labels.unshift('-');
      data.unshift(0);
    }

    return { labels, data };
  };

  const chartData = getChartData();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Month Selector */}
      <View style={styles.monthSelector}>
        <TouchableOpacity onPress={goToPreviousMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.monthText}>{getMonthName()}</Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.monthButton}>
          <Text style={styles.monthButtonText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{totalDays}</Text>
          <Text style={styles.summaryLabel}>Days Present</Text>
        </View>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryNumber}>{displayHours}h {displayMinutes}m</Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
        </View>
      </View>

      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Charts Section */}
        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Monthly Summary</Text>
          <PieChart
            data={[
              { name: 'Present', population: monthlyStats?.presentDays || 0, color: '#4CAF50', legendFontColor: '#7F7F7F' },
              { name: 'Absent', population: monthlyStats?.absentDays || 0, color: '#F44336', legendFontColor: '#7F7F7F' },
              { name: 'Late', population: monthlyStats?.lateDays || 0, color: '#FF9800', legendFontColor: '#7F7F7F' },
            ]}
            width={Dimensions.get('window').width - 40}
            height={180}
            chartConfig={{ color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})` }}
            accessor="population"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        </View>

        <View style={styles.chartCard}>
          <Text style={styles.chartTitle}>Attendance Trend (Last 7 Days)</Text>
          <LineChart
            data={{
              labels: chartData.labels,
              datasets: [{
                data: chartData.data
              }]
            }}
            width={Dimensions.get('window').width - 40}
            height={180}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(33, 150, 243, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: { r: '6', strokeWidth: '2', stroke: '#2196F3' }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        </View>

        <Text style={styles.listTitle}>Attendance Records</Text>
        {history.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No attendance records for this month</Text>
          </View>
        ) : (
          history.map((record, index) => (
            <View key={index} style={styles.recordCard}>
              <View style={styles.recordHeader}>
                <Text style={styles.recordDate}>{formatDate(record.date || record.checkInTime)}</Text>
                <View style={[
                  styles.statusBadge,
                  record.checkOutTime ? styles.statusComplete : styles.statusIncomplete
                ]}>
                  <Text style={styles.statusText}>
                    {record.checkOutTime ? 'Complete' : 'In Progress'}
                  </Text>
                </View>
              </View>

              <View style={styles.recordBody}>
                <View style={styles.timeRow}>
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Check In</Text>
                    <Text style={styles.timeValue}>{formatTime(record.checkInTime)}</Text>
                    {record.checkInTime && (
                      <Text style={styles.timeSubtext}>
                        {new Date(record.checkInTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Check Out</Text>
                    <Text style={styles.timeValue}>{formatTime(record.checkOutTime)}</Text>
                    {record.checkOutTime && (
                      <Text style={styles.timeSubtext}>
                        {new Date(record.checkOutTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                      </Text>
                    )}
                  </View>
                </View>

                <View style={styles.durationContainer}>
                  <Text style={styles.durationLabel}>Duration</Text>
                  <Text style={styles.durationValue}>
                    {calculateDuration(record.checkInTime, record.checkOutTime)}
                  </Text>
                </View>

                {(record.checkInLatitude || record.status) && (
                  <View style={styles.recordDetails}>
                    {record.status && (
                      <Text style={styles.detailText}>Status: {record.status}</Text>
                    )}
                    {record.checkInLatitude && record.checkInLongitude && (
                      <Text style={styles.detailText}>
                        Location: {record.checkInLatitude.toFixed(4)}, {record.checkInLongitude.toFixed(4)}
                      </Text>
                    )}
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View >
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  monthSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  monthButton: {
    padding: 10,
  },
  monthButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: '600',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    alignItems: 'center',
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  summaryContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  summaryLabel: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
    marginTop: 5,
  },
  recordCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusComplete: {
    backgroundColor: '#4CAF50',
  },
  statusIncomplete: {
    backgroundColor: '#FF9800',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  recordBody: {
    gap: 15,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeItem: {
    flex: 1,
    alignItems: 'center',
  },
  timeDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  timeLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  timeValue: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  timeSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  recordDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  detailText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  durationContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  durationLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  durationValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#007AFF',
  },
  emptyState: {
    padding: 60,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default AttendanceHistoryScreen;
