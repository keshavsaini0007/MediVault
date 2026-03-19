import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Switch, Alert, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import DrawerLayout from '../../components/DrawerLayout';
import { useTheme } from '../../context/ThemeContext';
import { useBadges } from '../../context/BadgeContext';
import { Card, CardHeader, Button } from '../../components/UI';
import { authAPI, User } from '../../services/api';

type Tab = 'profile' | 'health' | 'notifications' | 'security' | 'alerts';

/* ─── Shared editable field ─────────────────────────────────────── */
function Field({ label, value, onChange, secure = false, colors }: {
  label: string; value: string; onChange?: (text: string) => void; secure?: boolean; colors: any;
}) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={[ft.label, { color: colors.textMuted }]}>{label}</Text>
      <TextInput
        style={[ft.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]}
        value={value}
        onChangeText={onChange}
        secureTextEntry={secure}
        placeholderTextColor={colors.textFaint}
      />
    </View>
  );
}

/* ─── Shared tab bar ────────────────────────────────────────────── */
function TabBar({ tabs, active, onSelect, accent }: {
  tabs: { key: string; label: string }[];
  active: string; onSelect: (k: string) => void; accent: string;
}) {
  const { colors } = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={[ft.tabRow, { backgroundColor: colors.bgCard, borderBottomColor: colors.border }]}
      contentContainerStyle={{ paddingHorizontal: 12 }}>
      {tabs.map(t => (
        <TouchableOpacity key={t.key} onPress={() => onSelect(t.key)}
          style={[ft.tab, active === t.key && { borderBottomColor: accent }]}>
          <Text style={[ft.tabTxt, { color: active === t.key ? accent : colors.textFaint }]}>{t.label}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

/* ─── Reusable single preference row with working Switch ────────── */
function PrefRow({
  label, sub, value, onToggle, accent, colors, isLast,
}: {
  label: string; sub: string; value: boolean;
  onToggle: () => void; accent: string; colors: any; isLast: boolean;
}) {
  return (
    <View style={[ft.prefRow,
    !isLast && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
      <View style={{ flex: 1, marginRight: 12 }}>
        <Text style={{ fontWeight: '600', fontSize: 13, color: colors.textPrimary }}>{label}</Text>
        <Text style={{ fontSize: 11, color: colors.textFaint, marginTop: 2 }}>{sub}</Text>
      </View>
      {/* ✅ Switch is fully controlled — value from context, onValueChange updates context */}
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: accent + '80' }}
        thumbColor={value ? accent : colors.gray400}
      />
    </View>
  );
}

/* ═══════════════════ DOCTOR PROFILE ═══════════════════════════════ */
function DoctorProfile() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { doctorSettings, toggleDoctorSetting } = useBadges();
  const [tab, setTab] = useState<Tab>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const accent = colors.primary;

  const loadUser = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  }, []);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Current password is required');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'New password is required');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.replace('/screens/LoginScreen');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to logout');
    }
  };

  const tabs = [
    { key: 'profile', label: '👨‍⚕️ Profile' },
    { key: 'alerts', label: '🔔 Alerts' },
    { key: 'security', label: '🔒 Security' },
  ];

  // Doctor alert preference rows — key maps directly to DoctorSettings
  const alertPrefs: { key: keyof typeof doctorSettings; label: string; sub: string }[] = [
    { key: 'criticalPatientAlerts', label: 'Critical Patient Alerts', sub: 'Immediate alerts for critical conditions' },
    { key: 'missedDoseAlerts', label: 'Missed Dose Alerts', sub: 'When patients miss medication doses' },
    { key: 'newReportUploads', label: 'New Report Uploads', sub: 'When patients upload medical reports' },
    { key: 'smsDeliveryConfirm', label: 'SMS Delivery Confirmation', sub: 'Confirm SMS sent via Twilio' },
    { key: 'weeklyPatientSummary', label: 'Weekly Patient Summary', sub: 'Weekly adherence report' },
    { key: 'lowAdherenceWarning', label: 'Low Adherence Warning', sub: 'Alert when adherence drops below 70%' },
  ];

  return (
    <>
      {/* Header */}
      <View style={[dh.header, { backgroundColor: isDark ? '#0d1b3e' : '#0C1F6B' }]}>
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <View style={dh.avatar}><Text style={{ fontSize: 28 }}>👨‍⚕️</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={dh.name}>{user?.name || 'Doctor'}</Text>
                <Text style={dh.spec}>{user?.specialization || 'General Physician'}</Text>
                <Text style={dh.hosp}>{user?.hospitalAffiliation || 'Hospital'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[
                `🏥 ${user?.hospitalId || 'N/A'}`,
                `👥 ${user?.assignedDoctorId ? 'Assigned' : '0'} Patients`,
              ].map(c => (
                <View key={c} style={dh.chip}><Text style={dh.chipTxt}>{c}</Text></View>
              ))}
            </View>
            <View style={dh.statsRow}>
              {[['0', 'Patients'], ['--', 'Adherence'], ['0', 'Pending'], ['0', 'Critical']].map(([v, l]) => (
                <View key={l} style={dh.statItem}>
                  <Text style={dh.statVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{v}</Text>
                  <Text style={dh.statLbl} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{l}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <TabBar tabs={tabs} active={tab} onSelect={(k) => setTab(k as Tab)} accent={accent} />
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}>

        {tab === 'profile' && (
          <Card>
            <CardHeader title="Professional Information" />
            <View style={{ padding: 16 }}>
              {[
                ['Full Name', user?.name || ''],
                ['Specialisation', user?.specialization || ''],
                ['Hospital', user?.hospitalAffiliation || ''],
                ['Hospital ID', user?.hospitalId || ''],
                ['Email', user?.email || ''],
                ['Phone', user?.phone || user?.mobile || ''],
              ].map(([l, v]) => <Field key={l} label={l} value={v} colors={colors} />)}
              <Button label="Save Changes" onPress={() => Alert.alert('Saved ✅')} />
            </View>
          </Card>
        )}

        {tab === 'alerts' && (
          <Card>
            <CardHeader title="🔔 Alert Preferences" />
            <View style={{ padding: 16 }}>
              {alertPrefs.map((pref, i) => (
                <PrefRow
                  key={pref.key}
                  label={pref.label}
                  sub={pref.sub}
                  value={doctorSettings[pref.key]}
                  onToggle={() => toggleDoctorSetting(pref.key)}
                  accent={accent}
                  colors={colors}
                  isLast={i === alertPrefs.length - 1}
                />
              ))}
            </View>
          </Card>
        )}

        {tab === 'security' && (
          <>
            <Card>
              <CardHeader title="🔑 Change Password" />
              <View style={{ padding: 16 }}>
                <Field label="Current Password" value={currentPassword} onChange={setCurrentPassword} secure colors={colors} />
                <Field label="New Password" value={newPassword} onChange={setNewPassword} secure colors={colors} />
                <Field label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} secure colors={colors} />
                <Button label={saving ? 'Updating...' : 'Update Password'} onPress={handleChangePassword} disabled={saving} />
              </View>
            </Card>
            <Card style={{ marginTop: 0 }}>
              <CardHeader title="📋 Doctor License" />
              <View style={{ padding: 16 }}>
                {[
                  ['License No.', user?.hospitalId || 'N/A'],
                  ['Valid Until', 'December 2026'],
                  ['Issued By', 'Medical Council of India'],
                ].map(([l, v], i, a) => (
                  <View key={l} style={[
                    { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 10 },
                    i < a.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft },
                  ]}>
                    <Text style={{ fontSize: 12, color: colors.textMuted }}>{l}</Text>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: colors.textPrimary }}>{v}</Text>
                  </View>
                ))}
              </View>
            </Card>
            <Card style={{ marginTop: 0 }}>
              <CardHeader title="🚪 Logout" />
              <View style={{ padding: 16 }}>
                <Button label="Logout" onPress={handleLogout} variant="danger" style={{ width: '100%' }} />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </>
  );
}

