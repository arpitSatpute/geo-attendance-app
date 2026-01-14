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
import { ApiService } from '../../services/ApiService';

const LeaveApprovalScreen = () => {
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const fetchLeaves = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await ApiService.get('/leaves');
      setLeaves(res.data || []);
    } catch (e) {
      setError('Failed to fetch leave requests');
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
    try {
      await ApiService.approveLeave(id);
      Alert.alert('Success', 'Leave approved');
      fetchLeaves();
    } catch {
      Alert.alert('Error', 'Failed to approve leave');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await ApiService.rejectLeave(id);
      Alert.alert('Success', 'Leave rejected');
      fetchLeaves();
    } catch {
      Alert.alert('Error', 'Failed to reject leave');
    }
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#FF9800" style={{ marginTop: 40 }} />
      ) : error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <ScrollView
          style={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {leaves.length === 0 ? (
            <Text style={styles.empty}>No leave requests found.</Text>
          ) : (
            leaves.map((leave, idx) => (
              <View key={idx} style={styles.leaveCard}>
                <Text style={styles.empName}>{leave.user?.firstName} {leave.user?.lastName} ({leave.user?.email})</Text>
                <Text style={styles.leaveType}>Type: {leave.leaveType}</Text>
                <Text style={styles.leaveDates}>From: {leave.startDate} To: {leave.endDate}</Text>
                <Text style={styles.leaveReason}>Reason: {leave.reason}</Text>
                <Text style={styles.leaveStatus}>Status: {leave.status}</Text>
                {leave.status === 'PENDING' && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(leave.id)}>
                      <Text style={styles.btnText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(leave.id)}>
                      <Text style={styles.btnText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  list: { flex: 1, padding: 16 },
  leaveCard: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 18, padding: 12 },
  empName: { fontWeight: 'bold', fontSize: 16, marginBottom: 4, color: '#2196F3' },
  leaveType: { fontSize: 14, color: '#333' },
  leaveDates: { fontSize: 13, color: '#666' },
  leaveReason: { fontSize: 13, color: '#666' },
  leaveStatus: { fontSize: 13, color: '#999', marginBottom: 6 },
  actionRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  approveBtn: { backgroundColor: '#4CAF50', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  rejectBtn: { backgroundColor: '#F44336', padding: 10, borderRadius: 8, flex: 1, alignItems: 'center' },
  btnText: { color: '#fff', fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginTop: 30 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
});

export default LeaveApprovalScreen;
