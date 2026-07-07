import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Modal,
  Dimensions,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import {
  fetchSettings, updateSetting,
  fetchCategories, upsertCategory, DbCategory,
  fetchTruckTypes, upsertTruckType, DbTruckType,
} from '@/services/db';
import { useApp } from '@/hooks/useApp';
import { useAlert } from '@/template';
import { getSupabaseClient } from '@/template';
import { CATEGORIES, TRUCK_TYPES } from '@/services/data';

const { width } = Dimensions.get('window');
const supabase = getSupabaseClient();

// =============================================
// TYPES
// =============================================
type TabType = 'app' | 'categories' | 'trucks';
type AspectRatio = '16:9' | '4:3' | '1:1' | '3:4' | '2:1';

interface ImageTarget {
  key: string;
  label: string;
  hint: string;
  icon: string;
  aspect: AspectRatio;
  bucket: string;
  prefix: string;
  currentUrl?: string;
  targetW: number;
  targetH: number;
}

// =============================================
// ASPECT RATIO CONFIG
// =============================================
const ASPECT_RATIOS: Record<AspectRatio, { label: string; w: number; h: number }> = {
  '16:9': { label: '16:9 - بانر أفقي', w: 16, h: 9 },
  '4:3': { label: '4:3 - صورة عادية', w: 4, h: 3 },
  '1:1': { label: '1:1 - مربع', w: 1, h: 1 },
  '3:4': { label: '3:4 - بورتريه', w: 3, h: 4 },
  '2:1': { label: '2:1 - بانر واسع', w: 2, h: 1 },
};

const APP_IMAGE_TARGETS: ImageTarget[] = [
  {
    key: 'hero_image',
    label: 'صورة الواجهة الرئيسية',
    hint: 'تظهر كخلفية كبيرة في الصفحة الرئيسية - ننصح بنسبة 16:9',
    icon: 'panorama',
    aspect: '16:9',
    bucket: 'app-images',
    prefix: 'hero',
    targetW: 1280,
    targetH: 720,
  },
  {
    key: 'logo_image',
    label: 'شعار التطبيق (اللوغو)',
    hint: 'يظهر في الهيدر والأيقونة - ننصح بمربع 1:1',
    icon: 'image',
    aspect: '1:1',
    bucket: 'app-images',
    prefix: 'logo',
    targetW: 512,
    targetH: 512,
  },
  {
    key: 'about_image',
    label: 'صورة صفحة "عن التطبيق"',
    hint: 'تظهر في صفحة التعريف بالمتجر - ننصح بنسبة 4:3',
    icon: 'business',
    aspect: '4:3',
    bucket: 'app-images',
    prefix: 'about',
    targetW: 800,
    targetH: 600,
  },
];

// =============================================
// UPLOAD HELPER
// =============================================
async function uploadToSupabase(
  base64: string,
  mimeType: string,
  bucket: string,
  prefix: string
): Promise<string | null> {
  const ext = mimeType.includes('png') ? 'png' : 'jpg';
  const fileName = `${prefix}_${Date.now()}.${ext}`;

  const byteCharacters = atob(base64);
  const byteArray = new Uint8Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteArray[i] = byteCharacters.charCodeAt(i);
  }

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, byteArray, { contentType: mimeType, upsert: false });

  if (error) throw error;
  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

// =============================================
// IMAGE EDITOR MODAL
// =============================================
interface ImageEditorProps {
  visible: boolean;
  imageUri: string;
  target: ImageTarget;
  selectedAspect: AspectRatio;
  onAspectChange: (a: AspectRatio) => void;
  onConfirm: (uri: string, base64: string) => void;
  onCancel: () => void;
  processing: boolean;
}

