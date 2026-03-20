import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import BottomNavLayout from '../../components/BottomNavLayout';
import Svg, { Rect } from 'react-native-svg';
import { Card, CardHeader, Badge, Button, IconBox } from '../../components/UI';
import { qrAPI } from '../../services/api';

function QRCodeSVG({ primary }: { primary: string }) {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180">
      <Rect x={10} y={10} width={50} height={50} fill="none" stroke={primary} strokeWidth={6} rx={4} />
      <Rect x={20} y={20} width={30} height={30} fill={primary} rx={2} />
      <Rect x={120} y={10} width={50} height={50} fill="none" stroke={primary} strokeWidth={6} rx={4} />
      <Rect x={130} y={20} width={30} height={30} fill={primary} rx={2} />
      <Rect x={10} y={120} width={50} height={50} fill="none" stroke={primary} strokeWidth={6} rx={4} />
      <Rect x={20} y={130} width={30} height={30} fill={primary} rx={2} />
      {[70, 80, 90, 100, 110].flatMap(x =>
        [70, 80, 90, 100, 110].map(y =>
          (x + y) % 18 < 9
            ? <Rect key={`${x}-${y}`} x={x} y={y} width={8} height={8} fill={primary} rx={1} />
            : null
        )
      )}
    </Svg>
  );
}

