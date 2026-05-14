import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { fetchSettings, updateSetting } from '@/services/db';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { pickAndUploadImage, takeAndUploadPhoto } from '@/services/storage';

const SETTINGS_CONFIG = [
  { key: 'whatsapp_number', label: 'رقم الواتساب', icon: 'chat', placeholder: '9647743633844', hint: 'بدون علامة + وبدون مسافات' },
  { key: 'whatsapp_default_message', label: 'الرسالة الافتراضية', icon: 'message', placeholder: 'مرحبا، أريد الاستفسار...', hint: '' },
  { key: 'phone', label: 'رقم الهاتف للعرض', icon: 'phone', placeholder: '+964 774 363 3844', hint: '' },
  { key: 'email', label: 'البريد الإلكتروني', icon: 'email', placeholder: 'jaddidha@gmail.com', hint: '' },
  { key: 'location', label: 'الموقع', icon: 'location-on', placeholder: 'بغداد، العراق', hint: '' },
  { key: 'working_hours', label: 'أوقات العمل', icon: 'access-time', placeholder: 'السبت - الخميس: 8ص - 6م', hint: '' },
];

const IMAGE_SETTINGS = [
  { key: 'hero_image', label: 'صورة الواجهة الرئيسية', icon: 'photo', hint: 'الصورة الكبيرة في الصفحة الرئيسية' },
  { key: 'logo_image', label: 'صورة الشعار (اللوغو)', icon: 'image', hint: 'شعار التطبيق' },
  { key: 'about_image', label: 'صورة صفحة "عن التطبيق"', icon: 'business', hint: 'صورة صفحة التعريف بالمتجر' },
];

type TabType = 'contact' | 'images';

