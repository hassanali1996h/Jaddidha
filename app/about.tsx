import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { AppConfig, ContactInfo } from '@/constants/config';

const STATS = [
  { value: '+500', label: 'قطعة متاحة' },
  { value: '+5', label: 'سنوات خبرة' },
  { value: '5', label: 'موديلات أكتروس' },
  { value: '100%', label: 'رضا العملاء' },
];

const TEAM_VALUES = [
  {
    icon: 'verified',
    title: 'جودة تشتغل',
    desc: 'كل قطعة نبيعها مجربة ومضمونة — ما نبيع شيء ما نرضى بيه لنفسنا',
    color: Colors.gold,
  },
  {
    icon: 'speed',
    title: 'السرعة والكفاءة',
    desc: 'نوصل طلباتك بأسرع وقت ممكن لجميع محافظات العراق',
    color: Colors.orange,
  },
  {
    icon: 'support-agent',
    title: 'الدعم المتواصل',
    desc: 'فريقنا المتخصص متاح دائماً للإجابة على استفساراتك',
    color: Colors.success,
  },
  {
    icon: 'handshake',
    title: 'الثقة والشفافية',
    desc: 'نؤمن بأن العلاقات طويلة المدى تُبنى على الصدق والوضوح',
    color: '#A78BFA',
  },
];