/* ═══════════════════ PATIENT PROFILE ══════════════════════════════ */
function PatientProfile() {
  const { colors, isDark } = useTheme();
  const router = useRouter();
  const { patientSettings, togglePatientSetting } = useBadges();
  const [tab, setTab] = useState<Tab>('profile');
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);

  // Profile form state
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  // Health form state
  const [bloodType, setBloodType] = useState('O+');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [allergies, setAllergies] = useState('');
  const [conditions, setConditions] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');

  // Security form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const accent = colors.teal;

  const loadUser = async () => {
    try {
      const userData = await authAPI.me();
      setUser(userData);
      setBloodType(userData.bloodType || 'O+');
      setFirstName(userData.firstName || '');
      setLastName(userData.lastName || '');
      setPhone(userData.phone || userData.mobile || '');
      setAddress(userData.address || '');
      setAllergies(userData.allergies?.join(', ') || '');
      setConditions(userData.conditions?.join(', ') || '');
      setHeight(userData.height?.toString() || '');
      setWeight(userData.weight?.toString() || '');
      setEmergencyName(userData.emergencyContact?.name || '');
      setEmergencyPhone(userData.emergencyContact?.phone || '');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to load user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUser();
    setRefreshing(false);
  }, []);

  const handleSaveProfile = async () => {
    if (!firstName.trim()) {
      Alert.alert('Error', 'First name is required');
      return;
    }
    if (!lastName.trim()) {
      Alert.alert('Error', 'Last name is required');
      return;
    }
    setSaving(true);
    try {
      const fullName = `${firstName.trim()} ${lastName.trim()}`.trim();
      const updatedUser = await authAPI.updateProfile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: fullName,
        phone: phone.trim(),
        address: address.trim(),
      });
      setUser(updatedUser);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveHealth = async () => {
    setSaving(true);
    try {
      const updatedUser = await authAPI.updateHealthInfo({
        bloodType,
        allergies: allergies.split(',').map(a => a.trim()).filter(Boolean),
        height: height ? parseFloat(height) : undefined,
        weight: weight ? parseFloat(weight) : undefined,
        conditions: conditions.split(',').map(c => c.trim()).filter(Boolean),
        emergencyContact: {
          name: emergencyName.trim(),
          phone: emergencyPhone.trim(),
        },
      });
      setUser(updatedUser);
      Alert.alert('Success', 'Health info updated successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to update health info');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Current password is required');
      return;
    }
    if (!newPassword) {
      Alert.alert('Error', 'New password is required');
      return;
    }
    if (newPassword.length < 8) {
      Alert.alert('Error', 'New password must be at least 8 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }
    setSaving(true);
    try {
      await authAPI.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Password changed successfully');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await authAPI.logout();
      router.replace('/screens/LoginScreen');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to logout');
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];

  const tabs = [
    { key: 'profile', label: '👤 Profile' },
    { key: 'health', label: '🏥 Health' },
    { key: 'notifications', label: '🔔 Notifs' },
    { key: 'security', label: '🔒 Security' },
  ];

  // Patient notification preference rows — key maps directly to PatientSettings
  const notifPrefs: { key: keyof typeof patientSettings; label: string; sub: string }[] = [
    { key: 'medicationReminders', label: 'Medication Reminders', sub: 'Get notified 15 min before each dose' },
    { key: 'missedDoseAlerts', label: 'Missed Dose Alerts', sub: 'Alert when a dose is missed' },
    { key: 'doctorMessages', label: 'Doctor Messages', sub: 'Notifications from your doctor' },
    { key: 'aiReportReady', label: 'AI Report Ready', sub: 'When AI finishes analysing your report' },
    { key: 'weeklyAdherenceReport', label: 'Weekly Adherence Report', sub: 'Summary of your weekly medication intake' },
    { key: 'streakMilestones', label: 'Streak Milestones', sub: 'Celebrate your medication streaks!' },
  ];

  return (
    <>
      {/* Header */}
      <View style={[ph.header, { backgroundColor: isDark ? '#052e2e' : '#064E4E' }]}>
        {loading ? (
          <ActivityIndicator color="white" size="small" />
        ) : (
          <>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <View style={ph.avatar}>
                <Text style={ph.avatarTxt}>{user?.name?.split(' ').map((n: string) => n[0]).join('') || 'U'}</Text>
                <View style={ph.editBtn}><Text style={{ fontSize: 10 }}>✏️</Text></View>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={ph.name}>{user?.name || 'Patient'}</Text>
                <Text style={ph.email}>{user?.email || ''} · Patient</Text>
                <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}</Text>
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
              {[
                `🩸 ${user?.bloodType || 'Unknown'}`,
                user?.allergies && user.allergies.length > 0 ? `⚠️ ${user.allergies[0]}` : '',
                `🆔 ${user?._id?.substring(0, 12) || 'N/A'}`,
              ].filter(Boolean).map(c => (
                <View key={c} style={ph.chip}><Text style={ph.chipTxt}>{c}</Text></View>
              ))}
            </View>
            <View style={ph.statsRow}>
              {[['❤️', '--', 'Health'], ['✅', '--%', 'Adherence'], ['🔥', '0d', 'Streak'], ['💊', '0', 'Medicines']].map(([ic, v, l]) => (
                <View key={l} style={ph.statItem}>
                  <Text style={{ fontSize: 16 }}>{ic}</Text>
                  <Text style={ph.statVal} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>{v}</Text>
                  <Text style={ph.statLbl} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>{l}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      <TabBar tabs={tabs} active={tab} onSelect={(k) => setTab(k as Tab)} accent={accent} />

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[accent]} />}>

        {tab === 'profile' && (
          <Card>
            <CardHeader title="Personal Information" />
            <View style={{ padding: 16 }}>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[ft.label, { color: colors.textMuted }]}>First Name</Text>
                  <TextInput style={[ft.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]} value={firstName} onChangeText={setFirstName} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ft.label, { color: colors.textMuted }]}>Last Name</Text>
                  <TextInput style={[ft.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]} value={lastName} onChangeText={setLastName} />
                </View>
              </View>
              <Field label="Email" value={user?.email || ''} colors={colors} />
              <Field label="Phone" value={phone} onChange={setPhone} colors={colors} />
              <Field label="Address" value={address} onChange={setAddress} colors={colors} />
              <Button label={saving ? 'Saving...' : 'Save Changes'} onPress={handleSaveProfile} disabled={saving} />
            </View>
          </Card>
        )}

        {tab === 'health' && (
          <Card>
            <CardHeader title="🩺 Medical Details" />
            <View style={{ padding: 16 }}>
              <Text style={[ft.label, { color: colors.textMuted }]}>Blood Type</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
                {bloodTypes.map(b => (
                  <TouchableOpacity key={b} onPress={() => setBloodType(b)}
                    style={[ft.chip, { backgroundColor: bloodType === b ? accent : colors.bgPage, borderColor: bloodType === b ? accent : colors.border }]}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: bloodType === b ? 'white' : colors.textMuted }}>{b}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 10, marginBottom: 14 }}>
                <View style={{ flex: 1 }}>
                  <Text style={[ft.label, { color: colors.textMuted }]}>Height (cm)</Text>
                  <TextInput style={[ft.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]} value={height} onChangeText={setHeight} keyboardType="numeric" placeholder="e.g. 170" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[ft.label, { color: colors.textMuted }]}>Weight (kg)</Text>
                  <TextInput style={[ft.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]} value={weight} onChangeText={setWeight} keyboardType="numeric" placeholder="e.g. 65" />
                </View>
              </View>
              <Field label="Allergies" value={allergies} onChange={setAllergies} colors={colors} />
              <Field label="Conditions" value={conditions} onChange={setConditions} colors={colors} />
              <View style={{ marginBottom: 14 }}>
                <Text style={[ft.label, { color: colors.textMuted }]}>Emergency Contact</Text>
                <TextInput style={[ft.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary, marginBottom: 8 }]} value={emergencyName} onChangeText={setEmergencyName} placeholder="Contact name" placeholderTextColor={colors.textFaint} />
                <TextInput style={[ft.input, { backgroundColor: colors.bgPage, borderColor: colors.border, color: colors.textPrimary }]} value={emergencyPhone} onChangeText={setEmergencyPhone} placeholder="Contact phone" keyboardType="phone-pad" placeholderTextColor={colors.textFaint} />
              </View>
              <Button label={saving ? 'Saving...' : 'Save Health Info'} onPress={handleSaveHealth} disabled={saving} />
            </View>
          </Card>
        )}

        {tab === 'notifications' && (
          <Card>
            <CardHeader title="🔔 Notification Preferences" />
            <View style={{ padding: 16 }}>
              {notifPrefs.map((pref, i) => (
                <PrefRow
                  key={pref.key}
                  label={pref.label}
                  sub={pref.sub}
                  value={patientSettings[pref.key]}
                  onToggle={() => togglePatientSetting(pref.key)}
                  accent={accent}
                  colors={colors}
                  isLast={i === notifPrefs.length - 1}
                />
              ))}
            </View>
          </Card>
        )}

        {tab === 'security' && (
          <>
            <Card>
              <CardHeader title="🔑 Change Password" />
              <View style={{ padding: 16 }}>
                <Field label="Current Password" value={currentPassword} onChange={setCurrentPassword} secure colors={colors} />
                <Field label="New Password" value={newPassword} onChange={setNewPassword} secure colors={colors} />
                <Field label="Confirm Password" value={confirmPassword} onChange={setConfirmPassword} secure colors={colors} />
                <Button label={saving ? 'Updating...' : 'Update Password'} onPress={handleChangePassword} disabled={saving} />
              </View>
            </Card>
            <Card style={{ marginTop: 0 }}>
              <CardHeader title="🚪 Logout" />
              <View style={{ padding: 16 }}>
                <Button label="Logout" onPress={handleLogout} variant="danger" style={{ width: '100%' }} />
              </View>
            </Card>
            <Card style={{ marginTop: 0 }}>
              <CardHeader title="⚠️ Danger Zone" />
              <View style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}>
                <View style={{ flex: 1, marginRight: 12 }}>
                  <Text style={{ fontWeight: '600', fontSize: 14, color: colors.textPrimary }}>Delete Account</Text>
                  <Text style={{ fontSize: 12, color: colors.textFaint, marginTop: 2 }}>Permanently delete your account and all data.</Text>
                </View>
                <Button label="Delete" onPress={() => Alert.alert('Are you sure?')} variant="danger" size="sm" />
              </View>
            </Card>
          </>
        )}
      </ScrollView>
    </>
  );
}

