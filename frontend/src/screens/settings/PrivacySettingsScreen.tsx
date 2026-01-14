import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface PrivacySettings {
  shareLocation: boolean;
  showOnlineStatus: boolean;
  shareWorkHours: boolean;
  allowTeamView: boolean;
  dataCollection: boolean;
  analyticsTracking: boolean;
  thirdPartySharing: boolean;
}

const PrivacySettingsScreen = ({ navigation }: any) => {
  const [settings, setSettings] = useState<PrivacySettings>({
    shareLocation: true,
    showOnlineStatus: true,
    shareWorkHours: true,
    allowTeamView: true,
    dataCollection: true,
    analyticsTracking: false,
    thirdPartySharing: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('privacySettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: PrivacySettings) => {
    try {
      await AsyncStorage.setItem('privacySettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      Alert.alert('Success', 'Privacy settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof PrivacySettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will clear all your local data. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await AsyncStorage.clear();
              Alert.alert('Success', 'All data cleared successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data');
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔒</Text>
        </View>

        <Text style={styles.title}>Privacy Settings</Text>
        <Text style={styles.subtitle}>
          Control your privacy and data sharing
        </Text>

        {/* Location & Status */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Status</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share Location</Text>
              <Text style={styles.settingDescription}>
                Allow the app to track and share your location
              </Text>
            </View>
            <Switch
              value={settings.shareLocation}
              onValueChange={() => toggleSetting('shareLocation')}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Show Online Status</Text>
              <Text style={styles.settingDescription}>
                Let others see when you're active
              </Text>
            </View>
            <Switch
              value={settings.showOnlineStatus}
              onValueChange={() => toggleSetting('showOnlineStatus')}
              trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Work Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Work Information</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Share Work Hours</Text>
              <Text style={styles.settingDescription}>
                Allow managers to view your work hours
              </Text>
            </View>
            <Switch
              value={settings.shareWorkHours}
              onValueChange={() => toggleSetting('shareWorkHours')}
              trackColor={{ false: '#e0e0e0', true: '#FF9800' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Allow Team View</Text>
              <Text style={styles.settingDescription}>
                Let team members see your profile and activities
              </Text>
            </View>
            <Switch
              value={settings.allowTeamView}
              onValueChange={() => toggleSetting('allowTeamView')}
              trackColor={{ false: '#e0e0e0', true: '#FF9800' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Data & Analytics */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data & Analytics</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Data Collection</Text>
              <Text style={styles.settingDescription}>
                Allow collection of usage data to improve the app
              </Text>
            </View>
            <Switch
              value={settings.dataCollection}
              onValueChange={() => toggleSetting('dataCollection')}
              trackColor={{ false: '#e0e0e0', true: '#4ECDC4' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Analytics Tracking</Text>
              <Text style={styles.settingDescription}>
                Help us improve by sharing anonymous usage stats
              </Text>
            </View>
            <Switch
              value={settings.analyticsTracking}
              onValueChange={() => toggleSetting('analyticsTracking')}
              trackColor={{ false: '#e0e0e0', true: '#4ECDC4' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Third-Party Sharing</Text>
              <Text style={styles.settingDescription}>
                Allow sharing data with trusted third parties
              </Text>
            </View>
            <Switch
              value={settings.thirdPartySharing}
              onValueChange={() => toggleSetting('thirdPartySharing')}
              trackColor={{ false: '#e0e0e0', true: '#FF3B30' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Data Management */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Management</Text>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Export Data', 'Your data export will be emailed to you')}
          >
            <Text style={styles.actionButtonText}>📥 Export My Data</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleClearData}
          >
            <Text style={[styles.actionButtonText, styles.dangerText]}>
              🗑️ Clear All Local Data
            </Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => Alert.alert('Privacy Policy', 'View our privacy policy at:\nhttps://example.com/privacy')}
          >
            <Text style={styles.actionButtonText}>📄 Privacy Policy</Text>
            <Text style={styles.actionArrow}>→</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← Back to Profile</Text>
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
  section: {
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  settingInfo: {
    flex: 1,
    marginRight: 15,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 13,
    color: '#999',
    lineHeight: 18,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  actionButtonText: {
    fontSize: 16,
    color: '#333',
  },
  dangerText: {
    color: '#FF3B30',
  },
  actionArrow: {
    fontSize: 18,
    color: '#999',
  },
  backButton: {
    padding: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default PrivacySettingsScreen;
