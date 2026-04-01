/**
 * Frontend Configuration
 *
 * This file centralizes all environment-specific configuration.
 * Update the values below based on your development setup.
 */

import { Platform } from 'react-native';

// ============================================================================
// API CONFIGURATION
// ============================================================================

/**
 * DEVELOPMENT CONFIGURATION
 *
 * Update these URLs based on where your backend is running during development.
 */

// For Web and iOS Simulator (running on same machine as backend)
const DEV_LOCALHOST_URL = 'http://localhost:5000/api/v1';

// For Android Emulator (special IP that maps to host machine's localhost)
const DEV_ANDROID_EMULATOR_URL = 'http://10.5.1.152:5000/api/v1';

// For Physical Devices on Same WiFi Network (Mobile/Expo Go)
// IMPORTANT: Replace with your computer's actual local IP address
// Windows: Run `ipconfig` in cmd, look for "IPv4 Address" under your WiFi adapter
// Mac/Linux: Run `ifconfig` or `ip addr`, look for "inet" address
// Example: If your IP is 192.168.1.100, use: 'http://192.168.1.100:5000/api/v1'
// Current value matches your network - update if needed
const DEV_LOCAL_NETWORK_URL = "http://10.5.1.152:5000/api/v1";

/**
 * PRODUCTION CONFIGURATION
 *
 * This is used when the app is built for production
 */
const PROD_API_URL = 'https://medivault-cxas.onrender.com/api/v1';

// ============================================================================
// CHOOSE YOUR DEVELOPMENT MODE
// ============================================================================

/**
 * Set this to true if you're testing on a physical device (phone/tablet)
 * Set to false if using emulator/simulator or web browser
 * 
 * IMPORTANT: For Expo Go on mobile, set this to true and ensure your phone
 * and computer are on the same WiFi network
 */
const USE_PHYSICAL_DEVICE = true;

/**
 * Set this to true to use the production API even in development mode
 * Useful for testing against deployed backend
 */
const USE_PRODUCTION_IN_DEV = true;

// ============================================================================
// AUTOMATIC URL SELECTION (Don't modify below unless you know what you're doing)
// ============================================================================

export const getApiBaseUrl = (): string => {
  // If in production build, always use production URL
  if (!__DEV__) {
    return PROD_API_URL;
  }

  // If forcing production in dev mode
  if (USE_PRODUCTION_IN_DEV) {
    console.log('📡 Using PRODUCTION API in development mode:', PROD_API_URL);
    return PROD_API_URL;
  }

  // Use local network URL for physical devices (mobile/Expo Go)
  // Set USE_PHYSICAL_DEVICE = true in config when testing on phone
  if (USE_PHYSICAL_DEVICE) {
    console.log('📱 Using LOCAL NETWORK URL for physical device:', DEV_LOCAL_NETWORK_URL);
    return DEV_LOCAL_NETWORK_URL;
  }

  // Default to localhost for web browser
  console.log('💻 Using LOCALHOST URL:', DEV_LOCALHOST_URL);
  return DEV_LOCALHOST_URL;
};

export const API_BASE_URL = getApiBaseUrl();

// ============================================================================
// OTHER CONFIGURATION
// ============================================================================

/**
 * Request timeout in milliseconds
 * Increase this if you have a slow network or backend
 * Mobile/Expo Go may need longer timeout
 */
export const API_TIMEOUT_MS = 10000; // 10 seconds

/**
 * Enable detailed API logging
 * Set to true to see all API requests/responses in console
 */
export const ENABLE_API_LOGGING = true;

/**
 * Retry configuration for failed requests
 */
export const API_RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // milliseconds
  retryOn: [408, 429, 500, 502, 503, 504], // HTTP status codes to retry
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Logs API configuration info (useful for debugging)
 */
export const logApiConfig = () => {
  console.log('='.repeat(60));
  console.log('🔧 API CONFIGURATION');
  console.log('='.repeat(60));
  console.log('Environment:', __DEV__ ? 'DEVELOPMENT' : 'PRODUCTION');
  console.log('Platform:', Platform.OS);
  console.log('Base URL:', API_BASE_URL);
  console.log('Timeout:', API_TIMEOUT_MS, 'ms');
  console.log('API Logging:', ENABLE_API_LOGGING ? 'Enabled' : 'Disabled');
  console.log('='.repeat(60));
};

// ============================================================================
// ENVIRONMENT INFO
// ============================================================================

export const ENV_INFO = {
  isDevelopment: __DEV__,
  isProduction: !__DEV__,
  platform: Platform.OS,
  apiUrl: API_BASE_URL,
  timeout: API_TIMEOUT_MS,
};

// ============================================================================
// USAGE EXAMPLES
// ============================================================================

/**
 * Example 1: Testing on Web Browser (same machine as backend)
 * - Set USE_PHYSICAL_DEVICE = false
 * - Backend runs on: http://localhost:5000
 * - Will use: DEV_LOCALHOST_URL
 *
 * Example 2: Testing on Android Emulator
 * - Set USE_PHYSICAL_DEVICE = false
 * - Backend runs on: http://localhost:5000
 * - Will use: DEV_ANDROID_EMULATOR_URL (10.0.2.2)
 *
 * Example 3: Testing on Physical Android/iOS Device
 * - Set USE_PHYSICAL_DEVICE = true
 * - Find your computer's IP: 192.168.1.100
 * - Update DEV_LOCAL_NETWORK_URL = 'http://192.168.1.100:5000/api/v1'
 * - Will use: DEV_LOCAL_NETWORK_URL
 *
 * Example 4: Testing against Production API
 * - Set USE_PRODUCTION_IN_DEV = true
 * - Will use: PROD_API_URL (even in development)
 */
