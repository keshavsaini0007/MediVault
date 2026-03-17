import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { Card, Badge, Button } from '../../components/UI';

const TIMELINE_DATA = [
  {
    date: 'Mar 14, 2026', day: 'Today',
    events: [
      { id: 1, type: 'symptom', icon: '🌡️', title: 'High Fever Reported', detail: 'Temperature: 104°F, Headache, Body aches. Reported via Symptom Checker.', severity: 'critical' },
      { id: 2, type: 'dose', icon: '💊', title: 'Morning Doses Taken', detail: 'Paracetamol 500mg ✓  ·  Antibiotic 250mg ✓', severity: 'success' },
    ],
  },
  {
    date: 'Mar 12, 2026', day: '2 Days Ago',
    events: [
      { id: 3, type: 'report', icon: '🔬', title: 'Blood Test Uploaded', detail: 'Dengue NS1 Antigen: Positive · Platelet count: 85,000 (Low). AI Summary available.', severity: 'warning' },
      { id: 4, type: 'dose', icon: '💊', title: 'All Doses Taken', detail: 'Paracetamol ✓  ·  Vitamin C ✓  ·  Antibiotic ✓', severity: 'success' },
    ],
  },
  {
    date: 'Mar 10, 2026', day: '4 Days Ago',
    events: [
      { id: 5, type: 'record', icon: '🏥', title: 'OPD Visit — Dr. Meera Kapoor', detail: 'Diagnosis: Dengue Fever. Treatment started: Paracetamol + IV Fluids + Antibiotic.', severity: 'info' },
      { id: 6, type: 'report', icon: '🫁', title: 'Chest X-Ray Uploaded', detail: 'No significant abnormalities. Lungs clear. AI reviewed.', severity: 'success' },
    ],
  },
  {
    date: 'Jan 5, 2026', day: 'Jan 5',
    events: [
      { id: 7, type: 'record', icon: '✅', title: 'Annual Health Check-up', detail: 'All vitals normal. Slight elevation in blood sugar — dietary advice given.', severity: 'success' },
      { id: 8, type: 'report', icon: '🔬', title: 'Full Blood Panel Uploaded', detail: 'HbA1c: 5.8%, Blood sugar: 102 mg/dL, Cholesterol: 185 mg/dL.', severity: 'success' },
    ],
  },
  {
    date: 'Mar 8, 2026', day: 'Account Created',
    events: [
      { id: 9, type: 'system', icon: '🎉', title: 'Joined MediVault', detail: 'Patient profile created. Emergency QR generated. Doctor assigned.', severity: 'info' },
    ],
  },
];

const TYPE_META: Record<string, { color: string; label: string; bg: string }> = {
  symptom:  { color: Colors.danger,   label: 'Symptom',   bg: Colors.dangerSoft  },
  dose:     { color: Colors.success,  label: 'Medication', bg: Colors.successSoft },
  report:   { color: Colors.primary,  label: 'Report',    bg: Colors.primarySoft },
  record:   { color: Colors.teal,     label: 'Visit',     bg: Colors.tealSoft    },
  medicine: { color: Colors.warning,  label: 'Medicine',  bg: Colors.warningSoft },
  system:   { color: Colors.gray500,  label: 'System',    bg: Colors.gray100     },
};

const SEV_COLOR: Record<string, string> = {
  critical: Colors.danger,
  warning:  Colors.warning,
  success:  Colors.success,
  info:     Colors.primary,
};

const TYPES = ['All', 'symptom', 'dose', 'report', 'record'];

export default function TimelineScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [typeFilter, setTypeFilter] = useState('All');

  const filtered = TIMELINE_DATA
    .map(g => ({ ...g, events: g.events.filter(e => typeFilter === 'All' || e.type === typeFilter) }))
    .filter(g => g.events.length > 0);

  return (
    <DrawerLayout title="Health Timeline" subtitle="Your complete health story" showBack>

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        {TYPES.map(t => {
          const meta = TYPE_META[t];
          const active = typeFilter === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              style={[
                styles.filterBtn,
                active && { backgroundColor: meta?.bg || Colors.primarySoft, borderColor: meta?.color || Colors.primary },
              ]}
            >
              <Text style={[styles.filterText, active && { color: meta?.color || Colors.primary }]}>
                {t === 'All' ? '📋 All Events' : meta?.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {filtered.length === 0 && (
          <View style={{ alignItems: 'center', padding: 48 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>📭</Text>
            <Text style={{ fontWeight: '600', fontSize: 15, color: Colors.gray700 }}>No events in this category</Text>
          </View>
        )}

        {filtered.map((group, gi) => (
          <View key={gi} style={{ marginBottom: 28 }}>
            {/* Date Header */}
            <View style={styles.dateHeader}>
              <View style={[styles.datePill, gi === 0 && { backgroundColor: Colors.primary }]}>
                <Text style={[styles.datePillText, gi === 0 && { color: 'white' }]}>{group.day}</Text>
              </View>
              <View style={styles.dateLine} />
              <Text style={styles.dateText}>{group.date}</Text>
            </View>

            {/* Events */}
            <View style={{ paddingLeft: 8 }}>
              {group.events.map((event, ei) => {
                const meta = TYPE_META[event.type] || TYPE_META.system;
                return (
                  <View key={event.id} style={{ flexDirection: 'row', gap: 12 }}>
                    {/* Spine + Icon */}
                    <View style={{ alignItems: 'center', width: 40 }}>
                      <View style={[styles.eventIcon, { backgroundColor: meta.bg, borderColor: meta.color + '44' }]}>
                        <Text style={{ fontSize: 18 }}>{event.icon}</Text>
                      </View>
                      {ei < group.events.length - 1 && (
                        <View style={styles.spine} />
                      )}
                    </View>

                    {/* Card */}
                    <View style={[styles.eventCard, { borderLeftColor: SEV_COLOR[event.severity] || meta.color, marginBottom: ei < group.events.length - 1 ? 8 : 0 }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.gray800 }}>{event.title}</Text>
                        <View style={[styles.typeBadge, { backgroundColor: meta.bg }]}>
                          <Text style={{ fontSize: 10, fontWeight: '700', color: meta.color }}>{meta.label}</Text>
                        </View>
                      </View>
                      <Text style={{ fontSize: 13, color: Colors.gray500, lineHeight: 18 }}>{event.detail}</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          </View>
        ))}

      </ScrollView>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 56 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, backgroundColor: Colors.white },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  datePill: { paddingVertical: 4, paddingHorizontal: 14, borderRadius: 20, backgroundColor: Colors.gray100, borderWidth: 1, borderColor: Colors.border },
  datePillText: { fontSize: 12, fontWeight: '700', color: Colors.gray600 },
  dateLine: { flex: 1, height: 1, backgroundColor: Colors.border },
  dateText: { fontSize: 11, color: Colors.gray400 },
  eventIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
  spine: { width: 2, flex: 1, backgroundColor: Colors.border, minHeight: 14, marginTop: 4 },
  eventCard: { flex: 1, backgroundColor: Colors.white, borderWidth: 1, borderLeftWidth: 3, borderColor: Colors.border, borderRadius: 12, padding: 12, marginBottom: 8 },
  typeBadge: { borderRadius: 10, paddingVertical: 2, paddingHorizontal: 8 },
});
