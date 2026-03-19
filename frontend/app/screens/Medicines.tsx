import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar } from '../../components/UI';
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
    <DrawerLayout
      title="Medicine Tracker"
      subtitle="Track your medications and adherence"
      showBack
      headerRight={<Button label="+ Add" onPress={() => setShowAdd(true)} size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
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
            <View style={styles.statsGrid}>
              <View style={styles.statHalf}><StatCard icon="💊" value={String(stats.active)} label="Active Medicines" /></View>
              <View style={styles.statHalf}><StatCard icon="✅" value={`${stats.taken}`} label="Taken Today" iconBg={Colors.successSoft} valueColor={Colors.success} /></View>
              <View style={styles.statHalf}><StatCard icon="⏰" value={`${stats.pending}`} label="Pending" iconBg={Colors.warningSoft} valueColor={Colors.warning} /></View>
              <View style={styles.statHalf}><StatCard icon="📊" value={`${stats.avgAdherence}%`} label="Avg Adherence" iconBg={Colors.primarySoft} valueColor={Colors.primary} /></View>
            </View>

            {/* Today's Schedule */}
            <Card>
              <CardHeader title="📅 Today's Schedule" />
              <View style={{ padding: 16 }}>
                {dueDoses.length === 0 ? (
                  <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 20 }}>
                    No medications scheduled for today
                  </Text>
                ) : (
                  dueDoses.map((dose, i) => (
                    <View key={`${dose.medicineId}-${dose.slot}-${i}`} style={[styles.doseRow, i < dueDoses.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
                      <Text style={styles.doseTime}>{dose.slot}</Text>
                      <View style={[styles.doseDot, { backgroundColor: dose.status === 'taken' ? Colors.success : dose.isOverdue ? Colors.danger : Colors.primary }]} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.doseName}>{dose.medicineName}</Text>
                        <Text style={styles.doseDosage}>{dose.dosage}</Text>
                      </View>
                      {dose.status === 'taken' ? (
                        <Badge label="Taken" type="success" />
                      ) : dose.status === 'missed' ? (
                        <Button label="Retake" onPress={() => handleMarkTaken(dose)} size="sm" />
                      ) : (
                        <Button label="Take Now" onPress={() => handleMarkTaken(dose)} size="sm" />
                      )}
                    </View>
                  ))
                )}
              </View>
            </Card>

            {/* Weekly Adherence */}
            <Card>
              <CardHeader title="📊 Weekly Adherence" right={<Badge label={`${stats.avgAdherence}% avg`} type={stats.avgAdherence >= 80 ? 'success' : 'warning'} />} />
              <View style={{ padding: 16 }}>
                <View style={styles.weeklyBars}>
                  {weeklyTrend.map((day, i) => (
                    <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                      <View style={[styles.bar, {
                        height: Math.max(4, day.adherencePercent * 0.5),
                        backgroundColor: i === weeklyTrend.length - 1 ? Colors.primary : Colors.primarySoft,
                        borderTopLeftRadius: 4, borderTopRightRadius: 4,
                      }]} />
                      <Text style={{ fontSize: 10, color: colors.textFaint }}>{getDayName(day.date)}</Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card>

            {/* Medicines List */}
            <Card>
              <CardHeader title="💊 My Medicines" />
              <View style={{ padding: 16 }}>
                {medicines.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <Text style={{ fontSize: 40, marginBottom: 8 }}>💊</Text>
                    <Text style={{ color: colors.textMuted }}>No medicines added yet</Text>
                    <Button label="Add Medicine" onPress={() => setShowAdd(true)} size="sm" style={{ marginTop: 12 }} />
                  </View>
                ) : (
                  medicines.map((med, i) => {
                    const medAdherence = getAdherenceForMedicine(med._id);
                    return (
                      <View key={med._id} style={[styles.medCard, i < medicines.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingBottom: 12, marginBottom: 12 }]}>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{med.name}</Text>
                            <Badge label={med.dosage} />
                          </View>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>
                            {med.frequency} · {med.timeSlots?.join(', ') || 'No schedule'}
                          </Text>
                          {med.startDate && (
                            <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>
                              Started: {formatDate(med.startDate)}
                              {med.endDate ? ` → ${formatDate(med.endDate)}` : ''}
                            </Text>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 }}>
                            <ProgressBar value={medAdherence} color={medAdherence >= 80 ? Colors.success : Colors.warning} style={{ flex: 1, height: 6 }} />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: medAdherence >= 80 ? Colors.success : Colors.warning }}>
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
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>💊 Add New Medicine</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 400 }}>
              <View style={{ padding: 16 }}>
                <Text style={styles.label}>Medicine Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Paracetamol"
                  value={newMed.name}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, name: text }))}
                  placeholderTextColor={colors.textFaint}
                />

                <Text style={styles.label}>Dosage *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 500mg"
                  value={newMed.dosage}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, dosage: text }))}
                  placeholderTextColor={colors.textFaint}
                />

                <Text style={styles.label}>Frequency</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {['daily', 'twice daily', 'thrice daily', 'weekly', 'as needed'].map(freq => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => setNewMed(prev => ({ ...prev, frequency: freq }))}
                      style={[styles.freqChip, newMed.frequency === freq && { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}
                    >
                      <Text style={[styles.freqChipText, newMed.frequency === freq && { color: colors.primary }]}>{freq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Time Slots</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="HH:MM"
                    value={newTimeSlot}
                    onChangeText={setNewTimeSlot}
                    placeholderTextColor={colors.textFaint}
                  />
                  <Button label="Add" onPress={addTimeSlot} size="sm" />
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
                  {newMed.timeSlots.map(slot => (
                    <TouchableOpacity
                      key={slot}
                      onPress={() => removeTimeSlot(slot)}
                      style={[styles.timeChip, { backgroundColor: colors.primarySoft }]}
                    >
                      <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>{slot} ✕</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={styles.label}>Instructions (optional)</Text>
                <TextInput
                  style={[styles.input, { height: 60, textAlignVertical: 'top' }]}
                  placeholder="e.g. Take after food"
                  value={newMed.instructions}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, instructions: text }))}
                  multiline
                  placeholderTextColor={colors.textFaint}
                />

                <View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>
                  <Button label="Cancel" onPress={() => setShowAdd(false)} variant="outline" style={{ flex: 1 }} />
                  <Button label="Add Medicine" onPress={handleAddMedicine} style={{ flex: 1 }} />
                </View>
              </View>
            </ScrollView>
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
  doseTime: { fontSize: 11, fontWeight: '700', color: Colors.gray500, width: 48 },
  doseDot: { width: 10, height: 10, borderRadius: 5 },
  doseName: { fontSize: 13, fontWeight: '600', color: Colors.gray800 },
  doseDosage: { fontSize: 11, color: Colors.gray500, marginTop: 2 },
  weeklyBars: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6 },
  bar: { flex: 1, minHeight: 4, width: '100%' },
  medCard: { flexDirection: 'row', alignItems: 'flex-start' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 16, width: '100%', maxWidth: 460, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle: { fontSize: 16, fontWeight: '700', color: Colors.gray800 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 6, marginTop: 12 },
  input: { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, fontSize: 14, color: Colors.gray900 },
  freqChip: { paddingVertical: 6, paddingHorizontal: 12, borderRadius: 16, borderWidth: 1, borderColor: Colors.border },
  freqChipText: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
  timeChip: { paddingVertical: 4, paddingHorizontal: 10, borderRadius: 12 },
});
