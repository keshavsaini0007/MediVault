import React, { useState, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, KeyboardAvoidingView, Platform, Alert, Animated,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, ProgressBar, ColorIcon } from '../../components/UI';
import { authAPI } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';

type Role = 'patient' | 'doctor';

export default function RegisterScreen() {
  const router = useRouter();
  const { setUser, colors } = useTheme();
  const { t } = useLanguage();
  const [role, setRole] = useState<Role>('patient');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [username, setUsername] = useState('');
  const [hospitalId, setHospitalId] = useState('');
  const [bloodType, setBloodType] = useState('O+');
  const [allergies, setAllergies] = useState('');
  const [spec, setSpec] = useState('General Physician');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  // Clear validation errors when step or role changes
  React.useEffect(() => {
    setValidationErrors([]);
  }, [step, role]);

  const steps = [
    { n: 1, label: t('register.step.chooseRole') },
    { n: 2, label: t('register.step.personalInfo') },
    { n: 3, label: t('register.step.healthProfile') },
  ];

  const handleNextFromStep2 = () => {
    const trimmedFirstName = firstName?.trim() || '';
    const trimmedLastName = lastName?.trim() || '';
    const trimmedEmail = email?.trim() || '';
    const trimmedHospitalId = hospitalId?.trim() || '';
    
    if (!trimmedFirstName || !trimmedLastName || !trimmedEmail) {
      Alert.alert(t('register.alert.missingFieldsTitle'), t('register.alert.missingFieldsBody'));
      return;
    }
    if (role === 'doctor' && !trimmedHospitalId) {
      Alert.alert(t('register.alert.missingFieldsTitle'), t('register.alert.hospitalIdRequired'));
      return;
    }
    setValidationErrors([]);
    setStep(3);
  };

  const handleSubmit = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      Alert.alert(t('register.alert.errorTitle'), t('register.alert.fillRequired'));
      return;
    }
    if (password !== confirm) {
      Alert.alert(t('register.alert.errorTitle'), t('register.alert.passwordMismatch'));
      return;
    }
    if (password.length < 8) {
      Alert.alert(t('register.alert.errorTitle'), t('register.alert.passwordMin'));
      return;
    }
    if (role === 'doctor' && !hospitalId.trim()) {
      Alert.alert(t('register.alert.errorTitle'), t('register.alert.hospitalIdDoctor'));
      return;
    }

    setLoading(true);
    try {
      const registerData: Parameters<typeof authAPI.register>[0] = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim(),
        password,
        role,
      };

      if (username.trim()) registerData.username = username.trim();
      if (phone.trim()) registerData.phone = phone.trim();
      if (role === 'doctor') {
        if (hospitalId.trim()) registerData.hospitalId = hospitalId.trim();
        if (spec) registerData.specialization = spec;
      } else {
        if (bloodType) registerData.bloodType = bloodType;
        if (allergies.trim()) {
          registerData.allergies = allergies.split(',').map(a => a.trim()).filter(Boolean);
        }
      }

      // Try to register, fallback to demo mode if backend not available
      try {
        const result = await authAPI.register(registerData);
        setUser(result.user.role, result.user.name || `${firstName} ${lastName}`.trim());
        router.replace(result.user.role === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard');
      } catch (apiError) {
        // Fallback: Use demo mode when backend not available
        console.log('Using demo mode - backend not available');
        setUser(role, `${firstName} ${lastName}`.trim());
        router.replace(role === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard');
      }
    } catch (err) {
      // Fallback: Use demo mode on any error
      console.log('Registration error, using demo mode:', err);
      setUser(role, `${firstName} ${lastName}`.trim());
      router.replace(role === 'doctor' ? '/screens/DoctorDashboard' : '/screens/PatientDashboard');
    } finally {
      setLoading(false);
    }
  };

  const bloodTypes = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'];
  const specialisations = ['General Physician', 'Cardiologist', 'Neurologist', 'Orthopedic', 'Pediatrician', 'Dermatologist'];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView style={[rg.container, { backgroundColor: colors.bgPage }]} contentContainerStyle={rg.inner} keyboardShouldPersistTaps="handled">

        {/* Premium Header */}
        <View style={[rg.header, { backgroundColor: colors.primary }]}>
          <View style={rg.headerGlow} />
          <View style={rg.headerContent}>
            <TouchableOpacity onPress={() => router.back()} style={rg.backBtn} activeOpacity={0.7}>
              <Ionicons name="chevron-back" size={20} color="white" />
            </TouchableOpacity>
            <View style={rg.headerText}>
              <Text style={rg.headerTitle}>{t('register.button.create')}</Text>
              <Text style={rg.headerSubtitle}>{t('register.header.subtitle')}</Text>
            </View>
            <View style={[rg.stepIndicator, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
              <Text style={rg.stepIndicatorText}>{t('register.header.step')} {step}/3</Text>
            </View>
          </View>
          <View style={rg.headerCurve} />
        </View>

        {/* Progress */}
        <View style={rg.progressWrapper}>
          <ProgressBar value={(step / 3) * 100} style={{ marginBottom: 16 }} />
          <View style={rg.stepRow}>
            {steps.map(s => {
              const done = step > s.n;
              const cur  = step === s.n;
              return (
                <View key={s.n} style={rg.stepItem}>
                  <View style={[
                    rg.stepCircle,
                    done && { backgroundColor: colors.primary },
                    cur && { backgroundColor: colors.primary },
                  ]}>
                    {done ? (
                      <Ionicons name="checkmark" size={12} color="white" />
                    ) : (
                      <Text style={[rg.stepNum, { color: done || cur ? 'white' : colors.textFaint }]}>
                        {s.n}
                      </Text>
                    )}
                  </View>
                  <Text style={[rg.stepLabel, cur && { color: colors.primary, fontWeight: '700' }]}>{s.label}</Text>
                </View>
              );
            })}
          </View>
        </View>

        {/* STEP 1: Role */}
        {step === 1 && (
          <View style={rg.cardForm}>
            <Text style={[rg.cardTitle, { color: colors.textPrimary }]}>{t('register.step.chooseRole')}</Text>
            <View style={rg.roleGrid}>
              {([
                { r: 'patient' as Role, iconName: 'person' as keyof typeof Ionicons.glyphMap, label: t('common.patient'), desc: t('register.role.patientDesc'), color: colors.teal, bg: colors.tealSoft },
                { r: 'doctor' as Role, iconName: 'medkit' as keyof typeof Ionicons.glyphMap, label: t('common.doctor'), desc: t('register.role.doctorDesc'), color: colors.primary, bg: colors.primarySoft },
              ]).map(({ r, iconName, label, desc, color, bg }) => (
                <TouchableOpacity key={r} onPress={() => setRole(r)} activeOpacity={0.7}
                  style={[
                    rg.roleCard,
                    { 
                      borderColor: role === r ? color : colors.border, 
                      backgroundColor: role === r ? bg : colors.bgCard,
                      shadowColor: color,
                      shadowOpacity: role === r ? 0.2 : 0.08,
                    },
                  ]}>
                  <ColorIcon icon={iconName} color={role === r ? color : colors.textMuted} bg={role === r ? color : colors.gray100} size={56} filled={role === r} />
                  <Text style={[rg.roleLabel, { color: role === r ? color : colors.textPrimary }]}>{label}</Text>
                  <Text style={[rg.roleDesc, { color: colors.textFaint }]}>{desc}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <Button label={t('register.button.continueAs', { role: role === 'doctor' ? t('common.doctor') : t('common.patient') })} onPress={() => setStep(2)} size="lg" style={{ marginTop: 8 }} />
          </View>
        )}

        {/* STEP 2: Personal info */}
        {step === 2 && (
          <View style={[rg.cardForm, { backgroundColor: colors.bgCard, borderColor: colors.border }]}>
            <Text style={[rg.cardTitle, { color: colors.textPrimary }]}>{t('register.card.personalInfo')}</Text>
            <View style={rg.row}>
              <View style={[rg.inputGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.firstName')}</Text>
                <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Rahul" value={firstName} onChangeText={setFirstName} placeholderTextColor={colors.textFaint} />
              </View>
              <View style={[rg.inputGroup, { flex: 1 }]}>
                <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.lastName')}</Text>
                <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Singh" value={lastName} onChangeText={setLastName} placeholderTextColor={colors.textFaint} />
              </View>
            </View>
            <View style={rg.inputGroup}>
              <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.username')}</Text>
              <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="rahul_singh" value={username} onChangeText={setUsername} autoCapitalize="none" placeholderTextColor={colors.textFaint} />
            </View>
            <View style={rg.inputGroup}>
              <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.email')}</Text>
              <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="you@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.textFaint} />
            </View>
            <View style={rg.inputGroup}>
              <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.mobile')}</Text>
              <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="+91 98765 43210" value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={colors.textFaint} />
            </View>
            {role === 'doctor' && (
              <View style={rg.inputGroup}>
                <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.hospitalId')}</Text>
                <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="HOSP-2024-001" value={hospitalId} onChangeText={setHospitalId} autoCapitalize="none" placeholderTextColor={colors.textFaint} />
              </View>
            )}
            {/* Validation Errors */}
            {validationErrors.length > 0 && (
              <View style={[rg.errorBox, { backgroundColor: colors.dangerSoft, borderColor: colors.danger }]}>
                {validationErrors.map((err, idx) => (
                  <Text key={idx} style={[rg.errorText, { color: colors.danger }]}>• {err}</Text>
                ))}
              </View>
            )}
            <View style={rg.navRow}>
              <Button label={t('register.button.back')} onPress={() => { setValidationErrors([]); setStep(1); }} variant="outline" style={{ flex: 1, marginRight: 8 }} />
              <Button label={t('register.button.continue')} onPress={handleNextFromStep2} style={{ flex: 2 }} />
            </View>
          </View>
        )}

        {/* STEP 3: Health + password */}
        {step === 3 && (
          <View style={rg.cardForm}>
            <Text style={[rg.cardTitle, { color: colors.textPrimary }]}>
              {role === 'patient' ? t('register.card.healthProfile') : t('register.card.professionalDetails')}
            </Text>
            {role === 'patient' && (
              <View style={rg.row}>
                <View style={[rg.inputGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.bloodType')}</Text>
                  <View style={rg.selectWrap}>
                    {bloodTypes.map(b => (
                      <TouchableOpacity key={b} onPress={() => setBloodType(b)} activeOpacity={0.7}
                        style={[
                          rg.chip,
                          { borderColor: colors.border, backgroundColor: colors.bgCard },
                          bloodType === b && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                        ]}>
                        <Text style={[rg.chipText, { color: bloodType === b ? colors.primary : colors.textMuted }]}>{b}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                <View style={[rg.inputGroup, { flex: 1 }]}>
                  <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.allergies')}</Text>
                  <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="e.g. Penicillin" value={allergies} onChangeText={setAllergies} placeholderTextColor={colors.textFaint} />
                </View>
              </View>
            )}
            {role === 'doctor' && (
              <View style={rg.inputGroup}>
                <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.specialisation')}</Text>
                <View style={rg.selectWrap}>
                  {specialisations.map(s => (
                    <TouchableOpacity key={s} onPress={() => setSpec(s)} activeOpacity={0.7}
                      style={[
                        rg.chip,
                        { borderColor: colors.border, backgroundColor: colors.bgCard },
                        spec === s && { borderColor: colors.primary, backgroundColor: colors.primarySoft },
                      ]}>
                      <Text style={[rg.chipText, { color: spec === s ? colors.primary : colors.textMuted }]}>{s}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
            <View style={rg.inputGroup}>
              <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.password')}</Text>
              <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Min. 8 characters" value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.textFaint} />
            </View>
            <View style={rg.inputGroup}>
              <Text style={[rg.label, { color: colors.textMuted }]}>{t('register.field.confirmPassword')}</Text>
              <TextInput style={[rg.input, { backgroundColor: colors.bgCard, borderColor: colors.border, color: colors.textPrimary }]} placeholder="Repeat password" value={confirm} onChangeText={setConfirm} secureTextEntry placeholderTextColor={colors.textFaint} />
              {confirm && password !== confirm && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 }}>
                  <Ionicons name="warning" size={12} color={colors.danger} />
                  <Text style={{ fontSize: 11, color: colors.danger }}>{t('register.alert.passwordMismatch')}</Text>
                </View>
              )}
            </View>
            {/* Summary */}
            <View style={[rg.summaryBox, { backgroundColor: colors.primarySoft, borderColor: colors.primary }]}>
              <Text style={[rg.summaryTitle, { color: colors.primary }]}>{t('register.summary.title')}</Text>
              <Text style={[rg.summaryRow, { color: colors.textMuted }]}>{t('register.summary.name')}: <Text style={[rg.summaryVal, { color: colors.textPrimary }]}>{firstName} {lastName}</Text></Text>
              <Text style={[rg.summaryRow, { color: colors.textMuted }]}>{t('register.summary.role')}: <Text style={[rg.summaryVal, { color: colors.primary }]}>{role === 'doctor' ? t('common.doctor') : t('common.patient')}</Text></Text>
              {role === 'doctor' && hospitalId ? <Text style={[rg.summaryRow, { color: colors.textMuted }]}>{t('register.field.hospitalId')}: <Text style={[rg.summaryVal, { color: colors.textPrimary }]}>{hospitalId}</Text></Text> : null}
              {role === 'doctor' ? <Text style={[rg.summaryRow, { color: colors.textMuted }]}>{t('register.field.specialisation')}: <Text style={[rg.summaryVal, { color: colors.textPrimary }]}>{spec}</Text></Text> : null}
            </View>
            <View style={rg.navRow}>
              <Button label={t('register.button.back')} onPress={() => setStep(2)} variant="outline" style={{ flex: 1, marginRight: 8 }} />
              <Button label={loading ? t('register.button.creating') : t('register.button.create')} onPress={handleSubmit} disabled={loading || (!!confirm && password !== confirm)} style={{ flex: 2 }} />
            </View>
          </View>
        )}

        <TouchableOpacity onPress={() => router.push('/screens/LoginScreen')} style={{ marginTop: 24, alignItems: 'center' }} activeOpacity={0.7}>
          <Text style={{ fontSize: 13, color: colors.textMuted }}>
            {t('register.login.prompt')} <Text style={{ color: colors.primary, fontWeight: '600' }}>{t('register.login.cta')}</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const rg = StyleSheet.create({
  container: { flex: 1 },
  inner: { padding: 20, paddingBottom: 40 },
  header: { 
    marginBottom: 24, 
    paddingTop: 50, 
    paddingBottom: 40, 
    borderBottomLeftRadius: 30, 
    borderBottomRightRadius: 30,
    overflow: 'hidden',
  },
  headerGlow: {
    position: 'absolute',
    top: -30,
    right: -30,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  headerContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 20,
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
  backBtn: { 
    width: 36, height: 36, 
    borderRadius: 12, 
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', 
    justifyContent: 'center',
    marginRight: 12,
  },
  backText: { fontSize: 14, fontWeight: '600' },
  headerText: { flex: 1 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: 'white', letterSpacing: -0.3 },
  headerSubtitle: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 2 },
  stepIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  stepIndicatorText: { color: 'white', fontSize: 11, fontWeight: '700' },
  progressWrapper: { 
    backgroundColor: '#fff', 
    marginHorizontal: 20, 
    marginTop: -20,
    padding: 16, 
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 4,
  },
  stepRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  stepItem: { alignItems: 'center', gap: 6, flex: 1 },
  stepCircle: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  stepDone: {},
  stepCur: {},
  stepNum: { fontSize: 12, fontWeight: '800' },
  stepLabel: { fontSize: 10, color: '#999' },
  cardForm: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 20,
    elevation: 6,
  },
  cardTitle: { fontSize: 18, fontWeight: '800', marginBottom: 20, letterSpacing: -0.3 },
  stepDesc: { fontSize: 13, marginBottom: 20 },
  roleGrid: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  roleCard: { 
    flex: 1, 
    padding: 24, 
    borderRadius: 20, 
    borderWidth: 2, 
    alignItems: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 12,
    elevation: 4,
  },
  roleCardActive: {},
  roleLabel: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  roleDesc: { fontSize: 11, marginTop: 4, textAlign: 'center' },
  row: { flexDirection: 'row' },
  navRow: { flexDirection: 'row', marginTop: 16 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 6 },
  input: { borderWidth: 1.5, borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, fontSize: 14 },
  selectWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingVertical: 8, paddingHorizontal: 14, borderRadius: 20, borderWidth: 1.5 },
  chipActive: {},
  chipText: { fontSize: 12, fontWeight: '600' },
  summaryBox: { borderWidth: 1, borderRadius: 14, padding: 16, marginBottom: 16 },
  summaryTitle: { fontWeight: '700', marginBottom: 8, fontSize: 13 },
  summaryRow: { fontSize: 12, lineHeight: 22 },
  summaryVal: { fontWeight: '700' },
  errorBox: { borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 16 },
  errorText: { fontSize: 12, marginBottom: 4 },
});
