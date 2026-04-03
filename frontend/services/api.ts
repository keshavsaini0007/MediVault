import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  getApiBaseUrl,
  API_TIMEOUT_MS,
  logApiConfig,
} from "./config";

const TOKEN_KEY = "authToken";
const USER_KEY = "userData";
const DEMO_KEY = "isDemoUser";

// Check if in demo mode
const isDemoMode = async (): Promise<boolean> => {
  try {
    const val = await AsyncStorage.getItem(DEMO_KEY);
    return val === "true";
  } catch {
    return false;
  }
};

const setDemoMode = async (isDemo: boolean): Promise<void> => {
  try {
    if (isDemo) {
      await AsyncStorage.setItem(DEMO_KEY, "true");
    } else {
      await AsyncStorage.removeItem(DEMO_KEY);
    }
  } catch (error) {
    console.error("Error setting demo mode:", error);
  }
};

// Use centralized configuration - dynamically resolve on each request
let cachedBaseUrl: string | null = null;

const getBaseUrl = async (): Promise<string> => {
  if (!cachedBaseUrl) {
    cachedBaseUrl = await getApiBaseUrl();
  }
  return cachedBaseUrl;
};

const TIMEOUT_MS = API_TIMEOUT_MS;

// Log API configuration on startup (only in development)
if (__DEV__) {
  logApiConfig();
}

export interface User {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  username?: string;
  mobile?: string;
  phone?: string;
  address?: string;
  role: "patient" | "doctor";
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  assignedDoctorId?: string;
  specialization?: string;
  hospitalAffiliation?: string;
  hospitalId?: string;
  height?: number;
  weight?: number;
  conditions?: string[];
  createdAt?: string;
  updatedAt?: string;
}

export interface Medicine {
  _id: string;
  patientId: string;
  name: string;
  dosage: string;
  frequency: string;
  timeSlots: string[];
  startDate: string;
  endDate?: string;
  instructions?: string;
  isActive: boolean;
  createdAt: string;
}

export interface MedRecord {
  _id: string;
  patientId: string;
  doctorId?: string;
  date: string;
  diagnosis: string;
  notes?: string;
  medicines?: string[];
  fileUrls?: string[];
  aiSummary?: string;
  createdAt: string;
}

export interface Report {
  _id: string;
  patientId: string;
  reportType: string;
  originalName: string;
  mimeType: string;
  size: number;
  fileUrl: string;
  cloudinaryPublicId: string;
  aiSummary?: string;
  createdAt: string;
}

export interface SymptomLog {
  _id: string;
  patientId: string;
  symptoms: string;
  aiConditions: string[];
  specialistType: string;
  urgency: "low" | "medium" | "high";
  advice: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: "dose_missed" | "dose_missed_caregiver" | "dose_daily_summary" | "symptom_urgent" | "system";
  title: string;
  message: string;
  metadata?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export interface DueDose {
  medicineId: string;
  medicineName: string;
  dosage: string;
  slot: string;
  scheduledTime: string;
  status: "taken" | "missed" | "pending";
  isOverdue: boolean;
}

export interface AdherenceSummary {
  medicineId: string;
  total: number;
  taken: number;
  missed: number;
  adherencePercent: number;
}

export interface Patient {
  _id: string;
  firstName?: string;
  lastName?: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: {
    name?: string;
    phone?: string;
  };
  assignedDoctorId?: string;
  createdAt: string;
  updatedAt: string;
}

const getToken = async (): Promise<string | null> => {
  try {
    return await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

const setToken = async (token: string): Promise<void> => {
  try {
    await AsyncStorage.setItem(TOKEN_KEY, token);
  } catch (error) {
    console.error("Error saving token:", error);
  }
};

const clearToken = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY, DEMO_KEY]);
  } catch (error) {
    console.error("Error clearing token:", error);
  }
};

const getUserData = async (): Promise<User | null> => {
  try {
    const data = await AsyncStorage.getItem(USER_KEY);
    return data ? JSON.parse(data) : null;
  } catch {
    return null;
  }
};

const setUserData = async (user: User): Promise<void> => {
  try {
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(user));
  } catch (error) {
    console.error("Error saving user data:", error);
  }
};

