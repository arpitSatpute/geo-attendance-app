import AsyncStorage from '@react-native-async-storage/async-storage';
import { ApiService } from './ApiService';
import { jwtDecode } from 'jwt-decode';
import axios from 'axios';

export class AuthService {
  static readonly BACKEND_URL: string = process.env.EXPO_PUBLIC_API_URL;
  static async login(email: string, password: string) {
    try {
      const response = await ApiService.login(email, password);
      const { token, user } = response;

      // Store token and user data
      await AsyncStorage.setItem('authToken', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));
      
      // Update the API service token cache immediately
      ApiService.setTokenCache(token);

      console.log('Login successful, user role:', user.role);
      console.log('Token cached for immediate use');
      return { token, user };
    } catch (error: any) {
      console.error('Login error:', error);
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'Login failed';
      throw new Error(errorMessage);
    }
  }

  static async register(userData: any) {
    try {
      const response = await ApiService.register(userData);
      console.log('Registration successful:', response);
      return response;
    } catch (error: any) {
      console.error('Registration error:', error);
      // Extract error message from response
      const errorMessage = error.response?.data?.error || error.message || 'Registration failed';
      throw new Error(errorMessage);
    }
  }

  static async logout() {
    try {
      await ApiService.logout();
      await AsyncStorage.removeItem('authToken');
      await AsyncStorage.removeItem('user');
      
      // Clear the API service token cache
      ApiService.clearTokenCache();
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  static async getToken(): Promise<string | null> {
    return AsyncStorage.getItem('authToken');
  }

  static async getCurrentUser() {
    try {
      const userStr = await AsyncStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }

      // Fetch from API if not in storage
      const user = await ApiService.getCurrentUser();
      await AsyncStorage.setItem('user', JSON.stringify(user));
      return user;
    } catch (error) {
      console.error('Error getting current user:', error);
      return null;
    }
  }

  static async isAuthenticated(): Promise<boolean> {
    const token = await this.getToken();
    if (!token) return false;

    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }

  static async updateProfile(userData: any) {
    try {
      const response = await ApiService.updateProfile(userData);
      await AsyncStorage.setItem('user', JSON.stringify(response));
      return response;
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  }

  static async getUserRole(): Promise<string | null> {
    const user = await this.getCurrentUser();
    return user?.role || null;
  }
}
