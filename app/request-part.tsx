import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { insertPartRequest } from '@/services/db';
import { useApp } from '@/hooks/useApp';
import { buildWhatsAppUrl } from '@/services/db';
import { FloatingWhatsApp } from '@/components';

const TRUCK_OPTIONS = [
  { id: 'mb1', label: 'Actros MB1' },
  { id: 'mb2', label: 'Actros MB2' },
  { id: 'mb3', label: 'Actros MB3' },
  { id: 'mb4', label: 'Actros MB4' },
  { id: 'mb5', label: 'Actros MB5' },
];

const CATEGORY_OPTIONS = [
  { id: 'engine', label: 'المكينة' },
  { id: 'brakes', label: 'البريكات' },
  { id: 'filters', label: 'الفلاتر' },
  { id: 'gearbox', label: 'الكير' },
  { id: 'electrical', label: 'الكهربائيات' },
  { id: 'other', label: 'أخرى' },
];

export default function RequestPartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { whatsappNumber } = useApp();

  const [selectedTruck, setSelectedTruck] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [partNumber, setPartNumber] = useState('');
  const [partName, setPartName] = useState('');
  const [notes, setNotes] = useState('');
  const [phone, setPhone] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('صلاحية الكاميرا', 'الرجاء السماح باستخدام الكاميرا');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.7,
      allowsEditing: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!selectedTruck) {
      Alert.alert('تنبيه', 'اختر نوع الشاحنة أولاً');
      return;
    }
    if (!partName && !partNumber) {
      Alert.alert('تنبيه', 'أدخل اسم القطعة أو رقمها');
      return;
    }

    setLoading(true);
    try {
      const truckLabel = TRUCK_OPTIONS.find((t) => t.id === selectedTruck)?.label || selectedTruck;
      const catLabel = CATEGORY_OPTIONS.find((c) => c.id === selectedCategory)?.label || selectedCategory;

      await insertPartRequest({
        truck_type_id: selectedTruck,
        truck_name: truckLabel,
        category_id: selectedCategory,
        category_name: catLabel,
        part_number: partNumber,
        part_name: partName,
        notes,
        customer_phone: phone,
      });

      // Also send WhatsApp message
      let msg = `مرحبا، أريد الاستفسار عن قطعة:\n`;
      msg += `الشاحنة: ${truckLabel}\n`;
      if (selectedCategory) msg += `القسم: ${catLabel}\n`;
      if (partName) msg += `اسم القطعة: ${partName}\n`;
      if (partNumber) msg += `رقم القطعة: ${partNumber}\n`;
      if (notes) msg += `ملاحظات: ${notes}\n`;
      if (phone) msg += `رقم التواصل: ${phone}`;

      setSubmitted(true);

      setTimeout(() => {
        Linking.openURL(buildWhatsAppUrl(whatsappNumber, msg));
      }, 500);
    } catch (e) {
      Alert.alert('خطأ', 'حصل مشكلة، تواصل معنا مباشرة عبر واتساب');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <View style={[styles.root, { justifyContent: 'center', alignItems: 'center', gap: 20 }]}>
        <View style={styles.successIcon}>
          <MaterialIcons name="check-circle" size={64} color={Colors.success} />
        </View>
        <Text style={styles.successTitle}>تم إرسال طلبك!</Text>
        <Text style={styles.successDesc}>سيتم فتح واتساب ليصلك رد سريع من فريقنا</Text>
        <TouchableOpacity style={styles.successBtn} onPress={() => router.back()} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.gold, Colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.successBtnGradient}>
            <Text style={styles.successBtnText}>العودة للرئيسية</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.titleMain}>طلب قطعة غير موجودة</Text>
            <Text style={styles.titleSub}>أرسل التفاصيل ونوفرها لك</Text>
          </View>
          <View style={styles.headerIcon}>
            <MaterialIcons name="image-search" size={20} color={Colors.orange} />
          </View>
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}>
        {/* Info Card */}
        <View style={styles.infoCard}>
          <MaterialIcons name="info" size={18} color={Colors.orange} />
          <Text style={styles.infoText}>
            ما لكيت القطعة بالكتالوج؟ أرسل لنا الصورة أو رقم القطعة وراح نشوفها ونوفرها لك بأسرع وقت.
          </Text>
        </View>

        {/* Image Picker */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>صورة القطعة (اختياري)</Text>
          <View style={styles.imagePickerRow}>
            <TouchableOpacity style={styles.imgPickBtn} onPress={pickImage} activeOpacity={0.8}>
              <MaterialIcons name="photo-library" size={20} color={Colors.gold} />
              <Text style={styles.imgPickText}>من الألبوم</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.imgPickBtn} onPress={takePhoto} activeOpacity={0.8}>
              <MaterialIcons name="camera-alt" size={20} color={Colors.orange} />
              <Text style={styles.imgPickText}>صورة الكاميرا</Text>
            </TouchableOpacity>
          </View>
          {imageUri ? (
            <View style={styles.imagePreview}>
              <Image source={{ uri: imageUri }} style={styles.previewImg} contentFit="cover" />
              <TouchableOpacity style={styles.removeImg} onPress={() => setImageUri(null)}>
                <MaterialIcons name="close" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
          ) : null}
        </View>

        {/* Truck Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>نوع الشاحنة *</Text>
          <View style={styles.optionsRow}>
            {TRUCK_OPTIONS.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.optionChip, selectedTruck === t.id && styles.optionChipActive]}
                onPress={() => setSelectedTruck(t.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionChipText, selectedTruck === t.id && styles.optionChipTextActive]}>
                  {t.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Category Selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>القسم (اختياري)</Text>
          <View style={styles.optionsRow}>
            {CATEGORY_OPTIONS.map((c) => (
              <TouchableOpacity
                key={c.id}
                style={[styles.optionChip, selectedCategory === c.id && styles.optionChipActive]}
                onPress={() => setSelectedCategory(c.id)}
                activeOpacity={0.8}
              >
                <Text style={[styles.optionChipText, selectedCategory === c.id && styles.optionChipTextActive]}>
                  {c.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Part Number */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>رقم القطعة</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="مثال: A0001802101"
              placeholderTextColor={Colors.textMuted}
              value={partNumber}
              onChangeText={setPartNumber}
              textAlign="right"
              autoCapitalize="characters"
            />
          </View>
        </View>

        {/* Part Name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>اسم القطعة *</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="مثال: طلمبة زيت MB3"
              placeholderTextColor={Colors.textMuted}
              value={partName}
              onChangeText={setPartName}
              textAlign="right"
              writingDirection="rtl"
            />
          </View>
        </View>

        {/* Notes */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>ملاحظات إضافية</Text>
          <View style={[styles.inputWrap, { height: 90 }]}>
            <TextInput
              style={[styles.input, { textAlignVertical: 'top', paddingTop: 10 }]}
              placeholder="أي تفاصيل إضافية تساعدنا تلكي القطعة..."
              placeholderTextColor={Colors.textMuted}
              value={notes}
              onChangeText={setNotes}
              textAlign="right"
              writingDirection="rtl"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Phone */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>رقم التواصل (اختياري)</Text>
          <View style={styles.inputWrap}>
            <TextInput
              style={styles.input}
              placeholder="+964..."
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              textAlign="right"
              keyboardType="phone-pad"
            />
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading} activeOpacity={0.85}>
          <LinearGradient
            colors={loading ? [Colors.darkSurface, Colors.darkCard] : ['#25D366', '#1aac52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.submitGradient}
          >
            <MaterialIcons name="send" size={20} color="#fff" />
            <Text style={styles.submitText}>{loading ? 'جاري الإرسال...' : 'أرسل الطلب عبر واتساب'}</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <FloatingWhatsApp message="مرحبا، أريد الاستفسار عن قطعة غيار" />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: Spacing.md, paddingBottom: 16 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { alignItems: 'flex-end', flex: 1, marginRight: 12 },
  titleMain: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  titleSub: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
  headerIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(232,130,12,0.1)',
    borderWidth: 1, borderColor: 'rgba(232,130,12,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, marginTop: 14, opacity: 0.4 },

  content: { padding: Spacing.md, gap: 16 },

  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: 'rgba(232,130,12,0.08)',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: 'rgba(232,130,12,0.25)',
    padding: 12,
  },
  infoText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },

  fieldGroup: { gap: 8 },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },

  imagePickerRow: { flexDirection: 'row', gap: 10 },
  imgPickBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    padding: 14,
  },
  imgPickText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  imagePreview: { position: 'relative', borderRadius: BorderRadius.lg, overflow: 'hidden', height: 160 },
  previewImg: { width: '100%', height: '100%' },
  removeImg: {
    position: 'absolute', top: 8, left: 8,
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center', justifyContent: 'center',
  },

  optionsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  optionChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  optionChipActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: Colors.gold },
  optionChipText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  optionChipTextActive: { color: Colors.gold, fontWeight: FontWeight.semibold },

  inputWrap: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    height: 50,
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  input: { color: Colors.textPrimary, fontSize: FontSize.base, writingDirection: 'rtl' },

  submitBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 8, ...Shadow.gold, shadowColor: Colors.whatsapp },
  submitGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  submitText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, writingDirection: 'rtl' },

  successIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(34,197,94,0.12)',
    borderWidth: 2, borderColor: 'rgba(34,197,94,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  successTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, writingDirection: 'rtl' },
  successDesc: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', writingDirection: 'rtl' },
  successBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.gold },
  successBtnGradient: { paddingHorizontal: 32, paddingVertical: 14 },
  successBtnText: { color: '#000', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, writingDirection: 'rtl' },
});