const getMockResponse = (endpoint: string, requestBody?: string): { ok: boolean; status: number; data: Record<string, unknown> } => {
  // Patient endpoints
  if (endpoint === '/patient/dashboard') {
    return {
      ok: true,
      status: 200,
      data: {
        summary: {
          activeMedicines: 5,
          scheduledDosesToday: 4,
          takenToday: 2,
          missedToday: 0,
          pendingToday: 2,
          adherencePercent: 75,
          unreadNotifications: 3,
          recentRecordsCount: 12,
        },
        recentSymptoms: [],
        recentReports: [],
      },
    };
  }
  if (endpoint === '/medicine/due') {
    return {
      ok: true,
      status: 200,
      data: {
        summary: { total: 5, taken: 1, missed: 0, pending: 4, overdue: 0 },
        dueDoses: [
          { medicineId: '1', medicineName: 'Aspirin', dosage: '100mg', slot: 'Morning', scheduledTime: '08:00', status: 'taken', isOverdue: false },
          { medicineId: '2', medicineName: 'Metformin', dosage: '500mg', slot: 'Morning', scheduledTime: '08:00', status: 'pending', isOverdue: false },
          { medicineId: '2', medicineName: 'Metformin', dosage: '500mg', slot: 'Evening', scheduledTime: '20:00', status: 'pending', isOverdue: false },
          { medicineId: '3', medicineName: 'Vitamin D', dosage: '1000 IU', slot: 'Morning', scheduledTime: '08:00', status: 'pending', isOverdue: false },
          { medicineId: '4', medicineName: 'Amoxicillin', dosage: '250mg', slot: 'Afternoon', scheduledTime: '14:00', status: 'pending', isOverdue: false },
        ],
      },
    };
  }
  if (endpoint === '/medicine/adherence/weekly') {
    return {
      ok: true,
      status: 200,
      data: {
        trend: Array.from({ length: 7 }, (_, i) => ({
          date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString(),
          total: 4,
          taken: Math.floor(Math.random() * 4),
          missed: 0,
          adherencePercent: Math.floor(Math.random() * 30) + 70,
        })),
      },
    };
  }
  if (endpoint === '/patient/reports') {
    return { ok: true, status: 200, data: { reports: [] } };
  }
  if (endpoint === '/patient/records') {
    return { ok: true, status: 200, data: { records: [] } };
  }
  
  // Doctor endpoints
  if (endpoint === '/doctor/dashboard') {
    return {
      ok: true,
      status: 200,
      data: {
        summary: {
          assignedPatients: 12,
          highUrgencyPatients: 2,
          mediumUrgencyPatients: 3,
          missedDosesLast24h: 1,
          unreadNotifications: 5,
          recentRecordsCount: 8,
        },
        patients: [],
        recentSymptoms: [],
        recentReports: [],
      },
    };
  }
  if (endpoint === '/doctor/patients') {
    return { ok: true, status: 200, data: { count: 3, patients: [] } };
  }
  
  // Common endpoints
  if (endpoint === '/notifications') {
    return {
      ok: true,
      status: 200,
      data: {
        notifications: [],
        pagination: { total: 0, page: 1, limit: 20, totalPages: 0, hasNextPage: false, hasPrevPage: false },
      },
    };
  }
  if (endpoint === '/notifications/unread-count') {
    return { ok: true, status: 200, data: { unreadCount: 0, unreadByType: {} } };
  }
  if (endpoint === '/medicine') {
    return {
      ok: true,
      status: 200,
      data: {
        medicines: [
          {
            _id: '1',
            name: 'Aspirin',
            medicineName: 'Aspirin',
            dosage: '100mg',
            frequency: 'Once daily',
            timeSlots: ['Morning'],
            startDate: new Date().toISOString(),
            isActive: true,
          },
          {
            _id: '2',
            name: 'Metformin',
            medicineName: 'Metformin',
            dosage: '500mg',
            frequency: 'Twice daily',
            timeSlots: ['Morning', 'Evening'],
            startDate: new Date().toISOString(),
            isActive: true,
          },
          {
            _id: '3',
            name: 'Vitamin D',
            medicineName: 'Vitamin D',
            dosage: '1000 IU',
            frequency: 'Once daily',
            timeSlots: ['Morning'],
            startDate: new Date().toISOString(),
            isActive: true,
          },
          {
            _id: '4',
            name: 'Amoxicillin',
            medicineName: 'Amoxicillin',
            dosage: '250mg',
            frequency: 'Three times daily',
            timeSlots: ['Morning', 'Afternoon', 'Evening'],
            startDate: new Date().toISOString(),
            isActive: true,
          },
        ],
      },
    };
  }
  if (endpoint.startsWith('/medicine/adherence')) {
    return {
      ok: true,
      status: 200,
      data: {
        summary: [
          { medicineId: '1', total: 30, taken: 25, missed: 5, adherencePercent: 83 },
          { medicineId: '2', total: 30, taken: 28, missed: 2, adherencePercent: 93 },
          { medicineId: '3', total: 30, taken: 22, missed: 8, adherencePercent: 73 },
        ],
      },
    };
  }
  
  // Auth endpoints - always use mock for demo mode when backend fails
  if (endpoint === '/auth/register') {
    // Extract user data from request body if available
    let userData = {
      firstName: 'User',
      lastName: '',
      name: 'User',
      email: 'user@example.com',
      role: 'patient',
      bloodType: 'O+',
      allergies: [] as string[],
      caregiverName: '' as string | undefined,
      caregiverEmail: '' as string | undefined,
      caregiverPhone: '' as string | undefined,
    };
    try {
      const body = JSON.parse(requestBody || '{}');
      if (body.firstName) userData.firstName = body.firstName;
      if (body.lastName) userData.lastName = body.lastName;
      if (body.name) userData.name = body.name;
      else userData.name = (body.firstName || '') + ' ' + (body.lastName || '');
      if (body.email) userData.email = body.email;
      if (body.role) userData.role = body.role;
      if (body.bloodType) userData.bloodType = body.bloodType;
      if (body.allergies) userData.allergies = body.allergies;
      if (body.caregiverName) userData.caregiverName = body.caregiverName;
      if (body.caregiverEmail) userData.caregiverEmail = body.caregiverEmail;
      if (body.caregiverPhone) userData.caregiverPhone = body.caregiverPhone;
    } catch {}
    return {
      ok: true,
      status: 200,
      data: {
        token: 'demo-token-' + Date.now(),
        user: {
          _id: 'demo-user-' + Date.now(),
          ...userData,
        },
      },
    };
  }
  if (endpoint === '/auth/login') {
    let userData = {
      firstName: 'User',
      lastName: '',
      name: 'User',
      email: 'user@example.com',
      role: 'patient',
      bloodType: 'O+',
      allergies: [] as string[],
    };
    try {
      const body = JSON.parse(requestBody || '{}');
      if (body.identifier) userData.email = body.identifier;
      if (body.role) userData.role = body.role;
    } catch {}
    return {
      ok: true,
      status: 200,
      data: {
        token: 'demo-token-' + Date.now(),
        user: {
          _id: 'demo-user-' + Date.now(),
          ...userData,
        },
      },
    };
  }
  
  // Default: return success
  return { ok: true, status: 200, data: {} };
};

