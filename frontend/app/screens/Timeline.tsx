import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Card, Badge, Button, IconBox } from '../../components/UI';
import { patientAPI, symptomAPI, MedRecord, Report, SymptomLog } from '../../services/api';

interface TimelineEvent {
  id: string;
  date: string;
  day: string;
  type: string;
  iconName: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
  severity?: string;
}

interface TimelineGroup {
  day: string;
  date: string;
  events: TimelineEvent[];
}

const SEV_COLOR: Record<string, string> = {
  critical: 'danger',
  warning: 'warning',
  success: 'success',
  info: 'primary',
};

const TYPES = ['All', 'symptom', 'report', 'record'];

function getTypeMeta(type: string, colors: any) {
  const map: Record<string, { label: string; colorKey: string; bgKey: string }> = {
    symptom: { label: 'Symptom', colorKey: 'danger', bgKey: 'dangerSoft' },
    dose: { label: 'Medication', colorKey: 'success', bgKey: 'successSoft' },
    report: { label: 'Report', colorKey: 'primary', bgKey: 'primarySoft' },
    record: { label: 'Visit', colorKey: 'teal', bgKey: 'tealSoft' },
    medicine: { label: 'Medicine', colorKey: 'warning', bgKey: 'warningSoft' },
    system: { label: 'System', colorKey: 'gray500', bgKey: 'gray100' },
  };
  const meta = map[type] || map.system;
  return {
    color: (colors as any)[meta.colorKey] || colors.primary,
    label: meta.label,
    bg: (colors as any)[meta.bgKey] || colors.primarySoft,
  };
}

