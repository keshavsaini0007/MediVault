import React, { useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import DrawerLayout from '../../components/DrawerLayout';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';

const medications = [
  { id: 1, time: '8:00 AM', name: 'Paracetamol 500mg', color: '#EF4444', status: 'due' },
  { id: 2, time: '2:00 PM', name: 'Vitamin C 1000mg',  color: '#F59E0B', status: 'upcoming' },
  { id: 3, time: '8:00 PM', name: 'Antibiotic 250mg',  color: '#10B981', status: 'upcoming' },
];

const weekBars = [75, 82, 78, 90, 85, 92, 88];
const weekDays = ['M','T','W','T','F','S','S'];

const recentReports = [
  { icon: '🔬', name: 'Blood Test',  date: 'Apr 5, 2024',  tag: 'Normal'   },
  { icon: '🫁', name: 'Chest X-Ray', date: 'Apr 12, 2024', tag: 'Reviewed' },
  { icon: '🔊', name: 'Ultrasound',  date: 'Mar 20, 2024', tag: 'Pending'  },
];
const tagType: Record<string, 'success'|'primary'|'warning'> = {
  Normal: 'success', Reviewed: 'primary', Pending: 'warning',
};

export default function PatientDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <DrawerLayout title="My Health Dashboard" subtitle="Good Morning, Rahul! 👋"
      role="patient" userName="Rahul Singh" userInitial="RS">
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.bgPage }}>

        {/* ── Welcome Banner ── */}
        <View style={[s.banner, { backgroundColor: isDark ? '#062d2d' : '#0B4F6F' }]}>
          <View style={{ flex: 1 }}>
            <Text style={s.bannerTitle}>Good Morning, Rahul! 🌟</Text>
            <Text style={s.bannerSub}>3 medications scheduled today</Text>
            <View style={s.bannerBtns}>
              <TouchableOpacity onPress={() => router.push('/screens/Medicines' as any)}
                style={[s.bannerBtn, { backgroundColor: 'rgba(255,255,255,0.9)' }]}>
                <Text style={[s.bannerBtnText, { color: '#0B4F6F' }]}>View Schedule</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => router.push('/screens/Symptoms' as any)}
                style={[s.bannerBtn, { backgroundColor: 'rgba(255,255,255,0.15)' }]}>
                <Text style={[s.bannerBtnText, { color: 'white' }]}>Report Symptom</Text>
              </TouchableOpacity>
            </View>
          </View>
          <Text style={{ fontSize: 44 }}>🩺</Text>
          {/* Decorative circles */}
          <View style={s.circle1} />
          <View style={s.circle2} />
        </View>

        {/* ── Stats ── */}
        <View style={s.statsGrid}>
          <View style={s.statHalf}><StatCard icon="🔥" value="7"      label="Day Streak"   iconBg={colors.accentSoft}  valueColor={colors.accent}  /></View>
          <View style={s.statHalf}><StatCard icon="✅" value="92%"    label="Adherence"    iconBg={colors.successSoft} valueColor={colors.success} /></View>
          <View style={s.statHalf}><StatCard icon="❤️" value="85/100" label="Health Score" iconBg={colors.primarySoft}                              /></View>
          <View style={s.statHalf}><StatCard icon="📋" value="3"      label="Reports"      iconBg={colors.tealSoft}    valueColor={colors.teal}    /></View>
        </View>

        {/* ── Today's Medications ── */}
        <Card>
          <CardHeader title="💊 Today's Medications" right={
            <TouchableOpacity onPress={() => router.push('/screens/Medicines' as any)}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>+ Add</Text>
            </TouchableOpacity>
          }/>
          <View style={{ padding: 16, gap: 2 }}>
            {medications.map(med => {
              const scale = useRef(new Animated.Value(1)).current;
              return (
                <Animated.View key={med.id} style={{ transform: [{ scale }] }}>
                  <TouchableOpacity activeOpacity={1}
                    onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start()}
                    onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
                    style={[s.medRow, { backgroundColor: colors.bgCardHover, borderColor: colors.border }]}>
                    <View style={[s.medDotBig, { backgroundColor: med.color + '22', borderColor: med.color + '55' }]}>
                      <View style={[s.medDotInner, { backgroundColor: med.color }]} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: colors.textPrimary }}>{med.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 1 }}>⏰ {med.time}</Text>
                    </View>
                    {med.status === 'due'
                      ? <Button label="Mark Taken ✓" onPress={() => {}} size="sm" />
                      : <Badge label="Upcoming" type="default" />
                    }
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Card>

        {/* ── Quick Actions ── */}
        <View style={s.qaGrid}>
          {[
            { icon: '🩺', label: 'Symptoms',   route: '/screens/Symptoms',  bg: colors.primarySoft,  fg: colors.primary  },
            { icon: '📋', label: 'Reports',    route: '/screens/Reports',   bg: colors.tealSoft,     fg: colors.teal     },
            { icon: '💊', label: 'Medicines',  route: '/screens/Medicines', bg: colors.successSoft,  fg: colors.success  },
            { icon: '🔲', label: 'QR Profile', route: '/screens/QRProfile', bg: colors.accentSoft,   fg: colors.accent   },
          ].map(a => {
            const scale = useRef(new Animated.Value(1)).current;
            return (
              <Animated.View key={a.route} style={[s.qaItem, { transform: [{ scale }] }]}>
                <TouchableOpacity
                  onPressIn={() => Animated.spring(scale, { toValue: 0.91, useNativeDriver: true, tension: 200 }).start()}
                  onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
                  onPress={() => router.push(a.route as any)}
                  style={[s.qaBtn, { backgroundColor: a.bg, borderColor: a.fg + '30' }]}
                  activeOpacity={1}>
                  <Text style={{ fontSize: 28 }}>{a.icon}</Text>
                  <Text style={[s.qaLabel, { color: a.fg }]}>{a.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* ── Score + Streak ── */}
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
          <View style={[s.scoreCard, { backgroundColor: isDark ? '#0a2c2c' : '#0D9488', flex: 1 }]}>
            <Text style={s.scoreCaption}>Health Score</Text>
            <Text style={s.scoreVal}>85<Text style={s.scoreMax}>/100</Text></Text>
            <ProgressBar value={85} color="rgba(255,255,255,0.85)" height={6} style={{ marginVertical: 8 }} />
            <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)' }}>Excellent 🎉</Text>
          </View>
          <View style={[s.scoreCard, { backgroundColor: isDark ? '#2d1200' : '#EA580C', flex: 1 }]}>
            <Text style={{ fontSize: 34 }}>🔥</Text>
            <Text style={s.scoreVal}>7</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13, marginTop: 2 }}>Day Streak!</Text>
            <Text style={{ color: 'rgba(255,255,255,0.55)', fontSize: 11, marginTop: 2 }}>Keep it up 💪</Text>
          </View>
        </View>

        {/* ── Weekly Adherence ── */}
        <Card>
          <CardHeader title="📈 Weekly Adherence" right={<Badge label="+5% this week" type="success" />} />
          <View style={{ padding: 16 }}>
            <View style={s.barChart}>
              {weekBars.map((v, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 5 }}>
                  <View style={[s.bar, {
                    height: v * 0.6,
                    backgroundColor: i === 5 ? colors.primary : colors.primarySoft,
                    borderTopLeftRadius: 4, borderTopRightRadius: 4,
                  }]} />
                  <Text style={{ fontSize: 10, color: colors.textFaint }}>{weekDays[i]}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* ── Doctor Card ── */}
        <Card>
          <View style={{ padding: 16 }}>
            <Text style={{ fontSize: 11, fontWeight: '700', color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 12 }}>Your Doctor</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 }}>
              <View style={[s.docAvatar, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontSize: 26 }}>👨‍⚕️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontWeight: '800', fontSize: 15, color: colors.textPrimary }}>Dr. Meera Kapoor</Text>
                <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>General Physician · Available</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  {[1,2,3,4,5].map(i => <Text key={i} style={{ fontSize: 11, color: '#F59E0B' }}>★</Text>)}
                  <Text style={{ fontSize: 11, color: colors.textMuted }}> 4.9</Text>
                </View>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Button label="📞 Call"    onPress={() => {}} style={{ flex: 1 }} size="sm" />
              <Button label="💬 Message" onPress={() => router.push('/screens/Messages' as any)} variant="outline" style={{ flex: 1 }} size="sm" />
            </View>
          </View>
        </Card>

        {/* ── Recent Reports ── */}
        <Card>
          <CardHeader title="📁 My Reports" right={
            <TouchableOpacity onPress={() => router.push('/screens/Reports' as any)}>
              <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '700' }}>View All →</Text>
            </TouchableOpacity>
          }/>
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {recentReports.map((r, i) => (
              <View key={i} style={[s.reportRow, i < 2 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
                <View style={[s.reportIcon, { backgroundColor: colors.bgCardHover }]}>
                  <Text style={{ fontSize: 20 }}>{r.icon}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.textPrimary }}>{r.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.textFaint }}>{r.date}</Text>
                </View>
                <Badge label={r.tag} type={tagType[r.tag] || 'primary'} />
              </View>
            ))}
          </View>
        </Card>

      </ScrollView>
    </DrawerLayout>
  );
}

