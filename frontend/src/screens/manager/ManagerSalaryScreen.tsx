import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { SalaryService, SalaryData, SalaryCalculationRequest } from '../../services/SalaryService';
import { ApiService } from '../../services/ApiService';

interface Employee {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

const ManagerSalaryScreen = () => {
  const [loading, setLoading] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [teamSalaries, setTeamSalaries] = useState<SalaryData[]>([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<string>('');
  const [remarks, setRemarks] = useState('');
  const [calculating, setCalculating] = useState(false);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  useEffect(() => {
    fetchEmployees();
    fetchTeamSalaries();
  }, []);

  useEffect(() => {
    fetchTeamSalaries();
  }, [selectedYear, selectedMonth]);

  const fetchEmployees = async () => {
    try {
      const response = await ApiService.get<Employee[]>('/users/team-members');
      setEmployees(response.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const fetchTeamSalaries = async () => {
    try {
      setLoading(true);
      const salaries = await SalaryService.getTeamSalaries(selectedYear, selectedMonth);
      setTeamSalaries(salaries);
    } catch (error: any) {
      console.log('No salary data for selected month');
      setTeamSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateSalary = async () => {
    if (!selectedEmployee) {
      Alert.alert('Error', 'Please select an employee');
      return;
    }

    try {
      setCalculating(true);
      const request: SalaryCalculationRequest = {
        userId: selectedEmployee,
        year: selectedYear,
        month: selectedMonth,
        remarks: remarks,
      };

      await SalaryService.calculateSalary(request);
      Alert.alert('Success', 'Salary calculated successfully');
      setShowCalculateModal(false);
      setSelectedEmployee('');
      setRemarks('');
      fetchTeamSalaries();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to calculate salary');
    } finally {
      setCalculating(false);
    }
  };

  const handleApproveSalary = async (salaryId: string) => {
    Alert.alert(
      'Approve Salary',
      'Are you sure you want to approve this salary?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              await SalaryService.approveSalary(salaryId);
              Alert.alert('Success', 'Salary approved successfully');
              fetchTeamSalaries();
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to approve salary');
            }
          },
        },
      ]
    );
  };

  const renderSalaryItem = (salary: SalaryData) => (
    <View style={styles.salaryItem} key={salary.id}>
      <View style={styles.salaryHeader}>
        <View>
          <Text style={styles.employeeName}>{salary.userName}</Text>
          <Text style={styles.employeeEmail}>{salary.userEmail}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(salary.status) }]}>
          <Text style={styles.statusText}>{salary.status}</Text>
        </View>
      </View>

      <View style={styles.salaryDetails}>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>Net Salary:</Text>
          <Text style={styles.salaryAmount}>{SalaryService.formatCurrency(salary.netSalary ?? 0)}</Text>
        </View>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>Present/Total Days:</Text>
          <Text style={styles.salaryValue}>
            {salary.presentDays ?? 0}/{salary.totalWorkingDays ?? 0}
          </Text>
        </View>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>On-Time %:</Text>
          <Text style={styles.salaryValue}>{(salary.onTimePercentage ?? 0).toFixed(1)}%</Text>
        </View>
        <View style={styles.salaryRow}>
          <Text style={styles.salaryLabel}>Bonus:</Text>
          <Text style={[styles.salaryValue, { color: '#4caf50' }]}>
            {SalaryService.formatCurrency(salary.totalBonus ?? 0)}
          </Text>
        </View>
      </View>

      {salary.status === 'CALCULATED' && (
        <TouchableOpacity
          style={styles.approveButton}
          onPress={() => handleApproveSalary(salary.id)}
        >
          <Text style={styles.approveButtonText}>Approve Salary</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return '#4caf50';
      case 'APPROVED': return '#2196f3';
      case 'CALCULATED': return '#ff9800';
      default: return '#9e9e9e';
    }
  };

  return (
    <View style={styles.container}>
      {/* Header with Month/Year Picker */}
      <View style={styles.header}>
        <Text style={styles.title}>Team Salaries</Text>
        <View style={styles.headerPickers}>
          <Dropdown
            style={styles.headerDropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            containerStyle={styles.dropdownPopup}
            data={months}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Month"
            value={selectedMonth}
            onChange={item => setSelectedMonth(item.value)}
          />
          <Dropdown
            style={styles.headerDropdown}
            placeholderStyle={styles.placeholderStyle}
            selectedTextStyle={styles.selectedTextStyle}
            containerStyle={styles.dropdownPopup}
            data={years.map(y => ({ label: y.toString(), value: y }))}
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Year"
            value={selectedYear}
            onChange={item => setSelectedYear(item.value)}
          />
        </View>
        <TouchableOpacity
          style={styles.calculateButton}
          onPress={() => setShowCalculateModal(true)}
        >
          <Text style={styles.calculateButtonText}>+ Calculate Salary</Text>
        </TouchableOpacity>
      </View>

      {/* Team Salaries List */}
      <ScrollView style={styles.scrollView}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#2196F3" />
          </View>
        ) : teamSalaries.length > 0 ? (
          teamSalaries.map(salary => renderSalaryItem(salary))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No salaries calculated for this month</Text>
            <Text style={styles.emptySubtext}>Tap "Calculate Salary" to get started</Text>
          </View>
        )}
      </ScrollView>

      {/* Calculate Salary Modal */}
      <Modal
        visible={showCalculateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowCalculateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Calculate Salary</Text>

            <Text style={styles.label}>Select Employee</Text>
            <Dropdown
              style={styles.modalDropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              containerStyle={styles.dropdownPopup}
              data={employees.map(emp => ({ label: `${emp.firstName} ${emp.lastName} (${emp.email})`, value: emp.id }))}
              search
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select an employee..."
              searchPlaceholder="Search..."
              value={selectedEmployee}
              onChange={item => setSelectedEmployee(item.value)}
            />

            <Text style={styles.label}>Period</Text>
            <Text style={styles.periodText}>
              {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </Text>

            <Text style={styles.label}>Remarks (Optional)</Text>
            <TextInput
              style={styles.remarksInput}
              placeholder="Add any remarks..."
              value={remarks}
              onChangeText={setRemarks}
              multiline
              numberOfLines={3}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowCalculateModal(false)}
                disabled={calculating}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.confirmButton]}
                onPress={handleCalculateSalary}
                disabled={calculating}
              >
                {calculating ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.confirmButtonText}>Calculate</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  headerPickers: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  headerDropdown: {
    flex: 1,
    height: 45,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalDropdown: {
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 14,
  },
  dropdownPopup: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  calculateButton: {
    backgroundColor: '#4caf50',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  centerContainer: {
    padding: 40,
    alignItems: 'center',
  },
  salaryItem: {
    backgroundColor: '#fff',
    margin: 12,
    marginTop: 0,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  salaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  employeeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  employeeEmail: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '600',
  },
  salaryDetails: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 12,
  },
  salaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  salaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  salaryAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  salaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  approveButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 12,
  },
  periodText: {
    fontSize: 16,
    color: '#666',
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  remarksInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: '600',
  },
  confirmButton: {
    backgroundColor: '#4caf50',
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ManagerSalaryScreen;
