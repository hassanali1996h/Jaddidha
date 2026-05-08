import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  TouchableOpacity,
  Linking,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { ContactInfo } from '@/constants/config';
import { TruckCard, FloatingWhatsApp, SectionHeader, GoldDivider, CartFab } from '@/components';
import { useApp } from '@/hooks/useApp';
import { TRUCK_TYPES } from '@/services/data';
import { buildWhatsAppUrl } from '@/services/db';

const { width, height } = Dimensions.get('window');

const WHY_US = [
  { icon: 'build-circle', title: 'قطع موثوقة وبدون عيوب', desc: 'كل قطعة تطلبها تشتغل صح وتفي بالغرض بدون مفاجآت' },
  { icon: 'local-shipping', title: 'يوصلك سريع', desc: 'نوصل لجميع محافظات العراق بأسرع وقت' },
  { icon: 'support-agent', title: 'دعم فني مع الطلب', desc: 'فريقنا معك من أول ما تسأل لحد ما توصل القطعة' },
  { icon: 'price-check', title: 'سعر يناسب الجميع', desc: 'ما تدفع زيادة — أسعار واضحة ومناسبة' },
];

const TESTIMONIALS = [
  {
    id: '1',
    name: 'أبو علي المصلاوي',
    role: 'سائق شاحنة',
    text: 'تعامل ممتاز وقطع زينة والتوصيل وصل سريع جداً. طلبت فلاتر أكتروس MB3 ووصلت بيوم واحد ما قصّروا!',
    rating: 5,
    truck: 'Actros MB3',
  },
  {
    id: '2',
    name: 'حاج كريم البصراوي',
    role: 'أصحاب شركة نقل',
    text: 'أسعارهم مناسبة وشغلهم مرتب وأنصح بيهم. من يوم ما تعاملت معهم صارو الخيار الأول عندي.',
    rating: 5,
    truck: 'Actros MB4',
  },
  {
    id: '3',
    name: 'أبو محمد البغدادي',
    role: 'ميكانيكي شاحنات',
    text: 'قطع زينة وما بيها عيوب. صرت أطلب منهم دايماً وما خذلوني ولا مرة — هذا هو الكلام.',
    rating: 5,
    truck: 'Actros MB5',
  },
];

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { whatsappNumber, truckTypes, loadingData, settings } = useApp();

  const displayTrucks = truckTypes.length > 0
    ? truckTypes.map((t) => {
        const local = TRUCK_TYPES.find((lt) => lt.id === t.id);
        return { ...t, image: local?.image };
      })
    : TRUCK_TYPES;

  const handleTruckSelect = (truck: any) => {
    router.push({
      pathname: '/categories',
      params: { truckId: truck.id, truckName: truck.name },
    });
  };

  const handleCallWhatsApp = () => {
    const msg = settings.whatsapp_default_message || 'مرحبا، أريد الاستفسار عن قطع غيار أكتروس';
    Linking.openURL(buildWhatsAppUrl(whatsappNumber, msg));
  };

  return (
    <View style={styles.root}>
      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
      >
        {/* HERO */}
        <View style={styles.hero}>
          <Image
            source={settings.hero_image ? { uri: settings.hero_image } : require('@/assets/images/hero-banner.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={400}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.0)', 'rgba(0,0,0,0.85)', '#000']}
            style={StyleSheet.absoluteFill}
          />

          {/* Header Bar */}
          <View style={[styles.headerBar, { paddingTop: insets.top + 12 }]}>
            <TouchableOpacity style={styles.callBtn} onPress={handleCallWhatsApp}>
              <MaterialIcons name="chat" size={18} color="#fff" />
              <Text style={styles.callBtnText}>تواصل</Text>
            </TouchableOpacity>
            <View style={styles.brandContainer}>
              <Text style={styles.brandName}>جددها</Text>
              <View style={styles.brandLine} />
            </View>
          </View>

          {/* Hero Content */}
          <View style={styles.heroContent}>
            <View style={styles.heroBadge}>
              <MaterialIcons name="star" size={12} color={Colors.gold} />
              <Text style={styles.heroBadgeText}>متخصصون بأكتروس</Text>
            </View>
            <Text style={styles.heroTitle}>قطع غيار أكتروس{'\n'}بدون مشاكل</Text>
            <Text style={styles.heroSubtitle}>MB1 · MB2 · MB3 · MB4 · MB5</Text>
            <GoldDivider width={50} centered />
            <TouchableOpacity
              style={styles.heroBtn}
              onPress={handleCallWhatsApp}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={[Colors.gold, Colors.orange]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.heroBtnGradient}
              >
                <MaterialIcons name="chat" size={18} color="#000" />
                <Text style={styles.heroBtnText}>تواصل الآن</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* TRUCK TYPES */}
        <View style={styles.section}>
          <SectionHeader
            title="اختر نوع شاحنتك"
            subtitle="اختر موديل أكتروس وشوف القطع المتاحة"
          />
          <View style={styles.grid}>
            {displayTrucks.map((truck: any) => (
              <TruckCard key={truck.id} truck={truck} onPress={handleTruckSelect} />
            ))}
          </View>
        </View>

        {/* REQUEST PART BANNER */}
        <View style={styles.requestBanner}>
          <TouchableOpacity
            style={styles.requestCard}
            onPress={() => router.push('/request-part')}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['rgba(232,130,12,0.12)', 'rgba(212,175,55,0.06)']}
              style={styles.requestCardGradient}
            >
              <View style={styles.requestRight}>
                <Text style={styles.requestTitle}>ما لكيت القطعة؟</Text>
                <Text style={styles.requestDesc}>
                  أرسل لنا صورة أو رقم القطعة ونوفرها لك
                </Text>
                <View style={styles.requestBtn}>
                  <MaterialIcons name="image-search" size={14} color="#000" />
                  <Text style={styles.requestBtnText}>اطلب قطعة غير موجودة</Text>
                </View>
              </View>
              <View style={styles.requestIcon}>
                <MaterialIcons name="search" size={36} color={Colors.orange} />
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* WHY US */}
        <View style={[styles.section, styles.whyUsSection]}>
          <SectionHeader title="ليش جددها؟" subtitle="بنفكر بالسواق قبل الربح" />
          <View style={styles.whyGrid}>
            {WHY_US.map((item, index) => (
              <View key={index} style={styles.whyCard}>
                <LinearGradient colors={['#1A1A1A', '#111']} style={styles.whyCardGradient}>
                  <View style={styles.whyIconCircle}>
                    <MaterialIcons name={item.icon as any} size={24} color={Colors.gold} />
                  </View>
                  <Text style={styles.whyTitle}>{item.title}</Text>
                  <Text style={styles.whyDesc}>{item.desc}</Text>
                </LinearGradient>
              </View>
            ))}
          </View>
        </View>

        {/* TESTIMONIALS */}
        <View style={styles.section}>
          <SectionHeader title="آراء عملائنا" subtitle="ناس حقيقيين جربوا وشافوا بعيونهم" />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.testimonialsScroll}
          >
            {TESTIMONIALS.map((t) => (
              <View key={t.id} style={styles.testimonialCard}>
                <LinearGradient colors={['#141414', '#0D0D0D']} style={styles.testimonialGradient}>
                  <View style={styles.starsRow}>
                    {Array.from({ length: t.rating }).map((_, i) => (
                      <MaterialIcons key={i} name="star" size={14} color={Colors.gold} />
                    ))}
                  </View>
                  <MaterialIcons
                    name="format-quote"
                    size={28}
                    color={Colors.goldMuted}
                    style={{ alignSelf: 'flex-end', marginBottom: 4 }}
                  />
                  <Text style={styles.testimonialText}>{t.text}</Text>
                  <View style={styles.testimonialAuthor}>
                    <View style={styles.authorAvatar}>
                      <MaterialIcons name="person" size={20} color={Colors.gold} />
                    </View>
                    <View style={{ flex: 1, alignItems: 'flex-end' }}>
                      <Text style={styles.authorName}>{t.name}</Text>
                      <Text style={styles.authorRole}>{t.role} · {t.truck}</Text>
                    </View>
                  </View>
                </LinearGradient>
              </View>
            ))}
          </ScrollView>
        </View>

        {/* CONTACT */}
        <View style={[styles.section, styles.contactSection]}>
          <LinearGradient colors={['#111', '#0A0A0A']} style={styles.contactCard}>
            <View style={styles.contactGoldLine} />
            <SectionHeader title="تواصل معنا" subtitle="هنا نساعدك تلكي اللي تحتاجه" />
            <View style={styles.contactItems}>
              {[
                { icon: 'location-on', text: settings.location || ContactInfo.location },
                { icon: 'access-time', text: settings.working_hours || ContactInfo.workingHours },
                { icon: 'phone', text: settings.phone || ContactInfo.phone },
              ].map((item, i) => (
                <View key={i} style={styles.contactItem}>
                  <Text style={styles.contactText}>{item.text}</Text>
                  <View style={styles.contactIconWrap}>
                    <MaterialIcons name={item.icon as any} size={18} color={Colors.gold} />
                  </View>
                </View>
              ))}
            </View>
            <TouchableOpacity style={styles.bigWhatsAppBtn} onPress={handleCallWhatsApp} activeOpacity={0.85}>
              <LinearGradient
                colors={['#25D366', '#1aac52']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.bigWhatsAppGradient}
              >
                <MaterialIcons name="chat" size={22} color="#fff" />
                <Text style={styles.bigWhatsAppText}>تواصل عبر واتساب</Text>
              </LinearGradient>
            </TouchableOpacity>
          </LinearGradient>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <GoldDivider width={30} centered />
          <Text style={styles.footerText}>© 2025 جددها · جميع الحقوق محفوظة</Text>
          <Text style={styles.footerSub}>متخصصون بقطع غيار مرسيدس أكتروس</Text>
          <View style={styles.footerLinks}>
            <TouchableOpacity onPress={() => router.push('/admin')}>
              <Text style={styles.footerLinkMuted}>إدارة</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/about')}>
              <Text style={styles.footerLink}>عن التطبيق</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/privacy')}>
              <Text style={styles.footerLink}>سياسة الخصوصية</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <FloatingWhatsApp message={settings.whatsapp_default_message || 'مرحبا، أريد الاستفسار عن قطع غيار أكتروس'} />
      <CartFab />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
  scroll: { flex: 1 },

  hero: { height: height * 0.65, justifyContent: 'space-between' },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: 12,
  },
  brandContainer: { alignItems: 'flex-end' },
  brandName: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    letterSpacing: 1,
    writingDirection: 'rtl',
  },
  brandLine: { height: 2, width: '80%', backgroundColor: Colors.gold, alignSelf: 'flex-end', borderRadius: 1 },
  callBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  callBtnText: { color: '#fff', fontSize: FontSize.sm, fontWeight: FontWeight.semibold },
  heroContent: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.xl,
    alignItems: 'flex-end',
    gap: 10,
  },
  heroBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: Colors.goldMuted,
  },
  heroBadgeText: { color: Colors.gold, fontSize: FontSize.xs, fontWeight: FontWeight.semibold, writingDirection: 'rtl' },
  heroTitle: {
    fontSize: FontSize.xxxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 44,
  },
  heroSubtitle: { fontSize: FontSize.sm, color: Colors.gold, textAlign: 'right', letterSpacing: 2, fontWeight: FontWeight.medium },
  heroBtn: { marginTop: 6, borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.gold },
  heroBtnGradient: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 28, paddingVertical: 14 },
  heroBtnText: { color: '#000', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, writingDirection: 'rtl' },

  section: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xxl },
  whyUsSection: { paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  contactSection: { paddingHorizontal: 0 },

  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'space-between' },

  // Request banner
  requestBanner: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg },
  requestCard: { borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(232,130,12,0.3)' },
  requestCardGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16 },
  requestRight: { flex: 1, alignItems: 'flex-end', gap: 6 },
  requestTitle: { fontSize: FontSize.md, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  requestDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  requestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.orange,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 4,
  },
  requestBtnText: { color: '#000', fontSize: FontSize.sm, fontWeight: FontWeight.bold, writingDirection: 'rtl' },
  requestIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(232,130,12,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(232,130,12,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },

  whyGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  whyCard: { width: (width - 44) / 2, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.darkBorderLight },
  whyCardGradient: { padding: 16, alignItems: 'flex-end', gap: 8 },
  whyIconCircle: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  whyTitle: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  whyDesc: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 18 },

  testimonialsScroll: { paddingRight: 16, paddingLeft: 4, gap: 12, flexDirection: 'row' },
  testimonialCard: { width: width * 0.72, borderRadius: BorderRadius.xl, overflow: 'hidden', borderWidth: 1, borderColor: Colors.darkBorderLight },
  testimonialGradient: { padding: 16, gap: 8 },
  starsRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 2 },
  testimonialText: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl', lineHeight: 22 },
  testimonialAuthor: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 10,
    marginTop: 8, paddingTop: 12, borderTopWidth: 1, borderTopColor: Colors.darkBorderLight,
  },
  authorAvatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  authorName: { fontSize: FontSize.sm, fontWeight: FontWeight.bold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  authorRole: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'right', writingDirection: 'rtl' },

  contactCard: {
    marginHorizontal: Spacing.md, borderRadius: BorderRadius.xxl,
    padding: Spacing.lg, borderWidth: 1, borderColor: Colors.darkBorderLight,
    overflow: 'hidden', gap: 16,
  },
  contactGoldLine: { height: 2, backgroundColor: Colors.gold, borderRadius: 1, opacity: 0.5, marginBottom: 4 },
  contactItems: { gap: 12 },
  contactItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: 12 },
  contactIconWrap: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
  },
  contactText: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'right', writingDirection: 'rtl' },
  bigWhatsAppBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', marginTop: 8, ...Shadow.gold, shadowColor: Colors.whatsapp },
  bigWhatsAppGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  bigWhatsAppText: { color: '#fff', fontSize: FontSize.base, fontWeight: FontWeight.extrabold, writingDirection: 'rtl' },

  footer: { alignItems: 'center', paddingTop: Spacing.xl, paddingHorizontal: Spacing.md, gap: 6 },
  footerText: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center' },
  footerSub: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', opacity: 0.6, writingDirection: 'rtl' },
  footerLinks: { flexDirection: 'row', gap: 20, marginTop: 4 },
  footerLink: { fontSize: FontSize.xs, color: Colors.goldMuted, textAlign: 'center', writingDirection: 'rtl' },
  footerLinkMuted: { fontSize: FontSize.xs, color: Colors.textMuted, textAlign: 'center', writingDirection: 'rtl', opacity: 0.4 },
});
