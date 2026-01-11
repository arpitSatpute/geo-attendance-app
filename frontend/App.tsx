import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Provider } from 'react-redux';
import { store } from './src/store';
import * as Location from 'expo-location';

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

// Import services
import { LocationService } from './src/services/LocationService';
import { AuthService } from './src/services/AuthService';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Auth Stack
const AuthStack = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animationEnabled: true,
      }}
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
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
        }}
      />
      <Tab.Screen
        name="Location"
        component={LocationMapScreen}
        options={{
          tabBarLabel: 'Location',
          headerTitle: 'My Location',
        }}
      />
      <Tab.Screen
        name="History"
        component={AttendanceHistoryScreen}
        options={{
          tabBarLabel: 'History',
          headerTitle: 'Attendance History',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Manager Tab Navigator
const ManagerTabNavigator = () => {
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
        }}
      />
      <Tab.Screen
        name="Map"
        component={LocationMapScreen}
        options={{
          tabBarLabel: 'Team Map',
          headerTitle: 'Team Locations',
        }}
      />
      <Tab.Screen
        name="Geofences"
        component={GeofenceManagementScreen}
        options={{
          tabBarLabel: 'Geofences',
          headerTitle: 'Manage Geofences',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
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
        }}
      />
      <Tab.Screen
        name="Geofences"
        component={GeofenceManagementScreen}
        options={{
          tabBarLabel: 'Geofences',
          headerTitle: 'Manage Geofences',
        }}
      />
      <Tab.Screen
        name="Users"
        component={AdminDashboard}
        options={{
          tabBarLabel: 'Users',
          headerTitle: 'User Management',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarLabel: 'Profile',
          headerTitle: 'My Profile',
        }}
      />
    </Tab.Navigator>
  );
};

// Root Navigator
const RootNavigator = ({ isLoggedIn, userRole }) => {
  if (!isLoggedIn) {
    return <AuthStack />;
  }

  switch (userRole) {
    case 'EMPLOYEE':
      return <EmployeeTabNavigator />;
    case 'MANAGER':
      return <ManagerTabNavigator />;
    case 'ADMIN':
      return <AdminTabNavigator />;
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
  }, []);

  const initializeApp = async () => {
    try {
      // Check if user is already logged in
      const token = await AuthService.getToken();
      if (token) {
        setIsLoggedIn(true);
        const user = await AuthService.getCurrentUser();
        setUserRole(user.role);
      }

      // Request location permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        // Start location tracking
        LocationService.startLocationTracking();
      }

      // Setup Firebase Cloud Messaging
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        // Get FCM token
        const token = await messaging().getToken();
        console.log('FCM Token:', token);

        // Listen for messages
        messaging().onMessage(async (remoteMessage) => {
          console.log('Notification received:', remoteMessage);
        });

        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
          console.log('Background notification:', remoteMessage);
        });
      }

      setIsLoading(false);
    } catch (error) {
      console.error('Error initializing app:', error);
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return null; // Show splash screen
  }

  return (
    <Provider store={store}>
      <NavigationContainer>
        <RootNavigator isLoggedIn={isLoggedIn} userRole={userRole} />
      </NavigationContainer>
    </Provider>
  );
}
