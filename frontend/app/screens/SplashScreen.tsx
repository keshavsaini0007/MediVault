import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, StatusBar, ViewStyle,
} from 'react-native';
import { useRouter } from 'expo-router';
import Colors from '../../constants/colors';

const { width, height } = Dimensions.get('window');

const QUOTES = [
  { text: 'Your health story,\ntold completely.', sub: 'Every report. Every prescription. Every moment.' },
  { text: 'AI that understands\nyour health.', sub: 'Get plain-English summaries of complex reports.' },
  { text: 'Doctors and patients,\nconnected.', sub: 'One tap to reach your doctor. Anytime, anywhere.' },
  { text: 'Never miss a\ndose again.', sub: 'Smart reminders. Real accountability.' },
];

// Floating orb component
function Orb({ style }: { style: ViewStyle }) {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.15, duration: 3000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 3000, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <Animated.View style={[style, { transform: [{ scale: pulse }] }]} />
  );
}

export default function SplashScreen() {
  const router = useRouter();
  const [qIdx, setQIdx] = useState(0);
  const [phase, setPhase] = useState(0);

  const logoAnim  = useRef(new Animated.Value(0)).current;
  const ctaAnim   = useRef(new Animated.Value(0)).current;
  const quoteAnim = useRef(new Animated.Value(0)).current;
  const pillsAnim = useRef(new Animated.Value(0)).current;
  const glowAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(logoAnim,  { toValue: 1, duration: 700, useNativeDriver: true }),
      Animated.timing(glowAnim,  { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(quoteAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(ctaAnim,   { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(pillsAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
    setPhase(1);
  }, []);

  // Rotate quotes
  useEffect(() => {
    const id = setInterval(() => {
      Animated.timing(quoteAnim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() => {
        setQIdx(i => (i + 1) % QUOTES.length);
        Animated.timing(quoteAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    }, 3200);
    return () => clearInterval(id);
  }, []);

  const q = QUOTES[qIdx];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#050D1A" />

      {/* Background orbs */}
      <Orb style={styles.orb1} />
      <Orb style={styles.orb2} />
      <Orb style={styles.orb3} />

      {/* Grid lines overlay */}
      <View style={styles.gridOverlay} pointerEvents="none">
        {[...Array(6)].map((_, i) => (
          <View key={i} style={[styles.gridLine, { top: (height / 6) * i }]} />
        ))}
      </View>

      {/* Top badge */}
      <Animated.View style={[styles.topBadge, { opacity: logoAnim }]}>
        <View style={styles.topBadgeDot} />
        <Text style={styles.topBadgeText}>HEALTH INTELLIGENCE PLATFORM</Text>
      </Animated.View>

      {/* Logo */}
      <Animated.View style={[
        styles.logoWrap,
        {
          opacity: logoAnim,
          transform: [{
            translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] })
          }]
        }
      ]}>
        {/* Outer glow ring */}
        <Animated.View style={[styles.logoGlowRing, { opacity: glowAnim }]} />
        {/* Inner ring */}
        <View style={styles.logoRing}>
          <View style={styles.logoBox}>
            <Text style={styles.logoPlus}>✚</Text>
          </View>
        </View>
      </Animated.View>

      {/* Brand */}
      <Animated.View style={{
        opacity: logoAnim,
        alignItems: 'center',
        marginBottom: 6,
        transform: [{ translateY: logoAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
      }}>
        <Text style={styles.brandName}>MediVault</Text>
        <View style={styles.brandSubRow}>
          <View style={styles.brandSubLine} />
          <Text style={styles.brandSub}>HEALTH PLATFORM</Text>
          <View style={styles.brandSubLine} />
        </View>
      </Animated.View>

      {/* Decorative divider */}
      <Animated.View style={[styles.dividerWrap, { opacity: glowAnim }]}>
        <View style={styles.dividerLine} />
        <View style={styles.dividerDiamond} />
        <View style={styles.dividerLine} />
      </Animated.View>

      {/* Quote */}
      <Animated.View style={[
        styles.quoteWrap,
        {
          opacity: quoteAnim,
          transform: [{ translateY: quoteAnim.interpolate({ inputRange: [0, 1], outputRange: [8, 0] }) }]
        }
      ]}>
        <Text style={styles.quoteText}>{q.text}</Text>
        <Text style={styles.quoteSub}>{q.sub}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={styles.dots}>
        {QUOTES.map((_, i) => (
          <View key={i} style={[
            styles.dot,
            {
              width: i === qIdx ? 24 : 6,
              backgroundColor: i === qIdx ? '#4FC3F7' : 'rgba(79,195,247,0.25)',
            }
          ]} />
        ))}
      </View>

      {/* CTA */}
      <Animated.View style={{
        opacity: ctaAnim,
        marginTop: 36,
        alignItems: 'center',
        transform: [{ translateY: ctaAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }]
      }}>
        <TouchableOpacity
          onPress={() => router.replace('/screens/LoginScreen')}
          style={styles.enterBtn}
          activeOpacity={0.75}
        >
          {/* Button glow */}
          <View style={styles.enterBtnGlow} />
          <Text style={styles.enterArrow}>→</Text>
        </TouchableOpacity>
        <Text style={styles.enterLabel}>Tap to Enter</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#050D1A',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    overflow: 'hidden',
  },

  // Background orbs
  orb1: {
    position: 'absolute',
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: 'rgba(30, 80, 160, 0.22)',
    top: -60,
    left: -80,
  },
  orb2: {
    position: 'absolute',
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: 'rgba(0, 140, 200, 0.15)',
    bottom: 60,
    right: -70,
  },
  orb3: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(79, 195, 247, 0.08)',
    top: height * 0.35,
    left: -40,
  },

  // Grid
  gridOverlay: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  gridLine: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.025)',
  },

  // Top badge
  topBadge: {
    position: 'absolute',
    top: 54,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: 'rgba(79,195,247,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.2)',
  },
  topBadgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#4FC3F7',
  },
  topBadgeText: {
    fontSize: 9,
    color: '#4FC3F7',
    letterSpacing: 2.5,
    fontWeight: '700',
  },

  // Logo
  logoWrap: { marginBottom: 22, alignItems: 'center', justifyContent: 'center' },
  logoGlowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.18)',
    backgroundColor: 'rgba(79,195,247,0.04)',
  },
  logoRing: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 1.5,
    borderColor: 'rgba(79,195,247,0.3)',
    backgroundColor: 'rgba(79,195,247,0.06)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: 'rgba(79,195,247,0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(79,195,247,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoPlus: {
    fontSize: 34,
    color: '#4FC3F7',
    fontWeight: '900',
  },

  // Brand
  brandName: {
    fontSize: 46,
    fontWeight: '900',
    color: 'white',
    letterSpacing: -2,
  },
  brandSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 5,
  },
  brandSubLine: {
    width: 20,
    height: 1,
    backgroundColor: 'rgba(79,195,247,0.4)',
  },
  brandSub: {
    fontSize: 10,
    color: '#4FC3F7',
    letterSpacing: 3.5,
    fontWeight: '700',
  },

  // Divider
  dividerWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginVertical: 22,
  },
  dividerLine: {
    width: 55,
    height: 1,
    backgroundColor: 'rgba(79,195,247,0.25)',
  },
  dividerDiamond: {
    width: 7,
    height: 7,
    backgroundColor: '#4FC3F7',
    transform: [{ rotate: '45deg' }],
    opacity: 0.7,
  },

  // Quote
  quoteWrap: { alignItems: 'center', minHeight: 88 },
  quoteText: {
    fontSize: 22,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
    letterSpacing: -0.5,
    lineHeight: 30,
  },
  quoteSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.45)',
    textAlign: 'center',
    marginTop: 10,
    letterSpacing: 0.2,
    lineHeight: 19,
  },

  // Dots
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 16,
    alignItems: 'center',
  },
  dot: { height: 6, borderRadius: 3 },

  // CTA
  enterBtn: {
    width: 90,
    height: 90,
    borderRadius: 33,
    backgroundColor: 'rgba(79,195,247,0.1)',
    borderWidth: 1.5,
    borderColor: 'rgba(79,195,247,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  enterBtnGlow: {
    position: 'absolute',
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(79,195,247,0.08)',
  },
  enterArrow: {
    fontSize: 24,
    color: '#4FC3F7',
    fontWeight: '700',
  },
  enterLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '600',
    fontSize: 13,
    marginTop: 10,
    letterSpacing: 0.5,
  },

  // Pills
  pillsRow: {
    position: 'absolute',
    bottom: 36,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 24,
  },
  pill: {
    paddingVertical: 6,
    paddingHorizontal: 13,
    borderRadius: 20,
    backgroundColor: 'rgba(79,195,247,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(79,195,247,0.18)',
  },
  pillText: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 12,
    fontWeight: '500',
  },
});