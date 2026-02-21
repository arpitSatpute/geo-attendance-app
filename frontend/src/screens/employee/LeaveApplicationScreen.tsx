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
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { LeaveService } from '../../services/LeaveService';

type LeaveType = 'SICK' | 'CASUAL' | 'ANNUAL' | 'UNPAID';

const LeaveApplicationScreen = ({ navigation }: any) => {
  const [leaveType, setLeaveType] = useState<LeaveType>('CASUAL');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [startDateSelected, setStartDateSelected] = useState(false);
  const [endDateSelected, setEndDateSelected] = useState(false);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const formatDateString = (date: Date) => {
    return date.toISOString().split('T')[0];
  };

  const onStartDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setStartDate(selectedDate);
      setStartDateSelected(true);
      if (selectedDate > endDate) {
        setEndDate(selectedDate);
      }
    }
  };

  const onEndDateChange = (event: DateTimePickerEvent, selectedDate?: Date) => {
    setShowEndPicker(Platform.OS === 'ios');
    if (selectedDate) {
      setEndDate(selectedDate);
      setEndDateSelected(true);
    }
  };

  const validateDates = (silent: boolean = false): boolean => {
    if (!startDateSelected || !endDateSelected) {
      if (!silent) Alert.alert('Error', 'Please select both start and end dates');
      return false;
    }

    if (startDate > endDate) {
      if (!silent) Alert.alert('Error', 'Start date must be before or equal to end date');
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
        startDate: formatDateString(startDate),
        endDate: formatDateString(endDate),
        reason: reason.trim(),
      });

      Alert.alert(
        'Success',
        'Leave application submitted successfully',
        [
          {
            text: 'OK',
            onPress: () => {
              setStartDate(new Date());
              setEndDate(new Date());
              setStartDateSelected(false);
              setEndDateSelected(false);
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

  const days = startDateSelected && endDateSelected && validateDates(true)
    ? LeaveService.calculateDays(formatDateString(startDate), formatDateString(endDate))
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

        <Text style={styles.label}>Start Date</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowStartPicker(true)}
        >
          <Text style={[styles.dateText, !startDateSelected && styles.placeholderText]}>
            {startDateSelected ? formatDateString(startDate) : 'Select Start Date'}
          </Text>
        </TouchableOpacity>
        {showStartPicker && (
          <DateTimePicker
            value={startDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onStartDateChange}
            minimumDate={new Date()}
          />
        )}

        <Text style={styles.label}>End Date</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowEndPicker(true)}
        >
          <Text style={[styles.dateText, !endDateSelected && styles.placeholderText]}>
            {endDateSelected ? formatDateString(endDate) : 'Select End Date'}
          </Text>
        </TouchableOpacity>
        {showEndPicker && (
          <DateTimePicker
            value={endDate}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            onChange={onEndDateChange}
            minimumDate={startDate}
          />
        )}

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
    borderWidth: 1,
    borderColor: '#e0e0e0',
    marginBottom: 10,
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    color: '#999',
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