export default function TimelineScreen() {
  const router = useRouter();
  const { role, colors } = useTheme();
  const { t } = useLanguage();
  const [typeFilter, setTypeFilter] = useState('All');
  const [timelineData, setTimelineData] = useState<TimelineGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadTimeline = async () => {
    try {
      const [records, reports, symptoms] = await Promise.all([
        patientAPI.getRecords(),
        patientAPI.getReports(),
        symptomAPI.getHistory(),
      ]);

      const events: TimelineEvent[] = [];

      records.forEach((r: MedRecord) => {
        events.push({
          id: r._id,
          date: new Date(r.date).toLocaleDateString(),
          day: new Date(r.date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          type: 'record',
          iconName: 'document-text-outline',
          title: r.diagnosis,
          detail: r.notes || 'Medical record created',
        });
      });

      reports.forEach((r: Report) => {
        events.push({
          id: r._id,
          date: new Date(r.createdAt).toLocaleDateString(),
          day: new Date(r.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          type: 'report',
          iconName: 'folder-outline',
          title: r.originalName,
          detail: r.aiSummary || `Report uploaded: ${r.reportType}`,
        });
      });

      symptoms.forEach((s: SymptomLog) => {
        events.push({
          id: s._id,
          date: new Date(s.createdAt).toLocaleDateString(),
          day: new Date(s.createdAt).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }),
          type: 'symptom',
          iconName: 'thermometer-outline',
          title: s.symptoms.substring(0, 50),
          detail: `Urgency: ${s.urgency} - ${s.advice}`,
          severity: s.urgency,
        });
      });

      events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      const grouped: Record<string, TimelineGroup> = {};
      events.forEach(e => {
        const key = e.date;
        if (!grouped[key]) {
          grouped[key] = { day: e.day, date: e.date, events: [] };
        }
        grouped[key].events.push(e);
      });

      setTimelineData(Object.values(grouped));
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('timeline.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTimeline();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTimeline();
    setRefreshing(false);
  }, []);

  const filtered = timelineData
    .map(g => ({ ...g, events: g.events.filter(e => typeFilter === 'All' || e.type === typeFilter) }))
    .filter(g => g.events.length > 0);

  const getSevColor = (severity: string) => {
    const key = SEV_COLOR[severity] || 'primary';
    return (colors as any)[key] || colors.primary;
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
      title={t('timeline.title')} 
      subtitle={t('timeline.subtitle')} 
      role="patient"
      showBack
      onBack={handleBack}
    >

      {/* Filter pills */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[st.filterRow, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        {TYPES.map(t => {
          const meta = getTypeMeta(t, colors);
          const active = typeFilter === t;
          return (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              activeOpacity={0.7}
              style={[
                st.filterBtn,
                { backgroundColor: active ? meta.bg : colors.bgCard, borderColor: active ? meta.color : colors.border },
              ]}
            >
              <Text style={[st.filterText, { color: active ? meta.color : colors.textMuted }]}>
                {t === 'All' ? t('timeline.allEvents') : meta.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}>

        {filtered.length === 0 && (
          <Card glowColor={colors.primary}>
            <View style={{ alignItems: 'center', padding: 40 }}>
              <IconBox icon="folder-open-outline" color={colors.textFaint} bg={colors.primarySoft} size={72} />
              <Text style={{ fontWeight: '700', fontSize: 16, color: colors.textMuted, marginTop: 16 }}>{t('timeline.empty.noEvents')}</Text>
              <Text style={{ fontSize: 13, color: colors.textFaint, marginTop: 6 }}>{t('timeline.empty.eventsAppear')}</Text>
            </View>
          </Card>
        )}

        {filtered.map((group, gi) => {
          const isFirst = gi === 0;
          return (
            <View key={gi} style={{ marginBottom: 28 }}>
              {/* Date Header */}
              <View style={st.dateHeader}>
                <View style={[st.datePill, { backgroundColor: isFirst ? colors.primary : colors.primarySoft, borderColor: isFirst ? colors.primary : colors.border }]}>
                  <Text style={[st.datePillText, { color: isFirst ? 'white' : colors.primary }]}>{group.day}</Text>
                </View>
                <View style={[st.dateLine, { backgroundColor: colors.borderSoft }]} />
                <Text style={[st.dateText, { color: colors.textFaint }]}>{group.date}</Text>
              </View>

              {/* Events */}
              <View style={{ paddingLeft: 4 }}>

                {group.events.map((event, ei: number) => {
                  const meta = getTypeMeta(event.type, colors);
                  const sevColor = event.severity ? getSevColor(event.severity) : meta.color;
                  const isLast = ei === group.events.length - 1;
                  return (
                    <View key={event.id} style={{ flexDirection: 'row', gap: 14 }}>
                      {/* Spine + Icon */}
                      <View style={{ alignItems: 'center', width: 44 }}>
                        <IconBox icon={event.iconName} color={meta.color} bg={meta.bg} size={44} />
                        {!isLast && (
                          <View style={[st.spine, { backgroundColor: colors.borderSoft }]} />
                        )}
                      </View>

                      {/* Card */}
                      <View style={[st.eventCard, { backgroundColor: colors.bgCard, borderColor: colors.border, borderLeftColor: sevColor }]}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
                          <Text style={[st.eventTitle, { color: colors.textPrimary }]}>{event.title}</Text>
                          <View style={[st.typeBadge, { backgroundColor: meta.bg }]}>
                            <Text style={{ fontSize: 10, fontWeight: '700', color: meta.color }}>{meta.label}</Text>
                          </View>
                        </View>
                        <Text style={[st.eventDetail, { color: colors.textMuted }]}>{event.detail}</Text>
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          );
        })}

      </ScrollView>
    </BottomNavLayout>
  );
}

const st = StyleSheet.create({
  filterRow: { maxHeight: 56, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterBtn: { paddingVertical: 9, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1.5, marginRight: 10 },
  filterText: { fontSize: 13, fontWeight: '600' },
  dateHeader: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 },
  datePill: { paddingVertical: 7, paddingHorizontal: 18, borderRadius: 22, borderWidth: 1.5 },
  datePillText: { fontSize: 13, fontWeight: '700' },
  dateLine: { flex: 1, height: 1.5 },
  dateText: { fontSize: 12 },
  eventIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', borderWidth: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4, elevation: 2 },
  spine: { width: 2, flex: 1, minHeight: 20, marginTop: 8 },
  eventCard: { flex: 1, borderWidth: 1, borderLeftWidth: 4, borderRadius: 16, padding: 16, marginBottom: 14, shadowColor: '#000', shadowOpacity: 0.06, shadowOffset: { width: 0, height: 2 }, shadowRadius: 8, elevation: 3 },
  eventTitle: { fontWeight: '700', fontSize: 15 },
  eventDetail: { fontSize: 13, lineHeight: 21 },
  typeBadge: { borderRadius: 14, paddingVertical: 5, paddingHorizontal: 12 },
});
