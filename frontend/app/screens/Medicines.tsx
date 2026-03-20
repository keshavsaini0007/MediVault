import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import BottomNavLayout from '../../components/BottomNavLayout';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar, IconBox } from '../../components/UI';
import { medicineAPI, Medicine } from '../../services/api';

const weekDays = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface WeeklyTrend {
  date: string;
  total: number;
  taken: number;
  missed: number;
  adherencePercent: number;
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

export default function MedicinesScreen() {
  const { colors } = useTheme();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dueDoses, setDueDoses] = useState<DueDose[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [adherence, setAdherence] = useState<Array<{ medicineId: string; adherencePercent: number }>>([]);

  const [newMed, setNewMed] = useState({
    name: '',
    dosage: '',
    frequency: 'daily',
    timeSlots: ['09:00'],
    instructions: '',
  });
  const [newTimeSlot, setNewTimeSlot] = useState('09:00');

  const fetchData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);
      setError('');

      const [medsRes, dueRes, weeklyRes, adherenceRes] = await Promise.all([
        medicineAPI.getMedicines(),
        medicineAPI.getDueDoses(),
        medicineAPI.getWeeklyAdherence(),
        medicineAPI.getAdherenceSummary(),
      ]);

      console.log('DEBUG frontend - medsRes:', medsRes.length);
      console.log('DEBUG frontend - dueRes:', JSON.stringify(dueRes));
      console.log('DEBUG frontend - weeklyRes:', JSON.stringify(weeklyRes));

      setMedicines(medsRes);
      setDueDoses(dueRes.dueDoses);
      setWeeklyTrend(weeklyRes.trend);
      setAdherence(adherenceRes.map(a => ({ medicineId: a.medicineId, adherencePercent: a.adherencePercent })));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch medicines';
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = useCallback(() => {
    fetchData(true);
  }, [fetchData]);

  const getAdherenceForMedicine = (medicineId: string): number => {
    const found = adherence.find(a => a.medicineId === medicineId);
    return found?.adherencePercent ?? 0;
  };

  const handleAddMedicine = async () => {
    if (!newMed.name.trim()) {
      Alert.alert('Required', 'Please enter medicine name');
      return;
    }
    if (!newMed.dosage.trim()) {
      Alert.alert('Required', 'Please enter dosage');
      return;
    }

    try {
      await medicineAPI.addMedicine({
        name: newMed.name.trim(),
        dosage: newMed.dosage.trim(),
        frequency: newMed.frequency,
        timeSlots: newMed.timeSlots,
        instructions: newMed.instructions.trim() || undefined,
      });

      setShowAdd(false);
      setNewMed({ name: '', dosage: '', frequency: 'daily', timeSlots: ['09:00'], instructions: '' });
      await fetchData();
      Alert.alert('Success', 'Medicine added successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to add medicine');
    }
  };

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
      fetchData();
    } catch (err) {
      Alert.alert('Error', 'Failed to mark dose');
    }
  };

  const addTimeSlot = () => {
    if (newTimeSlot && !newMed.timeSlots.includes(newTimeSlot)) {
      setNewMed(prev => ({ ...prev, timeSlots: [...prev.timeSlots, newTimeSlot].sort() }));
    }
  };

  const removeTimeSlot = (slot: string) => {
    setNewMed(prev => ({ ...prev, timeSlots: prev.timeSlots.filter(s => s !== slot) }));
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getDayName = (dateStr: string) => {
    const date = new Date(dateStr);
    return ['S', 'M', 'T', 'W', 'T', 'F', 'S'][date.getDay()];
  };

  const stats = {
    active: medicines.length,
    taken: dueDoses.filter(d => d.status === 'taken').length,
    pending: dueDoses.filter(d => d.status === 'pending').length,
    overdue: dueDoses.filter(d => d.isOverdue).length,
    avgAdherence: adherence.length > 0
      ? Math.round(adherence.reduce((sum, a) => sum + a.adherencePercent, 0) / adherence.length)
      : 0,
  };

  return (
    <BottomNavLayout
      title="Medicines"
      subtitle="Track your medications"
      role="patient"
      headerRight={<Button label="+ Add" onPress={() => setShowAdd(true)} size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 40 }}>Loading...</Text>
        ) : error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>
            <Button label="Retry" onPress={() => fetchData()} variant="outline" />
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={md.statsGrid}>
              <View style={md.statHalf}><StatCard icon="medical-outline" value={String(stats.active)} label="Active Medicines" /></View>
              <View style={md.statHalf}><StatCard icon="checkmark-circle-outline" value={`${stats.taken}`} label="Taken Today" iconBg={colors.successSoft} valueColor={colors.success} iconColor={colors.success} /></View>
              <View style={md.statHalf}><StatCard icon="time-outline" value={`${stats.pending}`} label="Pending" iconBg={colors.warningSoft} valueColor={colors.warning} iconColor={colors.warning} /></View>
              <View style={md.statHalf}><StatCard icon="stats-chart-outline" value={`${stats.avgAdherence}%`} label="Avg Adherence" iconBg={colors.primarySoft} valueColor={colors.primary} iconColor={colors.primary} /></View>
            </View>

            {/* Today's Schedule */}
            <Card variant="elevated" glowColor={colors.teal}>
              <CardHeader title="Today's Schedule" icon="time-outline" />
              <View style={{ padding: 16 }}>
                {dueDoses.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <IconBox icon="medical-outline" color={colors.textFaint} bg={colors.tealSoft} size={56} />
                    <Text style={{ color: colors.textMuted, marginTop: 12 }}>No medications scheduled</Text>
                  </View>
                ) : (
                  dueDoses.map((dose, i) => {
                    const dotColor = dose.status === 'taken' ? colors.success : dose.isOverdue ? colors.danger : colors.teal;
                    return (
                      <TouchableOpacity 
                        key={`${dose.medicineId}-${dose.slot}-${i}`} 
                        style={[md.doseRow, i < dueDoses.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}
                        activeOpacity={0.7}
                      >
                        <View style={[md.doseDot, { backgroundColor: dotColor, shadowColor: dotColor, shadowOpacity: 0.35 }]}>
                          <Ionicons name={dose.status === 'taken' ? 'checkmark' : dose.isOverdue ? 'alert-circle' : 'time-outline'} size={14} color="white" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[md.doseName, { color: colors.textPrimary }]}>{dose.medicineName}</Text>
                          <Text style={[md.doseDosage, { color: colors.textMuted }]}>{dose.slot} · {dose.dosage}</Text>
                        </View>
                        {dose.status === 'taken' ? (
                          <Badge label="Taken" type="success" icon="checkmark-circle" />
                        ) : (
                          <Button 
                            label={dose.status === 'missed' ? 'Retake' : 'Take'} 
                            onPress={() => handleMarkTaken(dose)} 
                            size="sm" 
                            icon={dose.status === 'missed' ? 'refresh' : 'checkmark'}
                            pill
                          />
                        )}
                      </TouchableOpacity>
                    );
                  })
                )}
              </View>
            </Card>

            {/* Weekly Adherence */}
            <Card variant="elevated" glowColor={colors.teal}>
              <CardHeader 
                title="Weekly Adherence" 
                icon="analytics-outline"
                right={<Badge label={`${stats.avgAdherence}% avg`} type={stats.avgAdherence >= 80 ? 'success' : 'warning'} />} 
              />
              <View style={{ padding: 16 }}>
                <View style={md.weeklyBars}>
                  {weeklyTrend.map((day, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 6 }}>
                      <View style={[md.bar, {
                        height: Math.max(6, day.adherencePercent * 0.5),
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

            {/* Medicines List */}
            <Card variant="elevated" glowColor={colors.teal}>
              <CardHeader title="My Medicines" icon="medical-outline" />
              <View style={{ padding: 16 }}>
                {medicines.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <IconBox icon="medical-outline" color={colors.textFaint} bg={colors.tealSoft} size={56} />
                    <Text style={{ color: colors.textMuted, marginTop: 12 }}>No medicines added yet</Text>
                    <Button label="Add Medicine" onPress={() => setShowAdd(true)} size="sm" style={{ marginTop: 12 }} />
                  </View>
                ) : (
                  medicines.map((med, i) => {
                    const medAdherence = getAdherenceForMedicine(med._id);
                    const barColor = medAdherence >= 80 ? colors.success : colors.warning;
                    return (
                      <View key={med._id} style={[md.medCard, i < medicines.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingBottom: 14, marginBottom: 14 }]}>
                        <IconBox icon="medical" color={colors.teal} bg={colors.tealSoft} size={42} />
                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '700', fontSize: 15, color: colors.textPrimary }}>{med.name}</Text>
                            <Badge label={med.dosage} size="sm" />
                          </View>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>
                            {med.frequency} · {med.timeSlots?.join(', ') || 'No schedule'}
                          </Text>
                          {med.startDate && (
                            <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>
                              Started: {formatDate(med.startDate)}
                              {med.endDate ? ` - ${formatDate(med.endDate)}` : ''}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                            <ProgressBar value={medAdherence} color={barColor} style={{ flex: 1, height: 8 }} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: barColor, minWidth: 40 }}>
                              {medAdherence}%
                            </Text>
                          </View>
                        </View>
                      </View>
                    );
                  })
                )}
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Add Medicine Modal */}
      <Modal visible={showAdd} transparent animationType="fade">
        <View style={md.modalOverlay}>
          <View style={[md.modalCard, { backgroundColor: colors.bgCard, shadowColor: colors.teal, shadowOpacity: 0.15, borderColor: colors.tealSoft }]}>
            <View style={[md.modalHeader, { borderBottomColor: colors.borderSoft }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <IconBox icon="medical" color={colors.teal} bg={colors.tealSoft} size={36} />
                <Text style={[md.modalTitle, { color: colors.textPrimary }]}>Add New Medicine</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdd(false)} activeOpacity={0.7} style={md.closeBtn}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 420 }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 20 }}>
                <Text style={[md.label, { color: colors.textMuted }]}>Medicine Name *</Text>
                <TextInput
                  style={[md.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. Paracetamol"
                  value={newMed.name}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, name: text }))}
                  placeholderTextColor={colors.textFaint}
                />

                <Text style={[md.label, { color: colors.textMuted }]}>Dosage *</Text>
                <TextInput
                  style={[md.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. 500mg"
                  value={newMed.dosage}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, dosage: text }))}
                  placeholderTextColor={colors.textFaint}
                />

                <Text style={[md.label, { color: colors.textMuted }]}>Frequency</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {['daily', 'twice daily', 'thrice daily', 'weekly', 'as needed'].map(freq => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setNewMed(prev => ({ ...prev, frequency: freq }))}
                      activeOpacity={0.7}
                      style={[md.freqChip, { borderColor: newMed.frequency === freq ? colors.teal : colors.border, backgroundColor: newMed.frequency === freq ? colors.tealSoft : colors.bgPage }]}
                    >
                      <Text style={[md.freqChipText, { color: newMed.frequency === freq ? colors.teal : colors.textMuted }]}>{freq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[md.label, { color: colors.textMuted }]}>Time Slots</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <TextInput
                    style={[md.input, { flex: 1, backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder="HH:MM"
                    value={newTimeSlot}
                    onChangeText={setNewTimeSlot}
                    placeholderTextColor={colors.textFaint}
                  />
                  <Button label="Add" onPress={addTimeSlot} size="sm" />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {newMed.timeSlots.map(slot => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => removeTimeSlot(slot)}
                      activeOpacity={0.7}
                      style={[md.timeChip, { backgroundColor: colors.tealSoft }]}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                        <Ionicons name="time-outline" size={12} color={colors.teal} />
                        <Text style={{ color: colors.teal, fontSize: 12, fontWeight: '600' }}>{slot}</Text>
                        <Ionicons name="close-circle" size={14} color={colors.teal} />
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[md.label, { color: colors.textMuted }]}>Instructions (optional)</Text>
                <TextInput
                  style={[md.input, { height: 64, textAlignVertical: 'top', backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder="e.g. Take after food"
                  value={newMed.instructions}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, instructions: text }))}
                  multiline
                  placeholderTextColor={colors.textFaint}
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <Button label="Cancel" onPress={() => setShowAdd(false)} variant="outline" style={{ flex: 1 }} />
                  <Button label="Add Medicine" onPress={handleAddMedicine} glow={false} style={{ flex: 1.2 }} />
                </View>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </BottomNavLayout>
  );
}

const md = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  doseRow: { 
    flexDirection: 'row', alignItems: 'center', 
    paddingVertical: 12, gap: 12,
  },
  doseTime: { fontSize: 12, fontWeight: '700', width: 52 },
  doseDot: { 
    width: 32, height: 32, borderRadius: 16, 
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 8,
    elevation: 4,
  },
  doseName: { fontSize: 14, fontWeight: '600' },
  doseDosage: { fontSize: 12, marginTop: 3 },
  weeklyBars: { flexDirection: 'row', alignItems: 'flex-end', height: 70, gap: 6 },
  bar: { 
    flex: 1, minHeight: 6, width: '100%',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
  },
  medCard: { 
    flexDirection: 'row', alignItems: 'flex-start',
  },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalCard: { 
    borderRadius: 24, width: '100%', maxWidth: 440, maxHeight: '88%',
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 10,
  },
  closeBtn: { padding: 2 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8, marginTop: 14 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, fontSize: 14 },
  freqChip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5 },
  freqChipText: { fontSize: 12, fontWeight: '600' },
  timeChip: { paddingVertical: 7, paddingHorizontal: 14, borderRadius: 16 },
});
