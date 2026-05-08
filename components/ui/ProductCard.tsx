import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius, FontSize, FontWeight, Shadow, Spacing } from '@/constants/theme';
import { DbProduct } from '@/services/db';
import { useApp } from '@/hooks/useApp';
import { buildWhatsAppUrl, buildProductMessage } from '@/services/db';

const SALE_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  retail: { label: 'مفرد', color: Colors.gold },
  wholesale: { label: 'جملة', color: '#A78BFA' },
  both: { label: 'مفرد وجملة', color: Colors.orange },
};

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

interface ProductCardProps {
  product: DbProduct;
  truckId: string;
  truckName?: string;
  categoryName?: string;
}

export function ProductCard({ product, truckId, truckName = 'أكتروس', categoryName = '' }: ProductCardProps) {
  const [pressed, setPressed] = useState(false);
  const router = useRouter();
  const { whatsappNumber, addToCart, isInCart, cart } = useApp();
  const inCart = isInCart(product.id);

  const handleWhatsApp = () => {
    const msg = buildProductMessage(product.name, truckName, categoryName, product.part_number);
    Linking.openURL(buildWhatsAppUrl(whatsappNumber, msg));
  };

  const handleCardPress = () => {
    router.push({
      pathname: '/product-detail',
      params: {
        productId: product.id,
        truckId,
        truckName,
        categoryName,
      },
    });
  };

  const handleAddToCart = () => {
    if (inCart) {
      router.push('/cart');
      return;
    }
    addToCart({
      productId: product.id,
      productName: product.name,
      partNumber: product.part_number,
      price: product.price,
      wholesalePrice: product.wholesale_price,
      minWholesaleQty: product.min_wholesale_qty,
      categoryName,
      quantity: 1,
    });
  };

  const saleType = product.sale_type || 'both';
  const saleInfo = SALE_TYPE_LABELS[saleType] || SALE_TYPE_LABELS.both;
  const hasWholesale = (saleType === 'wholesale' || saleType === 'both') && product.wholesale_price;

  return (
    <TouchableOpacity
      style={[styles.card, pressed && styles.cardPressed]}
      onPress={handleCardPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      activeOpacity={0.9}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.image_url }} style={styles.image} contentFit="cover" transition={200} />
        <LinearGradient colors={['transparent', 'rgba(0,0,0,0.7)']} style={styles.imageGradient} />

        {/* Badge */}
        {product.badge ? (
          <View style={[styles.badge, !product.in_stock && styles.badgeOutOfStock]}>
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
        ) : null}

        {/* Sale type tag */}
        <View style={[styles.saleTypeTag, { borderColor: saleInfo.color + '50', backgroundColor: saleInfo.color + '18' }]}>
          <Text style={[styles.saleTypeText, { color: saleInfo.color }]}>{saleInfo.label}</Text>
        </View>

        {/* Cart indicator */}
        {inCart ? (
          <View style={styles.inCartTag}>
            <MaterialIcons name="check" size={10} color="#fff" />
          </View>
        ) : null}

        {/* Original tag */}
        {product.is_original ? (
          <View style={styles.originalTag}>
            <MaterialIcons name="verified" size={10} color={Colors.gold} />
            <Text style={styles.originalText}>أصلي</Text>
          </View>
        ) : null}

        {/* Out of stock */}
        {!product.in_stock ? (
          <View style={styles.outOfStockOverlay}>
            <Text style={styles.outOfStockText}>نفذت الكمية</Text>
          </View>
        ) : null}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={2}>{product.name}</Text>

        {product.part_number ? (
          <Text style={styles.partNumber}>{product.part_number}</Text>
        ) : null}

        {/* Retail Price */}
        {saleType !== 'wholesale' ? (
          <View style={styles.priceRow}>
            <Text style={styles.price}>{product.price} د.ع</Text>
            {product.original_price ? (
              <Text style={styles.originalPrice}>{product.original_price}</Text>
            ) : null}
          </View>
        ) : null}

        {/* Wholesale Price */}
        {hasWholesale ? (
          <View style={styles.wholesaleRow}>
            <MaterialIcons name="inventory" size={10} color="#A78BFA" />
            <Text style={styles.wholesalePrice}>{product.wholesale_price} د.ع جملة</Text>
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.cartBtn, inCart && styles.cartBtnActive]}
            onPress={handleAddToCart}
            activeOpacity={0.8}
          >
            <MaterialIcons name={inCart ? 'check' : 'add-shopping-cart'} size={14} color={inCart ? Colors.gold : Colors.textSecondary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.waBtn, !product.in_stock && styles.waBtnDisabled]}
            onPress={handleWhatsApp}
            activeOpacity={0.8}
            disabled={!product.in_stock}
          >
            <MaterialIcons name="chat" size={12} color="#fff" />
            <Text style={styles.waBtnText}>{product.in_stock ? 'اطلب الآن' : 'طلب مسبق'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH, borderRadius: BorderRadius.lg, overflow: 'hidden',
    backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorderLight, ...Shadow.dark,
  },
  cardPressed: { borderColor: Colors.goldMuted },
  imageContainer: { height: 140, position: 'relative' },
  image: { width: '100%', height: '100%' },
  imageGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%' },
  saleTypeTag: {
    position: 'absolute', top: 8, right: 8,
    borderRadius: BorderRadius.full, borderWidth: 1,
    paddingHorizontal: 6, paddingVertical: 2,
  },
  saleTypeText: { fontSize: 9, fontWeight: FontWeight.bold },
  badge: {
    position: 'absolute', top: 30, right: 8,
    backgroundColor: Colors.orange, borderRadius: BorderRadius.full,
    paddingHorizontal: 7, paddingVertical: 3,
  },
  badgeOutOfStock: { backgroundColor: Colors.textMuted },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: FontWeight.bold },
  inCartTag: {
    position: 'absolute', top: 8, left: 8,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: Colors.success,
    alignItems: 'center', justifyContent: 'center',
  },
  originalTag: {
    position: 'absolute', bottom: 8, left: 8,
    flexDirection: 'row', alignItems: 'center', gap: 3,
    backgroundColor: 'rgba(0,0,0,0.7)', borderRadius: BorderRadius.full,
    paddingHorizontal: 6, paddingVertical: 3,
  },
  originalText: { color: Colors.gold, fontSize: 10, fontWeight: FontWeight.semibold },
  outOfStockOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  outOfStockText: { color: Colors.textSecondary, fontSize: FontSize.sm, fontWeight: FontWeight.bold },

  content: { padding: 10, gap: 5 },
  name: {
    fontSize: 12, fontWeight: FontWeight.bold, color: Colors.textPrimary,
    textAlign: 'right', writingDirection: 'rtl', lineHeight: 18,
  },
  partNumber: { fontSize: 10, color: Colors.textMuted, textAlign: 'right', fontFamily: 'monospace' },
  priceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 6 },
  price: { fontSize: 13, fontWeight: FontWeight.bold, color: Colors.gold },
  originalPrice: { fontSize: 11, color: Colors.textMuted, textDecorationLine: 'line-through' },

  wholesaleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  wholesalePrice: { fontSize: 11, fontWeight: FontWeight.semibold, color: '#A78BFA' },

  actions: { flexDirection: 'row', gap: 6, marginTop: 2 },
  cartBtn: {
    width: 32, height: 32, borderRadius: 8,
    borderWidth: 1, borderColor: Colors.darkBorderLight,
    backgroundColor: Colors.darkSurface,
    alignItems: 'center', justifyContent: 'center',
  },
  cartBtnActive: { borderColor: Colors.goldMuted, backgroundColor: 'rgba(212,175,55,0.1)' },
  waBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    backgroundColor: Colors.whatsapp, borderRadius: BorderRadius.md, paddingVertical: 8,
  },
  waBtnDisabled: { backgroundColor: Colors.darkBorderLight },
  waBtnText: { color: '#fff', fontSize: 11, fontWeight: FontWeight.bold },
});
