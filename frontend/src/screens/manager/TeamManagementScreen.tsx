import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { ApiService } from '../../services/ApiService';
import { Dropdown } from 'react-native-element-dropdown';
import { Ionicons } from '@expo/vector-icons';

interface Team {
  id: string;
  name: string;
  managerId: string;
  employeeIds: string[];
  geofenceId?: string;
  workStartTime?: string;
  workEndTime?: string;
  checkInDeadline?: string;
  checkOutAllowedFrom?: string;
}

interface WorkHoursData {
  workStartTime: string;
  workEndTime: string;
  checkInDeadline: string;
  checkOutAllowedFrom: string;
  checkInBufferMinutes: number;
  checkOutBufferMinutes: number;
}

const TeamManagementScreen = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [formData, setFormData] = useState({ name: '' });
  const [loading, setLoading] = useState(true);
  const [addEmployeeModal, setAddEmployeeModal] = useState<{ open: boolean; teamId: string | null }>({ open: false, teamId: null });
  const [employeeEmail, setEmployeeEmail] = useState('');
  const [showEmployeesModal, setShowEmployeesModal] = useState<{ open: boolean; teamId: string | null }>({ open: false, teamId: null });
  const [employees, setEmployees] = useState<any[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [showGeofenceModal, setShowGeofenceModal] = useState<{ open: boolean; teamId: string | null }>({ open: false, teamId: null });
  const [availableGeofences, setAvailableGeofences] = useState<any[]>([]);
  const [loadingGeofences, setLoadingGeofences] = useState(false);
  const [selectedGeofenceId, setSelectedGeofenceId] = useState<string | null>(null);

  // Work Hours Modal State
  const [showWorkHoursModal, setShowWorkHoursModal] = useState<{ open: boolean; teamId: string | null }>({ open: false, teamId: null });
  const [workHoursData, setWorkHoursData] = useState<WorkHoursData>({
    workStartTime: '09:00',
    workEndTime: '18:00',
    checkInDeadline: '10:00',
    checkOutAllowedFrom: '17:00',
    checkInBufferMinutes: 15,
    checkOutBufferMinutes: 0,
  });
  const [savingWorkHours, setSavingWorkHours] = useState(false);


  useEffect(() => {
    loadTeams();
  }, []);

  const loadTeams = async () => {
    setLoading(true);
    try {
      const response = await ApiService.get('/teams/manager/me');
      setTeams(response.data ?? []);
    } catch (error) {
      setTeams([]);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTeam = async () => {
    if (!formData.name) {
      Alert.alert('Error', 'Please enter a team name');
      return;
    }
    try {
      await ApiService.post('/teams/create', { name: formData.name });
      setModalVisible(false);
      setFormData({ name: '' });
      loadTeams();
    } catch (error) {
      Alert.alert('Error', 'Failed to create team');
    }
  };

  const handleAddEmployee = async () => {
    if (!employeeEmail || !addEmployeeModal.teamId) {
      Alert.alert('Error', 'Please enter an email');
      return;
    }
    try {
      await ApiService.post(`/teams/${addEmployeeModal.teamId}/add-employee?email=${encodeURIComponent(employeeEmail)}`);
      setEmployeeEmail('');
      setAddEmployeeModal({ open: false, teamId: null });
      loadTeams();
      Alert.alert('Success', 'Employee added to team');
    } catch (error) {
      Alert.alert('Error', 'Failed to add employee. Make sure the email is correct and belongs to an employee.');
    }
  };

  const handleShowEmployees = async (teamId: string) => {
    setShowEmployeesModal({ open: true, teamId });
    setLoadingEmployees(true);
    try {
      const response = await ApiService.get(`/teams/${teamId}/employees`);
      setEmployees(response.data ?? []);
    } catch (error) {
      setEmployees([]);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleRemoveEmployee = (teamId: string, employeeId: string, employeeName: string) => {
    Alert.alert(
      'Remove Employee',
      `Are you sure you want to remove ${employeeName} from this team?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.post(`/teams/${teamId}/remove-employee?employeeId=${employeeId}`);
              setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
              loadTeams();
              Alert.alert('Success', 'Employee removed from team');
            } catch (error) {
              Alert.alert('Error', 'Failed to remove employee');
            }
          },
        },
      ]
    );
  };

  const handleShowGeofenceModal = async (teamId: string) => {
    setShowGeofenceModal({ open: true, teamId });
    setLoadingGeofences(true);
    setSelectedGeofenceId(null);
    try {
      const response = await ApiService.get(`/teams/${teamId}/available-geofences`);
      setAvailableGeofences(response.data ?? []);
    } catch (error) {
      setAvailableGeofences([]);
    } finally {
      setLoadingGeofences(false);
    }
  };

  const handleSetGeofence = async () => {
    if (!showGeofenceModal.teamId || !selectedGeofenceId) {
      Alert.alert('Error', 'Please select a geofence');
      return;
    }
    try {
      await ApiService.post(`/teams/${showGeofenceModal.teamId}/set-geofence?geofenceId=${selectedGeofenceId}`);
      setShowGeofenceModal({ open: false, teamId: null });
      setSelectedGeofenceId(null);
      loadTeams();
      Alert.alert('Success', 'Geofence set for team');
    } catch (error) {
      Alert.alert('Error', 'Failed to set geofence');
    }
  };

  const handleShowWorkHoursModal = async (teamId: string) => {
    setShowWorkHoursModal({ open: true, teamId });
    try {
      const response = await ApiService.get(`/teams/${teamId}/work-hours`);
      const data = response.data;
      if (data.workStartTime) {
        setWorkHoursData({
          workStartTime: data.workStartTime || '09:00',
          workEndTime: data.workEndTime || '18:00',
          checkInDeadline: data.checkInDeadline || '10:00',
          checkOutAllowedFrom: data.checkOutAllowedFrom || '17:00',
          checkInBufferMinutes: data.checkInBufferMinutes || 15,
          checkOutBufferMinutes: data.checkOutBufferMinutes || 0,
        });
      }
    } catch (error) {
      // Use defaults if not configured
    }
  };

  const handleSaveWorkHours = async () => {
    if (!showWorkHoursModal.teamId) return;

    setSavingWorkHours(true);
    try {
      await ApiService.post(`/teams/${showWorkHoursModal.teamId}/work-hours`, workHoursData);
      setShowWorkHoursModal({ open: false, teamId: null });
      loadTeams();
      Alert.alert('Success', 'Work hours configured successfully');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to save work hours');
    } finally {
      setSavingWorkHours(false);
    }
  };


  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Team Management</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
          <Text style={styles.addButtonText}>+ Create Team</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.content}>
        {(!teams || teams.length === 0) ? (
          <Text style={styles.emptyText}>No teams found.</Text>
        ) : (
          teams.map((team) => (
            <View key={team.id} style={styles.teamCard}>
              <View style={styles.cardHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.teamName}>{team.name}</Text>
                  <Text style={styles.teamInfo}>Employees: {team.employeeIds ? team.employeeIds.length : 0}</Text>
                  <Text style={styles.teamInfo}>Geofence: {team.geofenceId ? team.geofenceId : 'Not set'}</Text>
                </View>
                <Dropdown
                  style={styles.menuDropdown}
                  placeholderStyle={styles.menuPlaceholder}
                  selectedTextStyle={styles.menuSelectedText}
                  containerStyle={styles.dropdownContainer}
                  data={[
                    { label: 'Add Employee', value: 'add' },
                    { label: 'View Employees', value: 'view' },
                    { label: 'Set Geofence', value: 'geofence' },
                    { label: 'Work Hours', value: 'hours' },
                  ]}
                  maxHeight={300}
                  labelField="label"
                  valueField="value"
                  placeholder=""
                  value=""
                  onChange={item => {
                    if (item.value === 'add') setAddEmployeeModal({ open: true, teamId: team.id });
                    if (item.value === 'view') handleShowEmployees(team.id);
                    if (item.value === 'geofence') handleShowGeofenceModal(team.id);
                    if (item.value === 'hours') handleShowWorkHoursModal(team.id);
                  }}
                  renderRightIcon={() => (
                    <Ionicons name="ellipsis-vertical" size={24} color="#64748b" />
                  )}
                  renderItem={item => (
                    <View style={styles.menuItem}>
                      <Text style={styles.menuItemText}>{item.label}</Text>
                    </View>
                  )}
                />
              </View>
            </View>
          ))
        )}
      </ScrollView>
      {/* Add Team Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Create New Team</Text>
            <TextInput
              style={styles.input}
              placeholder="Team Name"
              value={formData.name}
              onChangeText={(text) => setFormData({ name: text })}
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleCreateTeam}>
                <Text style={styles.saveButtonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Add Employee Modal */}
      <Modal visible={addEmployeeModal.open} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Employee by Email</Text>
            <TextInput
              style={styles.input}
              placeholder="Employee Email"
              value={employeeEmail}
              onChangeText={setEmployeeEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setAddEmployeeModal({ open: false, teamId: null })}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleAddEmployee}>
                <Text style={styles.saveButtonText}>Add</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Show Employees Modal */}
      <Modal visible={showEmployeesModal.open} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Team Employees</Text>
            {loadingEmployees ? (
              <Text>Loading...</Text>
            ) : employees.length === 0 ? (
              <Text>No employees in this team.</Text>
            ) : (
              <ScrollView style={{ maxHeight: 250 }}>
                {employees.map((emp, idx) => (
                  <View key={emp.id || idx} style={styles.employeeRow}>
                    <View style={styles.employeeInfoSimple}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.employeeName}>{emp.firstName} {emp.lastName}</Text>
                        <Text style={styles.employeeEmailSmall}>{emp.email}</Text>
                      </View>
                      <TouchableOpacity
                        style={styles.removeIconButton}
                        onPress={() => handleRemoveEmployee(showEmployeesModal.teamId!, emp.id, `${emp.firstName} ${emp.lastName}`)}
                      >
                        <Ionicons name="trash-outline" size={20} color="#F44336" />
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowEmployeesModal({ open: false, teamId: null })}>
                <Text style={styles.cancelButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Set Geofence Modal */}
      <Modal visible={showGeofenceModal.open} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Select Geofence for Team</Text>
            {loadingGeofences ? (
              <Text>Loading...</Text>
            ) : availableGeofences.length === 0 ? (
              <Text>No geofences available.</Text>
            ) : (
              <Dropdown
                style={styles.modalDropdown}
                placeholderStyle={styles.placeholderStyle}
                selectedTextStyle={styles.selectedTextStyle}
                containerStyle={styles.modalDropdownContainer}
                data={availableGeofences.map(geo => ({ label: geo.name, value: geo.id }))}
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select Geofence"
                value={selectedGeofenceId}
                onChange={item => setSelectedGeofenceId(item.value)}
              />
            )}
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowGeofenceModal({ open: false, teamId: null })}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveButton} onPress={handleSetGeofence}>
                <Text style={styles.saveButtonText}>Set</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Work Hours Modal */}
      <Modal visible={showWorkHoursModal.open} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Configure Work Hours</Text>
            <ScrollView style={{ maxHeight: 400 }}>
              <Text style={styles.inputLabel}>Work Start Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="09:00"
                value={workHoursData.workStartTime}
                onChangeText={(text) => setWorkHoursData({ ...workHoursData, workStartTime: text })}
              />

              <Text style={styles.inputLabel}>Work End Time (HH:MM)</Text>
              <TextInput
                style={styles.input}
                placeholder="18:00"
                value={workHoursData.workEndTime}
                onChangeText={(text) => setWorkHoursData({ ...workHoursData, workEndTime: text })}
              />

              <Text style={styles.inputLabel}>Check-in Deadline (HH:MM)</Text>
              <Text style={styles.inputHint}>After this time, employee will be marked absent</Text>
              <TextInput
                style={styles.input}
                placeholder="10:00"
                value={workHoursData.checkInDeadline}
                onChangeText={(text) => setWorkHoursData({ ...workHoursData, checkInDeadline: text })}
              />

              <Text style={styles.inputLabel}>Check-out Allowed From (HH:MM)</Text>
              <Text style={styles.inputHint}>Earliest time employees can check out</Text>
              <TextInput
                style={styles.input}
                placeholder="17:00"
                value={workHoursData.checkOutAllowedFrom}
                onChangeText={(text) => setWorkHoursData({ ...workHoursData, checkOutAllowedFrom: text })}
              />

              <Text style={styles.inputLabel}>Check-in Buffer (minutes)</Text>
              <Text style={styles.inputHint}>How early employees can check in before start time</Text>
              <TextInput
                style={styles.input}
                placeholder="15"
                keyboardType="numeric"
                value={String(workHoursData.checkInBufferMinutes)}
                onChangeText={(text) => setWorkHoursData({ ...workHoursData, checkInBufferMinutes: parseInt(text) || 0 })}
              />

              <Text style={styles.inputLabel}>Check-out Buffer (minutes)</Text>
              <TextInput
                style={styles.input}
                placeholder="0"
                keyboardType="numeric"
                value={String(workHoursData.checkOutBufferMinutes)}
                onChangeText={(text) => setWorkHoursData({ ...workHoursData, checkOutBufferMinutes: parseInt(text) || 0 })}
              />
            </ScrollView>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setShowWorkHoursModal({ open: false, teamId: null })}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.saveButton, savingWorkHours && styles.disabledButton]}
                onPress={handleSaveWorkHours}
                disabled={savingWorkHours}
              >
                <Text style={styles.saveButtonText}>{savingWorkHours ? 'Saving...' : 'Save'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, flexWrap: 'wrap' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  addButton: { backgroundColor: '#000', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  addButtonText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  content: { flex: 1, paddingHorizontal: 15, paddingVertical: 10 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  teamCard: { backgroundColor: '#fff', borderRadius: 10, padding: 16, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  teamName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 8 },
  teamInfo: { fontSize: 14, color: '#666', marginBottom: 4 },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  menuDropdown: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuPlaceholder: {
    display: 'none',
  },
  menuSelectedText: {
    display: 'none',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    minWidth: 200,
  },
  dropdownContainer: {
    width: 220,
    borderRadius: 12,
    overflow: 'hidden',
    marginLeft: -180, // Align right edge with ... icon
  },
  menuItemText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 30, width: '100%', maxWidth: 400 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginHorizontal: -5 },
  cancelButton: { padding: 12, paddingHorizontal: 16, marginHorizontal: 5, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButton: { padding: 12, paddingHorizontal: 16, marginHorizontal: 5, borderRadius: 8, backgroundColor: '#000', alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  addEmpButton: { backgroundColor: '#2196F3', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', width: '100%' },
  addEmpButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  showEmpButton: { backgroundColor: '#4CAF50', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', width: '100%' },
  showEmpButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  setGeofenceButton: { backgroundColor: '#673AB7', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', width: '100%' },
  setGeofenceButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  employeeRow: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, paddingHorizontal: 5 },
  employeeName: { fontSize: 16, fontWeight: '500', color: '#222', marginBottom: 2 },
  employeeInfoSimple: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  employeeEmailSmall: {
    fontSize: 12,
    color: '#666',
  },
  removeIconButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFEBEE',
  },
  geofenceRow: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 12, paddingHorizontal: 8 },
  selectedGeofence: { borderWidth: 2, borderColor: '#673AB7', backgroundColor: '#ede7f6', paddingVertical: 12, paddingHorizontal: 8, borderRadius: 6, marginBottom: 8 },
  geofenceName: { fontSize: 16, fontWeight: '500', color: '#222', marginBottom: 2 },
  geofenceDesc: { fontSize: 13, color: '#666' },
  workHoursButton: { backgroundColor: '#FF9800', borderRadius: 6, paddingVertical: 10, paddingHorizontal: 8, alignItems: 'center', width: '100%' },
  workHoursButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#333', marginBottom: 4, marginTop: 12 },
  inputHint: { fontSize: 12, color: '#888', marginBottom: 4 },
  disabledButton: { backgroundColor: '#999' },
  employeeTitle: { fontSize: 16, color: '#666', marginBottom: 15 },
  modalDropdown: {
    height: 50,
    backgroundColor: '#f8fafc',
    borderRadius: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 20,
  },
  modalDropdownContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#94a3b8',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
});

export default TeamManagementScreen;
