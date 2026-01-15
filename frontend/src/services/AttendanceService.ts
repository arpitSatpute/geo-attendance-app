import { ApiService } from './ApiService';

export interface LocationUpdateResult {
  status: 'CHECKED_IN' | 'CHECKED_OUT' | 'AUTO_CHECKED_IN' | 'AUTO_CHECKED_OUT' | 'ABSENT' | 'AWAITING_FIRST_CHECKIN' | 'OUTSIDE' | 'ERROR';
  message: string;
  geofenceName?: string;
}

export interface WorkHoursInfo {
  configured: boolean;
  teamName?: string;
  workStartTime?: string;
  workEndTime?: string;
  checkInDeadline?: string;
  checkOutAllowedFrom?: string;
  checkInBufferMinutes?: number;
  checkOutBufferMinutes?: number;
  earliestCheckIn?: string;
  message?: string;
}

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

  /**
   * Update location and get auto check-in/check-out result
   */
  static async updateLocation(latitude: number, longitude: number, accuracy: number): Promise<LocationUpdateResult | null> {
    return ApiService.updateLocation(latitude, longitude, accuracy);
  }

  /**
   * Get employee's work hours configuration
   */
  static async getMyWorkHours(): Promise<WorkHoursInfo> {
    return ApiService.getMyWorkHours();
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
