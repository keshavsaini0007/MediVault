import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import BottomNavLayout from '../../components/BottomNavLayout';
import { StatCard, Card, CardHeader, Badge, Button, IconBox } from '../../components/UI';
import { patientAPI, doctorAPI, MedRecord } from '../../services/api';

interface RecordItem {
  _id: string; date: string; doctor?: string; hospital?: string;
  diagnosis: string; notes?: string;
  medicines?: string[]; fileUrls?: string[];
  type: 'Admission' | 'OPD' | 'Check-up' | 'Emergency';
}

const RECORDS: RecordItem[] = [];

export default function RecordsScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [records, setRecords] = useState<MedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const [form, setForm] = useState({ date: '', doctor: '', hospital: '', diagnosis: '', notes: '', type: 'OPD' as RecordItem['type'] });

  const loadRecords = async () => {
    try {
      const data = await patientAPI.getRecords();
      setRecords(data);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecords();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadRecords();
    setRefreshing(false);
  }, []);

  const addRecord = async () => {
    if (!form.diagnosis) return;
    try {
      const newRecord = await doctorAPI.createRecord({
        patientId: '',
        diagnosis: form.diagnosis,
        notes: form.notes,
        date: form.date || new Date().toISOString(),
      });
      setRecords(prev => [newRecord, ...prev]);
      setShowAdd(false);
      setForm({ date: '', doctor: '', hospital: '', diagnosis: '', notes: '', type: 'OPD' });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create record');
    }
  };

  const visitTypes: RecordItem['type'][] = ['OPD', 'Admission', 'Check-up', 'Emergency'];

  const getTypeStyle = (type: string) => {
    const styles: Record<string, { bg: string; color: string; badge: 'danger' | 'primary' | 'success' | 'warning'; icon: keyof typeof Ionicons.glyphMap }> = {
      Admission: { bg: colors.dangerSoft, color: colors.danger, badge: 'danger', icon: 'business-outline' },
      OPD: { bg: colors.primarySoft, color: colors.primary, badge: 'primary', icon: 'fitness-outline' },
      'Check-up': { bg: colors.successSoft, color: colors.success, badge: 'success', icon: 'checkmark-circle-outline' },
      Emergency: { bg: colors.dangerSoft, color: colors.danger, badge: 'danger', icon: 'alert-circle-outline' },
    };
    return styles[type] || styles.OPD;
  };

  return (
    <BottomNavLayout
      title="Medical Records"
      subtitle="Complete health history"
      role="patient"
      headerRight={
        <Button label="+ Add " onPress={() => setShowAdd(true)} size="sm" style={{ backgroundColor: 'rgba(255,255,255,0.2)' }} />
      }
    >

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {/* Stats */}
        <View style={rc.statsGrid}>
          <View style={rc.statHalf}>
            {loading ? <StatCard icon="folder-outline" value="-" label="Total Records" /> : <StatCard icon="folder-outline" value={records.length} label="Total Records" />}
          </View>
          <View style={rc.statHalf}><StatCard icon="business-outline" value={0} label="Admissions" iconBg={colors.dangerSoft} valueColor={colors.danger} /></View>
          <View style={rc.statHalf}><StatCard icon="fitness-outline" value={0} label="OPD Visits" iconBg={colors.tealSoft} valueColor={colors.teal} /></View>
          <View style={rc.statHalf}><StatCard icon="checkmark-circle-outline" value={0} label="Check-ups" iconBg={colors.successSoft} valueColor={colors.success} /></View>
        </View>

        {/* Records */}
        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>Loading records...</Text>
          </View>
        ) : records.length === 0 ? (
          <Card variant="elevated" glowColor={colors.primary}>
            <View style={{ alignItems: 'center', padding: 32 }}>
              <IconBox icon="folder-open-outline" color={colors.textFaint} bg={colors.primarySoft} size={64} />
              <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMuted, marginTop: 14 }}>No records found</Text>
              <Text style={{ fontSize: 13, color: colors.textFaint, marginTop: 6, textAlign: 'center' }}>Your medical records will appear here</Text>
            </View>
          </Card>
        ) : (
          records.map(record => {
            const recordType = 'Check-up';
            const ts = getTypeStyle(recordType);
            const open = expanded === record._id;
            return (
              <Card key={record._id} variant="elevated" glowColor={ts.color}>
              {/* Header - tap to expand */}
              <TouchableOpacity onPress={() => setExpanded(open ? null : record._id)} style={{ padding: 16 }} activeOpacity={0.7}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <IconBox icon={ts.icon} color={ts.color} bg={ts.bg} size={44} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <Text style={{ fontWeight: '700', fontSize: 15, color: colors.textPrimary }}>{record.diagnosis}</Text>
                      <Badge label={recordType} type={ts.badge} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 5 }}>
                      <Ionicons name="calendar-outline" size={12} color={colors.textFaint} />
                      <Text style={{ fontSize: 12, color: colors.textFaint }}>{record.date ? new Date(record.date).toLocaleDateString() : 'N/A'}</Text>
                      <View style={{ width: 3, height: 3, borderRadius: 2, backgroundColor: colors.textFaint }} />
                      <Ionicons name="person-outline" size={12} color={colors.textFaint} />
                      <Text style={{ fontSize: 12, color: colors.textFaint }}>{record.doctorId || 'N/A'}</Text>
                    </View>
                  </View>
                  <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textFaint} />
                </View>
              </TouchableOpacity>

              {/* Expanded body */}
              {open && (
                <View style={{ borderTopWidth: 1, borderTopColor: colors.borderSoft, padding: 16, marginTop: 4 }}>
                  {record.notes ? (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={[rc.sectionLabel, { color: colors.textFaint }]}>DOCTOR'S NOTES</Text>
                      <View style={{ backgroundColor: colors.bgPage, borderRadius: 12, padding: 14 }}>
                        <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 21 }}>{record.notes}</Text>
                      </View>
                    </View>
                  ) : null}

                  {record.medicines && record.medicines.length > 0 && (
                    <View style={{ marginBottom: 16 }}>
                      <Text style={[rc.sectionLabel, { color: colors.textFaint }]}>PRESCRIBED MEDICINES</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {record.medicines.map((m, i) => (
                          <Badge key={i} label={m} />
                        ))}
                      </View>
                    </View>
                  )}

                  {record.fileUrls && record.fileUrls.length > 0 && (
                    <View>
                      <Text style={[rc.sectionLabel, { color: colors.textFaint }]}>ATTACHED FILES</Text>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                        {record.fileUrls.map((f, i) => (
                          <TouchableOpacity key={i} style={[rc.fileBtn, { backgroundColor: colors.bgPage, borderColor: colors.border }]} onPress={() => Alert.alert('View', `Opening file`)} activeOpacity={0.7}>
                            <Ionicons name="document-text-outline" size={18} color={ts.color} />
                            <Text style={{ fontSize: 12, fontWeight: '600', color: colors.textSecondary }}>Report {i + 1}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                              <Text style={{ fontSize: 11, color: ts.color }}>View</Text>
                              <Ionicons name="chevron-forward" size={11} color={ts.color} />
                            </View>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Card>
          );
          })
        )}
      </ScrollView>

      {/* Add Record Modal */}
      <Modal visible={showAdd} transparent animationType="slide">
        <View style={rc.modalOverlay}>
          <View style={[rc.modalCard, { backgroundColor: colors.bgCard, shadowColor: colors.primary, shadowOpacity: 0.15, borderColor: colors.primarySoft }]}>
            <View style={[rc.modalHeader, { borderBottomColor: colors.borderSoft }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <IconBox icon="add-circle-outline" color={colors.primary} bg={colors.primarySoft} size={36} />
                <Text style={[rc.modalTitle, { color: colors.textPrimary }]}>Add Medical Record</Text>
              </View>
              <TouchableOpacity onPress={() => setShowAdd(false)} activeOpacity={0.7} style={{ padding: 2 }}>
                <Ionicons name="close-circle" size={26} color={colors.textMuted} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={{ padding: 20 }} showsVerticalScrollIndicator={false}>
              <Text style={[rc.label, { color: colors.textMuted }]}>Visit Type</Text>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                {visitTypes.map(t => {
                  const isActive = form.type === t;
                  const ts = getTypeStyle(t);
                  return (
                    <TouchableOpacity key={t} onPress={() => setForm(p => ({ ...p, type: t }))} activeOpacity={0.7}
                      style={[rc.typeChip, { borderColor: isActive ? ts.color : colors.border, backgroundColor: isActive ? ts.bg : colors.bgPage }]}>
                      <Text style={[{ fontSize: 12, fontWeight: '600', color: isActive ? ts.color : colors.textMuted }]}>{t}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              {[
                { label: 'Doctor Name', key: 'doctor', placeholder: 'Dr. Full Name' },
                { label: 'Hospital / Clinic', key: 'hospital', placeholder: 'Hospital name' },
                { label: 'Diagnosis', key: 'diagnosis', placeholder: 'Primary diagnosis' },
              ].map(f => (
                <View key={f.key} style={{ marginBottom: 14 }}>
                  <Text style={[rc.label, { color: colors.textMuted }]}>{f.label}</Text>
                  <TextInput
                    style={[rc.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                    placeholder={f.placeholder}
                    value={(form as any)[f.key]}
                    onChangeText={v => setForm(p => ({ ...p, [f.key]: v }))}
                    placeholderTextColor={colors.textFaint}
                  />
                </View>
              ))}
              <Text style={[rc.label, { color: colors.textMuted }]}>Doctor's Notes</Text>
              <TextInput
                style={[rc.input, { height: 80, textAlignVertical: 'top', backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Notes, instructions, observations…"
                value={form.notes}
                onChangeText={v => setForm(p => ({ ...p, notes: v }))}
                multiline
                placeholderTextColor={colors.textFaint}
              />
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 20 }}>
                <Button label="Cancel" onPress={() => setShowAdd(false)} variant="outline" style={{ flex: 1 }} />
                <Button label="Save Record" onPress={addRecord} style={{ flex: 1.2 }} />
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </BottomNavLayout>
  );
}

const rc = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  recordCard: { borderRadius: 20, overflow: 'hidden', marginBottom: 14, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.08, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  recordIcon: { width: 42, height: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sectionLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 },
  fileBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1, borderRadius: 12 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.55)', justifyContent: 'flex-end' },
  modalCard: { borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '88%', borderWidth: 1, shadowOffset: { width: 0, height: -6 }, shadowRadius: 24, elevation: 10 },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, fontSize: 14 },
  typeChip: { paddingVertical: 9, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5 },
  typeChipActive: {},
});