export default function AboutScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const openWhatsApp = () => {
    const url = `https://wa.me/${AppConfig.whatsappNumber}?text=${encodeURIComponent(AppConfig.whatsappDefaultMessage)}`;
    Linking.openURL(url);
  };

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
            <Text style={styles.titleMain}>عن جددها</Text>
            <Text style={styles.titleSub}>من نحن</Text>
          </View>
          <View style={styles.iconWrap}>
            <MaterialIcons name="business" size={20} color={Colors.gold} />
          </View>
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Hero Banner */}
        <View style={styles.heroBanner}>
          <Image
            source={require('@/assets/images/hero-banner.jpg')}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            transition={300}
          />
          <LinearGradient
            colors={['rgba(0,0,0,0.6)', 'rgba(0,0,0,0.85)']}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.heroContent}>
            <View style={styles.logoBadge}>
              <Text style={styles.logoText}>{AppConfig.brandName}</Text>
            </View>
            <Text style={styles.heroTitle}>متخصصون بقطع غيار مرسيدس أكتروس</Text>
            <Text style={styles.heroSub}>{ContactInfo.location}</Text>
          </View>
        </View>

        {/* Stats */}
        <View style={styles.statsGrid}>
          {STATS.map((s, i) => (
            <View key={i} style={styles.statCard}>
              <LinearGradient colors={['#141414', '#0D0D0D']} style={styles.statCardGradient}>
                <Text style={styles.statValue}>{s.value}</Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </LinearGradient>
            </View>
          ))}
        </View>

        {/* Story */}
        <View style={styles.storySection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.goldDot} />
            <Text style={styles.sectionTitle}>قصتنا</Text>
          </View>
          <Text style={styles.storyText}>
            انطلقنا من شغفنا بعالم الشاحنات الثقيلة ورغبتنا في تقديم خدمة حقيقية لأصحاب شاحنات مرسيدس أكتروس في العراق. أدركنا أن السوق يحتاج إلى مصدر موثوق يوفر قطع غيار أصلية بأسعار شفافة وتوصيل سريع.
            {'\n\n'}
            اليوم، نفتخر بخدمة مئات العملاء من مختلف محافظات العراق، ونواصل العمل لنكون الخيار الأول لكل من يبحث عن قطع غيار أكتروس الأصلية.
          </Text>
        </View>

        {/* Values */}
        <View style={styles.valuesSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.goldDot} />
            <Text style={styles.sectionTitle}>قيمنا</Text>
          </View>
          <View style={styles.valuesGrid}>
            {TEAM_VALUES.map((v, i) => (
              <View key={i} style={styles.valueCard}>
                <View style={[styles.valueIconWrap, { borderColor: v.color + '40' }]}>
                  <MaterialIcons name={v.icon as any} size={22} color={v.color} />
                </View>
                <Text style={styles.valueTitle}>{v.title}</Text>
                <Text style={styles.valueDesc}>{v.desc}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Contact Info */}
        <View style={styles.contactSection}>
          <View style={styles.sectionTitleRow}>
            <View style={styles.goldDot} />
            <Text style={styles.sectionTitle}>معلومات التواصل</Text>
          </View>
          {[
            { icon: 'location-on', text: ContactInfo.location, color: Colors.orange },
            { icon: 'access-time', text: ContactInfo.workingHours, color: Colors.gold },
            { icon: 'phone', text: ContactInfo.phone, color: Colors.success },
            { icon: 'email', text: ContactInfo.email, color: '#3B82F6' },
          ].map((item, i) => (
            <View key={i} style={styles.contactItem}>
              <Text style={styles.contactText}>{item.text}</Text>
              <View style={[styles.contactIcon, { borderColor: item.color + '30' }]}>
                <MaterialIcons name={item.icon as any} size={18} color={item.color} />
              </View>
            </View>
          ))}
        </View>

        {/* Privacy & Version */}
        <View style={styles.linksSection}>
          <TouchableOpacity
            style={styles.linkItem}
            onPress={() => router.push('/privacy')}
          >
            <MaterialIcons name="keyboard-arrow-left" size={20} color={Colors.textMuted} />
            <Text style={styles.linkText}>سياسة الخصوصية</Text>
            <MaterialIcons name="privacy-tip" size={18} color={Colors.gold} />
          </TouchableOpacity>
          <View style={styles.linkDivider} />
          <View style={styles.linkItem}>
            <Text style={styles.versionText}>الإصدار 1.0.0</Text>
            <MaterialIcons name="info-outline" size={18} color={Colors.textMuted} />
          </View>
        </View>

        {/* WhatsApp CTA */}
        <TouchableOpacity style={styles.waBtn} onPress={openWhatsApp} activeOpacity={0.85}>
          <LinearGradient
            colors={['#25D366', '#1aac52']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.waBtnGradient}
          >
            <MaterialIcons name="chat" size={22} color="#fff" />
            <Text style={styles.waBtnText}>تواصل معنا عبر واتساب</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
  header: { paddingHorizontal: Spacing.md, paddingBottom: 16 },
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
  headerTitle: { alignItems: 'flex-end', flex: 1, marginRight: 12 },
  titleMain: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  titleSub: { fontSize: FontSize.xs, color: Colors.textSecondary, textAlign: 'right' },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(212,175,55,0.1)',
    borderWidth: 1,
    borderColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  goldLine: { height: 1, backgroundColor: Colors.goldMuted, marginTop: 14, opacity: 0.4 },

  content: { gap: 20 },

  // HERO
  heroBanner: {
    height: 200,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  heroContent: {
    padding: Spacing.md,
    gap: 6,
    alignItems: 'flex-end',
  },
  logoBadge: {
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: Colors.goldMuted,
  },
  logoText: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold,
    writingDirection: 'rtl',
  },
  heroTitle: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    fontWeight: FontWeight.semibold,
  },
  heroSub: { fontSize: FontSize.sm, color: Colors.textMuted, textAlign: 'right' },

  // STATS
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: Spacing.md,
  },
  statCard: {
    width: '47%',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
  },
  statCardGradient: { padding: 16, alignItems: 'center', gap: 4 },
  statValue: {
    fontSize: FontSize.xxl,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold,
  },
  statLabel: { fontSize: FontSize.xs, color: Colors.textSecondary, writingDirection: 'rtl' },

  // STORY
  storySection: {
    paddingHorizontal: Spacing.md,
    gap: 12,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 8,
  },
  goldDot: {
    width: 4,
    height: 20,
    backgroundColor: Colors.gold,
    borderRadius: 2,
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  storyText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 26,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
  },

  // VALUES
  valuesSection: { paddingHorizontal: Spacing.md, gap: 12 },
  valuesGrid: { gap: 10 },
  valueCard: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    flexDirection: 'row-reverse',
  },
  valueIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  valueTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  valueDesc: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 20,
    flex: 1,
  },

  // CONTACT
  contactSection: { paddingHorizontal: Spacing.md, gap: 12 },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    padding: 14,
  },
  contactIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.darkSurface,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contactText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // LINKS
  linksSection: {
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    overflow: 'hidden',
  },
  linkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 12,
    padding: 16,
  },
  linkDivider: { height: 1, backgroundColor: Colors.darkBorderLight, marginHorizontal: 16 },
  linkText: {
    flex: 1,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  versionText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    textAlign: 'right',
    writingDirection: 'rtl',
  },

  // WA
  waBtn: {
    marginHorizontal: Spacing.md,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadow.gold,
    shadowColor: Colors.whatsapp,
  },
  waBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 16,
  },
  waBtnText: {
    color: '#fff',
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
    writingDirection: 'rtl',
  },
});