const s = StyleSheet.create({
  banner: {
    borderRadius: 20, padding: 22, marginBottom: 16,
    flexDirection: 'row', alignItems: 'center', overflow: 'hidden', position: 'relative',
  },
  bannerTitle: { fontSize: 19, fontWeight: '900', color: 'white', marginBottom: 4, letterSpacing: -0.4 },
  bannerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginBottom: 14 },
  bannerBtns: { flexDirection: 'row', gap: 8 },
  bannerBtn: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 10 },
  bannerBtnText: { fontWeight: '700', fontSize: 12 },
  circle1: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: 'rgba(255,255,255,0.05)', right: -20, top: -30 },
  circle2: { position: 'absolute', width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(255,255,255,0.04)', right: 40, bottom: -30 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  medRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, marginBottom: 8, borderWidth: 1, gap: 12 },
  medDotBig: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5 },
  medDotInner: { width: 12, height: 12, borderRadius: 6 },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  qaItem: { width: '48%' },
  qaBtn: { padding: 18, borderRadius: 16, alignItems: 'center', gap: 8, borderWidth: 1 },
  qaLabel: { fontSize: 13, fontWeight: '700' },
  scoreCard: { borderRadius: 20, padding: 18, alignItems: 'center' },
  scoreCaption: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginBottom: 6 },
  scoreVal: { fontSize: 40, fontWeight: '900', color: 'white', lineHeight: 44 },
  scoreMax: { fontSize: 16, fontWeight: '400', color: 'rgba(255,255,255,0.45)' },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 5 },
  bar: { flex: 1, minHeight: 4 },
  docAvatar: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center' },
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  reportIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
});
