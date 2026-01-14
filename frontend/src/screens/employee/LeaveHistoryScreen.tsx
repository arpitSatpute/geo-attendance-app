import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { LeaveService, LeaveRequest } from '../../services/LeaveService';

const LeaveHistoryScreen = ({ navigation }: any) => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaves = async () => {
    setError('');
    try {
      const data = await LeaveService.getMyLeaves();
      setLeaves(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch leave history');
      setLeaves([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaves();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchLeaves();
    setRefreshing(false);
  };

  const renderLeaveCard = (leave: LeaveRequest) => {
    const days = LeaveService.calculateDays(leave.startDate, leave.endDate);
    const statusColor = LeaveService.getStatusColor(leave.status || 'PENDING');
    const typeColor = LeaveService.getLeaveTypeColor(leave.leaveType);

    return (
      <View key={leave.id} style={styles.leaveCard}>
        <View style={styles.cardHeader}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeBadgeText}>{leave.leaveType}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{leave.status}</Text>
          </View>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>From:</Text>
          <Text style={styles.dateValue}>{LeaveService.formatDate(leave.startDate)}</Text>
        </View>

        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>To:</Text>
          <Text style={styles.dateValue}>{LeaveService.formatDate(leave.endDate)}</Text>
        </View>

        <View style={styles.durationRow}>
          <Text style={styles.durationText}>Duration: {days} day{days !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.reasonBox}>
          <Text style={styles.reasonLabel}>Reason:</Text>
          <Text style={styles.reasonText}>{leave.reason}</Text>
        </View>

        {leave.appliedDate && (
          <Text style={styles.appliedDate}>
            Applied: {LeaveService.formatDate(leave.appliedDate)}
          </Text>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FF9800" />
        <Text style={styles.loadingText}>Loading leave history...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Leave History</Text>
        <TouchableOpacity
          style={styles.applyButton}
          onPress={() => navigation.navigate('LeaveApplication')}
        >
          <Text style={styles.applyButtonText}>+ Apply Leave</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLeaves}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#FF9800']} />
          }
        >
          {leaves.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No leave applications found</Text>
              <TouchableOpacity
                style={styles.applyLeaveButton}
                onPress={() => navigation.navigate('LeaveApplication')}
              >
                <Text style={styles.applyLeaveButtonText}>Apply for Leave</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Total Applications</Text>
                <Text style={styles.summaryValue}>{leaves.length}</Text>
                <View style={styles.summaryDetails}>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryBadge, { backgroundColor: '#4CAF50' }]}>
                      {leaves.filter(l => l.status === 'APPROVED').length}
                    </Text>
                    <Text style={styles.summaryLabel}>Approved</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryBadge, { backgroundColor: '#FF9800' }]}>
                      {leaves.filter(l => l.status === 'PENDING').length}
                    </Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                  </View>
                  <View style={styles.summaryItem}>
                    <Text style={[styles.summaryBadge, { backgroundColor: '#f44336' }]}>
                      {leaves.filter(l => l.status === 'REJECTED').length}
                    </Text>
                    <Text style={styles.summaryLabel}>Rejected</Text>
                  </View>
                </View>
              </View>

              {leaves.map(renderLeaveCard)}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  applyButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 6,
  },
  applyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  summaryDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryBadge: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    marginBottom: 6,
    minWidth: 40,
    textAlign: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
  },
  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  typeBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    width: 60,
  },
  dateValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '600',
  },
  durationRow: {
    marginVertical: 8,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e0e0e0',
  },
  durationText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  reasonBox: {
    marginTop: 8,
  },
  reasonLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  appliedDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#f44336',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginBottom: 20,
  },
  applyLeaveButton: {
    backgroundColor: '#FF9800',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  applyLeaveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LeaveHistoryScreen;
