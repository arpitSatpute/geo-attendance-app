import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Platform,
} from 'react-native';
import { ApiService } from '../../services/ApiService';

const TeamAttendanceScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>
        This feature is temporarily unavailable.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  dateRow: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 8 },
  dateBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginRight: 8 },
  dateText: { fontSize: 14, color: '#333' },
  fetchBtn: { backgroundColor: '#FF9800', padding: 10, borderRadius: 8 },
  fetchText: { color: '#fff', fontWeight: 'bold' },
  list: { flex: 1, padding: 16 },
  empBlock: { backgroundColor: '#fff', borderRadius: 10, marginBottom: 18, padding: 12 },
  empName: { fontWeight: 'bold', fontSize: 16, marginBottom: 8, color: '#2196F3' },
  recordRow: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  recordDate: { fontSize: 13, color: '#333', minWidth: 80 },
  recordTime: { fontSize: 13, color: '#666' },
  recordStatus: { fontSize: 13, color: '#999' },
  error: { color: 'red', textAlign: 'center', marginTop: 30 },
  empty: { color: '#999', textAlign: 'center', marginTop: 30 },
});

export default TeamAttendanceScreen;
