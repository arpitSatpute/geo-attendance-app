# Leave Management Feature - Complete Implementation Guide

## Overview
The Leave Management system is now fully functional with complete frontend integration. Employees can apply for leaves, view their history, and managers can approve/reject leave requests.

## Backend Components ✅

### 1. LeaveController.java
**Location:** `/backend/src/main/java/com/geoattendance/controller/LeaveController.java`

**Endpoints:**
- `POST /api/leaves` - Apply for leave (All roles)
- `GET /api/leaves/my-leaves` - Get employee's own leaves
- `GET /api/leaves` - Get all leaves (Manager/Admin)
- `POST /api/leaves/{id}/approve` - Approve leave (Manager/Admin)
- `POST /api/leaves/{id}/reject` - Reject leave (Manager/Admin)

### 2. LeaveService.java
**Location:** `/backend/src/main/java/com/geoattendance/service/LeaveService.java`

**Features:**
- Apply leave with validation
- Fetch leave history
- Approve/reject leaves
- Status management (PENDING → APPROVED/REJECTED)

### 3. LeaveRepository.java
**Location:** `/backend/src/main/java/com/geoattendance/repository/LeaveRepository.java`

**Methods:**
- `findByUserId()` - Get leaves by user
- `findByStatus()` - Filter by status
- Standard CRUD operations

### 4. DTOs
- `LeaveRequest` - Apply leave payload
- `LeaveResponse` - Leave data response

## Frontend Components ✅

### 1. LeaveService.ts
**Location:** `/frontend/src/services/LeaveService.ts`

**Features:**
- Type-safe leave operations
- Centralized API calls
- Helper functions for:
  - Date formatting
  - Duration calculation
  - Status/type color coding

**Methods:**
```typescript
- applyLeave(leaveData) - Submit leave application
- getMyLeaves() - Fetch employee's leaves
- getAllLeaves() - Fetch all leaves (managers)
- approveLeave(id) - Approve a leave
- rejectLeave(id) - Reject a leave
- getLeaveTypeColor(type) - Get color for leave type
- getStatusColor(status) - Get color for status
- formatDate(dateString) - Format date for display
- calculateDays(start, end) - Calculate duration
```

### 2. LeaveApplicationScreen.tsx
**Location:** `/frontend/src/screens/employee/LeaveApplicationScreen.tsx`

**Features:**
- ✅ Leave type selection (SICK, CASUAL, ANNUAL, UNPAID)
- ✅ Date input with validation (YYYY-MM-DD format)
- ✅ Automatic duration calculation
- ✅ Reason text input
- ✅ Form validation
- ✅ Success/error handling
- ✅ Navigation to leave history

**UI Components:**
- Type selector buttons with color coding
- Date input fields with auto-formatting
- Duration display
- Reason textarea
- Submit button with loading state
- Quick link to history

### 3. LeaveHistoryScreen.tsx
**Location:** `/frontend/src/screens/employee/LeaveHistoryScreen.tsx`

**Features:**
- ✅ View all leave applications
- ✅ Pull-to-refresh
- ✅ Status filtering
- ✅ Summary statistics
- ✅ Detailed leave cards with:
  - Leave type badge (color-coded)
  - Status badge (PENDING/APPROVED/REJECTED)
  - Date range display
  - Duration calculation
  - Reason
  - Applied date

**UI Components:**
- Summary card with statistics:
  - Total applications
  - Approved count
  - Pending count
  - Rejected count
- Individual leave cards
- Empty state with quick apply button
- Error handling with retry

### 4. LeaveApprovalScreen.tsx
**Location:** `/frontend/src/screens/manager/LeaveApprovalScreen.tsx`

**Features:**
- ✅ View all team leave requests
- ✅ Filter by status (ALL/PENDING/APPROVED/REJECTED)
- ✅ Quick statistics dashboard
- ✅ Approve/reject with confirmation
- ✅ Real-time updates
- ✅ Pull-to-refresh

**UI Components:**
- Status filter tabs with counts
- Statistics summary card
- Employee information display
- Leave details cards
- Approve/Reject action buttons
- Confirmation dialogs

## Navigation Integration ✅

### Employee Navigation
**File:** `/frontend/App.tsx`

Added screens to EmployeeStack:
```typescript
<Stack.Screen name="LeaveApplication" component={LeaveApplicationScreen} />
<Stack.Screen name="LeaveHistory" component={LeaveHistoryScreen} />
```

### Manager Navigation
**File:** `/frontend/App.tsx`

Existing screen in ManagerStack:
```typescript
<Stack.Screen name="LeaveApproval" component={LeaveApprovalScreen} />
```

### Dashboard Integration

**EmployeeDashboard.tsx:**
- Leave Management section with:
  - 📝 Apply Leave button
  - 📋 Leave History button

**ManagerDashboard.tsx:**
- Quick Actions section includes:
  - ✅ Approve Leaves button

## Leave Types

