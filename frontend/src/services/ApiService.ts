import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import config from '../config';

class ApiServiceClass {
  private api: AxiosInstance;
  private tokenCache: string | null = null;

  constructor() {
    this.api = axios.create({
      baseURL: config.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    // Initialize token cache
    this.initializeTokenCache();

    // Add request interceptor
    this.api.interceptors.request.use(
      async (config) => {
        // Try to get token from cache first, then from AsyncStorage
        let token = this.tokenCache;
        if (!token) {
          token = await AsyncStorage.getItem('authToken');
          if (token) {
            this.tokenCache = token;
          }
        }

        const method = config.method?.toUpperCase() || 'UNKNOWN';
        const url = (config.baseURL || '') + (config.url || '');

        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
          console.log('API Request:', method, url, '- Token present');
        } else {
          console.log('API Request:', method, url, '- NO TOKEN');
        }
        return config;
      },
      (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Add response interceptor
    this.api.interceptors.response.use(
      (response) => {
        console.log('API Response:', response.status, response.config.url);
        return response;
      },
      async (error: AxiosError) => {
        const status = error.response?.status;
        const url = error.config?.url;
        const responseData = error.response?.data as any;

        console.error('API Error:', status, error.message);
        console.error('API Error URL:', url);
        console.error('API Error Response:', JSON.stringify(responseData));

        // Don't automatically logout on 401 - let the app handle it gracefully
        // The app uses cached data when API fails
        // Only log for debugging
        if (status === 401) {
          console.log('401 error on:', url);
        }

        // Attach detailed error message
        if (responseData?.message) {
          error.message = responseData.message;
        } else if (responseData?.error) {
          error.message = responseData.error;
        }

        return Promise.reject(error);
      }
    );
  }

  // Initialize token cache from AsyncStorage
  private async initializeTokenCache() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      if (token) {
        this.tokenCache = token;
      }
    } catch (error) {
      console.error('Error initializing token cache:', error);
    }
  }

  // Method to update token cache (call this after login)
  public setTokenCache(token: string) {
    this.tokenCache = token;
  }

  // Method to clear token cache (call this after logout)
  public clearTokenCache() {
    this.tokenCache = null;
  }

  /**
   * Authentication endpoints
   */
  async login(email: string, password: string) {
    const response = await this.api.post('/auth/login', { email, password });
    return response.data;
  }

  async register(userData: any) {
    const response = await this.api.post('/auth/register', userData);
    return response.data;
  }

  async logout() {
    const response = await this.api.post('/auth/logout');
    return response.data;
  }

  /**
   * Attendance endpoints
   */
  async getTodayAttendance() {
    const response = await this.api.get('/attendance/today');
    return response.data;
  }

  async getAttendanceHistory(startDate: string, endDate: string) {
    const response = await this.api.get('/attendance/history', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async checkIn(latitude: number, longitude: number, accuracy?: number) {
    const response = await this.api.post('/attendance/check-in', {
      latitude,
      longitude,
      accuracy,
    });
    return response.data;
  }

  async checkOut(latitude: number, longitude: number, accuracy?: number) {
    const response = await this.api.post('/attendance/check-out', {
      latitude,
      longitude,
      accuracy,
    });
    return response.data;
  }

  async getAttendanceStatistics(startDate: string, endDate: string) {
    const response = await this.api.get('/attendance/statistics', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getAttendanceReport(startDate: string, endDate: string) {
    const response = await this.api.get('/attendance/report', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getTeamAttendance(startDate: string, endDate: string) {
    const response = await this.api.get('/attendance/team', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getTeamCurrentStatus() {
    const response = await this.api.get('/attendance/team/status');
    return response.data;
  }

  /**
   * Face Verification endpoints
   */
  async getFaceVerificationStatus() {
    const response = await this.api.get('/face-verification/status');
    return response.data;
  }

  async isFaceVerificationRequired() {
    const response = await this.api.get('/face-verification/required');
    return response.data;
  }

  async recordFaceVerification(confidence: number) {
    const response = await this.api.post('/face-verification/verify', { confidence });
    return response.data;
  }

  async registerFace(faceImageData: string) {
    const response = await this.api.post('/face-verification/register', { faceImageData });
    return response.data;
  }

  async getFaceRegistrationStatus() {
    const response = await this.api.get('/face-verification/registration-status');
    return response.data;
  }

  /**
   * Geofence endpoints
   */
  async getAllGeofences() {
    const response = await this.api.get('/geofences');
    return response.data;
  }

  async getGeofence(id: number) {
    const response = await this.api.get(`/geofences/${id}`);
    return response.data;
  }

  async createGeofence(geofenceData: any) {
    const response = await this.api.post('/geofences', geofenceData);
    return response.data;
  }

  async updateGeofence(id: number, geofenceData: any) {
    const response = await this.api.put(`/geofences/${id}`, geofenceData);
    return response.data;
  }

  async deleteGeofence(id: number) {
    const response = await this.api.delete(`/geofences/${id}`);
    return response.data;
  }

  async checkPointInGeofence(id: number, latitude: number, longitude: number) {
    const response = await this.api.get(`/geofences/${id}/check`, {
      params: { latitude, longitude },
    });
    return response.data;
  }

  async findGeofenceContainingPoint(latitude: number, longitude: number) {
    const response = await this.api.get('/geofences/find', {
      params: { latitude, longitude },
    });
    return response.data;
  }

  async calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number) {
    const response = await this.api.get('/geofences/distance', {
      params: { lat1, lng1, lat2, lng2 },
    });
    return response.data;
  }

  /**
   * User endpoints
   */
  async getCurrentUser() {
    const response = await this.api.get('/auth/me');
    return response.data;
  }

  async updateProfile(userData: any) {
    const response = await this.api.put('/users/profile', userData);
    return response.data;
  }

  async getAllUsers() {
    const response = await this.api.get('/users');
    return response.data;
  }

  async getUser(id: number) {
    const response = await this.api.get(`/users/${id}`);
    return response.data;
  }

  async createUser(userData: any) {
    const response = await this.api.post('/users', userData);
    return response.data;
  }

  async updateUser(id: number, userData: any) {
    const response = await this.api.put(`/users/${id}`, userData);
    return response.data;
  }

  async deleteUser(id: number) {
    const response = await this.api.delete(`/users/${id}`);
    return response.data;
  }

  /**
   * Location endpoints
   */
  async updateLocation(latitude: number, longitude: number, accuracy: number) {
    try {
      const response = await this.api.post('/location/update', {
        latitude,
        longitude,
        accuracy,
      });
      return response.data;
    } catch (error: any) {
      // If endpoint doesn't exist, silently fail (will be implemented later)
      if (error.response?.status === 401 || error.response?.status === 404) {
        console.log('Location update endpoint not available yet');
        return null;
      }
      throw error;
    }
  }

  /**
   * Get my work hours (for employees)
   */
  async getMyWorkHours() {
    const response = await this.api.get('/attendance/work-hours');
    return response.data;
  }

  /**
   * Set work hours for a team (for managers)
   */
  async setTeamWorkHours(teamId: string, workHoursData: {
    workStartTime: string;
    workEndTime: string;
    checkInDeadline: string;
    checkOutAllowedFrom: string;
    checkInBufferMinutes: number;
    checkOutBufferMinutes: number;
  }) {
    const response = await this.api.post(`/teams/${teamId}/work-hours`, workHoursData);
    return response.data;
  }

  /**
   * Get work hours for a team
   */
  async getTeamWorkHours(teamId: string) {
    const response = await this.api.get(`/teams/${teamId}/work-hours`);
    return response.data;
  }

  async getCurrentLocation() {
    const response = await this.api.get('/location/current');
    return response.data;
  }

  async getLocationHistory() {
    const response = await this.api.get('/location/history');
    return response.data;
  }

  // Get teams for the current manager
  async getTeamLocations() {
    try {
      const response = await this.api.get('/teams/manager/me');
      return response.data;
    } catch (error) {
      console.log('Team locations endpoint not available, returning empty data');
      return [];
    }
  }

  /**
   * Leave endpoints
   */
  async applyLeave(leaveData: any) {
    console.log('ApiService.applyLeave - URL:', this.api.defaults.baseURL + '/leaves');
    console.log('ApiService.applyLeave - Data:', JSON.stringify(leaveData));
    try {
      const response = await this.api.post('/leaves', leaveData);
      return response.data;
    } catch (error: any) {
      console.error('ApiService.applyLeave - Error status:', error.response?.status);
      console.error('ApiService.applyLeave - Error data:', JSON.stringify(error.response?.data));
      throw error;
    }
  }

  // Get employee's own leave history
  async getMyLeaves() {
    const response = await this.api.get('/leaves/my-leaves');
    return response.data;
  }

  // Get all leaves (for managers)
  async getAllLeaves() {
    const response = await this.api.get('/leaves');
    return response.data;
  }

  // Get pending leaves (for managers)
  async getPendingLeaves() {
    const response = await this.api.get('/leaves/pending');
    return response.data;
  }

  async approveLeave(id: string | number) {
    const response = await this.api.post(`/leaves/${id}/approve`);
    return response.data;
  }

  async rejectLeave(id: string | number) {
    const response = await this.api.post(`/leaves/${id}/reject`);
    return response.data;
  }

  /**
   * Notification endpoints
   */
  async getNotifications() {
    const response = await this.api.get('/notifications');
    return response.data;
  }

  async markNotificationAsRead(id: number) {
    const response = await this.api.put(`/notifications/${id}/read`);
    return response.data;
  }

  async deleteNotification(id: number) {
    const response = await this.api.delete(`/notifications/${id}`);
    return response.data;
  }

  /**
   * Report endpoints
   */
  async generateAttendanceReport(startDate: string, endDate: string) {
    const response = await this.api.get('/reports/attendance', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getAnalytics(startDate: string, endDate: string) {
    const response = await this.api.get('/reports/analytics', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async exportReport(format: 'csv' | 'pdf', startDate: string, endDate: string) {
    const response = await this.api.get('/reports/export', {
      params: { format, startDate, endDate },
      responseType: format === 'pdf' ? 'blob' : 'text',
    });
    return response.data;
  }

  /**
   * Generic HTTP methods
   */
  async get<T = any>(url: string, config?: any) {
    const response = await this.api.get<T>(url, config);
    return response;
  }

  async post<T = any>(url: string, data?: any, config?: any) {
    const response = await this.api.post<T>(url, data, config);
    return response;
  }

  async put<T = any>(url: string, data?: any, config?: any) {
    const response = await this.api.put<T>(url, data, config);
    return response;
  }

  async delete<T = any>(url: string, config?: any) {
    const response = await this.api.delete<T>(url, config);
    return response;
  }
}

export const ApiService = new ApiServiceClass();
