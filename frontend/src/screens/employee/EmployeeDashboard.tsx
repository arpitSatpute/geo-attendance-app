import React, { useState, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import { AuthService } from '../../services/AuthService';
import { AttendanceService } from '../../services/AttendanceService';
import { ApiService } from '../../services/ApiService';

const EmployeeDashboard = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
  const [monthlyStats, setMonthlyStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState<any>(null);

  useEffect(() => {
    loadData();
    
    // Update clock every second
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // First verify we have a valid token
      const token = await AuthService.getToken();
      if (!token) {
        console.log('No auth token found');
        return;
      }

      // Verify token is still valid
      const isAuth = await AuthService.isAuthenticated();
      if (!isAuth) {
        console.log('Token expired or invalid');
        return;
      }

      // Calculate date range for monthly stats
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      const startDate = startOfMonth.toISOString().split('T')[0];
      const endDate = endOfMonth.toISOString().split('T')[0];

      // Fetch fresh user data from API (not from cache)
      const [userDataFromApi, attendance, stats] = await Promise.all([
        ApiService.getCurrentUser(),
        AttendanceService.getTodayAttendance().catch((err) => {
          console.log('No attendance record for today:', err.message);
          return null;
        }),
        AttendanceService.getStatistics(startDate, endDate).catch((err) => {
          console.log('No stats available:', err.message);
          return null;
        }),
      ]);
      
      console.log('Loaded user:', userDataFromApi?.name);
      console.log('Loaded attendance:', JSON.stringify(attendance, null, 2));
      console.log('Loaded stats:', JSON.stringify(stats, null, 2));
      
      setUser(userDataFromApi);
      setTodayAttendance(attendance);
      setMonthlyStats(stats);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        console.log('Authentication failed - user may need to login again');
      }
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for attendance');
        return null;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      
      setLocation(location);
      return location;
    } catch (error) {
      console.error('Error getting location:', error);
      Alert.alert('Error', 'Failed to get current location');
      return null;
    }
  };

  const handleCheckIn = async () => {
    try {
      setActionLoading(true);
      const location = await getCurrentLocation();
      
      if (!location) {
        return;
      }

      console.log('Calling check-in API...');
      const result = await AttendanceService.checkIn(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy
      );

      console.log('Check-in result:', JSON.stringify(result, null, 2));
      
      // Immediately update the state with the new check-in data
      if (result) {
        console.log('Updating todayAttendance state with:', result);
        setTodayAttendance(result);
      }
      
      Alert.alert('Success', 'Checked in successfully!');
      // Reload data to ensure everything is in sync
      console.log('Reloading data...');
      await loadData();
    } catch (error: any) {
      console.error('Check-in error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to check in';
      Alert.alert('Check-in Failed', errorMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleCheckOut = async () => {
    try {
      setActionLoading(true);
      const location = await getCurrentLocation();
      
      if (!location) {
        return;
      }

      const result = await AttendanceService.checkOut(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy
      );

      // Immediately update the state with the new check-out data
      if (result) {
        setTodayAttendance(result);
      }

      Alert.alert('Success', 'Checked out successfully!');
      // Reload data to ensure everything is in sync
      await loadData();
    } catch (error: any) {
      console.error('Check-out error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error || 
                          error.message || 
                          'Failed to check out';
      Alert.alert('Check-out Failed', errorMessage);
    } finally {
      setActionLoading(false);
    }
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

  const formatDuration = (checkInTime: string, checkOutTime?: string) => {
    if (!checkInTime) return '--';
    
    const start = new Date(checkInTime);
    const end = checkOutTime ? new Date(checkOutTime) : new Date();
    const diff = Math.floor((end.getTime() - start.getTime()) / 1000 / 60); // minutes
    
    const hours = Math.floor(diff / 60);
    const minutes = diff % 60;
    
    return `${hours}h ${minutes}m`;
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const isCheckedIn = todayAttendance?.checkInTime && !todayAttendance?.checkOutTime;
  const isCheckedOut = todayAttendance?.checkInTime && todayAttendance?.checkOutTime;

  // Debug logging
  console.log('Dashboard State:', {
    hasAttendance: !!todayAttendance,
    checkInTime: todayAttendance?.checkInTime,
    checkOutTime: todayAttendance?.checkOutTime,
    isCheckedIn,
    isCheckedOut
  });

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <Text style={styles.greeting}>{getGreeting()},</Text>
        <Text style={styles.userName}>{user?.firstName || 'Employee'}</Text>
        <Text style={styles.dateTime}>
          {currentTime.toLocaleDateString('en-US', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}
        </Text>
        <Text style={styles.clock}>
          {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
          })}
        </Text>
      </View>

      {/* Status Card */}
      <View style={styles.statusCard}>
        <View style={styles.statusHeader}>
          <Text style={styles.statusTitle}>Today's Status</Text>
          <Text style={styles.statusDate}>{currentTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        </View>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Check In</Text>
            <Text style={[styles.statusValue, isCheckedIn && styles.activeStatus]}>
              {formatTime(todayAttendance?.checkInTime)}
            </Text>
            {todayAttendance?.checkInTime && (
              <Text style={styles.statusSubtext}>
                {new Date(todayAttendance.checkInTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Check Out</Text>
            <Text style={[styles.statusValue, isCheckedOut && styles.completedStatus]}>
              {formatTime(todayAttendance?.checkOutTime)}
            </Text>
            {todayAttendance?.checkOutTime && (
              <Text style={styles.statusSubtext}>
                {new Date(todayAttendance.checkOutTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
              </Text>
            )}
          </View>
        </View>
        
        {isCheckedIn && (
          <View style={styles.workingTimeContainer}>
            <Text style={styles.workingTimeLabel}>Working Time</Text>
            <Text style={styles.workingTimeValue}>
              {formatDuration(todayAttendance?.checkInTime)}
            </Text>
          </View>
        )}
        
        {isCheckedOut && (
          <View style={styles.completedContainer}>
            <Text style={styles.completedLabel}>Total Working Time</Text>
            <Text style={styles.completedValue}>
              {formatDuration(todayAttendance?.checkInTime, todayAttendance?.checkOutTime)}
            </Text>
          </View>
        )}
        
        {todayAttendance && (
          <View style={styles.attendanceInfo}>
            <Text style={styles.attendanceInfoText}>
              Status: {todayAttendance.status || 'CHECKED_IN'}
            </Text>
            {todayAttendance.checkInLatitude && todayAttendance.checkInLongitude && (
              <Text style={styles.attendanceInfoText}>
                Check-in Location: {todayAttendance.checkInLatitude.toFixed(6)}, {todayAttendance.checkInLongitude.toFixed(6)}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        {!isCheckedIn && !isCheckedOut && (
          <TouchableOpacity
            style={[styles.actionButton, styles.checkInButton]}
            onPress={handleCheckIn}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionButtonText}>Check In</Text>
                <Text style={styles.actionButtonSubtext}>Start your workday</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isCheckedIn && (
          <TouchableOpacity
            style={[styles.actionButton, styles.checkOutButton]}
            onPress={handleCheckOut}
            disabled={actionLoading}
          >
            {actionLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Text style={styles.actionButtonText}>Check Out</Text>
                <Text style={styles.actionButtonSubtext}>End your workday</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {isCheckedOut && (
          <View style={styles.completedBadge}>
            <Text style={styles.completedBadgeText}>✓ Attendance Completed</Text>
          </View>
        )}
      </View>

      {/* Location Info */}
      {location && (
        <View style={styles.locationCard}>
          <Text style={styles.locationTitle}>Current Location</Text>
          <Text style={styles.locationText}>
            Lat: {location.coords.latitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Long: {location.coords.longitude.toFixed(6)}
          </Text>
          <Text style={styles.locationText}>
            Accuracy: ±{Math.round(location.coords.accuracy)}m
          </Text>
        </View>
      )}

      {/* Monthly Stats */}
      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>Monthly Attendance ({new Date().toLocaleDateString('en-US', { month: 'long' })})</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statCardInner, styles.statCardPresent]}>
              <Text style={styles.statNumber}>{monthlyStats?.presentDays || 0}</Text>
              <Text style={styles.statLabel}>Present Days</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statCardInner, styles.statCardAbsent]}>
              <Text style={styles.statNumber}>{monthlyStats?.absentDays || 0}</Text>
              <Text style={styles.statLabel}>Absent Days</Text>
            </View>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={[styles.statCardInner, styles.statCardLate]}>
              <Text style={styles.statNumber}>{monthlyStats?.lateDays || 0}</Text>
              <Text style={styles.statLabel}>Late Days</Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={[styles.statCardInner, styles.statCardPercent]}>
              <Text style={styles.statNumber}>{(monthlyStats?.attendancePercentage || 0).toFixed(0)}%</Text>
              <Text style={styles.statLabel}>Attendance</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Info */}
      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>Quick Info</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statLabel}>Status</Text>
              <Text style={[styles.statValue, isCheckedIn && styles.activeText]}>
                {isCheckedOut ? 'Completed' : isCheckedIn ? 'Working' : 'Not Started'}
              </Text>
            </View>
          </View>
          <View style={styles.statCard}>
            <View style={styles.statCardInner}>
              <Text style={styles.statLabel}>Role</Text>
              <Text style={styles.statValue}>{user?.role || 'N/A'}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Team & Manager Info */}
      <View style={styles.teamInfoSection}>
        <Text style={styles.sectionTitle}>Team & Manager</Text>
        <View style={styles.teamInfoCard}>
          {user?.team && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Team:</Text>
                <Text style={styles.infoValue}>{user.team.name}</Text>
              </View>
              <View style={styles.infoDivider} />
            </>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{user?.department || 'Not Assigned'}</Text>
          </View>
          {user?.manager && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Manager:</Text>
                <Text style={styles.infoValue}>
                  {user.manager.firstName} {user.manager.lastName}
                </Text>
              </View>
              {user.manager.email && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Email:</Text>
                  <Text style={[styles.infoValue, styles.emailText]}>{user.manager.email}</Text>
                </View>
              )}
              {user.manager.phone && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{user.manager.phone}</Text>
                </View>
              )}
            </>
          )}
          {!user?.manager && (
            <>
              <View style={styles.infoDivider} />
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Manager:</Text>
                <Text style={styles.infoValue}>Not Assigned</Text>
              </View>
            </>
          )}
        </View>
      </View>

      {/* Leave Management Section */}
      <View style={styles.leaveSection}>
        <Text style={styles.sectionTitle}>Leave Management</Text>
        <View style={styles.leaveButtonsGrid}>
          <View style={styles.leaveActionButton}>
            <TouchableOpacity
              style={styles.leaveActionButtonInner}
              onPress={() => navigation.navigate('LeaveApplication')}
            >
              <Text style={styles.leaveActionText}>Apply Leave</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.leaveActionButton}>
            <TouchableOpacity
              style={styles.leaveActionButtonInner}
              onPress={() => navigation.navigate('LeaveHistory')}
            >
              <Text style={styles.leaveActionText}>Leave History</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Salary Section */}
      <View style={styles.leaveSection}>
        <Text style={styles.sectionTitle}>Salary & Payments</Text>
        <View style={styles.leaveButtonsGrid}>
          <View style={styles.leaveActionButton}>
            <TouchableOpacity
              style={[styles.leaveActionButtonInner, styles.salaryButton]}
              onPress={() => navigation.navigate('EmployeeSalary')}
            >
              <Text style={styles.leaveActionText}>View My Salary</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
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
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 10,
    paddingBottom: 30,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  greeting: {
    fontSize: 16,
    color: '#fff',
    opacity: 0.9,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginTop: 5,
  },
  dateTime: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 10,
  },
  clock: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    marginTop: 5,
  },
  statusCard: {
    backgroundColor: '#fff',
    margin: 20,
    marginTop: -20,
    padding: 20,
    borderRadius: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  statusDate: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  statusSubtext: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
  },
  attendanceInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attendanceInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statusItem: {
    flex: 1,
    alignItems: 'center',
  },
  statusDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#e0e0e0',
  },
  statusLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statusValue: {
    fontSize: 20,
    fontWeight: '600',
    color: '#999',
  },
  activeStatus: {
    color: '#4CAF50',
  },
  completedStatus: {
    color: '#007AFF',
  },
  activeText: {
    color: '#4CAF50',
  },
  workingTimeContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  workingTimeLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  workingTimeValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  completedContainer: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  completedLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  completedValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#007AFF',
  },
  attendanceInfo: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  attendanceInfoText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  actionContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionButton: {
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  checkInButton: {
    backgroundColor: '#4CAF50',
  },
  checkOutButton: {
    backgroundColor: '#FF5722',
  },
  actionButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  actionButtonSubtext: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  completedBadge: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  completedBadgeText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4CAF50',
  },
  locationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 20,
    marginBottom: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
  locationText: {
    fontSize: 12,
    color: '#666',
    marginBottom: 3,
  },
  quickStats: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -7.5,
  },
  statCard: {
    width: '50%',
    paddingHorizontal: 7.5,
    marginBottom: 15,
  },
  statCardInner: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    minHeight: 80,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardPresent: {
    backgroundColor: '#E8F5E9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  statCardAbsent: {
    backgroundColor: '#FFEBEE',
    borderWidth: 1,
    borderColor: '#F44336',
  },
  statCardLate: {
    backgroundColor: '#FFF3E0',
    borderWidth: 1,
    borderColor: '#FF9800',
  },
  statCardPercent: {
    backgroundColor: '#E3F2FD',
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  teamInfoSection: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  teamInfoCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  infoRow: {
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    minWidth: 90,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
    flex: 1,
    flexShrink: 1,
  },
  emailText: {
    color: '#2196F3',
  },
  infoDivider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 8,
  },
  leaveSection: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  leaveButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -7.5,
  },
  leaveActionButton: {
    width: '50%',
    paddingHorizontal: 7.5,
    marginBottom: 15,
  },
  leaveActionButtonInner: {
    backgroundColor: '#fff',
    padding: 14,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ddd',
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  leaveActionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  salaryButton: {
    borderColor: '#4CAF50',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 5,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default EmployeeDashboard;
