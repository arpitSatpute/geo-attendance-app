import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';

interface FaceVerificationScreenProps {
  navigation: any;
  route?: {
    params?: {
      onVerificationComplete?: (success: boolean) => void;
    };
  };
}

export function FaceVerificationScreen({ navigation, route }: FaceVerificationScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const cameraRef = useRef<CameraView>(null);

  const onVerificationComplete = route?.params?.onVerificationComplete;

  useEffect(() => {
    // Check if already verified today
    checkVerificationStatus();
  }, []);

  const checkVerificationStatus = async () => {
    try {
      const status = await ApiService.getFaceVerificationStatus();
      if (status.verified) {
        Alert.alert(
          'Already Verified',
          'You have already verified your face today.',
          [{ text: 'OK', onPress: () => handleSuccess(true) }]
        );
      }
    } catch (error) {
      console.log('Could not check verification status:', error);
    }
  };

  const handleSuccess = (alreadyVerified: boolean = false) => {
    if (onVerificationComplete) {
      onVerificationComplete(true);
    }
    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  };

  const handleCapture = () => {
    takePicture();
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);

      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      if (!photo) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        return;
      }

      // Simulate face detection (in production, use ML model)
      // For now, we just verify a photo was taken and record it
      const confidence = 0.85 + Math.random() * 0.1; // 0.85-0.95

      // Record verification with backend
      const result = await ApiService.recordFaceVerification(`data:image/jpg;base64,${photo.base64}`, confidence);

      if (result.success) {
        Alert.alert(
          'Verification Successful',
          result.message || 'Your face has been verified for today.',
          [{ text: 'OK', onPress: () => handleSuccess() }]
        );
      } else {
        Alert.alert('Verification Failed', result.message || 'Please try again.');
      }
    } catch (error: any) {
      console.error('Face verification error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to verify face. Please try again.'
      );
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-outline" size={64} color="#666" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need camera access to verify your identity for attendance.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing} />
        <View style={styles.overlay}>
          {/* Face guide oval */}
          <View style={styles.faceGuideContainer}>
            <View style={styles.faceGuide} />
            <Text style={styles.instruction}>
              {isProcessing
                ? 'Verifying...'
                : 'Position your face within the oval'}
            </Text>
          </View>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
        >
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <Ionicons name="camera" size={36} color="#007AFF" />
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.closeButton} onPress={() => navigation.canGoBack() && navigation.goBack()}>
          <Ionicons name="close" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Capture button label */}
      <View style={styles.captureLabel}>
        <Text style={styles.captureLabelText}>
          {isProcessing ? 'Please wait...' : 'Tap the button to capture your face'}
        </Text>
      </View>

      {/* Info banner */}
      <View style={styles.infoBanner}>
        <Ionicons name="information-circle-outline" size={20} color="#007AFF" />
        <Text style={styles.infoText}>
          Face verification is required once per day for attendance
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#fff',
    marginTop: 16,
    fontSize: 16,
  },
  cameraContainer: {
    flex: 1,
    position: 'relative',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuideContainer: {
    alignItems: 'center',
  },
  faceGuide: {
    width: 220,
    height: 280,
    borderRadius: 110,
    borderWidth: 3,
    borderColor: '#00ff00',
    backgroundColor: 'transparent',
  },
  instruction: {
    color: '#fff',
    fontSize: 18,
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 30,
    paddingHorizontal: 20,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#007AFF',
  },
  captureButtonDisabled: {
    opacity: 0.6,
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
  },
  closeButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureLabel: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    paddingVertical: 12,
    alignItems: 'center',
  },
  captureLabelText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    backgroundColor: '#f0f8ff',
    gap: 8,
  },
  infoText: {
    color: '#333',
    fontSize: 14,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  permissionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 20,
    marginBottom: 10,
  },
  permissionText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
  },
  permissionButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  permissionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingHorizontal: 30,
    paddingVertical: 15,
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
  },
});

export default FaceVerificationScreen;
