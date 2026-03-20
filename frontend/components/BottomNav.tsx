import React, { useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRouter, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { useBadges } from '../context/BadgeContext';

interface TabItem {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  activeIcon: keyof typeof Ionicons.glyphMap;
}

const doctorTabs: TabItem[] = [
  { label: 'Dashboard', href: '/screens/DoctorDashboard', icon: 'home-outline', activeIcon: 'home' },
  { label: 'Patients', href: '/screens/Patients', icon: 'people-outline', activeIcon: 'people' },
  { label: 'Alerts', href: '/screens/Alerts', icon: 'alert-circle-outline', activeIcon: 'alert-circle' },
  { label: 'Messages', href: '/screens/Messages', icon: 'chatbubbles-outline', activeIcon: 'chatbubbles' },
  { label: 'Profile', href: '/screens/Profile', icon: 'person-outline', activeIcon: 'person' },
];

const patientTabs: TabItem[] = [
  { label: 'Home', href: '/screens/PatientDashboard', icon: 'home-outline', activeIcon: 'home' },
  { label: 'Medicines', href: '/screens/Medicines', icon: 'medical-outline', activeIcon: 'medical' },
  { label: 'Records', href: '/screens/Records', icon: 'folder-outline', activeIcon: 'folder' },
  { label: 'Reports', href: '/screens/Reports', icon: 'document-text-outline', activeIcon: 'document-text' },
  { label: 'Profile', href: '/screens/Profile', icon: 'person-outline', activeIcon: 'person' },
];

export default function BottomNav({ role = 'patient' }: { role?: 'patient' | 'doctor' }) {
  const router = useRouter();
  const pathname = usePathname();
  const { colors } = useTheme();
  const { notifCount, messageCount, alertCount } = useBadges();

  const tabs = role === 'doctor' ? doctorTabs : patientTabs;
  const accent = role === 'doctor' ? colors.primary : colors.teal;

  const getBadgeCount = (label: string): number => {
    if (role === 'doctor') {
      if (label === 'Alerts') return alertCount;
      if (label === 'Messages') return messageCount;
      if (label === 'Patients') return 0;
    } else {
      if (label === 'Records') return 0;
      if (label === 'Medicines') return 0;
    }
    return 0;
  };

  return (
    <View style={[styles.container, { 
      backgroundColor: colors.bgCard, 
      borderTopColor: colors.border,
      shadowColor: '#000',
    }]}>
      {tabs.map((tab) => {
        const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/');
        const badgeCount = getBadgeCount(tab.label);

        return (
          <TabButton 
            key={tab.href}
            tab={tab}
            isActive={isActive}
            badgeCount={badgeCount}
            accent={accent}
            onPress={() => router.push(tab.href as any)}
          />
        );
      })}
    </View>
  );
}

function TabButton({ tab, isActive, badgeCount, accent, onPress }: {
  tab: TabItem; isActive: boolean; badgeCount: number; accent: string; onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const iconScale = useRef(new Animated.Value(1)).current;
  const indicatorWidth = useRef(new Animated.Value(0)).current;
  
  React.useEffect(() => {
    Animated.spring(indicatorWidth, {
      toValue: isActive ? 24 : 0,
      useNativeDriver: false,
      tension: 200,
      friction: 12,
    }).start();
  }, [isActive]);

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(iconScale, { toValue: 1.3, useNativeDriver: true, tension: 400, friction: 6 }),
      Animated.spring(iconScale, { toValue: 1, useNativeDriver: true, tension: 400, friction: 8 }),
    ]).start();
    onPress();
  };
  
  return (
    <Animated.View style={[styles.tabWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPressIn={() => Animated.spring(scale, { toValue: 0.92, useNativeDriver: true, tension: 300, friction: 8 }).start()}
        onPressOut={() => Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 }).start()}
        onPress={handlePress}
        activeOpacity={1}
        style={styles.tabButton}
      >
        <Animated.View style={[styles.iconWrapper, { transform: [{ scale: iconScale }] }]}>
          <View style={[
            styles.iconBg, 
            isActive && { backgroundColor: accent + '20' }
          ]}>
            <Ionicons 
              name={isActive ? tab.activeIcon : tab.icon} 
              size={22} 
              color={isActive ? accent : '#9CA3AF'} 
            />
          </View>
        </Animated.View>
        {badgeCount > 0 && (
          <View style={[styles.badge, { backgroundColor: '#EF4444' }]}>
            <Text style={styles.badgeText}>{badgeCount > 9 ? '9+' : badgeCount}</Text>
          </View>
        )}
        <Text style={[
          styles.label, 
          { color: isActive ? accent : '#9CA3AF', fontWeight: isActive ? '700' : '500' }
        ]}>
          {tab.label}
        </Text>
        <Animated.View style={[styles.activeIndicator, { 
          backgroundColor: accent,
          width: indicatorWidth,
          opacity: indicatorWidth,
        }]} />
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  tabWrapper: {
    flex: 1,
    alignItems: 'center',
  },
  tabButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    minWidth: 60,
  },
  iconWrapper: {
    marginBottom: 4,
  },
  iconBg: {
    width: 40,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    position: 'relative',
    marginBottom: 4,
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -8,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    shadowColor: '#EF4444',
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 4,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: '700',
  },
  label: {
    fontSize: 10,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -4,
    height: 3,
    borderRadius: 2,
  },
});