import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  ActivityIndicator,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { getCategoryById, getTruckById } from '@/services/data';
import { fetchProducts, DbProduct, buildWhatsAppUrl, buildProductMessage } from '@/services/db';
import { FloatingWhatsApp, CartFab } from '@/components';
import { useApp } from '@/hooks/useApp';

export default function ProductDetailScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { productId, truckId, truckName: paramTruckName, categoryName: paramCategoryName } =
    useLocalSearchParams<{
      productId: string;
      truckId: string;
      truckName: string;
      categoryName: string;
    }>();

  const { whatsappNumber, addToCart, isInCart, removeFromCart } = useApp();
  const [product, setProduct] = useState<DbProduct | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchProducts();
        const found = data.find((p: DbProduct) => p.id === productId);
        setProduct(found || null);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [productId]);

  const truck = getTruckById(truckId);
  const truckLabel = paramTruckName || truck?.name || 'أكتروس';
  const inCart = isInCart(product?.id || '');

  if (loading) {
    return (
      <View style={styles.notFound}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.notFound}>
        <MaterialIcons name="error-outline" size={64} color={Colors.textMuted} />
        <Text style={styles.notFoundText}>المنتج غير موجود</Text>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backButtonText}>رجوع</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const category = getCategoryById(product.category_id);
  const categoryLabel = paramCategoryName || category?.name || '';

  const whatsappMessage = buildProductMessage(product.name, truckLabel, categoryLabel, product.part_number);

  const handleWhatsApp = () => {
    Linking.openURL(buildWhatsAppUrl(whatsappNumber, whatsappMessage));
  };

  const handleAddToCart = () => {
    if (inCart) {
      removeFromCart(product.id);
    } else {
      addToCart({
        productId: product.id,
        productName: product.name,
        partNumber: product.part_number,
        price: product.price,
        categoryName: categoryLabel,
        quantity: 1,
      });
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${product.name} - ${product.price} د.ع\nرقم القطعة: ${product.part_number || ''}\nللطلب: wa.me/${whatsappNumber}`,
        title: product.name,
      });
    } catch (_) {}
  };

  const hasDiscount = product.original_price && product.original_price !== product.price;
  const discountPct = hasDiscount
    ? Math.round(
        (1 -
          parseInt(product.price.replace(/,/g, '')) /
            parseInt(product.original_price!.replace(/,/g, ''))) *
          100
      )
    : 0;

  return (
    <View style={styles.root}>
      {/* Back & Share header overlay */}
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={handleShare}>
          <MaterialIcons name="share" size={20} color={Colors.textPrimary} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.iconBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 160 }}
      >
        {/* Product Image */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" transition={300} />
          <LinearGradient
            colors={['rgba(0,0,0,0.5)', 'transparent', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />

          {/* Badges on image */}
          <View style={styles.imageBadges}>
            {product.badge ? (
              <View style={styles.badgeOrange}>
                <Text style={styles.badgeText}>{product.badge}</Text>
              </View>
            ) : null}
            {hasDiscount ? (
              <View style={styles.badgeDiscount}>
                <Text style={styles.badgeText}>خصم {discountPct}%</Text>
              </View>
            ) : null}
            {inCart ? (
              <View style={[styles.badgeOrange, { backgroundColor: Colors.success }]}>
                <Text style={styles.badgeText}>في السلة</Text>
              </View>
            ) : null}
          </View>

          {/* Original & Stock status */}
          <View style={styles.imageBottomRow}>
            {product.is_original ? (
              <View style={styles.originalBadge}>
                <MaterialIcons name="verified" size={14} color={Colors.gold} />
                <Text style={styles.originalText}>قطعة أصلية</Text>
              </View>
            ) : null}
            <View style={[styles.stockBadge, !product.in_stock && styles.stockBadgeOut]}>
              <MaterialIcons
                name={product.in_stock ? 'check-circle' : 'cancel'}
                size={14}
                color={product.in_stock ? Colors.success : Colors.error}
              />
              <Text style={[styles.stockText, !product.in_stock && styles.stockTextOut]}>
                {product.in_stock ? 'متوفر في المخزون' : 'نفذت الكمية'}
              </Text>
            </View>
          </View>
        </View>

        {/* Content */}
        <View style={styles.content}>
          {/* Breadcrumb */}
          <View style={styles.breadcrumb}>
            <Text style={styles.breadcrumbText}>{truckLabel}</Text>
            <MaterialIcons name="keyboard-arrow-left" size={14} color={Colors.textMuted} />
            <Text style={[styles.breadcrumbText, { color: category?.color || Colors.gold }]}>
              {categoryLabel}
            </Text>
          </View>

          {/* Product Name */}
          <Text style={styles.productName}>{product.name}</Text>

          {/* Part Number */}
          {product.part_number ? (
            <View style={styles.partNumberRow}>
              <Text style={styles.partNumberVal}>{product.part_number}</Text>
              <Text style={styles.partNumberLabel}>رقم القطعة:</Text>
            </View>
          ) : null}

          <View style={styles.goldLine} />

          {/* Price Section */}
          <View style={styles.priceSection}>
            {/* Retail pricing */}
            {(product.sale_type !== 'wholesale') ? (
              <View style={styles.priceRow}>
                <Text style={styles.priceLabel}>سعر المفرد</Text>
                <View style={styles.priceValues}>
                  <Text style={styles.price}>{product.price} د.ع</Text>
                  {product.original_price ? (
                    <Text style={styles.originalPrice}>{product.original_price} د.ع</Text>
                  ) : null}
                </View>
              </View>
            ) : null}

            {/* Wholesale pricing */}
            {(product.sale_type === 'wholesale' || product.sale_type === 'both') && product.wholesale_price ? (
              <>
                {product.sale_type === 'both' ? <View style={styles.priceDivider} /> : null}
                <View style={styles.priceRow}>
                  <View style={styles.priceLabelRow}>
                    <MaterialIcons name="inventory" size={14} color="#A78BFA" />
                    <Text style={[styles.priceLabel, { color: '#A78BFA' }]}>سعر الجملة</Text>
                  </View>
                  <View style={styles.priceValues}>
                    <Text style={[styles.price, { color: '#A78BFA' }]}>{product.wholesale_price} د.ع</Text>
                    {product.min_wholesale_qty ? (
                      <Text style={styles.minQtyText}>من {product.min_wholesale_qty} قطعة</Text>
                    ) : null}
                  </View>
                </View>
              </>
            ) : null}

            {/* Sale type badge */}
            <View style={styles.saleTypeBadgeRow}>
              {['retail', 'wholesale', 'both'].map((type) => {
                const labels: Record<string, string> = { retail: 'مفرد فقط', wholesale: 'جملة فقط', both: 'مفرد وجملة' };
                const colors: Record<string, string> = { retail: Colors.gold, wholesale: '#A78BFA', both: Colors.orange };
                const isActive = (product.sale_type || 'both') === type;
                return (
                  <View key={type} style={[styles.saleTypePill, isActive && { backgroundColor: colors[type] + '20', borderColor: colors[type] }]}>
                    <Text style={[styles.saleTypePillText, isActive && { color: colors[type] }]}>{labels[type]}</Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Description */}
          <View style={styles.descSection}>
            <Text style={styles.descLabel}>وصف القطعة</Text>
            <Text style={styles.descText}>{product.description}</Text>
          </View>

          {/* Cart Button */}
          <TouchableOpacity
            style={[styles.cartBtn, inCart && styles.cartBtnActive]}
            onPress={handleAddToCart}
            activeOpacity={0.85}
          >
            <MaterialIcons
              name={inCart ? 'remove-shopping-cart' : 'add-shopping-cart'}
              size={20}
              color={inCart ? Colors.error : Colors.gold}
            />
            <Text style={[styles.cartBtnText, inCart && { color: Colors.error }]}>
              {inCart ? 'إزالة من السلة' : 'أضف للسلة'}
            </Text>
          </TouchableOpacity>

          {/* Compatible Trucks */}
          <View style={styles.compatibleSection}>
            <Text style={styles.compatibleLabel}>متوافق مع</Text>
            <View style={styles.compatibleList}>
              {(product.truck_type_ids || []).map((id) => {
                const t = getTruckById(id);
                return t ? (
                  <View
                    key={id}
                    style={[
                      styles.compatibleTag,
                      id === truckId && styles.compatibleTagActive,
                    ]}
                  >
                    <Text
                      style={[
                        styles.compatibleTagText,
                        id === truckId && styles.compatibleTagTextActive,
                      ]}
                    >
                      {t.name}
                    </Text>
                  </View>
                ) : null;
              })}
            </View>
          </View>

          {/* Features */}
          <View style={styles.featuresSection}>
            {[
              { icon: 'build-circle', text: 'قطعة بدون عيوب ومجربة', color: Colors.gold },
              { icon: 'local-shipping', text: 'توصيل لجميع المحافظات', color: Colors.orange },
              { icon: 'support-agent', text: 'دعم فني متخصص مع كل طلب', color: Colors.success },
            ].map((f, i) => (
              <View key={i} style={styles.featureItem}>
                <Text style={styles.featureText}>{f.text}</Text>
                <View style={[styles.featureIcon, { borderColor: f.color + '40' }]}>
                  <MaterialIcons name={f.icon as any} size={18} color={f.color} />
                </View>
              </View>
            ))}
          </View>

          {/* WhatsApp Order Button */}
          <TouchableOpacity
            style={[styles.orderBtn, !product.in_stock && styles.orderBtnPreorder]}
            onPress={handleWhatsApp}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={product.in_stock ? ['#25D366', '#1aac52'] : [Colors.darkSurface, Colors.darkCard]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.orderBtnGradient}
            >
              <MaterialIcons name="chat" size={22} color="#fff" />
              <View style={{ alignItems: 'flex-end' }}>
                <Text style={styles.orderBtnText}>
                  {product.in_stock ? 'اطلب عبر واتساب' : 'طلب مسبق عبر واتساب'}
                </Text>
                <Text style={styles.orderBtnSub}>سيتم التواصل معك فوراً</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <FloatingWhatsApp message={whatsappMessage} />
      <CartFab />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },

  notFound: {
    flex: 1, backgroundColor: Colors.darkBg,
    alignItems: 'center', justifyContent: 'center', gap: 16,
  },
  notFoundText: { color: Colors.textSecondary, fontSize: FontSize.lg },
  backButton: {
    backgroundColor: Colors.gold, borderRadius: BorderRadius.full,
    paddingHorizontal: 24, paddingVertical: 12,
  },
  backButtonText: { color: '#000', fontWeight: FontWeight.bold, fontSize: FontSize.base },

  topBar: {
    position: 'absolute', top: 0, left: 0, right: 0,
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: Spacing.md, zIndex: 100,
  },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center', justifyContent: 'center',
  },

  imageContainer: { height: 320, position: 'relative', justifyContent: 'flex-end' },
  image: { ...StyleSheet.absoluteFillObject },
  imageBadges: { position: 'absolute', top: 80, left: 16, gap: 6 },
  badgeOrange: {
    backgroundColor: Colors.orange, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeDiscount: {
    backgroundColor: Colors.error, borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  badgeText: { color: '#fff', fontSize: FontSize.xs, fontWeight: FontWeight.bold },
  imageBottomRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingBottom: 16,
  },
  originalBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: Colors.goldMuted,
  },
  originalText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  stockBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: 'rgba(34,197,94,0.15)', borderRadius: BorderRadius.full,
    paddingHorizontal: 10, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(34,197,94,0.3)',
  },
  stockBadgeOut: { backgroundColor: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.3)' },
  stockText: { color: Colors.success, fontSize: FontSize.xs, fontWeight: FontWeight.semibold },
  stockTextOut: { color: Colors.error },

  content: { padding: Spacing.md, gap: 16 },
  breadcrumb: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  breadcrumbText: { fontSize: FontSize.xs, color: Colors.textMuted, writingDirection: 'rtl' },
  productName: {
    fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 34,
  },
  partNumberRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 8,
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.md,
    paddingHorizontal: 12, paddingVertical: 8,
  },
  partNumberLabel: { fontSize: FontSize.xs, color: Colors.textMuted, writingDirection: 'rtl' },
  partNumberVal: { fontSize: FontSize.xs, color: Colors.gold, fontFamily: 'monospace', letterSpacing: 1 },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, opacity: 0.3 },

  priceSection: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  priceLabel: { fontSize: FontSize.sm, color: Colors.textMuted, writingDirection: 'rtl' },
  priceValues: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  price: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.gold },
  originalPrice: { fontSize: FontSize.sm, color: Colors.textMuted, textDecorationLine: 'line-through' },

  priceDivider: { height: 1, backgroundColor: Colors.darkBorderLight, opacity: 0.5 },
  priceLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  minQtyText: { fontSize: FontSize.xs, color: '#A78BFA', opacity: 0.8 },
  saleTypeBadgeRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 6, flexWrap: 'wrap', marginTop: 4 },
  saleTypePill: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: BorderRadius.full,
    borderWidth: 1, borderColor: Colors.darkBorderLight, backgroundColor: Colors.darkSurface,
  },
  saleTypePillText: { fontSize: 10, color: Colors.textMuted },

  descSection: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.darkBorderLight, gap: 8,
  },
  descLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold, textAlign: 'right', writingDirection: 'rtl' },
  descText: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 26 },

  cartBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.full, borderWidth: 1,
    borderColor: Colors.goldMuted, paddingVertical: 13,
  },
  cartBtnActive: { borderColor: 'rgba(239,68,68,0.5)', backgroundColor: 'rgba(239,68,68,0.08)' },
  cartBtnText: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.gold, writingDirection: 'rtl' },

  compatibleSection: { gap: 10 },
  compatibleLabel: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  compatibleList: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'flex-end', gap: 8 },
  compatibleTag: {
    backgroundColor: Colors.darkSurface, borderRadius: BorderRadius.full,
    paddingHorizontal: 14, paddingVertical: 6, borderWidth: 1, borderColor: Colors.darkBorderLight,
  },
  compatibleTagActive: { backgroundColor: 'rgba(212,175,55,0.12)', borderColor: Colors.goldMuted },
  compatibleTagText: { fontSize: FontSize.xs, color: Colors.textSecondary },
  compatibleTagTextActive: { color: Colors.gold, fontWeight: FontWeight.semibold },

  featuresSection: {
    backgroundColor: Colors.darkCard, borderRadius: BorderRadius.lg, padding: 16,
    borderWidth: 1, borderColor: Colors.darkBorderLight, gap: 12,
  },
  featureItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  featureText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  featureIcon: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: Colors.darkSurface, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },

  orderBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.gold, shadowColor: Colors.whatsapp, marginTop: 8 },
  orderBtnPreorder: { shadowColor: Colors.darkBorderLight },
  orderBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 18, paddingHorizontal: 28 },
  orderBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, textAlign: 'right', writingDirection: 'rtl' },
  orderBtnSub: { color: 'rgba(255,255,255,0.7)', fontSize: FontSize.xs, textAlign: 'right', writingDirection: 'rtl' },
});
