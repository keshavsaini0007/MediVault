/**
 * UI.tsx — Premium Component Library
 * Full dark/light mode support via useTheme()
 */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { useTheme } from '../context/ThemeContext';

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: string; value: string | number; label: string;
  iconBg?: string; valueColor?: string;
}
export function StatCard({ icon, value, label, iconBg, valueColor }: StatCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const press   = () => Animated.spring(scale, { toValue: 0.94, useNativeDriver: true, tension: 200 }).start();
  const release = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();
  return (
    <Animated.View style={[{ transform: [{ scale }] }, { flex: 1 }]}>
      <TouchableOpacity activeOpacity={1} onPressIn={press} onPressOut={release}
        style={[ss.statCard, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
        <View style={[ss.statIcon, { backgroundColor: iconBg || colors.primarySoft }]}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
        <View style={ss.statInfo}>
          <Text style={[ss.statValue, { color: valueColor || colors.textPrimary }]}>{value}</Text>
          <Text style={[ss.statLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useTheme();
  return (
    <View style={[ss.card, { backgroundColor: colors.bgCard, borderColor: colors.border }, style]}>
      {children}
    </View>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────
export function CardHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={[ss.cardHeader, { borderBottomColor: colors.borderSoft }]}>
      <Text style={[ss.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
      {right}
    </View>
  );
}

// ─── Badge ────────────────────────────────────────────────────────────────────
const BADGE_MAP = {
  primary: { bg: 'primarySoft', fg: 'primary' },
  success: { bg: 'successSoft', fg: 'success' },
  danger:  { bg: 'dangerSoft',  fg: 'danger'  },
  warning: { bg: 'warningSoft', fg: 'warning' },
  teal:    { bg: 'tealSoft',    fg: 'teal'    },
  default: { bg: 'gray100',     fg: 'gray600' },
} as const;

export function Badge({ label, type = 'primary', style, textStyle }:
  { label: string; type?: keyof typeof BADGE_MAP; style?: object; textStyle?: object }) {
  const { colors } = useTheme();
  const map = BADGE_MAP[type] || BADGE_MAP.default;
  const bg  = (colors as any)[map.bg]  || colors.primarySoft;
  const fg  = (colors as any)[map.fg]  || colors.primary;
  return (
    <View style={[ss.badge, { backgroundColor: bg }, style]}>
      <Text style={[ss.badgeText, { color: fg }, textStyle]}>{label}</Text>
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
export function Button({ label, onPress, disabled, variant = 'primary', size = 'md', style }:
  { label: string; onPress: () => void; disabled?: boolean;
    variant?: 'primary' | 'outline' | 'success' | 'danger'; size?: 'sm' | 'md' | 'lg'; style?: object }) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const press   = () => !disabled && Animated.spring(scale, { toValue: 0.93, useNativeDriver: true, tension: 200 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  const bg = variant === 'primary' ? colors.primary
    : variant === 'success' ? colors.success
    : variant === 'danger'  ? colors.danger
    : 'transparent';
  const textColor = variant === 'outline' ? colors.primary : '#ffffff';
  const borderColor = variant === 'outline' ? colors.primary : 'transparent';
  const pad = size === 'sm' ? { paddingVertical: 7, paddingHorizontal: 13 }
    : size === 'lg' ? { paddingVertical: 14, paddingHorizontal: 24 }
    : { paddingVertical: 10, paddingHorizontal: 18 };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={onPress} onPressIn={press} onPressOut={release}
        disabled={disabled} activeOpacity={1}
        style={[ss.btn, pad, {
          backgroundColor: bg, borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.45 : 1,
          shadowColor: bg, shadowOpacity: variant === 'primary' ? 0.35 : 0,
          shadowOffset: { width: 0, height: 4 }, shadowRadius: 8, elevation: variant === 'primary' ? 4 : 0,
        }]}>
        <Text style={[ss.btnText, { color: textColor, fontSize: size === 'sm' ? 12 : size === 'lg' ? 15 : 13 }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
export function ProgressBar({ value, color, height = 7, style }:
  { value: number; color?: string; height?: number; style?: object }) {
  const { colors } = useTheme();
  const c = color || colors.primary;
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: colors.border, overflow: 'hidden' }, style]}>
      <View style={{ width: `${Math.min(100, Math.max(0, value))}%` as any, height: '100%', backgroundColor: c, borderRadius: height / 2 }} />
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
export function Avatar({ initials, size = 40 }: { initials: string; size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.36, fontWeight: '800', color: colors.primary }}>{initials}</Text>
    </View>
  );
}

// ─── SectionTitle / Divider ───────────────────────────────────────────────────
export function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[ss.sectionTitle, { color: colors.textMuted }]}>{children}</Text>;
}
export function Divider() {
  const { colors } = useTheme();
  return <View style={[ss.divider, { backgroundColor: colors.borderSoft }]} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ss = StyleSheet.create({
  statCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: 16, padding: 16, marginBottom: 4,
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 8, elevation: 3,
  },
  statIcon: { width: 46, height: 46, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  statInfo: { flex: 1 },
  statValue: { fontSize: 23, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: '500' },

  card: {
    borderRadius: 18, borderWidth: 1, overflow: 'hidden', marginBottom: 16,
    shadowColor: '#000', shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 3 }, shadowRadius: 10, elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 15, borderBottomWidth: 1,
  },
  cardTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  badge: { borderRadius: 20, paddingVertical: 4, paddingHorizontal: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },

  btn: { borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexDirection: 'row' },
  btnText: { fontWeight: '700' },

  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  divider: { height: 1, marginVertical: 12 },
});
