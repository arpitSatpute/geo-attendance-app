import Constants from 'expo-constants';

interface Config {
  apiUrl: string;
  appName: string;
  appVersion: string;
}

// Get API URL from environment variables with fallbacks
const getApiUrl = (): string => {
  // Check Expo constants first
  const expoApiUrl = Constants.expoConfig?.extra?.apiUrl || 
                     Constants.manifest?.extra?.apiUrl;
  
  if (expoApiUrl) {
    return expoApiUrl;
  }

  // Fallback to environment variable
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }

  // Default fallback
  return 'http://localhost:8080/api';
};

const config: Config = {
  apiUrl: getApiUrl(),
  appName: process.env.EXPO_PUBLIC_APP_NAME || 'GeoAttendance Pro',
  appVersion: process.env.EXPO_PUBLIC_APP_VERSION || '1.0.0',
};

export default config;