const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true,
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> => {
  const isAIEndpoint = endpoint.startsWith('/ai/') || endpoint.includes('/analyze');
  const timeoutMs = isAIEndpoint ? 30000 : TIMEOUT_MS;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "ngrok-skip-browser-warning": "true",
    ...((options.headers as Record<string, string>) || {}),
  };

  const isDemo = await isDemoMode();
  
  if (requiresAuth && !isDemo) {
    const token = await getToken();
    if (token) {
      headers["Authorization"] = "Bearer " + token;
    }
  }

  try {
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const text = await response.text();
    let data: Record<string, unknown> = {};

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = { message: "Invalid response from server" };
      }
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as Error & { name?: string; message?: string };
    if (err.name === "AbortError") {
      const isAuthEndpoint = endpoint.startsWith('/auth/') || endpoint === '/auth/login';
      if (isDemo || isAuthEndpoint) {
        return getMockResponse(endpoint, options.body as string | undefined);
      }
      throw new Error("Request timed out. Please check your connection.");
    }
    if (err.name === "TypeError" && err.message?.includes("Network")) {
      const isAuthEndpoint = endpoint.startsWith('/auth/') || endpoint === '/auth/login';
      if (isDemo || isAuthEndpoint) {
        return getMockResponse(endpoint, options.body as string | undefined);
      }
      throw new Error("Network error. Please check your internet connection.");
    }
    throw error;
  }
};

