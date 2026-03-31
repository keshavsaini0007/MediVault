import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, ColorIcon } from '../../components/UI';
import { useTheme } from '../../context/ThemeContext';
import { supportedLanguages, useLanguage } from '../../context/LanguageContext';
import { authAPI, setDemoMode, User } from '../../services/api';

type Role = 'patient' | 'doctor';
type LoginMode = 'email' | 'mobile' | 'username' | 'hospitalId';

export default function LoginScreen() {
  const router = useRouter();
  const { setUser, colors } = useTheme();
  const { language, setLanguage, t } = useLanguage();

  const [role, setRole] = useState<Role>('patient');
  const [loginMode, setLoginMode] = useState<LoginMode>('email');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const patientModes: LoginMode[] = ['email', 'mobile', 'username'];
  const doctorModes: LoginMode[]  = ['hospitalId', 'email'];
  const modes = role === 'doctor' ? doctorModes : patientModes;

  const modeLabel: Record<LoginMode, string> = {
    email: t('login.mode.email'),
    mobile: t('login.mode.mobile'),
    username: t('login.mode.username'),
    hospitalId: t('login.mode.hospitalId'),
  };

  const modeErrors: Record<LoginMode, string> = {
    email: t('login.error.enterEmail'),
    mobile: t('login.error.enterMobile'),
    username: t('login.error.enterUsername'),
    hospitalId: t('login.error.enterHospitalId'),
  };

  const handleSignIn = async () => {
    if (!identifier.trim()) {
      setError(modeErrors[loginMode]);
      return;
    }
    if (!password) {
      setError(t('login.error.enterPassword'));
      return;
    }

    setLoading(true);
    setError('');

    try {
      const loginData: { identifier?: string; password: string; role: Role; loginMode?: string } = {
        password,
        role,
      };

      if (loginMode === 'email') {
        loginData.identifier = identifier;
        loginData.loginMode = 'email';
      } else if (loginMode === 'mobile') {
        loginData.identifier = identifier;
        loginData.loginMode = 'mobile';
      } else if (loginMode === 'username') {
        loginData.identifier = identifier;
        loginData.loginMode = 'username';
      } else if (loginMode === 'hospitalId') {
        loginData.identifier = identifier;
        loginData.loginMode = 'hospitalId';
      }

      const result = await authAPI.login(loginData);
      setUser(result.user.role, result.user.name || `${result.user.firstName || ''} ${result.user.lastName || ''}`.trim());
      router.replace(result.user.role === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard');
    } catch (err) {
      const message = err instanceof Error ? err.message : t('login.error.failedDefault');
      setError(message);
      Alert.alert(t('login.error.failedTitle'), message);
    } finally {
      setLoading(false);
    }
  };

  const handleDemoAccess = async (demoRole: Role) => {
    Alert.alert(
      t('login.demo.modeTitle'),
      t('login.demo.modeBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('login.demo.continue'),
          onPress: async () => {
            const demoUser: User = {
              name: demoRole === 'doctor' ? 'Dr. Demo User' : 'Demo Patient',
              email: demoRole === 'doctor' ? 'demo@hospital.com' : 'demo@patient.com',
              role: demoRole,
              bloodType: 'O+',
              allergies: [],
            };
            await setDemoMode(true);
            setUser(demoRole, demoUser.name, demoUser);
            router.replace(demoRole === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard');
          },
        },
      ]
    );
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[ls.container, { backgroundColor: colors.bgPage }]} contentContainerStyle={ls.inner} keyboardShouldPersistTaps="handled">

        {/* Premium Header */}
        <View style={[ls.header, { backgroundColor: colors.primary }]}>
          <View style={ls.headerGlow} />
          <View style={[ls.logoBox, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
            <Ionicons name="medical" size={32} color="white" />
          </View>
          <Text style={ls.brand}>MediVault</Text>
          <Text style={ls.brandSub}> {t('login.brandSub')} </Text>
          <View style={ls.headerCurve} />
        </View>

        <View style={[ls.formCard, { paddingTop: 50, backgroundColor: colors.bgCard }]}>
          <View style={ls.langRow}>
            <Text style={[ls.langLabel, { color: colors.textMuted }]}>{t('common.language')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={ls.langList}>
              {supportedLanguages.map((item) => (
                <TouchableOpacity
                  key={item.code}
                  onPress={() => setLanguage(item.code)}
                  style={[
                    ls.langChip,
                    {
                      borderColor: language === item.code ? colors.primary : colors.border,
                      backgroundColor: language === item.code ? colors.primarySoft : colors.bgCard,
                    },
                  ]}
                >
                  <Text style={{ color: language === item.code ? colors.primary : colors.textMuted, fontSize: 11, fontWeight: '700' }}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <Text style={[ls.title, { color: colors.textPrimary }]}>{t('login.title')}</Text>
          <Text style={[ls.subtitle, { color: colors.textMuted }]}>{t('login.subtitle')}</Text>

          {/* Role Picker */}
          <View style={ls.roleRow}>
            {(['patient', 'doctor'] as Role[]).map(r => (
              <RoleButton 
                key={r} 
                role={r} 
                label={r === 'patient' ? t('common.patient') : t('common.doctor')}
                selected={role === r} 
                colors={colors}
                onPress={() => { setRole(r); setLoginMode(r === 'doctor' ? 'hospitalId' : 'email'); setError(''); }}
              />
            ))}
          </View>

          {/* Login Mode Tabs */}
          <View style={[ls.modeTabs, { borderBottomColor: colors.border }]}>
            {modes.map(m => (
              <TouchableOpacity key={m} onPress={() => { setLoginMode(m); setError(''); }} activeOpacity={0.7}
                style={[ls.modeTab, loginMode === m && { borderBottomColor: colors.primary }]}>
                <Text style={[ls.modeTabText, { color: loginMode === m ? colors.primary : colors.textFaint }]}>{modeLabel[m]}</Text>
              </TouchableOpacity>
            ))}
          </View>

        {/* Primary Field */}
        <View style={ls.inputGroup}>
          {loginMode === 'email' && (
            <>
              <Text style={[ls.label, { color: colors.textMuted }]}>{t('login.field.email')}</Text>
              <TextInput style={[ls.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder={role === 'doctor' ? 'doctor@hospital.com' : 'you@example.com'} value={identifier} onChangeText={setIdentifier} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textFaint} />
            </>
          )}
          {loginMode === 'mobile' && (
            <>
              <Text style={[ls.label, { color: colors.textMuted }]}>{t('login.field.mobile')}</Text>
              <TextInput style={[ls.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="+91 98765 43210" value={identifier} onChangeText={setIdentifier} keyboardType="phone-pad" placeholderTextColor={colors.textFaint} />
            </>
          )}
          {loginMode === 'username' && (
            <>
              <Text style={[ls.label, { color: colors.textMuted }]}>{t('login.field.username')}</Text>
              <TextInput style={[ls.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="your_username" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" placeholderTextColor={colors.textFaint} />
            </>
          )}
          {loginMode === 'hospitalId' && (
            <>
              <Text style={[ls.label, { color: colors.textMuted }]}>{t('login.field.hospitalId')}</Text>
              <TextInput style={[ls.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="e.g. HOSP-2024-001" value={identifier} onChangeText={setIdentifier} autoCapitalize="none" placeholderTextColor={colors.textFaint} />
            </>
          )}
        </View>

        {/* Password */}
        <View style={ls.inputGroup}>
          <Text style={[ls.label, { color: colors.textMuted }]}>{t('login.field.password')}</Text>
          <TextInput style={[ls.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder={t('login.placeholder.password')} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.textFaint} />
        </View>

        {/* Error */}
        {error ? (
          <View style={[ls.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Ionicons name="warning" size={14} color={colors.danger} />
              <Text style={[ls.errorText, { color: colors.danger }]}>{error}</Text>
            </View>
          </View>
        ) : null}

          {/* Sign In */}
          <Button label={loading ? t('login.button.signingIn') : t('login.button.signInAs', { role: role === 'doctor' ? t('common.doctor') : t('common.patient') })} onPress={handleSignIn} disabled={loading} size="lg" style={{ marginTop: 8 }} />
        </View>

        {/* Demo shortcuts */}
        <View style={[ls.demoBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
          <Text style={[ls.demoLabel, { color: colors.primary }]}>{t('login.demo.quickAccess')}</Text>
          <View style={ls.demoRow}>
            <Button label={t('common.doctor')} onPress={() => handleDemoAccess('doctor')} variant="outline" size="sm" style={{ flex: 1, marginRight: 8 }} />
            <Button label={t('common.patient')} onPress={() => handleDemoAccess('patient')} variant="outline" size="sm" style={{ flex: 1 }} />
          </View>
        </View>

        {/* Register */}
        <TouchableOpacity onPress={() => router.push('/screens/Register')} style={{ marginTop: 20, alignItems: 'center' }} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            {t('login.register.prompt')}{' '}
            <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('login.register.cta')}</Text>
          </Text>
        </TouchableOpacity>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// Role Button Component
function RoleButton({ role, label, selected, colors, onPress }: { role: Role; label: string; selected: boolean; colors: any; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const animate = (toValue: number) => Animated.spring(scale, { toValue, useNativeDriver: true, tension: 200 }).start();

  return (
    <Animated.View style={[ls.roleWrapper, { transform: [{ scale }] }]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={() => animate(0.96)}
        onPressOut={() => animate(1)}
        activeOpacity={1}
        style={[
          ls.roleBtn,
          { 
            borderColor: selected ? colors.primary : colors.border, 
            backgroundColor: selected ? colors.primarySoft : colors.bgCard,
            shadowColor: colors.primary,
            shadowOpacity: selected ? 0.2 : 0.08,
          },
        ]}
      >
        <ColorIcon 
          icon={role === 'patient' ? 'person' : 'medkit'} 
          color={selected ? colors.primary : colors.textMuted} 
          bg={selected ? colors.primary : colors.primarySoft} 
          size={40} 
        />
        <Text style={[ls.roleBtnText, { color: selected ? colors.primary : colors.textMuted }]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const ls = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingBottom: 40 },
  header: { 
    marginBottom: 32, 
    paddingTop: 50, 
    paddingBottom: 60, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    alignItems: 'center',
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -50,
    left: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerCurve: {
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
    height: 20,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  logoBox: { 
    width: 70, height: 70, 
    borderRadius: 24, 
    alignItems: 'center', 
    justifyContent: 'center', 
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 6,
  },
  logoText: { fontSize: 28, color: 'white', fontWeight: '800' },
  brand: { fontSize: 26, fontWeight: '900', letterSpacing: -0.5, color: 'white' },
  brandSub: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', marginTop: 4, color: 'rgba(255,255,255,0.7)' },
  title: { fontSize: 22, fontWeight: '800', letterSpacing: -0.5, marginTop: 0 },
  subtitle: { fontSize: 13, marginBottom: 24, marginTop: 4 },
  langRow: { marginTop: -30, marginBottom: 16 },
  langLabel: { fontSize: 11, fontWeight: '700', marginBottom: 8 },
  langList: { gap: 8, paddingRight: 12 },
  langChip: { paddingVertical: 6, paddingHorizontal: 10, borderWidth: 1, borderRadius: 999 },
  formCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginTop: 0,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 20,
    elevation: 6,
  },
  roleRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleWrapper: { flex: 1 },
  roleBtn: { 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    gap: 10, 
    paddingVertical: 16, 
    borderRadius: 18, 
    borderWidth: 1.5,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
  },
  roleBtnActive: {},
  roleBtnText: { fontSize: 13, fontWeight: '700' },
  modeTabs: { flexDirection: 'row', borderBottomWidth: 2, marginBottom: 20 },
  modeTab: { paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 2, borderBottomColor: 'transparent', marginBottom: -2 },
  modeTabActive: {},
  modeTabText: { fontSize: 12, fontWeight: '600' },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14 },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 12, marginBottom: 12 },
  errorText: { fontSize: 12 },
  demoBox: { marginTop: 20, padding: 16, borderRadius: 16, borderWidth: 1 },
  demoLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginBottom: 10 },
  demoRow: { flexDirection: 'row' },
});
