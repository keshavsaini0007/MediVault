import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const TOKEN_KEY = '@MediVault:authToken';
const USER_KEY = '@MediVault:userData';

const BASE_URL = (() => {
  if (__DEV__) {
    if (Platform.OS === 'android') {
      return 'http://10.5.0.108:5000/api/v1';
    }
    return 'http://localhost:5000/api/v1';
  }
  return "https://medivault-cxas.onrender.com/api/v1";
})();
const TIMEOUT_MS = 120000;

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
  role: 'patient' | 'doctor';
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
  urgency: 'low' | 'medium' | 'high';
  advice: string;
  createdAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  type: 'dose_missed' | 'symptom_urgent' | 'system';
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
  status: 'taken' | 'missed' | 'pending';
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
    console.error('Error saving token:', error);
  }
};

const clearToken = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
  } catch (error) {
    console.error('Error clearing token:', error);
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
    console.error('Error saving user data:', error);
  }
};

const apiCall = async (
  endpoint: string,
  options: RequestInit = {},
  requiresAuth: boolean = true
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };

  if (requiresAuth) {
    const token = await getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(`${BASE_URL}${endpoint}`, {
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
        data = { message: 'Invalid response from server' };
      }
    }

    return { ok: response.ok, status: response.status, data };
  } catch (error: unknown) {
    clearTimeout(timeoutId);
    const err = error as Error & { name?: string; message?: string };
    if (err.name === 'AbortError') {
      throw new Error('Request timed out. Please check your connection.');
    }
    if (err.name === 'TypeError' && err.message?.includes('Network')) {
      throw new Error('Network error. Please check your internet connection.');
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
    role: 'patient' | 'doctor';
    phone?: string;
    mobile?: string;
    username?: string;
    hospitalId?: string;
    bloodType?: string;
    allergies?: string[];
    specialization?: string;
    hospitalAffiliation?: string;
  }): Promise<{ token: string; user: User }> => {
    const response = await apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);

    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Registration failed');
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
    role?: 'patient' | 'doctor';
    loginMode?: string;
  }): Promise<{ token: string; user: User }> => {
    const response = await apiCall('/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, false);

    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Login failed');
    }

    const result = response.data as { token: string; user: User };
    await setToken(result.token);
    await setUserData(result.user);
    return result;
  },

  me: async (): Promise<User> => {
    const response = await apiCall('/auth/me');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get user');
    }
    return (response.data.user as User);
  },

  updateProfile: async (data: {
    firstName?: string;
    lastName?: string;
    name?: string;
    phone?: string;
    mobile?: string;
    address?: string;
  }): Promise<User> => {
    const response = await apiCall('/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to update profile');
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
    const response = await apiCall('/auth/health', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to update health info');
    }
    const updatedUser = response.data.user as User;
    await setUserData(updatedUser);
    return updatedUser;
  },

  changePassword: async (currentPassword: string, newPassword: string): Promise<void> => {
    const response = await apiCall('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to change password');
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
    const response = await apiCall('/patient/dashboard');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get dashboard');
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
  },

  getRecords: async (): Promise<MedRecord[]> => {
    const response = await apiCall('/patient/records');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get records');
    }
    return (response.data.records as MedRecord[]);
  },

  getRecordById: async (id: string): Promise<MedRecord> => {
    const response = await apiCall(`/patient/records/${id}`);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get record');
    }
    return (response.data.record as MedRecord);
  },

  getReports: async (): Promise<Report[]> => {
    const response = await apiCall('/patient/reports');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get reports');
    }
    return (response.data.reports as Report[]);
  },

  uploadReport: async (formData: FormData): Promise<Report> => {
    const token = await getToken();
    const response = await fetch(`${BASE_URL}/patient/reports`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });

    const text = await response.text();
    if (!text) throw new Error('Empty response from server');

    let data: Record<string, unknown> = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Invalid JSON response');
    }

    if (!response.ok) {
      throw new Error((data.message as string) || 'Upload failed');
    }

    return (data.report as Report);
  },

  deleteReport: async (id: string): Promise<void> => {
    const response = await apiCall(`/patient/reports/${id}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to delete report');
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
    const response = await apiCall('/doctor/dashboard');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get dashboard');
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
  },

  getPatients: async (query?: string): Promise<{ count: number; patients: Patient[] }> => {
    const endpoint = query ? `/doctor/patients?q=${encodeURIComponent(query)}` : '/doctor/patients';
    const response = await apiCall(endpoint);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get patients');
    }
    return response.data as { count: number; patients: Patient[] };
  },

  assignPatient: async (patientId: string): Promise<Patient> => {
    const response = await apiCall(`/doctor/patients/${patientId}/assign`, { method: 'POST' });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to assign patient');
    }
    return (response.data.patient as Patient);
  },

  unassignPatient: async (patientId: string): Promise<Patient> => {
    const response = await apiCall(`/doctor/patients/${patientId}/unassign`, { method: 'POST' });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to unassign patient');
    }
    return (response.data.patient as Patient);
  },

  createRecord: async (data: {
    patientId: string;
    diagnosis: string;
    notes?: string;
    medicines?: string[];
    date?: string;
  }): Promise<MedRecord> => {
    const response = await apiCall('/doctor/records', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to create record');
    }
    return (response.data.record as MedRecord);
  },

  getPatientRecords: async (patientId: string): Promise<{ patient: Patient; records: MedRecord[] }> => {
    const response = await apiCall(`/doctor/patients/${patientId}/records`);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get patient records');
    }
    return response.data as { patient: Patient; records: MedRecord[] };
  },

  getPatientReports: async (patientId: string): Promise<{ patient: { id: string; name: string }; reports: Report[] }> => {
    const response = await apiCall(`/doctor/patients/${patientId}/reports`);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get patient reports');
    }
    return response.data as { patient: { id: string; name: string }; reports: Report[] };
  },

  getPatientMedicines: async (patientId: string): Promise<Medicine[]> => {
    const response = await apiCall(`/doctor/patients/${patientId}/medicines`);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get patient medicines');
    }
    return (response.data.medicines as Medicine[]);
  },

  getPatientSymptoms: async (patientId: string): Promise<SymptomLog[]> => {
    const response = await apiCall(`/doctor/patients/${patientId}/symptoms`);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get patient symptoms');
    }
    return (response.data.logs as SymptomLog[]);
  },

  scanPatientQr: async (qrToken: string, context?: string): Promise<Patient> => {
    const response = await apiCall('/qr/scan', {
      method: 'POST',
      body: JSON.stringify({ qrToken, context }),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to scan QR');
    }
    return (response.data.patient as Patient);
  },

  getScanAuditLogs: async (): Promise<Array<{
    _id: string;
    patientId: { name: string };
    scannedAt: string;
    scannerType: string;
    context: string;
  }>> => {
    const response = await apiCall('/qr/audit');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get scan logs');
    }
    return (response.data.logs as Array<{
      _id: string;
      patientId: { name: string };
      scannedAt: string;
      scannerType: string;
      context: string;
    }>);
  },
};

export const medicineAPI = {
  getMedicines: async (): Promise<Medicine[]> => {
    const response = await apiCall('/medicine');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get medicines');
    }
    return (response.data.medicines as Medicine[]);
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
    const response = await apiCall('/medicine', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to add medicine');
    }
    return (response.data.medicine as Medicine);
  },

  getDueDoses: async (): Promise<{
    summary: { total: number; taken: number; missed: number; pending: number; overdue: number };
    dueDoses: DueDose[];
  }> => {
    const response = await apiCall('/medicine/due');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get due doses');
    }
    return response.data as {
      summary: { total: number; taken: number; missed: number; pending: number; overdue: number };
      dueDoses: DueDose[];
    };
  },

  logDose: async (medicineId: string, status: 'taken' | 'missed', scheduledTime?: string): Promise<void> => {
    const response = await apiCall(`/medicine/${medicineId}/log`, {
      method: 'POST',
      body: JSON.stringify({ status, scheduledTime }),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to log dose');
    }
  },

  markDoseStatus: async (medicineId: string, status: 'taken' | 'missed', scheduledTime?: string): Promise<void> => {
    const response = await apiCall('/medicine/mark', {
      method: 'POST',
      body: JSON.stringify({ medicineId, status, scheduledTime }),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to mark dose');
    }
  },

  getAdherenceSummary: async (medicineId?: string): Promise<AdherenceSummary[]> => {
    const endpoint = medicineId ? `/medicine/adherence?medicineId=${medicineId}` : '/medicine/adherence';
    const response = await apiCall(endpoint);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get adherence');
    }
    return (response.data.summary as AdherenceSummary[]);
  },

  getWeeklyAdherence: async (medicineId?: string): Promise<{
    trend: Array<{
      date: string;
      total: number;
      taken: number;
      missed: number;
      adherencePercent: number;
    }>;
  }> => {
    const endpoint = medicineId ? `/medicine/adherence/weekly?medicineId=${medicineId}` : '/medicine/adherence/weekly';
    const response = await apiCall(endpoint);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get weekly adherence');
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
    const response = await apiCall('/symptom/check', {
      method: 'POST',
      body: JSON.stringify({ symptoms }),
    });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to check symptoms');
    }
    return (response.data.result as SymptomLog);
  },

  getHistory: async (): Promise<SymptomLog[]> => {
    const response = await apiCall('/symptom/history');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get symptom history');
    }
    return (response.data.logs as SymptomLog[]);
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
    if (params?.unreadOnly) searchParams.set('unreadOnly', 'true');
    if (params?.isRead !== undefined) searchParams.set('isRead', String(params.isRead));
    if (params?.type) searchParams.set('type', params.type);
    if (params?.limit) searchParams.set('limit', String(params.limit));
    if (params?.page) searchParams.set('page', String(params.page));

    const query = searchParams.toString();
    const endpoint = query ? `/notifications?${query}` : '/notifications';

    const response = await apiCall(endpoint);
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get notifications');
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

  getUnreadCount: async (): Promise<{ unreadCount: number; unreadByType: Record<string, number> }> => {
    const response = await apiCall('/notifications/unread-count');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get unread count');
    }
    return response.data as { unreadCount: number; unreadByType: Record<string, number> };
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    const response = await apiCall(`/notifications/${notificationId}/read`, { method: 'PATCH' });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to mark as read');
    }
  },

  markAllAsRead: async (): Promise<void> => {
    const response = await apiCall('/notifications/read-all', { method: 'PATCH' });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to mark all as read');
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    const response = await apiCall(`/notifications/${notificationId}`, { method: 'DELETE' });
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to delete notification');
    }
  },
};

export const qrAPI = {
  getMyProfile: async (): Promise<{ qrToken: string; payload: { patientId: string; name: string; bloodType: string | null; allergies: string[] } }> => {
    const response = await apiCall('/qr/my-profile');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get QR profile');
    }
    return response.data as { qrToken: string; payload: { patientId: string; name: string; bloodType: string | null; allergies: string[] } };
  },

  getEmergencyProfile: async (): Promise<{
    qrToken: string;
    url: string;
    expiresIn: string;
  }> => {
    const response = await apiCall('/qr/my-emergency-profile');
    if (!response.ok) {
      throw new Error((response.data.message as string) || 'Failed to get emergency profile');
    }
    return response.data as { qrToken: string; url: string; expiresIn: string };
  },
};

export { getToken, setToken, clearToken, getUserData, setUserData, BASE_URL };
