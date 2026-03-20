import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { notificationAPI, Notification } from '../services/api';

const TOKEN_KEY = '@MediVault:authToken';

export type AlertItem = {
  id: string;
  severity: 'critical' | 'warning';
  patient: string;
  initials: string;
  issue: string;
  detail: string;
  time: string;
  phone: string;
  doctor: string;
  responded: boolean;
};

export type NotifItem = {
  id: string;
  icon: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  tag: string;
  type: string;
};

export type Message = {
  id: number;
  from: 'patient' | 'doctor';
  text: string;
  time: string;
  read: boolean;
};

export type DoctorSettings = {
  criticalPatientAlerts: boolean;
  missedDoseAlerts: boolean;
  newReportUploads: boolean;
  smsDeliveryConfirm: boolean;
  weeklyPatientSummary: boolean;
  lowAdherenceWarning: boolean;
};

export type PatientSettings = {
  medicationReminders: boolean;
  missedDoseAlerts: boolean;
  doctorMessages: boolean;
  aiReportReady: boolean;
  weeklyAdherenceReport: boolean;
  streakMilestones: boolean;
};

const INIT_DOCTOR_SETTINGS: DoctorSettings = {
  criticalPatientAlerts: true,
  missedDoseAlerts: true,
  newReportUploads: true,
  smsDeliveryConfirm: false,
  weeklyPatientSummary: true,
  lowAdherenceWarning: true,
};

const INIT_PATIENT_SETTINGS: PatientSettings = {
  medicationReminders: true,
  missedDoseAlerts: true,
  doctorMessages: true,
  aiReportReady: true,
  weeklyAdherenceReport: false,
  streakMilestones: true,
};

const getNotifIcon = (type: string): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'dose_missed': return 'medical-outline';
    case 'symptom_urgent': return 'alert-circle';
    case 'system': return 'notifications-outline';
    default: return 'document-text-outline';
  }
};

const getNotifTag = (type: string): string => {
  switch (type) {
    case 'dose_missed': return 'Medicine';
    case 'symptom_urgent': return 'Alert';
    case 'system': return 'System';
    default: return 'Notification';
  }
};

const formatTime = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins} min ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} hr ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

interface BadgeContextValue {
  notifCount: number;
  messageCount: number;
  alertCount: number;
  clearNotifs: () => void;
  clearMessages: () => void;
  clearAlerts: () => void;

  doctorNotifs: NotifItem[];
  patientNotifs: NotifItem[];
  markOneNotif: (role: 'doctor' | 'patient', id: string) => void;
  markAllNotifs: (role: 'doctor' | 'patient') => void;
  removeNotif: (role: 'doctor' | 'patient', id: string) => void;
  refreshNotifications: () => Promise<void>;

  messages: Record<number, Message[]>;
  openConv: (id: number) => void;
  sendMessage: (convId: number, text: string) => void;

  doctorSettings: DoctorSettings;
  patientSettings: PatientSettings;
  toggleDoctorSetting: (key: keyof DoctorSettings) => void;
  togglePatientSetting: (key: keyof PatientSettings) => void;

  isLoading: boolean;
}

const BadgeContext = createContext<BadgeContextValue>({
  notifCount: 0,
  messageCount: 0,
  alertCount: 0,
  clearNotifs: () => {},
  clearMessages: () => {},
  clearAlerts: () => {},
  doctorNotifs: [],
  patientNotifs: [],
  markOneNotif: () => {},
  markAllNotifs: () => {},
  removeNotif: () => {},
  refreshNotifications: async () => {},
  messages: {},
  openConv: () => {},
  sendMessage: () => {},
  doctorSettings: INIT_DOCTOR_SETTINGS,
  patientSettings: INIT_PATIENT_SETTINGS,
  toggleDoctorSetting: () => {},
  togglePatientSetting: () => {},
  isLoading: true,
});

