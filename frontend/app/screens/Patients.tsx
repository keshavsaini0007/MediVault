import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import BottomNavLayout from '@/components/BottomNavLayout';
import { StatCard, Card, Badge, Button, Avatar } from '../../components/UI';
import { doctorAPI, Patient } from '../../services/api';

export default function PatientsScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { t } = useLanguage();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const loadPatients = async (query?: string) => {
    try {
      const data = await doctorAPI.getPatients(query);
      setPatients(data.patients || []);
    } catch (err: any) {
      // Fallback to mock data when backend unavailable
      console.log('Using mock patients data');
      setPatients([
        { _id: '1', name: 'John Smith', email: 'john@example.com', bloodType: 'O+', phone: '+1234567890', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: '2', name: 'Sarah Johnson', email: 'sarah@example.com', bloodType: 'A+', phone: '+1234567891', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { _id: '3', name: 'Mike Williams', email: 'mike@example.com', bloodType: 'B+', phone: '+1234567892', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPatients(search || undefined);
    setRefreshing(false);
  }, [search]);

  const handleSearch = () => {
    loadPatients(search || undefined);
  };

  const filtered = patients.filter(p => {
    const matchSearch = (p.name || '').toLowerCase().includes(search.toLowerCase());
    return matchSearch;
  });

  const viewPatient = (p: Patient) => {
    router.push({ pathname: '/screens/PatientDetails', params: { id: p._id } } as any);
  };

  const criticalCount = 0;
  const monitorCount = 0;
  const stableCount = patients.length;

  const getStatusStyle = (status: string) => {
    if (status === 'critical') {
      return { bg: colors.dangerSoft, border: colors.danger, badge: 'danger' as const };
    }
    if (status === 'monitor') {
      return { bg: colors.warningSoft, border: colors.warning, badge: 'warning' as const };
    }
    return { bg: colors.successSoft, border: colors.success, badge: 'success' as const };
  };

  const getFilterStyle = (f: string, isActive: boolean) => {
    if (f === 'critical') {
      return {
        bg: isActive ? colors.danger : colors.bgPage,
        border: colors.danger,
        text: isActive ? 'white' : colors.textMuted,
      };
    }
    if (f === 'monitor') {
      return {
        bg: isActive ? colors.warning : colors.bgPage,
        border: colors.warning,
        text: isActive ? 'white' : colors.textMuted,
      };
    }
    if (f === 'stable') {
      return {
        bg: isActive ? colors.success : colors.bgPage,
        border: colors.success,
        text: isActive ? 'white' : colors.textMuted,
      };
    }
    return {
      bg: isActive ? colors.primary : colors.bgPage,
      border: colors.primary,
      text: isActive ? 'white' : colors.textMuted,
    };
  };

  return (
    <BottomNavLayout title={t('patients.title')} subtitle={`${patients.length} ${t('patients.totalPatients')}`} role="doctor"
      headerRight={
        <Button label={t('common.add')} onPress={() => router.push('/screens/PatientDetails' as any)} size="sm"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      }>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.bgPage }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {loading ? (
          <View style={pt.loadingState}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>{t('patients.loading')}</Text>
          </View>
        ) : error ? (
          <Text style={{ color: colors.danger, textAlign: 'center', padding: 20 }}>{error}</Text>
        ) : (
          <>
            {/* Stats */}
            <View style={pt.statsGrid}>
              <View style={pt.statHalf}><StatCard icon="people-outline" value={patients.length} label={t('patients.totalPatients')} /></View>
              <View style={pt.statHalf}><StatCard icon="alert-circle-outline" value={criticalCount} label={t('patients.critical')} iconBg={colors.dangerSoft} valueColor={colors.danger} iconColor={colors.danger} /></View>
              <View style={pt.statHalf}><StatCard icon="eye-outline" value={monitorCount} label={t('patients.monitor')} iconBg={colors.warningSoft} valueColor={colors.warning} iconColor={colors.warning} /></View>
              <View style={pt.statHalf}><StatCard icon="checkmark-circle-outline" value={stableCount} label={t('patients.stable')} iconBg={colors.successSoft} valueColor={colors.success} iconColor={colors.success} /></View>
            </View>

            {/* Search + Filter Card */}
            <Card style={{ marginBottom: 16 }}>
              {/* Search bar */}
              <View style={[pt.searchRow, { backgroundColor: colors.bgPage, borderColor: colors.border }]}>
                <Ionicons name="search" size={18} color={colors.textFaint} style={{ marginRight: 8 }} />
                <TextInput
                  style={[pt.searchInput, { color: colors.textPrimary }]}
                  placeholder={t('patients.searchPlaceholder')}
                  placeholderTextColor={colors.textFaint}
                  value={search}
                  onChangeText={setSearch}
                  returnKeyType="search"
                  onSubmitEditing={handleSearch}
                />
                {search.length > 0 && (
                  <TouchableOpacity onPress={() => setSearch('')} activeOpacity={0.7}>
                    <Ionicons name="close-circle" size={18} color={colors.textFaint} />
                  </TouchableOpacity>
                )}
              </View>
              {/* Filter pills */}
              <View style={pt.filterRow}>
                {['all', 'critical', 'monitor', 'stable'].map(f => {
                  const isActive = filter === f;
                  const style = getFilterStyle(f, isActive);
                  return (
                    <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.7}
                      style={[pt.filterBtn, { backgroundColor: style.bg, borderColor: style.border }]}>
                      <Text style={[pt.filterTxt, { color: style.text }]}>{t(`patients.filter.${f}`)}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* Result count */}
              <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 10 }}>
                {t('patients.showing')} {filtered.length} {t('patients.of')} {patients.length} {t('patients.title').toLowerCase()}
              </Text>
            </Card>

            {/* Patient Cards */}
            <View style={{ gap: 12 }}>
              {filtered.map(p => {
                const status = 'stable';
                const sc = getStatusStyle(status);
                const initials = p.name ? p.name.split(' ').map((n: string) => n[0]).join('') : '?';
                return (
                  <Card key={p._id} padding={0}>
                    <View style={[pt.statusLine, { backgroundColor: sc.border }]} />
                    <View style={{ padding: 14 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 }}>
                          <Avatar initials={initials} size={48} bg={colors.primarySoft} color={colors.primary} />
                          <View style={{ flex: 1 }}>
                            <Text style={{ fontWeight: '800', fontSize: 16, color: colors.textPrimary }}>{p.name}</Text>
                            <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{p.email}</Text>
                          </View>
                        </View>
                        <Badge label={t('patients.stable')} type={sc.badge} />
                      </View>

                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                        {p.bloodType && <Badge label={`${t('patients.blood')}: ${p.bloodType}`} type="primary" size="sm" />}
                        {p.allergies && p.allergies.length > 0 && <Badge label={`${p.allergies.length} ${t('patients.allergies')}`} type="warning" size="sm" />}
                      </View>

                      <View style={{ flexDirection: 'row', gap: 10 }}>
                        <Button label={t('patients.viewDetails')} onPress={() => viewPatient(p)} style={{ flex: 1 }} size="sm" />
                        <Button label="SMS" onPress={() => { }} variant="outline" size="sm" />
                      </View>
                    </View>
                  </Card>
                );
              })}
            </View>

            {filtered.length === 0 && (
              <View style={pt.emptyState}>
                <Ionicons name="search-outline" size={48} color={colors.textFaint} style={{ marginBottom: 12 }} />
                <Text style={{ color: colors.textPrimary, fontSize: 15, fontWeight: '600' }}>{t('patients.noPatients')}</Text>
                <Text style={{ color: colors.textFaint, fontSize: 12, marginTop: 4 }}>{t('patients.tryAnotherSearch')}</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </BottomNavLayout>
  );
}

const pt = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  searchRow: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, marginBottom: 12
  },
  searchInput: { flex: 1, fontSize: 14 },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  filterTxt: { fontSize: 12, fontWeight: '600' },
  statusLine: { height: 4 },
  loadingState: { alignItems: 'center', padding: 40 },
  emptyState: { alignItems: 'center', padding: 40 },
});
