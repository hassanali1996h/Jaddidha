import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { CATEGORIES, getTruckById } from '@/services/data';
import { CategoryCard, FloatingWhatsApp, GoldDivider, CartFab } from '@/components';
import { useApp } from '@/hooks/useApp';
import { buildWhatsAppUrl } from '@/services/db';

const { width } = Dimensions.get('window');

export default function CategoriesScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { truckId, truckName } = useLocalSearchParams<{ truckId: string; truckName: string }>();

  const truck = getTruckById(truckId);
  const { whatsappNumber, categories: dbCategories } = useApp();

  // Merge cloud images into local categories
  const categories = CATEGORIES.map((cat) => {
    const dbCat = dbCategories.find((d: any) => d.id === cat.id);
    return { ...cat, imageUrl: dbCat?.image_url || '' };
  });

  const handleCategorySelect = (category: any) => {
    router.push({
      pathname: '/products',
      params: {
        truckId,
        truckName: truckName,
        categoryId: category.id,
        categoryName: category.name,
      },
    });
  };

  const whatsappMessage = `مرحبا، أريد قطع ${truckName || 'أكتروس'}`;

  return (
    <View style={styles.root}>
      {/* Header */}
      <LinearGradient
        colors={['#000', '#0A0A0A']}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerInner}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <MaterialIcons name="arrow-forward-ios" size={20} color={Colors.gold} />
          </TouchableOpacity>

          <View style={styles.headerTitle}>
            <Text style={styles.titleMain}>{truckName}</Text>
            <Text style={styles.titleSub}>اختر التصنيف</Text>
          </View>

          {/* Truck badge */}
          <View style={styles.truckBadge}>
            <MaterialIcons name="local-shipping" size={20} color={Colors.gold} />
          </View>
        </View>

        {/* Gold line */}
        <View style={styles.goldLine} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 100 }]}
      >
        {/* Breadcrumb */}
        <View style={styles.breadcrumb}>
          <MaterialIcons name="keyboard-arrow-left" size={16} color={Colors.textMuted} />
          <Text style={styles.breadcrumbText}>التصنيفات</Text>
          <MaterialIcons name="keyboard-arrow-left" size={16} color={Colors.textMuted} />
          <Text style={[styles.breadcrumbText, styles.breadcrumbActive]}>{truckName}</Text>
          <MaterialIcons name="home" size={16} color={Colors.textMuted} />
        </View>

        {/* Info banner */}
        <LinearGradient
          colors={['rgba(212,175,55,0.08)', 'rgba(212,175,55,0.02)']}
          style={styles.infoBanner}
        >
          <View style={styles.infoBannerContent}>
            <View>
              <Text style={styles.infoBannerTitle}>{truckName}</Text>
              <Text style={styles.infoBannerSub}>
                {truck?.description} · {CATEGORIES.length} تصنيفات
              </Text>
            </View>
            <MaterialIcons name="local-shipping" size={36} color={Colors.goldMuted} />
          </View>
        </LinearGradient>

        {/* Section header */}
        <View style={styles.sectionHeader}>
          <GoldDivider width={30} />
          <Text style={styles.sectionTitle}>التصنيفات المتاحة</Text>
        </View>

        {/* Categories Grid */}
        <View style={styles.grid}>
          {CATEGORIES.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              onPress={handleCategorySelect}
            />
          ))}
        </View>

        {/* WhatsApp CTA */}
        <TouchableOpacity
          style={styles.waSection}
          activeOpacity={0.85}
          onPress={() => Linking.openURL(buildWhatsAppUrl(whatsappNumber, whatsappMessage))}
        >
          <LinearGradient
            colors={['rgba(37,211,102,0.12)', 'rgba(37,211,102,0.05)']}
            style={styles.waCard}
          >
            <MaterialIcons name="chat" size={32} color={Colors.whatsapp} />
            <View style={{ flex: 1, alignItems: 'flex-end' }}>
              <Text style={styles.waTitle}>ما تلكيت القطعة؟</Text>
              <Text style={styles.waDesc}>تواصل معنا مباشرة وراح نساعدك</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      <FloatingWhatsApp message={whatsappMessage} />
      <CartFab />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },

  // HEADER
  header: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 16,
  },
  headerInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    alignItems: 'flex-end',
    flex: 1,
    marginRight: 12,
  },
  titleMain: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  titleSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  truckBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldLine: {
    height: 1,
    backgroundColor: Colors.goldMuted,
    marginTop: 14,
    opacity: 0.4,
  },

  // CONTENT
  content: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    gap: 20,
  },

  // BREADCRUMB
  breadcrumb: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
  },
  breadcrumbText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    writingDirection: 'rtl',
  },
  breadcrumbActive: {
    color: Colors.gold,
    fontWeight: FontWeight.semibold,
  },

  // INFO BANNER
  infoBanner: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    padding: 16,
  },
  infoBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoBannerTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.gold,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  infoBannerSub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 3,
  },

  // SECTION HEADER
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  sectionTitle: {
    fontSize: FontSize.md,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // GRID
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },

  // WA SECTION
  waSection: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  waCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(37,211,102,0.25)',
  },
  waTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  waDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
});
