import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../services/AuthService';
import { ApiService } from '../../services/ApiService';

const ManagerDashboard = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [teamData, setTeamData] = useState<any>(null);
  const [teamLocations, setTeamLocations] = useState<any[]>([]);
  const [teamStatus, setTeamStatus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

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
      const [userData, locations, status] = await Promise.all([
        AuthService.getCurrentUser(),
        ApiService.getTeamLocations().catch(() => []),
        ApiService.getTeamCurrentStatus().catch(() => []),
      ]);
      
      setUser(userData);
      setTeamLocations(locations || []);
      setTeamStatus(status || []);
      
      // Calculate team statistics from current status
      calculateTeamStats(status || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Session expired. Please login again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateTeamStats = (status: any[]) => {
    const stats = {
      totalMembers: status.length,
      checkedIn: status.filter(s => s.status === 'CHECKED_IN').length,
      checkedOut: status.filter(s => s.status === 'CHECKED_OUT').length,
      absent: status.filter(s => s.status === 'ABSENT').length,
    };
    setTeamData(stats);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatTime = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
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
        <Text style={styles.userName}>{user?.firstName || 'Manager'}</Text>
        <Text style={styles.role}>Team Manager</Text>
        <Text style={styles.clock}>
          {currentTime.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit',
            hour12: true 
          })}
        </Text>
      </View>

      {/* Team Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>Team Overview</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statNumber}>{teamData?.totalMembers || 0}</Text>
            <Text style={styles.statLabel}>Total Members</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.statNumber}>{teamData?.checkedIn || 0}</Text>
            <Text style={styles.statLabel}>Checked In</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={styles.statNumber}>{teamData?.checkedOut || 0}</Text>
            <Text style={styles.statLabel}>Checked Out</Text>
          </View>
          <View style={[styles.statCard, styles.dangerCard]}>
            <Text style={styles.statNumber}>{teamData?.absent || 0}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
        </View>
      </View>

      {/* Team Members Current Status */}
      {teamStatus.length > 0 && (
        <View style={styles.teamStatusContainer}>
          <Text style={styles.sectionTitle}>Team Status (Today)</Text>
          {teamStatus.map((member: any, index: number) => (
            <View key={member.userId || index} style={styles.memberCard}>
              <View style={styles.memberInfo}>
                <Text style={styles.memberName}>
                  {member.firstName} {member.lastName}
                </Text>
                <Text style={styles.memberEmail}>{member.email}</Text>
              </View>
              <View style={styles.memberStatusContainer}>
                <View style={[
                  styles.statusBadge,
                  member.status === 'CHECKED_IN' && styles.statusCheckedIn,
                  member.status === 'CHECKED_OUT' && styles.statusCheckedOut,
                  member.status === 'ABSENT' && styles.statusAbsent,
                ]}>
                  <Text style={styles.statusBadgeText}>{member.status}</Text>
                </View>
                {member.checkInTime && (
                  <Text style={styles.timeText}>
                    In: {formatTime(member.checkInTime)}
                  </Text>
                )}
                {member.checkOutTime && (
                  <Text style={styles.timeText}>
                    Out: {formatTime(member.checkOutTime)}
                  </Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('TeamAttendance')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Team Attendance</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('LeaveApproval')}
          >
            <Text style={styles.actionIcon}>✅</Text>
            <Text style={styles.actionText}>Approve Leaves</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionIcon}>📈</Text>
            <Text style={styles.actionText}>View Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Geofences')}
          >
            <Text style={styles.actionIcon}>🗺️</Text>
            <Text style={styles.actionText}>Geofences</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('ManagerSalary')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Salary Management</Text>
          </TouchableOpacity>
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
    backgroundColor: '#FF9800',
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
  role: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  clock: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
    marginTop: 10,
  },
  statsContainer: {
    padding: 20,
    paddingTop: 10,
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
    marginBottom: 15,
  },
  statCard: {
    flex: 1,
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryCard: {
    backgroundColor: '#2196F3',
  },
  successCard: {
    backgroundColor: '#4CAF50',
  },
  warningCard: {
    backgroundColor: '#FF9800',
  },
  dangerCard: {
    backgroundColor: '#F44336',
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
  },
  statLabel: {
    fontSize: 12,
    color: '#fff',
    opacity: 0.9,
    marginTop: 5,
  },
  actionsContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 15,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
  },
  teamListContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  memberCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  memberInfo: {
    flex: 1,
  },
  memberStatusContainer: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusBadgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusCheckedIn: {
    backgroundColor: '#4CAF50',
  },
  statusCheckedOut: {
    backgroundColor: '#2196F3',
  },
  statusAbsent: {
    backgroundColor: '#F44336',
  },
  timeText: {
    fontSize: 11,
    color: '#666',
  },
  teamStatusContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#999',
  },
  memberDetails: {
    flex: 1,
  },
  memberName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  memberEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  memberStatus: {
    fontSize: 12,
    color: '#999',
  },
  emptyState: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
});

export default ManagerDashboard;
