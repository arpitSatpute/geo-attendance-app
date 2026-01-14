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

interface NotificationSettings {
  pushEnabled: boolean;
  emailEnabled: boolean;
  checkInReminder: boolean;
  checkOutReminder: boolean;
  teamUpdates: boolean;
  leaveApprovals: boolean;
  systemAlerts: boolean;
  weeklyReports: boolean;
}

const NotificationSettingsScreen = ({ navigation }: any) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    pushEnabled: true,
    emailEnabled: true,
    checkInReminder: true,
    checkOutReminder: true,
    teamUpdates: false,
    leaveApprovals: true,
    systemAlerts: true,
    weeklyReports: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) {
        setSettings(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const saveSettings = async (newSettings: NotificationSettings) => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(newSettings));
      setSettings(newSettings);
      Alert.alert('Success', 'Settings saved successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    saveSettings(newSettings);
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Text style={styles.icon}>🔔</Text>
        </View>

        <Text style={styles.title}>Notification Settings</Text>
        <Text style={styles.subtitle}>
          Manage how you receive notifications
        </Text>

        {/* General Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>General</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive push notifications on your device
              </Text>
            </View>
            <Switch
              value={settings.pushEnabled}
              onValueChange={() => toggleSetting('pushEnabled')}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Email Notifications</Text>
              <Text style={styles.settingDescription}>
                Receive notifications via email
              </Text>
            </View>
            <Switch
              value={settings.emailEnabled}
              onValueChange={() => toggleSetting('emailEnabled')}
              trackColor={{ false: '#e0e0e0', true: '#007AFF' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Attendance Reminders */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Attendance Reminders</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Check-in Reminder</Text>
              <Text style={styles.settingDescription}>
                Remind me to check in at work start time
              </Text>
            </View>
            <Switch
              value={settings.checkInReminder}
              onValueChange={() => toggleSetting('checkInReminder')}
              trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Check-out Reminder</Text>
              <Text style={styles.settingDescription}>
                Remind me to check out at work end time
              </Text>
            </View>
            <Switch
              value={settings.checkOutReminder}
              onValueChange={() => toggleSetting('checkOutReminder')}
              trackColor={{ false: '#e0e0e0', true: '#4CAF50' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Team & Updates */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Team & Updates</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Team Updates</Text>
              <Text style={styles.settingDescription}>
                Get notified about team member activities
              </Text>
            </View>
            <Switch
              value={settings.teamUpdates}
              onValueChange={() => toggleSetting('teamUpdates')}
              trackColor={{ false: '#e0e0e0', true: '#FF9800' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Leave Approvals</Text>
              <Text style={styles.settingDescription}>
                Notify me about leave requests and approvals
              </Text>
            </View>
            <Switch
              value={settings.leaveApprovals}
              onValueChange={() => toggleSetting('leaveApprovals')}
              trackColor={{ false: '#e0e0e0', true: '#FF9800' }}
              thumbColor="#fff"
            />
          </View>
        </View>

        {/* Reports & System */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Reports & System</Text>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>System Alerts</Text>
              <Text style={styles.settingDescription}>
                Important system updates and maintenance
              </Text>
            </View>
            <Switch
              value={settings.systemAlerts}
              onValueChange={() => toggleSetting('systemAlerts')}
              trackColor={{ false: '#e0e0e0', true: '#FF3B30' }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Weekly Reports</Text>
              <Text style={styles.settingDescription}>
                Receive weekly attendance summary reports
              </Text>
            </View>
            <Switch
              value={settings.weeklyReports}
              onValueChange={() => toggleSetting('weeklyReports')}
              trackColor={{ false: '#e0e0e0', true: '#4ECDC4' }}
              thumbColor="#fff"
            />
          </View>
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

export default NotificationSettingsScreen;
