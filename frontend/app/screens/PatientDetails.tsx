import React, { useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert,
} from 'react-native';
import { ScrollView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import { Card, CardHeader, Badge, Button, ProgressBar } from '../../components/UI';

type Tab = 'medications' | 'reports' | 'symptoms' | 'timeline';

interface Patient {
  name: string;
  condition: string;
  [key: string]: any;
}

const MEDICATIONS: any[] = [];
const REPORTS: any[] = [];

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{ id?: string }>();

  const [patient, setPatient] = useState<Patient | null>(null);
  const [tab, setTab] = useState<Tab>('medications');
  const [showSMS, setShowSMS] = useState(false);
  const [smsMsg, setSmsMsg] = useState('');
  const [obs, setObs] = useState('');

  const initials = patient?.name
    ? patient.name.split(' ').map((n: string) => n[0]).join('')
    : '';

  const tabs: { key: Tab; label: string }[] = [
    { key: 'medications', label: 'Medications' },
    { key: 'reports',     label: 'Reports'     },
    { key: 'symptoms',    label: 'Symptoms'    },
    { key: 'timeline',    label: 'Timeline'    },
  ];

  return (
    <DrawerLayout
      title="Patient Details"
      subtitle={patient ? `${patient.name} — ${patient.condition}` : 'No patient data'}
      role="doctor"
      userName="Dr. Sharma"
      userInitial="DS"
      showBack
    >
      {/* ── ScrollView wraps ALL content ── */}
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
        style={{ backgroundColor: colors.bgPage }}
      >

        {/* Patient Header */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ padding: 16 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 }}>
              <View style={[s.bigAvatar, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
                <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary }}>{initials}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                  <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textPrimary }}>
                    {patient?.name || 'Unknown Patient'}
                  </Text>
                  <Badge label={patient?.condition || 'No Condition'} type="primary" />
                </View>
              </View>
            </View>
          </View>
        </Card>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={s.tabRow}
          contentContainerStyle={{ paddingHorizontal: 4 }}
        >
          {tabs.map(t => (
            <TouchableOpacity
              key={t.key}
              onPress={() => setTab(t.key)}
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
            <CardHeader title="📊 Medication Adherence" right={<Badge label="92% Overall" type="success" />} />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
                <View style={[s.streakBox, { backgroundColor: colors.successSoft, borderColor: colors.success + '40' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.success, textTransform: 'uppercase' }}>Current Streak</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: colors.success, marginTop: 4 }}>{patient?.streak ?? '—'}d 🔥</Text>
                </View>
                <View style={[s.streakBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary + '40' }]}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary, textTransform: 'uppercase' }}>Adherence Rate</Text>
                  <Text style={{ fontSize: 24, fontWeight: '900', color: colors.primary, marginTop: 4 }}>{patient?.adherence ?? '—'}%</Text>
                </View>
              </View>
              {MEDICATIONS.map((med, i) => (
                <View key={i} style={[{ paddingVertical: 12 }, i < MEDICATIONS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: med.status === 'taken' ? colors.success : colors.danger }} />
                      <Text style={{ fontWeight: '600', fontSize: 14, color: colors.textPrimary }}>{med.name}</Text>
                      <Text style={{ fontSize: 11, color: colors.textFaint }}>{med.freq}</Text>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <Badge label={med.status === 'taken' ? '✓ Taken' : '✗ Missed'} type={med.status === 'taken' ? 'success' : 'danger'} />
                      <Text style={{ fontSize: 13, fontWeight: '700', color: colors.textPrimary }}>{med.adherence}%</Text>
                    </View>
                  </View>
                  <ProgressBar value={med.adherence} color={med.adherence >= 90 ? colors.success : colors.danger} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* REPORTS TAB */}
        {tab === 'reports' && (
          <Card>
            <CardHeader title="📋 Latest Reports" />
            <View style={{ padding: 16 }}>
              {REPORTS.map((r, i) => (
                <View key={i} style={[{ paddingBottom: 14 }, i === 0 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft, marginBottom: 14 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 26 }}>{r.icon}</Text>
                      <View>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{r.name}</Text>
                        <Text style={{ fontSize: 11, color: colors.textFaint }}>Uploaded {r.date}</Text>
                      </View>
                    </View>
                    <Badge label={r.status} type={r.status === 'Normal' ? 'success' : 'danger'} />
                  </View>
                  <View style={[s.aiBox, { backgroundColor: colors.bgPage, borderLeftColor: colors.primary }]}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.primary, marginBottom: 4 }}>🤖 AI Summary</Text>
                    <Text style={{ fontSize: 12, color: colors.textMuted, lineHeight: 18 }}>{r.summary}</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* SYMPTOMS TAB */}
        {tab === 'symptoms' && (
          <Card>
            <CardHeader title="🩺 Reported Symptoms" />
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
                  <Text style={{ fontSize: 20 }}>🌡️</Text>
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
            <CardHeader title="📅 Health Timeline" />
            <View style={{ padding: 16 }}>
              {[
                { date: 'Mar 14', event: 'High Fever reported',                                        type: 'symptom',  icon: '🌡️' },
                { date: 'Mar 12', event: `Blood Test — ${patient?.condition ?? 'Unknown'} Positive`,   type: 'report',   icon: '🔬' },
                { date: 'Mar 10', event: 'Treatment started: Paracetamol + IV Fluids',                 type: 'medicine', icon: '💊' },
                { date: 'Mar 8',  event: 'Patient registered on MediVault',                            type: 'system',   icon: '✅' },
              ].map((item, i, arr) => (
                <View key={i} style={{ flexDirection: 'row', gap: 12, paddingBottom: 16, position: 'relative' }}>
                  {i < arr.length - 1 && (
                    <View style={{ position: 'absolute', left: 18, top: 34, width: 2, height: '100%', backgroundColor: colors.border }} />
                  )}
                  <View style={[s.timelineIcon, { backgroundColor: colors.primarySoft }]}>
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
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
          <CardHeader title="📈 Recovery Progress" />
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
              <Text style={{ fontSize: 15, fontWeight: '800', color: colors.success }}>Improving ↑</Text>
            </View>
          </View>
        </Card>

        {/* Patient Info */}
        <Card style={{ marginTop: 0 }}>
          <CardHeader title="ℹ️ Patient Info" />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {[
              { label: 'Blood Type', value: patient?.blood    },
              { label: 'Phone',      value: patient?.phone    },
              { label: 'Doctor',     value: patient?.doctor   },
              { label: 'Last Seen',  value: patient?.lastSeen },
            ].map((info, i) => (
              <View key={i} style={[
                { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
                i < 3 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
              ]}>
                <Text style={{ fontSize: 12, color: colors.textMuted }}>{info.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{info.value ?? '—'}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Add Observation */}
        <Card style={{ marginTop: 0 }}>
          <CardHeader title="✏️ Add Observation" />
          <View style={{ padding: 16 }}>
            <TextInput
              style={[s.obsInput, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder="Enter your observation..."
              placeholderTextColor={colors.textFaint}
              value={obs}
              onChangeText={setObs}
              multiline
            />
            <Button
              label="Save Observation"
              onPress={() => { setObs(''); Alert.alert('Saved', 'Observation recorded.'); }}
              style={{ width: '100%', marginTop: 12 }}
            />
          </View>
        </Card>

      </ScrollView>
      {/* ── END ScrollView ── */}

      {/* SMS Modal — lives inside DrawerLayout but outside ScrollView ✅ */}
      <Modal visible={showSMS} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <View style={[s.modalCard, { backgroundColor: colors.bgCard }]}>
            <View style={[s.modalHeader, { borderBottomColor: colors.border }]}>
              <Text style={[s.modalTitle, { color: colors.textPrimary }]}>
                📱 Send SMS to {patient?.name ?? 'Patient'}
              </Text>
              <TouchableOpacity onPress={() => setShowSMS(false)}>
                <Text style={{ fontSize: 18, color: colors.textFaint }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <View style={[{ padding: 10, borderRadius: 8, marginBottom: 14 }, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontSize: 13, color: colors.primary }}>{patient?.phone ?? 'No phone'}</Text>
              </View>
              <TextInput
                style={[s.obsInput, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Type your message..."
                placeholderTextColor={colors.textFaint}
                value={smsMsg}
                onChangeText={setSmsMsg}
                multiline
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button label="Cancel" onPress={() => setShowSMS(false)} variant="outline" style={{ flex: 1 }} />
                <Button
                  label="🚀 Send"
                  onPress={() => { Alert.alert('Sent!', 'SMS sent via Twilio.'); setShowSMS(false); setSmsMsg(''); }}
                  style={{ flex: 1 }}
                />
              </View>
            </View>
          </View>
        </View>
      </Modal>

    </DrawerLayout>
  );
}

const s = StyleSheet.create({
  bigAvatar:    { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 3 },
  tabRow:       { marginBottom: 14, maxHeight: 52 },
  tab:          { paddingHorizontal: 16, paddingVertical: 13, borderBottomWidth: 2.5, borderBottomColor: 'transparent', marginRight: 4 },
  tabTxt:       { fontSize: 13, fontWeight: '600' },
  streakBox:    { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1 },
  aiBox:        { borderRadius: 8, padding: 10, borderLeftWidth: 3 },
  timelineIcon: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  obsInput:     { borderWidth: 1.5, borderRadius: 10, padding: 12, height: 90, textAlignVertical: 'top', fontSize: 14 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard:    { borderRadius: 16, width: '100%' },
  modalHeader:  { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle:   { fontSize: 15, fontWeight: '700' },
});