import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, TextInput, Alert, ActivityIndicator, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useBadges } from '../../context/BadgeContext';
import BottomNavLayout from '../../components/BottomNavLayout';
import { StatCard, Card, Badge, Button } from '../../components/UI';
import { doctorAPI, SymptomLog } from '../../services/api';

interface AlertItem extends SymptomLog {
  patientName: string;
  patientPhone: string;
}

export default function AlertsScreen() {
  const router = useRouter();
  const { userName, userInitial, colors } = useTheme();
  const { clearAlerts, doctorNotifs } = useBadges();

  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [responded, setResponded] = useState<string[]>([]);

  const [showSMS, setShowSMS] = useState<AlertItem | null>(null);
  const [smsText, setSmsText] = useState('');

  const getSevStyle = (urgency: string, type: 'bg' | 'border' | 'color') => {
    const styles: Record<string, Record<string, string>> = {
      high: { bg: colors.dangerSoft, border: colors.danger + '40', color: colors.danger },
      medium: { bg: colors.warningSoft, border: colors.warning + '40', color: colors.warning },
      low: { bg: colors.primarySoft, border: colors.primary + '40', color: colors.primary },
    };
    return styles[urgency]?.[type] || styles.low[type];
  };

  const loadAlerts = async () => {
    try {
      const dashboard = await doctorAPI.getDashboard();
      const highUrgency = dashboard.recentSymptoms
        .filter(s => s.urgency === 'high')
        .map(s => ({
          ...s,
          patientName: s.patientId?.name || 'Unknown',
          patientPhone: '',
        }));
      setAlerts(highUrgency);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
    clearAlerts();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadAlerts();
    setRefreshing(false);
  }, []);

  const respondAlert = (id: string) => {
    setResponded(prev => [...prev, id]);
  };

  const dismissAlert = (id: string) => {
    setAlerts(prev => prev.filter(a => a._id !== id));
  };

  const pending = alerts.filter(a => !responded.includes(a._id));
  const resolved = alerts.filter(a => responded.includes(a._id));

  const sendSMS = () => {
    if (!smsText.trim()) return;
    Alert.alert('SMS Sent', `Message sent to ${showSMS?.patientName} via Twilio.`);
    setShowSMS(null);
    setSmsText('');
  };

  return (
    <BottomNavLayout
      title="Alerts"
      subtitle="Action required"
      role="doctor"
    >
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {/* Stats */}
        <View style={al.statsGrid}>
          <View style={al.statHalf}>
            {loading ? <StatCard icon="notifications-outline" value="-" label="Total Alerts" /> : <StatCard icon="notifications-outline" value={alerts.length} label="Total Alerts" />}
          </View>
          <View style={al.statHalf}><StatCard icon="alert-circle-outline" value={pending.length} label="Critical" iconBg={colors.dangerSoft} valueColor={colors.danger} iconColor={colors.danger} /></View>
          <View style={al.statHalf}><StatCard icon="time-outline" value={pending.length} label="Pending" iconBg={colors.warningSoft} valueColor={colors.warning} iconColor={colors.warning} /></View>
          <View style={al.statHalf}><StatCard icon="checkmark-circle-outline" value={resolved.length} label="Responded" iconBg={colors.successSoft} valueColor={colors.success} iconColor={colors.success} /></View>
        </View>

        {loading ? (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>Loading alerts...</Text>
          </View>
        ) : (
          <>
            {/* Pending */}
            {pending.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.danger }} />
                  <Text style={{ fontWeight: '700', fontSize: 14, color: colors.danger }}>Pending Alerts - Action Required</Text>
                </View>
                {pending.map(alert => {
                  const sevBg = getSevStyle(alert.urgency, 'bg');
                  const sevBorder = getSevStyle(alert.urgency, 'border');
                  const sevColor = getSevStyle(alert.urgency, 'color');
                  const badgeType = alert.urgency === 'high' ? 'danger' : alert.urgency === 'medium' ? 'warning' : 'primary';
                  const initials = alert.patientName.split(' ').map((n: string) => n[0]).join('').substring(0, 2);
                  return (
                    <View key={alert._id} style={[al.alertCard, { backgroundColor: sevBg, borderColor: sevBorder, borderLeftColor: sevColor }]}>
                      <View style={al.alertRow}>
                        <View style={[al.alertAvatar, { borderColor: sevColor, backgroundColor: colors.bgCard }]}>
                          <Text style={{ fontSize: 12, fontWeight: '800', color: sevColor }}>{initials}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4, flexWrap: 'wrap' }}>
                            <Text style={{ fontWeight: '800', fontSize: 15, color: colors.textPrimary }}>{alert.patientName}</Text>
                            <Badge label={alert.urgency.toUpperCase()} type={badgeType} />
                            <Text style={{ fontSize: 11, color: colors.textFaint }}>{new Date(alert.createdAt).toLocaleDateString()}</Text>
                          </View>
                          <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 18, marginBottom: 10 }}>{alert.symptoms}</Text>
                          <Text style={{ fontSize: 11, color: colors.textMuted, marginBottom: 10 }}>Recommended: {alert.specialistType}</Text>
                          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                            <Button label="View Patient" onPress={() => router.push({ pathname: '/screens/PatientDetails', params: { id: alert.patientId } } as any)} size="sm" />
                            <Button label="Send SMS" onPress={() => setShowSMS(alert)} size="sm" variant="success" />
                            <Button label="Mark Responded" onPress={() => respondAlert(alert._id)} size="sm" variant="outline" />
                            <Button label="Dismiss" onPress={() => dismissAlert(alert._id)} size="sm" variant="outline" />
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })}
              </>
            )}

            {/* Empty state when all pending cleared */}
            {pending.length === 0 && (
              <View style={al.emptyBox}>
                <Ionicons name="checkmark-circle" size={50} color={colors.success} style={{ marginBottom: 10 }} />
                <Text style={{ fontWeight: '700', fontSize: 16, color: colors.success }}>All Caught Up!</Text>
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>No pending alerts right now.</Text>
              </View>
            )}

            {/* Resolved */}
            {resolved.length > 0 && (
              <>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, marginBottom: 12 }}>
                  <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                  <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textMuted }}>Responded</Text>
                </View>
                <Card>
                  <View style={{ padding: 16 }}>
                    {resolved.map((a, i) => {
                      const badgeType = a.urgency === 'high' ? 'danger' : a.urgency === 'medium' ? 'warning' : 'primary';
                      return (
                        <View key={a._id} style={[
                          { flexDirection: 'row', alignItems: 'center', paddingVertical: 10 },
                          i < resolved.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }
                        ]}>
                          <Text style={{ flex: 1, fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{a.patientName}</Text>
                          <Text style={{ flex: 1, fontSize: 12, color: colors.textMuted }}>{a.symptoms.substring(0, 30)}...</Text>
                          <Badge label={a.urgency} type={badgeType} />
                          <TouchableOpacity onPress={() => dismissAlert(a._id)} style={{ marginLeft: 8 }} activeOpacity={0.7}>
                            <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '600' }}>Dismiss</Text>
                          </TouchableOpacity>
                        </View>
                      );
                    })}
                  </View>
                </Card>
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* SMS Modal */}
      <Modal visible={!!showSMS} transparent animationType="fade">
        <View style={al.modalOverlay}>
          <View style={[al.modalCard, { backgroundColor: colors.bgCard }]}>
            <View style={[al.modalHeader, { borderBottomColor: colors.border }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Ionicons name="chatbox" size={18} color={colors.primary} />
                <Text style={[al.modalTitle, { color: colors.textPrimary }]}>Send SMS via Twilio</Text>
              </View>
              <TouchableOpacity onPress={() => setShowSMS(null)} activeOpacity={0.7}>
                <Ionicons name="close" size={20} color={colors.textFaint} />
              </TouchableOpacity>
            </View>
            <View style={{ padding: 16 }}>
              <View style={[al.recipientBox, { backgroundColor: colors.primarySoft }]}>
                <Text style={{ fontSize: 13, color: colors.primary }}>
                  To: <Text style={{ fontWeight: '700' }}>{showSMS?.patientName}</Text> - {showSMS?.patientPhone || 'N/A'}
                </Text>
              </View>
              <Text style={[al.label, { color: colors.textMuted }]}>Message</Text>
              <TextInput
                style={[al.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
                placeholder="Type your message..."
                value={smsText}
                onChangeText={setSmsText}
                multiline
                placeholderTextColor={colors.textFaint}
              />
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                <Button label="Cancel" onPress={() => setShowSMS(null)} variant="outline" style={{ flex: 1 }} />
                <Button label="Send via Twilio" onPress={sendSMS} style={{ flex: 1 }} />
              </View>
            </View>
          </View>
        </View>
      </Modal>
    </BottomNavLayout>
  );
}

const al = StyleSheet.create({
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  statHalf: { width: '48%' },
  alertCard: { borderRadius: 14, padding: 16, marginBottom: 12, borderWidth: 1, borderLeftWidth: 4 },
  alertRow: { flexDirection: 'row', gap: 12 },
  alertAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center', borderWidth: 2, flexShrink: 0 },
  emptyBox: { alignItems: 'center', paddingVertical: 48 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 24 },
  modalCard: { borderRadius: 16, width: '100%' },
  modalHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, borderBottomWidth: 1 },
  modalTitle: { fontSize: 15, fontWeight: '700' },
  recipientBox: { borderRadius: 8, padding: 10, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 10, paddingHorizontal: 14, fontSize: 14, color: '#111827' },
});
