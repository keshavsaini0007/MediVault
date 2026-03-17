import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar } from '../../components/UI';
import { medicinesData, todayScheduleData } from '../../data/mockData';

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

export default function MedicinesScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [doseStates, setDoseStates] = useState<Record<number, boolean>>({ });
  const [medName, setMedName] = useState('');
  const [dosage, setDosage] = useState('');

  const markTaken = (idx: number) => setDoseStates(prev => ({ ...prev, [idx]: true }));

  return (
    <DrawerLayout title="Medicine Tracker" subtitle="Track your medications and adherence"
      showBack headerRight={<Button label="+ Add" onPress={() => setShowAdd(true)} size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />}
    >

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* Stats */}
        <View style={styles.statsGrid}>
          <View style={styles.statHalf}><StatCard icon="💊" value="3" label="Active Medicines" /></View>
          <View style={styles.statHalf}><StatCard icon="🔥" value="7" label="Day Streak" iconBg={Colors.accentSoft} valueColor={Colors.accent} /></View>
          <View style={styles.statHalf}><StatCard icon="✅" value="88%" label="Overall Adherence" iconBg={Colors.successSoft} valueColor={Colors.success} /></View>
          <View style={styles.statHalf}><StatCard icon="⏰" value="4" label="Today's Doses Left" iconBg={Colors.warningSoft} /></View>
        </View>

        {/* Today's Schedule */}
        <Card>
          <CardHeader title="📅 Today's Schedule" right={<Badge label="Mar 14, 2026" />} />
          <View style={{ paddingHorizontal: 16 }}>
            {todayScheduleData.map((dose, i) => (
              <View key={i} style={[styles.doseRow, i < todayScheduleData.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                <Text style={styles.doseTime}>{dose.time}</Text>
                <View style={[styles.doseDot, { backgroundColor: dose.color }]} />
                <Text style={styles.doseName}>{dose.med}</Text>
                {dose.status === 'taken' || doseStates[i] ? (
                  <Badge label="✓ Taken" type="success" />
                ) : dose.status === 'due' ? (
                  <Button label="Mark Taken" onPress={() => markTaken(i)} size="sm" />
                ) : (
                  <Badge label="Later" type="default" />
                )}
              </View>
            ))}
          </View>
        </Card>

        {/* Weekly Adherence */}
        <Card>
          <CardHeader title="📊 Weekly Adherence" />
          <View style={{ padding: 16 }}>
            {medicinesData.map(med => (
              <View key={med.id} style={{ marginBottom: 18 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: Colors.gray800 }}>{med.name}</Text>
                  <Text style={{ fontSize: 13, fontWeight: '700', color: med.adherence >= 90 ? Colors.success : Colors.warning }}>{med.adherence}%</Text>
                </View>
                <View style={styles.doseGrid}>
                  {med.doses.map((taken, i) => (
                    <View key={i} style={[styles.doseCell, { backgroundColor: taken ? Colors.success : Colors.danger, opacity: taken ? 1 : 0.7 }]}>
                      <Text style={{ color: 'white', fontSize: 10, fontWeight: '700' }}>{taken ? '✓' : '✗'}</Text>
                    </View>
                  ))}
                </View>
                <View style={styles.doseGrid}>
                  {weekDays.map((d, i) => (
                    <Text key={i} style={{ flex: 1, fontSize: 9, color: Colors.gray400, textAlign: 'center' }}>{d}</Text>
                  ))}
                </View>
              </View>
            ))}
          </View>
        </Card>

        {/* Medicine List */}
        <Card>
          <CardHeader title="💊 My Medicines" />
          <View style={{ padding: 16 }}>
            {medicinesData.map((m, i) => (
              <View key={m.id} style={[styles.medCard, i < medicinesData.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.gray800 }}>{m.name}</Text>
                    <Badge label={m.dosage} />
                  </View>
                  <Text style={{ fontSize: 12, color: Colors.gray500 }}>{m.freq} · {m.times.join(', ')}</Text>
                  <Text style={{ fontSize: 11, color: Colors.gray400, marginTop: 2 }}>{m.startDate} → {m.endDate}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                    <Text style={{ fontSize: 13 }}>🔥</Text>
                    <Text style={{ fontWeight: '700', fontSize: 13, color: Colors.gray700 }}>{m.streak}d streak</Text>
                    <ProgressBar value={m.adherence} color={m.adherence >= 90 ? Colors.success : Colors.danger} style={{ flex: 1 }} />
                    <Text style={{ fontSize: 12, fontWeight: '700', color: m.adherence >= 90 ? Colors.success : Colors.danger }}>{m.adherence}%</Text>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 6, marginLeft: 8 }}>
                  <Button label="Edit" onPress={() => {}} variant="outline" size="sm" />
                  <Button label="✕" onPress={() => {}} variant="danger" size="sm" />
                </View>
              </View>
            ))}
          </View>
        </Card>

      </ScrollView>

      {/* Add Medicine Modal */}
      <Modal visible={showAdd} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💊 Add New Medicine</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Text style={{ fontSize: 18, color: Colors.gray500 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.label}>Medicine Name</Text>
              <TextInput style={styles.input} placeholder="e.g. Paracetamol" value={medName} onChangeText={setMedName} placeholderTextColor={Colors.gray400} />
              <Text style={styles.label}>Dosage</Text>
              <TextInput style={styles.input} placeholder="e.g. 500mg" value={dosage} onChangeText={setDosage} placeholderTextColor={Colors.gray400} />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                <Button label="Cancel" onPress={() => setShowAdd(false)} variant="outline" style={{ flex: 1 }} />
                <Button label="Add Medicine ✓" onPress={() => { setShowAdd(false); setMedName(''); setDosage(''); }} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  doseRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 8 },
  doseTime: { fontSize: 10, fontWeight: '700', color: Colors.gray500, width: 52 },
  doseDot: { width: 10, height: 10, borderRadius: 5 },
  doseName: { flex: 1, fontSize: 13, fontWeight: '600', color: Colors.gray800 },
  doseGrid: { flexDirection: 'row', gap: 4, marginBottom: 2 },
  doseCell: { flex: 1, height: 22, borderRadius: 4, alignItems: 'center', justifyContent: 'center' },
  medCard: { paddingVertical: 12, flexDirection: 'row', alignItems: 'center' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 16, width: '100%', maxWidth: 460 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray800 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, fontSize: 14, color: Colors.gray900 },
});
