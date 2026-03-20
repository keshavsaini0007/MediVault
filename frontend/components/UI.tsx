/**
 * UI.tsx — Premium Component Library
 * Full dark/light mode support via useTheme()
 * Premium styling with soft shadows, gradients, and glowing effects
 */
import React, { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  icon: keyof typeof Ionicons.glyphMap; 
  value: string | number; 
  label: string;
  iconBg?: string; 
  valueColor?: string;
  iconColor?: string;
  accentColor?: string;
}

export function StatCard({ icon, value, label, iconBg, valueColor, iconColor, accentColor }: StatCardProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const press   = () => Animated.spring(scale, { toValue: 0.96, useNativeDriver: true, tension: 200 }).start();
  const release = () => Animated.spring(scale, { toValue: 1,    useNativeDriver: true, tension: 200 }).start();
  const accent = accentColor || iconBg || colors.primary;
  
  return (
    <Animated.View style={[{ transform: [{ scale }] }, { flex: 1 }]}>
      <TouchableOpacity activeOpacity={1} onPressIn={press} onPressOut={release}
        style={[ui.statCard, { 
          backgroundColor: colors.bgCard,
          shadowColor: accent,
          shadowOpacity: 0.12,
          borderColor: colors.borderSoft,
        }]}>
        <View style={[ui.statIcon, { 
          backgroundColor: iconBg || colors.primarySoft,
          shadowColor: accent,
          shadowOpacity: 0.25,
        }]}>
          <Ionicons name={icon} size={22} color={iconColor || colors.primary} />
        </View>
        <View style={ui.statInfo}>
          <Text style={[ui.statValue, { color: valueColor || colors.textPrimary }]}>{value}</Text>
          <Text style={[ui.statLabel, { color: colors.textMuted }]}>{label}</Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps {
  children: React.ReactNode;
  style?: object;
  padding?: number;
  glowColor?: string;
  variant?: 'default' | 'elevated' | 'glass' | 'soft' | 'gradient';
  accentColor?: string;
}

export function Card({ children, style, padding = 16, glowColor, variant = 'default', accentColor }: CardProps) {
  const { colors, isDark } = useTheme();
  const cardStyle = variant === 'elevated' ? ui.cardElevated : variant === 'glass' ? ui.cardGlass : variant === 'soft' ? ui.cardSoft : variant === 'gradient' ? ui.cardGradient : ui.card;
  
  const accent = accentColor || colors.primary;
  const softBg = isDark 
    ? `rgba(${parseInt(accent.slice(1,3), 16)}, ${parseInt(accent.slice(3,5), 16)}, ${parseInt(accent.slice(5,7), 16)}, 0.08)`
    : `rgba(${parseInt(accent.slice(1,3), 16)}, ${parseInt(accent.slice(3,5), 16)}, ${parseInt(accent.slice(5,7), 16)}, 0.05)`;
  
  const gradientBg = isDark
    ? `linear-gradient(180deg, ${colors.bgCard} 0%, rgba(${parseInt(accent.slice(1,3), 16)}, ${parseInt(accent.slice(3,5), 16)}, ${parseInt(accent.slice(5,7), 16)}, 0.06) 100%)`
    : `linear-gradient(180deg, ${colors.bgCard} 0%, rgba(${parseInt(accent.slice(1,3), 16)}, ${parseInt(accent.slice(3,5), 16)}, ${parseInt(accent.slice(5,7), 16)}, 0.04) 100%)`;

  return (
    <View style={[cardStyle, { 
      backgroundColor: variant === 'soft' ? softBg : variant === 'gradient' ? colors.bgCard : colors.bgCard,
      shadowColor: glowColor || accent,
      shadowOpacity: variant === 'soft' ? 0.06 : 0.1,
      padding,
      borderColor: colors.borderSoft,
    }, style]}>
      {variant === 'gradient' && (
        <View style={[ui.cardGradientOverlay, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} />
      )}
      {children}
    </View>
  );
}

// ─── CardHeader ───────────────────────────────────────────────────────────────
interface CardHeaderProps {
  title: string;
  right?: React.ReactNode;
  showBorder?: boolean;
  icon?: keyof typeof Ionicons.glyphMap;
}

export function CardHeader({ title, right, showBorder = true, icon }: CardHeaderProps) {
  const { colors } = useTheme();
  return (
    <View style={[ui.cardHeader, { borderBottomColor: showBorder ? colors.borderSoft : 'transparent' }]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {icon && (
          <View style={[ui.headerIcon, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={icon} size={16} color={colors.primary} />
          </View>
        )}
        <Text style={[ui.cardTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
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

interface BadgeProps {
  label: string;
  type?: keyof typeof BADGE_MAP;
  style?: object;
  textStyle?: object;
  size?: 'sm' | 'md';
  icon?: keyof typeof Ionicons.glyphMap;
}

export function Badge({ label, type = 'primary', style, textStyle, size = 'md', icon }: BadgeProps) {
  const { colors } = useTheme();
  const map = BADGE_MAP[type] || BADGE_MAP.default;
  const bg  = (colors as any)[map.bg]  || colors.primarySoft;
  const fg  = (colors as any)[map.fg]  || colors.primary;
  const isSm = size === 'sm';
  
  return (
    <View style={[ui.badge, { backgroundColor: bg, paddingVertical: isSm ? 3 : 5, paddingHorizontal: isSm ? 8 : 11 }, style]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {icon && <Ionicons name={icon} size={isSm ? 9 : 11} color={fg} />}
        <Text style={[ui.badgeText, { color: fg, fontSize: isSm ? 10 : 11 }, textStyle]}>{label}</Text>
      </View>
    </View>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
interface ButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  style?: object;
  icon?: keyof typeof Ionicons.glyphMap;
  glow?: boolean;
  pill?: boolean;
}

export function Button({ label, onPress, disabled, variant = 'primary', size = 'md', style, icon, glow = true, pill = false }: ButtonProps) {
  const { colors } = useTheme();
  const scale = useRef(new Animated.Value(1)).current;
  const press   = () => !disabled && Animated.spring(scale, { toValue: 0.95, useNativeDriver: true, tension: 200 }).start();
  const release = () => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 200 }).start();

  const bg = variant === 'primary' ? colors.primary
    : variant === 'success' ? colors.success
    : variant === 'danger'  ? colors.danger
    : 'transparent';
  const textColor = variant === 'outline' ? colors.primary : '#ffffff';
  const borderColor = variant === 'outline' ? colors.primary : 'transparent';
  const glowColor = variant === 'primary' ? colors.primary
    : variant === 'success' ? colors.success
    : variant === 'danger' ? colors.danger
    : colors.primary;
  const pad = size === 'sm' ? { paddingVertical: 7, paddingHorizontal: 13 }
    : size === 'lg' ? { paddingVertical: 14, paddingHorizontal: 24 }
    : { paddingVertical: 10, paddingHorizontal: 18 };

  return (
    <Animated.View style={[{ transform: [{ scale }] }, style]}>
      <TouchableOpacity onPress={onPress} onPressIn={press} onPressOut={release}
        disabled={disabled} activeOpacity={1}
        style={[ui.btn, pad, {
          backgroundColor: bg, 
          borderColor,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          opacity: disabled ? 0.45 : 1,
          shadowColor: glowColor, 
          shadowOpacity: glow && !disabled ? 0.35 : 0,
          shadowOffset: { width: 0, height: 4 }, 
          shadowRadius: glow && !disabled ? 12 : 0, 
          elevation: glow && !disabled ? 6 : 0,
          borderRadius: pill ? 24 : 14,
        }]}>
        {icon && <Ionicons name={icon} size={size === 'sm' ? 14 : 16} color={textColor} style={{ marginRight: 6 }} />}
        <Text style={[ui.btnText, { color: textColor, fontSize: size === 'sm' ? 12 : size === 'lg' ? 15 : 13 }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── ProgressBar ──────────────────────────────────────────────────────────────
interface ProgressBarProps {
  value: number;
  color?: string;
  height?: number;
  style?: object;
  showGlow?: boolean;
}

export function ProgressBar({ value, color, height = 7, style, showGlow = true }: ProgressBarProps) {
  const { colors } = useTheme();
  const c = color || colors.primary;
  return (
    <View style={[{ height, borderRadius: height / 2, backgroundColor: colors.border, overflow: 'hidden', shadowColor: c, shadowOpacity: showGlow ? 0.15 : 0 }, style]}>
      <View style={{ 
        width: `${Math.min(100, Math.max(0, value))}%` as any, 
        height: '100%', 
        backgroundColor: c, 
        borderRadius: height / 2,
        shadowColor: c,
        shadowOpacity: 0.4,
        shadowOffset: { width: 0, height: 0 },
        shadowRadius: 4,
      }} />
    </View>
  );
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
interface AvatarProps {
  initials: string;
  size?: number;
  bg?: string;
  color?: string;
  online?: boolean;
}

export function Avatar({ initials, size = 40, bg, color, online }: AvatarProps) {
  const { colors } = useTheme();
  return (
    <View style={{ position: 'relative' }}>
      <View style={{ 
        width: size, height: size, borderRadius: size / 2, 
        backgroundColor: bg || colors.primarySoft, 
        alignItems: 'center', justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOpacity: 0.15,
        shadowOffset: { width: 0, height: 2 },
        shadowRadius: 6,
      }}>
        <Text style={{ fontSize: size * 0.36, fontWeight: '800', color: color || colors.primary }}>{initials}</Text>
      </View>
      {online !== undefined && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          right: 0,
          width: size * 0.3,
          height: size * 0.3,
          borderRadius: size * 0.15,
          backgroundColor: online ? colors.success : colors.gray400,
          borderWidth: 2,
          borderColor: colors.bgCard,
        }} />
      )}
    </View>
  );
}

// ─── SearchBar ───────────────────────────────────────────────────────────────
interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onSubmit?: () => void;
}

export function SearchBar({ value, onChangeText, placeholder = 'Search...', onSubmit }: SearchBarProps) {
  const { colors } = useTheme();
  return (
    <View style={[ui.searchContainer, { 
      backgroundColor: colors.bgCard, 
      borderColor: colors.border,
      shadowColor: colors.primary,
      shadowOpacity: 0.05,
    }]}>
      <Ionicons name="search" size={18} color={colors.textFaint} />
      <TouchableOpacity style={{ flex: 1 }} onPress={onSubmit} activeOpacity={1}>
        <TextInput
          style={[ui.searchInput, { color: colors.textPrimary }]}
          placeholder={placeholder}
          placeholderTextColor={colors.textFaint}
          value={value}
          onChangeText={onChangeText}
          onSubmitEditing={onSubmit}
          returnKeyType="search"
        />
      </TouchableOpacity>
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')} activeOpacity={0.7}>
          <Ionicons name="close-circle" size={18} color={colors.textFaint} />
        </TouchableOpacity>
      )}
    </View>
  );
}

// ─── EmptyState ──────────────────────────────────────────────────────────────
interface EmptyStateProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { colors } = useTheme();
  return (
    <View style={ui.emptyState}>
      <View style={[ui.emptyIcon, { backgroundColor: colors.primarySoft }]}>
        <Ionicons name={icon} size={32} color={colors.primary} />
      </View>
      <Text style={[ui.emptyTitle, { color: colors.textPrimary }]}>{title}</Text>
      {subtitle && <Text style={[ui.emptySubtitle, { color: colors.textFaint }]}>{subtitle}</Text>}
    </View>
  );
}

// ─── IconBox ───────────────────────────────────────────────────────────────
interface IconBoxProps {
  icon: keyof typeof Ionicons.glyphMap;
  color?: string;
  bg?: string;
  size?: number;
  glow?: boolean;
  variant?: 'default' | 'filled' | 'soft';
}

export function IconBox({ icon, color, bg, size = 44, glow = true, variant = 'default' }: IconBoxProps) {
  const { colors } = useTheme();
  const bgColor = bg || colors.primarySoft;
  const iconColor = color || colors.primary;
  
  const filledVariant = variant === 'filled';
  const softVariant = variant === 'soft';
  
  return (
    <View style={[ui.iconBox, { 
      width: size, height: size, 
      borderRadius: size * 0.3,
      backgroundColor: filledVariant ? iconColor : softVariant ? bgColor : bgColor,
      shadowColor: iconColor,
      shadowOpacity: glow ? (softVariant ? 0.15 : 0.25) : 0.08,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: glow ? (softVariant ? 6 : 10) : 4,
      elevation: glow ? (softVariant ? 3 : 5) : 2,
    }, filledVariant && { borderWidth: 0 }]}>
      <Ionicons 
        name={icon} 
        size={size * 0.45} 
        color={filledVariant ? colors.white : softVariant ? iconColor : iconColor} 
      />
    </View>
  );
}

// ─── ColorIcon ─────────────────────────────────────────────────────────────
interface ColorIconProps {
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
  size?: number;
  filled?: boolean;
}

export function ColorIcon({ icon, color, bg, size = 40, filled = false }: ColorIconProps) {
  return (
    <View style={{
      width: size,
      height: size,
      borderRadius: size * 0.3,
      backgroundColor: bg,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: color,
      shadowOpacity: 0.2,
      shadowOffset: { width: 0, height: 2 },
      shadowRadius: 6,
      elevation: 3,
    }}>
      <Ionicons name={icon} size={size * 0.45} color={color} />
    </View>
  );
}

// ─── Premium Card ─────────────────────────────────────────────────────────────
interface PremiumCardProps {
  children: React.ReactNode;
  style?: object;
  padding?: number;
  accentColor?: string;
}

export function PremiumCard({ children, style, padding = 16, accentColor }: PremiumCardProps) {
  const { colors } = useTheme();
  const accent = accentColor || colors.primary;
  return (
    <View style={[ui.premiumCard, { 
      backgroundColor: colors.bgCard,
      shadowColor: accent,
      shadowOpacity: 0.1,
      borderColor: colors.borderSoft,
    }, style]}>
      <View style={[ui.premiumCardInner, { borderTopColor: accent }]}>
        {children}
      </View>
    </View>
  );
}

// ─── Gradient Card ───────────────────────────────────────────────────────────
interface GradientCardProps {
  children: React.ReactNode;
  style?: object;
  padding?: number;
  gradientColors?: [string, string];
}

export function GradientCard({ children, style, padding = 16, gradientColors }: GradientCardProps) {
  const { colors, isDark } = useTheme();
  const bg1 = gradientColors ? gradientColors[0] : colors.primarySoft;
  const bg2 = gradientColors ? gradientColors[1] : colors.primaryLight;
  
  return (
    <View style={[ui.gradientCard, { 
      backgroundColor: colors.bgCard,
      shadowColor: colors.primary,
      shadowOpacity: 0.12,
      borderColor: colors.borderSoft,
    }, style]}>
      <View style={[ui.gradientOverlay, { backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.02)' }]} />
      <View style={{ padding, zIndex: 1 }}>
        {children}
      </View>
    </View>
  );
}

// ─── SectionTitle / Divider ───────────────────────────────────────────────────
export function SectionTitle({ children }: { children: string }) {
  const { colors } = useTheme();
  return <Text style={[ui.sectionTitle, { color: colors.textMuted }]}>{children}</Text>;
}
export function Divider() {
  const { colors } = useTheme();
  return <View style={[ui.divider, { backgroundColor: colors.borderSoft }]} />;
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const ui = StyleSheet.create({
  // StatCard
  statCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderRadius: 20, padding: 16, marginBottom: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 6 }, 
    shadowRadius: 18, 
    elevation: 5,
  },
  statIcon: { 
    width: 50, height: 50, borderRadius: 16, 
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 10,
    elevation: 4,
  },
  statInfo: { flex: 1 },
  statValue: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },
  statLabel: { fontSize: 11, marginTop: 2, fontWeight: '500' },

  // Card
  card: {
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden', 
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 }, 
    shadowRadius: 24, 
    elevation: 6,
  },
  cardElevated: {
    borderRadius: 24, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden', 
    marginBottom: 16,
    shadowOffset: { width: 0, height: 12 }, 
    shadowRadius: 32, 
    elevation: 10,
  },
  cardGlass: {
    borderRadius: 24, 
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    overflow: 'hidden', 
    marginBottom: 16,
    shadowOffset: { width: 0, height: 8 }, 
    shadowRadius: 24, 
    elevation: 8,
  },
  cardSoft: {
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.03)',
    overflow: 'hidden', 
    marginBottom: 12,
    shadowOffset: { width: 0, height: 4 }, 
    shadowRadius: 16, 
    elevation: 4,
  },
  cardGradient: {
    borderRadius: 20, 
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
    overflow: 'hidden', 
    marginBottom: 16,
    shadowOffset: { width: 0, height: 6 }, 
    shadowRadius: 20, 
    elevation: 6,
  },
  cardGradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 60,
    borderRadius: 20,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 18, paddingVertical: 14, borderBottomWidth: 1,
  },
  headerIcon: {
    width: 28, height: 28, borderRadius: 8,
    alignItems: 'center', justifyContent: 'center',
  },
  cardTitle: { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },

  // Badge
  badge: { borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  badgeText: { fontWeight: '700' },

  // Button
  btn: { 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center', 
    flexDirection: 'row',
  },
  btnText: { fontWeight: '700' },

  // SearchBar
  searchContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderRadius: 14, borderWidth: 1.5, 
    paddingHorizontal: 14, paddingVertical: 10,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
  },
  searchInput: { flex: 1, fontSize: 14 },

  // EmptyState
  emptyState: { alignItems: 'center', paddingVertical: 40 },
  emptyIcon: {
    width: 64, height: 64, borderRadius: 20,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
  },
  emptyTitle: { fontWeight: '600', fontSize: 15 },
  emptySubtitle: { fontSize: 12, marginTop: 4 },

  // IconBox
  iconBox: {
    alignItems: 'center', justifyContent: 'center',
    elevation: 3,
  },

  // PremiumCard
  premiumCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 28,
    elevation: 10,
  },
  premiumCardInner: {
    borderTopWidth: 3,
    borderRadius: 24,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },

  // GradientCard
  gradientCard: {
    borderRadius: 24,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 10 },
    shadowRadius: 30,
    elevation: 10,
  },
  gradientOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },

  // Section
  sectionTitle: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 10 },
  divider: { height: 1, marginVertical: 12 },
});
