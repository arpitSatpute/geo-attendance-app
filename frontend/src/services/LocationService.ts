import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { AttendanceService } from './AttendanceService';

const LOCATION_TASK_NAME = 'background-location-task';

export class LocationService {
  private static currentLocation: Location.LocationObject | null = null;
  private static locationUpdateCallback: ((location: Location.LocationObject) => void) | null = null;

  /**
   * Start background location tracking
   */
  static async startLocationTracking() {
    try {
      // Request foreground location permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        console.error('Foreground location permission denied');
        return;
      }

      console.log('Location tracking started (foreground only)');
      // Background location tracking disabled for now due to token access issues
      // Will be implemented later with proper token handling
    } catch (error) {
      console.error('Error starting location tracking:', error);
    }
  }

  /**
   * Stop background location tracking
   */
  static async stopLocationTracking() {
    try {
      await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      console.log('Location tracking stopped');
    } catch (error) {
      console.error('Error stopping location tracking:', error);
    }
  }

  /**
   * Get current location
   */
  static async getCurrentLocation(): Promise<Location.LocationObject | null> {
    try {
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      this.currentLocation = location;
      return location;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  /**
   * Send location to backend
   */
  private static async sendLocationToBackend(location: Location.LocationObject) {
    // Disabled for now - will be re-enabled when backend endpoints are ready
    console.log('Background location update disabled');
    return;
  }

  /**
   * Get last known geofence
   */
  private static async getLastGeofence() {
    // Implementation would retrieve from local storage
    return null;
  }

  /**
   * Set location update callback
   */
  static setLocationUpdateCallback(callback: (location: Location.LocationObject) => void) {
    this.locationUpdateCallback = callback;
  }

  /**
   * Get current location (cached)
   */
  static getCachedLocation(): Location.LocationObject | null {
    return this.currentLocation;
  }

  /**
   * Watch location changes
   */
  static async watchLocation(callback: (location: Location.LocationObject) => void) {
    try {
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 5000,
          distanceInterval: 10,
        },
        callback
      );
      return subscription;
    } catch (error) {
      console.error('Error watching location:', error);
      return null;
    }
  }

  /**
   * Get location address from coordinates
   */
  static async getAddressFromCoordinates(latitude: number, longitude: number): Promise<string> {
    try {
      const addresses = await Location.reverseGeocodeAsync({
        latitude,
        longitude,
      });

      if (addresses && addresses.length > 0) {
        const address = addresses[0];
        return `${address.street}, ${address.city}, ${address.region}`;
      }
      return 'Unknown location';
    } catch (error) {
      console.error('Error getting address:', error);
      return 'Unknown location';
    }
  }

  /**
   * Calculate distance between two points
   */
  static calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLng = (lng2 - lng1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
