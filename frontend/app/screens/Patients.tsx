import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import { StatCard, Card, Badge, Button, ProgressBar, Avatar } from '../../components/UI';
import { useEffect } from 'react';

const STATUS_STYLE: Record<string, { badge: 'danger' | 'warning' | 'success'; bar: string }> = {
  Critical: { badge: 'danger', bar: '#DC2626' },
  Monitor: { badge: 'warning', bar: '#D97706' },
  Stable: { badge: 'success', bar: '#16A34A' },
};

export default function PatientsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPatients = async () => {
      setLoading(true);
      setError('');
      try {
        // TODO: Replace token with actual auth token from your auth flow
        const token = '';
        const response = await fetch('http://localhost:5000/api/v1/doctor/patients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch patients');
        }
        const data = await response.json();
        setPatients(data.patients || []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch patients');
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const filtered = patients.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase())
      || (p.condition || '').toLowerCase().includes(search.toLowerCase())
      || (p.doctor || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch && (filter === 'All' || p.status === filter);
  });

  const viewPatient = (p: any) => {
    router.push({ pathname: '/screens/PatientDetails', params: { id: p.id } } as any);
  };

  const criticalCount = patients.filter(p => p.status === 'Critical').length;
  const monitorCount = patients.filter(p => p.status === 'Monitor').length;
  const stableCount = patients.filter(p => p.status === 'Stable').length;

  return (
    <DrawerLayout title="Patients" subtitle={`${patients.length} total patients`}
      role="doctor" userName="Dr. Sharma" userInitial="DS" showBack
      headerRight={
        <Button label="+ Add" onPress={() => router.push('/screens/PatientDetails' as any)} size="sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      }>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.bgPage }}>

        {loading ? (
          <Text>Loading patients...</Text>
        ) : error ? (
          <Text style={{ color: 'red' }}>{error}</Text>
        ) : (
          <>
            {/* Stats */}
            <View style={s.statsGrid}>
              <View style={s.statHalf}><StatCard icon="👥" value={patients.length} label="Total Patients" /></View>
              <View style={s.statHalf}><StatCard icon="🚨" value={criticalCount} label="Critical" iconBg={colors.dangerSoft} valueColor={colors.danger} /></View>
              <View style={s.statHalf}><StatCard icon="👁️" value={monitorCount} label="Under Monitor" iconBg={colors.warningSoft} valueColor={colors.warning} /></View>
              <View style={s.statHalf}><StatCard icon="✅" value={stableCount} label="Stable" iconBg={colors.successSoft} valueColor={colors.success} /></View>
            </View>

            {/* Search + Filter */}
            <View style={[s.searchCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
              {/* Search bar */}
              <View style={[s.searchRow, { backgroundColor: colors.bgPage, borderColor: colors.border }]}>
                <Text style={{ fontSize: 16, marginRight: 8, color: colors.textFaint }}>🔍</Text>
                <TextInput
                  style={[s.searchInput, { color: colors.textPrimary }]}
                  placeholder="Search by name, condition, doctor…"
                  placeholderTextColor={colors.textFaint}
                  value={search}
                  onChangeText={setSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')}>
                    <Text style={{ color: colors.textFaint, fontSize: 16, marginLeft: 6 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </View>
              {/* Filter pills */}
              <View style={s.filterRow}>
                {['All', 'Critical', 'Monitor', 'Stable'].map(f => (
                  <TouchableOpacity key={f} onPress={() => setFilter(f)}
                    style={[s.filterBtn, {
                      backgroundColor: filter === f
                        ? (f === 'Critical' ? colors.danger : f === 'Monitor' ? colors.warning : f === 'Stable' ? colors.success : colors.primary)
                        : colors.bgPage,
                      borderColor: filter === f
                        ? (f === 'Critical' ? colors.danger : f === 'Monitor' ? colors.warning : f === 'Stable' ? colors.success : colors.primary)
                        : colors.border,
                    }]}>
                    <Text style={[s.filterTxt, { color: filter === f ? 'white' : colors.textMuted }]}>{f}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              {/* Result count */}
              <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 8 }}>
                Showing {filtered.length} of {patients.length} patients
              </Text>
            </View>

            {/* Patient Cards */}
            <View style={{ gap: 12 }}>
              {filtered.map(p => {
                const sc = STATUS_STYLE[p.status] || STATUS_STYLE.Stable;
                return (
                  <View key={p.id} style={[s.patientCard, {
                    backgroundColor: colors.bgCard, borderColor: colors.border,
                  }]}>
                    {/* Status top line */}
                    <View style={[s.statusLine, { backgroundColor: sc.bar }]} />

                    <View style={{ padding: 14 }}>
                      {/* Top row */}
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
                          <View style={[s.avatar, { backgroundColor: colors.primarySoft }]}>
                            <Text style={{ fontSize: 14, fontWeight: '800', color: colors.primary }}>
                              {p.name.split(' ').map((n: string) => n[0]).join('')}
                            </Text>
                          </View>
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '800', fontSize: 15, color: colors.textPrimary }}>{p.name}</Text>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 1 }}>Age {p.age} · {p.blood}</Text>
                          </View>
                        </View>
                        <Badge label={p.status} type={sc.badge} />
                      </View>

                      {/* Tags row */}
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, flexWrap: 'wrap' }}>
                        <Badge label={p.condition} type="primary" />
                        <Text style={{ fontSize: 12, color: colors.textMuted }}>🔥 {p.streak}d streak</Text>
                        <Text style={{ fontSize: 12, color: colors.textFaint }}>· {p.lastSeen}</Text>
                      </View>

                      {/* Adherence bar */}
                      <View style={{ marginBottom: 10 }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>Adherence</Text>
                          <Text style={{
                            fontSize: 12, fontWeight: '800',
                            color: p.adherence < 75 ? colors.danger : colors.success
                          }}>{p.adherence}%</Text>
                        </View>
                        <ProgressBar value={p.adherence}
                          color={p.adherence < 75 ? colors.danger : colors.success} height={6} />
                      </View>

                      {/* Doctor */}
                      <Text style={{ fontSize: 11, color: colors.textFaint, marginBottom: 12 }}>
                        👨‍⚕️ {p.doctor}
                      </Text>

                      {/* Actions */}
                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Button label="View Details" onPress={() => viewPatient(p)} style={{ flex: 1 }} size="sm" />
                        <Button label="📱 SMS" onPress={() => { }} variant="outline" size="sm" />
                      </View>
                    </View>
                  </View>
                );
              })}
            </View>

            {filtered.length === 0 && (
              <View style={{ padding: 40, alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>🔍</Text>
                <Text style={{ color: colors.textMuted, fontSize: 15, fontWeight: '600' }}>No patients found</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 4 }}>Try a different search term</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </DrawerLayout>
  );
}

const s = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  searchCard: {
    borderRadius: 16, borderWidth: 1, padding: 14, marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 6, elevation: 2
  },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 10
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  filterTxt: { fontSize: 12, fontWeight: '600' },
  patientCard: {
    borderRadius: 16, borderWidth: 1, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2
  },
  statusLine: { height: 4 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