export const authAPI = {
  register: async (data: {
    name?: string;
    firstName?: string;
    lastName?: string;
    email: string;
    password: string;
    role: "patient" | "doctor";
    phone?: string;
    mobile?: string;
    username?: string;
    hospitalId?: string;
    bloodType?: string;
    allergies?: string[];
    specialization?: string;
    hospitalAffiliation?: string;
  }): Promise<{ token: string; user: User }> => {
    const response = await apiCall(
      "/auth/register",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false,
    );

    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Registration failed",
      );
    }

    const result = response.data as { token: string; user: User };
    await setToken(result.token);
    await setUserData(result.user);
    return result;
  },

  login: async (data: {
    email?: string;
    mobile?: string;
    phone?: string;
    username?: string;
    hospitalId?: string;
    identifier?: string;
    password: string;
    role?: "patient" | "doctor";
    loginMode?: string;
  }): Promise<{ token: string; user: User }> => {
    const response = await apiCall(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
      false,
    );

    if (!response.ok) {
      throw new Error((response.data.message as string) || "Login failed");
    }

    const result = response.data as { token: string; user: User };
    await setToken(result.token);
    await setUserData(result.user);
    return result;
  },

  me: async (): Promise<User> => {
    const response = await apiCall("/auth/me");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get user",
      );
    }
    return response.data.user as User;
  },

  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    mobile?: string;
    address?: string;
  }): Promise<User> => {
    const response = await apiCall("/auth/profile", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to update profile",
      );
    }
    const updatedUser = response.data.user as User;
    await setUserData(updatedUser);
    return updatedUser;
  },

  updateHealthInfo: async (data: {
    bloodType?: string;
    allergies?: string[];
    height?: number;
    weight?: number;
    conditions?: string[];
    emergencyContact?: { name?: string; phone?: string };
  }): Promise<User> => {
    const response = await apiCall("/auth/health", {
      method: "PATCH",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to update health info",
      );
    }
    const updatedUser = response.data.user as User;
    await setUserData(updatedUser);
    return updatedUser;
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<void> => {
    const response = await apiCall("/auth/change-password", {
      method: "POST",
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to change password",
      );
    }
  },

  logout: async (): Promise<void> => {
    await clearToken();
  },
};

