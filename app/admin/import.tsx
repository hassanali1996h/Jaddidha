// =============================================
// Jaddidha - Admin Excel/CSV Import Screen
// Bulk product import with full guide
// =============================================
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { upsertProduct } from '@/services/db';
import { useAlert } from '@/template';
import { CATEGORIES, TRUCK_TYPES } from '@/services/data';

// =============================================
// CSV PARSER (no external lib needed)
// =============================================
function parseCSV(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim().split('\n');
  if (lines.length < 2) return [];

  const headers = parseCSVLine(lines[0]).map((h) => h.trim().toLowerCase());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = (values[idx] || '').trim();
    });
    rows.push(row);
  }
  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
}

// =============================================
// VALIDATE & MAP ROW → PRODUCT
// =============================================
interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
  imported: string[];
}

function mapRowToProduct(row: Record<string, string>, rowIdx: number) {
  const errors: string[] = [];

  const name = row['name'] || row['اسم المنتج'] || '';
  const price = row['price'] || row['سعر المفرد'] || row['السعر'] || '';

  if (!name) errors.push(`السطر ${rowIdx + 1}: اسم المنتج مطلوب`);
  if (!price) errors.push(`السطر ${rowIdx + 1}: السعر مطلوب`);

  // Parse truck_type_ids: comma-separated inside cell e.g. "mb1,mb2"
  const truckRaw = row['truck_type_ids'] || row['الشاحنات'] || '';
  const truck_type_ids = truckRaw
    ? truckRaw.split(/[,|;]/).map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];

  // Validate truck IDs
  const validTruckIds = TRUCK_TYPES.map((t) => t.id);
  const invalidTrucks = truck_type_ids.filter((t) => !validTruckIds.includes(t));
  if (invalidTrucks.length > 0) {
    errors.push(`السطر ${rowIdx + 1}: أنواع شاحنات غير صحيحة: ${invalidTrucks.join(', ')}`);
  }

  // Validate category
  const category_id = row['category_id'] || row['التصنيف'] || '';
  const validCatIds = CATEGORIES.map((c) => c.id);
  if (category_id && !validCatIds.includes(category_id)) {
    errors.push(`السطر ${rowIdx + 1}: التصنيف "${category_id}" غير موجود`);
  }

  const sale_type = (row['sale_type'] || row['نوع البيع'] || 'both') as 'retail' | 'wholesale' | 'both';
  const validSaleTypes = ['retail', 'wholesale', 'both'];
  if (!validSaleTypes.includes(sale_type)) {
    errors.push(`السطر ${rowIdx + 1}: نوع البيع يجب أن يكون: retail أو wholesale أو both`);
  }

  const is_original_raw = (row['is_original'] || row['أصلي'] || 'true').toLowerCase();
  const in_stock_raw = (row['in_stock'] || row['متوفر'] || 'true').toLowerCase();

  return {
    errors,
    product: errors.length === 0 ? {
      name: name.trim(),
      name_en: (row['name_en'] || row['الاسم بالانجليزي'] || '').trim(),
      description: (row['description'] || row['الوصف'] || '').trim(),
      price: price.trim(),
      original_price: (row['original_price'] || row['سعر قبل الخصم'] || '') || null,
      wholesale_price: (row['wholesale_price'] || row['سعر الجملة'] || '') || null,
      min_wholesale_qty: parseInt(row['min_wholesale_qty'] || row['حد الجملة'] || '10') || 10,
      sale_type,
      image_url: (row['image_url'] || row['رابط الصورة'] || '').trim(),
      truck_type_ids,
      category_id,
      part_number: (row['part_number'] || row['رقم القطعة'] || '') || null,
      is_original: ['true', '1', 'نعم', 'yes'].includes(is_original_raw),
      in_stock: ['true', '1', 'نعم', 'yes'].includes(in_stock_raw),
      badge: (row['badge'] || row['البادج'] || '') || null,
      is_active: true,
      sort_order: 0,
    } : null,
  };
}

