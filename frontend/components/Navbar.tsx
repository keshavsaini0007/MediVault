import React from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, StatusBar,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// ─── Props ────────────────────────────────────────────────────────────────────
interface NavbarProps {
  title?: string;
  subtitle?: string;
  /** Optional right-side action node (e.g. a Button) */
  actions?: React.ReactNode;
  role?: 'doctor' | 'patient';
  userName?: string;
  /** Show a back arrow instead of the avatar menu */
  showBack?: boolean;
  /** Active screen for icon highlighting */
  activeScreen?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function Navbar({
  title    = 'MediVault',
  subtitle,
  actions,
  role     = 'doctor',
  userName = 'DS',
  showBack = false,
  activeScreen,
}: NavbarProps) {
  const router = useRouter();
  const { colors, isDark, toggleTheme } = useTheme();

  // Derive 1–2 char initials (mirrors Sidebar.js logic)
  const initials = userName
    .split(' ')
    .map(w => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || (role === 'doctor' ? 'DR' : 'PT');

  const avatarBg = role === 'doctor' ? colors.primary : colors.teal;

  const isActive = (screen: string) => activeScreen === screen;

  return (
    <View style={[styles.navbar, { backgroundColor: colors.bgNavbar, borderBottomColor: colors.border }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.bgNavbar}
      />

      {/* ── Left: back OR title ──────────────────── */}
      <View style={styles.left}>
        {showBack ? (
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
            <Ionicons name="chevron-back" size={22} color={colors.primary} />
          </TouchableOpacity>
        ) : null}
        <View>
          <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={1}>
            {title}
          </Text>
          {subtitle ? (
            <Text style={[styles.subtitle, { color: colors.textFaint }]} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {/* ── Right: actions + icons + avatar ─────── */}
      <View style={styles.right}>
        {/* Custom actions (e.g. "+ Add Patient" button) */}
        {actions ? <View style={styles.actionsWrap}>{actions}</View> : null}

        {/* Notification bell */}
        <TouchableOpacity
          style={[
            styles.iconBtn,
            {
              backgroundColor: isActive('notifications') ? colors.primarySoft : colors.bgCard,
              borderColor: isActive('notifications') ? colors.primary : colors.border,
            },
          ]}
          onPress={() => router.push('/screens/Notifications')}
          accessibilityLabel="Notifications"
          activeOpacity={0.7}
        >
          <Ionicons
            name="notifications-outline"
            size={18}
            color={isActive('notifications') ? colors.primary : colors.textMuted}
          />
          {/* Red dot */}
          <View style={[styles.notifDot, { backgroundColor: colors.danger, borderColor: colors.bgNavbar }]} />
        </TouchableOpacity>

        {/* Dark / Light toggle */}
        <TouchableOpacity
          style={[
            styles.themeToggle,
            {
              backgroundColor: isDark ? colors.primarySoft : colors.bgCard,
              borderColor: isDark ? colors.primaryDark : colors.border,
            },
          ]}
          onPress={toggleTheme}
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          activeOpacity={0.8}
        >
          {/* Track icons */}
          <Ionicons name="sunny" size={12} color={colors.warning} style={{ opacity: isDark ? 0.35 : 1 }} />
          <Ionicons name="moon" size={12} color={colors.primary} style={{ opacity: isDark ? 1 : 0.35 }} />
          {/* Sliding thumb */}
          <View
            style={[
              styles.themeThumb,
              {
                backgroundColor: isDark ? colors.primaryLight : 'white',
                transform: [{ translateX: isDark ? 28 : 0 }],
              },
            ]}
          />
        </TouchableOpacity>

        {/* Avatar */}
        <TouchableOpacity
          onPress={() => router.push('/screens/Profile')}
          style={[styles.avatar, { backgroundColor: avatarBg }]}
          accessibilityLabel={`${userName} (${role})`}
          activeOpacity={0.7}
        >
          <Text style={styles.avatarText}>{initials}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  navbar: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 3,
    zIndex: 90,
  },

  left: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
    marginRight: 12,
  },
  backBtn: {
    marginRight: 4,
    padding: 4,
  },
  backArrow: {
    fontSize: 20,
    fontWeight: '700',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    marginTop: 1,
  },

  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionsWrap: {
    marginRight: 2,
  },

  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
  },

  themeToggle: {
    width: 56,
    height: 28,
    borderRadius: 20,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 5,
    overflow: 'hidden',
    position: 'relative',
  },
  themeIcon: {
    fontSize: 11,
    zIndex: 2,
  },
  themeThumb: {
    position: 'absolute',
    top: 3,
    left: 3,
    width: 20,
    height: 20,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 4,
    elevation: 2,
    zIndex: 3,
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarText: {
    color: 'white',
    fontSize: 11,
    fontWeight: '800',
  },
});
