import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { ApiService } from '../../services/ApiService';

const AddUserScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYEE',
    department: '',
    position: '',
  });
  const [loading, setLoading] = useState(false);

  const handleAddUser = async () => {
    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || !formData.password) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    try {
      setLoading(true);
      await ApiService.post('/admin/users/create', {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        password: formData.password,
        role: formData.role,
        department: formData.department,
        position: formData.position,
      });

      Alert.alert(
        'Success',
        'User created successfully',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to create user';
      Alert.alert('Error', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>👤</Text>
        </View>

        <Text style={styles.title}>Add New User</Text>
        <Text style={styles.subtitle}>
          Create a new user account for your organization
        </Text>

        <View style={styles.form}>
          {/* Personal Information */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Personal Information</Text>
          </View>

          <View style={styles.inputRow}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.inputLabel}>First Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.firstName}
                onChangeText={(text) => setFormData({ ...formData, firstName: text })}
                placeholder="John"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={styles.inputLabel}>Last Name *</Text>
              <TextInput
                style={styles.input}
                value={formData.lastName}
                onChangeText={(text) => setFormData({ ...formData, lastName: text })}
                placeholder="Doe"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Email *</Text>
            <TextInput
              style={styles.input}
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="john.doe@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Phone Number</Text>
            <TextInput
              style={styles.input}
              value={formData.phoneNumber}
              onChangeText={(text) => setFormData({ ...formData, phoneNumber: text })}
              placeholder="+1 (555) 123-4567"
              keyboardType="phone-pad"
            />
          </View>

          {/* Account Credentials */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Account Credentials</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              placeholder="Minimum 6 characters"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Confirm Password *</Text>
            <TextInput
              style={styles.input}
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              placeholder="Re-enter password"
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          {/* Role & Position */}
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Role & Position</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Role *</Text>
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              inputSearchStyle={styles.inputSearchStyle}
              iconStyle={styles.iconStyle}
              containerStyle={styles.dropdownContainer}
              data={[
                { label: 'Employee', value: 'EMPLOYEE' },
                { label: 'Manager', value: 'MANAGER' },
                { label: 'Admin', value: 'ADMIN' },
              ]}
              maxHeight={200}
              labelField="label"
              valueField="value"
              placeholder="Select Role"
              value={formData.role}
              onChange={item => setFormData({ ...formData, role: item.value })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Department</Text>
            <TextInput
              style={styles.input}
              value={formData.department}
              onChangeText={(text) => setFormData({ ...formData, department: text })}
              placeholder="e.g., Engineering, Sales, HR"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Position</Text>
            <TextInput
              style={styles.input}
              value={formData.position}
              onChangeText={(text) => setFormData({ ...formData, position: text })}
              placeholder="e.g., Senior Developer, Sales Rep"
            />
          </View>

          {/* Action Buttons */}
          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleAddUser}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Create User</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
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
  iconContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  form: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 15,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#007AFF',
  },
  inputRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  iconStyle: {
    width: 20,
    height: 20,
  },
  inputSearchStyle: {
    height: 40,
    fontSize: 16,
  },
  dropdownContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: '#999',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
});

export default AddUserScreen;