function ImageEditorModal({
  visible, imageUri, target, selectedAspect,
  onAspectChange, onConfirm, onCancel, processing,
}: ImageEditorProps) {
  const handleProcess = async () => {
    try {
      const ratio = ASPECT_RATIOS[selectedAspect];
      // Resize to target dimensions
      const result = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: target.targetW, height: target.targetH } }],
        { compress: 0.85, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );
      onConfirm(result.uri, result.base64 || '');
    } catch (e) {
      console.error('Manipulate error:', e);
      // Fallback: use original
      onConfirm(imageUri, '');
    }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={editorStyles.root}>
        <LinearGradient colors={['#000', '#0A0A0A']} style={editorStyles.header}>
          <TouchableOpacity onPress={onCancel} style={editorStyles.cancelBtn}>
            <MaterialIcons name="close" size={22} color={Colors.textMuted} />
          </TouchableOpacity>
          <Text style={editorStyles.title}>تحرير الصورة</Text>
          <TouchableOpacity
            style={[editorStyles.confirmBtn, processing && { opacity: 0.6 }]}
            onPress={handleProcess}
            disabled={processing}
          >
            {processing ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={editorStyles.confirmText}>تطبيق</Text>
            )}
          </TouchableOpacity>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={editorStyles.content}>
          {/* Preview */}
          <View style={editorStyles.previewContainer}>
            <Image
              source={{ uri: imageUri }}
              style={editorStyles.preview}
              contentFit="cover"
              transition={200}
            />
            <View style={editorStyles.previewBadge}>
              <MaterialIcons name="crop" size={14} color={Colors.gold} />
              <Text style={editorStyles.previewBadgeText}>معاينة</Text>
            </View>
          </View>

          {/* Aspect ratio selection */}
          <View style={editorStyles.section}>
            <Text style={editorStyles.sectionTitle}>نسبة الاقتصاص</Text>
            <View style={editorStyles.aspectGrid}>
              {(Object.keys(ASPECT_RATIOS) as AspectRatio[]).map((ar) => (
                <TouchableOpacity
                  key={ar}
                  style={[editorStyles.aspectBtn, selectedAspect === ar && editorStyles.aspectBtnActive]}
                  onPress={() => onAspectChange(ar)}
                >
                  <View style={[editorStyles.aspectThumb, {
                    width: 36 * ASPECT_RATIOS[ar].w / Math.max(ASPECT_RATIOS[ar].w, ASPECT_RATIOS[ar].h),
                    height: 36 * ASPECT_RATIOS[ar].h / Math.max(ASPECT_RATIOS[ar].w, ASPECT_RATIOS[ar].h),
                    borderColor: selectedAspect === ar ? Colors.gold : Colors.darkBorderLight,
                  }]} />
                  <Text style={[editorStyles.aspectLabel, selectedAspect === ar && { color: Colors.gold }]}>
                    {ar}
                  </Text>
                  <Text style={editorStyles.aspectDesc} numberOfLines={1}>
                    {ASPECT_RATIOS[ar].label.split(' - ')[1]}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Target info */}
          <View style={editorStyles.infoCard}>
            <MaterialIcons name="info-outline" size={16} color={Colors.orange} />
            <Text style={editorStyles.infoText}>
              سيتم تحجيم الصورة إلى {target.targetW}×{target.targetH} بكسل بجودة عالية
            </Text>
          </View>

          {/* Recommended */}
          <View style={editorStyles.recommendCard}>
            <MaterialIcons name="star" size={14} color={Colors.gold} />
            <Text style={editorStyles.recommendText}>
              الأفضل لـ{target.label}: نسبة {target.aspect}
            </Text>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const editorStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 16, paddingTop: 20, paddingBottom: 14,
  },
  cancelBtn: { padding: 8 },
  title: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary },
  confirmBtn: { backgroundColor: Colors.gold, borderRadius: BorderRadius.full, paddingHorizontal: 18, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  confirmText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
  content: { padding: 16, gap: 16 },
  previewContainer: {
    borderRadius: BorderRadius.xl, overflow: 'hidden',
    height: 220, position: 'relative',
    borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  preview: { width: '100%', height: 220 },
  previewBadge: {
    position: 'absolute', top: 10, right: 10,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: Colors.goldMuted,
  },
  previewBadgeText: { fontSize: FontSize.xs, color: Colors.gold, fontWeight: FontWeight.semibold },
  section: { gap: 10 },
  sectionTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  aspectGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'flex-end' },
  aspectBtn: {
    width: (width - 80) / 3,
    alignItems: 'center', gap: 6, padding: 12,
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  aspectBtnActive: { borderColor: Colors.gold, backgroundColor: 'rgba(212,175,55,0.1)' },
  aspectThumb: {
    borderWidth: 2, borderRadius: 4,
    backgroundColor: 'rgba(212,175,55,0.12)',
  },
  aspectLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textSecondary },
  aspectDesc: { fontSize: 10, color: Colors.textMuted, textAlign: 'center', writingDirection: 'rtl' },
  infoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(232,130,12,0.08)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(232,130,12,0.2)', padding: 12,
  },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.orange, textAlign: 'right', writingDirection: 'rtl' },
  recommendCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6,
    backgroundColor: 'rgba(212,175,55,0.06)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(212,175,55,0.15)', padding: 12,
  },
  recommendText: { fontSize: FontSize.sm, color: Colors.gold, writingDirection: 'rtl' },
});

