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
  useWindowDimensions,
} from 'react-native';
import { LeaveService, LeaveRequest } from '../../services/LeaveService';

const LeaveApprovalScreen = () => {
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;
  const isLargeScreen = width >= 1024;
  
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [processingId, setProcessingId] = useState<string | null>(null);

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
              setProcessingId(id);
              await LeaveService.approveLeave(id);
              Alert.alert('Success', 'Leave approved successfully');
              fetchLeaves();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve leave');
            } finally {
              setProcessingId(null);
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
              setProcessingId(id);
              await LeaveService.rejectLeave(id);
              Alert.alert('Success', 'Leave rejected');
              fetchLeaves();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to reject leave');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const filteredLeaves = filter === 'ALL' 
    ? leaves 
    : leaves.filter(leave => leave.status === filter);

  // Calculate responsive card width
  const getCardStyle = () => {
    if (isLargeScreen) {
      return { width: (width - 80) / 3 - 16 }; // 3 columns with gap
    }
    if (isTablet) {
      return { width: (width - 64) / 2 - 12 }; // 2 columns with gap
    }
    return { width: '100%' as const }; // Full width on mobile
  };

  const pendingCount = leaves.filter(l => l.status === 'PENDING').length;
  const approvedCount = leaves.filter(l => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter(l => l.status === 'REJECTED').length;

  const renderLeaveCard = (leave: LeaveRequest) => {
    const days = LeaveService.calculateDays(leave.startDate, leave.endDate);
    const statusColor = LeaveService.getStatusColor(leave.status || 'PENDING');
    const typeColor = LeaveService.getLeaveTypeColor(leave.leaveType);
    const isProcessing = processingId === leave.id;

    // Support both userName/userEmail and user.firstName/user.email formats
    const employeeName = leave.userName || (leave.user ? `${leave.user.firstName} ${leave.user.lastName}` : 'Unknown');
    const employeeEmail = leave.userEmail || leave.user?.email || '';
    const avatarInitial = employeeName?.[0]?.toUpperCase() || 'U';

    return (
      <View key={leave.id} style={[styles.leaveCard, getCardStyle(), isProcessing && styles.processingCard]}>
        {/* Status indicator strip */}
        <View style={[styles.statusStrip, { backgroundColor: statusColor }]} />
        
        <View style={styles.cardContent}>
          {/* Header with avatar */}
          <View style={styles.cardHeader}>
            <View style={styles.employeeInfo}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {avatarInitial}
                </Text>
              </View>
              <View style={styles.employeeDetails}>
                <Text style={styles.empName} numberOfLines={1}>
                  {employeeName}
                </Text>
                <Text style={styles.empEmail} numberOfLines={1}>{employeeEmail}</Text>
              </View>
            </View>
            <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
              <Text style={styles.statusBadgeText}>{leave.status}</Text>
            </View>
          </View>

          {/* Leave Type & Duration */}
          <View style={styles.detailsRow}>
            <View style={[styles.typeBadge, { backgroundColor: typeColor }]}>
              <Text style={styles.typeBadgeText}>{leave.leaveType}</Text>
            </View>
            <View style={styles.durationBadge}>
              <Text style={styles.durationText}>{days} day{days !== 1 ? 's' : ''}</Text>
            </View>
          </View>

          {/* Dates */}
          <View style={styles.dateContainer}>
            <View style={styles.dateItem}>
              <Text style={styles.dateIcon}>📅</Text>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>From</Text>
                <Text style={styles.dateValue}>{LeaveService.formatDate(leave.startDate)}</Text>
              </View>
            </View>
            <View style={styles.dateDivider} />
            <View style={styles.dateItem}>
              <Text style={styles.dateIcon}>📅</Text>
              <View style={styles.dateInfo}>
                <Text style={styles.dateLabel}>To</Text>
                <Text style={styles.dateValue}>{LeaveService.formatDate(leave.endDate)}</Text>
              </View>
            </View>
          </View>

          {/* Reason */}
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>📝 Reason</Text>
            <Text style={styles.reasonText} numberOfLines={3}>{leave.reason}</Text>
          </View>

          {(leave.createdAt || leave.appliedDate) && (
            <Text style={styles.appliedDate}>
              Applied on {LeaveService.formatDate(leave.createdAt || leave.appliedDate || '')}
            </Text>
          )}

        {leave.status === 'PENDING' && (
          <View style={styles.actionRow}>
            <TouchableOpacity 
              style={[styles.approveBtn, isProcessing && styles.disabledBtn]} 
              onPress={() => handleApprove(leave.id!)}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.btnText}>✓ Approve</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.rejectBtn, isProcessing && styles.disabledBtn]} 
              onPress={() => handleReject(leave.id!)}
              disabled={isProcessing}
            >
              <Text style={styles.btnText}>✗ Reject</Text>
            </TouchableOpacity>
          </View>
        )}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <View>
          <Text style={styles.headerTitle}>Leave Approvals</Text>
          <Text style={styles.headerSubtitle}>{pendingCount} pending request{pendingCount !== 1 ? 's' : ''}</Text>
        </View>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterContainer, isTablet && styles.filterContainerTablet]}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((status) => {
            const count = status === 'ALL' ? leaves.length : 
                         status === 'PENDING' ? pendingCount :
                         status === 'APPROVED' ? approvedCount : rejectedCount;
            const statusColors: Record<string, string> = {
              ALL: '#607D8B',
              PENDING: '#FF9800',
              APPROVED: '#4CAF50',
              REJECTED: '#f44336',
            };
            
            return (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterBtn, 
                  filter === status && { backgroundColor: statusColors[status] }
                ]}
                onPress={() => setFilter(status)}
              >
                <Text style={[styles.filterText, filter === status && styles.filterTextActive]}>
                  {status}
                </Text>
                <View style={[
                  styles.filterBadge, 
                  filter === status && styles.filterBadgeActive
                ]}>
                  <Text style={[
                    styles.filterBadgeText, 
                    filter === status && styles.filterBadgeTextActive
                  ]}>
                    {count}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#2196F3" />
          <Text style={styles.loadingText}>Loading leave requests...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchLeaves}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            isTablet && styles.scrollContentTablet
          ]}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2196F3']} />
          }
        >
          {filteredLeaves.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📋</Text>
              <Text style={styles.emptyTitle}>No Leave Requests</Text>
              <Text style={styles.emptyText}>
                {filter !== 'ALL' 
                  ? `No ${filter.toLowerCase()} leave requests found`
                  : 'No leave requests to display'}
              </Text>
            </View>
          ) : (
            <>
              {/* Summary Stats - Tablet/Desktop only */}
              {isTablet && (
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryItem, { backgroundColor: '#E3F2FD' }]}>
                    <Text style={[styles.summaryValue, { color: '#1976D2' }]}>{leaves.length}</Text>
                    <Text style={styles.summaryLabel}>Total Requests</Text>
                  </View>
                  <View style={[styles.summaryItem, { backgroundColor: '#FFF3E0' }]}>
                    <Text style={[styles.summaryValue, { color: '#F57C00' }]}>{pendingCount}</Text>
                    <Text style={styles.summaryLabel}>Pending</Text>
                  </View>
                  <View style={[styles.summaryItem, { backgroundColor: '#E8F5E9' }]}>
                    <Text style={[styles.summaryValue, { color: '#388E3C' }]}>{approvedCount}</Text>
                    <Text style={styles.summaryLabel}>Approved</Text>
                  </View>
                  <View style={[styles.summaryItem, { backgroundColor: '#FFEBEE' }]}>
                    <Text style={[styles.summaryValue, { color: '#D32F2F' }]}>{rejectedCount}</Text>
                    <Text style={styles.summaryLabel}>Rejected</Text>
                  </View>
                </View>
              )}

              {/* Mobile Summary Card */}
              {!isTablet && (
                <View style={styles.summaryCard}>
                  <Text style={styles.summaryTitle}>Leave Statistics</Text>
                  <View style={styles.statsGrid}>
                    <View style={styles.statItem}>
                      <Text style={styles.statValue}>{leaves.length}</Text>
                      <Text style={styles.statLabel}>Total</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: '#FF9800' }]}>{pendingCount}</Text>
                      <Text style={styles.statLabel}>Pending</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: '#4CAF50' }]}>{approvedCount}</Text>
                      <Text style={styles.statLabel}>Approved</Text>
                    </View>
                    <View style={styles.statItem}>
                      <Text style={[styles.statValue, { color: '#f44336' }]}>{rejectedCount}</Text>
                      <Text style={styles.statLabel}>Rejected</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Cards Container - Responsive Grid */}
              <View style={[styles.cardsContainer, isTablet && styles.cardsContainerTablet]}>
                {filteredLeaves.map(renderLeaveCard)}
              </View>
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
    backgroundColor: '#f8f9fa',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTablet: {
    paddingHorizontal: 32,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#666',
  },
  filterContainer: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  filterContainerTablet: {
    paddingHorizontal: 24,
  },
  filterScroll: {
    paddingHorizontal: 16,
    gap: 10,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    marginRight: 10,
    gap: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#555',
  },
  filterTextActive: {
    color: '#fff',
  },
  filterBadge: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  filterBadgeText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
  },
  filterBadgeTextActive: {
    color: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  scrollContentTablet: {
    padding: 24,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  summaryItem: {
    flex: 1,
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '500',
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
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
  cardsContainer: {
    gap: 16,
  },
  cardsContainerTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  leaveCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  processingCard: {
    opacity: 0.7,
  },
  statusStrip: {
    height: 4,
    width: '100%',
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  employeeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
  employeeDetails: {
    flex: 1,
  },
  empName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  empEmail: {
    fontSize: 13,
    color: '#666',
  },
  statusBadge: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  statusBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
    textTransform: 'uppercase',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  typeBadge: {
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  typeBadgeText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  durationBadge: {
    backgroundColor: '#E3F2FD',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  durationText: {
    fontSize: 13,
    color: '#1976D2',
    fontWeight: '600',
  },
  dateContainer: {
    flexDirection: 'row',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dateInfo: {
    flex: 1,
  },
  dateIcon: {
    fontSize: 20,
  },
  dateDivider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 12,
  },
  dateLabel: {
    fontSize: 11,
    color: '#888',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 14,
    color: '#1a1a1a',
    fontWeight: '600',
  },
  reasonBox: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
  },
  reasonLabel: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
    fontWeight: '500',
  },
  reasonText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
  },
  appliedDate: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#f44336',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  disabledBtn: {
    opacity: 0.6,
  },
  btnText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
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
    paddingVertical: 80,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: '#888',
    textAlign: 'center',
  },
});

export default LeaveApprovalScreen;
