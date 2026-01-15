import { readAsStringAsync } from 'expo-file-system';
import { ApiService } from './ApiService';

interface FaceVerificationResult {
  success: boolean;
  message: string;
  faceRegistered: boolean;
  verifiedToday: boolean;
  confidence?: number;
  verificationDate?: string;
}

export class FaceRecognitionService {
  private initialized = false;

  async initialize(): Promise<void> {
    // No model loading needed - Python service handles face recognition
    this.initialized = true;
    console.log('FaceRecognitionService initialized');
  }

  /**
   * Convert image URI to base64
   */
  private async imageToBase64(imageUri: string): Promise<string> {
    try {
      const base64 = await readAsStringAsync(imageUri, {
        encoding: 'base64',
      });
      return `data:image/jpeg;base64,${base64}`;
    } catch (error) {
      console.error('Error converting image to base64:', error);
      throw new Error('Failed to process image');
    }
  }

  /**
   * Check if user needs to register face or verify today
   */
  async checkVerificationStatus(): Promise<FaceVerificationResult> {
    try {
      const response = await ApiService.get('/face-verification/required');
      return response.data;
    } catch (error: any) {
      console.error('Error checking verification status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to check status',
        faceRegistered: false,
        verifiedToday: false,
      };
    }
  }

  /**
   * Register user's face (first time)
   */
  async registerFace(imageUri: string): Promise<FaceVerificationResult> {
    try {
      const faceImageData = await this.imageToBase64(imageUri);
      
      const response = await ApiService.post('/face-verification/register', {
        faceImageData,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error registering face:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to register face',
        faceRegistered: false,
        verifiedToday: false,
      };
    }
  }

  /**
   * Verify face for daily attendance
   */
  async verifyFace(imageUri: string): Promise<FaceVerificationResult> {
    try {
      const faceImageData = await this.imageToBase64(imageUri);
      
      const response = await ApiService.post('/face-verification/verify', {
        faceImageData,
      });
      
      return response.data;
    } catch (error: any) {
      console.error('Error verifying face:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to verify face',
        faceRegistered: true,
        verifiedToday: false,
      };
    }
  }

  /**
   * Check registration status
   */
  async getRegistrationStatus(): Promise<FaceVerificationResult> {
    try {
      const response = await ApiService.get('/face-verification/registration-status');
      return response.data;
    } catch (error: any) {
      console.error('Error getting registration status:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get status',
        faceRegistered: false,
        verifiedToday: false,
      };
    }
  }

  /**
   * Legacy method for compatibility - verify attendance
   */
  async verifyAttendance(imageUri: string): Promise<{
    success: boolean;
    confidence: number;
    message: string;
  }> {
    const result = await this.verifyFace(imageUri);
    
    return {
      success: result.success,
      confidence: result.confidence || (result.success ? 1.0 : 0),
      message: result.message,
    };
  }
}

// Singleton instance
export const faceRecognitionService = new FaceRecognitionService();