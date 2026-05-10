import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight } from '@/constants/theme';
import { AppConfig, ContactInfo } from '@/constants/config';

const SECTIONS = [
  {
    title: 'المعلومات التي نجمعها',
    icon: 'info',
    content:
      'لا يجمع تطبيق جددها أي بيانات شخصية تعريفية تلقائياً. البيانات الوحيدة المُرسلة هي طلبات القطع التي يرسلها المستخدم بشكل اختياري (صورة، رقم قطعة، رقم هاتف اختياري) وذلك لتسهيل عملية التواصل.',
  },
  {
    title: 'الكاميرا والصور',
    icon: 'camera-alt',
    content:
      'يطلب التطبيق الوصول إلى الكاميرا ومكتبة الصور فقط عند رغبة المستخدم في إرفاق صورة لطلب قطعة غيار. لا يتم الوصول إلى الكاميرا أو الصور تلقائياً في أي وقت آخر. هذه البيانات لا تُخزّن لدينا إلا بموافصرة صريحة من المستخدم.',
  },
  {
    title: 'الإشعارات',
    icon: 'notifications',
    content:
      'قد يطلب التطبيق إذن الإشعارات لإعلامك بالعروض الخاصة والمنتجات الجديدة. هذا الإذن اختياري تماماً ويمكنك رفضه أو تعطيله في أي وقت من إعدادات جهازك دون أن يؤثر ذلك على باقي وظائف التطبيق.',
  },
  {
    title: 'روابط الطرف الثالث (واتساب)',
    icon: 'link',
    content:
      'يحتوي التطبيق على روابط تفتح تطبيق واتساب للتواصل المباشر مع المتجر. عند الضغط على أي زر واتساب، سيتم فتح تطبيق واتساب خارج تطبيقنا. نحن غير مسؤولين عن سياسة الخصوصية الخاصة بواتساب أو أي خدمات طرف ثالث.',
  },
  {
    title: 'الاستخدام والتحليلات',
    icon: 'analytics',
    content:
      'لا يستخدم التطبيق أي أدوات تتبع أو تحليلات من طرف ثالث. لا نستخدم معرّف الإعلانات (Advertising ID) ولا نشارك أي معلومات مع أطراف ثالثة لأغراض إعلانية أو تجارية.',
  },
  {
    title: 'تخزين البيانات',
    icon: 'storage',
    content:
      'يتم تخزين بيانات المنتجات والأسعار على قاعدة بيانات سحابية آمنة مشفرة (SSL/TLS). طلبات القطع التي يرسلها المستخدمون تُخزَّن في قاعدة البيانات لمعالجتها فقط ولا تُشارك مع أي جهة خارجية.',
  },
  {
    title: 'حقوق المستخدم',
    icon: 'gavel',
    content:
      'للمستخدم الحق الكامل في التوقف عن استخدام التطبيق في أي وقت. لحذف أي طلب قطعة أرسلته، تواصل معنا عبر واتساب أو البريد الإلكتروني وسنقوم بحذفه فوراً.',
  },
  {
    title: 'التواصل معنا',
    icon: 'contact-support',
    content: `لأي استفسار حول سياسة الخصوصية أو لطلب حذف بياناتك، يمكنك التواصل معنا:\nالبريد الإلكتروني: ${ContactInfo.email}\nالهاتف: ${ContactInfo.phone}`,
  },
];

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();

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
            <Text style={styles.titleMain}>سياسة الخصوصية</Text>
            <Text style={styles.titleSub}>آخر تحديث: مايو 2025</Text>
          </View>
          <View style={styles.iconWrap}>
            <MaterialIcons name="privacy-tip" size={20} color={Colors.gold} />
          </View>
        </View>
        <View style={styles.goldLine} />
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Intro */}
        <View style={styles.introBanner}>
          <MaterialIcons name="shield" size={36} color={Colors.gold} />
          <Text style={styles.introText}>
            نحن في جددها نحرص على خصوصيتك. هذه السياسة توضح بشكل واضح كيفية تعاملنا مع معلوماتك عند استخدام تطبيقنا لقطع غيار مرسيدس أكتروس.
          </Text>
        </View>

        {/* No Ads Badge */}
        <View style={styles.noadsBanner}>
          <MaterialIcons name="block" size={18} color={Colors.success} />
          <Text style={styles.noadsText}>لا إعلانات · لا تتبع · لا مشاركة بيانات مع أطراف ثالثة</Text>
        </View>

        {/* Sections */}
        {SECTIONS.map((section, index) => (
          <View key={index} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <View style={styles.sectionIcon}>
                <MaterialIcons name={section.icon as any} size={18} color={Colors.gold} />
              </View>
            </View>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {/* Footer note */}
        <View style={styles.footerNote}>
          <MaterialIcons name="info-outline" size={16} color={Colors.textMuted} />
          <Text style={styles.footerNoteText}>
            {AppConfig.brandName} · {ContactInfo.location} · الإصدار 1.0.0
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
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
  headerTitle: { alignItems: 'flex-end', flex: 1, marginRight: 12 },
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
  goldLine: {
    height: 1,
    backgroundColor: Colors.goldMuted,
    marginTop: 14,
    opacity: 0.4,
  },

  content: {
    padding: Spacing.md,
    gap: 16,
  },
  introBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(212,175,55,0.06)',
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.2)',
    padding: 16,
  },
  introText: {
    flex: 1,
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  noadsBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(34,197,94,0.08)',
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  noadsText: {
    fontSize: FontSize.sm,
    color: Colors.success,
    textAlign: 'center',
    writingDirection: 'rtl',
    fontWeight: FontWeight.semibold,
  },
  section: {
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    gap: 10,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 10,
  },
  sectionTitle: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.bold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  sectionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 1,
    borderColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionContent: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 22,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  footerNoteText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    writingDirection: 'rtl',
    textAlign: 'center',
  },
});