export default function QRProfileScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [qrToken, setQrToken] = useState<string>('');
  const [patientName, setPatientName] = useState<string>('');
  const [bloodType, setBloodType] = useState<string>('');
  const [allergies, setAllergies] = useState<string[]>([]);
  const [emergencyContact, setEmergencyContact] = useState<{ name?: string; phone?: string } | undefined>();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadProfile = async () => {
    try {
      const data = await qrAPI.getMyProfile();
      setQrToken(data.qrToken);
      setPatientName(data.payload.name);
      setBloodType(data.payload.bloodType || 'Unknown');
      setAllergies(data.payload.allergies || []);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load QR profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadProfile();
    setRefreshing(false);
  }, []);

  const emergency: Array<{ label: string; value: string; icon: keyof typeof Ionicons.glyphMap; highlight: boolean }> = [
    { label: 'Blood Type', value: bloodType || 'Unknown', icon: 'water-outline', highlight: false },
    { label: 'Allergies', value: allergies.length > 0 ? allergies.join(', ') : 'None', icon: 'warning-outline', highlight: allergies.length > 0 },
    { label: 'Condition', value: 'N/A', icon: 'business-outline', highlight: false },
    { label: 'Emergency Contact', value: emergencyContact ? `${emergencyContact.name} (${emergencyContact.phone || 'N/A'})` : 'Not set', icon: 'call-outline', highlight: false },
  ];

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/screens/PatientDashboard');
    }
  };

  return (
    <BottomNavLayout 
      title="Emergency QR Profile" 
      subtitle="Your emergency health card" 
      role="patient"
      showBack
      onBack={handleBack}
    >

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {/* Warning Banner */}
        <View style={[qr.warningBanner, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
          <IconBox icon="warning-outline" color={colors.warning} bg={colors.warning} size={36} />
          <Text style={{ fontSize: 13, color: colors.warning, flex: 1, lineHeight: 20, marginLeft: 6 }}>
            This QR code can be scanned by emergency responders or doctors <Text style={{ fontWeight: '700' }}>without requiring a login</Text>. Keep it accessible.
          </Text>
        </View>

        {/* QR Card */}
        <Card glowColor={colors.primary}>
          <CardHeader title="Your Emergency QR Code" icon="qr-code-outline" />
          <View style={{ padding: 24, alignItems: 'center' }}>
            {loading ? (
              <ActivityIndicator size="large" color={colors.primary} />
            ) : (
              <>
                <View style={[qr.qrBox, { borderColor: colors.primarySoft, backgroundColor: colors.bgCard, shadowColor: colors.primary, shadowOpacity: 0.15 }]}>
                  <QRCodeSVG primary={colors.primary} />
                </View>
                <Text style={[qr.patientName, { color: colors.textPrimary }]}>{patientName}</Text>
                <Text style={[qr.tokenText, { color: colors.textFaint }]}>ID: {qrToken.substring(0, 16)}...</Text>
                <View style={{ flexDirection: 'row', gap: 14, marginTop: 10 }}>
                  <Button label="Download" onPress={() => Alert.alert('Download', 'QR saved to gallery.')} />
                  <Button label="Copy Link" onPress={() => Alert.alert('Copied', 'Link copied to clipboard.')} variant="outline" />
                </View>
              </>
            )}
          </View>
        </Card>

        {/* Emergency Info */}
        <View style={[qr.dangerCard, { borderColor: colors.danger }]}>
          <View style={[qr.dangerHeader, { backgroundColor: colors.danger }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Ionicons name="alert-circle" size={22} color="white" />
              <Text style={{ color: 'white', fontWeight: '700', fontSize: 15 }}>Emergency Information</Text>
            </View>
            <Text style={{ color: 'rgba(255,255,255,0.8)', fontSize: 12 }}>No login required</Text>
          </View>
          <View style={{ padding: 18 }}>
            {emergency.map((info, i) => (
              <View key={i} style={[qr.infoRow, i < emergency.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
                <IconBox icon={info.icon} color={info.highlight ? colors.danger : colors.textMuted} bg={info.highlight ? colors.dangerSoft : colors.primarySoft} size={38} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={[qr.infoLabel, { color: colors.textFaint }]}>{info.label}</Text>
                  <Text style={[qr.infoValue, { color: info.highlight ? colors.danger : colors.textPrimary }]}>{info.value}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Current Medications */}
        <Card glowColor={colors.teal} style={{ marginTop: 14 }}>
          <CardHeader title="Current Medications" icon="medical-outline" />
          <View style={{ paddingHorizontal: 18, paddingBottom: 18, alignItems: 'center' }}>
            <Text style={[qr.medPlaceholder, { color: colors.textMuted }]}>
              View medications in the Records section
            </Text>
          </View>
        </Card>

        {/* Update Form */}
        <Card glowColor={colors.teal} style={{ marginTop: 14 }}>
          <CardHeader title="Update Emergency Information" icon="create-outline" />
          <View style={{ padding: 18 }}>
            {[
              { label: 'Blood Type', value: 'O+' },
              { label: 'Allergies', value: 'Penicillin' },
              { label: 'Emergency Contact', value: '+91 98765 43210' },
            ].map((f, i) => (
              <View key={i} style={{ marginBottom: 16 }}>
                <Text style={[qr.label, { color: colors.textMuted }]}>{f.label}</Text>
                <View style={[qr.input, { backgroundColor: colors.bgPage, borderColor: colors.border }]}>
                  <Text style={{ color: colors.textPrimary, fontSize: 14 }}>{f.value}</Text>
                </View>
              </View>
            ))}
            <Button label="Save Emergency Profile" onPress={() => Alert.alert('Saved', 'Emergency profile updated.')} style={{ width: '100%', marginTop: 6 }} />
          </View>
        </Card>

      </ScrollView>
    </BottomNavLayout>
  );
}

const qr = StyleSheet.create({
  warningBanner: { borderRadius: 16, padding: 14, borderWidth: 1, flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  qrBox: { width: 210, height: 210, borderRadius: 18, borderWidth: 3, alignItems: 'center', justifyContent: 'center', marginBottom: 16, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  patientName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  tokenText: { fontSize: 11, marginBottom: 16 },
  dangerCard: { backgroundColor: '#FFFFFF', borderRadius: 18, overflow: 'hidden', marginBottom: 0, borderWidth: 2, shadowColor: '#DC2626', shadowOpacity: 0.12, shadowOffset: { width: 0, height: 4 }, shadowRadius: 12, elevation: 4 },
  dangerHeader: { padding: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  infoLabel: { fontSize: 10, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 },
  infoValue: { fontSize: 15, fontWeight: '700', marginTop: 2 },
  medPlaceholder: { fontSize: 13, textAlign: 'center', paddingVertical: 12 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16 },
});
