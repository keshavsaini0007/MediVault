import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Animated, RefreshControl } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNavLayout from '@/components/BottomNavLayout';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar, Avatar, IconBox, ColorIcon } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { doctorAPI } from '../../services/api';

interface Patient {
  _id: string;
  name: string;
  email: string;
  mobile?: string;
  phone?: string;
  bloodType?: string;
  allergies?: string[];
  emergencyContact?: { name?: string; phone?: string };
  assignedDoctorId?: string;
  createdAt: string;
  updatedAt: string;
}

interface SymptomLog {
  _id: string;
  patientId: { name: string } | string;
  symptoms: string;
  urgency: 'low' | 'medium' | 'high';
  createdAt: string;
}

interface Report {
  _id: string;
  patientId: { name: string } | string;
  reportType: string;
  createdAt: string;
}

interface DashboardSummary {
  assignedPatients: number;
  highUrgencyPatients: number;
  mediumUrgencyPatients: number;
  missedDosesLast24h: number;
  unreadNotifications: number;
  recentRecordsCount: number;
}

function QuickActionItem({ icon, label, route, bg, fg }: {
  icon: keyof typeof Ionicons.glyphMap; label: string; route: Href; bg: string; fg: string;
}) {
  const router = useRouter();
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[s.qaItem, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
        onPress={() => router.push(route)}
        style={[s.qaBtn, {
          backgroundColor: colors.bgCard,
          shadowColor: fg,
          shadowOpacity: 0.15,
          borderColor: colors.borderSoft,
        }]}
        activeOpacity={1}>
        <ColorIcon icon={icon} color={fg} bg={bg} size={48} />
        <Text style={[s.qaLabel, { color: colors.textPrimary }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

function PatientRow({ patient, onPress }: { patient: Patient; onPress: () => void }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
        onPress={onPress}
        style={[s.patientRow, {
          backgroundColor: colors.bgCard,
          shadowColor: colors.primary,
          shadowOpacity: 0.1,
          borderColor: colors.borderSoft,
        }]}
        activeOpacity={1}>
        <Avatar initials={getInitials(patient.name)} size={44} />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{patient.name}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
            {patient.bloodType && <Badge label={patient.bloodType} type="primary" />}
            <Text style={{ fontSize: 12, color: colors.textFaint }}>{patient.email}</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    </Animated.View>
  );
}

function AlertRow({ symptom }: { symptom: SymptomLog }) {
  const { colors } = useTheme();
  const patientName = typeof symptom.patientId === 'object' ? symptom.patientId?.name || 'Unknown' : 'Unknown';

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return colors.danger;
      case 'medium': return colors.warning;
      default: return colors.success;
    }
  };

  const getUrgencyBg = (urgency: string) => {
    switch (urgency) {
      case 'high': return colors.dangerSoft;
      case 'medium': return colors.warningSoft;
      default: return colors.successSoft;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins} min ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  };

  return (
    <View style={[s.alertCard, {
      backgroundColor: colors.bgCard,
      shadowColor: getUrgencyColor(symptom.urgency),
      shadowOpacity: 0.12,
      borderColor: colors.borderSoft,
    }]}>
      <View style={[s.alertAccent, { backgroundColor: getUrgencyColor(symptom.urgency) }]} />
      <View style={{ padding: 14, flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <IconBox
            icon="alert-circle"
            color={getUrgencyColor(symptom.urgency)}
            bg={getUrgencyBg(symptom.urgency)}
            size={40}
          />
          <View style={{ flex: 1 }}>
            <Text style={[s.alertName, { color: colors.textPrimary }]}>{patientName}</Text>
            <Text style={[s.alertIssue, { color: colors.textMuted }]} numberOfLines={1}>
              {symptom.symptoms}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 10 }}>
          <Badge label={symptom.urgency.toUpperCase()} type={symptom.urgency === 'high' ? 'danger' : symptom.urgency === 'medium' ? 'warning' : 'success'} />
          <Text style={{ fontSize: 11, color: colors.textFaint }}>
            {formatTime(symptom.createdAt)}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { colors, userName } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardSummary | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [recentSymptoms, setRecentSymptoms] = useState<SymptomLog[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await doctorAPI.getDashboard();

      setDashboard({
        assignedPatients: data.summary.assignedPatients,
        highUrgencyPatients: data.summary.highUrgencyPatients,
        mediumUrgencyPatients: data.summary.mediumUrgencyPatients,
        missedDosesLast24h: data.summary.missedDosesLast24h,
        unreadNotifications: data.summary.unreadNotifications,
        recentRecordsCount: data.summary.recentRecordsCount,
      });

      setPatients(data.patients);
      setRecentSymptoms(data.recentSymptoms);
      setRecentReports(data.recentReports);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = useCallback(() => {
    fetchDashboard(true);
  }, [fetchDashboard]);

  const getDateString = () => {
    const now = new Date();
    return now.toLocaleDateString('en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const quickActions: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; route: Href; bg: string; fg: string }> = [
    { icon: 'people-outline', label: t('doctor.qa.patients'), route: '/screens/Patients', bg: colors.primarySoft, fg: colors.primary },
    { icon: 'alert-circle-outline', label: t('doctor.qa.alerts'), route: '/screens/Alerts', bg: colors.dangerSoft, fg: colors.danger },
    { icon: 'chatbubbles-outline', label: t('doctor.qa.messages'), route: '/screens/Messages', bg: colors.tealSoft, fg: colors.teal },
    { icon: 'notifications-outline', label: t('doctor.qa.notifications'), route: '/screens/Notifications', bg: colors.warningSoft, fg: colors.warning },
  ];

  return (
    <BottomNavLayout
      title={t('doctor.title')}
      subtitle={getDateString()}
      role="doctor"
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.bgPage }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Stats */}
        <View style={s.statsGrid}>
          <View style={s.statHalf}>
            <StatCard icon="people-outline" value={String(dashboard?.assignedPatients ?? 0)} label={t('doctor.stats.totalPatients')} />
          </View>
          <View style={s.statHalf}>
            <StatCard icon="alert-circle-outline" value={String(dashboard?.highUrgencyPatients ?? 0)} label={t('doctor.stats.criticalAlerts')} iconBg={colors.dangerSoft} valueColor={colors.danger} iconColor={colors.danger} />
          </View>
          <View style={s.statHalf}>
            <StatCard icon="warning-outline" value={String(dashboard?.mediumUrgencyPatients ?? 0)} label={t('doctor.stats.moderateAlerts')} iconBg={colors.warningSoft} valueColor={colors.warning} iconColor={colors.warning} />
          </View>
          <View style={s.statHalf}>
            <StatCard icon="medical-outline" value={String(dashboard?.missedDosesLast24h ?? 0)} label={t('doctor.stats.missed24h')} iconBg={colors.accentSoft} valueColor={colors.accent} iconColor={colors.accent} />
          </View>
        </View>

        {/* Recent Alerts */}
        <Card variant="elevated" glowColor={colors.danger}>
          <CardHeader
            title={t('doctor.section.recentAlerts')}
            icon="alert-circle-outline"
            right={
              <Button label={t('common.viewAll')} style={{ marginLeft: 10 }}
                onPress={() => router.push('/screens/Alerts')} variant="outline" size="sm" />
            }
          />
          <View style={{ padding: 12, gap: 10 }}>
            {loading ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>{t('common.loading')}</Text>
            ) : recentSymptoms.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
                {t('doctor.empty.noRecentAlerts')}
              </Text>
            ) : (
              recentSymptoms.slice(0, 5).map((symptom) => (
                <AlertRow key={symptom._id} symptom={symptom} />
              ))
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={s.qaGrid}>
          {quickActions.map(a => (
            <QuickActionItem key={String(a.route)} {...a} />
          ))}
        </View>

        {/* Patients Overview */}
        <Card variant="elevated" glowColor={colors.primary}>
          <CardHeader
            title={t('doctor.section.patientsOverview')}
            icon="people-outline"
            right={
              <Button label={t('common.viewAll')} onPress={() => router.push('/screens/Patients')} variant="outline" size="sm" />
            }
          />
          <View style={{ padding: 16, gap: 12 }}>
            {loading ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>{t('common.loading')}</Text>
            ) : patients.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <IconBox icon="people-outline" color={colors.textFaint} bg={colors.primarySoft} size={56} />
                <Text style={{ color: colors.textMuted, marginTop: 12 }}>{t('doctor.empty.noPatients')}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 4 }}>
                  {t('doctor.empty.noPatientsHint')}
                </Text>
              </View>
            ) : (
              patients.slice(0, 5).map((patient) => (
                <PatientRow
                  key={patient._id}
                  patient={patient}
                  onPress={() => router.push({ pathname: '/screens/PatientDetails', params: { id: patient._id } })}
                />
              ))
            )}
          </View>
        </Card>
      </ScrollView>
    </BottomNavLayout>
  );
}

const s = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  alertCard: {
    flexDirection: 'row',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
  },
  alertAccent: { width: 4 },
  alertName: { fontWeight: '700', fontSize: 14 },
  alertIssue: { fontSize: 12, marginTop: 2 },
  metricBox: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 5 },
  bar: { flex: 1, minHeight: 4 },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  qaItem: { width: '48%' },
  qaBtn: {
    padding: 16, borderRadius: 20, alignItems: 'center', gap: 10,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 5,
  },
  qaIconWrap: {
    width: 52, height: 52, borderRadius: 16,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
  qaLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },
  patientRow: {
    flexDirection: 'row', alignItems: 'center',
    padding: 14, borderRadius: 18,
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 3,
  },
});
