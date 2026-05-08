import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { fetchProducts, DbProduct, buildWhatsAppUrl } from '@/services/db';
import { CATEGORIES, getCategoryById } from '@/services/data';
import { ProductCard, FloatingWhatsApp, CartFab } from '@/components';
import { useApp } from '@/hooks/useApp';

export default function ProductsScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { truckId, truckName, categoryId, categoryName } =
    useLocalSearchParams<{
      truckId: string;
      truckName: string;
      categoryId: string;
      categoryName: string;
    }>();

  const { whatsappNumber } = useApp();
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const category = getCategoryById(categoryId);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const data = await fetchProducts(truckId, categoryId);
        setProducts(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [truckId, categoryId]);

  const filteredProducts = useMemo(() => {
    if (!search.trim()) return products;
    return products.filter(
      (p) =>
        p.name.includes(search) ||
        (p.name_en && p.name_en.toLowerCase().includes(search.toLowerCase())) ||
        (p.part_number && p.part_number.includes(search))
    );
  }, [products, search]);

  const whatsappMessage = `مرحبا، أريد ${categoryName || 'قطع'} ${truckName || 'أكتروس'}`;

  const renderProduct = ({ item }: { item: DbProduct }) => (
    <ProductCard product={item} truckId={truckId} truckName={truckName} categoryName={categoryName} />
  );

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.titleMain}>{categoryName}</Text>
            <Text style={styles.titleSub}>{truckName}</Text>
          </View>
          <View style={[styles.categoryIcon, { shadowColor: category?.color || Colors.gold }]}>
            <MaterialIcons name={(category?.icon as any) || 'category'} size={20} color={category?.color || Colors.gold} />
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <MaterialIcons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="ابحث عن قطعة أو رقم..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            textAlign="right"
          />
          {search.length > 0 ? (
            <TouchableOpacity onPress={() => setSearch('')}>
              <MaterialIcons name="close" size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      {/* Stats bar */}
      <View style={styles.statsBar}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{filteredProducts.filter((p) => p.in_stock).length}</Text>
          <Text style={styles.statLabel}>متوفر</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={styles.statVal}>{filteredProducts.length}</Text>
          <Text style={styles.statLabel}>إجمالي القطع</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.stat}>
          <Text style={[styles.statVal, { color: Colors.orange }]}>جددها</Text>
          <Text style={styles.statLabel}>جودة مضمونة</Text>
        </View>
      </View>

      {filteredProducts.length === 0 && !loading ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="search-off" size={64} color={Colors.textMuted} />
          <Text style={styles.emptyTitle}>لا توجد قطع</Text>
          <Text style={styles.emptyDesc}>
            {search ? 'جرب كلمة بحث مختلفة' : 'لا توجد قطع متاحة لهذا التصنيف حالياً'}
          </Text>
          <TouchableOpacity
            style={styles.emptyWaBtn}
            onPress={() => Linking.openURL(buildWhatsAppUrl(whatsappNumber, whatsappMessage))}
          >
            <MaterialIcons name="chat" size={18} color="#fff" />
            <Text style={styles.emptyWaBtnText}>اطلب عبر واتساب</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.emptyWaBtn, { backgroundColor: Colors.orange }]}
            onPress={() => router.push('/request-part')}
          >
            <MaterialIcons name="image-search" size={18} color="#000" />
            <Text style={[styles.emptyWaBtnText, { color: '#000' }]}>اطلب قطعة غير موجودة</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 180 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            search.length > 0 ? (
              <Text style={styles.searchResult}>{filteredProducts.length} نتيجة لـ "{search}"</Text>
            ) : null
          }
        />
      )}

      <FloatingWhatsApp message={whatsappMessage} />
      <CartFab />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: Spacing.md, paddingBottom: 12, gap: 12 },
  headerInner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { alignItems: 'flex-end', flex: 1, marginRight: 12 },
  titleMain: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  titleSub: { fontSize: FontSize.xs, color: Colors.gold, textAlign: 'right', writingDirection: 'rtl' },
  categoryIcon: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
    shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 6,
  },
  searchContainer: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: Colors.darkSurface,
    borderRadius: BorderRadius.full, paddingHorizontal: 14, paddingVertical: 10,
    borderWidth: 1, borderColor: Colors.darkBorderLight, gap: 8,
  },
  searchInput: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.sm, writingDirection: 'rtl', padding: 0 },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3, marginTop: 4 },

  statsBar: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
    backgroundColor: Colors.darkCard, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.darkBorderLight,
  },
  stat: { alignItems: 'center', gap: 2 },
  statVal: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.gold },
  statLabel: { fontSize: FontSize.xs, color: Colors.textMuted, writingDirection: 'rtl' },
  statDivider: { width: 1, height: 30, backgroundColor: Colors.darkBorderLight },

  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: 12 },
  row: { justifyContent: 'space-between', gap: 12 },
  searchResult: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', marginBottom: 8 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  emptyDesc: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', writingDirection: 'rtl' },
  emptyWaBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: Colors.whatsapp,
    borderRadius: BorderRadius.full, paddingHorizontal: 24, paddingVertical: 12,
  },
  emptyWaBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.bold, writingDirection: 'rtl' },
});
