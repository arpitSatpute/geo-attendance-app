import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store } from './src/store';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';

// Import screens
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';
import EmployeeDashboard from './src/screens/employee/EmployeeDashboard';
import ManagerDashboard from './src/screens/manager/ManagerDashboard';
import AdminDashboard from './src/screens/admin/AdminDashboard';
import AttendanceHistoryScreen from './src/screens/attendance/AttendanceHistoryScreen';
import LocationMapScreen from './src/screens/location/LocationMapScreen';
import GeofenceManagementScreen from './src/screens/geofence/GeofenceManagementScreen';
import ProfileScreen from './src/screens/profile/ProfileScreen';
import ReportsScreen from './src/screens/reports/ReportsScreen';
import ChangePasswordScreen from './src/screens/settings/ChangePasswordScreen';
import NotificationSettingsScreen from './src/screens/settings/NotificationSettingsScreen';
import PrivacySettingsScreen from './src/screens/settings/PrivacySettingsScreen';
import AddUserScreen from './src/screens/admin/AddUserScreen';

// Import services
import { LocationService } from './src/services/LocationService';
import { AuthService } from './src/services/AuthService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Import face screens
import FaceVerificationScreen from './src/screens/FaceVerificationScreen';
import FaceRegistrationScreen from './src/screens/FaceRegistrationScreen';

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="FaceRegistration" component={FaceRegistrationScreen} />
    </Stack.Navigator>
  );
};

import LeaveApplicationScreen from './src/screens/employee/LeaveApplicationScreen';
import LeaveHistoryScreen from './src/screens/employee/LeaveHistoryScreen';
import EmployeeSalaryScreen from './src/screens/employee/EmployeeSalaryScreen';

// Employee Stack Navigator
const EmployeeStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="EmployeeTabs" component={EmployeeTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="LeaveApplication" component={LeaveApplicationScreen} options={{ headerTitle: 'Apply for Leave' }} />
      <Stack.Screen name="LeaveHistory" component={LeaveHistoryScreen} options={{ headerTitle: 'Leave History' }} />
      <Stack.Screen name="EmployeeSalary" component={EmployeeSalaryScreen} options={{ headerTitle: 'My Salary' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerTitle: 'Reports' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerTitle: 'Change Password' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerTitle: 'Notifications' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ headerTitle: 'Privacy' }} />
      <Stack.Screen
        name="FaceVerification"
        component={FaceVerificationScreen}
        options={{ headerTitle: 'Face Verification', headerShown: false }}
      />
      <Stack.Screen
        name="FaceRegistration"
        component={FaceRegistrationScreen}
        options={{ headerTitle: 'Face Registration', headerShown: false }}
      />
    </Stack.Navigator>
  );
};

