import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import Colors from '../../constants/colors';
import { Card, CardHeader, Badge, Button } from '../../components/UI';

function QRCodeSVG() {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Rect x={10} y={10} width={50} height={50} fill="none" stroke={Colors.primary} strokeWidth={6} rx={4} />
      <Rect x={20} y={20} width={30} height={30} fill={Colors.primary} rx={2} />
      <Rect x={120} y={10} width={50} height={50} fill="none" stroke={Colors.primary} strokeWidth={6} rx={4} />
      <Rect x={130} y={20} width={30} height={30} fill={Colors.primary} rx={2} />
      <Rect x={10} y={120} width={50} height={50} fill="none" stroke={Colors.primary} strokeWidth={6} rx={4} />
      <Rect x={20} y={130} width={30} height={30} fill={Colors.primary} rx={2} />
      {[70, 80, 90, 100, 110].flatMap(x =>
        [70, 80, 90, 100, 110].map(y =>
          (x + y) % 18 < 9
            ? <Rect key={`${x}-${y}`} x={x} y={y} width={8} height={8} fill={Colors.primary} rx={1} />
            : null
        )
      )}
    </Svg>
  );
}

const meds = [
  { name: 'Paracetamol 500mg', freq: 'Twice daily', doctor: 'Dr. Kapoor' },
  { name: 'Vitamin C 1000mg', freq: 'Once daily', doctor: 'Dr. Kapoor' },
  { name: 'Antibiotic 250mg', freq: 'Thrice daily', doctor: 'Dr. Kapoor' },
];

const emergency = [
  { label: 'Blood Type', value: 'O+', icon: '🩸', highlight: false },
  { label: 'Allergies', value: 'Penicillin', icon: '⚠️', highlight: true },
  { label: 'Condition', value: 'Dengue', icon: '🏥', highlight: true },
  { label: 'Emergency Contact', value: 'Amit Singh (+91 98765)', icon: '📞', highlight: false },
];

export default function QRProfileScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();

  return (
    <DrawerLayout title="Emergency QR Profile" subtitle="Your emergency health card" showBack>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

        {/* Warning Banner */}
        <View style={styles.warningBanner}>
          <Text style={{ fontSize: 18, marginRight: 8 }}>⚠️</Text>
          <Text style={{ fontSize: 13, color: Colors.warning, flex: 1, lineHeight: 18 }}>
            This QR code can be scanned by emergency responders or doctors <Text style={{ fontWeight: '700' }}>without requiring a login</Text>. Keep it accessible.
          </Text>
        </View>

        {/* QR Card */}
        <Card>
          <CardHeader title="🔲 Your Emergency QR Code" />
          <View style={{ padding: 20, alignItems: 'center' }}>
            <View style={styles.qrBox}>
              <QRCodeSVG />
            </View>
            <Text style={{ fontSize: 14, fontWeight: '700', color: Colors.gray800, marginBottom: 2 }}>Rahul Singh</Text>
            <Text style={{ fontSize: 11, color: Colors.gray400, marginBottom: 16 }}>ID: MV-2024-RS-001</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button label="⬇️ Download" onPress={() => Alert.alert('Download', 'QR saved to gallery.')} />
              <Button label="🔗 Copy Link" onPress={() => Alert.alert('Copied', 'Link copied to clipboard.')} variant="outline" />
            </View>
          </View>
        </Card>

        {/* Emergency Info */}
        <View style={[styles.card, { borderWidth: 2, borderColor: Colors.danger }]}>
          <View style={[styles.dangerHeader]}>
            <Text style={{ color: 'white', fontWeight: '700', fontSize: 14 }}>🚨 Emergency Information</Text>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 11 }}>No login required</Text>
          </View>
          <View style={{ padding: 16 }}>
            {emergency.map((info, i) => (
              <View key={i} style={[styles.infoRow, i < emergency.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                <Text style={{ fontSize: 20, width: 28, textAlign: 'center' }}>{info.icon}</Text>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={{ fontSize: 10, color: Colors.gray400, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 }}>{info.label}</Text>
                  <Text style={{ fontSize: 15, fontWeight: '700', color: info.highlight ? Colors.danger : Colors.gray800 }}>{info.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Current Medications */}
        <Card style={{ marginTop: 16 }}>
          <CardHeader title="💊 Current Medications" />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {meds.map((m, i) => (
              <View key={i} style={[styles.medRow, i < meds.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '600', fontSize: 13, color: Colors.gray800 }}>{m.name}</Text>
                  <Text style={{ fontSize: 11, color: Colors.gray400 }}>{m.freq} · {m.doctor}</Text>
                </View>
                <Badge label="Active" />
              </View>
            ))}
          </View>
        </Card>

        {/* Update Form */}
        <Card style={{ marginTop: 16 }}>
          <CardHeader title="✏️ Update Emergency Information" />
          <View style={{ padding: 16 }}>
            {[
              { label: 'Blood Type', value: 'O+' },
              { label: 'Allergies', value: 'Penicillin' },
              { label: 'Emergency Contact', value: '+91 98765 43210' },
            ].map((f, i) => (
              <View key={i} style={{ marginBottom: 14 }}>
                <Text style={styles.label}>{f.label}</Text>
                <View style={styles.input}>
                  <Text style={{ color: Colors.gray800, fontSize: 14 }}>{f.value}</Text>
                </View>
              </View>
            ))}
            <Button label="Save Emergency Profile" onPress={() => Alert.alert('Saved', 'Emergency profile updated.')} style={{ width: '100%', marginTop: 4 }} />
          </View>
        </Card>

      </ScrollView>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  warningBanner: { backgroundColor: Colors.warningSoft, borderRadius: 10, padding: 12, borderWidth: 1, borderColor: Colors.warning, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qrBox: { width: 200, height: 200, borderRadius: 14, borderWidth: 3, borderColor: Colors.primary, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.white, marginBottom: 14 },
  card: { backgroundColor: Colors.white, borderRadius: 16, overflow: 'hidden', marginBottom: 0, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  dangerHeader: { backgroundColor: Colors.danger, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  medRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  input: { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 12, paddingHorizontal: 14 },
});
