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
} from 'react-native';
import { ApiService } from '../../services/ApiService';

interface Team {
  id: string;
  name: string;
  managerId: string;
  employeeIds: string[];
  geofenceId?: string;
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

  const handleRemoveEmployee = async (teamId: string, employeeId: string) => {
    try {
      await ApiService.post(`/teams/${teamId}/remove-employee?employeeId=${employeeId}`);
      setEmployees((prev) => prev.filter((emp) => emp.id !== employeeId));
      loadTeams();
      Alert.alert('Success', 'Employee removed from team');
    } catch (error) {
      Alert.alert('Error', 'Failed to remove employee');
    }
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
              <Text style={styles.teamName}>{team.name}</Text>
              <Text style={styles.teamInfo}>Employees: {team.employeeIds ? team.employeeIds.length : 0}</Text>
              <Text style={styles.teamInfo}>Geofence: {team.geofenceId ? team.geofenceId : 'Not set'}</Text>
              <View style={{ flexDirection: 'row', gap: 10 }}>
                <TouchableOpacity style={styles.addEmpButton} onPress={() => setAddEmployeeModal({ open: true, teamId: team.id })}>
                  <Text style={styles.addEmpButtonText}>+ Add Employee</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.showEmpButton} onPress={() => handleShowEmployees(team.id)}>
                  <Text style={styles.showEmpButtonText}>View Employees</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.setGeofenceButton} onPress={() => handleShowGeofenceModal(team.id)}>
                  <Text style={styles.setGeofenceButtonText}>Set Geofence</Text>
                </TouchableOpacity>
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
                    <Text style={styles.employeeName}>{emp.firstName} {emp.lastName}</Text>
                    <Text style={styles.employeeEmail}>{emp.email}</Text>
                    <TouchableOpacity style={styles.removeEmpButton} onPress={() => handleRemoveEmployee(showEmployeesModal.teamId!, emp.id)}>
                      <Text style={styles.removeEmpButtonText}>Remove</Text>
                    </TouchableOpacity>
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
              <ScrollView style={{ maxHeight: 250 }}>
                {availableGeofences.map((geo) => (
                  <TouchableOpacity
                    key={geo.id}
                    style={selectedGeofenceId === geo.id ? styles.selectedGeofence : styles.geofenceRow}
                    onPress={() => setSelectedGeofenceId(geo.id)}
                  >
                    <Text style={styles.geofenceName}>{geo.name}</Text>
                    <Text style={styles.geofenceDesc}>{geo.description || ''}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f5f5' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#000' },
  addButton: { backgroundColor: '#000', paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
  addButtonText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  emptyText: { textAlign: 'center', color: '#999', marginTop: 40 },
  teamCard: { backgroundColor: '#fff', borderRadius: 10, padding: 20, marginBottom: 15, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4, elevation: 2 },
  teamName: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  teamInfo: { fontSize: 14, color: '#666', marginBottom: 2 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#fff', borderRadius: 12, padding: 30, width: 320 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#000' },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 20, fontSize: 16 },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 10 },
  cancelButton: { padding: 12, borderRadius: 8, backgroundColor: '#f5f5f5', alignItems: 'center' },
  cancelButtonText: { fontSize: 16, fontWeight: '600', color: '#666' },
  saveButton: { padding: 12, borderRadius: 8, backgroundColor: '#000', alignItems: 'center' },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#fff' },
  addEmpButton: { marginTop: 10, backgroundColor: '#2196F3', borderRadius: 6, padding: 10, alignItems: 'center' },
  addEmpButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  showEmpButton: { marginTop: 10, backgroundColor: '#4CAF50', borderRadius: 6, padding: 10, alignItems: 'center' },
  showEmpButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  setGeofenceButton: { marginTop: 10, backgroundColor: '#673AB7', borderRadius: 6, padding: 10, alignItems: 'center' },
  setGeofenceButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  employeeRow: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 8 },
  employeeName: { fontSize: 16, fontWeight: '500', color: '#222' },
  employeeEmail: { fontSize: 13, color: '#666' },
  removeEmpButton: { marginTop: 4, backgroundColor: '#F44336', borderRadius: 6, padding: 6, alignItems: 'center', alignSelf: 'flex-start' },
  removeEmpButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  geofenceRow: { borderBottomWidth: 1, borderBottomColor: '#eee', paddingVertical: 10, paddingHorizontal: 5 },
  selectedGeofence: { borderBottomWidth: 1, borderBottomColor: '#673AB7', backgroundColor: '#ede7f6', paddingVertical: 10, paddingHorizontal: 5 },
  geofenceName: { fontSize: 16, fontWeight: '500', color: '#222' },
  geofenceDesc: { fontSize: 13, color: '#666' },
});

export default TeamManagementScreen;
