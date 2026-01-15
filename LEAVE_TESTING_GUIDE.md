# Leave Management - Quick Start Guide

## 🚀 How to Test the Leave Feature

### Prerequisites
1. Backend server running on `http://192.168.29.73:8080`
2. Frontend app running (Expo)
3. Logged in as either Employee or Manager

---

## 👨‍💼 For Employees

### 1. Apply for Leave

**Steps:**
1. Open the app and login as an employee
2. From Dashboard, tap "📝 Apply Leave" button
3. Select leave type:
   - **CASUAL** - Personal matters (Blue)
   - **SICK** - Medical reasons (Red)
   - **ANNUAL** - Vacation/planned leave (Green)
   - **UNPAID** - Extended leave without pay (Orange)
4. Enter Start Date: Format `YYYY-MM-DD` (e.g., `2026-01-20`)
5. Enter End Date: Format `YYYY-MM-DD` (e.g., `2026-01-22`)
6. See automatic duration calculation (e.g., "Duration: 3 days")
7. Enter Reason: "Going for family vacation"
8. Tap "Submit Leave Application"
9. See success message

**Screenshot Points:**
- Color-coded leave type buttons
- Auto-calculated duration
- Clear date format guidance

### 2. View Leave History

**Steps:**
1. From Dashboard, tap "📋 Leave History" button
   - OR from Leave Application screen, tap "View Leave History"
2. See summary card showing:
   - Total Applications
   - Approved (Green badge)
   - Pending (Orange badge)
   - Rejected (Red badge)
3. Scroll through all your leave applications
4. Each card shows:
   - Leave type (color-coded badge)
   - Status (PENDING/APPROVED/REJECTED)
   - Date range
   - Duration
   - Reason
   - Applied date
5. Pull down to refresh

**Alternative Path:**
- Tap "+ Apply Leave" from the history screen header

---

## 👨‍💼 For Managers

### 1. View Team Leave Requests

**Steps:**
1. Login as a manager
2. From Dashboard, tap "✅ Approve Leaves" button
3. See statistics card showing:
   - Total requests
   - Pending (Orange)
   - Approved (Green)
   - Rejected (Red)
4. Use filter tabs at top:
   - **ALL** - Show all leaves
   - **PENDING** - Only pending requests (default)
   - **APPROVED** - Already approved
   - **REJECTED** - Already rejected

### 2. Approve a Leave Request

**Steps:**
1. In Leave Approval screen
2. Find a leave with PENDING status
3. Review details:
   - Employee name and email
   - Leave type
   - Duration
   - Date range
   - Reason
4. Tap "✓ Approve" button
5. Confirm in dialog: "Are you sure you want to approve this leave request?"
6. Tap "Approve"
7. See success message: "Leave approved successfully"
8. Leave card updates to show APPROVED status

### 3. Reject a Leave Request

**Steps:**
1. In Leave Approval screen
2. Find a leave with PENDING status
3. Tap "✗ Reject" button
4. Confirm in dialog (destructive action)
5. Tap "Reject"
6. See success message: "Leave rejected"
7. Leave card updates to show REJECTED status

---

## 📱 Navigation Paths

### Employee Routes:
```
Dashboard → Apply Leave → [Fill Form] → Submit → Success
Dashboard → Leave History → [View All] → Pull to Refresh
Leave Application → View Leave History → [Navigate back and forth]
```

### Manager Routes:
```
Dashboard → Approve Leaves → [View All Requests]
Approve Leaves → Filter (ALL/PENDING/APPROVED/REJECTED)
Approve Leaves → Select Leave → Approve/Reject → Confirm
```

---

## 🧪 Test Scenarios

### Scenario 1: Happy Path - Employee applies, Manager approves
1. **Employee:** Apply for CASUAL leave (Jan 20-22, 2026)
2. **Manager:** View in Approve Leaves screen
3. **Manager:** Approve the request
4. **Employee:** Check Leave History - see APPROVED status

### Scenario 2: Validation Testing
1. **Employee:** Try to submit without dates → See error
2. **Employee:** Enter invalid date format → See error
3. **Employee:** End date before start date → See error
4. **Employee:** Submit without reason → See error

### Scenario 3: Multiple Leave Types
1. **Employee:** Apply SICK leave (1 day)
2. **Employee:** Apply ANNUAL leave (5 days)
3. **Employee:** Apply UNPAID leave (10 days)
4. **Employee:** View history - see all with different colors
5. **Manager:** See all requests in approval screen

### Scenario 4: Rejection Flow
1. **Employee:** Apply for leave
2. **Manager:** Reject with confirmation
3. **Employee:** Check history - see REJECTED status (Red)

### Scenario 5: Filter Testing
1. **Manager:** Apply multiple test leaves with different statuses
2. **Manager:** Test each filter:
   - ALL shows everything
   - PENDING shows only pending
   - APPROVED shows only approved
   - REJECTED shows only rejected
3. **Manager:** Check badge counts on filter tabs

---

## 🐛 Expected Behaviors

### ✅ Good Cases:
- Date auto-formatting as you type
- Duration auto-calculation
- Color-coded badges
- Smooth navigation
- Pull-to-refresh works
- Statistics update in real-time
- Confirmation dialogs for approvals

### ⚠️ Error Handling:
- "Failed to fetch" → Check backend connection
- "Invalid date format" → Use YYYY-MM-DD
- "Start date must be before end date" → Fix dates
- Network timeout → Retry button available

---

## 📊 Visual Elements to Verify

### Color Coding:
- **SICK:** Red background (#f44336)
- **CASUAL:** Blue background (#2196F3)
- **ANNUAL:** Green background (#4CAF50)
- **UNPAID:** Orange background (#FF9800)

### Status Colors:
- **PENDING:** Orange (#FF9800)
- **APPROVED:** Green (#4CAF50)
- **REJECTED:** Red (#f44336)

### Icons:
- 📝 Apply Leave
- 📋 Leave History
- ✅ Approve Leaves
- ✓ Approve button
- ✗ Reject button

---

## 🔧 Quick Troubleshooting

**Issue:** Can't see leave application button
- **Fix:** Check you're logged in as employee
- **Fix:** Verify Dashboard has "Leave Management" section

**Issue:** "Failed to submit leave"
- **Fix:** Check backend is running
- **Fix:** Verify date format is YYYY-MM-DD
- **Fix:** Ensure reason field is filled

**Issue:** Manager can't approve
- **Fix:** Check logged in as MANAGER or ADMIN role
- **Fix:** Verify leave status is PENDING
- **Fix:** Check backend connectivity

**Issue:** History is empty
- **Fix:** Apply at least one leave first
- **Fix:** Pull down to refresh
- **Fix:** Check API endpoint `/api/leaves/my-leaves`

---

## 🎯 Success Criteria

✅ Employee can apply for all 4 leave types
✅ Form validation prevents invalid submissions
✅ Duration is calculated automatically
✅ Leave history shows all applications
✅ Statistics are accurate
✅ Manager can filter by status
✅ Approve/Reject works with confirmation
✅ Real-time updates after actions
✅ Pull-to-refresh functionality works
✅ Color coding is consistent
✅ Navigation flows smoothly

---

## 📞 Support

If you encounter any issues:
1. Check backend logs for API errors
2. Check React Native debugger for frontend errors
3. Verify authentication token is valid
4. Test API endpoints directly (Postman)
5. Review error messages in alerts

---

**Ready to test! 🎉**

Start with Scenario 1 (Happy Path) and work through all scenarios for complete testing coverage.
