import { ApiService } from './ApiService';

export class AttendanceService {
  static async checkIn(latitude: number, longitude: number, accuracy: number) {
    return ApiService.checkIn(latitude, longitude, accuracy);
  }

  static async checkOut(latitude: number, longitude: number, accuracy: number) {
    return ApiService.checkOut(latitude, longitude, accuracy);
  }

  static async getTodayAttendance() {
    return ApiService.getTodayAttendance();
  }

  static async getAttendanceHistory(startDate: string, endDate: string) {
    return ApiService.getAttendanceHistory(startDate, endDate);
  }

  static async getStatistics(startDate: string, endDate: string) {
    return ApiService.getAttendanceStatistics(startDate, endDate);
  }

  static async getReport(startDate: string, endDate: string) {
    return ApiService.getAttendanceReport(startDate, endDate);
  }

  static async updateLocation(latitude: number, longitude: number, accuracy: number) {
    return ApiService.updateLocation(latitude, longitude, accuracy);
  }

  static async findGeofenceContainingPoint(latitude: number, longitude: number) {
    try {
      return await ApiService.findGeofenceContainingPoint(latitude, longitude);
    } catch (error) {
      console.error('Error finding geofence:', error);
      return null;
    }
  }

  static async getAllGeofences() {
    return ApiService.getAllGeofences();
  }
}
