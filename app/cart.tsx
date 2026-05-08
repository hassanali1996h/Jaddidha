import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { buildCartMessage, buildWhatsAppUrl } from '@/services/db';
import { FloatingWhatsApp } from '@/components';

export default function CartScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { cart, removeFromCart, clearCart, cartCount, whatsappNumber } = useApp();

  const handleSendOrder = () => {
    if (cart.length === 0) return;
    const truckName = 'أكتروس';
    const msg = buildCartMessage(cart, truckName);
    Linking.openURL(buildWhatsAppUrl(whatsappNumber, msg));
  };

  const totalItems = cartCount;

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient colors={['#000', '#0A0A0A']} style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>
          <View style={styles.headerTitle}>
            <Text style={styles.titleMain}>سلة الطلبات</Text>
            <Text style={styles.titleSub}>{totalItems} قطعة مختارة</Text>
          </View>
          {cart.length > 0 ? (
            <TouchableOpacity style={styles.clearBtn} onPress={clearCart}>
              <MaterialIcons name="delete-sweep" size={20} color={Colors.error} />
            </TouchableOpacity>
          ) : <View style={{ width: 40 }} />}
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      {cart.length === 0 ? (
        <View style={styles.emptyState}>
          <View style={styles.emptyIcon}>
            <MaterialIcons name="shopping-cart" size={56} color={Colors.textMuted} />
          </View>
          <Text style={styles.emptyTitle}>السلة فارغة</Text>
          <Text style={styles.emptyDesc}>ضيف قطع من المتجر وراح تظهر هنا</Text>
          <TouchableOpacity style={styles.shopBtn} onPress={() => router.back()} activeOpacity={0.85}>
            <LinearGradient colors={[Colors.gold, Colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.shopBtnGradient}>
              <Text style={styles.shopBtnText}>تصفح المنتجات</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={[styles.content, { paddingBottom: 200 }]}>
            {/* Cart Items */}
            {cart.map((item, idx) => (
              <View key={item.productId} style={styles.cartItem}>
                <View style={styles.itemNumber}>
                  <Text style={styles.itemNumberText}>{idx + 1}</Text>
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName} numberOfLines={2}>{item.productName}</Text>
                  <Text style={styles.itemCategory}>{item.categoryName}</Text>
                  {item.partNumber ? (
                    <Text style={styles.itemPartNum}>{item.partNumber}</Text>
                  ) : null}
                </View>
                <View style={styles.itemRight}>
                  <Text style={styles.itemPrice}>{item.price} د.ع</Text>
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeFromCart(item.productId)}>
                    <MaterialIcons name="close" size={16} color={Colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {/* Summary */}
            <View style={styles.summaryCard}>
              <LinearGradient colors={['#141414', '#0D0D0D']} style={styles.summaryGradient}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryVal}>{cart.length}</Text>
                  <Text style={styles.summaryLabel}>إجمالي القطع</Text>
                </View>
                <View style={styles.summaryDivider} />
                <Text style={styles.summaryNote}>
                  سيتم إرسال فاتورة كاملة عبر واتساب تتضمن جميع القطع المختارة مع أرقامها وأسعارها
                </Text>
              </LinearGradient>
            </View>
          </ScrollView>

          {/* Bottom Send Button */}
          <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
            <TouchableOpacity style={styles.sendBtn} onPress={handleSendOrder} activeOpacity={0.85}>
              <LinearGradient colors={['#25D366', '#1aac52']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.sendBtnGradient}>
                <MaterialIcons name="chat" size={22} color="#fff" />
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.sendBtnText}>أرسل الطلب عبر واتساب</Text>
                  <Text style={styles.sendBtnSub}>فاتورة بجميع القطع المختارة</Text>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </>
      )}
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
  clearBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { alignItems: 'flex-end', flex: 1, marginRight: 12 },
  titleMain: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  titleSub: { fontSize: FontSize.xs, color: Colors.gold, textAlign: 'right' },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, marginTop: 14, opacity: 0.4 },

  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 14, paddingHorizontal: 40 },
  emptyIcon: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: Colors.darkCard, borderWidth: 1, borderColor: Colors.darkBorderLight,
    alignItems: 'center', justifyContent: 'center',
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: FontWeight.bold, color: Colors.textPrimary, writingDirection: 'rtl' },
  emptyDesc: { fontSize: FontSize.base, color: Colors.textSecondary, textAlign: 'center', writingDirection: 'rtl' },
  shopBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.gold, marginTop: 8 },
  shopBtnGradient: { paddingHorizontal: 28, paddingVertical: 14 },
  shopBtnText: { color: '#000', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, writingDirection: 'rtl' },

  content: { padding: Spacing.md, gap: 10 },
  cartItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    padding: 14,
    gap: 12,
  },
  itemNumber: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: 'rgba(212,175,55,0.12)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  itemNumberText: { fontSize: FontSize.xs, fontWeight: FontWeight.bold, color: Colors.gold },
  itemInfo: { flex: 1, alignItems: 'flex-end', gap: 3 },
  itemName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  itemCategory: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },
  itemPartNum: { fontSize: 10, color: Colors.gold, fontFamily: 'monospace' },
  itemRight: { alignItems: 'flex-end', gap: 8 },
  itemPrice: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.gold },
  removeBtn: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)',
    alignItems: 'center', justifyContent: 'center',
  },

  summaryCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.goldMuted + '40', marginTop: 8 },
  summaryGradient: { padding: 16, gap: 10 },
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryLabel: { fontSize: FontSize.sm, color: Colors.textSecondary, writingDirection: 'rtl' },
  summaryVal: { fontSize: FontSize.xl, fontWeight: FontWeight.extrabold, color: Colors.gold },
  summaryDivider: { height: 1, backgroundColor: Colors.darkBorderLight },
  summaryNote: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },

  bottomBar: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    backgroundColor: Colors.darkBg,
    borderTopWidth: 1, borderTopColor: Colors.darkBorderLight,
    padding: Spacing.md,
    paddingTop: 12,
  },
  sendBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.gold, shadowColor: Colors.whatsapp },
  sendBtnGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12, paddingVertical: 16 },
  sendBtnText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, textAlign: 'right', writingDirection: 'rtl' },
  sendBtnSub: { color: 'rgba(255,255,255,0.75)', fontSize: FontSize.xs, textAlign: 'right', writingDirection: 'rtl' },
});
