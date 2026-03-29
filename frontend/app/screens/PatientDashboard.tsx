import React, { useRef, useState, useEffect, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Animated, Alert, RefreshControl } from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNavLayout from '@/components/BottomNavLayout';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar, IconBox, ColorIcon } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { patientAPI, medicineAPI } from '../../services/api';

interface DashboardData {
  activeMedicines: number;
  scheduledDosesToday: number;
  takenToday: number;
  missedToday: number;
  pendingToday: number;
  adherencePercent: number;
  unreadNotifications: number;
  recentRecordsCount: number;
}

interface DueDose {
  medicineId: string;
  medicineName: string;
  dosage: string;
  slot: string;
  scheduledTime: string;
  status: 'taken' | 'missed' | 'pending';
  isOverdue: boolean;
}

interface WeeklyTrend {
  date: string;
  total: number;
  taken: number;
  missed: number;
  adherencePercent: number;
}

interface Report {
  _id: string;
  reportType: string;
  originalName: string;
  fileUrl: string;
  createdAt: string;
}

function MedRow({ med, onMarkTaken }: { med: DueDose; onMarkTaken: (med: DueDose) => void }) {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const scale = useRef(new Animated.Value(1)).current;
  const isDue = med.status === 'pending' || med.status === 'missed';
  const isOverdue = med.isOverdue && med.status === 'pending';

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
        style={[s.medRow, { 
          backgroundColor: colors.bgCard,
          shadowColor: isOverdue ? colors.danger : colors.success,
          shadowOpacity: 0.12,
          borderColor: colors.borderSoft,
        }]}>
        <View style={[s.medDotBig, {
          backgroundColor: isOverdue ? colors.dangerSoft : colors.successSoft,
          shadowColor: isOverdue ? colors.danger : colors.success,
          shadowOpacity: 0.25,
        }]}>
          <Ionicons 
            name={isOverdue ? "alert-circle" : "checkmark-circle"} 
            size={18} 
            color={isOverdue ? colors.danger : colors.success} 
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{med.medicineName}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
            <Ionicons name="time-outline" size={12} color={colors.textFaint} />
            <Text style={{ fontSize: 12, color: colors.textFaint }}>{med.slot} · {med.dosage}</Text>
          </View>
        </View>
        {isDue ? (
          <Button
            label={med.status === 'missed' ? t('med.action.retake') : t('med.action.take')}
            onPress={() => onMarkTaken(med)}
            size="sm"
            icon={isOverdue ? "refresh" : "checkmark"}
            pill
          />
        ) : (
          <Badge label={t('med.badge.taken')} type="success" icon="checkmark-circle" />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
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

export default function PatientDashboard() {
  const router = useRouter();
  const { colors, isDark, userName } = useTheme();
  const { t } = useLanguage();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [dueDoses, setDueDoses] = useState<DueDose[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [recentReports, setRecentReports] = useState<Report[]>([]);

  const fetchDashboard = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [dashboardRes, dueDosesRes, weeklyRes, reportsRes] = await Promise.all([
        patientAPI.getDashboard(),
        medicineAPI.getDueDoses(),
        medicineAPI.getWeeklyAdherence(),
        patientAPI.getReports(),
      ]);

      setDashboard({
        activeMedicines: dashboardRes.summary.activeMedicines,
        scheduledDosesToday: dashboardRes.summary.scheduledDosesToday,
        takenToday: dashboardRes.summary.takenToday,
        missedToday: dashboardRes.summary.missedToday,
        pendingToday: dashboardRes.summary.pendingToday,
        adherencePercent: dashboardRes.summary.adherencePercent,
        unreadNotifications: dashboardRes.summary.unreadNotifications,
        recentRecordsCount: dashboardRes.summary.recentRecordsCount,
      });

      setDueDoses(dueDosesRes.dueDoses.slice(0, 5));
      setWeeklyTrend(weeklyRes.trend);
      setRecentReports(reportsRes.slice(0, 3));
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

  const handleMarkTaken = async (dose: DueDose) => {
    try {
      await medicineAPI.markDoseStatus(dose.medicineId, 'taken', dose.scheduledTime);
      setDueDoses(prev =>
        prev.map(d =>
          d.medicineId === dose.medicineId && d.slot === dose.slot
            ? { ...d, status: 'taken' as const }
            : d
        )
      );
      fetchDashboard();
    } catch (error) {
      Alert.alert(t('patient.alert.errorTitle'), t('patient.alert.markDoseFailed'));
    }
  };

  const quickActions: Array<{ icon: keyof typeof Ionicons.glyphMap; label: string; route: Href; bg: string; fg: string }> = [
    { icon: 'fitness-outline', label: t('patient.qa.symptoms'), route: '/screens/Symptoms', bg: colors.primarySoft, fg: colors.primary },
    { icon: 'document-text-outline', label: t('patient.qa.reports'), route: '/screens/Reports', bg: colors.tealSoft, fg: colors.teal },
    { icon: 'medical-outline', label: t('patient.qa.medicines'), route: '/screens/Medicines', bg: colors.successSoft, fg: colors.success },
    { icon: 'qr-code-outline', label: t('patient.qa.qrProfile'), route: '/screens/QRProfile', bg: colors.accentSoft, fg: colors.accent },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('patient.greeting.morning');
    if (hour < 17) return t('patient.greeting.afternoon');
    return t('patient.greeting.evening');
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()];
  };

  const formatReportDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const getReportIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const lower = type.toLowerCase();
    if (lower.includes('blood')) return 'water-outline';
    if (lower.includes('x-ray') || lower.includes('xray')) return 'image-outline';
    if (lower.includes('ultrasound')) return 'pulse-outline';
    if (lower.includes('ecg') || lower.includes('ekg')) return 'heart-outline';
    if (lower.includes('ct')) return 'scan-outline';
    if (lower.includes('mri')) return 'magnet-outline';
    return 'document-outline';
  };

  return (
    <BottomNavLayout 
      title={t('patient.title')}
      subtitle={`${getGreeting()}, ${userName || t('common.user')}!`}
      role="patient"
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.bgPage }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Welcome Banner */}
        <View style={[s.banner, { 
          backgroundColor: isDark ? '#062d2d' : colors.teal,
          shadowColor: colors.teal,
          shadowOpacity: 0.3,
        }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>{getGreeting()}, {userName || t('common.user')}!</Text>
            <Text style={s.bannerSub}>
              {dashboard ? `${dashboard.scheduledDosesToday} ${t('patient.banner.scheduledToday')}` : t('common.loading')}
            </Text>
            <View style={s.bannerBtns}>
              <TouchableOpacity onPress={() => router.push('/screens/Medicines')} activeOpacity={0.8}
                style={[s.bannerBtn, { backgroundColor: 'rgba(255,255,255,0.95)' }]}>
                <Text style={[s.bannerBtnText, { color: colors.teal }]}>{t('patient.banner.viewSchedule')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/screens/Symptoms')} activeOpacity={0.8}
                style={[s.bannerBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                <Text style={[s.bannerBtnText, { color: 'white' }]}>{t('patient.banner.report')}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={s.bannerIcon}>
            <Ionicons name="fitness" size={36} color="rgba(255,255,255,0.6)" />
          </View>
          <View style={s.circle1} />
          <View style={s.circle2} />
          <View style={s.circle3} />
        </View>

        {/* Stats */}
        <View style={s.statsGrid}>
          <View style={s.statHalf}>
            <StatCard icon="medical-outline" value={String(dashboard?.activeMedicines ?? 0)} label={t('patient.stats.medicines')} iconBg={colors.primarySoft} />
          </View>
          <View style={s.statHalf}>
            <StatCard icon="checkmark-circle-outline" value={`${dashboard?.adherencePercent ?? 0}%`} label={t('patient.stats.adherence')} iconBg={colors.successSoft} valueColor={colors.success} iconColor={colors.success} />
          </View>
          <View style={s.statHalf}>
            <StatCard icon="folder-outline" value={String(dashboard?.recentRecordsCount ?? 0)} label={t('patient.stats.records7d')} iconBg={colors.tealSoft} valueColor={colors.teal} iconColor={colors.teal} />
          </View>
          <View style={s.statHalf}>
            <StatCard icon="notifications-outline" value={String(dashboard?.unreadNotifications ?? 0)} label={t('patient.stats.alerts')} iconBg={colors.accentSoft} valueColor={colors.accent} iconColor={colors.accent} />
          </View>
        </View>

        {/* Today's Medications */}
        <Card variant="elevated" glowColor={colors.teal} accentColor={colors.teal}>
          <CardHeader title={t('patient.section.todaysMeds')} right={
            <TouchableOpacity onPress={() => router.push('/screens/Medicines')}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>{t('common.viewAll')}</Text>
                <Ionicons name="chevron-forward" size={14} color={colors.primary} />
              </View>
            </TouchableOpacity>
          }/>
          <View style={{ padding: 16, gap: 2 }}>
            {loading ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>{t('common.loading')}</Text>
            ) : dueDoses.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
                {t('patient.empty.noMedsToday')}
              </Text>
            ) : (
              dueDoses.map((med, idx) => <MedRow key={`${med.medicineId}-${med.slot}-${idx}`} med={med} onMarkTaken={handleMarkTaken} />)
            )}
          </View>
        </Card>

        {/* Quick Actions */}
        <View style={s.qaGrid}>
          {quickActions.map(a => <QuickActionItem key={String(a.route)} {...a} />)}
        </View>

        {/* Score + Streak */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={[s.scoreCard, { 
            backgroundColor: colors.teal,
            shadowColor: colors.teal,
            shadowOpacity: 0.4,
            flex: 1 
          }]}>
            <View style={s.scoreIconWrap}>
              <Ionicons name="heart" size={24} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={s.scoreCaption}>{t('patient.score.healthScore')}</Text>
            <Text style={s.scoreVal}>
              {dashboard?.adherencePercent ?? 0}<Text style={s.scoreMax}>/100</Text>
            </Text>
            <ProgressBar value={dashboard?.adherencePercent ?? 0} color="rgba(255,255,255,0.9)" height={6} style={{ marginVertical: 8 }} />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              {dashboard && dashboard.adherencePercent >= 80 ? t('patient.score.excellent') : dashboard && dashboard.adherencePercent >= 50 ? t('patient.score.good') : t('patient.score.improving')}
            </Text>
          </View>
          <View style={[s.scoreCard, { 
            backgroundColor: colors.accent,
            shadowColor: colors.accent,
            shadowOpacity: 0.4,
            flex: 1 
          }]}>
            <View style={s.scoreIconWrap}>
              <Ionicons name="flame" size={24} color="rgba(255,255,255,0.8)" />
            </View>
            <Text style={s.scoreVal}>{dashboard?.takenToday ?? 0}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>{t('patient.score.dosesTaken')}</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>{dashboard?.pendingToday ?? 0} {t('patient.score.pending')}</Text>
          </View>
        </View>

        {/* Weekly Adherence */}
        <Card variant="elevated" glowColor={colors.teal}>
          <CardHeader 
            title={t('patient.section.weeklyAdherence')}
            icon="analytics-outline"
            right={
              <Badge
                label={dashboard?.adherencePercent && dashboard.adherencePercent >= 80 ? t('patient.weekly.onTrack') : t('patient.weekly.keepGoing')}
                type={dashboard?.adherencePercent && dashboard.adherencePercent >= 80 ? 'success' : 'warning'}
              />
            }
          />
          <View style={{ padding: 16 }}>
            <View style={s.barChart}>
              {weeklyTrend.map((day, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                  <View style={[s.bar, {
                    height: Math.max(4, day.adherencePercent * 0.6),
                    backgroundColor: i === weeklyTrend.length - 1 ? colors.teal : colors.tealSoft,
                    shadowColor: i === weeklyTrend.length - 1 ? colors.teal : 'transparent',
                    shadowOpacity: i === weeklyTrend.length - 1 ? 0.4 : 0,
                    shadowRadius: 4,
                    borderTopLeftRadius: 4, borderTopRightRadius: 4,
                  }]} />
                  <Text style={{ fontSize: 10, color: colors.textFaint }}>{getDayName(day.date)}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* Recent Reports */}
        <Card variant="elevated" glowColor={colors.teal}>
          <CardHeader 
            title={t('patient.section.recentReports')}
            icon="document-text-outline"
            right={
              <TouchableOpacity onPress={() => router.push('/screens/Reports')}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={{ color: colors.teal, fontSize: 12, fontWeight: '700' }}>{t('common.viewAll')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.teal} />
                </View>
              </TouchableOpacity>
            }
          />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {recentReports.length === 0 ? (
              <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
                {t('patient.empty.noReports')}
              </Text>
            ) : (
              recentReports.map((r, i) => (
                <TouchableOpacity 
                  key={r._id} 
                  style={[s.reportRow, i < recentReports.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}
                  activeOpacity={0.7}
                >
                  <IconBox 
                    icon={getReportIcon(r.reportType)} 
                    color={colors.teal} 
                    bg={colors.tealSoft}
                    size={42}
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{r.reportType}</Text>
                    <Text style={{ fontSize: 12, color: colors.textFaint }}>{formatReportDate(r.createdAt)}</Text>
                  </View>
                  <Badge label={t('common.view')} type="teal" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </Card>
      </ScrollView>
    </BottomNavLayout>
  );
}

const s = StyleSheet.create({
  banner: {
    borderRadius: 24, padding: 24, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
    elevation: 10,
  },
  bannerTitle: { fontSize: 20, fontWeight: '900', color: 'white', marginBottom: 4, letterSpacing: -0.4 },
  bannerSub: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginBottom: 14 },
  bannerBtns: { flexDirection: 'row', gap: 10 },
  bannerBtn: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 12 },
  bannerBtnText: { fontWeight: '700', fontSize: 12 },
  bannerIcon: {
    width: 70, height: 70, borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
    marginLeft: 8,
  },
  circle1: { position: 'absolute', width: 150, height: 150, borderRadius: 75, backgroundColor: 'rgba(255,255,255,0.08)', right: -40, top: -50 },
  circle2: { position: 'absolute', width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(255,255,255,0.06)', right: 30, bottom: -30 },
  circle3: { position: 'absolute', width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.05)', right: 10, top: 20 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  medRow: { 
    flexDirection: 'row', alignItems: 'center', 
    padding: 14, borderRadius: 18, marginBottom: 8, 
    borderWidth: 1, borderColor: 'rgba(0,0,0,0.03)',
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 16,
    elevation: 4,
    gap: 14,
  },
  medDotBig: { 
    width: 40, height: 40, borderRadius: 20, 
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 3,
  },
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
  scoreCard: { 
    borderRadius: 24, padding: 20, alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 28,
    elevation: 10,
  },
  scoreIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 8,
  },
  scoreCaption: { fontSize: 11, color: 'rgba(255,255,255,0.7)', marginBottom: 4 },
  scoreVal: { fontSize: 36, fontWeight: '900', color: 'white', lineHeight: 40 },
  scoreMax: { fontSize: 14, fontWeight: '400', color: 'rgba(255,255,255,0.5)' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 6 },
  bar: { flex: 1, minHeight: 4, shadowOffset: { width: 0, height: 2 }, shadowRadius: 4 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
});
