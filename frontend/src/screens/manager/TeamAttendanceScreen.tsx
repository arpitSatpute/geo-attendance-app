import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { ApiService } from '../../services/ApiService';

interface AttendanceRecord {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  checkInTime: string;
  checkOutTime?: string;
  checkInLatitude: number;
  checkInLongitude: number;
  status: string;
}

interface GroupedAttendance {
  [userId: string]: {
    userName: string;
    userEmail: string;
    records: AttendanceRecord[];
  };
}

const TeamAttendanceScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [attendance, setAttendance] = useState<GroupedAttendance>({});
  const [startDate, setStartDate] = useState<Date>(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)); // Last 7 days
  const [endDate, setEndDate] = useState<Date>(new Date());

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    try {
      setLoading(true);
      const start = startDate.toISOString().split('T')[0];
      const end = endDate.toISOString().split('T')[0];
      
      const records: AttendanceRecord[] = await ApiService.getTeamAttendance(start, end);
      
      // Group by user
      const grouped: GroupedAttendance = {};
      records.forEach((record: any) => {
        const userId = record.userId;
        if (!grouped[userId]) {
          grouped[userId] = {
            userName: record.userName || `User ${userId.substring(0, 8)}`,
            userEmail: record.userEmail || '',
            records: [],
          };
        }
        grouped[userId].records.push(record);
      });

      // Sort records by date for each user
      Object.values(grouped).forEach(user => {
        user.records.sort((a, b) => 
          new Date(b.checkInTime).getTime() - new Date(a.checkInTime).getTime()
        );
      });

      setAttendance(grouped);
    } catch (error: any) {
      console.error('Error loading team attendance:', error);
      Alert.alert('Error', 'Failed to load team attendance');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadAttendance();
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateDuration = (checkIn: string, checkOut?: string) => {
    if (!checkOut) return 'In Progress';
    const start = new Date(checkIn);
    const end = new Date(checkOut);
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60);
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    return `${hours}h ${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'CHECKED_IN':
        return '#4CAF50';
      case 'CHECKED_OUT':
        return '#2196F3';
      case 'ABSENT':
        return '#F44336';
      case 'LATE':
        return '#FF9800';
      default:
        return '#757575';
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
      </View>
    );
  }

  const userIds = Object.keys(attendance);

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Team Attendance</Text>
        <View style={styles.dateRange}>
          <Text style={styles.dateRangeText}>
            {formatDate(startDate.toISOString())} - {formatDate(endDate.toISOString())}
          </Text>
        </View>
      </View>

      {userIds.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No attendance records found</Text>
          <Text style={styles.emptySubtext}>
            Team members will appear here once they check in
          </Text>
        </View>
      ) : (
        <View style={styles.list}>
          {userIds.map(userId => {
            const user = attendance[userId];
            return (
              <View key={userId} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <Text style={styles.userName}>{user.userName}</Text>
                  <Text style={styles.recordCount}>{user.records.length} records</Text>
                </View>
                
                {user.records.map((record, index) => (
                  <View key={record.id || index} style={styles.recordCard}>
                    <View style={styles.recordHeader}>
                      <Text style={styles.recordDate}>{formatDate(record.checkInTime)}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: getStatusColor(record.status) }]}>
                        <Text style={styles.statusText}>{record.status}</Text>
                      </View>
                    </View>
                    
                    <View style={styles.recordRow}>
                      <View style={styles.recordItem}>
                        <Text style={styles.recordLabel}>Check In</Text>
                        <Text style={styles.recordValue}>{formatTime(record.checkInTime)}</Text>
                      </View>
                      <View style={styles.recordDivider} />
                      <View style={styles.recordItem}>
                        <Text style={styles.recordLabel}>Check Out</Text>
                        <Text style={styles.recordValue}>
                          {record.checkOutTime ? formatTime(record.checkOutTime) : '--:--'}
                        </Text>
                      </View>
                      <View style={styles.recordDivider} />
                      <View style={styles.recordItem}>
                        <Text style={styles.recordLabel}>Duration</Text>
                        <Text style={styles.recordValue}>
                          {calculateDuration(record.checkInTime, record.checkOutTime)}
                        </Text>
                      </View>
                    </View>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f5f5f5' 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  dateRange: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeText: {
    fontSize: 14,
    color: '#666',
  },
  list: { 
    padding: 16 
  },
  userCard: { 
    backgroundColor: '#fff', 
    borderRadius: 12, 
    marginBottom: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  userName: { 
    fontWeight: 'bold', 
    fontSize: 18, 
    color: '#2196F3',
  },
  recordCount: {
    fontSize: 14,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recordCard: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  recordDate: { 
    fontSize: 14, 
    fontWeight: '600',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recordRow: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  recordItem: {
    flex: 1,
    alignItems: 'center',
  },
  recordDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 8,
  },
  recordLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    marginTop: 60,
  },
  emptyText: { 
    fontSize: 18, 
    color: '#888', 
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#aaa',
    textAlign: 'center',
  },
});

export default TeamAttendanceScreen;
