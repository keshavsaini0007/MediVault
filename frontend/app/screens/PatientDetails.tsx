import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  Modal, TextInput, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { Card, CardHeader, Badge, Button, ProgressBar } from '../../components/UI';

type Tab = 'medications' | 'reports' | 'symptoms' | 'timeline';

const medications = [
  { name: 'Paracetamol 500mg', freq: 'Twice daily', adherence: 95, status: 'taken' },
  { name: 'Vitamin C',         freq: 'Once daily',  adherence: 90, status: 'taken' },
  { name: 'Antibiotic',        freq: 'Thrice daily', adherence: 88, status: 'missed' },
];

const reports = [
  { icon: '🫁', name: 'Chest X-Ray', date: 'Jan 11, 2024', summary: 'No significant abnormalities detected. Lungs appear clear.', status: 'Normal' },
  { icon: '🔬', name: 'Blood Test',  date: 'Jan 10, 2024', summary: 'Platelet count: 85,000 (Low). WBC elevated. Dengue NS1 Positive.', status: 'Abnormal' },
];

const symptoms = [
  { symptom: 'High Fever (104°F)', date: 'Mar 14, 2026', severity: 'High' },
  { symptom: 'Severe Headache',    date: 'Mar 13, 2026', severity: 'Medium' },
  { symptom: 'Body Aches',         date: 'Mar 12, 2026', severity: 'Medium' },
  { symptom: 'Nausea',             date: 'Mar 11, 2026', severity: 'Low' },
];

const timeline = [
  { date: 'Mar 14', event: 'High Fever reported', type: 'symptom', icon: '🌡️' },
  { date: 'Mar 12', event: 'Blood Test uploaded — Dengue NS1 Positive', type: 'report', icon: '🔬' },
  { date: 'Mar 10', event: 'Treatment started: Paracetamol + IV Fluids', type: 'medicine', icon: '💊' },
  { date: 'Mar 8',  event: 'Patient registered on MediVault', type: 'system', icon: '✅' },
];

const patientInfo = [
  { label: 'Blood Type', value: 'O+' },
  { label: 'Allergies', value: 'Penicillin' },
  { label: 'Phone', value: '+91 98765 43210' },
  { label: 'Admitted', value: 'Mar 10, 2026' },
  { label: 'Emergency Contact', value: 'Amit (Brother)' },
];

const recoveryBars = [2, 3, 3, 4, 4, 5, 6];