/* ═══════════════════ ROOT EXPORT ═══════════════════════════════════ */
export default function ProfileScreen() {
  const { role, colors, userName, userInitial } = useTheme();
  const isDoctor = role === 'doctor';
  return (
    <DrawerLayout
      title="Profile & Settings"
      subtitle={isDoctor ? 'Doctor Account' : 'Patient Account'}
      role={role}
      userName={userName}
      userInitial={userInitial}
      showBack
    >
      <View style={{ flex: 1, backgroundColor: colors.bgPage }}>
        {isDoctor ? <DoctorProfile /> : <PatientProfile />}
      </View>
    </DrawerLayout>
  );
}

/* ── Doctor header styles ─────────────────────────────────────────── */
const dh = StyleSheet.create({
  header: { padding: 20, paddingBottom: 20 },
  avatar: { width: 60, height: 60, borderRadius: 30, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)' },
  name: { fontSize: 20, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  spec: { fontSize: 13, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  hosp: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 1 },
  chip: { backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  chipTxt: { fontSize: 11, color: 'white', fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, padding: 14 },
  statItem: { flex: 1, alignItems: 'center', paddingHorizontal: 2 },
  statVal: { fontSize: 18, fontWeight: '900', color: 'white' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2, textAlign: 'center', width: '100%' },
});

/* ── Patient header styles ────────────────────────────────────────── */
const ph = StyleSheet.create({
  header: { padding: 20, paddingBottom: 20 },
  avatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.35)', position: 'relative' },
  avatarTxt: { fontSize: 22, fontWeight: '900', color: 'white' },
  editBtn: { position: 'absolute', bottom: 0, right: 0, width: 22, height: 22, borderRadius: 11, backgroundColor: 'white', alignItems: 'center', justifyContent: 'center' },
  name: { fontSize: 20, fontWeight: '900', color: 'white', letterSpacing: -0.5 },
  email: { fontSize: 12, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  chip: { backgroundColor: 'rgba(255,255,255,0.12)', paddingVertical: 5, paddingHorizontal: 11, borderRadius: 20 },
  chipTxt: { fontSize: 11, color: 'white', fontWeight: '600' },
  statsRow: { flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.25)', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 6 },
  statItem: { flex: 1, alignItems: 'center', gap: 2, paddingHorizontal: 2 },
  statVal: { fontSize: 15, fontWeight: '900', color: 'white' },
  statLbl: { fontSize: 10, color: 'rgba(255,255,255,0.5)', textAlign: 'center', width: '100%' },
});

/* ── Shared form + tab styles ─────────────────────────────────────── */
const ft = StyleSheet.create({
  tabRow: { borderBottomWidth: 1, minHeight: 48 },
  tab: { paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: 2.5, borderBottomColor: 'transparent', marginRight: 2 },
  tabTxt: { fontSize: 12, fontWeight: '600' },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 10, paddingVertical: 11, paddingHorizontal: 14, fontSize: 14 },
  chip: { paddingVertical: 6, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  prefRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 14 },
});
