import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { Card, CardHeader, Badge, Button } from '../../components/UI';

const reports = [
  { id: 1, icon: '🫁', name: 'Chest X-Ray',  date: 'April 12, 2024', type: 'X-Ray',   status: 'Reviewed', summary: 'No significant abnormalities. Lungs appear clear with normal cardiothoracic ratio.' },
  { id: 2, icon: '🔬', name: 'Blood Test',   date: 'April 5, 2024',  type: 'Lab',     status: 'Abnormal', summary: 'Platelet count low (85,000). Dengue NS1 Antigen: Positive. Immediate attention required.' },
  { id: 3, icon: '🔊', name: 'Ultrasound',   date: 'March 20, 2024', type: 'Imaging', status: 'Normal',   summary: 'Abdominal ultrasound normal. No hepatomegaly or splenomegaly detected.' },
];

const statusBadge: Record<string, 'success' | 'danger'> = {
  Normal: 'success', Reviewed: 'success', Abnormal: 'danger',
};

export default function ReportsScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [selectedType, setSelectedType] = useState('X-Ray');

  const types = ['X-Ray', 'Blood Test', 'MRI', 'CT Scan', 'Ultrasound', 'Prescription', 'Other'];

  const handleUpload = () => {
    setUploading(true);
    setUploaded(false);
    setTimeout(() => { setUploading(false); setUploaded(true); }, 2500);
  };

  return (
    <DrawerLayout title="Reports & Tests" subtitle="Upload and manage your reports" showBack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* Upload Card */}
        <Card>
          <CardHeader title="📤 Upload Medical Report" />
          <View style={{ padding: 16 }}>
            <Text style={styles.label}>Report Type</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {types.map(t => (
                <TouchableOpacity key={t} onPress={() => setSelectedType(t)} style={[styles.typeChip, selectedType === t && styles.typeChipActive]}>
                  <Text style={[styles.typeChipText, selectedType === t && { color: Colors.primary }]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Drop zone */}
            <TouchableOpacity style={styles.dropZone} activeOpacity={0.7}>
              <Text style={{ fontSize: 32, marginBottom: 8 }}>📁</Text>
              <Text style={styles.dropText}>Tap to upload file</Text>
              <Text style={styles.dropSub}>PDF, JPG, PNG up to 10MB</Text>
            </TouchableOpacity>

            {/* Quick upload buttons */}
            <View style={styles.quickRow}>
              {[
                { icon: '🫁', label: 'X-Ray',      bg: Colors.primarySoft },
                { icon: '🔊', label: 'Ultrasound', bg: Colors.tealSoft },
                { icon: '🔬', label: 'Blood Report',bg: Colors.dangerSoft },
              ].map(b => (
                <TouchableOpacity key={b.label} style={[styles.quickBtn, { backgroundColor: b.bg }]}>
                  <Text style={{ fontSize: 20 }}>{b.icon}</Text>
                  <Text style={styles.quickBtnText}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload button */}
            <Button
              label={uploading ? '⏳ Uploading & Analysing with AI...' : '🚀 Upload Report'}
              onPress={handleUpload}
              disabled={uploading}
              size="lg"
              style={{ marginTop: 12, width: '100%' }}
            />

            {uploading && (
              <View style={{ alignItems: 'center', marginTop: 12 }}>
                <ActivityIndicator color={Colors.primary} />
                <Text style={{ fontSize: 11, color: Colors.gray400, marginTop: 6 }}>🤖 AI is analysing your report...</Text>
              </View>
            )}

            {uploaded && !uploading && (
              <View style={styles.successBox}>
                <Text style={styles.successTitle}>✅ Upload Successful!</Text>
                <Text style={styles.successBody}>AI Summary: No significant abnormalities detected. Values appear within normal range.</Text>
                <Text style={{ fontSize: 10, color: Colors.gray500, marginTop: 6 }}>⚠️ Not a substitute for professional medical advice.</Text>
              </View>
            )}
          </View>
        </Card>

        {/* My Reports */}
        <Card>
          <CardHeader title="📁 My Reports" right={<Badge label={`${reports.length} reports`} />} />
          <View>
            {reports.map((r, i) => (
              <View key={r.id} style={[styles.reportItem, i < reports.length - 1 && styles.reportBorder]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <View style={styles.reportIconBox}>
                      <Text style={{ fontSize: 22 }}>{r.icon}</Text>
                    </View>
                    <View>
                      <Text style={{ fontWeight: '700', fontSize: 13, color: Colors.gray800 }}>{r.name}</Text>
                      <Text style={{ fontSize: 11, color: Colors.gray400 }}>{r.date} · {r.type}</Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Badge label={r.status} type={statusBadge[r.status] || 'primary'} />
                    <Button label="View →" onPress={() => {}} size="sm" />
                  </View>
                </View>
                {/* AI Summary */}
                <View style={styles.aiBox}>
                  <Text style={styles.aiLabel}>🤖 AI SUMMARY</Text>
                  <Text style={styles.aiText}>{r.summary}</Text>
                </View>
              </View>
            ))}
          </View>
        </Card>

      </ScrollView>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 8 },
  typeChip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white, marginRight: 8 },
  typeChipActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  typeChipText: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
  dropZone: { borderWidth: 2, borderColor: Colors.border, borderStyle: 'dashed', borderRadius: 12, padding: 24, alignItems: 'center', backgroundColor: Colors.gray50, marginBottom: 14 },
  dropText: { fontSize: 14, fontWeight: '600', color: Colors.gray700 },
  dropSub: { fontSize: 11, color: Colors.gray400, marginTop: 4 },
  quickRow: { flexDirection: 'row', gap: 10, marginBottom: 4 },
  quickBtn: { flex: 1, padding: 10, borderRadius: 10, alignItems: 'center', gap: 4 },
  quickBtnText: { fontSize: 11, fontWeight: '600', color: Colors.gray700 },
  successBox: { marginTop: 12, padding: 14, backgroundColor: Colors.successSoft, borderRadius: 10, borderWidth: 1, borderColor: '#BBF7D0' },
  successTitle: { fontSize: 13, fontWeight: '700', color: Colors.success, marginBottom: 4 },
  successBody: { fontSize: 12, color: Colors.success, fontWeight: '500' },
  reportItem: { padding: 16 },
  reportBorder: { borderBottomWidth: 1, borderBottomColor: Colors.gray100 },
  reportIconBox: { width: 44, height: 44, backgroundColor: Colors.gray100, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  aiBox: { backgroundColor: Colors.gray50, borderRadius: 8, padding: 10, borderLeftWidth: 3, borderLeftColor: Colors.primary },
  aiLabel: { fontSize: 10, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  aiText: { fontSize: 12, color: Colors.gray600, lineHeight: 18 },
});
