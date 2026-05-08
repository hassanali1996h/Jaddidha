import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { fetchPartRequests, updatePartRequestStatus, DbPartRequest } from '@/services/db';

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'بانتظار المراجعة', color: Colors.orange },
  in_progress: { label: 'قيد المعالجة', color: '#3B82F6' },
  found: { label: 'تم التوفير', color: Colors.success },
  not_found: { label: 'غير متوفر', color: Colors.error },
};

export default function AdminRequestsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [requests, setRequests] = useState<DbPartRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => { load(); }, []);

  const load = async () => {
    try {
      setLoading(true);
      const data = await fetchPartRequests();
      setRequests(data);
    } finally {
      setLoading(false);
    }
  };

  const handleStatus = async (id: string, status: string) => {
    await updatePartRequestStatus(id, status);
    await load();
  };

  const filtered = filter === 'all' ? requests : requests.filter((r) => r.status === filter);

  const ADMIN_MENU = [
    { label: 'المنتجات', icon: 'inventory', route: '/admin/products' },
    { label: 'الإعدادات', icon: 'settings', route: '/admin/settings' },
    { label: 'طلبات القطع', icon: 'receipt-long', route: '/admin/requests', active: true },
    { label: 'الإشعارات', icon: 'notifications', route: '/admin/notifications' },
  ];

  const renderRequest = ({ item }: { item: DbPartRequest }) => {
    const statusInfo = STATUS_LABELS[item.status || 'pending'];
    return (
      <View style={styles.requestCard}>
        <View style={styles.requestHeader}>
          <View style={[styles.statusBadge, { borderColor: statusInfo.color + '40' }]}>
            <Text style={[styles.statusText, { color: statusInfo.color }]}>{statusInfo.label}</Text>
          </View>
          <Text style={styles.requestDate}>
            {new Date(item.created_at || '').toLocaleDateString('ar-IQ')}
          </Text>
        </View>

        <View style={styles.requestBody}>
          <View style={styles.requestRow}>
            <Text style={styles.requestVal}>{item.truck_name || '-'}</Text>
            <Text style={styles.requestKey}>الشاحنة:</Text>
          </View>
          {item.category_name ? (
            <View style={styles.requestRow}>
              <Text style={styles.requestVal}>{item.category_name}</Text>
              <Text style={styles.requestKey}>القسم:</Text>
            </View>
          ) : null}
          {item.part_name ? (
            <View style={styles.requestRow}>
              <Text style={styles.requestVal}>{item.part_name}</Text>
              <Text style={styles.requestKey}>القطعة:</Text>
            </View>
          ) : null}
          {item.part_number ? (
            <View style={styles.requestRow}>
              <Text style={[styles.requestVal, { fontFamily: 'monospace', color: Colors.gold }]}>{item.part_number}</Text>
              <Text style={styles.requestKey}>الرقم:</Text>
            </View>
          ) : null}
          {item.notes ? (
            <View style={styles.requestRow}>
              <Text style={styles.requestVal} numberOfLines={2}>{item.notes}</Text>
              <Text style={styles.requestKey}>ملاحظات:</Text>
            </View>
          ) : null}
          {item.customer_phone ? (
            <View style={styles.requestRow}>
              <Text style={styles.requestVal}>{item.customer_phone}</Text>
              <Text style={styles.requestKey}>رقم التواصل:</Text>
            </View>
          ) : null}
        </View>

        {/* Status Actions */}
        <View style={styles.statusActions}>
          {Object.entries(STATUS_LABELS).map(([key, info]) => (
            <TouchableOpacity
              key={key}
              style={[styles.statusBtn, item.status === key && { backgroundColor: info.color + '20', borderColor: info.color }]}
              onPress={() => item.id && handleStatus(item.id, key)}
            >
              <Text style={[styles.statusBtnText, item.status === key && { color: info.color }]}>{info.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.push('/admin/products')}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>طلبات القطع الخاصة</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{requests.filter((r) => r.status === 'pending').length}</Text>
          </View>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.navTabs}>
          {ADMIN_MENU.map((m) => (
            <TouchableOpacity key={m.route} style={[styles.navTab, m.active && styles.navTabActive]} onPress={() => router.push(m.route as any)}>
              <MaterialIcons name={m.icon as any} size={16} color={m.active ? '#000' : Colors.textSecondary} />
              <Text style={[styles.navTabText, m.active && styles.navTabTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterRow}>
          <TouchableOpacity style={[styles.filterChip, filter === 'all' && styles.filterChipActive]} onPress={() => setFilter('all')}>
            <Text style={[styles.filterText, filter === 'all' && styles.filterTextActive]}>الكل ({requests.length})</Text>
          </TouchableOpacity>
          {Object.entries(STATUS_LABELS).map(([key, info]) => (
            <TouchableOpacity
              key={key}
              style={[styles.filterChip, filter === key && { backgroundColor: info.color + '20', borderColor: info.color }]}
              onPress={() => setFilter(key)}
            >
              <Text style={[styles.filterText, filter === key && { color: info.color }]}>
                {info.label} ({requests.filter((r) => r.status === key).length})
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
        <View style={styles.goldLine} />
      </LinearGradient>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator color={Colors.gold} size="large" /></View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderRequest}
          keyExtractor={(item) => item.id || Math.random().toString()}
          contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialIcons name="inbox" size={48} color={Colors.textMuted} />
              <Text style={styles.emptyText}>لا توجد طلبات</Text>
            </View>
          }
        />
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
  headerTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  countBadge: {
    minWidth: 30, height: 30, borderRadius: 15,
    backgroundColor: Colors.error,
    alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 8,
  },
  countText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.bold },
  navTabs: { flexDirection: 'row', gap: 8, paddingBottom: 10 },
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
  filterRow: { flexDirection: 'row', gap: 8, paddingBottom: 10 },
  filterChip: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: BorderRadius.full,
    backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  filterChipActive: { backgroundColor: 'rgba(212,175,55,0.15)', borderColor: Colors.gold },
  filterText: { fontSize: FontSize.xs, color: Colors.textSecondary, writingDirection: 'rtl' },
  filterTextActive: { color: Colors.gold, fontWeight: FontWeight.semibold },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  list: { padding: Spacing.md, gap: 12 },
  requestCard: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.xl,
    borderWidth: 1, borderColor: Colors.darkBorderLight, padding: 14, gap: 12,
  },
  requestHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusBadge: {
    borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  statusText: { fontSize: FontSize.xs, fontWeight: FontWeight.semibold, writingDirection: 'rtl' },
  requestDate: { fontSize: FontSize.xs, color: Colors.textMuted },
  requestBody: { gap: 6 },
  requestRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8 },
  requestKey: { fontSize: FontSize.xs, color: Colors.textMuted, writingDirection: 'rtl', minWidth: 70, textAlign: 'left' },
  requestVal: { fontSize: FontSize.sm, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl', flex: 1 },
  statusActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'flex-end', borderTopWidth: 1, borderTopColor: Colors.darkBorderLight, paddingTop: 10 },
  statusBtn: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.darkBorderLight, backgroundColor: Colors.darkSurface,
  },
  statusBtnText: { fontSize: 10, color: Colors.textMuted, writingDirection: 'rtl' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingTop: 60 },
  emptyText: { fontSize: FontSize.base, color: Colors.textMuted, writingDirection: 'rtl' },
});