// =============================================
// SINGLE IMAGE CARD
// =============================================
interface ImageCardProps {
  label: string;
  hint: string;
  icon: string;
  currentUrl: string;
  aspectRatio: AspectRatio;
  loading?: boolean;
  onPickGallery: () => void;
  onPickCamera: () => void;
  onUrlChange: (url: string) => void;
  onSaveUrl: () => void;
  onRemove: () => void;
  savingUrl?: boolean;
}

function ImageCard({
  label, hint, icon, currentUrl, aspectRatio,
  loading, onPickGallery, onPickCamera, onUrlChange, onSaveUrl, onRemove, savingUrl,
}: ImageCardProps) {
  const ratio = ASPECT_RATIOS[aspectRatio];
  const imgHeight = (width - 64) * ratio.h / ratio.w;
  const clampedHeight = Math.min(Math.max(imgHeight, 120), 240);

  return (
    <View style={cardStyles.card}>
      {/* Header */}
      <View style={cardStyles.cardHeader}>
        <View style={cardStyles.iconWrap}>
          <MaterialIcons name={icon as any} size={18} color={Colors.orange} />
        </View>
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={cardStyles.label}>{label}</Text>
          <Text style={cardStyles.hint}>{hint}</Text>
        </View>
      </View>

      {/* Preview */}
      {currentUrl ? (
        <View style={[cardStyles.previewWrap, { height: clampedHeight }]}>
          <Image
            source={{ uri: currentUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient colors={['transparent', 'rgba(0,0,0,0.55)']} style={StyleSheet.absoluteFill} />
          <View style={cardStyles.aspectBadge}>
            <MaterialIcons name="aspect-ratio" size={12} color={Colors.gold} />
            <Text style={cardStyles.aspectBadgeText}>{aspectRatio}</Text>
          </View>
          <TouchableOpacity style={cardStyles.removeBtn} onPress={onRemove}>
            <MaterialIcons name="delete" size={14} color="#fff" />
            <Text style={cardStyles.removeBtnText}>حذف</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={[cardStyles.placeholder, { height: 120 }]}>
          <MaterialIcons name="image" size={40} color={Colors.darkBorderLight} />
          <Text style={cardStyles.placeholderText}>لا توجد صورة</Text>
          <Text style={cardStyles.placeholderHint}>نسبة {aspectRatio}</Text>
        </View>
      )}

      {/* Upload Buttons */}
      <View style={cardStyles.actions}>
        <TouchableOpacity style={cardStyles.actionBtn} onPress={onPickGallery} disabled={loading}>
          {loading ? (
            <ActivityIndicator size="small" color={Colors.gold} />
          ) : (
            <>
              <MaterialIcons name="photo-library" size={18} color={Colors.gold} />
              <Text style={cardStyles.actionText}>من المعرض</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={[cardStyles.actionBtn, { borderColor: Colors.orange + '40' }]} onPress={onPickCamera} disabled={loading}>
          <MaterialIcons name="camera-alt" size={18} color={Colors.orange} />
          <Text style={[cardStyles.actionText, { color: Colors.orange }]}>الكاميرا</Text>
        </TouchableOpacity>
      </View>

      {/* URL Input */}
      <View style={cardStyles.urlRow}>
        <Text style={cardStyles.urlLabel}>أو ضع رابط URL مباشرة:</Text>
        <View style={cardStyles.urlInputWrap}>
          <TextInput
            style={cardStyles.urlInput}
            value={currentUrl}
            onChangeText={onUrlChange}
            placeholder="https://example.com/image.jpg"
            placeholderTextColor={Colors.textMuted}
            textAlign="right"
            writingDirection="rtl"
          />
          <TouchableOpacity style={cardStyles.urlSaveBtn} onPress={onSaveUrl} disabled={savingUrl}>
            {savingUrl ? (
              <ActivityIndicator size="small" color="#000" />
            ) : (
              <Text style={cardStyles.urlSaveBtnText}>حفظ</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 14, gap: 12,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(232,130,12,0.1)',
    borderWidth: 1, borderColor: 'rgba(232,130,12,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  label: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  hint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },
  previewWrap: {
    borderRadius: BorderRadius.lg, overflow: 'hidden', position: 'relative',
    borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  aspectBadge: {
    position: 'absolute', top: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: BorderRadius.full,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: Colors.goldMuted + '60',
  },
  aspectBadgeText: { fontSize: 10, color: Colors.gold, fontWeight: FontWeight.bold },
  removeBtn: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(239,68,68,0.85)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  removeBtnText: { fontSize: 10, color: '#fff', fontWeight: FontWeight.bold },
  placeholder: {
    borderRadius: BorderRadius.lg, backgroundColor: Colors.darkSurface,
    borderWidth: 1, borderColor: Colors.darkBorderLight, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 6,
  },
  placeholderText: { fontSize: FontSize.sm, color: Colors.textMuted, writingDirection: 'rtl' },
  placeholderHint: { fontSize: FontSize.xs, color: Colors.textMuted, opacity: 0.6 },
  actions: { flexDirection: 'row', gap: 10 },
  actionBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.goldMuted + '40', paddingVertical: 11,
  },
  actionText: { fontSize: FontSize.sm, color: Colors.gold, fontWeight: FontWeight.semibold, writingDirection: 'rtl' },
  urlRow: { gap: 6 },
  urlLabel: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  urlInputWrap: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  urlInput: {
    flex: 1, backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    paddingHorizontal: 12, height: 40, color: Colors.textPrimary, fontSize: FontSize.xs, writingDirection: 'rtl',
  },
  urlSaveBtn: {
    backgroundColor: Colors.gold, borderRadius: BorderRadius.md,
    paddingHorizontal: 14, height: 40, alignItems: 'center', justifyContent: 'center',
  },
  urlSaveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
});

// =============================================
// MAIN SCREEN
// =============================================
export default function AdminImagesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { refreshSettings } = useApp();
  const { showAlert } = useAlert();

  const [activeTab, setActiveTab] = useState<TabType>('app');

  // App images state
  const [appSettings, setAppSettings] = useState<Record<string, string>>({});
  const [loadingApp, setLoadingApp] = useState(true);
  const [savingKey, setSavingKey] = useState<string | null>(null);

  // Categories state
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loadingCats, setLoadingCats] = useState(true);
  const [catUrls, setCatUrls] = useState<Record<string, string>>({});

  // Truck types state
  const [trucks, setTrucks] = useState<DbTruckType[]>([]);
  const [loadingTrucks, setLoadingTrucks] = useState(true);
  const [truckUrls, setTruckUrls] = useState<Record<string, string>>({});

  // Editor state
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  // Editor state (kept for URL entry fallback)
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorImageUri, setEditorImageUri] = useState('');
  const [editorTarget, setEditorTarget] = useState<ImageTarget | null>(null);
  const [editorAspect, setEditorAspect] = useState<AspectRatio>('16:9');
  const [processingEditor, setProcessingEditor] = useState(false);
  const [pendingUploadKey, setPendingUploadKey] = useState('');
  const [pendingUploadType, setPendingUploadType] = useState<'app' | 'category' | 'truck'>('app');

  // Load data
  useEffect(() => {
    loadApp();
    loadCategories();
    loadTrucks();
  }, []);

  const loadApp = async () => {
    try {
      const data = await fetchSettings();
      setAppSettings(data);
    } finally {
      setLoadingApp(false);
    }
  };

  const loadCategories = async () => {
    try {
      const data = await fetchCategories();
      setCategories(data);
      const urls: Record<string, string> = {};
      data.forEach((c) => { urls[c.id] = c.image_url || ''; });
      setCatUrls(urls);
    } catch {
      // Fallback to local data
      const localCats = CATEGORIES.map((c): DbCategory => ({
        id: c.id, name: c.name, name_en: c.nameEn || '',
        icon: c.icon, image_url: c.image, description: c.description,
        color: c.color, sort_order: 0, is_active: true,
      }));
      setCategories(localCats);
      const urls: Record<string, string> = {};
      localCats.forEach((c) => { urls[c.id] = c.image_url || ''; });
      setCatUrls(urls);
    } finally {
      setLoadingCats(false);
    }
  };

  const loadTrucks = async () => {
    try {
      const data = await fetchTruckTypes();
      setTrucks(data);
      const urls: Record<string, string> = {};
      data.forEach((t) => { urls[t.id] = t.image_url || ''; });
      setTruckUrls(urls);
    } catch {
      const localTrucks = TRUCK_TYPES.map((t): DbTruckType => ({
        id: t.id, name: t.name, name_en: t.nameEn || '',
        description: t.description, year_range: t.year,
        image_url: null, badge: t.badge || null,
        sort_order: 0, is_active: true,
      }));
      setTrucks(localTrucks);
    } finally {
      setLoadingTrucks(false);
    }
  };

  // =============================================
  // PICK IMAGE & OPEN EDITOR
  // =============================================
  const pickImageForTarget = async (
    target: ImageTarget,
    source: 'gallery' | 'camera',
    uploadType: 'app' | 'category' | 'truck',
    entityId: string
  ) => {
    if (source === 'camera' && Platform.OS !== 'web') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (perm.status !== 'granted') return;
    }

    // Use the target's recommended aspect ratio for built-in cropping
    const ratio = ASPECT_RATIOS[target.aspect];
    const aspectArray: [number, number] = [ratio.w, ratio.h];

    const result = source === 'gallery'
      ? await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,   // Built-in crop UI
          aspect: aspectArray,    // Correct ratio for this image type
          quality: 1,
        })
      : await ImagePicker.launchCameraAsync({
          allowsEditing: true,
          aspect: aspectArray,
          quality: 1,
        });

    if (result.canceled || !result.assets?.[0]) return;

    // After cropping, go directly to resize & upload (skip editor modal)
    await processAndUpload(result.assets[0].uri, target, uploadType, entityId);
  };

  // Process (resize) and upload the already-cropped image
  const processAndUpload = async (
    uri: string,
    target: ImageTarget,
    uploadType: 'app' | 'category' | 'truck',
    entityId: string
  ) => {
    try {
      setUploadingKey(entityId);

      // Resize to target dimensions
      const manipResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: target.targetW, height: target.targetH } }],
        { compress: 0.88, format: ImageManipulator.SaveFormat.JPEG, base64: true }
      );

      const base64 = manipResult.base64 || '';
      if (!base64) throw new Error('Failed to get base64');

      const publicUrl = await uploadToSupabase(base64, 'image/jpeg', target.bucket, target.prefix);
      if (!publicUrl) throw new Error('Upload failed');

      if (uploadType === 'app') {
        setAppSettings((prev) => ({ ...prev, [entityId]: publicUrl }));
        await updateSetting(entityId, publicUrl);
        await refreshSettings();
      } else if (uploadType === 'category') {
        setCatUrls((prev) => ({ ...prev, [entityId]: publicUrl }));
        const cat = categories.find((c) => c.id === entityId);
        if (cat) await upsertCategory({ ...cat, image_url: publicUrl });
      } else if (uploadType === 'truck') {
        setTruckUrls((prev) => ({ ...prev, [entityId]: publicUrl }));
        const truck = trucks.find((t) => t.id === entityId);
        if (truck) await upsertTruckType({ ...truck, image_url: publicUrl });
      }

      showAlert('✅ تم الرفع', 'تم تحديث الصورة وستظهر لجميع المستخدمين فوراً');
    } catch (e) {
      console.error('processAndUpload error:', e);
      showAlert('خطأ', 'حصل مشكلة أثناء رفع الصورة، جرب مرة ثانية');
    } finally {
      setUploadingKey(null);
    }
  };

  // =============================================
  // AFTER EDITOR CONFIRM
  // =============================================
  // Keep handleEditorConfirm for URL-based approach (not used with new gallery flow)
  const handleEditorConfirm = async (processedUri: string, base64: string) => {
    setEditorVisible(false);
  };

  // =============================================
  // SAVE URL HELPERS
  // =============================================
  const saveAppUrl = async (key: string) => {
    setSavingKey(key);
    try {
      await updateSetting(key, appSettings[key] || '');
      await refreshSettings();
      showAlert('تم الحفظ', 'تم تحديث الرابط');
    } catch {
      showAlert('خطأ', 'فشل الحفظ');
    } finally {
      setSavingKey(null);
    }
  };

  const saveCategoryUrl = async (catId: string) => {
    const cat = categories.find((c) => c.id === catId);
    if (!cat) return;
    setSavingKey(catId);
    try {
      await upsertCategory({ ...cat, image_url: catUrls[catId] });
      showAlert('تم الحفظ', 'تم تحديث صورة الفئة');
    } catch {
      showAlert('خطأ', 'فشل الحفظ');
    } finally {
      setSavingKey(null);
    }
  };

  const saveTruckUrl = async (truckId: string) => {
    const truck = trucks.find((t) => t.id === truckId);
    if (!truck) return;
    setSavingKey(truckId);
    try {
      await upsertTruckType({ ...truck, image_url: truckUrls[truckId] });
      showAlert('تم الحفظ', 'تم تحديث صورة الشاحنة');
    } catch {
      showAlert('خطأ', 'فشل الحفظ');
    } finally {
      setSavingKey(null);
    }
  };

  const removeAppImage = async (key: string) => {
    setAppSettings((prev) => ({ ...prev, [key]: '' }));
    await updateSetting(key, '');
    await refreshSettings();
  };

  const ADMIN_MENU = [
    { label: 'المنتجات', icon: 'inventory', route: '/admin/products' },
    { label: 'الإعدادات', icon: 'settings', route: '/admin/settings' },
    { label: 'الصور', icon: 'photo-library', route: '/admin/images', active: true },
    { label: 'طلبات القطع', icon: 'receipt-long', route: '/admin/requests' },
    { label: 'الإشعارات', icon: 'notifications', route: '/admin/notifications' },
  ];

  const TAB_CONFIG = [
    { id: 'app' as TabType, label: 'التطبيق', icon: 'smartphone' },
    { id: 'categories' as TabType, label: 'الفئات', icon: 'category' },
    { id: 'trucks' as TabType, label: 'الشاحنات', icon: 'local-shipping' },
  ];

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/admin/products')}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة الصور</Text>
          <MaterialIcons name="photo-library" size={22} color={Colors.orange} />
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
          {TAB_CONFIG.map((tab) => (
            <TouchableOpacity
              key={tab.id}
              style={[styles.sectionTab, activeTab === tab.id && styles.sectionTabActive]}
              onPress={() => setActiveTab(tab.id)}
            >
              <MaterialIcons name={tab.icon as any} size={15} color={activeTab === tab.id ? '#000' : Colors.textSecondary} />
              <Text style={[styles.sectionTabText, activeTab === tab.id && styles.sectionTabTextActive]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Info banner */}
        <View style={styles.infoBanner}>
          <MaterialIcons name="sync" size={14} color={Colors.success} />
          <Text style={styles.infoBannerText}>
            أي تغيير يظهر فوراً لجميع مستخدمي التطبيق (Google Play + App Store)
          </Text>
        </View>

        <View style={styles.goldLine} />
      </LinearGradient>

      {/* ============================== */}
      {/* APP IMAGES TAB                */}
      {/* ============================== */}
      {activeTab === 'app' && (
        loadingApp ? (
          <View style={styles.centered}><ActivityIndicator color={Colors.gold} size="large" /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
            {APP_IMAGE_TARGETS.map((target) => (
              <ImageCard
                key={target.key}
                label={target.label}
                hint={`${target.hint} (${ASPECT_RATIOS[target.aspect].label})`}
                icon={target.icon}
                currentUrl={appSettings[target.key] || ''}
                aspectRatio={target.aspect}
                loading={uploadingKey === target.key}
                savingUrl={savingKey === target.key}
                onPickGallery={() => pickImageForTarget(target, 'gallery', 'app', target.key)}
                onPickCamera={() => pickImageForTarget(target, 'camera', 'app', target.key)}
                onUrlChange={(url) => setAppSettings((prev) => ({ ...prev, [target.key]: url }))}
                onSaveUrl={() => saveAppUrl(target.key)}
                onRemove={() => removeAppImage(target.key)}
              />
            ))}
          </ScrollView>
        )
      )}

      {/* ============================== */}
      {/* CATEGORIES TAB                */}
      {/* ============================== */}
      {activeTab === 'categories' && (
        loadingCats ? (
          <View style={styles.centered}><ActivityIndicator color={Colors.gold} size="large" /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
            <View style={styles.tabHeader}>
              <MaterialIcons name="category" size={18} color={Colors.gold} />
              <Text style={styles.tabHeaderText}>{categories.length} فئة · قابلة للتحرير</Text>
            </View>
            {categories.map((cat) => {
              const catTarget: ImageTarget = {
                key: cat.id, label: cat.name, hint: `صورة فئة ${cat.name}`,
                icon: cat.icon || 'category', aspect: '4:3',
                bucket: 'product-images', prefix: `cat_${cat.id}`,
                targetW: 800, targetH: 600,
              };
              return (
                <View key={cat.id} style={styles.entityCard}>
                  <View style={styles.entityHeader}>
                    <View style={[styles.entityColorDot, { backgroundColor: cat.color }]} />
                    <Text style={styles.entityName}>{cat.name}</Text>
                    <View style={[styles.entityIconWrap, { borderColor: cat.color + '40' }]}>
                      <MaterialIcons name={cat.icon as any} size={16} color={cat.color} />
                    </View>
                  </View>
                  <ImageCard
                    label={`صورة ${cat.name}`}
                    hint="تظهر في قائمة الفئات · سيتم الاقتصاص تلقائياً بنسبة 4:3"
                    icon="photo"
                    currentUrl={catUrls[cat.id] || ''}
                    aspectRatio="4:3"
                    loading={uploadingKey === cat.id}
                    savingUrl={savingKey === cat.id}
                    onPickGallery={() => pickImageForTarget(catTarget, 'gallery', 'category', cat.id)}
                    onPickCamera={() => pickImageForTarget(catTarget, 'camera', 'category', cat.id)}
                    onUrlChange={(url) => setCatUrls((prev) => ({ ...prev, [cat.id]: url }))}
                    onSaveUrl={() => saveCategoryUrl(cat.id)}
                    onRemove={async () => {
                      setCatUrls((prev) => ({ ...prev, [cat.id]: '' }));
                      await upsertCategory({ ...cat, image_url: '' });
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        )
      )}

      {/* ============================== */}
      {/* TRUCKS TAB                     */}
      {/* ============================== */}
      {activeTab === 'trucks' && (
        loadingTrucks ? (
          <View style={styles.centered}><ActivityIndicator color={Colors.gold} size="large" /></View>
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>
            <View style={styles.tabHeader}>
              <MaterialIcons name="local-shipping" size={18} color={Colors.gold} />
              <Text style={styles.tabHeaderText}>{trucks.length} نوع شاحنة</Text>
            </View>
            <View style={styles.noteCard}>
              <MaterialIcons name="info-outline" size={14} color={Colors.orange} />
              <Text style={styles.noteText}>
                صور الشاحنات تظهر في الصفحة الرئيسية عند اختيار موديل الأكتروس - ننصح بنسبة 16:9
              </Text>
            </View>
            {trucks.map((truck) => {
              const localTruck = TRUCK_TYPES.find((t) => t.id === truck.id);
              const truckTarget: ImageTarget = {
                key: truck.id, label: truck.name, hint: `صورة ${truck.name}`,
                icon: 'local-shipping', aspect: '16:9',
                bucket: 'product-images', prefix: `truck_${truck.id}`,
                targetW: 1280, targetH: 720,
              };
              const currentUrl = truckUrls[truck.id] || '';
              return (
                <View key={truck.id} style={styles.entityCard}>
                  <View style={styles.entityHeader}>
                    {truck.badge ? (
                      <View style={styles.entityBadge}>
                        <Text style={styles.entityBadgeText}>{truck.badge}</Text>
                      </View>
                    ) : null}
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.entityName}>{truck.name}</Text>
                      {truck.year_range ? <Text style={styles.entitySub}>{truck.year_range}</Text> : null}
                    </View>
                    <View style={styles.truckIconWrap}>
                      <MaterialIcons name="local-shipping" size={18} color={Colors.gold} />
                    </View>
                  </View>

                  {/* Show local asset note if no cloud image */}
                  {!currentUrl && localTruck?.image ? (
                    <View style={styles.localImageNote}>
                      <MaterialIcons name="photo" size={14} color={Colors.textMuted} />
                      <Text style={styles.localImageNoteText}>
                        تستخدم حالياً صورة محلية — ارفع صورة سحابية لتحديثها لجميع المستخدمين
                      </Text>
                    </View>
                  ) : null}

                  <ImageCard
                    label={`صورة ${truck.name}`}
                    hint="تظهر في بطاقة الشاحنة · سيتم الاقتصاص تلقائياً بنسبة 16:9"
                    icon="photo"
                    currentUrl={currentUrl}
                    aspectRatio="16:9"
                    loading={uploadingKey === truck.id}
                    savingUrl={savingKey === truck.id}
                    onPickGallery={() => pickImageForTarget(truckTarget, 'gallery', 'truck', truck.id)}
                    onPickCamera={() => pickImageForTarget(truckTarget, 'camera', 'truck', truck.id)}
                    onUrlChange={(url) => setTruckUrls((prev) => ({ ...prev, [truck.id]: url }))}
                    onSaveUrl={() => saveTruckUrl(truck.id)}
                    onRemove={async () => {
                      setTruckUrls((prev) => ({ ...prev, [truck.id]: '' }));
                      await upsertTruckType({ ...truck, image_url: null });
                    }}
                  />
                </View>
              );
            })}
          </ScrollView>
        )
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
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.darkBorderLight, backgroundColor: Colors.darkCard,
  },
  navTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  navTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  navTabTextActive: { color: '#000', fontWeight: FontWeight.bold },
  sectionTabs: { flexDirection: 'row', gap: 8, paddingBottom: 10, justifyContent: 'flex-end' },
  sectionTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.darkBorderLight, backgroundColor: Colors.darkSurface,
  },
  sectionTabActive: { backgroundColor: Colors.orange, borderColor: Colors.orange },
  sectionTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  sectionTabTextActive: { color: '#000', fontWeight: FontWeight.bold },
  infoBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: 'rgba(34,197,94,0.08)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(34,197,94,0.2)',
    paddingVertical: 8, paddingHorizontal: 12, marginBottom: 10,
  },
  infoBannerText: { flex: 1, fontSize: FontSize.xs, color: Colors.success, writingDirection: 'rtl', textAlign: 'right' },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: Spacing.md, gap: 16 },
  tabHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
    paddingBottom: 4,
  },
  tabHeaderText: { fontSize: FontSize.sm, color: Colors.gold, fontWeight: FontWeight.semibold, writingDirection: 'rtl' },
  entityCard: {
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 12, gap: 10,
  },
  entityHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  entityColorDot: { width: 10, height: 10, borderRadius: 5 },
  entityName: { flex: 1, fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  entitySub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  entityIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: Colors.darkCard, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
  entityBadge: {
    backgroundColor: 'rgba(212,175,55,0.15)', borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.goldMuted,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  entityBadgeText: { fontSize: 10, color: Colors.gold, fontWeight: FontWeight.bold },
  truckIconWrap: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1, borderColor: Colors.goldMuted + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  localImageNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.md,
    padding: 8, borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  localImageNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  noteCard: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: 'rgba(232,130,12,0.07)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(232,130,12,0.2)', padding: 10, marginBottom: 4,
  },
  noteText: { flex: 1, fontSize: FontSize.xs, color: Colors.orange, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
});
