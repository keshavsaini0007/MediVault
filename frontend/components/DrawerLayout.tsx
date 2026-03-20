import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, StatusBar, Animated, Dimensions, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import Sidebar from './Sidebar';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');
const DRAWER_W = Math.min(260, SCREEN_W * 0.75);

interface DrawerLayoutProps {
  title: string;
  subtitle?: string;
  role?: 'patient' | 'doctor';
  userName?: string;
  userInitial?: string;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  /** Custom back handler — overrides router.back() */
  onBack?: () => void;
  children: React.ReactNode;
}

export default function DrawerLayout({
  title, subtitle, role = 'patient',
  userName = 'User', userInitial = 'U',
  headerRight, showBack = false, onBack, children,
}: DrawerLayoutProps) {
  const router        = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();
  const insets        = useSafeAreaInsets();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim     = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim     = useRef(new Animated.Value(1)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 0, useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(backdropAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0,         duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const handleTheme = () => {
    Animated.sequence([
      Animated.spring(scaleAnim, { toValue: 0.78, useNativeDriver: true, tension: 300 }),
      Animated.spring(scaleAnim, { toValue: 1,    useNativeDriver: true, tension: 300 }),
    ]).start();
    toggleTheme();
  };

  // Doctor = deep navy/blue, Patient = deep teal/cyan
  const barBg = role === 'doctor'
    ? (isDark ? '#0d1b3e' : '#0C1F6B')
    : (isDark ? '#052e2e' : '#064E4E');
  const accent = role === 'doctor'
    ? (isDark ? '#4B80F0' : '#3B82F6')
    : (isDark ? '#10B981' : '#0D9488');

  const topPadding = insets.top + (Platform.OS === 'android' ? 8 : 4);

  return (
    <View style={[s.root, { backgroundColor: colors.bgPage }]}>
      <StatusBar barStyle="light-content" backgroundColor={barBg} translucent={false} />

      {/* ── Navbar ── */}
      <View style={[s.navbar, { backgroundColor: barBg, paddingTop: topPadding }]}>
        <View style={s.navLeft}>
          <TouchableOpacity style={s.hamburger} onPress={openDrawer} activeOpacity={0.75}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}>
            <View style={s.hLine} />
            <View style={[s.hLine, { width: 13 }]} />
            <View style={s.hLine} />
          </TouchableOpacity>
          {(showBack || onBack) && (
            <TouchableOpacity onPress={() => onBack ? onBack() : router.back()}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={{ color: 'white', fontSize: 20, fontWeight: '700', marginRight: 6 }}>←</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={s.navTitle} numberOfLines={1}>{title}</Text>
            {subtitle ? <Text style={s.navSub} numberOfLines={1}>{subtitle}</Text> : null}
          </View>
        </View>
        <View style={s.navRight}>
          {headerRight ? <View style={{ marginRight: 4 }}>{headerRight}</View> : null}
          {/* Theme toggle */}
          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <TouchableOpacity style={[s.iconBtn, { borderColor: accent + '55' }]} onPress={handleTheme} activeOpacity={0.8}>
              <Ionicons name={isDark ? 'sunny' : 'moon'} size={18} color="white" />
            </TouchableOpacity>
          </Animated.View>
          {/* Bell */}
          <TouchableOpacity style={[s.iconBtn, { borderColor: accent + '55' }]}
            onPress={() => router.push('/screens/Notifications' as any)} activeOpacity={0.75}>
            <Ionicons name="notifications-outline" size={18} color="white" />
            <View style={[s.dot, { backgroundColor: '#FF4444', borderColor: barBg }]} />
          </TouchableOpacity>
          {/* Avatar */}
          <TouchableOpacity
            style={[s.avatar, { backgroundColor: accent + '33', borderColor: accent }]}
            onPress={() => router.push('/screens/Profile' as any)} activeOpacity={0.8}>
            <Text style={s.avatarTxt}>{(userInitial || 'U').slice(0, 2).toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Accent stripe */}
      <View style={[s.stripe, { backgroundColor: accent }]} />

      {/* ── Body ── */}
      <View style={[s.body, { backgroundColor: colors.bgPage }]}>{children}</View>

      {/* ── Drawer ── */}
      <Modal visible={drawerOpen} transparent animationType="none"
        onRequestClose={closeDrawer} statusBarTranslucent>
        <View style={s.overlay}>
          <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[s.panel, { width: DRAWER_W, transform: [{ translateX: slideAnim }] }]}>
            <Sidebar role={role} userName={userName} userInitial={userInitial} onClose={closeDrawer} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  navbar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingBottom: 14,
  },
  stripe: { height: 3, opacity: 0.85 },
  navLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10, marginRight: 8 },
  navRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  navTitle: { fontSize: 17, fontWeight: '800', color: 'white', letterSpacing: -0.3 },
  navSub:   { fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 1 },
  hamburger: {
    width: 40, height: 40, borderRadius: 12, flexShrink: 0,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center',
    justifyContent: 'center', gap: 4,
  },
  hLine: { width: 18, height: 2.5, backgroundColor: 'white', borderRadius: 2 },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.12)', borderWidth: 1,
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  dot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4, borderWidth: 1.5,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  avatarTxt: { color: 'white', fontSize: 13, fontWeight: '800' },
  body: { flex: 1 },
  overlay: { flex: 1, position: 'relative' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  panel: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10 },
});
