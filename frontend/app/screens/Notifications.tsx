import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator, Alert, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import BottomNavLayout from '@/components/BottomNavLayout';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useBadges } from '../../context/BadgeContext';
import { Badge, Button, IconBox } from '../../components/UI';
import { notificationAPI, Notification } from '../../services/api';

const TAG_COLORS: Record<string, 'danger'|'warning'|'primary'|'success'|'teal'|'default'> = {
  Critical:'danger', Adherence:'warning', Report:'primary', SMS:'teal',
  AI:'teal', Medicine:'success', Message:'primary', Streak:'success',
  Record:'primary', System:'default',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { colors, isDark, role } = useTheme();
  const { t } = useLanguage();
  const {
    clearNotifs,
    doctorNotifs, patientNotifs,
    markOneNotif, markAllNotifs, removeNotif,
  } = useBadges();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = React.useState('all');

  const loadNotifications = async () => {
    try {
      const data = await notificationAPI.getNotifications();
      setNotifications(data.notifications);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('notif.error.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    clearNotifs();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNotifications();
    setRefreshing(false);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationAPI.markAsRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
      markOneNotif(role, id);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('notif.error.markOne'));
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      markAllNotifs(role);
    } catch (error: any) {
      Alert.alert(t('common.error'), error.message || t('notif.error.markAll'));
    }
  };

  const isDoctor = role === 'doctor';
  const accent   = isDoctor ? colors.primary : colors.teal;

  const unread   = notifications.filter(n => !n.isRead).length;

  const filters = isDoctor
    ? ['all', 'unread', 'critical', 'report']
    : ['all', 'unread', 'medicine', 'message', 'daily_summary'];

  const getFilterType = (n: Notification) => {
    const type = n.type as string;
    if (type === 'dose_missed' || type === 'dose_missed_caregiver' || type === 'Medicine') return 'medicine';
    if (type === 'dose_daily_summary') return 'daily_summary';
    if (type === 'symptom_urgent' || type === 'Critical') return 'critical';
    if (type === 'Report') return 'report';
    if (type === 'Message') return 'message';
    return 'all';
  };

  const displayed = notifications.filter(n => {
    if (filter === 'all')    return true;
    if (filter === 'unread') return !n.isRead;
    return getFilterType(n) === filter;
  });

  const getNotifIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    if (type === 'dose_missed' || type === 'dose_missed_caregiver') return 'medical-outline';
    if (type === 'dose_daily_summary') return 'calendar-outline';
    if (type === 'symptom_urgent') return 'alert-circle-outline';
    return 'notifications-outline';
  };

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace(role === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard');
    }
  };

  const headerRight = unread > 0 ? (
    <Button 
      label={t('notif.markAll')}
      onPress={handleMarkAllAsRead} 
      size="sm"
      style={{ backgroundColor: 'rgba(255,255,255,0.18)' }} 
    />
  ) : undefined;

  return (
    <BottomNavLayout
      title={t('notif.title')}
      subtitle={unread > 0 ? `${unread} ${t('notif.unread')}` : t('notif.allCaughtUp')}
      role={role}
      headerRight={headerRight}
      showBack
      onBack={handleBack}
    >
      <View style={{ flex: 1, backgroundColor: colors.bgPage }}>

        {/* Role Banner */}
        <View style={[s.banner, {
          backgroundColor: isDoctor
            ? (isDark ? '#1a2d5a' : '#EFF6FF')
            : (isDark ? '#052e2e' : '#F0FDFA'),
          borderColor: accent + '40',
        }]}>
          <Ionicons name={isDoctor ? 'medkit' : 'person'} size={26} color={accent} />
          <View style={{ flex: 1 }}>
            <Text style={[s.bannerTitle, { color: accent }]}>
              {isDoctor ? t('notif.doctorTitle') : t('notif.patientTitle')}
            </Text>
            <Text style={[s.bannerSub, { color: colors.textMuted }]}>
              {isDoctor ? t('notif.doctorSub') : t('notif.patientSub')}
            </Text>
          </View>
          {unread > 0 && (
            <View style={[s.unreadBubble, { backgroundColor: accent }]}>
              <Text style={{ color: 'white', fontSize: 14, fontWeight: '800' }}>{unread}</Text>
            </View>
          )}
        </View>

        {/* Filter Pills */}
        <View style={[s.filterWrap, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 14, paddingVertical: 10, gap: 8 }}>
            {filters.map(f => {
              const active = filter === f;
              return (
                <TouchableOpacity key={f} onPress={() => setFilter(f)} activeOpacity={0.7}
                  style={[s.filterBtn, {
                    backgroundColor: active ? accent : colors.bgPage,
                    borderColor: active ? accent : colors.border,
                  }]}>
                  <Text style={[s.filterTxt, { color: active ? 'white' : colors.textMuted }]}>{t(`notif.filter.${f}`)}</Text>
                  {f === 'unread' && unread > 0 && (
                    <View style={[s.filterCount, { backgroundColor: active ? 'rgba(255,255,255,0.3)' : '#FF4444' }]}>
                      <Text style={{ fontSize: 9, fontWeight: '900', color: 'white' }}>{unread}</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Notification List */}
        <ScrollView contentContainerStyle={{ padding: 14, gap: 10, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}>

          {loading ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <ActivityIndicator size="large" color={accent} />
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 10 }}>{t('notif.loading')}</Text>
            </View>
          ) : displayed.length === 0 ? (
            <View style={{ alignItems: 'center', paddingTop: 60 }}>
              <Ionicons name="checkmark-circle" size={56} color={colors.success} />
              <Text style={{ fontSize: 18, fontWeight: '700', color: colors.textPrimary, marginTop: 12 }}>{t('notif.allCaughtUp')}</Text>
              <Text style={{ fontSize: 13, color: colors.textMuted, marginTop: 4 }}>{t('notif.noneHere')}</Text>
            </View>
          ) : (
            displayed.map(n => {
              const type = n.type as string;
              const typeIcon = getNotifIcon(type);
              const typeTag = type === 'dose_missed' || type === 'dose_missed_caregiver' ? 'Medicine' 
                : type === 'dose_daily_summary' ? 'Adherence'
                : type === 'symptom_urgent' ? 'Critical' : 'System';
              const tagColor = type === 'dose_daily_summary' ? 'warning' : TAG_COLORS[typeTag] || 'default';
              return (
                <View key={n._id} style={[s.card, {
                  backgroundColor: n.isRead
                    ? colors.bgCard
                    : isDoctor ? (isDark ? '#1a2540' : '#EFF6FF') : (isDark ? '#052e2e' : '#F0FDFA'),
                  borderColor:     n.isRead ? colors.border : accent + '40',
                  borderLeftColor: n.isRead ? colors.border : accent,
                  shadowOpacity:   n.isRead ? 0.04 : 0.1,
                }]}>
                  <View style={[s.dot, { backgroundColor: n.isRead ? 'transparent' : accent }]} />

                  <View style={[s.iconBox, {
                    backgroundColor: n.isRead ? colors.bgCardHover : accent + '18',
                    borderColor: n.isRead ? colors.border : accent + '40',
                  }]}>
                    <Ionicons name={typeIcon} size={22} color={n.isRead ? colors.textMuted : accent} />
                  </View>

                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3, flexWrap: 'wrap' }}>
                      <Text style={[s.notifTitle, {
                        color: n.isRead ? colors.textMuted : colors.textPrimary,
                        fontWeight: n.isRead ? '500' : '700',
                      }]} numberOfLines={1}>{n.title}</Text>
                      <Badge label={typeTag} type={tagColor} />
                    </View>
                    <Text style={[s.notifBody, { color: n.isRead ? colors.textFaint : colors.textMuted }]}
                      numberOfLines={2}>{n.message}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 }}>
                      <Ionicons name="time-outline" size={11} color={colors.textFaint} />
                      <Text style={[s.notifTime, { color: colors.textFaint }]}>{new Date(n.createdAt).toLocaleDateString()}</Text>
                    </View>
                  </View>

                  <View style={{ gap: 6, flexShrink: 0 }}>
                    {!n.isRead && (
                      <TouchableOpacity onPress={() => handleMarkAsRead(n._id)}
                        style={[s.actionBtn, { backgroundColor: colors.successSoft, borderColor: colors.success + '40' }]}>
                        <Ionicons name="checkmark" size={16} color={colors.success} />
                      </TouchableOpacity>
                    )}
                    <TouchableOpacity onPress={() => removeNotif(role, n._id)}
                      style={[s.actionBtn, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
                      <Ionicons name="close" size={14} color={colors.textFaint} />
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })
          )}
        </ScrollView>
      </View>
    </BottomNavLayout>
  );
}

const s = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 14, margin: 14, padding: 16, borderRadius: 16, borderWidth: 1, shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  bannerTitle: { fontSize: 15, fontWeight: '800' },
  bannerSub:   { fontSize: 12, marginTop: 3 },
  unreadBubble: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 4, elevation: 2 },
  filterWrap: { borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  filterBtn: { paddingVertical: 8, paddingHorizontal: 18, borderRadius: 20, borderWidth: 1.5, flexDirection: 'row', alignItems: 'center', gap: 6 },
  filterTxt: { fontSize: 13, fontWeight: '600' },
  filterCount: { minWidth: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
  card: { borderRadius: 18, padding: 16, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1, borderLeftWidth: 5, shadowColor: '#000', shadowRadius: 8, elevation: 3, shadowOffset: { width: 0, height: 3 } },
  dot: { width: 10, height: 10, borderRadius: 5, marginTop: 6, flexShrink: 0 },
  iconBox: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, flexShrink: 0 },
  notifTitle: { fontSize: 14, fontWeight: '600' },
  notifBody:  { fontSize: 13, lineHeight: 19, marginBottom: 5 },
  notifTime:  { fontSize: 11 },
  actionBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: 'center', justifyContent: 'center' },
});
