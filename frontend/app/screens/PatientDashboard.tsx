
import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity, StyleSheet,
  Animated, Alert, RefreshControl, Easing, Dimensions
} from 'react-native';
import { useRouter, Href } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNavLayout from '@/components/BottomNavLayout';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar, IconBox, ColorIcon } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { patientAPI, medicineAPI } from '../../services/api';

const { width } = Dimensions.get('window');

// ─── Types ────────────────────────────────────────────────────────
interface DashboardData {
  activeMedicines: number; scheduledDosesToday: number; takenToday: number;
  missedToday: number; pendingToday: number; adherencePercent: number;
  unreadNotifications: number; recentRecordsCount: number;
}
interface DueDose {
  medicineId: string; medicineName: string; dosage: string; slot: string;
  scheduledTime: string; status: 'taken' | 'missed' | 'pending'; isOverdue: boolean;
}
interface WeeklyTrend {
  date: string; total: number; taken: number; missed: number; adherencePercent: number;
}
interface Report {
  _id: string; reportType: string; originalName: string; fileUrl: string; createdAt: string;
}

// ─── Animated entrance hook ────────────────────────────────────────
function useSlideIn(delay = 0) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 520, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
      Animated.timing(translateY, { toValue: 0, duration: 520, delay, useNativeDriver: true, easing: Easing.out(Easing.cubic) }),
    ]).start();
  }, []);
  return { opacity, transform: [{ translateY }] };
}

// ─── Pulse dot ──────────────────────────────────────────────────────
function PulseDot({ color }: { color: string }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true, easing: Easing.out(Easing.quad) }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true, easing: Easing.in(Easing.quad) }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 10, height: 10, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={{
        position: 'absolute', width: 10, height: 10, borderRadius: 5,
        backgroundColor: color, opacity: 0.35, transform: [{ scale: pulse }],
      }} />
      <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: color }} />
    </View>
  );
}

// ─── Glass Card Wrapper ─────────────────────────────────────────────
function GlassCard({ children, style, isDark }: any) {
  return (
    <View style={[
      s2.glassCard,
      {
        backgroundColor: isDark ? 'rgba(255, 255, 255, 0.04)' : 'rgba(255, 255, 255, 0.55)',
        borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.4)',
      },
      style
    ]}>
      {children}
    </View>
  );
}

