import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import DrawerLayout from '../../components/DrawerLayout';
import Colors from '../../constants/colors';
import { Card, CardHeader, Badge, Button } from '../../components/UI';

type Tab = 'profile' | 'health' | 'notifications' | 'security';

const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

export default function ProfileScreen() {
  const router = useRouter();
  const { role, userName, userInitial, colors } = useTheme();
  const [saved, setSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('profile');

  const save = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    Alert.alert('Saved', 'Your changes have been saved.');
  };

  const tabs: { key: Tab; label: string }[] = [
    { key: 'profile',       label: '👤 Profile'       },
    { key: 'health',        label: '🏥 Health'         },
    { key: 'notifications', label: '🔔 Notifications'  },
    { key: 'security',      label: '🔒 Security'       },
  ];

  const notifPrefs = [
    { label: 'Medication Reminders',     sub: 'Get notified 15 min before each dose',              on: true  },
    { label: 'Missed Dose Alerts',       sub: 'Alert when a dose is missed',                       on: true  },
    { label: 'Doctor Messages',          sub: 'Notifications for new messages from your doctor',   on: true  },
    { label: 'Report AI Summary Ready',  sub: 'When AI finishes analysing your report',            on: true  },
    { label: 'Weekly Adherence Summary', sub: 'Weekly report of your medication adherence',        on: false },
    { label: 'Promotional Updates',      sub: 'Tips, health articles, and product updates',        on: false },
  ];

  const [toggles, setToggles] = useState(notifPrefs.map(p => p.on));
  const [bloodType, setBloodType] = useState('O+');

  return (
    <DrawerLayout title="Profile & Settings" subtitle="Manage your account" showBack>

      {/* Profile Header */}
      <View style={styles.profileBanner}>
        <View style={styles.avatarWrap}>
          <Text style={styles.avatarText}>RS</Text>
          <View style={styles.editBadge}><Text style={{ fontSize: 10 }}>✏️</Text></View>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.profileName}>Rahul Singh</Text>
          <Text style={styles.profileEmail}>rahul.singh@email.com · Patient</Text>
          <View style={{ flexDirection: 'row', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            <View style={styles.profileChip}><Text style={styles.profileChipText}>🩸 O+</Text></View>
            <View style={styles.profileChip}><Text style={styles.profileChipText}>⚠️ Penicillin Allergy</Text></View>
            <View style={styles.profileChip}><Text style={styles.profileChipText}>ID: MV-2024-RS-001</Text></View>
          </View>
        </View>
      </View>

      {/* Tabs */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow} contentContainerStyle={{ paddingHorizontal: 16 }}>
        {tabs.map(t => (
          <TouchableOpacity key={t.key} onPress={() => setActiveTab(t.key)} style={[styles.tab, activeTab === t.key && styles.tabActive]}>
            <Text style={[styles.tabText, activeTab === t.key && styles.tabTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>

        {/* PROFILE TAB */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader title="Personal Information" />
            <View style={{ padding: 16 }}>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>First Name</Text>
                  <TextInput style={styles.input} defaultValue="Rahul" placeholderTextColor={Colors.gray400} />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Last Name</Text>
                  <TextInput style={styles.input} defaultValue="Singh" placeholderTextColor={Colors.gray400} />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Email Address</Text>
                <TextInput style={styles.input} defaultValue="rahul.singh@email.com" keyboardType="email-address" autoCapitalize="none" placeholderTextColor={Colors.gray400} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Phone Number</Text>
                <TextInput style={styles.input} defaultValue="+91 98765 43210" keyboardType="phone-pad" placeholderTextColor={Colors.gray400} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Gender</Text>
                <View style={styles.genderRow}>
                  {['Male', 'Female', 'Other'].map(g => (
                    <TouchableOpacity key={g} style={[styles.genderBtn, g === 'Male' && styles.genderBtnActive]}>
                      <Text style={[styles.genderText, g === 'Male' && { color: Colors.primary }]}>{g}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Address</Text>
                <TextInput style={styles.input} defaultValue="A-42, Sector 18, Noida, UP 201301" placeholderTextColor={Colors.gray400} />
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={{ fontSize: 11, color: Colors.gray400 }}>Last updated: Mar 10, 2026</Text>
                <Button label={saved ? '✅ Saved!' : 'Save Changes'} onPress={save} size="sm" />
              </View>
            </View>
          </Card>
        )}

        {/* HEALTH TAB */}
        {activeTab === 'health' && (
          <Card>
            <CardHeader title="🩺 Medical Details" />
            <View style={{ padding: 16 }}>
              <View style={styles.field}>
                <Text style={styles.label}>Blood Type</Text>
                <View style={styles.bloodRow}>
                  {bloodTypes.map(b => (
                    <TouchableOpacity key={b} onPress={() => setBloodType(b)} style={[styles.bloodBtn, bloodType === b && styles.bloodBtnActive]}>
                      <Text style={[styles.bloodText, bloodType === b && { color: Colors.primary }]}>{b}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.row}>
                <View style={[styles.field, { flex: 1, marginRight: 8 }]}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput style={styles.input} defaultValue="175" keyboardType="numeric" placeholderTextColor={Colors.gray400} />
                </View>
                <View style={[styles.field, { flex: 1 }]}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput style={styles.input} defaultValue="72" keyboardType="numeric" placeholderTextColor={Colors.gray400} />
                </View>
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Known Allergies</Text>
                <TextInput style={styles.input} defaultValue="Penicillin, Sulfa drugs" placeholderTextColor={Colors.gray400} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Chronic Conditions</Text>
                <TextInput style={styles.input} defaultValue="None" placeholderTextColor={Colors.gray400} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Emergency Contact Name</Text>
                <TextInput style={styles.input} defaultValue="Amit Singh (Brother)" placeholderTextColor={Colors.gray400} />
              </View>
              <View style={styles.field}>
                <Text style={styles.label}>Emergency Contact Phone</Text>
                <TextInput style={styles.input} defaultValue="+91 87654 32109" keyboardType="phone-pad" placeholderTextColor={Colors.gray400} />
              </View>
              <Button label={saved ? '✅ Saved!' : 'Save Health Info'} onPress={save} style={{ marginTop: 8, width: '100%' }} />
            </View>
          </Card>
        )}

        {/* NOTIFICATIONS TAB */}
        {activeTab === 'notifications' && (
          <Card>
            <CardHeader title="🔔 Notification Preferences" />
            <View style={{ padding: 16 }}>
              {notifPrefs.map((pref, i) => (
                <View key={i} style={[styles.prefRow, i < notifPrefs.length - 1 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                  <View style={{ flex: 1, marginRight: 12 }}>
                    <Text style={{ fontWeight: '600', fontSize: 14, color: Colors.gray800 }}>{pref.label}</Text>
                    <Text style={{ fontSize: 12, color: Colors.gray400, marginTop: 2 }}>{pref.sub}</Text>
                  </View>
                  <Switch
                    value={toggles[i]}
                    onValueChange={v => setToggles(prev => prev.map((t, idx) => idx === i ? v : t))}
                    trackColor={{ false: Colors.gray200, true: Colors.primary + '80' }}
                    thumbColor={toggles[i] ? Colors.primary : Colors.gray400}
                  />
                </View>
              ))}
              <Button label={saved ? '✅ Saved!' : 'Save Preferences'} onPress={save} style={{ marginTop: 16, width: '100%' }} />
            </View>
          </Card>
        )}

        {/* SECURITY TAB */}
        {activeTab === 'security' && (
          <>
            <Card>
              <CardHeader title="🔑 Change Password" />
              <View style={{ padding: 16 }}>
                {['Current Password', 'New Password', 'Confirm New Password'].map((p, i) => (
                  <View key={i} style={styles.field}>
                    <Text style={styles.label}>{p}</Text>
                    <TextInput style={styles.input} placeholder={i === 1 ? 'Min. 8 characters' : ''} secureTextEntry placeholderTextColor={Colors.gray400} />
                  </View>
                ))}
                <Button label="Update Password" onPress={() => Alert.alert('Updated', 'Password changed successfully.')} style={{ width: '100%', marginTop: 4 }} />
              </View>
            </Card>

            <Card style={{ marginTop: 16 }}>
              <CardHeader title="📱 Active Sessions" />
              <View style={{ padding: 16 }}>
                {[
                  { device: 'iPhone 14 Pro', location: 'Noida, India', time: 'Current session', current: true },
                  { device: 'Chrome on Windows', location: 'Noida, India', time: '2 hrs ago', current: false },
                ].map((s, i) => (
                  <View key={i} style={[{ flexDirection: 'row', alignItems: 'center', paddingVertical: 12 }, i === 0 && { borderBottomWidth: 1, borderBottomColor: Colors.gray100 }]}>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: '600', fontSize: 13, color: Colors.gray800 }}>{s.device}</Text>
                      <Text style={{ fontSize: 11, color: Colors.gray400 }}>{s.location} · {s.time}</Text>
                    </View>
                    {s.current
                      ? <Badge label="Current" type="success" />
                      : <Button label="Revoke" onPress={() => {}} size="sm" variant="danger" />
                    }
                  </View>
                ))}
              </View>
            </Card>

            <Card style={{ marginTop: 16, borderWidth: 1, borderColor: Colors.dangerSoft }}>
              <CardHeader title="⚠️ Danger Zone" />
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: Colors.gray800 }}>Delete Account</Text>
                  <Text style={{ fontSize: 12, color: Colors.gray400, marginTop: 2 }}>Permanently delete your MediVault account and all data.</Text>
                </View>
                <Button label="Delete" onPress={() => Alert.alert('Are you sure?', 'This action cannot be undone.')} variant="danger" size="sm" />
              </View>
            </Card>
          </>
        )}

      </ScrollView>
    </DrawerLayout>
  );
}

const styles = StyleSheet.create({
  profileBanner: { backgroundColor: Colors.primaryDark, paddingHorizontal: 20, paddingBottom: 20, flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatarWrap: { width: 68, height: 68, borderRadius: 34, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: 'rgba(255,255,255,0.4)', position: 'relative' },
  avatarText: { fontSize: 24, fontWeight: '800', color: 'white' },
  editBadge: { position: 'absolute', bottom: 0, right: 0, width: 24, height: 24, borderRadius: 12, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  profileName: { fontSize: 20, fontWeight: '800', color: 'white', letterSpacing: -0.5 },
  profileEmail: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  profileChip: { backgroundColor: 'rgba(255,255,255,0.15)', paddingVertical: 3, paddingHorizontal: 10, borderRadius: 20 },
  profileChipText: { fontSize: 11, color: 'white' },
  tabRow: { backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.border, maxHeight: 50 },
  tab: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 2, borderBottomColor: 'transparent' },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: { fontSize: 13, fontWeight: '600', color: Colors.gray400 },
  tabTextActive: { color: Colors.primary },
  row: { flexDirection: 'row' },
  field: { marginBottom: 14 },
  label: { fontSize: 12, fontWeight: '600', color: Colors.gray700, marginBottom: 6 },
  input: { backgroundColor: Colors.gray50, borderWidth: 1.5, borderColor: Colors.border, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, fontSize: 14, color: Colors.gray900 },
  genderRow: { flexDirection: 'row', gap: 8 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border, alignItems: 'center', backgroundColor: Colors.white },
  genderBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  genderText: { fontSize: 13, fontWeight: '600', color: Colors.gray600 },
  bloodRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  bloodBtn: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5, borderColor: Colors.border, backgroundColor: Colors.white },
  bloodBtnActive: { borderColor: Colors.primary, backgroundColor: Colors.primarySoft },
  bloodText: { fontSize: 12, fontWeight: '600', color: Colors.gray600 },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
});
