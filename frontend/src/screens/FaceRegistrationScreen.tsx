import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { ApiService } from '../services/ApiService';

interface FaceRegistrationScreenProps {
  navigation: any;
  route?: {
    params?: {
      onRegistrationComplete?: (success: boolean) => void;
      isNewUser?: boolean;
    };
  };
}

export function FaceRegistrationScreen({ navigation, route }: FaceRegistrationScreenProps) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [facing, setFacing] = useState<CameraType>('front');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView>(null);

  const onRegistrationComplete = route?.params?.onRegistrationComplete;
  const isNewUser = route?.params?.isNewUser || false;

  const handleSuccess = () => {
    if (onRegistrationComplete) {
      onRegistrationComplete(true);
    }
    if (isNewUser) {
      // Navigate to login after registration
      Alert.alert(
        'Registration Complete',
        'Your account and face have been registered successfully. Please login to continue.',
        [{ text: 'OK', onPress: () => navigation.navigate('Login') }]
      );
    } else {
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
        quality: 0.8,
        base64: true,
      });

      if (!photo || !photo.base64) {
        Alert.alert('Error', 'Failed to capture photo. Please try again.');
        setIsProcessing(false);
        return;
      }

      setCapturedImage(`data:image/jpg;base64,${photo.base64}`);

      // Register face with backend
      const result = await ApiService.registerFace(photo.base64);

      if (result.success) {
        Alert.alert(
          'Face Registered',
          'Your face has been registered successfully. This will be used for daily verification.',
          [{ text: 'OK', onPress: handleSuccess }]
        );
      } else {
        Alert.alert('Registration Failed', result.message || 'Please try again.');
        setCapturedImage(null);
      }
    } catch (error: any) {
      console.error('Face registration error:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to register face. Please try again.'
      );
      setCapturedImage(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
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
          We need camera access to register your face for attendance verification.
        </Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Register Your Face</Text>
        <View style={{ width: 40 }} />
      </View>

      <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
        <View style={styles.overlay}>
          {/* Face guide oval */}
          <View style={styles.faceGuideContainer}>
            <View style={styles.faceGuide} />
            <Text style={styles.instruction}>
              {isProcessing
                ? 'Registering...'
                : 'Position your face within the oval'}
            </Text>
          </View>
        </View>
      </CameraView>

      {/* Tips */}
      <View style={styles.tipsContainer}>
        <Text style={styles.tipsTitle}>Tips for best results:</Text>
        <View style={styles.tipRow}>
          <Ionicons name="sunny-outline" size={18} color="#666" />
          <Text style={styles.tipText}>Good lighting on your face</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="eye-outline" size={18} color="#666" />
          <Text style={styles.tipText}>Look directly at the camera</Text>
        </View>
        <View style={styles.tipRow}>
          <Ionicons name="happy-outline" size={18} color="#666" />
          <Text style={styles.tipText}>Neutral expression works best</Text>
        </View>
      </View>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity
          style={styles.flipButton}
          onPress={() => setFacing(facing === 'front' ? 'back' : 'front')}
        >
          <Ionicons name="camera-reverse-outline" size={28} color="#333" />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.captureButton, isProcessing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={isProcessing}
        >
          {isProcessing ? (
            <ActivityIndicator color="#fff" size="large" />
          ) : (
            <View style={styles.captureButtonInner}>
              <Ionicons name="camera" size={32} color="#fff" />
              <Text style={styles.captureButtonText}>Capture</Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.skipButton} 
          onPress={() => {
            Alert.alert(
              'Skip Face Registration?',
              'You can register your face later from the profile settings. Face verification will be required for check-in.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Skip', onPress: () => navigation.goBack() },
              ]
            );
          }}
        >
          <Text style={styles.skipButtonText}>Skip</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#007AFF',
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
  },
  loadingText: {
    color: '#666',
    marginTop: 16,
    fontSize: 16,
  },
  camera: {
    flex: 1,
    maxHeight: 400,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  faceGuideContainer: {
    alignItems: 'center',
  },
  faceGuide: {
    width: 200,
    height: 260,
    borderRadius: 100,
    borderWidth: 3,
    borderColor: '#00ff00',
    backgroundColor: 'transparent',
  },
  instruction: {
    color: '#fff',
    fontSize: 16,
    marginTop: 15,
    textAlign: 'center',
    fontWeight: '500',
  },
  tipsContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#666',
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 25,
    paddingHorizontal: 20,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  captureButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  captureButtonDisabled: {
    opacity: 0.7,
  },
  captureButtonInner: {
    alignItems: 'center',
  },
  captureButtonText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  skipButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  skipButtonText: {
    color: '#666',
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

export default FaceRegistrationScreen;
