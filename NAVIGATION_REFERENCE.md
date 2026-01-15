# Frontend Screen Navigation Quick Reference

## All Available Screens

### Authentication
- `LoginScreen.tsx` - User login with JWT authentication
- `RegisterScreen.tsx` - New user registration

### Employee Screens
- `EmployeeDashboard.tsx` - Main dashboard with check-in/out
- `AttendanceHistoryScreen.tsx` - View attendance records
- `LocationMapScreen.tsx` - View current location and geofences
- `ProfileScreen.tsx` - View/edit profile and access settings

### Manager Screens
- `ManagerDashboard.tsx` - Team overview and management
- `LocationMapScreen.tsx` - View team locations
- `GeofenceManagementScreen.tsx` - Create/edit geofences
- `ReportsScreen.tsx` - Generate and view reports
- `ProfileScreen.tsx` - Manager profile and settings

### Admin Screens
- `AdminDashboard.tsx` - System overview and user management
- `AddUserScreen.tsx` - Create new user accounts
- `GeofenceManagementScreen.tsx` - Manage all geofences
- `ReportsScreen.tsx` - System-wide reports
- `ProfileScreen.tsx` - Admin profile and settings

### Settings Screens (All Roles)
- `ChangePasswordScreen.tsx` - Change account password
- `NotificationSettingsScreen.tsx` - Configure notifications
- `PrivacySettingsScreen.tsx` - Privacy and data settings

## Navigation Routes

### From Dashboard Screens

**EmployeeDashboard**
- No quick action navigation (uses bottom tabs)

**ManagerDashboard**
```tsx
navigation.navigate('Reports')       // View Reports button
navigation.navigate('Geofences')     // Geofences button
```

**AdminDashboard**
```tsx
navigation.navigate('AddUser')       // Add User button
navigation.navigate('Reports')       // Reports button
```

### From ProfileScreen (All Roles)

```tsx
navigation.navigate('ChangePassword')          // Change Password
navigation.navigate('NotificationSettings')    // Notification Settings
navigation.navigate('PrivacySettings')        // Privacy Settings
```

### Bottom Tab Navigation

**Employee Tabs**
- Dashboard → `EmployeeDashboard`
- Location → `LocationMapScreen`
- History → `AttendanceHistoryScreen`
- Profile → `ProfileScreen`

**Manager Tabs**
- Dashboard → `ManagerDashboard`
- Team Map → `LocationMapScreen`
- Geofences → `GeofenceManagementScreen`
- Profile → `ProfileScreen`

**Admin Tabs**
- Dashboard → `AdminDashboard`
- Geofences → `GeofenceManagementScreen`
- Users → `AdminDashboard` (user management view)
- Profile → `ProfileScreen`

## File Locations

```
frontend/src/screens/
├── auth/
│   ├── LoginScreen.tsx
│   └── RegisterScreen.tsx
├── employee/
│   └── EmployeeDashboard.tsx
├── manager/
│   └── ManagerDashboard.tsx
├── admin/
│   ├── AdminDashboard.tsx
│   └── AddUserScreen.tsx
├── attendance/
│   └── AttendanceHistoryScreen.tsx
├── location/
│   └── LocationMapScreen.tsx
├── geofence/
│   └── GeofenceManagementScreen.tsx
├── profile/
│   └── ProfileScreen.tsx
├── reports/
│   └── ReportsScreen.tsx
└── settings/
    ├── ChangePasswordScreen.tsx
    ├── NotificationSettingsScreen.tsx
    └── PrivacySettingsScreen.tsx
```

## Key Features by Screen

### Check-in/Out
- **Screen**: EmployeeDashboard
- **Features**: Location-based check-in/out, geofence validation

### Attendance Tracking
- **Screen**: AttendanceHistoryScreen
- **Features**: View history, filter by status, search by date

### Location Tracking
- **Screen**: LocationMapScreen
- **Features**: Real-time location, nearby geofences, distance calculation

### Geofence Management
- **Screen**: GeofenceManagementScreen
- **Features**: Create, edit, delete geofences with map selection

### Reports
- **Screen**: ReportsScreen
- **Features**: Generate reports, export PDF/CSV, date range selection

### User Management
- **Screen**: AdminDashboard & AddUserScreen
- **Features**: Add, edit, delete users, role assignment

### Settings
- **Screens**: ChangePasswordScreen, NotificationSettingsScreen, PrivacySettingsScreen
- **Features**: Password change, notification preferences, privacy controls

## API Integration

All screens are integrated with backend APIs through `ApiService`:

```typescript
import { ApiService } from '../services/ApiService';

// Example usage
const response = await ApiService.get('/api/endpoint');
const data = await ApiService.post('/api/endpoint', payload);
```

### Key API Endpoints Used

**Authentication**
- POST `/auth/login` - User login
- POST `/auth/register` - User registration
- POST `/auth/change-password` - Change password

**Attendance**
- POST `/attendance/check-in` - Check in
- POST `/attendance/check-out` - Check out
- GET `/attendance/history` - Get attendance records

**Location**
- GET `/location/current` - Get current location
- GET `/location/nearby-geofences` - Get nearby geofences

**Geofences**
- GET `/geofences` - Get all geofences
- POST `/geofences` - Create geofence
- PUT `/geofences/:id` - Update geofence
- DELETE `/geofences/:id` - Delete geofence

**Users (Admin)**
- GET `/admin/users` - Get all users
- POST `/admin/users/create` - Create user
- DELETE `/admin/users/:id` - Delete user

**Reports (Manager/Admin)**
- GET `/reports` - Get reports
- POST `/reports/generate` - Generate report

## State Management

All screens use React hooks for state management:
- `useState` - Local component state
- `useEffect` - Side effects and data loading
- `useNavigation` - React Navigation hook
- `AsyncStorage` - Persistent storage for settings

## Common Patterns

### Loading State
```tsx
const [loading, setLoading] = useState(true);
// Show ActivityIndicator while loading
```

### Error Handling
```tsx
try {
  // API call
} catch (error) {
  Alert.alert('Error', error.message);
}
```

### Pull to Refresh
```tsx
const [refreshing, setRefreshing] = useState(false);
<ScrollView refreshControl={
  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
}>
```

### Form Validation
```tsx
if (!field.trim()) {
  Alert.alert('Validation Error', 'Field is required');
  return;
}
```

## Styling

All screens follow a consistent design system:
- Professional black/white theme
- Material Design principles
- Responsive layouts
- Consistent spacing (16px)
- Card-based UI with elevation
- Clear typography hierarchy
