import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Animated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBadges } from '../context/BadgeContext';
import { allPatients } from '../data/mockData';

interface NavSection { section: string }
interface NavLink { label: string; href: string; icon: keyof typeof Ionicons.glyphMap; badgeKey?: 'notif' | 'msg' | 'alert' | number }
type NavEntry = NavSection | NavLink;

const doctorNav: NavEntry[] = [
  { section: 'Main' },
  { label: 'Dashboard',     href: '/screens/DoctorDashboard',  icon: 'home-outline'                               },
  { label: 'Patients',      href: '/screens/Patients',          icon: 'people-outline', badgeKey: allPatients.length },
  { label: 'Alerts',        href: '/screens/Alerts',            icon: 'alert-circle-outline', badgeKey: 'alert'            },
  { label: 'Messages',      href: '/screens/Messages',          icon: 'chatbubbles-outline', badgeKey: 'msg'              },
  { section: 'Activity' },
  { label: 'Notifications', href: '/screens/Notifications',     icon: 'notifications-outline', badgeKey: 'notif'            },
  { section: 'Account' },
  { label: 'Profile',       href: '/screens/Profile',           icon: 'person-outline'                               },
  { label: 'Logout',        href: '/screens/SplashScreen',      icon: 'log-out-outline'                               },
];

const patientNav: NavEntry[] = [
  { section: 'My Health' },
  { label: 'Dashboard',     href: '/screens/PatientDashboard',  icon: 'home-outline'                    },
  { label: 'Medicines',     href: '/screens/Medicines',         icon: 'medical-outline'                    },
  { label: 'My Records',    href: '/screens/Records',           icon: 'folder-outline'                    },
  { label: 'Reports',       href: '/screens/Reports',           icon: 'document-text-outline'                    },
  { section: 'Tools' },
  { label: 'Symptom Check', href: '/screens/Symptoms',          icon: 'fitness-outline'                    },
  { label: 'Timeline',      href: '/screens/Timeline',          icon: 'time-outline'                    },
  { label: 'QR Profile',    href: '/screens/QRProfile',         icon: 'qr-code-outline'                    },
  { section: 'Account' },
  { label: 'Notifications', href: '/screens/Notifications',     icon: 'notifications-outline', badgeKey: 'notif' },
  { label: 'Profile',       href: '/screens/Profile',           icon: 'person-outline'                    },
  { label: 'Logout',        href: '/screens/SplashScreen',      icon: 'log-out-outline'                    },
];

function isSection(e: NavEntry): e is NavSection { return 'section' in e; }

// ── Fix: extracted so useRef is not called inside .map() ──
function NavItem({ item, active, badgeCount, accent, onPress }: {
  item: NavLink; active: boolean; badgeCount: number; accent: string; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 200 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start()}
        onPress={onPress}
        activeOpacity={1}
        style={[s.navItem, active && { backgroundColor: 'rgba(255,255,255,0.13)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
        <Ionicons name={item.icon} size={18} color={active ? 'white' : 'rgba(255,255,255,0.65)'} style={s.navIcon} />
        <Text style={[s.navLabel, active && s.navLabelActive]}>{item.label}</Text>
        {badgeCount > 0 && (
          <View style={s.badge}>
            <Text style={s.badgeText}>{badgeCount}</Text>
          </View>
        )}
        {active && <View style={[s.activeBar, { backgroundColor: accent }]} />}
      </TouchableOpacity>
    </Animated.View>
  );
}

interface SidebarProps {
  role?: 'doctor' | 'patient';
  userName?: string;
  userInitial?: string;
  onClose?: () => void;
}

export default function Sidebar({ role = 'patient', userName = 'User', userInitial = 'U', onClose }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isDark } = useTheme();
  const { notifCount, messageCount, alertCount } = useBadges();

  const navItems = role === 'doctor' ? doctorNav : patientNav;
  const home     = role === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard';

  const resolveBadge = (key?: 'notif' | 'msg' | 'alert' | number): number => {
    if (key === 'notif')         return notifCount;
    if (key === 'msg')           return messageCount;
    if (key === 'alert')         return alertCount;
    if (typeof key === 'number') return key;
    return 0;
  };

  const bgTop    = role === 'doctor' ? (isDark ? '#0d1b3e' : '#0C1F6B') : (isDark ? '#052e2e' : '#053B3B');
  const bgBottom = role === 'doctor' ? (isDark ? '#1a2d5a' : '#1e3a8a') : (isDark ? '#0a2c2c' : '#0B4F4F');
  const accent   = role === 'doctor' ? '#2E6AE6' : '#0D9488';

  return (
    <View style={[s.sidebar, { backgroundColor: bgTop }]}>
      <SafeAreaView style={{ flex: 1 }}>
        {/* Logo */}
        <TouchableOpacity style={[s.logoArea, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}
          onPress={() => { router.push(home as any); onClose?.(); }} activeOpacity={0.8}>
          <View style={[s.logoIcon, { backgroundColor: accent }]}>
            <Ionicons name="medical" size={20} color="white" />
          </View>
          <View>
            <Text style={s.logoText}>MediVault</Text>
            <Text style={s.logoSub}>HEALTH PLATFORM</Text>
          </View>
        </TouchableOpacity>

        {/* Nav */}
        <ScrollView style={s.nav} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
          {navItems.map((item, i) => {
            if (isSection(item)) return <Text key={i} style={s.sectionLabel}>{item.section}</Text>;
            const badgeCount = resolveBadge((item as NavLink).badgeKey);
            return (
              <NavItem
                key={item.href}
                item={item as NavLink}
                active={pathname === item.href}
                badgeCount={badgeCount}
                accent={accent}
                onPress={() => { router.push((item as NavLink).href as any); onClose?.(); }}
              />
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: bgBottom }]}>
          <View style={s.footerUser}>
            <View style={[s.userAvatar, { backgroundColor: accent }]}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>{(userInitial || 'U').slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>{userName}</Text>
              <Text style={s.userRole}>{role === 'doctor' ? 'Physician' : 'Patient'}</Text>
            </View>
            <View style={[s.roleTag, { backgroundColor: role === 'doctor' ? '#2E6AE620' : '#0D948820' }]}>
              <Text style={[s.roleTagText, { color: role === 'doctor' ? '#60A5FA' : '#34D399' }]}>
                {role === 'doctor' ? 'MD' : 'PT'}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  sidebar: { flex: 1 },
  logoArea: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 20, paddingBottom: 18, borderBottomWidth: 1 },
  logoIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  logoText: { fontSize: 16, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  logoSub: { fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },
  nav: { flex: 1, paddingHorizontal: 10, paddingTop: 14 },
  sectionLabel: { fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)', letterSpacing: 1.5, textTransform: 'uppercase', paddingHorizontal: 10, paddingTop: 14, paddingBottom: 6 },
  navItem: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginBottom: 2, position: 'relative', overflow: 'hidden' },
  navIcon: { width: 22, textAlign: 'center' },
  navLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  navLabelActive: { color: 'white', fontWeight: '700' },
  activeBar: { position: 'absolute', right: 0, top: 8, bottom: 8, width: 3, borderRadius: 2 },
  badge: { backgroundColor: '#FF4444', borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center' },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '800' },
  footer: { borderTopWidth: 1, padding: 12 },
  footerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  userName: { fontSize: 12, fontWeight: '700', color: 'white' },
  userRole: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleTagText: { fontSize: 10, fontWeight: '800' },
});
