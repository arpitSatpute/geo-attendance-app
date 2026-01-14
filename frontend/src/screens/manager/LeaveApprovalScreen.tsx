import React, { useEffect, useState } from 'react';
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
import { LeaveService, LeaveRequest } from '../../services/LeaveService';

const LeaveApprovalScreen = () => {
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await LeaveService.getAllLeaves();
      setLeaves(data);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch leave requests');
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

  const handleApprove = async (id: string) => {
    Alert.alert(
      'Approve Leave',
      'Are you sure you want to approve this leave request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await LeaveService.approveLeave(id);
              Alert.alert('Success', 'Leave approved successfully');
              fetchLeaves();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve leave');
            }
          },
        },
      ]
    );
  };

  const handleReject = async (id: string) => {
    Alert.alert(
      'Reject Leave',
      'Are you sure you want to reject this leave request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              await LeaveService.rejectLeave(id);
              Alert.alert('Success', 'Leave rejected');
              fetchLeaves();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject leave');
            }
          },
        },
      ]
    );
  };

  const filteredLeaves = filter === 'ALL' 
    ? leaves 
    : leaves.filter(leave => leave.status === filter);

  const renderLeaveCard = (leave: LeaveRequest) => {
    const days = LeaveService.calculateDays(leave.startDate, leave.endDate);
    const statusColor = LeaveService.getStatusColor(leave.status || 'PENDING');
    const typeColor = LeaveService.getLeaveTypeColor(leave.leaveType);

    return (
      <View key={leave.id} style={styles.leaveCard}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.empName}>
              {leave.user?.firstName} {leave.user?.lastName}
            </Text>
            <Text style={styles.empEmail}>{leave.user?.email}</Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.statusBadgeText}>{leave.status}</Text>
          </View>
        </View>

        <View style={styles.detailsRow}>
          <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
            <Text style={styles.typeBadgeText}>{leave.leaveType}</Text>
          </View>
          <Text style={styles.durationText}>{days} day{days !== 1 ? 's' : ''}</Text>
        </View>

        <View style={styles.dateContainer}>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>From:</Text>
            <Text style={styles.dateValue}>{LeaveService.formatDate(leave.startDate)}</Text>
          </View>
          <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>To:</Text>
            <Text style={styles.dateValue}>{LeaveService.formatDate(leave.endDate)}</Text>
          </View>
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

        {leave.status === 'PENDING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={styles.approveBtn} 
              onPress={() => handleApprove(leave.id!)}
            >
              <Text style={styles.btnText}>✓ Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.rejectBtn} 
              onPress={() => handleReject(leave.id!)}
            >
              <Text style={styles.btnText}>✗ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.filterContainer}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => (
          <TouchableOpacity
            key={status}
            style={[styles.filterBtn, filter === status && styles.filterBtnActive]}
            onPress={() => setFilter(status)}
          >
            <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
              {status}
            </Text>
            {status !== 'ALL' && (
              <View style={[styles.filterBadge, filter === status && styles.filterBadgeActive]}>
                <Text style={[styles.filterBadgeText, filter === status && styles.filterBadgeTextActive]}>
                  {leaves.filter(l => l.status === status).length}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF9800" />
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      ) : error ? (
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
          {filteredLeaves.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                No {filter !== 'ALL' ? filter.toLowerCase() : ''} leave requests found
              </Text>
            </View>
          ) : (
            <>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>Leave Statistics</Text>
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{leaves.length}</Text>
                    <Text style={styles.statLabel}>Total</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#FF9800' }]}>
                      {leaves.filter(l => l.status === 'PENDING').length}
                    </Text>
                    <Text style={styles.statLabel}>Pending</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#4CAF50' }]}>
                      {leaves.filter(l => l.status === 'APPROVED').length}
                    </Text>
                    <Text style={styles.statLabel}>Approved</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statValue, { color: '#f44336' }]}>
                      {leaves.filter(l => l.status === 'REJECTED').length}
                    </Text>
                    <Text style={styles.statLabel}>Rejected</Text>
                  </View>
                </View>
              </View>

              {filteredLeaves.map(renderLeaveCard)}
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
    backgroundColor: '#f5f5f5' 
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: '#666',
  },
  filterContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterBtn: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: '#f5f5f5',
    gap: 6,
  },
  filterBtnActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#fff',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  filterBadgeText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  filterBadgeTextActive: {
    color: '#fff',
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
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  statLabel: {
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
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  empName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  empEmail: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
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
  durationText: {
    fontSize: 14,
    color: '#2196F3',
    fontWeight: '600',
  },
  dateContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  dateRow: {
    flexDirection: 'row',
    marginBottom: 4,
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
  reasonBox: {
    marginBottom: 8,
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
    fontStyle: 'italic',
    marginBottom: 12,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#f44336',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
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
    textAlign: 'center',
  },
});

export default LeaveApprovalScreen;
