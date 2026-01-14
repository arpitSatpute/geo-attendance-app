import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
} from 'react-native';
import MapView, { Marker, Circle, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { ApiService } from '../../services/ApiService';

interface Geofence {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  radius: number;
  description?: string;
  active: boolean;
}

const GeofenceManagementScreen = () => {
  const [geofences, setGeofences] = useState<Geofence[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingGeofence, setEditingGeofence] = useState<Geofence | null>(null);
  const [currentLocation, setCurrentLocation] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    latitude: '',
    longitude: '',
    radius: '',
    description: '',
  });

  useEffect(() => {
    loadGeofences();
    getCurrentLocation();
  }, []);

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
      }
    } catch (error) {
      console.error('Error getting location:', error);
    }
  };

  const loadGeofences = async () => {
    try {
      setLoading(true);
      const response = await ApiService.get('/geofences').catch(() => ({ data: [] }));
      // Map backend field names to frontend interface
      const mappedGeofences = (response.data || []).map((geo: any) => ({
        id: geo.id,
        name: geo.name,
        latitude: geo.latitude,
        longitude: geo.longitude,
        radius: geo.radiusMeters || geo.radius || 100,
        description: geo.description,
        active: geo.isActive !== undefined ? geo.isActive : geo.active,
      }));
      setGeofences(mappedGeofences);
    } catch (error) {
      console.error('Error loading geofences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingGeofence(null);
    const lat = currentLocation?.coords?.latitude?.toString() || '';
    const lng = currentLocation?.coords?.longitude?.toString() || '';
    setFormData({
      name: '',
      latitude: lat,
      longitude: lng,
      radius: '100',
      description: '',
    });
    setModalVisible(true);
  };

  const handleEdit = (geofence: Geofence) => {
    setEditingGeofence(geofence);
    setFormData({
      name: geofence.name || '',
      latitude: geofence.latitude?.toString() || '',
      longitude: geofence.longitude?.toString() || '',
      radius: geofence.radius?.toString() || '100',
      description: geofence.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.latitude || !formData.longitude || !formData.radius) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    try {
      const geofenceData = {
        name: formData.name,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        radiusMeters: parseFloat(formData.radius),
        description: formData.description || '',
        isActive: editingGeofence ? editingGeofence.active : true,
        geofenceType: 'CIRCLE',
      };

      console.log('Saving geofence data:', geofenceData);

      if (editingGeofence) {
        await ApiService.put(`/geofences/${editingGeofence.id}`, geofenceData);
      } else {
        const response = await ApiService.post('/geofences', geofenceData);
        console.log('Create geofence response:', response);
      }

      Alert.alert('Success', `Geofence ${editingGeofence ? 'updated' : 'created'} successfully`);
      setModalVisible(false);
      loadGeofences();
    } catch (error: any) {
      console.error('Save geofence error:', error);
      console.error('Error response:', error?.response?.data);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to save geofence');
    }
  };

  const handleToggleActive = async (geofence: Geofence) => {
    try {
      const updatedData = {
        name: geofence.name,
        latitude: geofence.latitude,
        longitude: geofence.longitude,
        radiusMeters: geofence.radius,
        description: geofence.description || '',
        isActive: !geofence.active,
        geofenceType: 'CIRCLE',
      };
      
      console.log('Toggling geofence:', geofence.id, 'to active:', updatedData.isActive);
      const response = await ApiService.put(`/geofences/${geofence.id}`, updatedData);
      console.log('Toggle response:', response);
      
      Alert.alert('Success', `Geofence ${updatedData.isActive ? 'activated' : 'deactivated'} successfully`);
      await loadGeofences();
    } catch (error: any) {
      console.error('Toggle active error:', error);
      Alert.alert('Error', error?.response?.data?.message || 'Failed to update geofence status');
    }
  };

  const handleDelete = (geofence: Geofence) => {
    Alert.alert(
      'Delete Geofence',
      `Are you sure you want to delete "${geofence.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await ApiService.delete(`/geofences/${geofence.id}`);
              Alert.alert('Success', 'Geofence deleted successfully');
              loadGeofences();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete geofence');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#000" />
        <Text style={styles.loadingText}>Loading geofences...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Geofence Management</Text>
          <Text style={styles.subtitle}>{geofences.length} active geofences</Text>
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddNew}>
          <Text style={styles.addButtonText}>+ Add New</Text>
        </TouchableOpacity>
      </View>

      {/* Geofence List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {geofences.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📍</Text>
            <Text style={styles.emptyText}>No geofences yet</Text>
            <Text style={styles.emptySubtext}>Tap "Add New" to create your first geofence</Text>
          </View>
        ) : (
          geofences.map((geofence) => (
            <View key={geofence.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <Text style={styles.cardTitle}>{geofence.name}</Text>
                  {geofence.description && (
                    <Text style={styles.cardDescription}>{geofence.description}</Text>
                  )}
                </View>
                <View style={[styles.statusBadge, geofence.active ? styles.statusActive : styles.statusInactive]}>
                  <Text style={styles.statusText}>
                    {geofence.active ? 'Active' : 'Inactive'}
                  </Text>
                </View>
              </View>

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Latitude:</Text>
                  <Text style={styles.infoValue}>{geofence.latitude.toFixed(6)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Longitude:</Text>
                  <Text style={styles.infoValue}>{geofence.longitude.toFixed(6)}</Text>
                </View>
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Radius:</Text>
                  <Text style={styles.infoValue}>{geofence.radius}m</Text>
                </View>
              </View>

              <View style={styles.cardActions}>
                <TouchableOpacity 
                  style={[styles.actionButton, geofence.active ? styles.deactivateButton : styles.activateButton]} 
                  onPress={() => handleToggleActive(geofence)}
                >
                  <Text style={styles.actionButtonText}>
                    {geofence.active ? '⏸️ Deactivate' : '▶️ Activate'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.editButton]} 
                  onPress={() => handleEdit(geofence)}
                >
                  <Text style={styles.actionButtonText}>✏️ Edit</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[styles.actionButton, styles.deleteButton]} 
                  onPress={() => handleDelete(geofence)}
                >
                  <Text style={styles.actionButtonText}>🗑️ Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* Add/Edit Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingGeofence ? 'Edit Geofence' : 'Add New Geofence'}
            </Text>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Map Preview */}
              {formData.latitude && formData.longitude && (
                <View style={styles.mapPreviewContainer}>
                  <MapView
                    style={styles.mapPreview}
                    provider={PROVIDER_GOOGLE}
                    initialRegion={{
                      latitude: parseFloat(formData.latitude) || 0,
                      longitude: parseFloat(formData.longitude) || 0,
                      latitudeDelta: 0.005,
                      longitudeDelta: 0.005,
                    }}
                    scrollEnabled={false}
                    zoomEnabled={false}
                  >
                    <Marker
                      coordinate={{
                        latitude: parseFloat(formData.latitude) || 0,
                        longitude: parseFloat(formData.longitude) || 0,
                      }}
                      title={formData.name || 'New Geofence'}
                    />
                    <Circle
                      center={{
                        latitude: parseFloat(formData.latitude) || 0,
                        longitude: parseFloat(formData.longitude) || 0,
                      }}
                      radius={parseFloat(formData.radius) || 100}
                      fillColor="rgba(76, 175, 80, 0.2)"
                      strokeColor="#4CAF50"
                      strokeWidth={2}
                    />
                  </MapView>
                  <Text style={styles.mapPreviewLabel}>Preview</Text>
                </View>
              )}

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Name *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.name}
                  onChangeText={(text) => setFormData({...formData, name: text})}
                  placeholder="e.g., Main Office"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Latitude *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.latitude}
                  onChangeText={(text) => setFormData({...formData, latitude: text})}
                  placeholder="e.g., 37.7749"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Longitude *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.longitude}
                  onChangeText={(text) => setFormData({...formData, longitude: text})}
                  placeholder="e.g., -122.4194"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Radius (meters) *</Text>
                <TextInput
                  style={styles.input}
                  value={formData.radius}
                  onChangeText={(text) => setFormData({...formData, radius: text})}
                  placeholder="e.g., 100"
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.description}
                  onChangeText={(text) => setFormData({...formData, description: text})}
                  placeholder="Optional description"
                  multiline
                  numberOfLines={3}
                />
              </View>
            </ScrollView>

            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={styles.cancelButton} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={styles.saveButton} 
                onPress={handleSave}
              >
                <Text style={styles.saveButtonText}>
                  {editingGeofence ? 'Update' : 'Create'}
                </Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexWrap: 'wrap',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    backgroundColor: '#000',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyIcon: {
    fontSize: 60,
    marginBottom: 15,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 15,
    flexWrap: 'wrap',
  },
  cardHeaderLeft: {
    flex: 1,
    marginRight: 10,
    minWidth: 150,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    marginTop: 5,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusActive: {
    backgroundColor: '#4CAF50',
  },
  statusInactive: {
    backgroundColor: '#999',
  },
  statusText: {
    fontSize: 12,
    color: '#fff',
    fontWeight: '600',
  },
  cardBody: {
    marginBottom: 15,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
  },
  cardActions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -5,
    marginTop: 5,
  },
  actionButton: {
    minWidth: '30%',
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 8,
    marginHorizontal: 5,
    marginBottom: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  activateButton: {
    backgroundColor: '#4CAF50',
  },
  deactivateButton: {
    backgroundColor: '#FF9800',
  },
  editButton: {
    backgroundColor: '#007AFF',
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    width: '100%',
    maxWidth: 500,
    maxHeight: '85%',
  },
  mapPreviewContainer: {
    marginBottom: 20,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  mapPreview: {
    width: '100%',
    height: 200,
  },
  mapPreviewLabel: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    fontSize: 12,
    fontWeight: '600',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#000',
  },
  inputGroup: {
    marginBottom: 15,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
    marginHorizontal: -5,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 15,
    paddingHorizontal: 12,
    marginHorizontal: 5,
    borderRadius: 8,
    backgroundColor: '#000',
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

export default GeofenceManagementScreen;