### 1. SICK Leave
- **Color:** Red (#f44336)
- **Purpose:** Medical reasons
- **Icon:** 🤒

### 2. CASUAL Leave
- **Color:** Blue (#2196F3)
- **Purpose:** Personal matters
- **Icon:** 📅

### 3. ANNUAL Leave
- **Color:** Green (#4CAF50)
- **Purpose:** Vacation/planned leave
- **Icon:** ✈️

### 4. UNPAID Leave
- **Color:** Orange (#FF9800)
- **Purpose:** Extended leave without pay
- **Icon:** 💼

## Leave Status Workflow

```
PENDING (Orange) → APPROVED (Green) ✓
                 → REJECTED (Red) ✗
```

### Status Colors:
- **PENDING:** Orange (#FF9800)
- **APPROVED:** Green (#4CAF50)
- **REJECTED:** Red (#f44336)

## User Workflows

### Employee Flow:
1. Navigate to Dashboard
2. Click "Apply Leave" or "Leave History"
3. **Apply Leave:**
   - Select leave type
   - Enter start date (YYYY-MM-DD)
   - Enter end date (YYYY-MM-DD)
   - See automatic duration calculation
   - Enter reason
   - Submit application
4. **View History:**
   - See all applications
   - View status of each
   - Check statistics
   - Apply new leave from history

### Manager Flow:
1. Navigate to Dashboard
2. Click "Approve Leaves"
3. View leave requests with filters:
   - ALL - All requests
   - PENDING - Awaiting action
   - APPROVED - Already approved
   - REJECTED - Already rejected
4. For pending requests:
   - Review employee details
   - Check dates and reason
   - Approve or Reject with confirmation
5. Pull to refresh for updates

## API Integration

### Base URL
Configured in `/frontend/src/config/index.ts`:
```typescript
export const API_URL = 'http://192.168.29.73:8080/api';
```

### Authentication
All leave endpoints require authentication:
- Token passed in Authorization header
- Role-based access control (RBAC)

### Error Handling
- Network errors caught and displayed
- 401 errors indicate auth failure
- Validation errors shown in alerts
- Retry mechanisms on errors

## Testing Checklist

### Employee Features:
- ✅ Apply for leave with all types
- ✅ Input validation (dates, reason)
- ✅ Duration calculation
- ✅ View leave history
- ✅ See status updates
- ✅ Pull to refresh
- ✅ Empty state handling

### Manager Features:
- ✅ View all team leaves
- ✅ Filter by status
- ✅ Approve leaves
- ✅ Reject leaves
- ✅ Confirmation dialogs
- ✅ Real-time updates
- ✅ Statistics display

### Edge Cases:
- ✅ Invalid date formats
- ✅ End date before start date
- ✅ Empty reason field
- ✅ Network failures
- ✅ No leave requests
- ✅ Token expiration

## Future Enhancements (Optional)

### Potential Features:
1. **Calendar View** - Visual calendar for leave dates
2. **Leave Balance** - Track remaining leave days
3. **Notifications** - Push notifications for status updates
4. **Bulk Actions** - Approve/reject multiple leaves
5. **Comments** - Manager can add approval/rejection notes
6. **Attachments** - Upload medical certificates
7. **Leave Types Management** - Admin can configure types
8. **Reporting** - Advanced leave analytics
9. **Delegation** - Manager can delegate approvals
10. **Auto-approval** - Rule-based auto-approval

## Troubleshooting

### Common Issues:

**1. "Failed to fetch leave history"**
- Check backend is running
- Verify API_URL in config
- Check authentication token
- Check network connectivity

**2. "Failed to submit leave application"**
- Verify date format (YYYY-MM-DD)
- Check start date < end date
- Ensure reason is provided
- Check authentication

**3. "Leave approval failed"**
- Verify manager permissions
- Check leave is in PENDING status
- Verify backend is accessible

**4. Icons not showing in tabs**
- Fixed by adding Ionicons from @expo/vector-icons
- Verify icon imports in App.tsx

## File Structure

```
frontend/
├── src/
│   ├── services/
│   │   ├── LeaveService.ts          ✅ Core leave logic
│   │   └── ApiService.ts             ✅ HTTP client
│   ├── screens/
│   │   ├── employee/
│   │   │   ├── LeaveApplicationScreen.tsx   ✅ Apply leave
│   │   │   ├── LeaveHistoryScreen.tsx       ✅ View history
│   │   │   └── EmployeeDashboard.tsx        ✅ Dashboard integration
│   │   └── manager/
│   │       ├── LeaveApprovalScreen.tsx      ✅ Approve/reject
│   │       └── ManagerDashboard.tsx         ✅ Dashboard integration
│   └── config/
│       └── index.ts                          ✅ API configuration
└── App.tsx                                   ✅ Navigation setup

backend/
└── src/main/java/com/geoattendance/
    ├── controller/
    │   └── LeaveController.java              ✅ REST endpoints
    ├── service/
    │   └── LeaveService.java                 ✅ Business logic
    ├── repository/
    │   └── LeaveRepository.java              ✅ Data access
    ├── entity/
    │   └── Leave.java                        ✅ Data model
    └── dto/
        ├── LeaveRequest.java                 ✅ Request DTO
        └── LeaveResponse.java                ✅ Response DTO
```

## Summary

✅ **Backend:** Fully implemented with REST API
✅ **Frontend Service:** Type-safe service layer created
✅ **Employee Screens:** Application and history screens ready
✅ **Manager Screen:** Approval screen with filtering
✅ **Navigation:** Integrated in both employee and manager flows
✅ **Dashboard:** Quick access buttons added
✅ **UI/UX:** Color-coded types, status badges, statistics
✅ **Validation:** Date validation and error handling
✅ **Real-time:** Pull-to-refresh functionality

The leave management feature is now **100% functional and ready for use!**