// =============================================
// GUIDE DATA
// =============================================
const COLUMNS_GUIDE = [
  { col: 'name', arabic: 'اسم المنتج', req: true, example: 'طلمبة زيت MB3', note: 'مطلوب' },
  { col: 'price', arabic: 'سعر المفرد', req: true, example: '85000', note: 'مطلوب · أرقام فقط' },
  { col: 'category_id', arabic: 'التصنيف', req: true, example: 'engine', note: 'راجع جدول الأكواد' },
  { col: 'truck_type_ids', arabic: 'الشاحنات', req: false, example: 'mb1,mb3', note: 'فصل بفاصلة' },
  { col: 'description', arabic: 'الوصف', req: false, example: 'طلمبة أصلية...', note: '' },
  { col: 'name_en', arabic: 'الاسم بالإنجليزي', req: false, example: 'Oil Pump', note: '' },
  { col: 'part_number', arabic: 'رقم القطعة', req: false, example: 'A0001802101', note: '' },
  { col: 'original_price', arabic: 'سعر قبل الخصم', req: false, example: '100000', note: '' },
  { col: 'wholesale_price', arabic: 'سعر الجملة', req: false, example: '70000', note: '' },
  { col: 'min_wholesale_qty', arabic: 'حد الجملة', req: false, example: '10', note: 'الحد الأدنى' },
  { col: 'sale_type', arabic: 'نوع البيع', req: false, example: 'both', note: 'retail/wholesale/both' },
  { col: 'image_url', arabic: 'رابط الصورة', req: false, example: 'https://...', note: 'رابط URL' },
  { col: 'badge', arabic: 'البادج', req: false, example: 'جديد', note: 'اختياري' },
  { col: 'is_original', arabic: 'أصلي', req: false, example: 'true', note: 'true أو false' },
  { col: 'in_stock', arabic: 'متوفر', req: false, example: 'true', note: 'true أو false' },
];

const CATEGORY_CODES = CATEGORIES.map((c) => ({ id: c.id, name: c.name }));
const TRUCK_CODES = TRUCK_TYPES.map((t) => ({ id: t.id, name: t.name }));

