import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Text, StatusBar, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, usePathname } from 'expo-router';
import BottomNav from './BottomNav';
import { useTheme } from '../context/ThemeContext';
import { useBadges } from '../context/BadgeContext';

interface BottomNavLayoutProps {
  role?: 'doctor' | 'patient';
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export default function BottomNavLayout({
  role = 'patient',
  title = 'MediVault',
  subtitle,
  children,
  headerRight,
  showBack = false,
  onBack,
}: BottomNavLayoutProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors, userName } = useTheme();
  const insets = useSafeAreaInsets();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(20);
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [pathname]);
  
  const isDoctor = role === 'doctor';
  const accent = isDoctor ? colors.primary : colors.teal;
  // Health-themed header colors
  const headerBg = isDoctor 
    ? (false ? '#1e3a5f' : '#0C2840')  // Doctor: Deep navy blue
    : (false ? '#0a3d3d' : '#063232');  // Patient: Deep teal

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPage }]}>
      <StatusBar barStyle="light-content" backgroundColor={headerBg} />
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: headerBg, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerContent}>
          {showBack ? (
            <TouchableOpacity onPress={onBack || (() => router.back())} style={styles.backBtn}>
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
          ) : (
            <View style={[styles.logoBox, { backgroundColor: accent + '33' }]}>
              <Ionicons name="medical" size={20} color="white" />
            </View>
          )}
          
          <View style={styles.headerText}>
            <Text style={styles.headerTitle} numberOfLines={1}>{title}</Text>
            {subtitle && <Text style={styles.headerSubtitle} numberOfLines={1}>{subtitle}</Text>}
          </View>
          
          <View style={styles.headerRight}>
            {headerRight}
            <TouchableOpacity 
              style={[styles.avatar, { backgroundColor: accent + '33', borderColor: accent }]}
              onPress={() => router.push('/screens/Profile')}
            >
              <Text style={styles.avatarText}>{userName?.slice(0, 2).toUpperCase() || 'U'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Content with fade animation */}
      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Animated.View style={{ 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }}>
          {children}
        </Animated.View>
      </Animated.ScrollView>

      {/* Bottom Navigation */}
      <BottomNav role={role} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: 'white',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.65)',
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  avatarText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
});