import React, { useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet,
  SafeAreaView, Animated,
} from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { useTheme } from '../context/ThemeContext';

interface NavSection { section: string }
interface NavLink { label: string; href: string; icon: string; badge?: number }
type NavEntry = NavSection | NavLink;

const doctorNav: NavEntry[] = [
  { section: 'Main' },
  { label: 'Dashboard',     href: '/screens/DoctorDashboard', icon: '🏠'          },
  { label: 'Patients',      href: '/screens/Patients',         icon: '👥', badge: 28 },
  { label: 'Alerts',        href: '/screens/Alerts',           icon: '🚨', badge: 2  },
  { label: 'Messages',      href: '/screens/Messages',         icon: '💬', badge: 3  },
  { section: 'Activity' },
  { label: 'Notifications', href: '/screens/Notifications',    icon: '🔔', badge: 5  },
  { section: 'Account' },
  { label: 'Profile',       href: '/screens/Profile',          icon: '⚙️'          },
  { label: 'Logout',        href: '/screens/SplashScreen',     icon: '🚪'          },
];

const patientNav: NavEntry[] = [
  { section: 'My Health' },
  { label: 'Dashboard',     href: '/screens/PatientDashboard', icon: '🏠'          },
  { label: 'Medicines',     href: '/screens/Medicines',        icon: '💊'          },
  { label: 'My Records',    href: '/screens/Records',          icon: '📁'          },
  { label: 'Reports',       href: '/screens/Reports',          icon: '📋'          },
  { section: 'Tools' },
  { label: 'Symptom Check', href: '/screens/Symptoms',         icon: '🩺'          },
  { label: 'Timeline',      href: '/screens/Timeline',         icon: '📅'          },
  { label: 'QR Profile',    href: '/screens/QRProfile',        icon: '🔲'          },
  { section: 'Account' },
  { label: 'Notifications', href: '/screens/Notifications',    icon: '🔔', badge: 1 },
  { label: 'Profile',       href: '/screens/Profile',          icon: '⚙️'          },
  { label: 'Logout',        href: '/screens/SplashScreen',     icon: '🚪'          },
];

function isSection(e: NavEntry): e is NavSection { return 'section' in e; }

function NavItem({ item, isActive, onPress }: { item: NavLink; isActive: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const press   = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 200 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <TouchableOpacity onPress={onPress} onPressIn={press} onPressOut={release}
        activeOpacity={1}
        style={[
          s.navItem,
          isActive && s.navItemActive,
        ]}>
        <Text style={[s.navIcon, isActive && { opacity: 1 }]}>{item.icon}</Text>
        <Text style={[s.navLabel, isActive && s.navLabelActive]}>{item.label}</Text>
        {item.badge ? (
          <View style={s.badge}><Text style={s.badgeText}>{item.badge}</Text></View>
        ) : null}
        {isActive && <View style={s.activeBar} />}
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

export default function Sidebar({ role: roleProp, userName: userNameProp, userInitial: userInitialProp, onClose }: SidebarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const { isDark, role: ctxRole, userName: ctxUserName, userInitial: ctxUserInitial } = useTheme();

  // ✅ Always use ThemeContext — never trust prop values (they can be stale)
  const role        = ctxRole;
  const userName    = ctxUserName;
  const userInitial = ctxUserInitial;

  const navItems = role === 'doctor' ? doctorNav : patientNav;
  const home     = role === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard';

  const handleNav = (href: string) => { router.push(href as any); onClose?.(); };

  const bgTop    = role === 'doctor' ? (isDark ? '#0d1a3a' : '#0C2461') : (isDark ? '#062322' : '#053B3B');
  const bgBottom = role === 'doctor' ? (isDark ? '#1a2d5a' : '#1e3a8a') : (isDark ? '#0a2c2c' : '#0B4F4F');

  return (
    <View style={[s.sidebar, { backgroundColor: bgTop }]}>
      <SafeAreaView style={{ flex: 1 }}>

        {/* Logo */}
        <TouchableOpacity style={[s.logoArea, { borderBottomColor: 'rgba(255,255,255,0.1)' }]}
          onPress={() => handleNav(home)} activeOpacity={0.8}>
          <View style={[s.logoIcon, { backgroundColor: role === 'doctor' ? '#2E6AE6' : '#0D9488' }]}>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: '900' }}>✚</Text>
          </View>
          <View>
            <Text style={s.logoText}>MediVault</Text>
            <Text style={s.logoSub}>HEALTH PLATFORM</Text>
          </View>
        </TouchableOpacity>

        {/* Nav */}
        <ScrollView style={s.nav} showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 20 }}>
          {navItems.map((item, i) => {
            if (isSection(item)) {
              return <Text key={i} style={s.sectionLabel}>{item.section}</Text>;
            }
            const active = pathname === item.href;
            return (
              <NavItem key={item.href} item={item} isActive={active}
                onPress={() => handleNav(item.href)} />
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={[s.footer, { borderTopColor: 'rgba(255,255,255,0.08)', backgroundColor: bgBottom }]}>
          <View style={s.footerUser}>
            <View style={[s.userAvatar, { backgroundColor: role === 'doctor' ? '#2E6AE6' : '#0D9488' }]}>
              <Text style={{ color: 'white', fontWeight: '800', fontSize: 13 }}>{(userInitial || 'U').slice(0, 2)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={s.userName} numberOfLines={1}>{userName}</Text>
              <Text style={s.userRole}>{role === 'doctor' ? '👨‍⚕️ Physician' : '🧑 Patient'}</Text>
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
  logoArea: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 20, paddingBottom: 18, borderBottomWidth: 1,
  },
  logoIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 6, elevation: 4,
  },
  logoText: { fontSize: 16, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  logoSub: { fontSize: 8, color: 'rgba(255,255,255,0.35)', letterSpacing: 1.5, textTransform: 'uppercase', marginTop: 2 },

  nav: { flex: 1, paddingHorizontal: 10, paddingTop: 14 },
  sectionLabel: {
    fontSize: 9, fontWeight: '800', color: 'rgba(255,255,255,0.3)',
    letterSpacing: 1.5, textTransform: 'uppercase',
    paddingHorizontal: 10, paddingTop: 14, paddingBottom: 6,
  },
  navItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 10, paddingHorizontal: 12,
    borderRadius: 12, marginBottom: 2,
    position: 'relative', overflow: 'hidden',
  },
  navItemActive: {
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)',
  },
  navIcon: { fontSize: 16, width: 22, textAlign: 'center', opacity: 0.75 },
  navLabel: { flex: 1, fontSize: 13, fontWeight: '500', color: 'rgba(255,255,255,0.65)' },
  navLabelActive: { color: 'white', fontWeight: '700' },
  activeBar: {
    position: 'absolute', right: 0, top: 8, bottom: 8,
    width: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.8)',
  },
  badge: {
    backgroundColor: '#FF4444', borderRadius: 10,
    paddingHorizontal: 6, paddingVertical: 2, minWidth: 20, alignItems: 'center',
  },
  badgeText: { color: 'white', fontSize: 9, fontWeight: '800' },

  footer: { borderTopWidth: 1, padding: 12 },
  footerUser: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 12 },
  userAvatar: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  userName: { fontSize: 13, fontWeight: '700', color: 'white' },
  userRole: { fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 1 },
  roleTag: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  roleTagText: { fontSize: 10, fontWeight: '800' },
});
