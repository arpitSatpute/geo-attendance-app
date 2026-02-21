import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { SalaryService, SalaryData } from '../../services/SalaryService';

const EmployeeSalaryScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSalary, setCurrentSalary] = useState<SalaryData | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<SalaryData[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedSalary, setSelectedSalary] = useState<SalaryData | null>(null);

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
    fetchCurrentSalary();
  }, []);

  const fetchCurrentSalary = async () => {
    try {
      setLoading(true);
      const salary = await SalaryService.getCurrentMonthSalary();
      setCurrentSalary(salary);
    } catch (error: any) {
      console.log('No salary data for current month:', error.message);
      setCurrentSalary(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryHistory = async () => {
    try {
      setLoading(true);
      const history = await SalaryService.getMySalaryHistory();
      setSalaryHistory(history);
      setShowHistory(true);
    } catch (error: any) {
      Alert.alert('Error', 'Failed to fetch salary history');
    } finally {
      setLoading(false);
    }
  };

  const fetchSalaryByMonth = async () => {
    try {
      setLoading(true);
      const salary = await SalaryService.getMySalary(selectedYear, selectedMonth);
      setSelectedSalary(salary);
      setShowMonthPicker(false);
      setShowHistory(false);
    } catch (error: any) {
      Alert.alert('No Data', `No salary data found for ${months.find(m => m.value === selectedMonth)?.label} ${selectedYear}`);
      setSelectedSalary(null);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchCurrentSalary();
    if (showHistory) {
      await fetchSalaryHistory();
    }
    setRefreshing(false);
  };

  const renderSalaryCard = (salary: SalaryData, isHistory = false) => (
    <View style={[styles.salaryCard, isHistory && styles.historyCard]} key={salary.id}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <Text style={styles.monthText}>{SalaryService.formatMonth(salary.month)}</Text>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(salary.status) }]}>
          <Text style={styles.statusText}>{salary.status}</Text>
        </View>
      </View>

      {/* Net Salary - Highlighted */}
      <View style={styles.netSalarySection}>
        <Text style={styles.netSalaryLabel}>Net Salary</Text>
        <Text style={styles.netSalaryAmount}>{SalaryService.formatCurrency(salary.netSalary ?? 0)}</Text>
      </View>

      {/* Attendance Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{salary.presentDays ?? 0}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#f44336' }]}>{salary.absentDays ?? 0}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#ff9800' }]}>{salary.lateDays ?? 0}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#4caf50' }]}>{salary.onTimeDays ?? 0}</Text>
            <Text style={styles.statLabel}>On Time</Text>
          </View>
        </View>
        <Text style={styles.infoText}>
          Working Days: {salary.totalWorkingDays ?? 0} | On-Time: {(salary.onTimePercentage ?? 0).toFixed(1)}%
        </Text>
      </View>

      {/* Salary Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Base Salary</Text>
          <Text style={styles.breakdownValue}>{SalaryService.formatCurrency(salary.baseSalary ?? 0)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Earned Salary</Text>
          <Text style={styles.breakdownValue}>{SalaryService.formatCurrency(salary.earnedSalary ?? 0)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: '#f44336' }]}>Deductions</Text>
          <Text style={[styles.breakdownValue, { color: '#f44336' }]}>
            -{SalaryService.formatCurrency(salary.deductions ?? 0)}
          </Text>
        </View>
        {(salary.performanceBonus ?? 0) > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: '#4caf50' }]}>Performance Bonus</Text>
            <Text style={[styles.breakdownValue, { color: '#4caf50' }]}>
              +{SalaryService.formatCurrency(salary.performanceBonus ?? 0)}
            </Text>
          </View>
        )}
        {(salary.overtimeBonus ?? 0) > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: '#4caf50' }]}>Overtime Bonus</Text>
            <Text style={[styles.breakdownValue, { color: '#4caf50' }]}>
              +{SalaryService.formatCurrency(salary.overtimeBonus ?? 0)}
            </Text>
          </View>
        )}
      </View>

      {salary.remarks && (
        <View style={styles.remarksSection}>
          <Text style={styles.remarksLabel}>Remarks:</Text>
          <Text style={styles.remarksText}>{salary.remarks}</Text>
        </View>
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

  if (loading && !refreshing) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#2196F3" />
        <Text style={styles.loadingText}>Loading salary information...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>My Salary</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.headerButton, styles.monthPickerButton]}
            onPress={() => setShowMonthPicker(true)}
          >
            <Text style={styles.headerButtonText}>📅 Select Month</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={() => {
              setSelectedSalary(null);
              showHistory ? setShowHistory(false) : fetchSalaryHistory();
            }}
          >
            <Text style={styles.headerButtonText}>
              {showHistory ? 'Current' : 'History'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Selected Month Salary */}
      {selectedSalary && !showHistory && (
        <>
          <View style={styles.selectedMonthBanner}>
            <Text style={styles.selectedMonthText}>
              Showing salary for: {SalaryService.formatMonth(selectedSalary.month)}
            </Text>
            <TouchableOpacity onPress={() => setSelectedSalary(null)}>
              <Text style={styles.clearSelectionText}>✕ Clear</Text>
            </TouchableOpacity>
          </View>
          {renderSalaryCard(selectedSalary)}
        </>
      )}

      {!showHistory && !selectedSalary ? (
        <>
          {currentSalary ? (
            renderSalaryCard(currentSalary)
          ) : (
            <>
              {/* Dummy Salary Card */}
              <View style={[styles.salaryCard, styles.dummyCard]}>
                <View style={styles.cardHeader}>
                  <Text style={styles.monthText}>
                    {months.find(m => m.value === new Date().getMonth() + 1)?.label} {new Date().getFullYear()}
                  </Text>
                  <View style={[styles.statusBadge, { backgroundColor: '#9e9e9e' }]}>
                    <Text style={styles.statusText}>PENDING</Text>
                  </View>
                </View>

                <View style={styles.netSalarySection}>
                  <Text style={styles.netSalaryLabel}>Net Salary</Text>
                  <Text style={[styles.netSalaryAmount, styles.dummyAmount]}>--,---</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Attendance Summary</Text>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, styles.dummyValue]}>--</Text>
                      <Text style={styles.statLabel}>Present</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, styles.dummyValue]}>--</Text>
                      <Text style={styles.statLabel}>Absent</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, styles.dummyValue]}>--</Text>
                      <Text style={styles.statLabel}>Late</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Text style={[styles.statValue, styles.dummyValue]}>--</Text>
                      <Text style={styles.statLabel}>On Time</Text>
                    </View>
                  </View>
                  <Text style={styles.infoText}>Working Days: -- | On-Time: --%</Text>
                </View>

                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Salary Breakdown</Text>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Base Salary</Text>
                    <Text style={[styles.breakdownValue, styles.dummyValue]}>--,---</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={styles.breakdownLabel}>Earned Salary</Text>
                    <Text style={[styles.breakdownValue, styles.dummyValue]}>--,---</Text>
                  </View>
                  <View style={styles.breakdownRow}>
                    <Text style={[styles.breakdownLabel, { color: '#f44336' }]}>Deductions</Text>
                    <Text style={[styles.breakdownValue, styles.dummyValue]}>--,---</Text>
                  </View>
                </View>

                <View style={styles.pendingMessageSection}>
                  <Text style={styles.pendingIcon}>⏳</Text>
                  <Text style={styles.pendingTitle}>Salary Not Yet Calculated</Text>
                  <Text style={styles.pendingMessage}>
                    Your salary for this month will be calculated by your manager at the end of the month.
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={styles.selectMonthButton}
                onPress={() => setShowMonthPicker(true)}
              >
                <Text style={styles.selectMonthButtonText}>📅 View Previous Month's Salary</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      ) : showHistory ? (
        <>
          {salaryHistory.length > 0 ? (
            <>
              <Text style={styles.historyTitle}>Salary History</Text>
              {salaryHistory.map(salary => renderSalaryCard(salary, true))}
            </>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No salary history available</Text>
            </View>
          )}
        </>
      ) : null}

      {/* Month Picker Modal */}
      <Modal
        visible={showMonthPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMonthPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Month & Year</Text>

            <View style={styles.dropdownRow}>
              <View style={styles.dropdownContainerWrapper}>
                <Text style={styles.pickerLabel}>Month</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  containerStyle={styles.dropdownPopup}
                  data={months}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Month"
                  value={selectedMonth}
                  onChange={item => setSelectedMonth(item.value)}
                />
              </View>

              <View style={styles.dropdownContainerWrapper}>
                <Text style={styles.pickerLabel}>Year</Text>
                <Dropdown
                  style={styles.dropdown}
                  placeholderStyle={styles.placeholderStyle}
                  selectedTextStyle={styles.selectedTextStyle}
                  containerStyle={styles.dropdownPopup}
                  data={years.map(y => ({ label: y.toString(), value: y }))}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder="Select Year"
                  value={selectedYear}
                  onChange={item => setSelectedYear(item.value)}
                />
              </View>
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowMonthPicker(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.fetchButton]}
                onPress={fetchSalaryByMonth}
              >
                <Text style={styles.fetchButtonText}>View Salary</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  historyButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  historyButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14,
  },
  salaryCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  historyCard: {
    marginTop: 0,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  monthText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  netSalarySection: {
    backgroundColor: '#4caf50',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
  },
  netSalaryLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  netSalaryAmount: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  infoText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  breakdownLabel: {
    fontSize: 14,
    color: '#666',
  },
  breakdownValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  remarksSection: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  remarksLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 14,
    color: '#333',
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
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  headerButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 12,
  },
  monthPickerButton: {
    backgroundColor: '#4caf50',
  },
  selectedMonthBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
  },
  selectedMonthText: {
    fontSize: 14,
    color: '#1976d2',
    fontWeight: '500',
  },
  clearSelectionText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: '600',
  },
  selectMonthButton: {
    marginTop: 16,
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectMonthButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  dropdownRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  dropdownContainerWrapper: {
    flex: 1,
  },
  pickerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  dropdown: {
    height: 50,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  placeholderStyle: {
    fontSize: 16,
    color: '#94a3b8',
  },
  selectedTextStyle: {
    fontSize: 16,
    color: '#333',
  },
  dropdownPopup: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
    fontSize: 16,
  },
  fetchButton: {
    backgroundColor: '#4caf50',
  },
  fetchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  dummyCard: {
    borderStyle: 'dashed',
    borderWidth: 2,
    borderColor: '#bdbdbd',
    backgroundColor: '#fafafa',
  },
  dummyAmount: {
    color: '#9e9e9e',
  },
  dummyValue: {
    color: '#bdbdbd',
  },
  pendingMessageSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    marginTop: 8,
  },
  pendingIcon: {
    fontSize: 40,
    marginBottom: 12,
  },
  pendingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 8,
  },
  pendingMessage: {
    fontSize: 14,
    color: '#757575',
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
  },
});

export default EmployeeSalaryScreen;
