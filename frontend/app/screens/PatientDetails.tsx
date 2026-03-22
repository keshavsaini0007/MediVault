import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Card, CardHeader, Badge, Button, ProgressBar } from '../../components/UI';
import { doctorAPI, Patient, MedRecord, Report, Medicine } from '../../services/api';

type Tab = 'medications' | 'reports' | 'symptoms' | 'timeline';

const MEDICATIONS: any[] = [];
const REPORTS: any[] = [];

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { t } = useLanguage();
  const params = useLocalSearchParams<{ id?: string }>();
  const patientId = params.id;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [records, setRecords] = useState<MedRecord[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tab, setTab] = useState<Tab>('medications');
  const [showSMS, setShowSMS] = useState(false);
  const [smsMsg, setSmsMsg] = useState('');
  const [obs, setObs] = useState('');

  const loadPatientData = async () => {
    if (!patientId) return;
    try {
      const [recordsData, reportsData, medicinesData] = await Promise.all([
        doctorAPI.getPatientRecords(patientId),
        doctorAPI.getPatientReports(patientId),
        doctorAPI.getPatientMedicines(patientId),
      ]);
      setPatient(recordsData.patient);
      setRecords(recordsData.records);
      setReports(reportsData.reports);
      setMedicines(medicinesData);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('patientDetails.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPatientData();
  }, [patientId]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadPatientData();
    setRefreshing(false);
  }, [patientId]);

  const initials = patient?.name
    ? patient.name.split(' ').map((n: string) => n[0]).join('')
    : '';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'medications', label: t('patient.qa.medicines') },
    { key: 'reports',     label: t('patient.qa.reports') },
    { key: 'symptoms',    label: t('patient.qa.symptoms') },
    { key: 'timeline',    label: t('timeline.title') },
  ];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/screens/Patients');
    }
  };

  return (
    <BottomNavLayout
      title={t('patientDetails.title')}
      subtitle={patient ? patient.name : t('common.loading')}
      role="doctor"
      showBack
      onBack={handleBack}
    >

        {/* Patient Header */}
        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>{t('patientDetails.loadingPatient')}</Text>
          </View>
        ) : (
          <Card style={{ marginBottom: 16 }}>
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
                <View style={[s.bigAvatar, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>{initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textPrimary }}>
                      {patient?.name || t('patientDetails.unknownPatient')}
                    </Text>
                    {patient?.bloodType && <Badge label={patient.bloodType} type="danger" />}
                  </View>
                  <Text style={{ fontSize: 12, color: colors.textMuted }}>{patient?.email}</Text>
                </View>
              </View>
            </View>
          </Card>
        )}

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={[s.tabRow, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}
          contentContainerStyle={{ paddingHorizontal: 8 }}
        >
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
              activeOpacity={0.7}
              style={[s.tab, tab === t.key && { borderBottomColor: colors.primary }]}
            >
              <Text style={[s.tabTxt, { color: tab === t.key ? colors.primary : colors.textFaint }]}>
                {t.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* MEDICATIONS TAB */}
        {tab === 'medications' && (
          <Card>
            <CardHeader title={t('patientDetails.medicationAdherence')} right={<Badge label={`${medicines.length} ${t('patientDetails.active')}`} type="success" />} />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={[s.streakBox, { backgroundColor: colors.successSoft, borderColor: colors.success + '40' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success, textTransform: 'uppercase' }}>{t('patientDetails.currentStreak')}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                    <Text style={{ fontSize: 24, fontWeight: '900', color: colors.success }}>—d</Text>
                    <Ionicons name="flame" size={18} color={colors.success} />
                  </View>
                </View>
                <View style={[s.streakBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' }}>{t('patientDetails.adherenceRate')}</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary, marginTop: 4 }}>—%</Text>
                </View>
              </View>
              {medicines.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.textMuted, paddingVertical: 20 }}>{t('patientDetails.empty.noMeds')}</Text>
              ) : (
                medicines.map((med, i) => (
                  <View key={med._id} style={[{ paddingVertical: 12 }, i < medicines.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: med.isActive ? colors.success : colors.danger }} />
                        <Text style={{ fontWeight: '600', fontSize: 14, color: colors.textPrimary }}>{med.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textFaint }}>{med.frequency}</Text>
                      </View>
                      <Badge label={med.isActive ? t('patientDetails.active') : t('patientDetails.inactive')} type={med.isActive ? 'success' : 'danger'} />
                    </View>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{med.dosage} - {med.instructions || t('patientDetails.noInstructions')}</Text>
                  </View>
                ))
              )}
            </View>
          </Card>
        )}

        {/* REPORTS TAB */}
        {tab === 'reports' && (
          <Card>
            <CardHeader title={t('patientDetails.latestReports')} />
            <View style={{ padding: 16 }}>
              {reports.length === 0 ? (
                <Text style={{ textAlign: 'center', color: colors.textMuted, paddingVertical: 20 }}>{t('patientDetails.empty.noReports')}</Text>
              ) : (
                reports.map((r, i) => (
                  <View key={r._id} style={[{ paddingBottom: 14 }, i < reports.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft, marginBottom: 14 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                        <View>
                          <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{r.originalName}</Text>
                          <Text style={{ fontSize: 11, color: colors.textFaint }}>{t('patientDetails.uploadedOn')} {new Date(r.createdAt).toLocaleDateString()}</Text>
                        </View>
                      </View>
                      <Badge label={r.reportType} type="primary" />
                    </View>
                    {r.aiSummary && (
                      <View style={[s.aiBox, { backgroundColor: colors.bgPage, borderLeftColor: colors.primary }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                          <Ionicons name="bulb-outline" size={12} color={colors.primary} />
                          <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary }}>{t('reports.aiSummary')}</Text>
                        </View>
                        <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>{r.aiSummary}</Text>
                      </View>
                    )}
                  </View>
                ))
              )}
            </View>
          </Card>
        )}

        {/* SYMPTOMS TAB */}
        {tab === 'symptoms' && (
          <Card>
            <CardHeader title={t('patientDetails.reportedSymptoms')} />
            <View style={{ padding: 16 }}>
                  {[
                    { symptom: 'High Fever (104°F)', date: 'Mar 14, 2026', severity: 'High'   },
                    { symptom: 'Severe Headache',    date: 'Mar 13, 2026', severity: 'Medium' },
                    { symptom: 'Body Aches',         date: 'Mar 12, 2026', severity: 'Medium' },
                    { symptom: 'Nausea',             date: 'Mar 11, 2026', severity: 'Low'    },
                  ].map((sym, i, arr) => (
                    <View key={i} style={[
                      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
                      i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
                    ]}>
                      <Ionicons name="thermometer-outline" size={20} color={colors.danger} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{sym.symptom}</Text>
                    <Text style={{ fontSize: 11, color: colors.textFaint }}>{sym.date}</Text>
                  </View>
                  <Badge label={sym.severity} type={sym.severity === 'High' ? 'danger' : sym.severity === 'Medium' ? 'warning' : 'primary'} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* TIMELINE TAB */}
        {tab === 'timeline' && (
          <Card>
            <CardHeader title={t('timeline.title')} />
            <View style={{ padding: 16 }}>
              {[
                { date: 'Mar 14', event: 'High Fever reported',                                        type: 'symptom',  icon: 'thermometer-outline' as const },
                { date: 'Mar 12', event: 'Medical Report Uploaded',                                      type: 'report',   icon: 'document-text-outline' as const },
                { date: 'Mar 10', event: 'Treatment started: Medication prescribed',                       type: 'medicine', icon: 'medical-outline' as const },
                { date: 'Mar 8',  event: 'Patient registered on MediVault',                            type: 'system',   icon: 'checkmark-circle-outline' as const },
              ].map((item, i, arr) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, paddingBottom: 16, position: 'relative' }}>
                  {i < arr.length - 1 && (
                    <View style={{ position: 'absolute', left: 18, top: 34, width: 2, height: '100%', backgroundColor: colors.border }} />
                  )}
                  <View style={[s.timelineIcon, { backgroundColor: colors.primarySoft }]}>
                    <Ionicons name={item.icon} size={16} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1, paddingTop: 4 }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{item.event}</Text>
                    <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{item.date}, 2026</Text>
                  </View>
                  <Badge label={item.type} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Recovery Progress */}
        <Card style={{ marginTop: 0 }}>
          <CardHeader title={t('patientDetails.recoveryProgress')} />
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6, marginBottom: 6 }}>
              {[2, 3, 3, 4, 4, 5, 6].map((v, i) => (
                <View key={i} style={[
                  { flex: 1, borderRadius: 3 },
                  { height: v * 8, backgroundColor: i === 6 ? colors.success : colors.successSoft },
                ]} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: colors.textMuted }}>Recovery rate</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text style={{ fontSize: 15, fontWeight: '800', color: colors.success }}>{t('patientDetails.improving')}</Text>
                <Ionicons name="arrow-up" size={14} color={colors.success} />
              </View>
            </View>
          </View>
        </Card>

        {/* Patient Info */}
        <Card style={{ marginTop: 0 }}>
          <CardHeader title={t('patientDetails.patientInfo')} />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {[
              { label: t('qr.bloodType'), value: patient?.bloodType    },
              { label: t('patientDetails.phone'),      value: patient?.phone || patient?.mobile    },
              { label: t('register.field.email'),      value: patient?.email   },
              { label: t('register.field.allergies'),  value: patient?.allergies?.join(', ') || t('qr.none') },
            ].map((info, i, arr) => (
              <View key={info.label} style={[
                { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
                i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
              ]}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{info.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary, textAlign: 'right', maxWidth: '60%' }}>{info.value ?? t('records.na')}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Add Observation */}
        <Card style={{ marginTop: 0 }}>
          <CardHeader title={t('patientDetails.addObservation')} />
          <View style={{ padding: 16 }}>
            <TextInput
              style={[s.obsInput, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('patientDetails.placeholder.observation')}
              placeholderTextColor={colors.textFaint}
              value={obs}
              onChangeText={setObs}
              multiline
            />
            <Button
              label={t('patientDetails.saveObservation')}
              onPress={() => { setObs(''); Alert.alert(t('med.alert.successTitle'), t('patientDetails.observationRecorded')); }}
              style={{ width: '100%', marginTop: 12 }}
            />
          </View>
        </Card>

      {/* SMS Modal — outside BottomNavLayout */}
      <Modal visible={showSMS} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.bgCard }]}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbox" size={18} color={colors.primary} />
                <Text style={[s.modalTitle, { color: colors.textPrimary }]}>
                  {t('patientDetails.sendSmsTo')} {patient?.name ?? t('common.patient')}
                </Text>
              </View>
              <TouchableOpacity onPress={() => setShowSMS(false)}>
                <Ionicons name="close-circle" size={22} color={colors.textFaint} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <View style={[{ padding: 10, borderRadius: 8, marginBottom: 14 }, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontSize: 13, color: colors.primary }}>{patient?.phone ?? t('patientDetails.noPhone')}</Text>
              </View>
              <TextInput
                style={[s.obsInput, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder={t('alerts.typeMessage')}
                placeholderTextColor={colors.textFaint}
                value={smsMsg}
                onChangeText={setSmsMsg}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button label={t('common.cancel')} onPress={() => setShowSMS(false)} variant="outline" style={{ flex: 1 }} />
                <Button
                  label={t('alerts.sendSms')}
                  onPress={() => { Alert.alert(t('patientDetails.sent'), t('patientDetails.smsSent')); setShowSMS(false); setSmsMsg(''); }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </BottomNavLayout>
  );
}

const s = StyleSheet.create({
  bigAvatar:    { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', borderWidth: 3, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 },
  tabRow:       { marginBottom: 14, maxHeight: 52, backgroundColor: 'transparent' },
  tab:          { paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 3, borderBottomColor: 'transparent', marginRight: 0 },
  tabTxt:       { fontSize: 14, fontWeight: '600' },
  streakBox:    { flex: 1, padding: 16, borderRadius: 14, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 6, elevation: 2 },
  aiBox:        { borderRadius: 10, padding: 12, borderLeftWidth: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 4, elevation: 1 },
  timelineIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  obsInput:     { borderWidth: 1.5, borderRadius: 12, padding: 14, height: 100, textAlignVertical: 'top', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:    { borderRadius: 20, width: '100%', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 12, elevation: 8 },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 18, borderBottomWidth: 1 },
  modalTitle:   { fontSize: 16, fontWeight: '700' },
});