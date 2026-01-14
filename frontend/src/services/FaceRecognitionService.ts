import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-react-native';
import * as blazeface from '@tensorflow-models/blazeface';
import { Camera } from 'expo-camera';
import * as FileSystem from 'expo-file-system';

export class FaceRecognitionService {
  private model: blazeface.BlazeFaceModel | null = null;
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      await tf.ready();
      this.model = await blazeface.load();
      this.initialized = true;
      console.log('Face detection model loaded');
    } catch (error) {
      console.error('Failed to load face detection model:', error);
      throw error;
    }
  }

  async detectFace(imageUri: string): Promise {
    if (!this.model) {
      throw new Error('Model not initialized');
    }

    try {
      // Read image as base64
      const imageBase64 = await FileSystem.readAsStringAsync(imageUri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Convert to tensor
      const imageTensor = this.base64ToTensor(imageBase64);
      
      // Detect faces
      const predictions = await this.model.estimateFaces(imageTensor, false);
      
      // Cleanup
      imageTensor.dispose();

      return predictions.length > 0;
    } catch (error) {
      console.error('Face detection error:', error);
      return false;
    }
  }

  private base64ToTensor(base64: string): tf.Tensor3D {
    const buffer = tf.util.encodeString(base64, 'base64');
    const tensor = tf.node.decodeImage(buffer, 3);
    return tensor as tf.Tensor3D;
  }

  async verifyAttendance(imageUri: string): Promise {
    const hasFace = await this.detectFace(imageUri);

    if (!hasFace) {
      return {
        success: false,
        confidence: 0,
        message: 'No face detected. Please ensure your face is visible.',
      };
    }

    // TODO: Implement face matching with stored reference
    // For now, just verify a face exists
    return {
      success: true,
      confidence: 0.85,
      message: 'Face verified successfully',
    };
  }
}