import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { AttendanceService } from '../../services/AttendanceService';

const AttendanceHistoryScreen = () => {
  const [history, setHistory] = useState<any[]>([]);
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
      
      const records = await AttendanceService.getAttendanceHistory(
        startDate.toISOString().split('T')[0],
        endDate.toISOString().split('T')[0]
      ).catch(() => []);
      
      setHistory(records || []);
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
      const start = new Date(record.checkInTime);
      const end = new Date(record.checkOutTime);
      const hours = (end.getTime() - start.getTime()) / 1000 / 60 / 60;
      return sum + hours;
    }
    return sum;
  }, 0);

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
          <Text style={styles.summaryNumber}>{Math.round(totalHours)}h</Text>
          <Text style={styles.summaryLabel}>Total Hours</Text>
        </View>
      </View>

      {/* Attendance List */}
      <ScrollView
        style={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
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
                  </View>
                  <View style={styles.timeDivider} />
                  <View style={styles.timeItem}>
                    <Text style={styles.timeLabel}>Check Out</Text>
                    <Text style={styles.timeValue}>{formatTime(record.checkOutTime)}</Text>
                  </View>
                </View>
                
                <View style={styles.durationContainer}>
                  <Text style={styles.durationLabel}>Duration</Text>
                  <Text style={styles.durationValue}>
                    {calculateDuration(record.checkInTime, record.checkOutTime)}
                  </Text>
                </View>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
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
