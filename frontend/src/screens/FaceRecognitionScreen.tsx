import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { faceRecognitionService } from '../services/FaceRecognitionService';

type ScreenMode = 'loading' | 'register' | 'verify' | 'done';

export function FaceVerificationScreen({ navigation }: any) {
  const [permission, requestPermission] = useCameraPermissions();
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<ScreenMode>('loading');
  const [message, setMessage] = useState('');
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      await faceRecognitionService.initialize();
      const status = await faceRecognitionService.checkVerificationStatus();
      
      if (status.verifiedToday) {
        setMode('done');
        setMessage('Already verified today!');
      } else if (!status.faceRegistered) {
        setMode('register');
        setMessage('Register your face for attendance');
      } else {
        setMode('verify');
        setMessage('Verify your face to check in');
      }
    } catch (error) {
      console.error('Error checking status:', error);
      setMode('verify');
      setMessage('Verify your face');
    }
  };

  const takePicture = async () => {
    if (!cameraRef.current || isProcessing) return;

    try {
      setIsProcessing(true);
      setMessage('Processing...');
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: false,
      });

      let result;
      if (mode === 'register') {
        result = await faceRecognitionService.registerFace(photo.uri);
      } else {
        result = await faceRecognitionService.verifyFace(photo.uri);
      }

      if (result.success) {
        Alert.alert('Success', result.message, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Failed', result.message);
        setMessage(mode === 'register' ? 'Try again - Register your face' : 'Try again - Verify your face');
      }
    } catch (error) {
      console.error('Face processing error:', error);
      Alert.alert('Error', 'Failed to process face. Please try again.');
      setMessage('Please try again');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={requestPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (mode === 'loading') {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Checking status...</Text>
      </View>
    );
  }

  if (mode === 'done') {
    return (
      <View style={styles.container}>
        <Text style={styles.doneText}>✓</Text>
        <Text style={styles.doneMessage}>{message}</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView 
        ref={cameraRef}
        style={styles.camera} 
        facing="front"
      />
      <View style={styles.overlay}>
        <View style={styles.faceFrame} />
        <Text style={styles.instruction}>{message}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity
          style={[styles.button, isProcessing && styles.buttonDisabled]}
          onPress={takePicture}
          disabled={isProcessing}
        >
          <Text style={styles.buttonText}>
            {isProcessing ? 'Processing...' : (mode === 'register' ? 'Register Face' : 'Verify Face')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  faceFrame: {
    width: 250,
    height: 300,
    borderWidth: 3,
    borderColor: '#00ff00',
    borderRadius: 125,
  },
  instruction: {
    color: 'white',
    fontSize: 16,
    marginTop: 20,
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 10,
    borderRadius: 5,
  },
  controls: {
    padding: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    zIndex: 10,
  },
  button: {
    backgroundColor: '#007AFF',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    minWidth: 200,
  },
  buttonDisabled: {
    backgroundColor: '#666',
  },
  buttonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  permissionText: {
    color: 'white',
    fontSize: 18,
    marginBottom: 20,
  },
  loadingText: {
    color: 'white',
    fontSize: 16,
    marginTop: 10,
  },
  doneText: {
    color: '#00ff00',
    fontSize: 80,
    marginBottom: 20,
  },
  doneMessage: {
    color: 'white',
    fontSize: 20,
    marginBottom: 30,
  },
});