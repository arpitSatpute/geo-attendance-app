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
  TextInput,
  Dimensions,
} from 'react-native';
import { PieChart, BarChart } from 'react-native-chart-kit';
import { useNavigation } from '@react-navigation/native';
import { AuthService } from '../../services/AuthService';
import { ApiService } from '../../services/ApiService';

const AdminDashboard = () => {
  const navigation = useNavigation<any>();
  const [user, setUser] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [geofences, setGeofences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState('');

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
      const [userData, allUsers, allGeofences] = await Promise.all([
        AuthService.getCurrentUser(),
        ApiService.getAllUsers().catch(() => []),
        ApiService.getAllGeofences().catch(() => []),
      ]);

      setUser(userData);
      setUsers(allUsers || []);
      setGeofences(allGeofences || []);
    } catch (error: any) {
      console.error('Error loading data:', error);
      if (error.response?.status === 401) {
        Alert.alert('Error', 'Session expired. Please login again.');
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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const handleDeleteUser = async (userId: number, userName: string) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${userName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.deleteUser(userId);
              Alert.alert('Success', 'User deleted successfully');
              loadData();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const filteredUsers = users.filter(u =>
    u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const userStats = {
    total: users.length,
    employees: users.filter(u => u.role === 'EMPLOYEE').length,
    managers: users.filter(u => u.role === 'MANAGER').length,
    admins: users.filter(u => u.role === 'ADMIN').length,
    active: users.filter(u => u.active).length,
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#F44336' };
      case 'MANAGER':
        return { backgroundColor: '#FF9800' };
      default:
        return { backgroundColor: '#2196F3' };
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#9C27B0" />
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
        <Text style={styles.headerUserName}>{user?.firstName || 'Admin'}</Text>
        <Text style={styles.role}>System Administrator</Text>
        <Text style={styles.clock}>
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
          })}
        </Text>
      </View>

      {/* System Statistics */}
      <View style={styles.statsContainer}>
        <Text style={styles.sectionTitle}>System Overview</Text>

        {/* Charts Section */}
        <View style={styles.chartsRow}>
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>User Roles</Text>
            <PieChart
              data={[
                { name: 'Employees', population: userStats.employees, color: '#2196F3', legendFontColor: '#7F7F7F' },
                { name: 'Managers', population: userStats.managers, color: '#FF9800', legendFontColor: '#7F7F7F' },
                { name: 'Admins', population: userStats.admins, color: '#F44336', legendFontColor: '#7F7F7F' },
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
        </View>

        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.primaryCard]}>
            <Text style={styles.statNumber}>{userStats.total}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={[styles.statCard, styles.successCard]}>
            <Text style={styles.statNumber}>{userStats.active}</Text>
            <Text style={styles.statLabel}>Active Users</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.infoCard]}>
            <Text style={styles.statNumber}>{userStats.employees}</Text>
            <Text style={styles.statLabel}>Employees</Text>
          </View>
          <View style={[styles.statCard, styles.warningCard]}>
            <Text style={styles.statNumber}>{userStats.managers}</Text>
            <Text style={styles.statLabel}>Managers</Text>
          </View>
        </View>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, styles.dangerCard]}>
            <Text style={styles.statNumber}>{userStats.admins}</Text>
            <Text style={styles.statLabel}>Admins</Text>
          </View>
          <View style={[styles.statCard, styles.secondaryCard]}>
            <Text style={styles.statNumber}>{geofences.length}</Text>
            <Text style={styles.statLabel}>Geofences</Text>
          </View>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('AddUser')}
          >
            <Text style={styles.actionIcon}>👤</Text>
            <Text style={styles.actionText}>Add User</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'System settings feature')}
          >
            <Text style={styles.actionIcon}>⚙️</Text>
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => navigation.navigate('Reports')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Reports</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Backup data feature')}
          >
            <Text style={styles.actionIcon}>💾</Text>
            <Text style={styles.actionText}>Backup</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* User Management */}
      <View style={styles.usersContainer}>
        <Text style={styles.sectionTitle}>User Management</Text>

        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          filteredUsers.slice(0, 5).map((u, index) => (
            <View key={index} style={styles.userCard}>
              <View style={styles.userInfo}>
                <View>
                  <Text style={styles.cardUserName}>
                    {u.firstName} {u.lastName}
                  </Text>
                  <Text style={styles.userEmail}>{u.email}</Text>
                  <View style={styles.userMeta}>
                    <View style={[styles.roleBadge, getRoleBadgeStyle(u.role)]}>
                      <Text style={styles.roleBadgeText}>{u.role}</Text>
                    </View>
                    <View style={[styles.statusBadge, u.active ? styles.statusActive : styles.statusInactive]}>
                      <Text style={styles.statusBadgeText}>
                        {u.active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
              <View style={styles.userActions}>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => navigation.navigate('AddUser')}
                >
                  <Text style={styles.iconButtonText}>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.iconButton}
                  onPress={() => handleDeleteUser(u.id, `${u.firstName} ${u.lastName}`)}
                >
                  <Text style={styles.iconButtonText}>🗑️</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Geofences Summary */}
      <View style={styles.geofencesContainer}>
        <Text style={styles.sectionTitle}>Geofences</Text>
        {geofences.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No geofences configured</Text>
          </View>
        ) : (
          geofences.slice(0, 3).map((g, index) => (
            <View key={index} style={styles.geofenceCard}>
              <View>
                <Text style={styles.geofenceName}>{g.name}</Text>
                <Text style={styles.geofenceDesc}>{g.description || 'No description'}</Text>
                <Text style={styles.geofenceRadius}>Radius: {g.radius}m</Text>
              </View>
            </View>
          ))
        )}
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
    backgroundColor: '#9C27B0',
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
  headerUserName: {
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
  chartsRow: {
    marginBottom: 20,
  },
  chartCard: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
    textAlign: 'center',
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
  infoCard: {
    backgroundColor: '#00BCD4',
  },
  secondaryCard: {
    backgroundColor: '#9C27B0',
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
  usersContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  searchInput: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  userCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  cardUserName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  userEmail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
  },
  userMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#999',
  },
  statusBadgeText: {
    fontSize: 11,
    color: '#fff',
    fontWeight: '600',
  },
  userActions: {
    flexDirection: 'row',
    gap: 8,
  },
  iconButton: {
    padding: 8,
  },
  iconButtonText: {
    fontSize: 20,
  },
  geofencesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  geofenceCard: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  geofenceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 3,
  },
  geofenceDesc: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  geofenceRadius: {
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

export default AdminDashboard;
