import React, { useRef } from 'react';
import { ScrollView, View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import Svg, { Polyline } from 'react-native-svg';
import DrawerLayout from '../../components/DrawerLayout';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar, Avatar } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { allPatients, doctorAlerts } from '../../data/mockData';

const weekBars = [65, 72, 68, 80, 75, 87, 92];
const weekDays = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];

function MiniTrend({ data, color }: { data: number[]; color: string }) {
  const max = Math.max(...data);
  return (
    <Svg width={60} height={28}>
      <Polyline
        points={data.map((v, i) => `${i * 10},${28 - (v / max) * 24}`).join(' ')}
        fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"
      />
    </Svg>
  );
}

function AlertCard({ alert }: { alert: typeof doctorAlerts[0] }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const isCrit = alert.severity === 'critical';
  const bg     = isCrit ? colors.dangerSoft  : colors.warningSoft;
  const border = isCrit ? colors.danger      : colors.warning;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity activeOpacity={0.9}
        onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
        style={[s.alertCard, { backgroundColor: bg, borderColor: border + '55', borderLeftColor: border }]}>
        <View style={[s.alertDot, { backgroundColor: border }]} />
        <View style={{ flex: 1 }}>
          <Text style={[s.alertName, { color: colors.textPrimary }]}>{alert.patient}</Text>
          <Text style={[s.alertIssue, { color: colors.textMuted }]}>{alert.issue}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Badge label={alert.issue} type={isCrit ? 'danger' : 'warning'} />
          <Text style={{ fontSize: 10, color: colors.textFaint }}>{alert.time}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DoctorDashboard() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  return (
    <DrawerLayout title="Doctor Dashboard" subtitle="Monday, 14 March 2026"
      role="doctor" userName="Dr. Sharma" userInitial="DS"
      headerRight={
        <Button label="+ Add" onPress={() => router.push('/screens/PatientDetails' as any)} size="sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      }>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false} style={{ backgroundColor: colors.bgPage }}>

        {/* ── Stats ── */}
        <View style={s.statsGrid}>
          <View style={s.statHalf}><StatCard icon="👥" value="28"  label="Total Patients" /></View>
          <View style={s.statHalf}><StatCard icon="🚨" value="2"    label="Critical Alerts" iconBg={colors.dangerSoft}  valueColor={colors.danger}  /></View>
          <View style={s.statHalf}><StatCard icon="📊" value="92%" label="Avg Adherence"   iconBg={colors.successSoft} valueColor={colors.success} /></View>
          <View style={s.statHalf}><StatCard icon="📋" value="5"   label="Pending Reports" iconBg={colors.warningSoft} valueColor={colors.warning} /></View>
        </View>

        {/* ── Recent Alerts ── */}
        <Card>
          <CardHeader title="🚨 Recent Alerts" right={
            <Button label="View All" onPress={() => router.push('/screens/Alerts' as any)} variant="outline" size="sm" />
          }/>
          <View style={{ padding: 12, gap: 8 }}>
            {doctorAlerts.map(alert => <AlertCard key={alert.id} alert={alert} />)}
          </View>
        </Card>

        {/* ── Health Overview chart ── */}
        <Card>
          <CardHeader title="📈 Patient Health Overview" />
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', gap: 20, marginBottom: 16 }}>
              {[
                { val: '87%', label: 'Overall Adherence', color: colors.primary },
                { val: '+12%', label: 'vs Last Week',      color: colors.success },
              ].map(item => (
                <View key={item.label} style={[s.metricBox, { backgroundColor: colors.bgPage, borderColor: colors.border }]}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: item.color }}>{item.val}</Text>
                  <Text style={{ fontSize: 11, color: colors.textMuted, marginTop: 2 }}>{item.label}</Text>
                </View>
              ))}
            </View>
            <View style={s.barChart}>
              {weekBars.map((v, i) => (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={[s.bar, {
                    height: v * 0.52,
                    backgroundColor: i === 6 ? colors.primary : colors.primarySoft,
                    borderTopLeftRadius: 4, borderTopRightRadius: 4,
                  }]} />
                  <Text style={{ fontSize: 9, color: colors.textFaint }}>{weekDays[i].slice(0, 2)}</Text>
                </View>
              ))}
            </View>
          </View>
        </Card>

        {/* ── Quick Actions ── */}
        <View style={s.qaGrid}>
          {[
            { icon: '👥', label: 'Patients',  route: '/screens/Patients',         bg: colors.primarySoft,  fg: colors.primary  },
            { icon: '🚨', label: 'Alerts',    route: '/screens/Alerts',           bg: colors.dangerSoft,   fg: colors.danger   },
            { icon: '💬', label: 'Messages',  route: '/screens/Messages',         bg: colors.tealSoft,     fg: colors.teal     },
            { icon: '🔔', label: 'Notifs',    route: '/screens/Notifications',    bg: colors.warningSoft,  fg: colors.warning  },
          ].map(a => {
            const scale = useRef(new Animated.Value(1)).current;
            return (
              <Animated.View key={a.route} style={[s.qaItem, { transform: [{ scale }] }]}>
                <TouchableOpacity
                  onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, tension: 200 }).start()}
                  onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
                  onPress={() => router.push(a.route as any)}
                  style={[s.qaBtn, { backgroundColor: a.bg, borderColor: a.fg + '30' }]}
                  activeOpacity={1}>
                  <Text style={{ fontSize: 26 }}>{a.icon}</Text>
                  <Text style={[s.qaLabel, { color: a.fg }]}>{a.label}</Text>
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </View>

        {/* ── Patients Overview ── */}
        <Card>
          <CardHeader title="👥 Patients Overview" right={
            <Button label="View All" onPress={() => router.push('/screens/Patients' as any)} variant="outline" size="sm" />
          }/>
          <View style={{ padding: 16, gap: 14 }}>
            {allPatients.slice(0, 4).map((p, i) => {
              const scale = useRef(new Animated.Value(1)).current;
              return (
                <Animated.View key={p.id} style={{ transform: [{ scale }] }}>
                  <TouchableOpacity
                    onPressIn={() => Animated.spring(scale, { toValue: 0.97, useNativeDriver: true, tension: 200 }).start()}
                    onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
                    onPress={() => router.push('/screens/PatientDetails' as any)}
                    style={[s.patientRow, { backgroundColor: colors.bgCardHover, borderColor: colors.border }]}
                    activeOpacity={1}>
                    <Avatar initials={p.name.split(' ').map(n => n[0]).join('')} size={40} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{p.name}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 3 }}>
                        <Badge label={p.condition} />
                        <Text style={{ fontSize: 11, color: colors.textFaint }}>🔥 {p.streak}d</Text>
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <Text style={{ fontSize: 13, fontWeight: '800', color: p.adherence < 75 ? colors.danger : colors.success }}>{p.adherence}%</Text>
                      <ProgressBar value={p.adherence} color={p.adherence < 75 ? colors.danger : colors.success} style={{ width: 56, height: 5 }} />
                    </View>
                  </TouchableOpacity>
                </Animated.View>
              );
            })}
          </View>
        </Card>

      </ScrollView>
    </DrawerLayout>
  );
}

const s = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  alertCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, borderWidth: 1, borderLeftWidth: 4 },
  alertDot: { width: 9, height: 9, borderRadius: 5, flexShrink: 0 },
  alertName: { fontWeight: '700', fontSize: 13 },
  alertIssue: { fontSize: 12, marginTop: 2 },
  metricBox: { flex: 1, padding: 12, borderRadius: 12, borderWidth: 1 },
  barChart: { flexDirection: 'row', alignItems: 'flex-end', height: 64, gap: 5 },
  bar: { flex: 1, minHeight: 4 },
  qaGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  qaItem: { width: '48%' },
  qaBtn: { padding: 18, borderRadius: 16, alignItems: 'center', gap: 8, borderWidth: 1 },
  qaLabel: { fontSize: 13, fontWeight: '700' },
  patientRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 14, borderWidth: 1 },
});