// ─── MedRow ─────────────────────────────────────────────────────────
function MedRow({ med, onMarkTaken, index }: { med: DueDose; onMarkTaken: (med: DueDose) => void; index: number }) {
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();
  const scale = useRef(new Animated.Value(1)).current;
  const anim = useSlideIn(index * 80);
  const isDue = med.status === 'pending' || med.status === 'missed';
  const isOverdue = med.isOverdue && med.status === 'pending';
  const accentColor = isOverdue ? colors.danger : med.status === 'taken' ? colors.success : colors.teal;

  return (
    <Animated.View style={[{ transform: [{ scale }, ...(anim.transform as any)] }, { opacity: anim.opacity }]}>
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 220 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 220 }).start()}
      >
        <GlassCard isDark={isDark} style={[s2.medRow, { borderLeftColor: accentColor, borderLeftWidth: 3 }]}>
          <View style={[s2.medIconWrap, { backgroundColor: accentColor + '20' }]}>
            <Ionicons name={isOverdue ? 'alert-circle' : med.status === 'taken' ? 'checkmark-circle' : 'time'} size={20} color={accentColor} />
          </View>
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary, letterSpacing: 0.1 }}>{med.medicineName}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <PulseDot color={accentColor} />
              <Text style={{ fontSize: 12, color: colors.textFaint }}>{med.slot} · {med.dosage}</Text>
            </View>
          </View>
          {isDue ? (
            <Button label={med.status === 'missed' ? t('med.action.retake') : t('med.action.take')} onPress={() => onMarkTaken(med)} size="sm" icon={isOverdue ? 'refresh' : 'checkmark'} pill />
          ) : (
            <Badge label={t('med.badge.taken')} type="success" icon="checkmark-circle" />
          )}
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── HUD Stat Tile ──────────────────────────────────────────────────
function HUDTile({ icon, value, label, accent, delay = 0 }: { icon: keyof typeof Ionicons.glyphMap; value: string; label: string; accent: string; delay?: number; }) {
  const { colors, isDark } = useTheme();
  const anim = useSlideIn(delay);
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={[{ width: '48%' }, { opacity: anim.opacity, transform: anim.transform }]}>
      <TouchableOpacity
        activeOpacity={0.85}
        onPressIn={() => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true }).start()}
      >
        <GlassCard isDark={isDark} style={[s2.hudTile, { shadowColor: accent }]}>
          <Animated.View style={{ transform: [{ scale }] }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <View style={[s2.hudIconBox, { backgroundColor: accent + '20' }]}>
                <Ionicons name={icon} size={18} color={accent} />
              </View>
              <View style={[s2.hudDot, { backgroundColor: accent }]} />
            </View>
            <Text style={[s2.hudValue, { color: accent }]}>{value}</Text>
            <Text style={[s2.hudLabel, { color: colors.textFaint }]}>{label}</Text>
            <View style={[s2.hudLine, { backgroundColor: accent + '40' }]} />
          </Animated.View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Quick Action ───────────────────────────────────────────────────
function QuickActionItem({ icon, label, route, bg, fg, delay = 0 }: { icon: keyof typeof Ionicons.glyphMap; label: string; route: Href; bg: string; fg: string; delay?: number; }) {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const anim = useSlideIn(delay);

  return (
    <Animated.View style={[{ width: '48%' }, { opacity: anim.opacity, transform: anim.transform }]}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
        onPress={() => router.push(route)}
        activeOpacity={1}
      >
        <GlassCard isDark={isDark} style={[s2.qaBtn, { shadowColor: fg }]}>
          <Animated.View style={{ transform: [{ scale }], alignItems: 'center', gap: 10 }}>
            <View style={[s2.qaIconRing, { borderColor: fg + '40', backgroundColor: fg + '15' }]}>
              <ColorIcon icon={icon} color={fg} bg="transparent" size={44} />
            </View>
            <Text style={[s2.qaLabel, { color: colors.textPrimary }]}>{label}</Text>
          </Animated.View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────
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

  const bannerAnim = useSlideIn(0);
  const statsAnim = useSlideIn(120);
  const medsAnim = useSlideIn(200);
  const qaAnim = useSlideIn(280);
  const scoreAnim = useSlideIn(340);
  const weeklyAnim = useSlideIn(400);
  const reportAnim = useSlideIn(460);

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

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);
  const onRefresh = useCallback(() => { fetchDashboard(true); }, [fetchDashboard]);

  const handleMarkTaken = async (dose: DueDose) => {
    try {
      await medicineAPI.markDoseStatus(dose.medicineId, 'taken', dose.scheduledTime);
      setDueDoses(prev =>
        prev.map(d =>
          d.medicineId === dose.medicineId && d.slot === dose.slot
            ? { ...d, status: 'taken' as const } : d
        )
      );
      fetchDashboard();
    } catch {
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
    const h = new Date().getHours();
    if (h < 12) return t('patient.greeting.morning');
    if (h < 17) return t('patient.greeting.afternoon');
    return t('patient.greeting.evening');
  };

  const getDayName = (d: string) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(d).getDay()];
  const formatReportDate = (d: string) => new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const getReportIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const l = type.toLowerCase();
    if (l.includes('blood')) return 'water-outline';
    if (l.includes('x-ray') || l.includes('xray')) return 'image-outline';
    if (l.includes('ultrasound')) return 'pulse-outline';
    if (l.includes('ecg') || l.includes('ekg')) return 'heart-outline';
    if (l.includes('ct')) return 'scan-outline';
    if (l.includes('mri')) return 'magnet-outline';
    return 'document-outline';
  };

  return (
    <BottomNavLayout
      title={t('patient.title')}
      subtitle={`${getGreeting()}, ${userName || t('common.user')}!`}
      role="patient"
    >
      <View style={{ flex: 1, backgroundColor: isDark ? '#080d14' : '#eaf2fa', overflow: 'hidden' }}>
        {/* Background Blurred Blobs for Glassmorphism Context */}
        <View style={[s2.bgBlob, { backgroundColor: colors.teal, top: -100, left: -80, opacity: isDark ? 0.3 : 0.2 }]} />
        <View style={[s2.bgBlob, { backgroundColor: colors.accent, top: '40%', right: -120, width: 350, height: 350, opacity: isDark ? 0.25 : 0.15 }]} />
        <View style={[s2.bgBlob, { backgroundColor: colors.primary, bottom: -50, left: -60, width: 280, height: 280, opacity: isDark ? 0.2 : 0.1 }]} />

        <ScrollView
          contentContainerStyle={{ padding: 16, paddingBottom: 48, gap: 14 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.teal} />}
        >
          {/* ── HERO BANNER ── */}
          <Animated.View style={[bannerAnim]}>
            <GlassCard isDark={isDark} style={[s2.heroBanner, { shadowColor: colors.teal }]}>
              <View style={[s2.ring, { width: 220, height: 220, right: -70, top: -70, borderColor: 'rgba(255,255,255,0.2)' }]} />
              <View style={[s2.ring, { width: 130, height: 130, right: -10, bottom: -40, borderColor: 'rgba(255,255,255,0.1)' }]} />
              <View style={[s2.ring, { width: 70, height: 70, right: 50, top: 10, borderColor: 'rgba(255,255,255,0.15)' }]} />

              <View style={{ flex: 1, zIndex: 2 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <PulseDot color={isDark ? "rgba(255,255,255,0.8)" : colors.teal} />
                  <Text style={{ color: isDark ? 'rgba(255,255,255,0.7)' : colors.teal, fontSize: 11, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase' }}>
                    HEALTH MONITOR
                  </Text>
                </View>
                <Text style={[s2.heroTitle, { color: colors.textPrimary }]}>
                  {getGreeting()},{'\n'}
                  {userName || t('common.user')}
                </Text>
                <Text style={[s2.heroSub, { color: colors.textFaint }]}>
                  {dashboard ? `${dashboard.scheduledDosesToday} ${t('patient.banner.scheduledToday')}` : t('common.loading')}
                </Text>
                <View style={s2.heroBtns}>
                  <TouchableOpacity onPress={() => router.push('/screens/Medicines')} style={[s2.heroBtn, { backgroundColor: colors.teal }]} activeOpacity={0.85}>
                    <Text style={[s2.heroBtnText, { color: '#fff' }]}>{t('patient.banner.viewSchedule')}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => router.push('/screens/Symptoms')} style={[s2.heroBtn, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)', borderWidth: 1, borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} activeOpacity={0.85}>
                    <Text style={[s2.heroBtnText, { color: colors.textPrimary }]}>{t('patient.banner.report')}</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={s2.heroIconCluster}>
                <View style={[s2.heroIconRing, { borderColor: isDark ? 'rgba(255,255,255,0.2)' : colors.teal + '40', backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : colors.teal + '15' }]}>
                  <Ionicons name="fitness" size={32} color={colors.teal} />
                </View>
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── HUD STAT TILES ── */}
          <Animated.View style={[{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, statsAnim]}>
            <HUDTile icon="medical-outline" value={String(dashboard?.activeMedicines ?? 0)} label={t('patient.stats.medicines')} accent={colors.primary} delay={0} />
            <HUDTile icon="checkmark-circle-outline" value={`${dashboard?.adherencePercent ?? 0}%`} label={t('patient.stats.adherence')} accent={colors.success} delay={60} />
            <HUDTile icon="folder-outline" value={String(dashboard?.recentRecordsCount ?? 0)} label={t('patient.stats.records7d')} accent={colors.teal} delay={120} />
            <HUDTile icon="notifications-outline" value={String(dashboard?.unreadNotifications ?? 0)} label={t('patient.stats.alerts')} accent={colors.accent} delay={180} />
          </Animated.View>

          {/* ── TODAY'S MEDICATIONS ── */}
          <Animated.View style={medsAnim}>
            <GlassCard isDark={isDark} style={s2.section}>
              <View style={s2.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[s2.sectionIcon, { backgroundColor: colors.teal + '20' }]}>
                    <Ionicons name="medical" size={16} color={colors.teal} />
                  </View>
                  <Text style={[s2.sectionTitle, { color: colors.textPrimary }]}>{t('patient.section.todaysMeds')}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/screens/Medicines')} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ color: colors.teal, fontSize: 12, fontWeight: '700' }}>{t('common.viewAll')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.teal} />
                </TouchableOpacity>
              </View>

              <View style={{ gap: 2, paddingHorizontal: 4, paddingBottom: 10 }}>
                {loading ? (
                  <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 24 }}>{t('common.loading')}</Text>
                ) : dueDoses.length === 0 ? (
                  <View style={s2.emptyState}>
                    <Ionicons name="checkmark-done-circle" size={36} color={colors.success + '60'} />
                    <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 13 }}>{t('patient.empty.noMedsToday')}</Text>
                  </View>
                ) : (
                  dueDoses.map((med, idx) => <MedRow key={`${med.medicineId}-${med.slot}-${idx}`} med={med} onMarkTaken={handleMarkTaken} index={idx} />)
                )}
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── QUICK ACTIONS ── */}
          <Animated.View style={qaAnim}>
            <Text style={[s2.floatLabel, { color: isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }]}>QUICK ACTIONS</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
              {quickActions.map((a, i) => <QuickActionItem key={String(a.route)} {...a} delay={i * 60} />)}
            </View>
          </Animated.View>

          {/* ── SCORE + STREAK ── */}
          <Animated.View style={[{ flexDirection: 'row', gap: 12 }, scoreAnim]}>
            <GlassCard isDark={isDark} style={[s2.glowCard, { flex: 1, shadowColor: colors.teal }]}>
              <View style={[s2.ring, { width: 120, height: 120, right: -30, top: -30, borderColor: colors.teal + '30' }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="heart" size={18} color={colors.teal} />
                <Text style={{ fontSize: 10, color: colors.teal, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' }}>
                  {t('patient.score.healthScore')}
                </Text>
              </View>
              <Text style={[s2.glowCardVal, { color: colors.textPrimary }]}>
                {dashboard?.adherencePercent ?? 0}<Text style={[s2.glowCardMax, { color: colors.textFaint }]}>/100</Text>
              </Text>
              <ProgressBar value={dashboard?.adherencePercent ?? 0} color={colors.teal} height={5} style={{ marginVertical: 10 }} />
              <Text style={{ fontSize: 11, color: colors.textFaint }}>
                {dashboard?.adherencePercent != null ? (dashboard.adherencePercent >= 80 ? t('patient.score.excellent') : dashboard.adherencePercent >= 50 ? t('patient.score.good') : t('patient.score.improving')) : ''}
              </Text>
            </GlassCard>

            <GlassCard isDark={isDark} style={[s2.glowCard, { flex: 1, shadowColor: colors.accent }]}>
              <View style={[s2.ring, { width: 110, height: 110, right: -25, bottom: -25, borderColor: colors.accent + '30' }]} />
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                <Ionicons name="flame" size={18} color={colors.accent} />
                <Text style={{ fontSize: 10, color: colors.accent, letterSpacing: 1, textTransform: 'uppercase', fontWeight: '700' }}>TODAY</Text>
              </View>
              <Text style={[s2.glowCardVal, { color: colors.textPrimary }]}>{dashboard?.takenToday ?? 0}</Text>
              <Text style={{ color: colors.textPrimary, fontSize: 13, marginTop: 4 }}>{t('patient.score.dosesTaken')}</Text>
              <Text style={{ color: colors.textFaint, fontSize: 11, marginTop: 4 }}>{dashboard?.pendingToday ?? 0} {t('patient.score.pending')}</Text>
            </GlassCard>
          </Animated.View>

          {/* ── WEEKLY ADHERENCE ── */}
          <Animated.View style={weeklyAnim}>
            <GlassCard isDark={isDark} style={s2.section}>
              <View style={s2.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[s2.sectionIcon, { backgroundColor: colors.teal + '20' }]}>
                    <Ionicons name="analytics" size={16} color={colors.teal} />
                  </View>
                  <Text style={[s2.sectionTitle, { color: colors.textPrimary }]}>{t('patient.section.weeklyAdherence')}</Text>
                </View>
                <Badge
                  label={dashboard?.adherencePercent != null && dashboard.adherencePercent >= 80 ? t('patient.weekly.onTrack') : t('patient.weekly.keepGoing')}
                  type={dashboard?.adherencePercent != null && dashboard.adherencePercent >= 80 ? 'success' : 'warning'}
                />
              </View>
              <View style={s2.barWrap}>
                {weeklyTrend.map((day, i) => {
                  const isLast = i === weeklyTrend.length - 1;
                  return (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <View style={{ flex: 1, justifyContent: 'flex-end', width: '100%', alignItems: 'center' }}>
                        <View style={[s2.barTrack, { backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.05)' }]}>
                          <View style={[s2.barFill, { height: `${day.adherencePercent}%`, backgroundColor: isLast ? colors.teal : colors.teal + '60', shadowColor: isLast ? colors.teal : 'transparent', shadowOpacity: isLast ? 0.6 : 0, shadowRadius: 6 }]} />
                        </View>
                      </View>
                      <Text style={{ fontSize: 10, color: isLast ? colors.teal : colors.textFaint, fontWeight: isLast ? '700' : '400' }}>{getDayName(day.date)}</Text>
                    </View>
                  );
                })}
              </View>
            </GlassCard>
          </Animated.View>

          {/* ── RECENT REPORTS ── */}
          <Animated.View style={reportAnim}>
            <GlassCard isDark={isDark} style={s2.section}>
              <View style={s2.sectionHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={[s2.sectionIcon, { backgroundColor: colors.teal + '20' }]}>
                    <Ionicons name="document-text" size={16} color={colors.teal} />
                  </View>
                  <Text style={[s2.sectionTitle, { color: colors.textPrimary }]}>{t('patient.section.recentReports')}</Text>
                </View>
                <TouchableOpacity onPress={() => router.push('/screens/Reports')} style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                  <Text style={{ color: colors.teal, fontSize: 12, fontWeight: '700' }}>{t('common.viewAll')}</Text>
                  <Ionicons name="chevron-forward" size={14} color={colors.teal} />
                </TouchableOpacity>
              </View>
              {recentReports.length === 0 ? (
                <View style={s2.emptyState}>
                  <Ionicons name="document-outline" size={36} color={colors.teal + '50'} />
                  <Text style={{ color: colors.textMuted, marginTop: 8, fontSize: 13 }}>{t('patient.empty.noReports')}</Text>
                </View>
              ) : (
                recentReports.map((r, i) => (
                  <TouchableOpacity key={r._id} activeOpacity={0.75} style={[s2.reportRow, { borderBottomWidth: i < recentReports.length - 1 ? 1 : 0, borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }]}>
                    <View style={[s2.reportIconWrap, { backgroundColor: colors.teal + '15' }]}>
                      <Ionicons name={getReportIcon(r.reportType)} size={20} color={colors.teal} />
                    </View>
                    <View style={{ flex: 1, gap: 3 }}>
                      <Text style={{ fontSize: 14, fontWeight: '600', color: colors.textPrimary }}>{r.reportType}</Text>
                      <Text style={{ fontSize: 12, color: colors.textFaint }}>{formatReportDate(r.createdAt)}</Text>
                    </View>
                    <View style={[s2.viewChip, { borderColor: colors.teal + '50', backgroundColor: colors.teal + '10' }]}>
                      <Text style={{ fontSize: 11, color: colors.teal, fontWeight: '700' }}>{t('common.view')}</Text>
                    </View>
                  </TouchableOpacity>
                ))
              )}
            </GlassCard>
          </Animated.View>
        </ScrollView>
      </View>
    </BottomNavLayout>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s2 = StyleSheet.create({
  bgBlob: { position: 'absolute', width: 300, height: 300, borderRadius: 150 },
  glassCard: {
    borderRadius: 24, borderWidth: 1,
    borderTopWidth: 2, borderLeftWidth: 2,
    borderBottomWidth: 1, borderRightWidth: 1,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 20, shadowOpacity: 0.1, elevation: 5,
  },
  heroBanner: {
    borderRadius: 28, padding: 24, flexDirection: 'row',
    alignItems: 'center', position: 'relative',
    shadowOffset: { width: 0, height: 16 }, shadowRadius: 40, elevation: 14,
  },
  heroTitle: { fontSize: 26, fontWeight: '900', letterSpacing: -0.6, lineHeight: 30, marginBottom: 8 },
  heroSub: { fontSize: 13, marginBottom: 18 },
  heroBtns: { flexDirection: 'row', gap: 10 },
  heroBtn: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 14 },
  heroBtnText: { fontWeight: '800', fontSize: 12, letterSpacing: 0.2 },
  heroIconCluster: { marginLeft: 12, zIndex: 2 },
  heroIconRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', borderRadius: 999, borderWidth: 1 },
  hudTile: { borderRadius: 20, borderWidth: 1.5, padding: 16 },
  hudIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  hudDot: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  hudValue: { fontSize: 28, fontWeight: '900', marginTop: 12, letterSpacing: -0.8 },
  hudLabel: { fontSize: 11, marginTop: 3, letterSpacing: 0.2 },
  hudLine: { height: 2, borderRadius: 2, marginTop: 14 },
  section: { borderRadius: 24, borderWidth: 1.5, overflow: 'hidden' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  sectionIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '800', letterSpacing: -0.2 },
  emptyState: { alignItems: 'center', paddingVertical: 28, paddingHorizontal: 16 },
  medRow: {
    flexDirection: 'row', alignItems: 'center', marginHorizontal: 12, marginBottom: 8,
    padding: 14, borderRadius: 16, borderWidth: 1, gap: 14,
  },
  medIconWrap: { width: 42, height: 42, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  qaBtn: { padding: 18, borderRadius: 22, alignItems: 'center', borderWidth: 1 },
  qaIconRing: { width: 56, height: 56, borderRadius: 18, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  qaLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.1 },
  floatLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.4, marginBottom: 8, marginLeft: 2 },
  glowCard: { borderRadius: 24, padding: 20, overflow: 'hidden', position: 'relative' },
  glowCardVal: { fontSize: 40, fontWeight: '900', lineHeight: 44 },
  glowCardMax: { fontSize: 15, fontWeight: '400' },
  barWrap: { flexDirection: 'row', height: 80, gap: 5, paddingHorizontal: 16, paddingBottom: 16, alignItems: 'flex-end' },
  barTrack: { width: '80%', height: 62, borderRadius: 8, overflow: 'hidden', justifyContent: 'flex-end' },
  barFill: { width: '100%', borderRadius: 8, shadowOffset: { width: 0, height: -2 }, shadowRadius: 6 },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingVertical: 13 },
  reportIconWrap: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  viewChip: { paddingVertical: 5, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1 },
});