export function BadgeProvider({ children }: { children: React.ReactNode }) {
  const [notifCount, setNotifCount] = useState(0);
  const [messageCount, setMessageCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const [doctorNotifs, setDoctorNotifs] = useState<NotifItem[]>([]);
  const [patientNotifs, setPatientNotifs] = useState<NotifItem[]>([]);

  const [messages, setMessages] = useState<Record<number, Message[]>>({});

  const [doctorSettings, setDoctorSettings] = useState<DoctorSettings>(INIT_DOCTOR_SETTINGS);
  const [patientSettings, setPatientSettings] = useState<PatientSettings>(INIT_PATIENT_SETTINGS);

  const clearNotifs = useCallback(() => setNotifCount(0), []);
  const clearMessages = useCallback(() => setMessageCount(0), []);
  const clearAlerts = useCallback(() => setAlertCount(0), []);

  const markOneNotif = useCallback(async (role: 'doctor' | 'patient', id: string) => {
    try {
      await notificationAPI.markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }

    const set = role === 'doctor' ? setDoctorNotifs : setPatientNotifs;
    set(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
    setNotifCount(prev => Math.max(0, prev - 1));
  }, []);

  const markAllNotifs = useCallback(async (role: 'doctor' | 'patient') => {
    try {
      await notificationAPI.markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }

    const set = role === 'doctor' ? setDoctorNotifs : setPatientNotifs;
    set(prev => prev.map(n => ({ ...n, read: true })));
    setNotifCount(0);
  }, []);

  const removeNotif = useCallback((role: 'doctor' | 'patient', id: string) => {
    const set = role === 'doctor' ? setDoctorNotifs : setPatientNotifs;
    set(prev => {
      const removed = prev.find(n => n.id === id);
      if (removed && !removed.read) {
        setNotifCount(c => Math.max(0, c - 1));
      }
      return prev.filter(n => n.id !== id);
    });
  }, []);

  const refreshNotifications = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem(TOKEN_KEY);
      if (!token) {
        setIsLoading(false);
        return;
      }
      
      const response = await notificationAPI.getNotifications({ limit: 50 });
      const notifications = response.notifications;

      const mappedNotifs: NotifItem[] = notifications.map((n: Notification) => ({
        id: n._id,
        icon: getNotifIcon(n.type),
        title: n.title,
        body: n.message,
        time: formatTime(n.createdAt),
        read: n.isRead,
        tag: getNotifTag(n.type),
        type: n.type,
      }));

      setPatientNotifs(mappedNotifs);
      setDoctorNotifs(mappedNotifs);

      const unreadCount = notifications.filter((n: Notification) => !n.isRead).length;
      setNotifCount(unreadCount);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const openConv = useCallback((id: number) => {
    setMessages(prev => ({
      ...prev,
      [id]: (prev[id] || []).map(m => ({ ...m, read: true })),
    }));
  }, []);

  const sendMessage = useCallback((convId: number, text: string) => {
    const newMsg: Message = {
      id: Date.now(),
      from: 'doctor',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      read: true,
    };
    setMessages(prev => ({
      ...prev,
      [convId]: [...(prev[convId] || []), newMsg],
    }));
  }, []);

  const toggleDoctorSetting = useCallback((key: keyof DoctorSettings) => {
    setDoctorSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const togglePatientSetting = useCallback((key: keyof PatientSettings) => {
    setPatientSettings(prev => ({ ...prev, [key]: !prev[key] }));
  }, []);

  useEffect(() => {
    const checkAndFetch = async () => {
      try {
        const token = await AsyncStorage.getItem(TOKEN_KEY);
        if (token) {
          await refreshNotifications();
        } else {
          setIsLoading(false);
        }
      } catch {
        setIsLoading(false);
      }
    };
    checkAndFetch();
  }, [refreshNotifications]);

  return (
    <BadgeContext.Provider value={{
      notifCount,
      messageCount,
      alertCount,
      clearNotifs,
      clearMessages,
      clearAlerts,
      doctorNotifs,
      patientNotifs,
      markOneNotif,
      markAllNotifs,
      removeNotif,
      refreshNotifications,
      messages,
      openConv,
      sendMessage,
      doctorSettings,
      patientSettings,
      toggleDoctorSetting,
      togglePatientSetting,
      isLoading,
    }}>
      {children}
    </BadgeContext.Provider>
  );
}

export function useBadges() {
  return useContext(BadgeContext);
}
