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

const EmployeeDashboard = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [todayAttendance, setTodayAttendance] = useState<any>(null);
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

      const [userData, attendance] = await Promise.all([
        AuthService.getCurrentUser(),
        AttendanceService.getTodayAttendance().catch((err) => {
          console.log('No attendance record for today:', err.message);
          return null;
        }),
      ]);
      
      setUser(userData);
      setTodayAttendance(attendance);
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

      const result = await AttendanceService.checkIn(
        location.coords.latitude,
        location.coords.longitude,
        location.coords.accuracy
      );

      Alert.alert('Success', 'Checked in successfully!');
      await loadData();
    } catch (error: any) {
      console.error('Check-in error:', error);
      Alert.alert('Check-in Failed', error.response?.data?.error || error.message || 'Failed to check in');
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

      Alert.alert('Success', 'Checked out successfully!');
      await loadData();
    } catch (error: any) {
      console.error('Check-out error:', error);
      Alert.alert('Check-out Failed', error.response?.data?.error || error.message || 'Failed to check out');
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
        <Text style={styles.statusTitle}>Today's Status</Text>
        <View style={styles.statusRow}>
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Check In</Text>
            <Text style={[styles.statusValue, isCheckedIn && styles.activeStatus]}>
              {formatTime(todayAttendance?.checkInTime)}
            </Text>
          </View>
          <View style={styles.statusDivider} />
          <View style={styles.statusItem}>
            <Text style={styles.statusLabel}>Check Out</Text>
            <Text style={[styles.statusValue, isCheckedOut && styles.completedStatus]}>
              {formatTime(todayAttendance?.checkOutTime)}
            </Text>
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

      {/* Quick Stats */}
      <View style={styles.quickStats}>
        <Text style={styles.sectionTitle}>Quick Info</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Status</Text>
            <Text style={[styles.statValue, isCheckedIn && styles.activeText]}>
              {isCheckedOut ? 'Completed' : isCheckedIn ? 'Working' : 'Not Started'}
            </Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Role</Text>
            <Text style={styles.statValue}>{user?.role || 'N/A'}</Text>
          </View>
        </View>
        <TouchableOpacity
          style={{ marginTop: 20, backgroundColor: '#FF9800', padding: 14, borderRadius: 10, alignItems: 'center' }}
          onPress={() => navigation.navigate('LeaveApplication')}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Apply for Leave</Text>
        </TouchableOpacity>
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
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
    color: '#333',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
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