export default function PatientDetailsScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [activeTab, setActiveTab] = useState<Tab>('medications');
  const [showSMS, setShowSMS] = useState(false);
  const [smsMsg, setSmsMsg] = useState('');
  const [observation, setObservation] = useState('');

  const tabs: { key: Tab; label: string }[] = [
    { key: 'medications', label: 'Medications' },
    { key: 'reports',     label: 'Reports'     },
    { key: 'symptoms',    label: 'Symptoms'    },
    { key: 'timeline',    label: 'Timeline'    },
  ];

  return (
    <DrawerLayout title="Patient Details" subtitle="Rahul Singh — Dengue" showBack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* Patient Header */}
        <Card style={{ marginBottom: 16 }}>
          <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <View style={styles.bigAvatar}>
              <Text style={styles.bigAvatarText}>RS</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <Text style={{ fontSize: 20, fontWeight: '800', color: Colors.gray900 }}>Rahul Singh</Text>
                <Badge label="Critical" type="danger" />
              </View>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <Text style={styles.infoText}>Age: <Text style={styles.infoVal}>32</Text></Text>
                <Text style={styles.infoText}>Condition: <Text style={[styles.infoVal, { color: Colors.danger }]}>Dengue</Text></Text>
                <Text style={styles.infoText}>Blood: <Text style={styles.infoVal}>O+</Text></Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button label="📞 Call" onPress={() => Alert.alert('Calling patient...')} size="sm" variant="success" />
              <Button label="✉️ SMS" onPress={() => setShowSMS(true)} size="sm" />
            </View>
          </View>
        </Card>

        {/* Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ paddingHorizontal: 4 }}>
          {tabs.map(t => (
            <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)} style={[styles.tab, activeTab === t.key && styles.tabActive]}>
              <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* MEDICATIONS TAB */}
        {activeTab === 'medications' && (
          <Card>
            <CardHeader title="📊 Medication Adherence" right={<Badge label="92% Overall" type="success" />} />
            <View style={{ padding: 16 }}>
              <View style={styles.streakRow}>
                <View style={[styles.streakBox, { backgroundColor: Colors.successSoft, borderColor: '#BBF7D0' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.success, textTransform: 'uppercase', letterSpacing: 0.5 }}>Current Streak</Text>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.success, marginTop: 4 }}>7 Days 🔥</Text>
                </View>
                <View style={[styles.streakBox, { backgroundColor: Colors.primarySoft, borderColor: '#BFDBFE' }]}>
                  <Text style={{ fontSize: 11, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>Adherence Rate</Text>
                  <Text style={{ fontSize: 26, fontWeight: '800', color: Colors.primary, marginTop: 4 }}>92%</Text>
                </View>
              </View>
              {medications.map((med, i) => (
                <View key={i} style={[styles.medRow, i < medications.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: med.status === 'taken' ? Colors.success : Colors.danger }} />
                    <Text style={{ fontWeight: '600', fontSize: 14, color: Colors.gray800 }}>{med.name}</Text>
                    <Text style={{ fontSize: 11, color: Colors.gray400 }}>{med.freq}</Text>
                    <Badge label={med.status === 'taken' ? '✓ Taken' : '✗ Missed'} type={med.status === 'taken' ? 'success' : 'danger'} />
                    <Text style={{ fontSize: 13, fontWeight: '700', color: Colors.gray700, marginLeft: 'auto' }}>{med.adherence}%</Text>
                  </View>
                  <ProgressBar value={med.adherence} color={med.adherence >= 90 ? Colors.success : Colors.danger} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <Card>
            <CardHeader title="📋 Latest Reports" />
            <View style={{ padding: 16 }}>
              {reports.map((r, i) => (
                <View key={i} style={[{ paddingBottom: 16 }, i === 0 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100, marginBottom: 16 }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <Text style={{ fontSize: 26 }}>{r.icon}</Text>
                      <View>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: Colors.gray800 }}>{r.name}</Text>
                        <Text style={{ fontSize: 11, color: Colors.gray400 }}>Uploaded {r.date}</Text>
                      </View>
                    </View>
                    <Badge label={r.status} type={r.status === 'Normal' ? 'success' : 'danger'} />
                  </View>
                  <View style={styles.aiBox}>
                    <Text style={styles.aiLabel}>🤖 AI Summary</Text>
                    <Text style={styles.aiText}>{r.summary}</Text>
                    <Text style={{ fontSize: 10, color: Colors.gray400, marginTop: 4 }}>⚠️ Not a substitute for professional diagnosis.</Text>
                  </View>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* SYMPTOMS TAB */}
        {activeTab === 'symptoms' && (
          <Card>
            <CardHeader title="🩺 Reported Symptoms" />
            <View style={{ padding: 16 }}>
              {symptoms.map((s, i) => (
                <View key={i} style={[styles.symptomRow, i < symptoms.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                  <Text style={{ fontSize: 20 }}>🌡️</Text>
                  <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: Colors.gray800 }}>{s.symptom}</Text>
                    <Text style={{ fontSize: 11, color: Colors.gray400 }}>{s.date}</Text>
                  </View>
                  <Badge label={s.severity} type={s.severity === 'High' ? 'danger' : s.severity === 'Medium' ? 'warning' : 'primary'} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* TIMELINE TAB */}
        {activeTab === 'timeline' && (
          <Card>
            <CardHeader title="📅 Health Timeline" />
            <View style={{ padding: 16 }}>
              {timeline.map((t, i) => (
                <View key={i} style={styles.timelineRow}>
                  {i < timeline.length - 1 && <View style={styles.timelineSpine} />}
                  <View style={styles.timelineIcon}><Text style={{ fontSize: 16 }}>{t.icon}</Text></View>
                  <View style={{ flex: 1, paddingTop: 4 }}>
                    <Text style={{ fontWeight: '600', fontSize: 13, color: Colors.gray800 }}>{t.event}</Text>
                    <Text style={{ fontSize: 11, color: Colors.gray400, marginTop: 2 }}>{t.date}, 2026</Text>
                  </View>
                  <Badge label={t.type} />
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Sidebar Cards */}
        {/* Recovery Progress */}
        <Card style={{ marginTop: 16 }}>
          <CardHeader title="📈 Recovery Progress" />
          <View style={{ padding: 16 }}>
            <View style={styles.recoveryBars}>
              {recoveryBars.map((v, i) => (
                <View key={i} style={[styles.recoveryBar, { height: v * 8, backgroundColor: i === 6 ? Colors.success : Colors.successSoft }]} />
              ))}
            </View>
            <View style={{ flexDirection: 'row', marginTop: 4 }}>
              {['D1','D2','D3','D4','D5','D6','D7'].map(d => (
                <Text key={d} style={{ flex: 1, fontSize: 9, color: Colors.gray400, textAlign: 'center' }}>{d}</Text>
              ))}
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <Text style={{ fontSize: 12, color: Colors.gray500 }}>Recovery rate</Text>
              <Text style={{ fontSize: 15, fontWeight: '800', color: Colors.success }}>Improving ↑</Text>
            </View>
          </View>
        </Card>

        {/* Patient Info */}
        <Card style={{ marginTop: 16 }}>
          <CardHeader title="ℹ️ Patient Info" />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {patientInfo.map((info, i) => (
              <View key={i} style={[{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 }, i < patientInfo.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                <Text style={{ fontSize: 12, color: Colors.gray500 }}>{info.label}</Text>
                <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.gray700 }}>{info.value}</Text>
              </View>
            ))}
          </View>
        </Card>

        {/* Add Observation */}
        <Card style={{ marginTop: 16 }}>
          <CardHeader title="✏️ Add Observation" />
          <View style={{ padding: 16 }}>
            <Text style={styles.fieldLabel}>Diagnosis Note</Text>
            <TextInput
              style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
              placeholder="Enter your observation..."
              value={observation}
              onChangeText={setObservation}
              multiline
              placeholderTextColor={Colors.gray400}
            />
            <Button label="Save Observation" onPress={() => { setObservation(''); Alert.alert('Saved', 'Observation recorded.'); }} style={{ width: '100%', marginTop: 12 }} />
          </View>
        </Card>

      </ScrollView>

      {/* SMS Modal */}
      <Modal visible={showSMS} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>📱 Send SMS to Rahul Singh</Text>
              <TouchableOpacity onPress={() => setShowSMS(false)}>
                <Text style={{ fontSize: 18, color: Colors.gray500 }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <Text style={styles.fieldLabel}>Phone Number</Text>
              <View style={styles.readonlyInput}><Text style={{ color: Colors.gray500, fontSize: 14 }}>+91 98765 43210</Text></View>
              <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Message</Text>
              <TextInput
                style={[styles.textInput, { height: 90, textAlignVertical: 'top' }]}
                placeholder="Type your message here..."
                value={smsMsg}
                onChangeText={setSmsMsg}
                multiline
                placeholderTextColor={Colors.gray400}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button label="Cancel" onPress={() => setShowSMS(false)} variant="outline" style={{ flex: 1 }} />
                <Button label="🚀 Send via Twilio" onPress={() => { Alert.alert('SMS sent via Twilio!'); setShowSMS(false); setSmsMsg(''); }} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  bigAvatar: { width: 68, height: 68, borderRadius: 34, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: Colors.primary },
  bigAvatarText: { fontSize: 26, fontWeight: '800', color: Colors.primary },
  infoText: { fontSize: 13, color: Colors.gray500 },
  infoVal: { fontWeight: '700', color: Colors.gray700 },
  tabRow: { marginBottom: 16, maxHeight: 50 },
  tab: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 2, borderBottomColor: 'transparent', marginRight: 4 },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.gray400 },
  tabTextActive: { color: Colors.primary },
  streakRow: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  streakBox: { flex: 1, padding: 14, borderRadius: 12, borderWidth: 1 },
  medRow: { paddingVertical: 12 },
  aiBox: { backgroundColor: Colors.gray50, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  aiLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  aiText: { fontSize: 12, color: Colors.gray600, lineHeight: 18 },
  symptomRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  timelineRow: { flexDirection: 'row', gap: 14, paddingBottom: 20, position: 'relative' },
  timelineSpine: { position: 'absolute', left: 17, top: 36, width: 2, height: '100%', backgroundColor: Colors.gray200 },
  timelineIcon: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.primarySoft, alignItems: 'center', justifyContent: 'center', flexShrink: 0, zIndex: 1 },
  recoveryBars: { flexDirection: 'row', alignItems: 'flex-end', height: 60, gap: 6 },
  recoveryBar: { flex: 1, borderRadius: 3 },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  textInput: { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: 14, color: Colors.gray900 },
  readonlyInput: { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14, marginBottom: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { backgroundColor: Colors.white, borderRadius: 16, width: '100%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  modalTitle: { fontSize: 15, fontWeight: '700', color: Colors.gray800 },
});
