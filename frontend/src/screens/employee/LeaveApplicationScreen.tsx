import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
  ScrollView,
  Platform,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { LeaveService } from '../../services/LeaveService';

type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID';

const LeaveApplicationScreen = ({ navigation }: any) => {
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleDateInput = (text: string, setter: (value: string) => void) => {
    // Format: YYYY-MM-DD
    let cleaned = text.replace(/[^0-9]/g, '');
    if (cleaned.length >= 4) {
      cleaned = cleaned.slice(0, 4) + '-' + cleaned.slice(4);
    }
    if (cleaned.length >= 7) {
      cleaned = cleaned.slice(0, 7) + '-' + cleaned.slice(7, 9);
    }
    setter(cleaned.slice(0, 10));
  };

  const validateDates = (): boolean => {
    if (!startDate || !endDate) {
      Alert.alert('Error', 'Please enter both start and end dates');
      return false;
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(startDate) || !dateRegex.test(endDate)) {
      Alert.alert('Error', 'Please enter dates in YYYY-MM-DD format');
      return false;
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      Alert.alert('Error', 'Invalid date format');
      return false;
    }

    if (start > end) {
      Alert.alert('Error', 'Start date must be before or equal to end date');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateDates()) return;

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for leave');
      return;
    }

    setLoading(true);
    try {
      await LeaveService.applyLeave({
        leaveType,
        startDate,
        endDate,
        reason: reason.trim(),
      });

      Alert.alert(
        'Success',
        'Leave application submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setStartDate('');
              setEndDate('');
              setReason('');
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to submit leave application');
    } finally {
      setLoading(false);
    }
  };

  const days = startDate && endDate && validateDates()
    ? LeaveService.calculateDays(startDate, endDate)
    : 0;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.label}>Leave Type</Text>
        <Dropdown
          style={styles.dropdown}
          placeholderStyle={styles.placeholderStyle}
          selectedTextStyle={styles.selectedTextStyle}
          containerStyle={styles.dropdownContainer}
          data={[
            { label: 'Casual Leave', value: 'CASUAL' },
            { label: 'Sick Leave', value: 'SICK' },
            { label: 'Annual Leave', value: 'ANNUAL' },
            { label: 'Unpaid Leave', value: 'UNPAID' },
          ]}
          maxHeight={300}
          labelField="label"
          valueField="value"
          placeholder="Select Leave Type"
          value={leaveType}
          onChange={item => setLeaveType(item.value as LeaveType)}
        />

        <Text style={styles.label}>Start Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.dateInput}
          value={startDate}
          onChangeText={(text) => handleDateInput(text, setStartDate)}
          placeholder="2024-01-15"
          keyboardType="numeric"
          maxLength={10}
        />

        <Text style={styles.label}>End Date (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.dateInput}
          value={endDate}
          onChangeText={(text) => handleDateInput(text, setEndDate)}
          placeholder="2024-01-20"
          keyboardType="numeric"
          maxLength={10}
        />

        {days > 0 && (
          <View style={styles.daysInfo}>
            <Text style={styles.daysText}>Duration: {days} day{days !== 1 ? 's' : ''}</Text>
          </View>
        )}

        <Text style={styles.label}>Reason</Text>
        <TextInput
          style={styles.input}
          value={reason}
          onChangeText={setReason}
          placeholder="Describe the reason for your leave..."
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />

        <TouchableOpacity
          style={[styles.applyBtn, loading && styles.applyBtnDisabled]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.applyText}>Submit Leave Application</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.historyBtn}
          onPress={() => navigation.navigate('LeaveHistory')}
        >
          <Text style={styles.historyText}>View Leave History</Text>
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
  content: {
    padding: 20,
  },
  label: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 16,
    marginBottom: 8,
    color: '#333'
  },
  dropdown: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  dropdownContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  dateInput: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
  },
  daysInfo: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  daysText: {
    color: '#1976D2',
    fontSize: 14,
    fontWeight: '600',
  },
  input: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    minHeight: 100,
    fontSize: 16,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 20,
  },
  applyBtn: {
    backgroundColor: '#FF9800',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  applyBtnDisabled: {
    opacity: 0.6,
  },
  applyText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  historyBtn: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#2196F3',
  },
  historyText: {
    color: '#2196F3',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LeaveApplicationScreen;
