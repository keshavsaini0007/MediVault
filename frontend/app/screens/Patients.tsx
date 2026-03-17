import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { StatCard, Card, Badge, Button, ProgressBar, Avatar } from '../../components/UI';
import { allPatients } from '../../data/mockData';

const STATUS_COLORS: Record<string, { badge: 'danger' | 'warning' | 'success'; bar: string }> = {
  Critical: { badge: 'danger',  bar: Colors.danger  },
  Monitor:  { badge: 'warning', bar: Colors.warning },
  Stable:   { badge: 'success', bar: Colors.success },
};

export default function PatientsScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('All');

  const filtered = allPatients.filter(p => {
    const ms = p.name.toLowerCase().includes(search.toLowerCase()) || p.condition.toLowerCase().includes(search.toLowerCase());
    return ms && (filter === 'All' || p.status === filter);
  });

  return (
    <DrawerLayout title="Patients" subtitle="All your patients" showBack>
        <Button label="+ Add" onPress={() => router.push('/screens/PatientDetails')} size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statHalf}><StatCard icon="👥" value="28" label="Total Patients" /></View>
          <View style={styles.statHalf}><StatCard icon="🚨" value="2" label="Critical" iconBg={Colors.dangerSoft} valueColor={Colors.danger} /></View>
          <View style={styles.statHalf}><StatCard icon="👁️" value="5" label="Under Monitor" iconBg={Colors.warningSoft} valueColor={Colors.warning} /></View>
          <View style={styles.statHalf}><StatCard icon="✅" value="21" label="Stable" iconBg={Colors.successSoft} valueColor={Colors.success} /></View>
        </View>

        {/* Search */}
        <Card>
          <View style={{ padding: 14 }}>
            <View style={styles.searchBox}>
              <Text style={{ marginRight: 6 }}>🔍</Text>
              <TextInput
                style={styles.searchInput}
                placeholder="Search by name or condition…"
                value={search}
                onChangeText={setSearch}
                placeholderTextColor={Colors.gray400}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 10 }}>
              {['All', 'Critical', 'Monitor', 'Stable'].map(f => (
                <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
                  <Text style={[styles.filterText, filter === f && { color: 'white' }]}>{f}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </Card>

        {/* Patient Cards */}
        {filtered.map(p => {
          const sc = STATUS_COLORS[p.status] || STATUS_COLORS.Stable;
          return (
            <Card key={p.id} style={{ marginBottom: 12 }}>
              <View style={{ height: 4, backgroundColor: sc.bar }} />
              <View style={{ padding: 14 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                    <Avatar initials={p.name.split(' ').map(n => n[0]).join('')} size={44} />
                    <View>
                      <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.gray800 }}>{p.name}</Text>
                      <Text style={{ fontSize: 11, color: Colors.gray400 }}>Age {p.age} · {p.blood}</Text>
                    </View>
                  </View>
                  <Badge label={p.status} type={sc.badge} />
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <Badge label={p.condition} />
                  <Text style={{ fontSize: 11, color: Colors.gray400 }}>🔥 {p.streak}d streak</Text>
                </View>

                <View style={{ marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Text style={{ fontSize: 11, color: Colors.gray500 }}>Adherence</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: p.adherence < 75 ? Colors.danger : Colors.success }}>{p.adherence}%</Text>
                  </View>
                  <ProgressBar value={p.adherence} color={p.adherence < 75 ? Colors.danger : Colors.success} />
                </View>

                <Text style={{ fontSize: 11, color: Colors.gray400, marginBottom: 12 }}>
                  👨‍⚕️ {p.doctor} · Last seen {p.lastSeen}
                </Text>

                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Button label="View Details" onPress={() => router.push('/screens/PatientDetails')} style={{ flex: 1 }} size="sm" />
                  <Button label="📱 SMS" onPress={() => {}} variant="outline" size="sm" />
                </View>
              </View>
            </Card>
          );
        })}

        {filtered.length === 0 && (
          <View style={{ padding: 40, alignItems: 'center' }}>
            <Text style={{ color: Colors.gray400 }}>No patients match your search.</Text>
          </View>
        )}
      </ScrollView>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 14, color: Colors.gray900 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.white },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
});
