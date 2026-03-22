import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Card, CardHeader, Badge, Button, ProgressBar, IconBox } from '../../components/UI';
import { symptomAPI, SymptomLog } from '../../services/api';

const doctors = [
  { name: 'Dr. Meera Kapoor', spec: 'General Physician', rating: 4.8, available: true },
  { name: 'Dr. Arun Sharma', spec: 'Infectious Disease', rating: 4.9, available: false },
  { name: 'Dr. Priya Singh', spec: 'Internal Medicine', rating: 4.7, available: true },
];

const CHIPS = ['Fever', 'Headache', 'Cough', 'Nausea', 'Body Ache', 'Fatigue', 'Chest Pain', 'Dizziness', 'Sore Throat'];

export default function SymptomsScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const { t } = useLanguage();
  const [symptoms, setSymptoms] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<SymptomLog[]>([]);
  const [selectedChips, setSelectedChips] = useState<string[]>([]);

  const loadHistory = async () => {
    try {
      const historyData = await symptomAPI.getHistory();
      setHistory(historyData);
    } catch (error) {
      console.error('Failed to load history:', error);
    }
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  }, []);

  const toggleChip = (s: string) =>
    setSelectedChips(prev => prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]);

  const analyze = async () => {
    if (!symptoms.trim() && selectedChips.length === 0) return;
    setLoading(true);
    try {
      const combinedSymptoms = selectedChips.length > 0 
        ? `${symptoms} ${selectedChips.join(', ')}`.trim()
        : symptoms;
      const result = await symptomAPI.checkSymptoms(combinedSymptoms);
      setHistory(prev => [result, ...prev]);
      Alert.alert(t('symptoms.alert.analysisComplete'), `${t('symptoms.urgency')}: ${result.urgency}\n${t('symptoms.recommended')}: ${result.specialistType}`);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('symptoms.error.analyzeFailed'));
    } finally {
      setLoading(false);
    }
  };

  const getUrgencyIcon = (urgency: string): keyof typeof Ionicons.glyphMap => {
    if (urgency === 'high') return 'alert-circle';
    if (urgency === 'medium') return 'warning';
    return 'checkmark-circle';
  };

  const getUrgencyBg = (urgency: string) => {
    if (urgency === 'high') return colors.dangerSoft;
    if (urgency === 'medium') return colors.warningSoft;
    return colors.successSoft;
  };

  const getUrgencyColor = (urgency: string) => {
    if (urgency === 'high') return colors.danger;
    if (urgency === 'medium') return colors.warning;
    return colors.success;
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/screens/PatientDashboard');
    }
  };

  return (
    <BottomNavLayout 
      title={t('symptoms.title')} 
      subtitle={t('symptoms.subtitle')} 
      role="patient"
      showBack
      onBack={handleBack}
    >

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {/* Input */}
        <Card glowColor={colors.teal}>
          <CardHeader title={t('symptoms.section.describe')} icon="chatbox-ellipses-outline" />
          <View style={{ padding: 16 }}>
            <Text style={[sy.label, { color: colors.textMuted }]}>{t('symptoms.whatExperiencing')}</Text>
            <TextInput
              style={[sy.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
              placeholder={t('symptoms.placeholder')}
              value={symptoms}
              onChangeText={setSymptoms}
              multiline
              placeholderTextColor={colors.textFaint}
            />

            <Text style={[sy.label, { color: colors.textMuted, marginTop: 16 }]}>{t('symptoms.quickSelect')}</Text>
            <View style={sy.chipsRow}>
              {CHIPS.map(s => {
                const active = selectedChips.includes(s);
                return (
                  <TouchableOpacity key={s} onPress={() => toggleChip(s)} activeOpacity={0.7}
                    style={[
                      sy.chip,
                      { borderColor: active ? colors.teal : colors.border, backgroundColor: active ? colors.tealSoft : colors.bgPage },
                    ]}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                      {active && <Ionicons name="checkmark" size={13} color={colors.teal} />}
                      <Text style={[sy.chipText, { color: active ? colors.teal : colors.textMuted }]}>{s}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Button
              label={loading ? t('symptoms.analyzing') : t('symptoms.analyzeButton')}
              onPress={analyze}
              disabled={loading}
              size="lg"
              style={{ marginTop: 20, width: '100%' }}
            />

            {loading && (
              <View style={{ alignItems: 'center', marginTop: 12 }}>
                <ActivityIndicator color={colors.teal} />
                <Text style={{ fontSize: 12, color: colors.textFaint, marginTop: 8 }}>{t('symptoms.processing')}</Text>
              </View>
            )}
          </View>
        </Card>

        {/* Latest Result */}
        {history.length > 0 && (
          <>
            <View style={[sy.disclaimer, { backgroundColor: colors.warningSoft, borderColor: colors.warning }]}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <IconBox icon="warning" color={colors.warning} bg={colors.warningSoft} size={28} />
                <Text style={[sy.disclaimerText, { color: colors.warning }]}>{t('symptoms.disclaimer')}</Text>
              </View>
            </View>
            <Card glowColor={getUrgencyColor(history[0].urgency)}>
              <View style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <IconBox 
                      icon={getUrgencyIcon(history[0].urgency)} 
                      color={getUrgencyColor(history[0].urgency)} 
                      bg={getUrgencyBg(history[0].urgency)} 
                      size={48} 
                    />
                    <View>
                      <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textPrimary }}>
                        {history[0].aiConditions?.[0] || t('symptoms.alert.analysisComplete')}
                      </Text>
                      <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>
                        {t('symptoms.recommended')}: {history[0].specialistType}
                      </Text>
                    </View>
                  </View>
                  <Badge
                    label={history[0].urgency.toUpperCase()}
                    type={history[0].urgency === 'high' ? 'danger' : history[0].urgency === 'medium' ? 'warning' : 'success'}
                  />
                </View>
                <View style={{ backgroundColor: colors.bgPage, padding: 14, borderRadius: 12, marginBottom: 10 }}>
                  <Text style={{ fontSize: 10, fontWeight: '700', color: colors.teal, marginBottom: 6 }}>{t('symptoms.yourSymptoms')}</Text>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 21 }}>{history[0].symptoms}</Text>
                </View>
                <View style={{ backgroundColor: colors.tealSoft, padding: 14, borderRadius: 12 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <Ionicons name="bulb" size={16} color={colors.teal} />
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.teal }}>{t('symptoms.aiAdvice')}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.textSecondary, lineHeight: 21 }}>{history[0].advice}</Text>
                </View>
                {history[0].aiConditions && history[0].aiConditions.length > 1 && (
                  <View style={{ marginTop: 14 }}>
                    <Text style={{ fontSize: 10, fontWeight: '700', color: colors.textFaint, marginBottom: 8 }}>{t('symptoms.possibleConditions')}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {history[0].aiConditions.slice(1).map((condition, idx) => (
                        <View key={idx} style={{ backgroundColor: colors.tealSoft, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 14 }}>
                          <Text style={{ fontSize: 12, color: colors.teal }}>{condition}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                )}
              </View>
            </Card>
          </>
        )}

        {/* Matched Doctors */}
        <Card glowColor={colors.primary}>
          <CardHeader title={t('symptoms.section.matchedDoctors')} icon="people-outline" />
          <View style={{ padding: 16 }}>
            {doctors.map((doc, i) => (
              <View key={i} style={[sy.docRow, i < doctors.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft, paddingBottom: 14, marginBottom: 14 }]}>
                <IconBox icon="person" color={colors.primary} bg={colors.primarySoft} size={46} />
                <View style={{ flex: 1, marginLeft: 4 }}>
                  <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{doc.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 2 }}>{doc.spec}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                    <Ionicons name="star" size={12} color="#F59E0B" />
                    <Text style={{ fontSize: 12, color: '#F59E0B' }}>{doc.rating}</Text>
                    <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: doc.available ? colors.success : colors.gray300 }} />
                    <Text style={{ fontSize: 12, color: doc.available ? colors.success : colors.textFaint }}>{doc.available ? t('symptoms.available') : t('symptoms.busy')}</Text>
                  </View>
                </View>
                <Button label={doc.available ? t('symptoms.book') : t('symptoms.full')} onPress={() => {}} disabled={!doc.available} size="sm" variant={doc.available ? 'primary' : 'outline'} />
              </View>
            ))}
          </View>
        </Card>

        {/* Recent Checks */}
        <Card glowColor={colors.teal}>
          <CardHeader title={t('symptoms.section.recentChecks')} icon="time-outline" />
          <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
            {history.length === 0 ? (
              <View style={{ alignItems: 'center', paddingVertical: 20 }}>
                <IconBox icon="document-text-outline" color={colors.textFaint} bg={colors.tealSoft} size={52} />
                <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 12 }}>{t('symptoms.empty.noHistory')}</Text>
              </View>
            ) : (
              history.slice(0, 5).map((c, i) => (
                <View key={c._id || i} style={[{ paddingVertical: 12 }, i < Math.min(history.length, 5) - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
                  <Text style={{ fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{c.symptoms}</Text>
                  <Text style={{ fontSize: 12, color: colors.textMuted, marginTop: 3 }}>
                    {new Date(c.createdAt).toLocaleDateString()} - {c.aiConditions?.[0] || t('symptoms.analyzed')}
                  </Text>
                </View>
              ))
            )}
          </View>
        </Card>

      </ScrollView>
    </BottomNavLayout>
  );
}

const sy = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1.5, borderRadius: 14, paddingVertical: 13, paddingHorizontal: 16, fontSize: 14, minHeight: 100 },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 22, borderWidth: 1.5 },
  chipActive: {},
  chipText: { fontSize: 12, fontWeight: '600' },
  disclaimer: { borderRadius: 14, padding: 14, borderWidth: 1, marginBottom: 14 },
  disclaimerText: { fontSize: 12, flex: 1, lineHeight: 18 },
  docRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  docAvatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  urgencyIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
});
