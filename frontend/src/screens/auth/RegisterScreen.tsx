import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { AuthService } from '../../services/AuthService';

const RegisterScreen = ({ navigation }: any) => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'EMPLOYEE', // Default role
    baseSalary: '',
    companyEmail: '',
  });
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    const { email, password, firstName, lastName } = formData;

    if (!email || !password || !firstName || !lastName) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      // Prepare registration data
      const registrationData = {
        ...formData,
        baseSalary: formData.role === 'EMPLOYEE' && formData.baseSalary ? parseFloat(formData.baseSalary) : null,
      };

      // Register user account
      await AuthService.register(registrationData);

      // Ask user to register face
      Alert.alert(
        'Account Created!',
        'Would you like to register your face now for daily attendance verification?',
        [
          {
            text: 'Skip for Now',
            style: 'cancel',
            onPress: () => {
              Alert.alert(
                'Registration Complete',
                'You can register your face later from profile settings.',
                [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
              );
            },
          },
          {
            text: 'Register Face',
            onPress: async () => {
              // Login temporarily to get token for face registration
              try {
                await AuthService.login(formData.email, formData.password);
                navigation.navigate('FaceRegistration', { isNewUser: true });
              } catch (loginError) {
                // If login fails, just go to login screen
                Alert.alert(
                  'Account Created',
                  'Please login to register your face.',
                  [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
                );
              }
            },
          },
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Create Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <TextInput
        style={styles.input}
        placeholder="First Name *"
        value={formData.firstName}
        onChangeText={(text) => setFormData({ ...formData, firstName: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Last Name *"
        value={formData.lastName}
        onChangeText={(text) => setFormData({ ...formData, lastName: text })}
      />

      <TextInput
        style={styles.input}
        placeholder="Email *"
        value={formData.email}
        onChangeText={(text) => setFormData({ ...formData, email: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Phone"
        value={formData.phone}
        onChangeText={(text) => setFormData({ ...formData, phone: text })}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Company Email *"
        value={formData.companyEmail}
        onChangeText={(text) => setFormData({ ...formData, companyEmail: text })}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password *"
        value={formData.password}
        onChangeText={(text) => setFormData({ ...formData, password: text })}
        secureTextEntry
      />

      {formData.role === 'EMPLOYEE' && (
        <TextInput
          style={styles.input}
          placeholder="Monthly Base Salary (₹)"
          value={formData.baseSalary}
          onChangeText={(text) => setFormData({ ...formData, baseSalary: text })}
          keyboardType="numeric"
        />
      )}

      <Text style={styles.roleLabel}>Account Type *</Text>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.placeholderStyle}
        selectedTextStyle={styles.selectedTextStyle}
        containerStyle={styles.dropdownContainer}
        data={[
          { label: 'Employee', value: 'EMPLOYEE' },
          { label: 'Manager', value: 'MANAGER' },
        ]}
        maxHeight={200}
        labelField="label"
        valueField="value"
        placeholder="Select Account Type"
        value={formData.role}
        onChange={item => setFormData({ ...formData, role: item.value })}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={handleRegister}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Creating Account...' : 'Register'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.linkButton}
        onPress={() => navigation.navigate('Login')}
      >
        <Text style={styles.linkText}>Already have an account? Login</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  input: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  roleLabel: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 10,
  },
  dropdown: {
    height: 50,
    backgroundColor: '#fff',
    borderRadius: 8,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    marginBottom: 15,
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
    borderColor: '#ddd',
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  linkButton: {
    marginTop: 20,
    marginBottom: 40,
    alignItems: 'center',
  },
  linkText: {
    color: '#007AFF',
    fontSize: 14,
  },
});

export default RegisterScreen;