// Employee Tab Navigator
const EmployeeTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#f5f5f5',
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={EmployeeDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          headerTitle: 'GeoAttendance Pro',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationMapScreen}
        options={{
          tabBarLabel: 'Location',
          headerTitle: 'My Location',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="location-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="History"
        component={AttendanceHistoryScreen}
        options={{
          tabBarLabel: 'History',
          headerTitle: 'Attendance History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="time-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Manager Stack Navigator
import TeamAttendanceScreen from './src/screens/manager/TeamAttendanceScreen';
import LeaveApprovalScreen from './src/screens/manager/LeaveApprovalScreen';
import ManagerSalaryScreen from './src/screens/manager/ManagerSalaryScreen';
import EmployeeManagementScreen from './src/screens/manager/EmployeeManagementScreen';
import EmployeeDetailScreen from './src/screens/manager/EmployeeDetailScreen';

const ManagerStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="ManagerTabs" component={ManagerTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="TeamAttendance" component={TeamAttendanceScreen} options={{ headerTitle: 'Team Attendance' }} />
      <Stack.Screen name="LeaveApproval" component={LeaveApprovalScreen} options={{ headerTitle: 'Leave Approval' }} />
      <Stack.Screen name="ManagerSalary" component={ManagerSalaryScreen} options={{ headerTitle: 'Salary Management' }} />
      <Stack.Screen name="EmployeeManagement" component={EmployeeManagementScreen} options={{ headerTitle: 'Employee Directory' }} />
      <Stack.Screen name="EmployeeDetail" component={EmployeeDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerTitle: 'Reports' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerTitle: 'Change Password' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerTitle: 'Notifications' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ headerTitle: 'Privacy' }} />
    </Stack.Navigator>
  );
};

// Manager Tab Navigator
const ManagerTabNavigator = () => {
  // Import TeamManagementScreen
  const TeamManagementScreen = require('./src/screens/manager/TeamManagementScreen').default;
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#f5f5f5',
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={ManagerDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          headerTitle: 'Team Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="grid-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Teams"
        component={TeamManagementScreen}
        options={{
          tabBarLabel: 'Teams',
          headerTitle: 'Team Management',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Map"
        component={LocationMapScreen}
        options={{
          tabBarLabel: 'Team Map',
          headerTitle: 'Team Locations',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="map-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Geofences"
        component={GeofenceManagementScreen}
        options={{
          tabBarLabel: 'Geofences',
          headerTitle: 'Manage Geofences',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-button-on-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Admin Stack Navigator
const AdminStack = () => {
  return (
    <Stack.Navigator>
      <Stack.Screen name="AdminTabs" component={AdminTabNavigator} options={{ headerShown: false }} />
      <Stack.Screen name="AddUser" component={AddUserScreen} options={{ headerTitle: 'Add User' }} />
      <Stack.Screen name="Reports" component={ReportsScreen} options={{ headerTitle: 'Reports' }} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} options={{ headerTitle: 'Change Password' }} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ headerTitle: 'Notifications' }} />
      <Stack.Screen name="PrivacySettings" component={PrivacySettingsScreen} options={{ headerTitle: 'Privacy' }} />
    </Stack.Navigator>
  );
};

// Admin Tab Navigator
const AdminTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#000000',
        tabBarInactiveTintColor: '#999999',
        tabBarStyle: {
          backgroundColor: '#f5f5f5',
          borderTopColor: '#e0e0e0',
        },
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Dashboard',
          headerTitle: 'System Overview',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="speedometer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Geofences"
        component={GeofenceManagementScreen}
        options={{
          tabBarLabel: 'Geofences',
          headerTitle: 'Manage Geofences',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="radio-button-on-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Users',
          headerTitle: 'User Management',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const RootNavigator = ({ isLoggedIn, userRole }: { isLoggedIn: boolean; userRole: string | null }) => {
  if (!isLoggedIn) {
    return <AuthStack />;
  }

  switch (userRole) {
    case 'EMPLOYEE':
      return <EmployeeStack />;
    case 'MANAGER':
      return <ManagerStack />;
    case 'ADMIN':
      return <AdminStack />;
    default:
      return <AuthStack />;
  }
};

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Initialize app
    initializeApp();

    // Poll for auth state changes every 500ms for faster login detection
    const authInterval = setInterval(refreshAuthState, 500);

    return () => clearInterval(authInterval);
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user is already logged in
      const token = await AuthService.getToken();
      if (token) {
        // Verify token is still valid (check expiry locally)
        const isValid = await AuthService.isAuthenticated();
        if (isValid) {
          setIsLoggedIn(true);
          try {
            const user = await AuthService.getCurrentUser();
            if (user?.role) {
              setUserRole(user.role);
            }
          } catch (userError) {
            // If we can't get user from API, try local storage
            console.log('Could not fetch user from API, using cached data');
          }
        }
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Start location tracking
        LocationService.startLocationTracking();
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
    }
  };

  // Function to refresh auth state (call this after login)
  const refreshAuthState = async () => {
    try {
      const token = await AuthService.getToken();
      if (token) {
        // Check if token is valid without calling API
        const isValid = await AuthService.isAuthenticated();
        if (isValid) {
          setIsLoggedIn(true);
          // Only update user role if we don't have it yet
          if (!userRole) {
            const user = await AuthService.getCurrentUser();
            if (user?.role) {
              setUserRole(user.role);
            }
          }
        } else {
          // Token expired
          setIsLoggedIn(false);
          setUserRole(null);
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
      }
    } catch (error) {
      // Don't logout on API errors - only on missing token
      console.log('Error refreshing auth state (non-critical):', error);
    }
  };

  if (isLoading) {
    return null; // Show splash screen
  }

  return (
    <Provider store={store}>
      <NavigationContainer key={isLoggedIn ? `logged-${userRole}` : 'logged-out'}>
        <RootNavigator isLoggedIn={isLoggedIn} userRole={userRole} />
      </NavigationContainer>
    </Provider>
  );
}
