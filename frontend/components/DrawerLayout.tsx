import React, { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet,
  Modal, SafeAreaView, StatusBar, Animated,
  Dimensions, Platform,
} from 'react-native';
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
  children: React.ReactNode;
}

export default function DrawerLayout({
  title, subtitle,
  role: roleProp,
  userName: userNameProp,
  userInitial: userInitialProp,
  headerRight, showBack = false, children,
}: DrawerLayoutProps) {
  const router = useRouter();
  const { colors, isDark, toggleTheme, role: ctxRole, userName: ctxUserName, userInitial: ctxUserInitial } = useTheme();

  // ✅ Always use context values — props are ignored to prevent role switching bugs
  const role        = ctxRole;
  const userName    = ctxUserName;
  const userInitial = ctxUserInitial;
  const [drawerOpen, setDrawerOpen] = useState(false);
  const slideAnim    = useRef(new Animated.Value(-DRAWER_W)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const themeBtnScale = useRef(new Animated.Value(1)).current;

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.parallel([
      Animated.spring(slideAnim,    { toValue: 0,  useNativeDriver: true, tension: 65, friction: 11 }),
      Animated.timing(backdropAnim, { toValue: 1,  duration: 250, useNativeDriver: true }),
    ]).start();
  };

  const closeDrawer = () => {
    Animated.parallel([
      Animated.timing(slideAnim,    { toValue: -DRAWER_W, duration: 220, useNativeDriver: true }),
      Animated.timing(backdropAnim, { toValue: 0,          duration: 200, useNativeDriver: true }),
    ]).start(() => setDrawerOpen(false));
  };

  const handleThemeToggle = () => {
    Animated.sequence([
      Animated.spring(themeBtnScale, { toValue: 0.8, useNativeDriver: true, tension: 200 }),
      Animated.spring(themeBtnScale, { toValue: 1,   useNativeDriver: true, tension: 200 }),
    ]).start();
    toggleTheme();
  };

  const barBg = role === 'doctor'
    ? (isDark ? '#1a2d5a' : '#12368A')
    : (isDark ? '#0a2422' : '#0D4F6F');
  const accentBar = role === 'doctor'
    ? (isDark ? '#4B80F0' : '#2E6AE6')
    : (isDark ? '#0D9488' : '#06B6D4');

  return (
    <View style={[s.root, { backgroundColor: colors.bgPage }]}>
      <StatusBar barStyle="light-content" backgroundColor={barBg} translucent={false} />

      <SafeAreaView style={{ backgroundColor: barBg }}>
        <View style={[s.topBar, { backgroundColor: barBg }]}>

          {/* Left */}
          <View style={s.topLeft}>
            <TouchableOpacity style={s.hamburger} onPress={openDrawer} activeOpacity={0.75}
              hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <View style={s.hLine} />
              <View style={[s.hLine, { width: 13 }]} />
              <View style={s.hLine} />
            </TouchableOpacity>

            {showBack && (
              <TouchableOpacity onPress={() => router.back()} style={s.backBtn}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Text style={s.backArrow}>←</Text>
              </TouchableOpacity>
            )}

            <View style={{ flex: 1 }}>
              <Text style={s.title} numberOfLines={1}>{title}</Text>
              {subtitle ? <Text style={s.subtitle} numberOfLines={1}>{subtitle}</Text> : null}
            </View>
          </View>

          {/* Right */}
          <View style={s.topRight}>
            {headerRight ? <View style={{ marginRight: 2 }}>{headerRight}</View> : null}

            {/* Dark/Light toggle */}
            <Animated.View style={{ transform: [{ scale: themeBtnScale }] }}>
              <TouchableOpacity style={s.iconBtn} onPress={handleThemeToggle} activeOpacity={0.8}>
                <Text style={{ fontSize: 17 }}>{isDark ? '☀️' : '🌙'}</Text>
              </TouchableOpacity>
            </Animated.View>

            {/* Notifications */}
            <TouchableOpacity style={s.iconBtn}
              onPress={() => router.push('/screens/Notifications' as any)} activeOpacity={0.75}>
              <Text style={{ fontSize: 17 }}>🔔</Text>
              <View style={[s.notifDot, { borderColor: barBg }]} />
            </TouchableOpacity>

            {/* Avatar */}
            <TouchableOpacity
              style={[s.avatar, { backgroundColor: 'rgba(255,255,255,0.22)', borderColor: 'rgba(255,255,255,0.5)' }]}
              onPress={() => router.push('/screens/Profile' as any)} activeOpacity={0.8}>
              <Text style={s.avatarText}>{(userInitial || 'U').slice(0, 2).toUpperCase()}</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Accent bottom line */}
        <View style={[s.accentLine, { backgroundColor: accentBar }]} />
      </SafeAreaView>

      {/* Body */}
      <View style={[s.body, { backgroundColor: colors.bgPage }]}>{children}</View>

      {/* Drawer */}
      <Modal visible={drawerOpen} transparent animationType="none"
        onRequestClose={closeDrawer} statusBarTranslucent>
        <View style={s.overlay}>
          <Animated.View style={[s.backdrop, { opacity: backdropAnim }]}>
            <TouchableOpacity style={{ flex: 1 }} activeOpacity={1} onPress={closeDrawer} />
          </Animated.View>
          <Animated.View style={[s.drawerPanel, { width: DRAWER_W, transform: [{ translateX: slideAnim }] }]}>
            <Sidebar role={role} userName={userName} userInitial={userInitial} onClose={closeDrawer} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingTop: Platform.OS === 'android' ? 12 : 8,
    paddingBottom: 12,
    minHeight: Platform.OS === 'android' ? 64 : 56,
  },
  accentLine: { height: 3, opacity: 0.8 },
  topLeft: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 10, marginRight: 8 },
  topRight: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 0 },
  title: { fontSize: 16, fontWeight: '800', color: 'white', letterSpacing: -0.3 },
  subtitle: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 1 },
  hamburger: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center', gap: 4,
    flexShrink: 0, borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  hLine: { width: 18, height: 2.5, backgroundColor: 'white', borderRadius: 2 },
  backBtn: { marginRight: 2 },
  backArrow: { color: 'white', fontSize: 20, fontWeight: '700' },
  iconBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
    position: 'relative', borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  notifDot: {
    position: 'absolute', top: 8, right: 8,
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: '#FF4444', borderWidth: 1.5,
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center', borderWidth: 2,
  },
  avatarText: { color: 'white', fontSize: 13, fontWeight: '800' },
  body: { flex: 1 },
  overlay: { flex: 1, flexDirection: 'row', position: 'relative' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.55)' },
  drawerPanel: { position: 'absolute', top: 0, left: 0, bottom: 0, zIndex: 10 },
});