export default function AdminImportScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [guideVisible, setGuideVisible] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [previewRows, setPreviewRows] = useState<Record<string, string>[]>([]);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [activeGuideTab, setActiveGuideTab] = useState<'columns' | 'codes' | 'steps'>('steps');

  const ADMIN_MENU = [
    { label: 'المنتجات', icon: 'inventory', route: '/admin/products' },
    { label: 'الإعدادات', icon: 'settings', route: '/admin/settings' },
    { label: 'الصور', icon: 'photo-library', route: '/admin/images' },
    { label: 'طلبات القطع', icon: 'receipt-long', route: '/admin/requests' },
    { label: 'الإشعارات', icon: 'notifications', route: '/admin/notifications' },
    { label: 'استيراد', icon: 'upload-file', route: '/admin/import', active: true },
  ];

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const file = result.assets[0];
      const content = await FileSystem.readAsStringAsync(file.uri, { encoding: FileSystem.EncodingType.UTF8 });

      const rows = parseCSV(content);
      if (rows.length === 0) {
        showAlert('ملف فارغ', 'الملف لا يحتوي على بيانات أو التنسيق غير صحيح');
        return;
      }

      setPreviewRows(rows.slice(0, 5)); // show first 5 rows as preview
      setPreviewVisible(true);

    } catch (e: any) {
      showAlert('خطأ', 'تعذر قراءة الملف. تأكد أنه CSV');
    }
  };

  const handleConfirmImport = async () => {
    setPreviewVisible(false);
    setImporting(true);
    setResult(null);

    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (file.canceled || !file.assets?.[0]) {
        setImporting(false);
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const rows = parseCSV(content);

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      const imported: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const { errors: rowErrors, product } = mapRowToProduct(rows[i], i);

        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          failed++;
          continue;
        }

        if (!product) { failed++; continue; }

        try {
          await upsertProduct(product);
          success++;
          imported.push(product.name);
        } catch (e: any) {
          failed++;
          errors.push(`السطر ${i + 1} (${rows[i]['name'] || '؟'}): ${e.message}`);
        }
      }

      setResult({ success, failed, errors, imported });

    } catch (e: any) {
      showAlert('خطأ', 'حصل مشكلة أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  const handleDirectImport = async () => {
    setImporting(true);
    setResult(null);

    try {
      const file = await DocumentPicker.getDocumentAsync({
        type: ['text/csv', 'text/comma-separated-values', 'text/plain', 'application/csv', '*/*'],
        copyToCacheDirectory: true,
      });

      if (file.canceled || !file.assets?.[0]) {
        setImporting(false);
        return;
      }

      const content = await FileSystem.readAsStringAsync(file.assets[0].uri, { encoding: FileSystem.EncodingType.UTF8 });
      const rows = parseCSV(content);

      if (rows.length === 0) {
        showAlert('ملف فارغ', 'الملف لا يحتوي على بيانات صحيحة');
        setImporting(false);
        return;
      }

      let success = 0;
      let failed = 0;
      const errors: string[] = [];
      const imported: string[] = [];

      for (let i = 0; i < rows.length; i++) {
        const { errors: rowErrors, product } = mapRowToProduct(rows[i], i);

        if (rowErrors.length > 0) {
          errors.push(...rowErrors);
          failed++;
          continue;
        }

        if (!product) { failed++; continue; }

        try {
          await upsertProduct(product);
          success++;
          imported.push(product.name);
        } catch (e: any) {
          failed++;
          errors.push(`السطر ${i + 1} (${rows[i]['name'] || '؟'}): ${e.message}`);
        }
      }

      setResult({ success, failed, errors, imported });

    } catch (e: any) {
      showAlert('خطأ', 'حصل مشكلة أثناء الاستيراد');
    } finally {
      setImporting(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/admin/products')}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>استيراد من Excel</Text>
          <MaterialIcons name="upload-file" size={22} color={Colors.orange} />
        </View>

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
        <View style={styles.goldLine} />
      </LinearGradient>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}>

        {/* Main import card */}
        <LinearGradient colors={['rgba(212,175,55,0.1)', 'rgba(212,175,55,0.03)']} style={styles.mainCard}>
          <MaterialIcons name="table-chart" size={48} color={Colors.gold} />
          <Text style={styles.mainTitle}>رفع ملف CSV / Excel</Text>
          <Text style={styles.mainSubtitle}>
            أضف عشرات المنتجات دفعة واحدة بدلاً من إضافتهم واحداً واحداً
          </Text>

          <TouchableOpacity style={styles.importBtn} onPress={handleDirectImport} disabled={importing}>
            {importing ? (
              <View style={styles.importBtnInner}>
                <ActivityIndicator color="#000" size="small" />
                <Text style={styles.importBtnText}>جاري الاستيراد...</Text>
              </View>
            ) : (
              <View style={styles.importBtnInner}>
                <MaterialIcons name="upload-file" size={22} color="#000" />
                <Text style={styles.importBtnText}>اختر ملف CSV وابدأ</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.guideBtn} onPress={() => setGuideVisible(true)}>
            <MaterialIcons name="help-outline" size={18} color={Colors.gold} />
            <Text style={styles.guideBtnText}>📖 اقرأ الشرح أولاً (مهم)</Text>
          </TouchableOpacity>
        </LinearGradient>

        {/* Result card */}
        {result ? (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <MaterialIcons
                name={result.failed === 0 ? 'check-circle' : 'warning'}
                size={28}
                color={result.failed === 0 ? Colors.success : Colors.orange}
              />
              <Text style={styles.resultTitle}>
                {result.failed === 0 ? 'اكتمل الاستيراد بنجاح!' : 'اكتمل مع بعض الأخطاء'}
              </Text>
            </View>

            <View style={styles.statsRow}>
              <View style={[styles.statBox, { borderColor: Colors.success + '40' }]}>
                <Text style={[styles.statNum, { color: Colors.success }]}>{result.success}</Text>
                <Text style={styles.statLabel}>تم استيراده</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.error + '40' }]}>
                <Text style={[styles.statNum, { color: Colors.error }]}>{result.failed}</Text>
                <Text style={styles.statLabel}>فشل</Text>
              </View>
              <View style={[styles.statBox, { borderColor: Colors.gold + '40' }]}>
                <Text style={[styles.statNum, { color: Colors.gold }]}>{result.success + result.failed}</Text>
                <Text style={styles.statLabel}>إجمالي</Text>
              </View>
            </View>

            {result.imported.length > 0 ? (
              <View style={styles.importedList}>
                <Text style={styles.importedListTitle}>المنتجات المستوردة:</Text>
                {result.imported.slice(0, 10).map((name, i) => (
                  <View key={i} style={styles.importedItem}>
                    <MaterialIcons name="check" size={14} color={Colors.success} />
                    <Text style={styles.importedItemText} numberOfLines={1}>{name}</Text>
                  </View>
                ))}
                {result.imported.length > 10 ? (
                  <Text style={styles.moreText}>+ {result.imported.length - 10} أخرى...</Text>
                ) : null}
              </View>
            ) : null}

            {result.errors.length > 0 ? (
              <View style={styles.errorsList}>
                <Text style={styles.errorsTitle}>الأخطاء:</Text>
                {result.errors.map((err, i) => (
                  <View key={i} style={styles.errorItem}>
                    <MaterialIcons name="error-outline" size={14} color={Colors.error} />
                    <Text style={styles.errorText}>{err}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            <TouchableOpacity style={styles.viewProductsBtn} onPress={() => router.push('/admin/products')}>
              <Text style={styles.viewProductsBtnText}>عرض المنتجات</Text>
              <MaterialIcons name="arrow-back" size={18} color="#000" />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Quick tips */}
        <View style={styles.tipsCard}>
          <Text style={styles.tipsTitle}>💡 نصائح سريعة</Text>
          {[
            'احفظ الملف بصيغة CSV وليس XLSX',
            'السطر الأول يجب أن يكون أسماء الأعمدة',
            'لا تترك صفوفاً فارغة في المنتصف',
            'إذا فيه فاصلة في النص ضعه بين علامات تنصيص ""',
            'لا تغير أسماء الأعمدة الإنجليزية',
          ].map((tip, i) => (
            <View key={i} style={styles.tipRow}>
              <View style={styles.tipDot} />
              <Text style={styles.tipText}>{tip}</Text>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ===================== GUIDE MODAL ===================== */}
      <Modal visible={guideVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.modalHeader, { paddingTop: 20 }]}>
            <TouchableOpacity onPress={() => setGuideVisible(false)}>
              <MaterialIcons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>دليل الاستيراد الكامل</Text>
            <MaterialIcons name="menu-book" size={22} color={Colors.gold} />
          </LinearGradient>

          {/* Guide Tabs */}
          <View style={styles.guideTabs}>
            {[
              { id: 'steps', label: 'الخطوات', icon: 'format-list-numbered' },
              { id: 'columns', label: 'الأعمدة', icon: 'table-chart' },
              { id: 'codes', label: 'الأكواد', icon: 'code' },
            ].map((tab) => (
              <TouchableOpacity
                key={tab.id}
                style={[styles.guideTab, activeGuideTab === tab.id && styles.guideTabActive]}
                onPress={() => setActiveGuideTab(tab.id as any)}
              >
                <MaterialIcons name={tab.icon as any} size={15} color={activeGuideTab === tab.id ? '#000' : Colors.textSecondary} />
                <Text style={[styles.guideTabText, activeGuideTab === tab.id && styles.guideTabTextActive]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>

            {/* ======== STEPS TAB ======== */}
            {activeGuideTab === 'steps' ? (
              <View style={styles.guideSection}>
                <Text style={styles.guideSectionTitle}>كيفية إعداد ملف الاستيراد خطوة بخطوة</Text>

                {[
                  {
                    step: '1',
                    title: 'افتح برنامج Excel أو Google Sheets',
                    detail: 'يمكنك استخدام Microsoft Excel، Google Sheets، أو LibreOffice Calc — كلها تعمل.',
                    icon: 'table-chart',
                    color: Colors.gold,
                  },
                  {
                    step: '2',
                    title: 'السطر الأول: أعمدة البيانات',
                    detail: 'اكتب في السطر الأول أسماء الأعمدة بالضبط:\nname, price, category_id, truck_type_ids, description, part_number, wholesale_price, sale_type, image_url',
                    icon: 'view-column',
                    color: Colors.orange,
                    isCode: true,
                    code: 'name,price,category_id,truck_type_ids,description,part_number,wholesale_price,sale_type,image_url',
                  },
                  {
                    step: '3',
                    title: 'ابتداءً من السطر الثاني: بيانات المنتجات',
                    detail: 'كل سطر = منتج واحد. مثال على صف منتج:',
                    icon: 'add-box',
                    color: Colors.success,
                    isCode: true,
                    code: 'طلمبة زيت MB3,85000,engine,"mb1,mb3",طلمبة أصلية مرسيدس,A0001802101,70000,both,',
                  },
                  {
                    step: '4',
                    title: 'احفظ الملف بصيغة CSV',
                    detail: 'من Excel: ملف → حفظ باسم → اختر "CSV UTF-8 (محدد بفاصلة)"\nمن Google Sheets: ملف → تنزيل → CSV',
                    icon: 'save',
                    color: '#3B82F6',
                  },
                  {
                    step: '5',
                    title: 'ارفع الملف في التطبيق',
                    detail: 'اضغط زر "اختر ملف CSV وابدأ" وانتظر حتى تظهر نتيجة الاستيراد.',
                    icon: 'cloud-upload',
                    color: Colors.gold,
                  },
                ].map((s) => (
                  <View key={s.step} style={styles.stepCard}>
                    <View style={[styles.stepNum, { backgroundColor: s.color + '20', borderColor: s.color + '40' }]}>
                      <Text style={[styles.stepNumText, { color: s.color }]}>{s.step}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 6 }}>
                      <View style={styles.stepTitleRow}>
                        <MaterialIcons name={s.icon as any} size={16} color={s.color} />
                        <Text style={styles.stepTitle}>{s.title}</Text>
                      </View>
                      <Text style={styles.stepDetail}>{s.detail}</Text>
                      {s.isCode && s.code ? (
                        <View style={styles.codeBox}>
                          <Text style={styles.codeText} selectable>{s.code}</Text>
                        </View>
                      ) : null}
                    </View>
                  </View>
                ))}

                {/* Example table */}
                <View style={styles.exampleSection}>
                  <Text style={styles.exampleTitle}>مثال على ملف CSV جاهز:</Text>
                  <View style={styles.codeBox}>
                    <Text style={styles.codeText} selectable>{
`name,price,category_id,truck_type_ids,description,part_number,wholesale_price,min_wholesale_qty,sale_type,is_original,in_stock,badge
طلمبة زيت MB3,85000,engine,"mb1,mb3",طلمبة زيت أصلية مرسيدس,A0001802101,70000,10,both,true,true,أصلي
فلتر هواء شامل,25000,filters,"mb1,mb2,mb3,mb4,mb5",فلتر هواء لجميع الموديلات,A0000901751,20000,20,both,true,true,الأكثر طلباً
دسك بريك MB4,78000,brakes,"mb4,mb5",دسك بريك خلفي عالي الجودة,A9704210012,,0,retail,true,true,`
                    }</Text>
                  </View>
                </View>

              </View>
            ) : null}

            {/* ======== COLUMNS TAB ======== */}
            {activeGuideTab === 'columns' ? (
              <View style={styles.guideSection}>
                <Text style={styles.guideSectionTitle}>أعمدة ملف CSV وشرحها</Text>

                <View style={styles.requiredNote}>
                  <MaterialIcons name="info" size={14} color={Colors.orange} />
                  <Text style={styles.requiredNoteText}>الأعمدة المطلوبة: name و price فقط. باقي الأعمدة اختيارية.</Text>
                </View>

                {COLUMNS_GUIDE.map((col) => (
                  <View key={col.col} style={[styles.colCard, col.req && styles.colCardRequired]}>
                    <View style={styles.colHeader}>
                      <View style={[styles.colReqBadge, { backgroundColor: col.req ? Colors.error + '20' : Colors.darkSurface, borderColor: col.req ? Colors.error + '40' : Colors.darkBorderLight }]}>
                        <Text style={[styles.colReqText, { color: col.req ? Colors.error : Colors.textMuted }]}>
                          {col.req ? 'مطلوب' : 'اختياري'}
                        </Text>
                      </View>
                      <Text style={styles.colName}>{col.col}</Text>
                    </View>
                    <Text style={styles.colArabic}>{col.arabic}</Text>
                    <View style={styles.colExampleRow}>
                      <Text style={styles.colExampleLabel}>مثال: </Text>
                      <View style={styles.colExampleBox}>
                        <Text style={styles.colExampleText}>{col.example}</Text>
                      </View>
                    </View>
                    {col.note ? <Text style={styles.colNote}>ملاحظة: {col.note}</Text> : null}
                  </View>
                ))}
              </View>
            ) : null}

            {/* ======== CODES TAB ======== */}
            {activeGuideTab === 'codes' ? (
              <View style={styles.guideSection}>
                <Text style={styles.guideSectionTitle}>أكواد الفئات والشاحنات</Text>
                <Text style={styles.codesNote}>
                  يجب استخدام هذه الأكواد بالضبط في عمود category_id وعمود truck_type_ids
                </Text>

                {/* Categories */}
                <View style={styles.codesGroup}>
                  <View style={styles.codesGroupHeader}>
                    <MaterialIcons name="category" size={18} color={Colors.orange} />
                    <Text style={styles.codesGroupTitle}>أكواد الفئات (category_id)</Text>
                  </View>
                  {CATEGORY_CODES.map((c) => (
                    <View key={c.id} style={styles.codeRow}>
                      <View style={styles.codeChip}>
                        <Text style={styles.codeChipText} selectable>{c.id}</Text>
                      </View>
                      <Text style={styles.codeName}>{c.name}</Text>
                    </View>
                  ))}
                </View>

                {/* Trucks */}
                <View style={styles.codesGroup}>
                  <View style={styles.codesGroupHeader}>
                    <MaterialIcons name="local-shipping" size={18} color={Colors.gold} />
                    <Text style={styles.codesGroupTitle}>أكواد الشاحنات (truck_type_ids)</Text>
                  </View>
                  <View style={styles.truckCodesNote}>
                    <MaterialIcons name="info-outline" size={14} color={Colors.textMuted} />
                    <Text style={styles.truckCodesNoteText}>
                      يمكن إضافة أكثر من شاحنة مفصولة بفاصلة. مثال: mb1,mb3,mb5
                    </Text>
                  </View>
                  {TRUCK_CODES.map((t) => (
                    <View key={t.id} style={styles.codeRow}>
                      <View style={[styles.codeChip, { borderColor: Colors.goldMuted + '50', backgroundColor: 'rgba(212,175,55,0.08)' }]}>
                        <Text style={[styles.codeChipText, { color: Colors.gold }]} selectable>{t.id}</Text>
                      </View>
                      <Text style={styles.codeName}>{t.name}</Text>
                    </View>
                  ))}
                </View>

                {/* Sale type */}
                <View style={styles.codesGroup}>
                  <View style={styles.codesGroupHeader}>
                    <MaterialIcons name="sell" size={18} color={Colors.success} />
                    <Text style={styles.codesGroupTitle}>قيم عمود sale_type</Text>
                  </View>
                  {[
                    { code: 'both', desc: 'مفرد وجملة (الافتراضي)' },
                    { code: 'retail', desc: 'مفرد فقط' },
                    { code: 'wholesale', desc: 'جملة فقط' },
                  ].map((s) => (
                    <View key={s.code} style={styles.codeRow}>
                      <View style={[styles.codeChip, { borderColor: Colors.success + '40', backgroundColor: Colors.success + '10' }]}>
                        <Text style={[styles.codeChipText, { color: Colors.success }]} selectable>{s.code}</Text>
                      </View>
                      <Text style={styles.codeName}>{s.desc}</Text>
                    </View>
                  ))}
                </View>

                {/* Warning */}
                <View style={styles.warningCard}>
                  <MaterialIcons name="warning" size={18} color={Colors.orange} />
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text style={styles.warningTitle}>تحذيرات مهمة</Text>
                    {[
                      'إذا أخطأت في كود الفئة سيرفض النظام الصف كاملاً',
                      'الشاحنات: استخدم فاصلة بدون مسافات بين الأكواد',
                      'الأسعار: أرقام فقط بدون حروف أو رموز (85000 وليس 85,000 د.ع)',
                      'الحقول النصية التي تحتوي فاصلة: ضعها بين " " (مزدوجتين)',
                    ].map((w, i) => (
                      <Text key={i} style={styles.warningText}>• {w}</Text>
                    ))}
                  </View>
                </View>

              </View>
            ) : null}

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
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3 },

  content: { padding: Spacing.md, gap: 16 },

  mainCard: {
    borderRadius: BorderRadius.xxl, borderWidth: 1, borderColor: Colors.goldMuted + '30',
    padding: 28, alignItems: 'center', gap: 14,
  },
  mainTitle: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, writingDirection: 'rtl' },
  mainSubtitle: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', writingDirection: 'rtl', lineHeight: 22 },
  importBtn: {
    backgroundColor: Colors.gold, borderRadius: BorderRadius.full,
    paddingHorizontal: 28, paddingVertical: 14, width: '100%',
  },
  importBtnInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  importBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold, color: '#000', writingDirection: 'rtl' },
  guideBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1, borderColor: Colors.goldMuted + '50',
    borderRadius: BorderRadius.full, paddingHorizontal: 20, paddingVertical: 10,
  },
  guideBtnText: { fontSize: FontSize.sm, color: Colors.gold, fontWeight: FontWeight.semibold, writingDirection: 'rtl' },

  tipsCard: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 16, gap: 10,
  },
  tipsTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.gold, textAlign: 'right', writingDirection: 'rtl' },
  tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  tipDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.orange, marginTop: 6 },
  tipText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },

  // Result
  resultCard: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 16, gap: 14,
  },
  resultHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'flex-end' },
  resultTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  statsRow: { flexDirection: 'row', gap: 10 },
  statBox: {
    flex: 1, alignItems: 'center', paddingVertical: 12,
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  statNum: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, writingDirection: 'rtl' },
  importedList: { gap: 6 },
  importedListTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.success, textAlign: 'right', writingDirection: 'rtl' },
  importedItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  importedItemText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  moreText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  errorsList: { gap: 6 },
  errorsTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.error, textAlign: 'right', writingDirection: 'rtl' },
  errorItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  errorText: { flex: 1, fontSize: FontSize.xs, color: Colors.error, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
  viewProductsBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.gold, borderRadius: BorderRadius.full, paddingVertical: 12,
  },
  viewProductsBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000', writingDirection: 'rtl' },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.darkBg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: 14,
  },
  modalTitle: { fontSize: FontSize.base, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },

  guideTabs: {
    flexDirection: 'row', gap: 8, padding: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorderLight,
    justifyContent: 'flex-end',
  },
  guideTab: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.darkBorderLight, backgroundColor: Colors.darkSurface,
  },
  guideTabActive: { backgroundColor: Colors.gold, borderColor: Colors.gold },
  guideTabText: { fontSize: FontSize.xs, color: Colors.textSecondary, writingDirection: 'rtl' },
  guideTabTextActive: { color: '#000', fontWeight: FontWeight.bold },

  modalContent: { padding: Spacing.md },
  guideSection: { gap: 16 },
  guideSectionTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },

  stepCard: {
    flexDirection: 'row', gap: 12,
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 14,
  },
  stepNum: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, flexShrink: 0,
  },
  stepNumText: { fontSize: FontSize.base, fontWeight: FontWeight.extrabold },
  stepTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  stepTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  stepDetail: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  codeBox: {
    backgroundColor: '#0D1117', borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.darkBorderLight + '60',
    padding: 10, direction: 'ltr',
  },
  codeText: { fontSize: 11, color: '#7ee787', fontFamily: 'monospace', lineHeight: 18 },

  exampleSection: { gap: 8 },
  exampleTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold, textAlign: 'right', writingDirection: 'rtl' },

  requiredNote: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(232,130,12,0.08)', borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: 'rgba(232,130,12,0.2)', padding: 10,
  },
  requiredNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.orange, textAlign: 'right', writingDirection: 'rtl' },

  colCard: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 12, gap: 6,
  },
  colCardRequired: { borderColor: Colors.error + '30', backgroundColor: 'rgba(239,68,68,0.04)' },
  colHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  colName: { fontSize: FontSize.sm, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, fontFamily: 'monospace' },
  colReqBadge: {
    borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 2,
  },
  colReqText: { fontSize: 10, fontWeight: FontWeight.bold },
  colArabic: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  colExampleRow: { flexDirection: 'row', alignItems: 'center', gap: 6, justifyContent: 'flex-end' },
  colExampleLabel: { fontSize: FontSize.xs, color: Colors.textMuted },
  colExampleBox: {
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.sm,
    paddingHorizontal: 8, paddingVertical: 3,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  colExampleText: { fontSize: 11, color: Colors.orange, fontFamily: 'monospace' },
  colNote: { fontSize: 10, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },

  codesNote: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20 },
  codesGroup: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 14, gap: 10,
  },
  codesGroupHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8, borderBottomWidth: 1, borderBottomColor: Colors.darkBorderLight, paddingBottom: 8 },
  codesGroupTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  codeRow: { flexDirection: 'row', alignItems: 'center', gap: 12, justifyContent: 'flex-end' },
  codeChip: {
    borderRadius: BorderRadius.sm, borderWidth: 1,
    borderColor: Colors.error + '30', backgroundColor: 'rgba(239,68,68,0.08)',
    paddingHorizontal: 10, paddingVertical: 4, minWidth: 80, alignItems: 'center',
  },
  codeChipText: { fontSize: 12, fontWeight: FontWeight.extrabold, color: Colors.error, fontFamily: 'monospace' },
  codeName: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  truckCodesNote: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.md, padding: 8,
  },
  truckCodesNoteText: { flex: 1, fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },

  warningCard: {
    flexDirection: 'row', gap: 10,
    backgroundColor: 'rgba(232,130,12,0.08)', borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: 'rgba(232,130,12,0.25)', padding: 14,
  },
  warningTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.orange, textAlign: 'right', writingDirection: 'rtl' },
  warningText: { fontSize: FontSize.xs, color: Colors.orange, textAlign: 'right', writingDirection: 'rtl', lineHeight: 20, opacity: 0.85 },
});
