import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import BottomNavLayout from '@/components/BottomNavLayout';
import { StatCard, Card, CardHeader, Badge, Button, ProgressBar, IconBox } from '../../components/UI';
import Stepper from '../../components/Stepper';
import { medicineAPI, Medicine } from '../../services/api';
import { calculateEndDate, getDaysRemaining } from '../../utils/calculateEndDate';

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

const FREQ_DOSES_MAP: Record<string, number> = {
  'daily': 1,
  'twice daily': 2,
  'thrice daily': 3,
  'weekly': 1 / 7,
  'as needed': 1,
};

const DEFAULT_MED = {
  name: '',
  dosage: '',
  frequency: 'daily',
  timeSlots: ['09:00'],
  instructions: '',
  totalTablets: 30,
  tabletsPerDose: 1,
  dosesPerDay: 1,
};

export default function MedicinesScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  // When set, the modal opens in refill mode pre-filled from this medicine
  const [refillSourceId, setRefillSourceId] = useState<string | null>(null);

  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [dueDoses, setDueDoses] = useState<DueDose[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<WeeklyTrend[]>([]);
  const [adherence, setAdherence] = useState<Array<{ medicineId: string; adherencePercent: number }>>([]);

  const [newMed, setNewMed] = useState({ ...DEFAULT_MED });
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

      setMedicines(medsRes);
      setDueDoses(dueRes.dueDoses);
      setWeeklyTrend(weeklyRes.trend);
      setAdherence(adherenceRes.map(a => ({ medicineId: a.medicineId, adherencePercent: a.adherencePercent })));
    } catch (err) {
      const message = err instanceof Error ? err.message : t('med.error.fetchFailed');
      setError(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const onRefresh = useCallback(() => { fetchData(true); }, [fetchData]);

  const getAdherenceForMedicine = (medicineId: string): number => {
    const found = adherence.find(a => a.medicineId === medicineId);
    return found?.adherencePercent ?? 0;
  };

  // Real-time end date preview
  const previewEndDate = useMemo(() => {
    const { totalTablets, tabletsPerDose, dosesPerDay } = newMed;
    if (totalTablets > 0 && tabletsPerDose > 0 && dosesPerDay > 0) {
      try {
        return calculateEndDate(totalTablets, tabletsPerDose, dosesPerDay);
      } catch {
        return null;
      }
    }
    return null;
  }, [newMed.totalTablets, newMed.tabletsPerDose, newMed.dosesPerDay]);

  const previewDays = useMemo(() => {
    const { totalTablets, tabletsPerDose, dosesPerDay } = newMed;
    if (totalTablets > 0 && tabletsPerDose > 0 && dosesPerDay > 0) {
      return Math.floor(totalTablets / (tabletsPerDose * dosesPerDay));
    }
    return null;
  }, [newMed.totalTablets, newMed.tabletsPerDose, newMed.dosesPerDay]);

  const openAddModal = () => {
    setRefillSourceId(null);
    setNewMed({ ...DEFAULT_MED });
    setShowAdd(true);
  };

  const openRefillModal = (med: Medicine) => {
    setRefillSourceId(med._id);
    setNewMed({
      name: med.name,
      dosage: med.dosage,
      frequency: med.frequency,
      timeSlots: med.timeSlots?.length ? [...med.timeSlots] : ['09:00'],
      instructions: med.instructions || '',
      totalTablets: 30,
      tabletsPerDose: med.tabletsPerDose ?? 1,
      dosesPerDay: FREQ_DOSES_MAP[med.frequency] ?? 1,
    });
    setShowAdd(true);
  };

  const handleAddMedicine = async () => {
    if (!newMed.name.trim()) {
      Alert.alert(t('med.alert.requiredTitle'), t('med.alert.enterMedicineName'));
      return;
    }
    if (!newMed.dosage.trim()) {
      Alert.alert(t('med.alert.requiredTitle'), t('med.alert.enterDosage'));
      return;
    }
    if (newMed.totalTablets < 1) {
      Alert.alert(t('med.alert.requiredTitle'), 'Total Tablets must be at least 1');
      return;
    }
    if (newMed.tabletsPerDose < 1) {
      Alert.alert(t('med.alert.requiredTitle'), 'Tablets per Dose must be at least 1');
      return;
    }
    if (newMed.dosesPerDay < 0.01) {
      Alert.alert(t('med.alert.requiredTitle'), 'Doses per Day must be greater than 0');
      return;
    }

    try {
      const newMedicine = await medicineAPI.addMedicine({
        name: newMed.name.trim(),
        dosage: newMed.dosage.trim(),
        frequency: newMed.frequency,
        timeSlots: newMed.timeSlots,
        instructions: newMed.instructions.trim() || undefined,
        totalTablets: newMed.totalTablets,
        tabletsPerDose: newMed.tabletsPerDose,
        endDate: previewEndDate ? previewEndDate.toISOString() : undefined,
      });

      // Refill flow: deactivate the original medicine after new one is saved
      if (refillSourceId) {
        try {
          await medicineAPI.deactivateMedicine(refillSourceId);
        } catch (deactivateErr) {
          console.warn('Failed to deactivate original medicine after refill:', deactivateErr);
        }
      }

      setShowAdd(false);
      setNewMed({ ...DEFAULT_MED });
      setRefillSourceId(null);
      await fetchData();
      Alert.alert(t('med.alert.successTitle'), refillSourceId ? 'Medicine refilled successfully' : t('med.alert.added'));
    } catch (err) {
      Alert.alert(t('med.alert.errorTitle'), err instanceof Error ? err.message : t('med.error.addFailed'));
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
      Alert.alert(t('med.alert.errorTitle'), t('med.error.markDoseFailed'));
    }
  };

  const handleDeleteMedicine = async (medicineId: string) => {
    Alert.alert(
      t('med.alert.deleteTitle') || 'Delete Medicine',
      t('med.alert.deleteConfirm') || 'Remove this medicine and all its scheduled doses?',
      [
        { text: t('common.cancel') || 'Cancel', style: 'cancel' },
        {
          text: t('common.delete') || 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await medicineAPI.deleteMedicine(medicineId);
              setMedicines(prev => prev.filter(m => m._id !== medicineId));
              setDueDoses(prev => prev.filter(d => d.medicineId !== medicineId));
            } catch (err) {
              Alert.alert(t('med.alert.errorTitle'), err instanceof Error ? err.message : 'Failed to delete medicine');
            }
          },
        },
      ]
    );
  };

  const handleFrequencySelect = (freq: string) => {
    setNewMed(prev => ({
      ...prev,
      frequency: freq,
      dosesPerDay: FREQ_DOSES_MAP[freq] ?? 1,
    }));
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

  const getDaysRemainingBadge = (endDate: string): { text: string; type: 'success' | 'warning' | 'danger' | 'default' } => {
    const days = getDaysRemaining(endDate);
    if (days > 7) return { text: `${days} days left`, type: 'default' };
    if (days > 1) return { text: `${days} days left`, type: 'warning' };
    if (days === 1) return { text: '1 day left', type: 'warning' };
    if (days === 0) return { text: 'Refill today', type: 'warning' };
    return { text: `Expired ${Math.abs(days)} days ago`, type: 'danger' };
  };

  const getEndDateColor = (endDate: string) => {
    const days = getDaysRemaining(endDate);
    if (days < 0) return colors.danger;
    if (days <= 7) return colors.warning;
    return colors.textFaint;
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
      title={t('med.title')}
      subtitle={t('med.subtitle')}
      role="patient"
      headerRight={<Button label={t('common.add')} onPress={openAddModal} size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />}
    >
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {loading ? (
          <Text style={{ color: colors.textMuted, textAlign: 'center', paddingVertical: 40 }}>{t('common.loading')}</Text>
        ) : error ? (
          <View style={{ padding: 20, alignItems: 'center' }}>
            <Text style={{ color: colors.danger, marginBottom: 12 }}>{error}</Text>
            <Button label={t('common.retry')} onPress={() => fetchData()} variant="outline" />
          </View>
        ) : (
          <>
            {/* Stats */}
            <View style={md.statsGrid}>
              <View style={md.statHalf}><StatCard icon="medical-outline" value={String(stats.active)} label={t('med.stats.active')} /></View>
              <View style={md.statHalf}><StatCard icon="checkmark-circle-outline" value={`${stats.taken}`} label={t('med.stats.takenToday')} iconBg={colors.successSoft} valueColor={colors.success} iconColor={colors.success} /></View>
              <View style={md.statHalf}><StatCard icon="time-outline" value={`${stats.pending}`} label={t('med.stats.pending')} iconBg={colors.warningSoft} valueColor={colors.warning} iconColor={colors.warning} /></View>
              <View style={md.statHalf}><StatCard icon="stats-chart-outline" value={`${stats.avgAdherence}%`} label={t('med.stats.avgAdherence')} iconBg={colors.primarySoft} valueColor={colors.primary} iconColor={colors.primary} /></View>
            </View>

            {/* Today's Schedule */}
            <Card variant="elevated" glowColor={colors.teal}>
              <CardHeader title={t('med.section.todaySchedule')} icon="time-outline" />
              <View style={{ padding: 16 }}>
                {dueDoses.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <IconBox icon="medical-outline" color={colors.textFaint} bg={colors.tealSoft} size={56} />
                    <Text style={{ color: colors.textMuted, marginTop: 12 }}>{t('med.empty.noScheduled')}</Text>
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
                          <Badge label={t('med.badge.taken')} type="success" icon="checkmark-circle" />
                        ) : (
                          <Button
                            label={dose.status === 'missed' ? t('med.action.retake') : t('med.action.take')}
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
                title={t('med.section.weeklyAdherence')}
                icon="analytics-outline"
                right={<Badge label={`${stats.avgAdherence}% ${t('med.avg')}`} type={stats.avgAdherence >= 80 ? 'success' : 'warning'} />}
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
              <CardHeader title={t('med.section.myMeds')} icon="medical-outline" />
              <View style={{ padding: 16 }}>
                {medicines.length === 0 ? (
                  <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                    <IconBox icon="medical-outline" color={colors.textFaint} bg={colors.tealSoft} size={56} />
                    <Text style={{ color: colors.textMuted, marginTop: 12 }}>{t('med.empty.noMeds')}</Text>
                    <Button label={t('med.action.addMedicine')} onPress={openAddModal} size="sm" style={{ marginTop: 12 }} />
                  </View>
                ) : (
                  medicines.map((med, i) => {
                    const medAdherence = getAdherenceForMedicine(med._id);
                    const barColor = medAdherence >= 80 ? colors.success : colors.warning;
                    const daysLeft = med.endDate ? getDaysRemaining(med.endDate) : null;
                    const showRefill = daysLeft !== null && daysLeft <= 7;
                    const badge = med.endDate ? getDaysRemainingBadge(med.endDate) : null;

                    return (
                      <View key={med._id} style={[md.medCard, i < medicines.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingBottom: 14, marginBottom: 14 }]}>
                        <IconBox icon="medical" color={colors.teal} bg={colors.tealSoft} size={42} />
                        <View style={{ flex: 1, marginLeft: 14 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                            <Text style={{ fontWeight: '700', fontSize: 15, color: colors.textPrimary }}>{med.name}</Text>
                            <Badge label={med.dosage} size="sm" />
                          </View>
                          <Text style={{ fontSize: 12, color: colors.textMuted }}>
                            {med.frequency} · {med.timeSlots?.join(', ') || t('med.noSchedule')}
                          </Text>
                          {med.startDate && (
                            <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 3 }}>
                              {t('med.started')}: {formatDate(med.startDate)}
                              {med.endDate ? (
                                <Text style={{ color: getEndDateColor(med.endDate) }}>
                                  {` – ${formatDate(med.endDate)}`}
                                </Text>
                              ) : null}
                            </Text>
                          )}
                          {badge && (
                            <View style={{ marginTop: 6 }}>
                              <Badge label={badge.text} type={badge.type} size="sm" />
                            </View>
                          )}
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 }}>
                            <ProgressBar value={medAdherence} color={barColor} style={{ flex: 1, height: 8 }} />
                            <Text style={{ fontSize: 13, fontWeight: '700', color: barColor, minWidth: 40 }}>
                              {medAdherence}%
                            </Text>
                          </View>
                          {showRefill && (
                            <Button
                              label="Refill"
                              onPress={() => openRefillModal(med)}
                              size="sm"
                              icon="refresh"
                              variant="primary"
                              style={{ marginTop: 10, alignSelf: 'flex-start' }}
                            />
                          )}
                        </View>
                        <TouchableOpacity
                          onPress={() => handleDeleteMedicine(med._id)}
                          activeOpacity={0.7}
                          style={{ padding: 6, marginLeft: 8 }}
                        >
                          <Ionicons name="close-circle" size={22} color={colors.danger} />
                        </TouchableOpacity>
                      </View>
                    );
                  })
                )}
              </View>
            </Card>
          </>
        )}
      </ScrollView>

      {/* Add / Refill Medicine Modal */}
      <Modal visible={showAdd} transparent animationType="fade">
        <View style={md.modalOverlay}>
          <View style={[md.modalCard, { backgroundColor: colors.bgCard, shadowColor: colors.teal, shadowOpacity: 0.15, borderColor: colors.tealSoft }]}>
            <View style={[md.modalHeader, { borderBottomColor: colors.borderSoft }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <IconBox icon="medical" color={colors.teal} bg={colors.tealSoft} size={36} />
                <Text style={[md.modalTitle, { color: colors.textPrimary }]}>
                  {refillSourceId ? 'Refill Medicine' : t('med.modal.addNew')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => { setShowAdd(false); setRefillSourceId(null); }} activeOpacity={0.7} style={md.closeBtn}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 520 }} showsVerticalScrollIndicator={false}>
              <View style={{ padding: 20 }}>
                <Text style={[md.label, { color: colors.textMuted }]}>{t('med.field.name')} *</Text>
                <TextInput
                  style={[md.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={t('med.placeholder.name')}
                  value={newMed.name}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, name: text }))}
                  placeholderTextColor={colors.textFaint}
                />

                <Text style={[md.label, { color: colors.textMuted }]}>{t('med.field.dosage')} *</Text>
                <TextInput
                  style={[md.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={t('med.placeholder.dosage')}
                  value={newMed.dosage}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, dosage: text }))}
                  placeholderTextColor={colors.textFaint}
                />

                <Text style={[md.label, { color: colors.textMuted }]}>{t('med.field.frequency')}</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                  {['daily', 'twice daily', 'thrice daily', 'weekly', 'as needed'].map(freq => (
                    <TouchableOpacity
                      key={freq}
                      onPress={() => handleFrequencySelect(freq)}
                      activeOpacity={0.7}
                      style={[md.freqChip, { borderColor: newMed.frequency === freq ? colors.teal : colors.border, backgroundColor: newMed.frequency === freq ? colors.tealSoft : colors.bgPage }]}
                    >
                      <Text style={[md.freqChipText, { color: newMed.frequency === freq ? colors.teal : colors.textMuted }]}>{freq}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Pack quantity steppers */}
                <Stepper
                  label="Total Tablets *"
                  value={newMed.totalTablets}
                  onChange={(v) => setNewMed(prev => ({ ...prev, totalTablets: v }))}
                  min={1}
                />
                <Stepper
                  label="Tablets per Dose *"
                  value={newMed.tabletsPerDose}
                  onChange={(v) => setNewMed(prev => ({ ...prev, tabletsPerDose: v }))}
                  min={1}
                />
                <Stepper
                  label="Doses per Day *"
                  value={newMed.dosesPerDay}
                  onChange={(v) => setNewMed(prev => ({ ...prev, dosesPerDay: v }))}
                  min={1}
                />

                {/* End date preview */}
                {previewEndDate && previewDays !== null && (
                  <View style={[md.previewRow, { backgroundColor: colors.tealSoft, borderColor: colors.teal }]}>
                    <Ionicons name="calendar-outline" size={16} color={colors.teal} />
                    <Text style={{ color: colors.teal, fontSize: 13, fontWeight: '600', marginLeft: 8 }}>
                      Runs out {previewEndDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} · {previewDays === 1 ? '1 day' : `${previewDays} days`}
                    </Text>
                  </View>
                )}

                <Text style={[md.label, { color: colors.textMuted }]}>{t('med.field.timeSlots')}</Text>
                <View style={{ flexDirection: 'row', gap: 10, marginBottom: 10 }}>
                  <TextInput
                    style={[md.input, { flex: 1, backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder={t('med.placeholder.time')}
                    value={newTimeSlot}
                    onChangeText={setNewTimeSlot}
                    placeholderTextColor={colors.textFaint}
                  />
                  <Button label={t('common.add')} onPress={addTimeSlot} size="sm" />
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

                <Text style={[md.label, { color: colors.textMuted }]}>{t('med.field.instructions')}</Text>
                <TextInput
                  style={[md.input, { height: 64, textAlignVertical: 'top', backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                  placeholder={t('med.placeholder.instructions')}
                  value={newMed.instructions}
                  onChangeText={(text) => setNewMed(prev => ({ ...prev, instructions: text }))}
                  multiline
                  placeholderTextColor={colors.textFaint}
                />

                <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                  <Button label={t('common.cancel')} onPress={() => { setShowAdd(false); setRefillSourceId(null); }} variant="outline" style={{ flex: 1 }} />
                  <Button label={refillSourceId ? 'Refill' : t('med.action.addMedicine')} onPress={handleAddMedicine} glow={false} style={{ flex: 1.2 }} />
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
    borderRadius: 24, width: '100%', maxWidth: 440, maxHeight: '92%',
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
  previewRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderRadius: 12,
    paddingVertical: 10, paddingHorizontal: 14,
    marginTop: 12, marginBottom: 4,
  },
});
