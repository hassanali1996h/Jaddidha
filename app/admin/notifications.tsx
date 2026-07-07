// =============================================
// Jaddidha - Admin Notifications Screen
// =============================================
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
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { useAlert } from '@/template';
import {
  fetchNotifications,
  createNotification,
  deleteNotification,
  sendLocalNotification,
  scheduleNotification,
  sendPushToAllUsers,
  requestNotificationPermission,
  NotificationRecord,
} from '@/services/notifications';

const NOTIFICATION_TYPES = [
  { id: 'new_product', label: 'منتج جديد', icon: 'new-releases', color: Colors.gold },
  { id: 'offer', label: 'عرض خاص', icon: 'local-offer', color: Colors.orange },
  { id: 'general', label: 'إشعار عام', icon: 'notifications', color: Colors.success },
  { id: 'reminder', label: 'تذكير', icon: 'alarm', color: '#3B82F6' },
];

export default function AdminNotificationsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();

  const [notifications, setNotifications] = useState<NotificationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [hasPermission, setHasPermission] = useState(false);
  const [sending, setSending] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '',
    body: '',
    type: 'general',
    scheduleMinutes: '',
  });

  const ADMIN_MENU = [
    { label: 'المنتجات', icon: 'inventory', route: '/admin/products' },
    { label: 'الإعدادات', icon: 'settings', route: '/admin/settings' },
    { label: 'الصور', icon: 'photo-library', route: '/admin/images' },
    { label: 'طلبات القطع', icon: 'receipt-long', route: '/admin/requests' },
    { label: 'الإشعارات', icon: 'notifications', route: '/admin/notifications', active: true },
  ];

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchNotifications();
      setNotifications(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    requestNotificationPermission().then(setHasPermission);
  }, []);

  const handleRequestPermission = async () => {
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      showAlert('تم التفعيل', 'الإشعارات فُعِّلت بنجاح');
    } else {
      showAlert('غير مفعّل', 'يرجى السماح للإشعارات من إعدادات الجهاز');
    }
  };

  const handleSend = async () => {
    if (!form.title.trim() || !form.body.trim()) {
      showAlert('بيانات ناقصة', 'العنوان والنص مطلوبان');
      return;
    }

    setSending('sending');
    try {
      const scheduleMinutes = parseInt(form.scheduleMinutes || '0');
      let scheduleAt: string | null = null;

      if (scheduleMinutes > 0) {
        // Scheduled: save to DB only, will fire when users open app
        const schedDate = new Date(Date.now() + scheduleMinutes * 60 * 1000);
        scheduleAt = schedDate.toISOString();
        if (hasPermission) {
          await scheduleNotification(form.title, form.body, schedDate);
        }
      } else {
        // IMMEDIATE: Send to ALL registered devices via Edge Function (real push)
        const result = await sendPushToAllUsers(
          form.title,
          form.body,
          { type: form.type }
        );
        console.log(`Push sent: ${result.sent} devices, failed: ${result.failed}`);

        // Also fire locally on admin device
        if (hasPermission) {
          await sendLocalNotification(form.title, form.body);
        }
      }

      // Save to DB
      await createNotification({
        title: form.title,
        body: form.body,
        type: form.type,
        schedule_at: scheduleAt,
        sent_at: scheduleMinutes === 0 ? new Date().toISOString() : null,
        is_active: true,
      });

      await load();
      setModalVisible(false);
      setForm({ title: '', body: '', type: 'general', scheduleMinutes: '' });

      showAlert(
        scheduleMinutes > 0 ? 'تمت الجدولة' : '✅ تم الإرسال للجميع',
        scheduleMinutes > 0
          ? `سيصل الإشعار بعد ${scheduleMinutes} دقيقة عند فتح التطبيق`
          : 'تم إرسال الإشعار لجميع المستخدمين الذين فعّلوا الإشعارات'
      );
    } catch (e) {
      showAlert('خطأ', 'حصل مشكلة أثناء الإرسال');
    } finally {
      setSending(null);
    }
  };

  const handleDelete = (item: NotificationRecord) => {
    showAlert('حذف الإشعار', 'هل تريد حذف هذا الإشعار؟', [
      { text: 'إلغاء', style: 'cancel' },
      {
        text: 'حذف',
        style: 'destructive',
        onPress: async () => {
          if (item.id) {
            await deleteNotification(item.id);
            await load();
          }
        },
      },
    ]);
  };

  const getTypeInfo = (type: string) =>
    NOTIFICATION_TYPES.find((t) => t.id === type) || NOTIFICATION_TYPES[2];

  const renderItem = ({ item }: { item: NotificationRecord }) => {
    const typeInfo = getTypeInfo(item.type || 'general');
    const isSent = !!item.sent_at;
    const isScheduled = !!item.schedule_at && !item.sent_at;

    return (
      <View style={styles.notifCard}>
        <View style={styles.notifHeader}>
          <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDelete(item)}>
            <MaterialIcons name="delete" size={16} color={Colors.error} />
          </TouchableOpacity>
          <View style={styles.notifStatus}>
            <View style={[styles.typeBadge, { borderColor: typeInfo.color + '40', backgroundColor: typeInfo.color + '15' }]}>
              <MaterialIcons name={typeInfo.icon as any} size={12} color={typeInfo.color} />
              <Text style={[styles.typeBadgeText, { color: typeInfo.color }]}>{typeInfo.label}</Text>
            </View>
            <View style={[styles.statusDot, { backgroundColor: isSent ? Colors.success : isScheduled ? Colors.orange : Colors.textMuted }]} />
          </View>
        </View>

        <Text style={styles.notifTitle}>{item.title}</Text>
        <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>

        <View style={styles.notifFooter}>
          <Text style={styles.notifDate}>
            {new Date(item.created_at || '').toLocaleDateString('ar-IQ')}
          </Text>
          <Text style={[styles.notifSentLabel, { color: isSent ? Colors.success : isScheduled ? Colors.orange : Colors.textMuted }]}>
            {isSent ? 'تم الإرسال' : isScheduled ? 'مجدول' : 'مسودة'}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/admin/products')}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>الإشعارات</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setModalVisible(true)}>
            <MaterialIcons name="add" size={22} color="#000" />
          </TouchableOpacity>
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
        <View style={styles.goldLine} />
      </LinearGradient>

      {/* Permission banner */}
      {!hasPermission ? (
        <TouchableOpacity style={styles.permBanner} onPress={handleRequestPermission}>
          <MaterialIcons name="notifications-off" size={20} color={Colors.orange} />
          <Text style={styles.permBannerText}>الإشعارات غير مفعّلة — اضغط لتفعيلها</Text>
          <MaterialIcons name="arrow-back" size={18} color={Colors.orange} />
        </TouchableOpacity>
      ) : (
        <View style={styles.permOk}>
          <MaterialIcons name="check-circle" size={16} color={Colors.success} />
          <Text style={styles.permOkText}>الإشعارات مفعّلة</Text>
        </View>
      )}

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderItem}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="notifications-none" size={56} color={Colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد إشعارات بعد</Text>
              <Text style={styles.emptySubText}>اضغط + لإرسال إشعار جديد</Text>
            </View>
          }
        />
      )}

      {/* Send Notification Modal */}
      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet">
        <View style={styles.modal}>
          <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.modalHeader, { paddingTop: 20 }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <MaterialIcons name="close" size={24} color={Colors.textMuted} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>إشعار جديد</Text>
            <TouchableOpacity
              style={[styles.sendBtn, !hasPermission && styles.sendBtnDisabled]}
              onPress={handleSend}
              disabled={!!sending || !hasPermission}
            >
              {sending ? (
                <ActivityIndicator size="small" color={Colors.gold} />
              ) : (
                <Text style={styles.sendBtnText}>إرسال</Text>
              )}
            </TouchableOpacity>
          </LinearGradient>

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            {/* Type selector */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>نوع الإشعار</Text>
              <View style={styles.typeRow}>
                {NOTIFICATION_TYPES.map((t) => (
                  <TouchableOpacity
                    key={t.id}
                    style={[
                      styles.typeChip,
                      form.type === t.id && { backgroundColor: t.color + '20', borderColor: t.color },
                    ]}
                    onPress={() => setForm((f) => ({ ...f, type: t.id }))}
                  >
                    <MaterialIcons name={t.icon as any} size={16} color={form.type === t.id ? t.color : Colors.textMuted} />
                    <Text style={[styles.typeChipText, form.type === t.id && { color: t.color }]}>{t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Title */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>عنوان الإشعار *</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputText}
                  value={form.title}
                  onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                  placeholder="مثال: منتج جديد وصل!"
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                  writingDirection="rtl"
                />
              </View>
            </View>

            {/* Body */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>نص الإشعار *</Text>
              <View style={[styles.inputWrap, { height: 90 }]}>
                <TextInput
                  style={[styles.inputText, { textAlignVertical: 'top', paddingTop: 10 }]}
                  value={form.body}
                  onChangeText={(v) => setForm((f) => ({ ...f, body: v }))}
                  placeholder="وصف الإشعار بالتفصيل..."
                  placeholderTextColor={Colors.textMuted}
                  textAlign="right"
                  writingDirection="rtl"
                  multiline
                />
              </View>
            </View>

            {/* Schedule */}
            <View style={styles.formField}>
              <Text style={styles.formLabel}>جدولة (دقائق من الآن)</Text>
              <Text style={styles.formHint}>اتركه فارغاً للإرسال الفوري</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  style={styles.inputText}
                  value={form.scheduleMinutes}
                  onChangeText={(v) => setForm((f) => ({ ...f, scheduleMinutes: v }))}
                  placeholder="مثال: 30 (أي بعد 30 دقيقة)"
                  placeholderTextColor={Colors.textMuted}
                  keyboardType="number-pad"
                  textAlign="right"
                />
              </View>
            </View>

            {/* Preview */}
            {(form.title || form.body) ? (
              <View style={styles.previewSection}>
                <Text style={styles.previewLabel}>معاينة الإشعار</Text>
                <View style={styles.previewCard}>
                  <View style={styles.previewIcon}>
                    <MaterialIcons name="notifications" size={20} color={Colors.gold} />
                  </View>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <Text style={styles.previewTitle}>{form.title || 'العنوان'}</Text>
                    <Text style={styles.previewBody} numberOfLines={2}>{form.body || 'النص'}</Text>
                  </View>
                </View>
              </View>
            ) : null}

            {!hasPermission ? (
              <TouchableOpacity style={styles.permBtn} onPress={handleRequestPermission}>
                <MaterialIcons name="notifications" size={18} color="#000" />
                <Text style={styles.permBtnText}>فعّل الإشعارات أولاً</Text>
              </TouchableOpacity>
            ) : null}

            <View style={{ height: 50 }} />
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
  addBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center' },
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
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3 },

  permBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(232,130,12,0.12)',
    borderBottomWidth: 1, borderBottomColor: 'rgba(232,130,12,0.2)',
    paddingHorizontal: Spacing.md, paddingVertical: 12,
  },
  permBannerText: { flex: 1, fontSize: FontSize.sm, color: Colors.orange, textAlign: 'right', writingDirection: 'rtl' },
  permOk: {
    flexDirection: 'row', alignItems: 'center', gap: 8, justifyContent: 'flex-end',
    paddingHorizontal: Spacing.md, paddingVertical: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorderLight,
  },
  permOkText: { fontSize: FontSize.xs, color: Colors.success, writingDirection: 'rtl' },

  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: Spacing.md, gap: 10 },

  notifCard: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 14, gap: 8,
  },
  notifHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  notifStatus: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  typeBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  typeBadgeText: { fontSize: 10, fontWeight: FontWeight.semibold },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  deleteBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(239,68,68,0.1)', borderWidth: 1, borderColor: 'rgba(239,68,68,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  notifTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  notifBody: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },
  notifFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: Colors.darkBorderLight, paddingTop: 8 },
  notifDate: { fontSize: 10, color: Colors.textMuted },
  notifSentLabel: { fontSize: 10, fontWeight: FontWeight.semibold },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingTop: 80 },
  emptyText: { fontSize: FontSize.base, color: Colors.textSecondary, writingDirection: 'rtl' },
  emptySubText: { fontSize: FontSize.sm, color: Colors.textMuted, writingDirection: 'rtl' },

  // Modal
  modal: { flex: 1, backgroundColor: Colors.darkBg },
  modalHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, paddingBottom: 14,
  },
  modalTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  sendBtn: { backgroundColor: Colors.gold, borderRadius: BorderRadius.full, paddingHorizontal: 18, paddingVertical: 8, minWidth: 70, alignItems: 'center' },
  sendBtnDisabled: { backgroundColor: Colors.darkSurface },
  sendBtnText: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: '#000' },
  modalContent: { padding: Spacing.md },

  formField: { gap: 8, marginBottom: 16 },
  formLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.semibold, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  formHint: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  inputWrap: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.md,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    height: 48, justifyContent: 'center', paddingHorizontal: 12,
  },
  inputText: { color: Colors.textPrimary, fontSize: FontSize.sm, writingDirection: 'rtl' },

  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'flex-end' },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 7, borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  typeChipText: { fontSize: FontSize.xs, color: Colors.textMuted, writingDirection: 'rtl' },

  previewSection: { gap: 8, marginBottom: 16 },
  previewLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold, textAlign: 'right', writingDirection: 'rtl' },
  previewCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg,
    borderWidth: 1, borderColor: Colors.goldMuted + '40', padding: 14,
  },
  previewIcon: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(212,175,55,0.1)', borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  previewTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  previewBody: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', marginTop: 2 },

  permBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: Colors.orange, borderRadius: BorderRadius.full,
    paddingVertical: 14, marginVertical: 8,
  },
  permBtnText: { color: '#000', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, writingDirection: 'rtl' },
});
