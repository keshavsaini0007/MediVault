import React, { useState } from 'react';
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
  Text, Modal, SafeAreaView, Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useTheme } from '../context/ThemeContext';

/**
 * Shared authenticated layout — React Native equivalent of AppLayout.js.
 *
 * On web/tablet the sidebar slides in as a drawer overlay (hamburger button).
 * The Navbar sits at the top; children are rendered in the scrollable body.
 *
 * Props mirror the original exactly:
 *   role        – 'doctor' | 'patient'
 *   userName    – full display name
 *   userInitial – 1–2 char initials for sidebar avatar
 *   title       – navbar page title
 *   subtitle    – navbar subtitle
 *   actions     – optional React node in navbar right area
 *   children    – page body content
 */
interface AppLayoutProps {
  role?:        'doctor' | 'patient';
  userName?:    string;
  userInitial?: string;
  title?:       string;
  subtitle?:    string;
  actions?:     React.ReactNode;
  children:     React.ReactNode;
  /** Whether to show ← back arrow in navbar instead of page title mode */
  showBack?:    boolean;
}

export default function AppLayout({
  role        = 'patient',
  userName    = 'User',
  userInitial = 'U',
  title       = 'MediVault',
  subtitle,
  actions,
  children,
  showBack    = false,
}: AppLayoutProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { colors } = useTheme();

  return (
    <View style={[styles.root, { backgroundColor: colors.bgPage }]}>

      {/* ── Navbar ──────────────────────────────────── */}
      <SafeAreaView style={{ backgroundColor: colors.bgNavbar }}>
        <Navbar
          title={title}
          subtitle={subtitle}
          actions={
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              {/* Hamburger to open sidebar drawer */}
              <TouchableOpacity
                onPress={() => setDrawerOpen(true)}
                style={[styles.hamburger, { backgroundColor: colors.bgCard, borderColor: colors.border }]}
                accessibilityLabel="Open menu"
              >
                <Ionicons name="menu-outline" size={20} color={colors.textPrimary} />
              </TouchableOpacity>
              {actions}
            </View>
          }
          role={role}
          userName={userName}
          showBack={showBack}
        />
      </SafeAreaView>

      {/* ── Page content ────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { backgroundColor: colors.bgPage }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>

      {/* ── Sidebar Drawer (modal overlay) ────────────
          This replaces the fixed .sidebar on desktop.
          On mobile it slides in from the left as a full-height drawer.
      ──────────────────────────────────────────────── */}
      <Modal
        visible={drawerOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setDrawerOpen(false)}
        statusBarTranslucent
      >
        <View style={styles.drawerOverlay}>
          {/* Backdrop tap to close */}
          <TouchableOpacity
            style={styles.drawerBackdrop}
            onPress={() => setDrawerOpen(false)}
            activeOpacity={1}
          />
          {/* Sidebar panel */}
          <View style={styles.drawerPanel}>
            <Sidebar
              role={role}
              userName={userName}
              userInitial={userInitial}
              onClose={() => setDrawerOpen(false)}
            />
          </View>
        </View>
      </Modal>

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },

  hamburger: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Drawer overlay
  drawerOverlay: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  drawerPanel: {
    width: 220,
    // Full height via flex
    flexShrink: 0,
    // iOS safe-area handled inside Sidebar via SafeAreaView
  },
  drawerBackdrop: {
    flex: 1,
  },
});
