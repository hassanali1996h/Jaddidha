import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { fetchAllProducts, upsertProduct, deleteProduct, DbProduct } from '@/services/db';
import { useAlert } from '@/template';
import { CATEGORIES, TRUCK_TYPES } from '@/services/data';
import { pickAndUploadImage, takeAndUploadPhoto } from '@/services/storage';

const EMPTY_PRODUCT: Partial<DbProduct> = {
  name: '',
  name_en: '',
  description: '',
  price: '',
  original_price: '',
  wholesale_price: '',
  min_wholesale_qty: 10,
  sale_type: 'both',
  image_url: '',
  truck_type_ids: [],
  category_id: '',
  part_number: '',
  is_original: true,
  in_stock: true,
  badge: '',
};

export default function AdminProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editProduct, setEditProduct] = useState<Partial<DbProduct>>(EMPTY_PRODUCT);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchAllProducts();
      setProducts(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, []);

  const filtered = products.filter(
    (p) =>
      p.name.includes(search) ||
      (p.part_number && p.part_number.includes(search)) ||
      (p.name_en && p.name_en.toLowerCase().includes(search.toLowerCase()))
  );

  const openNew = () => {
    setEditProduct({ ...EMPTY_PRODUCT });
    setModalVisible(true);
  };

  const openEdit = (p: DbProduct) => {
    setEditProduct({ ...p });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!editProduct.name || !editProduct.price) {
      showAlert('بيانات ناقصة', 'الاسم والسعر مطلوبان');
      return;
    }
    setSaving(true);
    try {
      await upsertProduct(editProduct);
      await load();
      setModalVisible(false);
      showAlert('تم الحفظ', 'تم حفظ المنتج بنجاح');
    } catch (e) {
      showAlert('خطأ', 'حصل مشكلة أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (p: DbProduct) => {
    showAlert('حذف المنتج', `هل تريد حذف "${p.name}"؟`, [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          await deleteProduct(p.id);
          await load();
        },
      },
    ]);
  };

  const toggleTruck = (truckId: string) => {
    const current = editProduct.truck_type_ids || [];
    if (current.includes(truckId)) {
      setEditProduct((p) => ({ ...p, truck_type_ids: current.filter((t) => t !== truckId) }));
    } else {
      setEditProduct((p) => ({ ...p, truck_type_ids: [...current, truckId] }));
    }
  };

  const [uploadingImage, setUploadingImage] = useState(false);

  const handlePickImage = async () => {
    setUploadingImage(true);
    try {
      const url = await pickAndUploadImage();
      if (url) setEditProduct((p) => ({ ...p, image_url: url }));
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTakePhoto = async () => {
    setUploadingImage(true);
    try {
      const url = await takeAndUploadPhoto();
      if (url) setEditProduct((p) => ({ ...p, image_url: url }));
    } finally {
      setUploadingImage(false);
    }
  };

  const ADMIN_MENU = [
    { label: 'المنتجات', icon: 'inventory', route: '/admin/products', active: true },
    { label: 'الإعدادات', icon: 'settings', route: '/admin/settings' },
    { label: 'طلبات القطع', icon: 'receipt-long', route: '/admin/requests' },
    { label: 'الإشعارات', icon: 'notifications', route: '/admin/notifications' },
  ];

  const renderProduct = ({ item }: { item: DbProduct }) => (
    <View style={styles.productRow}>
      <View style={styles.productActions}>
        <TouchableOpacity style={styles.editBtn} onPress={() => openEdit(item)}>
          <MaterialIcons name="edit" size={16} color={Colors.gold} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
          <MaterialIcons name="delete" size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.productMeta}>
          {item.category_id} · {item.price} د.ع
          {item.part_number ? ` · ${item.part_number}` : ''}
        </Text>
        <View style={styles.productTags}>
          {(item.truck_type_ids || []).map((t) => (
            <View key={t} style={styles.truckTag}>
              <Text style={styles.truckTagText}>{t.toUpperCase()}</Text>
            </View>
          ))}
          {!item.in_stock ? (
            <View style={[styles.truckTag, { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' }]}>
              <Text style={[styles.truckTagText, { color: Colors.error }]}>نفذ</Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/admin')}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>إدارة المنتجات</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openNew}>
            <MaterialIcons name="add" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Nav tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navTabs}>
          {ADMIN_MENU.map((m) => (
            <TouchableOpacity key={m.route} style={[styles.navTab, m.active && styles.navTabActive]} onPress={() => router.push(m.route as any)}>
              <MaterialIcons name={m.icon as any} size={16} color={m.active ? '#000' : Colors.textSecondary} />
              <Text style={[styles.navTabText, m.active && styles.navTabTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={styles.searchWrap}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن منتج..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      {/* Stats */}
      <View style={styles.statsRow}>
        <Text style={styles.statsText}>{filtered.length} منتج</Text>
        <Text style={styles.statsTextMuted}>· {products.filter((p) => p.in_stock).length} متوفر</Text>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Edit Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.modalHeader, { paddingTop: 20 }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{editProduct.id ? 'تعديل منتج' : 'منتج جديد'}</Text>
            <TouchableOpacity style={styles.saveBtn} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color={Colors.gold} /> : <Text style={styles.saveBtnText}>حفظ</Text>}
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Image Upload Section */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>صورة المنتج</Text>
              {editProduct.image_url ? (
                <View style={styles.imagePreviewWrap}>
                  <Image source={{ uri: editProduct.image_url }} style={styles.imagePreview} contentFit="cover" />
                  <TouchableOpacity
                    style={styles.removeImageBtn}
                    onPress={() => setEditProduct((p) => ({ ...p, image_url: '' }))}
                  >
                    <MaterialIcons name="close" size={16} color="#fff" />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.imagePickerRow}>
                  <TouchableOpacity style={styles.imagePickerBtn} onPress={handlePickImage} disabled={uploadingImage}>
                    {uploadingImage ? (
                      <ActivityIndicator size="small" color={Colors.gold} />
                    ) : (
                      <>
                        <MaterialIcons name="photo-library" size={20} color={Colors.gold} />
                        <Text style={styles.imagePickerText}>من المعرض</Text>
                      </>
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.imagePickerBtn} onPress={handleTakePhoto} disabled={uploadingImage}>
                    <MaterialIcons name="camera-alt" size={20} color={Colors.orange} />
                    <Text style={[styles.imagePickerText, { color: Colors.orange }]}>الكاميرا</Text>
                  </TouchableOpacity>
                </View>
              )}
              <Text style={styles.formHint}>أو ضع رابط URL مباشرة:</Text>
              <View style={styles.formInput}>
                <TextInput
                  style={styles.formInputText}
                  value={editProduct.image_url || ''}
                  onChangeText={(v) => setEditProduct((p) => ({ ...p, image_url: v }))}
                  placeholder="https://..."
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                  writingDirection="rtl"
                />
              </View>
            </View>

            {[
              { key: 'name', label: 'اسم المنتج *', placeholder: 'مثال: طلمبة زيت MB3' },
              { key: 'name_en', label: 'الاسم بالإنجليزي', placeholder: 'Oil Pump MB3' },
              { key: 'price', label: 'سعر المفرد *', placeholder: '85,000', keyboardType: 'numeric' as const },
              { key: 'wholesale_price', label: 'سعر الجملة', placeholder: '70,000', keyboardType: 'numeric' as const },
              { key: 'original_price', label: 'السعر قبل الخصم', placeholder: '100,000', keyboardType: 'numeric' as const },
              { key: 'part_number', label: 'رقم القطعة', placeholder: 'A0001802101' },
              { key: 'badge', label: 'البادج', placeholder: 'مثال: خصم / جديد' },
              { key: 'description', label: 'وصف القطعة', placeholder: 'وصف تفصيلي...', multiline: true },
            ].map((field) => (
              <View key={field.key} style={styles.formField}>
                <Text style={styles.formLabel}>{field.label}</Text>
                <View style={[styles.formInput, field.multiline && { height: 80 }]}>
                  <TextInput
                    style={[styles.formInputText, field.multiline && { textAlignVertical: 'top', paddingTop: 8 }]}
                    value={(editProduct as any)[field.key] || ''}
                    onChangeText={(v) => setEditProduct((p) => ({ ...p, [field.key]: v }))}
                    placeholder={field.placeholder}
                    placeholderTextColor={Colors.textMuted}
                    textAlign="right"
                    writingDirection="rtl"
                    keyboardType={field.keyboardType}
                    multiline={field.multiline}
                  />
                </View>
              </View>
            ))}

            {/* Min Wholesale Qty */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>الحد الأدنى لطلب الجملة</Text>
              <View style={styles.formInput}>
                <TextInput
                  style={styles.formInputText}
                  value={String(editProduct.min_wholesale_qty ?? 10)}
                  onChangeText={(v) => setEditProduct((p) => ({ ...p, min_wholesale_qty: parseInt(v) || 10 }))}
                  placeholder="10"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                  keyboardType="number-pad"
                />
              </View>
            </View>

            {/* Sale Type */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>نوع البيع</Text>
              <View style={styles.chipsRow}>
                {[
                  { id: 'retail', label: 'مفرد فقط', color: Colors.gold },
                  { id: 'wholesale', label: 'جملة فقط', color: '#A78BFA' },
                  { id: 'both', label: 'مفرد وجملة', color: Colors.orange },
                ].map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.chip,
                      (editProduct.sale_type || 'both') === t.id && {
                        backgroundColor: t.color + '20',
                        borderColor: t.color,
                      },
                    ]}
                    onPress={() => setEditProduct((p) => ({ ...p, sale_type: t.id as any }))}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        (editProduct.sale_type || 'both') === t.id && { color: t.color, fontWeight: FontWeight.bold },
                      ]}
                    >
                      {t.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Category */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>التصنيف</Text>
              <View style={styles.chipsRow}>
                {CATEGORIES.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[styles.chip, editProduct.category_id === c.id && styles.chipActive]}
                    onPress={() => setEditProduct((p) => ({ ...p, category_id: c.id }))}
                  >
                    <Text style={[styles.chipText, editProduct.category_id === c.id && styles.chipTextActive]}>{c.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Truck Types */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>أنواع الشاحنات المتوافقة</Text>
              <View style={styles.chipsRow}>
                {TRUCK_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[styles.chip, (editProduct.truck_type_ids || []).includes(t.id) && styles.chipActive]}
                    onPress={() => toggleTruck(t.id)}
                  >
                    <Text style={[styles.chipText, (editProduct.truck_type_ids || []).includes(t.id) && styles.chipTextActive]}>
                      {t.nameEn}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Switches */}
            {[
              { key: 'in_stock', label: 'متوفر في المخزون' },
              { key: 'is_original', label: 'قطعة أصلية' },
            ].map((sw) => (
              <View key={sw.key} style={styles.switchRow}>
                <Switch
                  value={(editProduct as any)[sw.key] ?? true}
                  onValueChange={(v) => setEditProduct((p) => ({ ...p, [sw.key]: v }))}
                  trackColor={{ true: Colors.gold, false: Colors.darkBorderLight }}
                  thumbColor="#fff"
                />
                <Text style={styles.switchLabel}>{sw.label}</Text>
              </View>
            ))}

            <View style={{ height: 60 }} />
          </ScrollView>
        </View>
      </Modal>
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
  addBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  navTabs: { flexDirection: 'row', gap: 8, paddingBottom: 12 },
  navTab: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    backgroundColor: Colors.darkCard,
  },
  navTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  navTabText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  navTabTextActive: { color: '#000', fontWeight: FontWeight.bold },
  searchWrap: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.darkBorderLight, marginBottom: 10,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, writingDirection: 'rtl' },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  statsRow: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: Spacing.md, paddingVertical: 10 },
  statsText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold, writingDirection: 'rtl' },
  statsTextMuted: { fontSize: FontSize.sm, color: Colors.textMuted, writingDirection: 'rtl' },

  list: { paddingHorizontal: Spacing.md, paddingTop: 8, gap: 8 },
  productRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg, borderWidth: 1, borderColor: Colors.darkBorderLight,
    padding: 12, gap: 10,
  },
  productActions: { gap: 8 },
  editBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: Colors.goldMuted + '50',
    alignItems: 'center', justifyContent: 'center',
  },
  deleteBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  productInfo: { flex: 1, alignItems: 'flex-end', gap: 4 },
  productName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  productMeta: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  productTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' },
  truckTag: {
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderRadius: BorderRadius.sm, borderWidth: 1, borderColor: 'rgba(212,175,55,0.3)',
    paddingHorizontal: 7, paddingVertical: 2,
  },
  truckTagText: { fontSize: 9, color: Colors.gold, fontWeight: FontWeight.bold },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.darkBg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: 14,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  saveBtn: { backgroundColor: Colors.gold, borderRadius: BorderRadius.full, paddingHorizontal: 18, paddingVertical: 8, minWidth: 60, alignItems: 'center' },
  saveBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },

  modalContent: { padding: Spacing.md },
  formField: { gap: 6, marginBottom: 14 },
  formLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  formInput: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    height: 46, justifyContent: 'center', paddingHorizontal: 12,
  },
  formInputText: { color: Colors.textPrimary, fontSize: FontSize.sm, writingDirection: 'rtl' },
  chipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  chipActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: Colors.gold },
  chipText: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  chipTextActive: { color: Colors.gold, fontWeight: FontWeight.bold },
  switchRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12, marginBottom: 14 },
  switchLabel: { fontSize: FontSize.base, color: Colors.textPrimary, writingDirection: 'rtl' },

  imagePreviewWrap: { position: 'relative', borderRadius: BorderRadius.lg, overflow: 'hidden', height: 140 },
  imagePreview: { width: '100%', height: 140 },
  removeImageBtn: {
    position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center',
  },
  imagePickerRow: { flexDirection: 'row', gap: 10 },
  imagePickerBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.darkBorderLight, paddingVertical: 14,
  },
  imagePickerText: { fontSize: FontSize.sm, color: Colors.gold, fontWeight: FontWeight.semibold, writingDirection: 'rtl' },
  formHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
});
