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
} from 'react-native';
import { SalaryService, SalaryData } from '../../services/SalaryService';

const EmployeeSalaryScreen = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [currentSalary, setCurrentSalary] = useState<SalaryData | null>(null);
  const [salaryHistory, setSalaryHistory] = useState<SalaryData[]>([]);
  const [showHistory, setShowHistory] = useState(false);

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
        <Text style={styles.netSalaryAmount}>{SalaryService.formatCurrency(salary.netSalary)}</Text>
      </View>

      {/* Attendance Summary */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Attendance Summary</Text>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>{salary.presentDays}</Text>
            <Text style={styles.statLabel}>Present</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#f44336' }]}>{salary.absentDays}</Text>
            <Text style={styles.statLabel}>Absent</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#ff9800' }]}>{salary.lateDays}</Text>
            <Text style={styles.statLabel}>Late</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={[styles.statValue, { color: '#4caf50' }]}>{salary.onTimeDays}</Text>
            <Text style={styles.statLabel}>On Time</Text>
          </View>
        </View>
        <Text style={styles.infoText}>
          Working Days: {salary.totalWorkingDays} | On-Time: {salary.onTimePercentage.toFixed(1)}%
        </Text>
      </View>

      {/* Salary Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Salary Breakdown</Text>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Base Salary</Text>
          <Text style={styles.breakdownValue}>{SalaryService.formatCurrency(salary.baseSalary)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={styles.breakdownLabel}>Earned Salary</Text>
          <Text style={styles.breakdownValue}>{SalaryService.formatCurrency(salary.earnedSalary)}</Text>
        </View>
        <View style={styles.breakdownRow}>
          <Text style={[styles.breakdownLabel, { color: '#f44336' }]}>Deductions</Text>
          <Text style={[styles.breakdownValue, { color: '#f44336' }]}>
            -{SalaryService.formatCurrency(salary.deductions)}
          </Text>
        </View>
        {salary.performanceBonus > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: '#4caf50' }]}>Performance Bonus</Text>
            <Text style={[styles.breakdownValue, { color: '#4caf50' }]}>
              +{SalaryService.formatCurrency(salary.performanceBonus)}
            </Text>
          </View>
        )}
        {salary.overtimeBonus > 0 && (
          <View style={styles.breakdownRow}>
            <Text style={[styles.breakdownLabel, { color: '#4caf50' }]}>Overtime Bonus</Text>
            <Text style={[styles.breakdownValue, { color: '#4caf50' }]}>
              +{SalaryService.formatCurrency(salary.overtimeBonus)}
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
        <TouchableOpacity
          style={styles.historyButton}
          onPress={() => showHistory ? setShowHistory(false) : fetchSalaryHistory()}
        >
          <Text style={styles.historyButtonText}>
            {showHistory ? 'Current Month' : 'View History'}
          </Text>
        </TouchableOpacity>
      </View>

      {!showHistory ? (
        <>
          {currentSalary ? (
            renderSalaryCard(currentSalary)
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No salary data available for current month</Text>
              <Text style={styles.emptySubtext}>
                Your salary will be calculated by your manager at the end of the month
              </Text>
            </View>
          )}
        </>
      ) : (
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
      )}
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
});

export default EmployeeSalaryScreen;
