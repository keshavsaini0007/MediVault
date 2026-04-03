import { Platform } from 'react-native';

const PROD_API_URL = 'https://medivault-cxas.onrender.com/api/v1';

const ENV_API_URL = process.env.EXPO_PUBLIC_API_URL;

export const API_BASE_URL = (() => {
  if (ENV_API_URL) {
    console.log('📡 API URL from env:', ENV_API_URL);
    return ENV_API_URL;
  }
  console.log('📡 Falling back to production API:', PROD_API_URL);
  return PROD_API_URL;
})();

// kept for backward compatibility with api.ts
export const getApiBaseUrl = async (): Promise<string> => API_BASE_URL;

export const API_TIMEOUT_MS = 15000;

export const ENABLE_API_LOGGING = __DEV__;

export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  retryOn: [408, 429, 500, 502, 503, 504],
};

export const ENV_INFO = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
  platform: Platform.OS,
  apiUrl: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
};

export const logApiConfig = () => {
  console.log('='.repeat(50));
  console.log('🔧 API CONFIG');
  console.log('Environment:', __DEV__ ? 'DEV' : 'PROD');
  console.log('Platform:', Platform.OS);
  console.log('Base URL:', API_BASE_URL);
  console.log('='.repeat(50));
};
