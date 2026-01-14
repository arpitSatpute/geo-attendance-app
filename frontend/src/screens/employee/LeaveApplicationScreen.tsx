import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { ApiService } from '../../services/ApiService';

const LeaveApplicationScreen = () => {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
      <Text style={{ fontSize: 18, color: '#888', textAlign: 'center' }}>
        This feature is temporarily unavailable.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5', padding: 20 },
  label: { fontSize: 15, fontWeight: '600', marginTop: 16, marginBottom: 6, color: '#333' },
  typeRow: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  typeBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 8 },
  typeBtnActive: { backgroundColor: '#2196F3' },
  typeText: { color: '#333' },
  typeTextActive: { color: '#fff', fontWeight: 'bold' },
  dateBtn: { backgroundColor: '#fff', padding: 10, borderRadius: 8, marginBottom: 10 },
  dateText: { fontSize: 14, color: '#333' },
  input: { backgroundColor: '#fff', borderRadius: 8, padding: 10, minHeight: 60, textAlignVertical: 'top', marginBottom: 20 },
  applyBtn: { backgroundColor: '#FF9800', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 20 },
  applyText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});

export default LeaveApplicationScreen;
