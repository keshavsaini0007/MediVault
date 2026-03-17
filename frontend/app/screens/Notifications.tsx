// NotificationsScreen.tsx
import React, { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { Card, Badge, Button } from '../../components/UI';

const PATIENT_NOTIFS = [
  { id: 1, icon: '💊', title: 'Time to take Paracetamol 500mg', body: 'Your 8:00 AM dose is due now. Tap to mark as taken.', time: 'Just now', read: false, tag: 'Medicine' },
  { id: 2, icon: '🤖', title: 'AI Report Summary Ready', body: 'Your Blood Test uploaded yesterday has been analysed.', time: '10 min ago', read: false, tag: 'AI' },
  { id: 3, icon: '💬', title: 'Message from Dr. Meera Kapoor', body: 'Doctor says: Take rest and keep drinking fluids.', time: '1 hr ago', read: false, tag: 'Message' },
  { id: 4, icon: '🔥', title: '7-Day Streak Achieved! 🎉', body: 'Amazing! You have taken all your medicines for 7 days in a row.', time: '3 hrs ago', read: true, tag: 'Streak' },
  { id: 5, icon: '📋', title: 'New Medical Record Added', body: 'Dr. Meera Kapoor has added an OPD visit record to your health timeline.', time: 'Yesterday', read: true, tag: 'Record' },
];

const TAG_TYPE: Record<string, 'danger' | 'warning' | 'primary' | 'success' | 'teal' | 'default'> = {
  Medicine: 'success', AI: 'teal', Message: 'primary', Streak: 'success',
  Record: 'primary', Critical: 'danger', System: 'default',
};

export default function NotificationsScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [notifs, setNotifs] = useState(PATIENT_NOTIFS);
  const [filter, setFilter] = useState('All');

  const unread = notifs.filter(n => !n.read).length;
  const markAll = () => setNotifs(p => p.map(n => ({ ...n, read: true })));
  const markOne = (id: number) => setNotifs(p => p.map(n => n.id === id ? { ...n, read: true } : n));
  const remove = (id: number) => setNotifs(p => p.filter(n => n.id !== id));

  const filters = ['All', 'Unread', 'Medicine', 'AI', 'Message'];
  const displayed = notifs.filter(n => {
    if (filter === 'All') return true;
    if (filter === 'Unread') return !n.read;
    return n.tag === filter;
  });

  return (
    <DrawerLayout title="Notifications" subtitle="Stay updated" showBack>
        {unread > 0 && <Button label="Mark all read" onPress={markAll} size="sm" variant="outline" style={{ borderColor: 'rgba(255,255,255,0.4)' }} />}
      

      {/* Filters */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 10 }}>
        {filters.map(f => (
          <TouchableOpacity key={f} onPress={() => setFilter(f)} style={[styles.filterBtn, filter === f && styles.filterBtnActive]}>
            <Text style={[styles.filterText, filter === f && { color: 'white' }]}>{f}</Text>
            {f === 'Unread' && unread > 0 && (
              <View style={styles.badge}><Text style={{ fontSize: 9, color: 'white', fontWeight: '800' }}>{unread}</Text></View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }} showsVerticalScrollIndicator={false}>
        {displayed.length === 0 && (
          <View style={{ alignItems: 'center', padding: 48 }}>
            <Text style={{ fontSize: 40, marginBottom: 10 }}>🎉</Text>
            <Text style={{ fontWeight: '600', fontSize: 15, color: Colors.gray800 }}>All caught up!</Text>
            <Text style={{ fontSize: 13, color: Colors.gray400, marginTop: 4 }}>No notifications here.</Text>
          </View>
        )}
        {displayed.map(n => (
          <View key={n.id} style={[styles.notifCard, n.read ? styles.notifRead : styles.notifUnread]}>
            <View style={[styles.unreadDot, { backgroundColor: n.read ? Colors.border : Colors.primary }]} />
            <View style={[styles.notifIcon, { backgroundColor: n.read ? Colors.gray100 : Colors.white }]}>
              <Text style={{ fontSize: 20 }}>{n.icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
                <Text style={{ fontWeight: '700', fontSize: 13, color: Colors.gray800 }}>{n.title}</Text>
                <Badge label={n.tag} type={TAG_TYPE[n.tag] || 'primary'} />
              </View>
              <Text style={{ fontSize: 12, color: Colors.gray500, lineHeight: 17 }}>{n.body}</Text>
              <Text style={{ fontSize: 11, color: Colors.gray400, marginTop: 4 }}>🕐 {n.time}</Text>
            </View>
            <View style={{ gap: 6 }}>
              {!n.read && (
                <TouchableOpacity onPress={() => markOne(n.id)} style={styles.actionBtn}>
                  <Text style={{ color: Colors.success, fontSize: 13 }}>✓</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => remove(n.id)} style={styles.actionBtn}>
                <Text style={{ color: Colors.gray400, fontSize: 13 }}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}
      </ScrollView>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  filterRow: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 56 },
  filterBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, marginRight: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  filterBtnActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterText: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
  badge: { backgroundColor: Colors.danger, paddingHorizontal: 5, paddingVertical: 1, borderRadius: 10 },
  notifCard: { borderRadius: 14, padding: 14, marginBottom: 8, flexDirection: 'row', gap: 12, alignItems: 'flex-start', borderWidth: 1 },
  notifRead: { backgroundColor: Colors.white, borderColor: Colors.border },
  notifUnread: { backgroundColor: Colors.primarySoft, borderColor: Colors.primaryDark + '44' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4, flexShrink: 0 },
  notifIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: Colors.border },
  actionBtn: { width: 28, height: 28, borderRadius: 8, borderWidth: 1, borderColor: Colors.border, backgroundColor: Colors.white, alignItems: 'center', justifyContent: 'center' },
});
