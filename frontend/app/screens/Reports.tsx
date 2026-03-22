import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as WebBrowser from 'expo-web-browser';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import BottomNavLayout from '@/components/BottomNavLayout';
import { Card, CardHeader, Badge, Button, IconBox } from '../../components/UI';
import { patientAPI, Report } from '../../services/api';

const reportTypes = ['X-Ray', 'Blood Test', 'MRI', 'CT Scan', 'Ultrasound', 'ECG', 'Prescription', 'Other'];

export default function ReportsScreen() {
  const { colors } = useTheme();
  const { t } = useLanguage();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [selectedType, setSelectedType] = useState('Blood Test');
  const [selectedFile, setSelectedFile] = useState<ImagePicker.ImagePickerAsset | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<{ type: string; summary?: string } | null>(null);

  const fetchReports = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const data = await patientAPI.getReports();
      setReports(data);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const onRefresh = useCallback(() => {
    fetchReports(true);
  }, [fetchReports]);

  const pickImage = async () => {
    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(t('reports.alert.permissionTitle'), t('reports.alert.permissionBody'));
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets[0]) {
        setSelectedFile(result.assets[0]);
        setShowSuccess(false);
        setUploadSuccess(null);
      }
    } catch (error) {
      Alert.alert(t('common.error'), t('reports.error.pickImage'));
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      Alert.alert(t('reports.alert.selectFileTitle'), t('reports.alert.selectFileBody'));
      return;
    }

    setUploading(true);
    setShowSuccess(false);
    setUploadSuccess(null);

    try {
      const formData = new FormData();
      formData.append('report', {
        uri: selectedFile.uri,
        type: selectedFile.mimeType || 'image/jpeg',
        name: selectedFile.fileName || `${selectedType.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}.jpg`,
      } as unknown as Blob);
      formData.append('reportType', selectedType);

      const newReport = await patientAPI.uploadReport(formData);
      setReports(prev => [newReport, ...prev]);
      setShowSuccess(true);
      setUploadSuccess({
        type: selectedType,
        summary: newReport.aiSummary || t('reports.alert.uploadedSuccessfully'),
      });
      setSelectedFile(null);
    } catch (error) {
      Alert.alert(t('reports.alert.uploadFailedTitle'), error instanceof Error ? error.message : t('reports.error.uploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleViewReport = async (report: Report) => {
    if (report.fileUrl) {
      try {
        await WebBrowser.openBrowserAsync(report.fileUrl);
      } catch (error) {
        Alert.alert(t('common.error'), t('reports.error.openFailed'));
      }
    }
  };

  const handleDeleteReport = async (reportId: string) => {
    Alert.alert(
      t('reports.alert.deleteTitle'),
      t('reports.alert.deleteBody'),
      [
        { text: t('common.cancel'), style: 'cancel' },
        {
          text: t('reports.action.delete'),
          style: 'destructive',
          onPress: async () => {
            try {
              await patientAPI.deleteReport(reportId);
              setReports(prev => prev.filter(r => r._id !== reportId));
              Alert.alert(t('med.alert.successTitle'), t('reports.alert.deleted'));
            } catch (error) {
              Alert.alert(t('common.error'), t('reports.error.deleteFailed'));
            }
          },
        },
      ]
    );
  };

  const getReportIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    const lower = type.toLowerCase();
    if (lower.includes('blood')) return 'water-outline';
    if (lower.includes('x-ray') || lower.includes('xray')) return 'image-outline';
    if (lower.includes('ultrasound')) return 'pulse-outline';
    if (lower.includes('ecg') || lower.includes('ekg')) return 'heart-outline';
    if (lower.includes('ct')) return 'scan-outline';
    if (lower.includes('mri')) return 'magnet-outline';
    if (lower.includes('prescription') || lower.includes('rx')) return 'medical-outline';
    return 'document-outline';
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <BottomNavLayout title={t('reports.title')} subtitle={t('reports.subtitle')} role="patient">
      <ScrollView
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[colors.primary]} />}
      >
        {/* Upload Card */}
        <Card variant="elevated" glowColor={colors.teal}>
          <CardHeader title={t('reports.section.upload')} icon="cloud-upload-outline" />
          <View style={{ padding: 16 }}>
            <Text style={[rp.label, { color: colors.textMuted }]}>{t('reports.field.reportType')}</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {reportTypes.map(t => (
                <TouchableOpacity
                  key={t}
                  onPress={() => setSelectedType(t)}
                  activeOpacity={0.7}
                  style={[
                    rp.typeChip,
                    { borderColor: selectedType === t ? colors.teal : colors.border, backgroundColor: selectedType === t ? colors.tealSoft : colors.bgPage },
                  ]}
                >
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name={getReportIcon(t)} size={16} color={selectedType === t ? colors.teal : colors.textMuted} />
                    <Text style={[rp.typeChipText, { color: selectedType === t ? colors.teal : colors.textMuted }]}>
                      {t}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Drop zone */}
            <TouchableOpacity style={[rp.dropZone, { borderColor: selectedFile ? colors.success : colors.tealSoft, backgroundColor: selectedFile ? colors.successSoft : colors.bgPage }]} activeOpacity={0.7} onPress={pickImage}>
              {selectedFile ? (
                <View style={{ alignItems: 'center' }}>
                  <IconBox icon="checkmark-circle" color={colors.success} bg={colors.successSoft} size={52} />
                  <Text style={[rp.dropText, { color: colors.textPrimary, marginTop: 10 }]}>{t('reports.fileSelected')}</Text>
                  <Text style={[rp.dropSub, { color: colors.textFaint }]}>{selectedFile.fileName || t('reports.defaultImageName')}</Text>
                  <TouchableOpacity onPress={() => setSelectedFile(null)} style={[rp.removeBtn, { backgroundColor: colors.dangerSoft }]} activeOpacity={0.7}>
                    <Text style={{ color: colors.danger, fontSize: 12, fontWeight: '600' }}>{t('reports.action.remove')}</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={{ alignItems: 'center' }}>
                  <IconBox icon="cloud-upload-outline" color={colors.teal} bg={colors.tealSoft} size={52} />
                  <Text style={[rp.dropText, { color: colors.textPrimary, marginTop: 10 }]}>{t('reports.tapToUpload')}</Text>
                  <Text style={[rp.dropSub, { color: colors.textFaint }]}>{t('reports.supportedFormats')}</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Quick upload buttons */}
            <View style={rp.quickRow}>
              {[
                { icon: 'image-outline' as const, label: 'X-Ray', bg: colors.primarySoft, color: colors.primary },
                { icon: 'pulse-outline' as const, label: 'Ultrasound', bg: colors.tealSoft, color: colors.teal },
                { icon: 'water-outline' as const, label: 'Blood Test', bg: colors.dangerSoft, color: colors.danger },
              ].map(b => (
                <TouchableOpacity
                  key={b.label}
                  style={[rp.quickBtn, { backgroundColor: b.bg }]}
                  onPress={() => {
                    setSelectedType(b.label);
                    pickImage();
                  }}
                  activeOpacity={0.7}
                >
                  <Ionicons name={b.icon} size={20} color={b.color} />
                  <Text style={[rp.quickBtnText, { color: b.color }]}>{b.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Upload button */}
            <Button
              label={uploading ? t('reports.uploadingAnalysing') : t('reports.action.uploadReport')}
              onPress={handleUpload}
              disabled={uploading || !selectedFile}
              size="lg"
              style={{ marginTop: 14, width: '100%' }}
            />

            {uploading && (
              <View style={{ alignItems: 'center', marginTop: 14 }}>
                <ActivityIndicator color={colors.teal} />
                <Text style={{ fontSize: 12, color: colors.textFaint, marginTop: 8 }}>{t('reports.aiAnalyzing')}</Text>
              </View>
            )}

            {showSuccess && uploadSuccess && (
              <View style={[rp.successBox, { backgroundColor: colors.successSoft, borderColor: colors.success + '30' }]}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <IconBox icon="checkmark-circle" color={colors.success} bg={colors.success} size={24} />
                  <Text style={[rp.successTitle, { color: colors.success }]}>{t('reports.uploadSuccessTitle')}</Text>
                </View>
                <Text style={[rp.successBody, { color: colors.success }]}>{uploadSuccess.summary}</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted, marginTop: 8 }}>
                  {t('reports.disclaimer')}
                </Text>
              </View>
            )}
          </View>
        </Card>

        {/* My Reports */}
        <Card variant="elevated" glowColor={colors.teal}>
          <CardHeader title={t('reports.section.myReports')} icon="folder-outline" right={<Badge label={`${reports.length} ${t('reports.reportsCount')}`} />} />
          <View>
            {loading ? (
              <View style={{ alignItems: 'center', padding: 30 }}>
                <ActivityIndicator color={colors.teal} />
              </View>
            ) : reports.length === 0 ? (
              <View style={{ alignItems: 'center', padding: 32 }}>
                <IconBox icon="folder-open-outline" color={colors.textFaint} bg={colors.tealSoft} size={64} />
                <Text style={{ fontWeight: '700', fontSize: 15, color: colors.textMuted, marginTop: 14 }}>{t('reports.empty.noReports')}</Text>
                <Text style={{ fontSize: 13, color: colors.textFaint, marginTop: 6 }}>{t('reports.empty.uploadFirst')}</Text>
              </View>
            ) : (
              reports.map((r, i) => (
                <View key={r._id} style={[rp.reportItem, i < reports.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.borderSoft }]}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                      <IconBox icon={getReportIcon(r.reportType)} color={colors.teal} bg={colors.tealSoft} size={46} />
                      <View>
                        <Text style={{ fontWeight: '700', fontSize: 14, color: colors.textPrimary }}>{r.reportType}</Text>
                        <Text style={{ fontSize: 12, color: colors.textFaint, marginTop: 3 }}>
                          {formatDate(r.createdAt)} - {formatFileSize(r.size)}
                        </Text>
                        <Text style={{ fontSize: 11, color: colors.textFaint }} numberOfLines={1}>
                          {r.originalName}
                        </Text>
                      </View>
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                      <TouchableOpacity onPress={() => handleDeleteReport(r._id)} activeOpacity={0.7}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                      </TouchableOpacity>
                      <Button label={t('common.view')} onPress={() => handleViewReport(r)} size="sm" />
                    </View>
                  </View>
                  {r.aiSummary && (
                    <View style={[rp.aiBox, { backgroundColor: colors.bgPage, borderLeftColor: colors.teal }]}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <Ionicons name="bulb-outline" size={16} color={colors.teal} />
                        <Text style={[rp.aiLabel, { color: colors.teal }]}>{t('reports.aiSummary')}</Text>
                      </View>
                      <Text style={[rp.aiText, { color: colors.textMuted }]}>{r.aiSummary}</Text>
                    </View>
                  )}
                </View>
              ))
            )}
          </View>
        </Card>
      </ScrollView>
    </BottomNavLayout>
  );
}

const rp = StyleSheet.create({
  label: { fontSize: 12, fontWeight: '600', marginBottom: 10 },
  typeChip: { paddingVertical: 10, paddingHorizontal: 16, borderRadius: 22, borderWidth: 1.5, marginRight: 10 },
  typeChipActive: {},
  typeChipText: { fontSize: 12, fontWeight: '600' },
  dropZone: { borderWidth: 2, borderStyle: 'dashed', borderRadius: 20, padding: 28, alignItems: 'center', marginBottom: 16 },
  dropText: { fontSize: 15, fontWeight: '600' },
  dropSub: { fontSize: 12, marginTop: 6 },
  removeBtn: { marginTop: 12, paddingVertical: 6, paddingHorizontal: 14, borderRadius: 14 },
  quickRow: { flexDirection: 'row', gap: 12, marginBottom: 6 },
  quickBtn: { flex: 1, padding: 12, borderRadius: 16, alignItems: 'center', gap: 6 },
  quickBtnText: { fontSize: 11, fontWeight: '600' },
  successBox: { marginTop: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  successTitle: { fontSize: 14, fontWeight: '700' },
  successBody: { fontSize: 13, fontWeight: '500' },
  reportItem: { padding: 18 },
  reportBorder: {},
  reportIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  aiBox: { borderRadius: 14, padding: 14, borderLeftWidth: 3 },
  aiLabel: { fontSize: 10, fontWeight: '700' },
  aiText: { fontSize: 12, lineHeight: 20 },
});