export default function AdminSettingsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshSettings } = useApp();
  const { showAlert } = useAlert();
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [uploading, setUploading] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('contact');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchSettings();
      setSettings(data);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (key: string) => {
    try {
      setSaving(key);
      await updateSetting(key, settings[key] || '');
      await refreshSettings();
      showAlert('تم الحفظ', 'تم تحديث الإعداد بنجاح');
    } catch (e) {
      showAlert('خطأ', 'حصل مشكلة أثناء الحفظ');
    } finally {
      setSaving(null);
    }
  };

  const handleUploadImage = async (key: string, source: 'gallery' | 'camera') => {
    setUploading(key);
    try {
      const url = source === 'gallery' ? await pickAndUploadImage() : await takeAndUploadPhoto();
      if (url) {
        setSettings((prev) => ({ ...prev, [key]: url }));
        await updateSetting(key, url);
        await refreshSettings();
        showAlert('تم الرفع', 'تم تحديث الصورة بنجاح');
      }
    } catch (e) {
      showAlert('خطأ', 'حصل مشكلة أثناء رفع الصورة');
    } finally {
      setUploading(null);
    }
  };

  const handleRemoveImage = async (key: string) => {
    setSettings((prev) => ({ ...prev, [key]: '' }));
    await updateSetting(key, '');
    await refreshSettings();
  };

  const ADMIN_MENU = [
    { label: 'المنتجات', icon: 'inventory', route: '/admin/products' },
    { label: 'الإعدادات', icon: 'settings', route: '/admin/settings', active: true },
    { label: 'الصور', icon: 'photo-library', route: '/admin/images' },
    { label: 'طلبات القطع', icon: 'receipt-long', route: '/admin/requests' },
    { label: 'الإشعارات', icon: 'notifications', route: '/admin/notifications' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/admin/products')}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إعدادات المتجر</Text>
          <MaterialIcons name="settings" size={22} color={Colors.orange} />
        </View>

        {/* Nav tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navTabs}>
          {ADMIN_MENU.map((m) => (
            <TouchableOpacity
              key={m.route}
              style={[styles.navTab, m.active && styles.navTabActive]}
              onPress={() => router.push(m.route as any)}
            >
              <MaterialIcons name={m.icon as any} size={16} color={m.active ? '#000' : Colors.textSecondary} />
              <Text style={[styles.navTabText, m.active && styles.navTabTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Section Tabs */}
        <View style={styles.sectionTabs}>
          <TouchableOpacity
            style={[styles.sectionTab, activeTab === 'images' && styles.sectionTabActive]}
            onPress={() => setActiveTab('images')}
          >
            <MaterialIcons name="photo" size={16} color={activeTab === 'images' ? '#000' : Colors.textSecondary} />
            <Text style={[styles.sectionTabText, activeTab === 'images' && styles.sectionTabTextActive]}>الصور</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.sectionTab, activeTab === 'contact' && styles.sectionTabActive]}
            onPress={() => setActiveTab('contact')}
          >
            <MaterialIcons name="contact-phone" size={16} color={activeTab === 'contact' ? '#000' : Colors.textSecondary} />
            <Text style={[styles.sectionTabText, activeTab === 'contact' && styles.sectionTabTextActive]}>بيانات التواصل</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.goldLine} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        >
          {/* ===================== CONTACT SETTINGS ===================== */}
          {activeTab === 'contact' ? (
            <>
              {SETTINGS_CONFIG.map((cfg) => (
                <View key={cfg.key} style={styles.settingCard}>
                  <View style={styles.settingHeader}>
                    <TouchableOpacity
                      style={[styles.saveBtn, saving === cfg.key && styles.saveBtnDisabled]}
                      onPress={() => handleSave(cfg.key)}
                      disabled={saving === cfg.key}
                    >
                      {saving === cfg.key ? (
                        <ActivityIndicator size="small" color={Colors.gold} />
                      ) : (
                        <Text style={styles.saveBtnText}>حفظ</Text>
                      )}
                    </TouchableOpacity>
                    <View style={styles.settingLabelWrap}>
                      <Text style={styles.settingLabel}>{cfg.label}</Text>
                      {cfg.hint ? <Text style={styles.settingHint}>{cfg.hint}</Text> : null}
                    </View>
                    <View style={styles.settingIconWrap}>
                      <MaterialIcons name={cfg.icon as any} size={18} color={Colors.gold} />
                    </View>
                  </View>
                  <View style={styles.inputWrap}>
                    <TextInput
                      style={styles.input}
                      value={settings[cfg.key] || ''}
                      onChangeText={(val) => setSettings((prev) => ({ ...prev, [cfg.key]: val }))}
                      placeholder={cfg.placeholder}
                      placeholderTextColor={Colors.textMuted}
                      textAlign="right"
                      writingDirection="rtl"
                    />
                  </View>
                </View>
              ))}
            </>
          ) : null}

          {/* ===================== IMAGE SETTINGS ===================== */}
          {activeTab === 'images' ? (
            <>
              <View style={styles.imageHint}>
                <MaterialIcons name="info-outline" size={16} color={Colors.orange} />
                <Text style={styles.imageHintText}>
                  الصور تُحدَّث فوراً على جميع أجهزة المستخدمين بدون تحديث التطبيق
                </Text>
              </View>

              {IMAGE_SETTINGS.map((img) => (
                <View key={img.key} style={styles.imageCard}>
                  <View style={styles.imageCardHeader}>
                    <View style={styles.imageIconWrap}>
                      <MaterialIcons name={img.icon as any} size={18} color={Colors.orange} />
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.imageLabel}>{img.label}</Text>
                      <Text style={styles.imageHintSmall}>{img.hint}</Text>
                    </View>
                  </View>

                  {/* Image preview */}
                  {settings[img.key] ? (
                    <View style={styles.imagePreviewWrap}>
                      <Image
                        source={{ uri: settings[img.key] }}
                        style={styles.imagePreview}
                        contentFit="cover"
                        transition={200}
                      />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.6)']}
                        style={styles.imagePreviewGradient}
                      />
                      <TouchableOpacity
                        style={styles.removeImageBtn}
                        onPress={() => handleRemoveImage(img.key)}
                      >
                        <MaterialIcons name="delete" size={16} color="#fff" />
                        <Text style={styles.removeImageText}>حذف الصورة</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    <View style={styles.imagePlaceholder}>
                      <MaterialIcons name="image" size={40} color={Colors.darkBorderLight} />
                      <Text style={styles.imagePlaceholderText}>لا توجد صورة</Text>
                    </View>
                  )}

                  {/* Upload buttons */}
                  <View style={styles.imageActions}>
                    <TouchableOpacity
                      style={styles.imageActionBtn}
                      onPress={() => handleUploadImage(img.key, 'gallery')}
                      disabled={uploading === img.key}
                    >
                      {uploading === img.key ? (
                        <ActivityIndicator size="small" color={Colors.gold} />
                      ) : (
                        <>
                          <MaterialIcons name="photo-library" size={18} color={Colors.gold} />
                          <Text style={styles.imageActionText}>من المعرض</Text>
                        </>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.imageActionBtn, { borderColor: Colors.orange + '40' }]}
                      onPress={() => handleUploadImage(img.key, 'camera')}
                      disabled={uploading === img.key}
                    >
                      <MaterialIcons name="camera-alt" size={18} color={Colors.orange} />
                      <Text style={[styles.imageActionText, { color: Colors.orange }]}>الكاميرا</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Manual URL */}
                  <View style={styles.urlRow}>
                    <Text style={styles.urlLabel}>أو ضع رابط URL:</Text>
                    <View style={styles.urlInputWrap}>
                      <TextInput
                        style={styles.urlInput}
                        value={settings[img.key] || ''}
                        onChangeText={(val) => setSettings((prev) => ({ ...prev, [img.key]: val }))}
                        placeholder="https://..."
                        placeholderTextColor={Colors.textMuted}
                        textAlign="right"
                        writingDirection="rtl"
                      />
                      <TouchableOpacity
                        style={styles.urlSaveBtn}
                        onPress={() => handleSave(img.key)}
                        disabled={saving === img.key}
                      >
                        {saving === img.key ? (
                          <ActivityIndicator size="small" color="#000" />
                        ) : (
                          <Text style={styles.urlSaveBtnText}>حفظ</Text>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              ))}
            </>
          ) : null}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: Spacing.md, paddingBottom: 0 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  navTabs: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  navTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.darkBorderLight, backgroundColor: Colors.darkCard,
  },
  navTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  navTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  navTabTextActive: { color: '#000', fontWeight: FontWeight.bold },

  sectionTabs: { flexDirection: 'row', gap: 8, paddingBottom: 10, justifyContent: 'flex-end' },
  sectionTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.darkBorderLight, backgroundColor: Colors.darkSurface,
  },
  sectionTabActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  sectionTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  sectionTabTextActive: { color: '#000', fontWeight: FontWeight.bold },

  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: 12 },

  // Contact settings
  settingCard: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 14, gap: 10,
  },
  settingHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  settingLabelWrap: { flex: 1, alignItems: 'flex-end', marginRight: 10 },
  settingLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  settingHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  settingIconWrap: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.08)', borderWidth: 1, borderColor: Colors.goldMuted + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  saveBtn: { backgroundColor: Colors.gold, borderRadius: BorderRadius.full, paddingHorizontal: 16, paddingVertical: 7, minWidth: 60, alignItems: 'center' },
  saveBtnDisabled: { backgroundColor: Colors.darkSurface },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000', writingDirection: 'rtl' },
  inputWrap: {
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    paddingHorizontal: 12, height: 46, justifyContent: 'center',
  },
  input: { color: Colors.textPrimary, fontSize: FontSize.sm, writingDirection: 'rtl' },

  // Image settings
  imageHint: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(232,130,12,0.08)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(232,130,12,0.2)', padding: 12,
  },
  imageHintText: { flex: 1, fontSize: FontSize.sm, color: Colors.orange, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },

  imageCard: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 14, gap: 12,
  },
  imageCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  imageIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(232,130,12,0.1)', borderWidth: 1, borderColor: 'rgba(232,130,12,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  imageLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  imageHintSmall: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },

  imagePreviewWrap: { borderRadius: BorderRadius.lg, overflow: 'hidden', height: 160, position: 'relative' },
  imagePreview: { width: '100%', height: 160 },
  imagePreviewGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 60 },
  removeImageBtn: {
    position: 'absolute', bottom: 10, left: 10,
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: BorderRadius.full,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  removeImageText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },

  imagePlaceholder: {
    height: 120, borderRadius: BorderRadius.lg, backgroundColor: Colors.darkSurface,
    borderWidth: 1, borderColor: Colors.darkBorderLight, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 8,
  },
  imagePlaceholderText: { fontSize: FontSize.sm, color: Colors.textMuted, writingDirection: 'rtl' },

  imageActions: { flexDirection: 'row', gap: 10 },
  imageActionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7,
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.goldMuted + '40', paddingVertical: 12,
  },
  imageActionText: { fontSize: FontSize.sm, color: Colors.gold, fontWeight: FontWeight.semibold, writingDirection: 'rtl' },

  urlRow: { gap: 6 },
  urlLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  urlInputWrap: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  urlInput: {
    flex: 1, backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    paddingHorizontal: 12, height: 40, color: Colors.textPrimary, fontSize: FontSize.xs, writingDirection: 'rtl',
  },
  urlSaveBtn: { backgroundColor: Colors.gold, borderRadius: BorderRadius.md, paddingHorizontal: 14, height: 40, alignItems: 'center', justifyContent: 'center' },
  urlSaveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
});