export const patientAPI = {
  getDashboard: async (): Promise<{
    summary: {
      activeMedicines: number;
      scheduledDosesToday: number;
      takenToday: number;
      missedToday: number;
      pendingToday: number;
      adherencePercent: number;
      unreadNotifications: number;
      recentRecordsCount: number;
    };
    recentSymptoms: SymptomLog[];
    recentReports: Report[];
  }> => {
    try {
      const response = await apiCall("/patient/dashboard");
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) || "Failed to get dashboard",
        );
      }
      return response.data as {
        summary: {
          activeMedicines: number;
          scheduledDosesToday: number;
          takenToday: number;
          missedToday: number;
          pendingToday: number;
          adherencePercent: number;
          unreadNotifications: number;
          recentRecordsCount: number;
        };
        recentSymptoms: SymptomLog[];
        recentReports: Report[];
      };
    } catch (error) {
      // Return mock data when backend is not available
      console.log("Using mock data for patient dashboard");
      return {
        summary: {
          activeMedicines: 5,
          scheduledDosesToday: 4,
          takenToday: 2,
          missedToday: 0,
          pendingToday: 2,
          adherencePercent: 75,
          unreadNotifications: 3,
          recentRecordsCount: 12,
        },
        recentSymptoms: [],
        recentReports: [],
      };
    }
  },

  getRecords: async (): Promise<MedRecord[]> => {
    const response = await apiCall("/patient/records");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get records",
      );
    }
    return response.data.records as MedRecord[];
  },

  getRecordById: async (id: string): Promise<MedRecord> => {
    const response = await apiCall(`/patient/records/${id}`);
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get record",
      );
    }
    return response.data.record as MedRecord;
  },

  getReports: async (): Promise<Report[]> => {
    const response = await apiCall("/patient/reports");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get reports",
      );
    }
    return response.data.reports as Report[];
  },

  uploadReport: async (formData: FormData): Promise<Report> => {
    const token = await getToken();
    const baseUrl = await getBaseUrl();
    const response = await fetch(`${baseUrl}/patient/reports`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await response.text();
    if (!text) throw new Error("Empty response from server");

    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error("Invalid JSON response");
    }

    if (!response.ok) {
      throw new Error((data.message as string) || "Upload failed");
    }

    return data.report as Report;
  },

  deleteReport: async (id: string): Promise<void> => {
    const response = await apiCall(`/patient/reports/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to delete report",
      );
    }
  },
};

export const doctorAPI = {
  getDashboard: async (): Promise<{
    summary: {
      assignedPatients: number;
      highUrgencyPatients: number;
      mediumUrgencyPatients: number;
      missedDosesLast24h: number;
      unreadNotifications: number;
      recentRecordsCount: number;
    };
    patients: Patient[];
    recentSymptoms: Array<SymptomLog & { patientId: { name: string } }>;
    recentReports: Array<Report & { patientId: { name: string } }>;
  }> => {
    try {
      const response = await apiCall("/doctor/dashboard");
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) || "Failed to get dashboard",
        );
      }
      return response.data as {
        summary: {
          assignedPatients: number;
          highUrgencyPatients: number;
          mediumUrgencyPatients: number;
          missedDosesLast24h: number;
          unreadNotifications: number;
          recentRecordsCount: number;
        };
        patients: Patient[];
        recentSymptoms: Array<SymptomLog & { patientId: { name: string } }>;
        recentReports: Array<Report & { patientId: { name: string } }>;
      };
    } catch (error) {
      // Return mock data when backend is not available
      console.log("Using mock data for doctor dashboard");
      return {
        summary: {
          assignedPatients: 12,
          highUrgencyPatients: 2,
          mediumUrgencyPatients: 3,
          missedDosesLast24h: 1,
          unreadNotifications: 5,
          recentRecordsCount: 8,
        },
        patients: [
          {
            _id: "1",
            name: "John Smith",
            email: "john@example.com",
            bloodType: "O+",
            phone: "+1234567890",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: "2",
            name: "Sarah Johnson",
            email: "sarah@example.com",
            bloodType: "A+",
            phone: "+1234567891",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: "3",
            name: "Mike Williams",
            email: "mike@example.com",
            bloodType: "B+",
            phone: "+1234567892",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
        recentSymptoms: [
          {
            _id: "1",
            patientId: "1",
            symptoms: "Chest pain and shortness of breath",
            urgency: "high",
            createdAt: new Date().toISOString(),
            aiConditions: [],
            specialistType: "Cardiologist",
            advice: "Immediate attention required",
          },
          {
            _id: "2",
            patientId: "2",
            symptoms: "Headache and dizziness",
            urgency: "medium",
            createdAt: new Date().toISOString(),
            aiConditions: [],
            specialistType: "Neurologist",
            advice: "Schedule appointment",
          },
        ],
        recentReports: [],
      } as any;
    }
  },

  getPatients: async (
    query?: string,
  ): Promise<{ count: number; patients: Patient[] }> => {
    try {
      const endpoint = query
        ? `/doctor/patients?q=${encodeURIComponent(query)}`
        : "/doctor/patients";
      const response = await apiCall(endpoint);
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) || "Failed to get patients",
        );
      }
      return response.data as { count: number; patients: Patient[] };
    } catch (error) {
      // Return mock data when backend is not available
      console.log("Using mock data for patients");
      return {
        count: 3,
        patients: [
          {
            _id: "1",
            name: "John Smith",
            email: "john@example.com",
            bloodType: "O+",
            phone: "+1234567890",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: "2",
            name: "Sarah Johnson",
            email: "sarah@example.com",
            bloodType: "A+",
            phone: "+1234567891",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
          {
            _id: "3",
            name: "Mike Williams",
            email: "mike@example.com",
            bloodType: "B+",
            phone: "+1234567892",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ] as any,
      };
    }
  },

  assignPatient: async (patientId: string): Promise<Patient> => {
    const response = await apiCall(`/doctor/patients/${patientId}/assign`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to assign patient",
      );
    }
    return response.data.patient as Patient;
  },

  unassignPatient: async (patientId: string): Promise<Patient> => {
    const response = await apiCall(`/doctor/patients/${patientId}/unassign`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to unassign patient",
      );
    }
    return response.data.patient as Patient;
  },

  createRecord: async (data: {
    patientId: string;
    diagnosis: string;
    notes?: string;
    medicines?: string[];
    date?: string;
  }): Promise<MedRecord> => {
    const response = await apiCall("/doctor/records", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to create record",
      );
    }
    return response.data.record as MedRecord;
  },

  getPatientRecords: async (
    patientId: string,
  ): Promise<{ patient: Patient; records: MedRecord[] }> => {
    try {
      const response = await apiCall(`/doctor/patients/${patientId}/records`);
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) || "Failed to get patient records",
        );
      }
      return response.data as { patient: Patient; records: MedRecord[] };
    } catch (error) {
      console.log("Using mock data for patient records");
      return {
        patient: {
          _id: patientId,
          name: "John Smith",
          email: "john@example.com",
          bloodType: "O+",
          phone: "+1234567890",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        } as any,
        records: [
          {
            _id: "1",
            date: new Date().toISOString(),
            diagnosis: "Annual Checkup",
            type: "Check-up",
          },
          {
            _id: "2",
            date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
            diagnosis: "Flu Treatment",
            type: "OPD",
          },
        ] as any,
      };
    }
  },

  getPatientReports: async (
    patientId: string,
  ): Promise<{ patient: { id: string; name: string }; reports: Report[] }> => {
    try {
      const response = await apiCall(`/doctor/patients/${patientId}/reports`);
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) || "Failed to get patient reports",
        );
      }
      return response.data as {
        patient: { id: string; name: string };
        reports: Report[];
      };
    } catch (error) {
      console.log("Using mock data for patient reports");
      return {
        patient: { id: patientId, name: "John Smith" },
        reports: [
          {
            _id: "1",
            reportType: "Blood Test",
            createdAt: new Date().toISOString(),
          },
          {
            _id: "2",
            reportType: "X-Ray",
            createdAt: new Date(
              Date.now() - 14 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ] as any,
      };
    }
  },

  getPatientMedicines: async (patientId: string): Promise<Medicine[]> => {
    try {
      const response = await apiCall(`/doctor/patients/${patientId}/medicines`);
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) ||
            "Failed to get patient medicines",
        );
      }
      return response.data.medicines as Medicine[];
    } catch (error) {
      console.log("Using mock data for patient medicines");
      return [
        {
          _id: "1",
          medicineName: "Aspirin",
          dosage: "100mg",
          frequency: "Once daily",
        },
        {
          _id: "2",
          medicineName: "Vitamin D",
          dosage: "1000 IU",
          frequency: "Once daily",
        },
      ] as any;
    }
  },

  getPatientSymptoms: async (patientId: string): Promise<SymptomLog[]> => {
    try {
      const response = await apiCall(`/doctor/patients/${patientId}/symptoms`);
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) || "Failed to get patient symptoms",
        );
      }
      return response.data.logs as SymptomLog[];
    } catch (error) {
      console.log("Using mock data for patient symptoms");
      return [
        {
          _id: "1",
          symptoms: "Headache",
          urgency: "low",
          createdAt: new Date().toISOString(),
          aiConditions: [],
          specialistType: "General Physician",
          advice: "Rest and hydrate",
        },
      ] as any;
    }
  },

  scanPatientQr: async (
    qrToken: string,
    context?: string,
  ): Promise<Patient> => {
    const response = await apiCall("/qr/scan", {
      method: "POST",
      body: JSON.stringify({ qrToken, context }),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || "Failed to scan QR");
    }
    return response.data.patient as Patient;
  },

  getScanAuditLogs: async (): Promise<
    Array<{
      _id: string;
      patientId: { name: string };
      scannedAt: string;
      scannerType: string;
      context: string;
    }>
  > => {
    const response = await apiCall("/qr/audit");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get scan logs",
      );
    }
    return response.data.logs as Array<{
      _id: string;
      patientId: { name: string };
      scannedAt: string;
      scannerType: string;
      context: string;
    }>;
  },
};

export const medicineAPI = {
  getMedicines: async (): Promise<Medicine[]> => {
    try {
      const response = await apiCall("/medicine");
      if (!response.ok) {
        throw new Error(
          (response.data.message as string) || "Failed to get medicines",
        );
      }
      return response.data.medicines as Medicine[];
    } catch (error) {
      // Return mock data when backend is not available
      console.log("Using mock data for medicines");
      return [
        {
          _id: "1",
          name: "Aspirin",
          medicineName: "Aspirin",
          dosage: "100mg",
          frequency: "Once daily",
          timeSlots: ["Morning"],
          startDate: new Date().toISOString(),
        },
        {
          _id: "2",
          name: "Metformin",
          medicineName: "Metformin",
          dosage: "500mg",
          frequency: "Twice daily",
          timeSlots: ["Morning", "Evening"],
          startDate: new Date().toISOString(),
        },
        {
          _id: "3",
          name: "Vitamin D",
          medicineName: "Vitamin D",
          dosage: "1000 IU",
          frequency: "Once daily",
          timeSlots: ["Morning"],
          startDate: new Date().toISOString(),
        },
      ] as any;
    }
  },

  addMedicine: async (data: {
    name: string;
    dosage: string;
    frequency?: string;
    timeSlots?: string[];
    startDate?: string;
    endDate?: string;
    instructions?: string;
  }): Promise<Medicine> => {
    const response = await apiCall("/medicine", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to add medicine",
      );
    }
    return response.data.medicine as Medicine;
  },

  getDueDoses: async (): Promise<{
    summary: {
      total: number;
      taken: number;
      missed: number;
      pending: number;
      overdue: number;
    };
    dueDoses: DueDose[];
  }> => {
    const response = await apiCall("/medicine/due");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get due doses",
      );
    }
    return response.data as {
      summary: {
        total: number;
        taken: number;
        missed: number;
        pending: number;
        overdue: number;
      };
      dueDoses: DueDose[];
    };
  },

  logDose: async (
    medicineId: string,
    status: "taken" | "missed",
    scheduledTime?: string,
  ): Promise<void> => {
    const response = await apiCall(`/medicine/${medicineId}/log`, {
      method: "POST",
      body: JSON.stringify({ status, scheduledTime }),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to log dose",
      );
    }
  },

  markDoseStatus: async (
    medicineId: string,
    status: "taken" | "missed",
    scheduledTime?: string,
  ): Promise<void> => {
    const response = await apiCall("/medicine/mark", {
      method: "POST",
      body: JSON.stringify({ medicineId, status, scheduledTime }),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to mark dose",
      );
    }
  },

  getAdherenceSummary: async (
    medicineId?: string,
  ): Promise<AdherenceSummary[]> => {
    const endpoint = medicineId
      ? `/medicine/adherence?medicineId=${medicineId}`
      : "/medicine/adherence";
    const response = await apiCall(endpoint);
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get adherence",
      );
    }
    return response.data.summary as AdherenceSummary[];
  },

  getWeeklyAdherence: async (
    medicineId?: string,
  ): Promise<{
    trend: Array<{
      date: string;
      total: number;
      taken: number;
      missed: number;
      adherencePercent: number;
    }>;
  }> => {
    const endpoint = medicineId
      ? `/medicine/adherence/weekly?medicineId=${medicineId}`
      : "/medicine/adherence/weekly";
    const response = await apiCall(endpoint);
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get weekly adherence",
      );
    }
    return response.data as {
      trend: Array<{
        date: string;
        total: number;
        taken: number;
        missed: number;
        adherencePercent: number;
      }>;
    };
  },
};

export const symptomAPI = {
  checkSymptoms: async (symptoms: string): Promise<SymptomLog> => {
    const response = await apiCall("/symptom/check", {
      method: "POST",
      body: JSON.stringify({ symptoms }),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to check symptoms",
      );
    }
    return response.data.result as SymptomLog;
  },

  getHistory: async (): Promise<SymptomLog[]> => {
    const response = await apiCall("/symptom/history");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get symptom history",
      );
    }
    return response.data.logs as SymptomLog[];
  },
};

export const notificationAPI = {
  getNotifications: async (params?: {
    unreadOnly?: boolean;
    isRead?: boolean;
    type?: string;
    limit?: number;
    page?: number;
  }): Promise<{
    notifications: Notification[];
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
    };
  }> => {
    const searchParams = new URLSearchParams();
    if (params?.unreadOnly) searchParams.set("unreadOnly", "true");
    if (params?.isRead !== undefined)
      searchParams.set("isRead", String(params.isRead));
    if (params?.type) searchParams.set("type", params.type);
    if (params?.limit) searchParams.set("limit", String(params.limit));
    if (params?.page) searchParams.set("page", String(params.page));

    const query = searchParams.toString();
    const endpoint = query ? `/notifications?${query}` : "/notifications";

    const response = await apiCall(endpoint);
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get notifications",
      );
    }
    return response.data as {
      notifications: Notification[];
      pagination: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
    };
  },

  getUnreadCount: async (): Promise<{
    unreadCount: number;
    unreadByType: Record<string, number>;
  }> => {
    const response = await apiCall("/notifications/unread-count");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get unread count",
      );
    }
    return response.data as {
      unreadCount: number;
      unreadByType: Record<string, number>;
    };
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    const response = await apiCall(`/notifications/${notificationId}/read`, {
      method: "PATCH",
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to mark as read",
      );
    }
  },

  markAllAsRead: async (): Promise<void> => {
    const response = await apiCall("/notifications/read-all", {
      method: "PATCH",
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to mark all as read",
      );
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    const response = await apiCall(`/notifications/${notificationId}`, {
      method: "DELETE",
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to delete notification",
      );
    }
  },
};

export const qrAPI = {
  getMyProfile: async (): Promise<{
    qrToken: string;
    payload: {
      patientId: string;
      name: string;
      bloodType: string | null;
      allergies: string[];
    };
  }> => {
    const response = await apiCall("/qr/my-profile");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get QR profile",
      );
    }
    return response.data as {
      qrToken: string;
      payload: {
        patientId: string;
        name: string;
        bloodType: string | null;
        allergies: string[];
      };
    };
  },

  getEmergencyProfile: async (): Promise<{
    qrToken: string;
    url: string;
    expiresIn: string;
  }> => {
    const response = await apiCall("/qr/my-emergency-profile");
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to get emergency profile",
      );
    }
    return response.data as { qrToken: string; url: string; expiresIn: string };
  },
};

export const aiAPI = {
  explainMedicine: async (medicineName: string): Promise<{
    medicine: string;
    explanation: string;
    is_mock: boolean;
  }> => {
    const response = await apiCall("/ai/medicine", {
      method: "POST",
      body: JSON.stringify({ medicine_name: medicineName }),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to explain medicine",
      );
    }
    return response.data as { medicine: string; explanation: string; is_mock: boolean };
  },

  triage: async (symptoms: string): Promise<{
    symptoms: string;
    triage: string;
    is_mock: boolean;
    disclaimer: string;
  }> => {
    const response = await apiCall("/ai/triage", {
      method: "POST",
      body: JSON.stringify({ symptoms }),
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to triage symptoms",
      );
    }
    return response.data as { symptoms: string; triage: string; is_mock: boolean; disclaimer: string };
  },

  analyzeReport: async (reportId: string): Promise<{
    aiSummary: string;
    is_mock: boolean;
    message: string;
  }> => {
    const response = await apiCall(`/patient/reports/${reportId}/analyze`, {
      method: "POST",
    });
    if (!response.ok) {
      throw new Error(
        (response.data.message as string) || "Failed to analyze report",
      );
    }
    return response.data as { aiSummary: string; is_mock: boolean; message: string };
  },
};

export { getToken, setToken, clearToken, getUserData, setUserData, setDemoMode, getBaseUrl, isDemoMode };
