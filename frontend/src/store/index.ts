import { configureStore, createSlice } from '@reduxjs/toolkit';

// Initial state
interface AuthState {
  user: any;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialAuthState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  loading: false,
  error: null,
};

// Auth slice (modern Redux Toolkit approach)
const authSlice = createSlice({
  name: 'auth',
  initialState: initialAuthState,
  reducers: {
    loginSuccess: (state, action) => {
      state.isAuthenticated = true;
      state.user = action.payload.user;
      state.token = action.payload.token;
      state.loading = false;
      state.error = null;
    },
    loginFail: (state, action) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.loading = false;
      state.error = action.payload;
    },
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.loading = false;
      state.error = null;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
  },
});

// Notification slice
const initialNotificationState = {
  notifications: [] as any[],
  unreadCount: 0,
  countsByType: {} as Record<string, number>,
};

const updateCounts = (state: any) => {
  state.unreadCount = state.notifications.filter((n: any) => !n.isRead).length;
  state.countsByType = state.notifications.reduce((acc: any, n: any) => {
    if (!n.isRead) {
      acc[n.type] = (acc[n.type] || 0) + 1;
    }
    return acc;
  }, {});
};

const notificationSlice = createSlice({
  name: 'notification',
  initialState: initialNotificationState,
  reducers: {
    setNotifications: (state, action) => {
      state.notifications = action.payload;
      updateCounts(state);
    },
    addNotification: (state, action) => {
      const exists = state.notifications.find((n: any) => n.id === action.payload.id);
      if (!exists) {
        state.notifications.unshift(action.payload);
        updateCounts(state);
      }
    },
    markRead: (state, action) => {
      const notification = state.notifications.find(n => n.id === action.payload);
      if (notification && !notification.isRead) {
        notification.isRead = true;
        updateCounts(state);
      }
    },
    markAllRead: (state) => {
      state.notifications.forEach(n => n.isRead = true);
      updateCounts(state);
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(n => n.id !== action.payload);
      updateCounts(state);
    },
  },
});

// Export actions
export const { loginSuccess, loginFail, logout, setLoading } = authSlice.actions;
export const { setNotifications, addNotification, markRead, markAllRead, removeNotification } = notificationSlice.actions;

// Create store with configureStore (Redux Toolkit 2.x)
export const store = configureStore({
  reducer: {
    auth: authSlice.reducer,
    notification: notificationSlice.reducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
