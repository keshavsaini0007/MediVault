import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider } from '../context/ThemeContext';
import { BadgeProvider } from '../context/BadgeContext';
import { LanguageProvider } from '../context/LanguageContext';

export default function RootLayout() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <BadgeProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="screens/SplashScreen" />
            <Stack.Screen name="screens/LoginScreen" />
            <Stack.Screen name="screens/Register" />
            <Stack.Screen name="screens/PatientDashboard" />
            <Stack.Screen name="screens/DoctorDashboard" />
            <Stack.Screen name="screens/Medicines" />
            <Stack.Screen name="screens/Reports" />
            <Stack.Screen name="screens/Symptoms" />
            <Stack.Screen name="screens/QRProfile" />
            <Stack.Screen name="screens/Notifications" />
            <Stack.Screen name="screens/Timeline" />
            <Stack.Screen name="screens/Profile" />
            <Stack.Screen name="screens/Messages" />
            <Stack.Screen name="screens/Patients" />
            <Stack.Screen name="screens/Alerts" />
            <Stack.Screen name="screens/PatientDetails" />
            <Stack.Screen name="screens/Records" />
          </Stack>
        </BadgeProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
