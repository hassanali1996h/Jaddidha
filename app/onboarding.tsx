import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    image: require('@/assets/images/actros-mb1.jpg'),
    title: 'قطع غيار أكتروس\nبدون مشاكل',
    subtitle: 'اختار الشاحنة، اختار القطعة، واتساب ويوصلك',
    badge: '5 موديلات أكتروس',
    badgeIcon: 'local-shipping',
    highlight: 'جددها',
  },
  {
    id: '2',
    image: require('@/assets/images/actros-mb3.jpg'),
    title: 'فلاتر · بريكات · كير\nمكينة · كهربائيات',
    subtitle: 'كل قطعة تحتاجها بمكان واحد، بدون تعب وبدون دوران',
    badge: 'جميع التصنيفات',
    badgeIcon: 'category',
    highlight: 'بمكان واحد',
  },
  {
    id: '3',
    image: require('@/assets/images/actros-mb5.jpg'),
    title: 'اطلب أكثر من قطعة\nبفاتورة واحدة',
    subtitle: 'ضيف القطع بالسلة وارسل طلبك عبر واتساب بضغطة وحدة',
    badge: 'سلة الطلبات',
    badgeIcon: 'shopping-cart',
    highlight: 'بفاتورة واحدة',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { completeOnboarding } = useApp();
  const [currentSlide, setCurrentSlide] = React.useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goNext = () => {
    if (currentSlide < SLIDES.length - 1) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => {
        setCurrentSlide((p) => p + 1);
        Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: true }).start();
      });
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    completeOnboarding();
    router.replace('/(tabs)');
  };

  const slide = SLIDES[currentSlide];
  const isLast = currentSlide === SLIDES.length - 1;

  return (
    <View style={styles.root}>
      {/* Background Image */}
      <Image
        source={slide.image}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={400}
      />

      {/* Dark overlay with gradient */}
      <LinearGradient
        colors={['rgba(0,0,0,0.4)', 'rgba(0,0,0,0.1)', 'rgba(0,0,0,0.92)', '#000']}
        style={StyleSheet.absoluteFill}
      />

      {/* Skip button */}
      <TouchableOpacity
        style={[styles.skipBtn, { top: insets.top + 16 }]}
        onPress={handleFinish}
        activeOpacity={0.7}
      >
        <Text style={styles.skipText}>تخطى</Text>
        <MaterialIcons name="keyboard-arrow-left" size={18} color={Colors.textMuted} />
      </TouchableOpacity>

      {/* Logo */}
      <View style={[styles.logoWrap, { top: insets.top + 16 }]}>
        <Text style={styles.logo}>جددها</Text>
        <View style={styles.logoUnderline} />
      </View>

      {/* Content */}
      <Animated.View style={[styles.content, { opacity: fadeAnim, paddingBottom: insets.bottom + 24 }]}>
        {/* Badge */}
        <View style={styles.badge}>
          <MaterialIcons name={slide.badgeIcon as any} size={14} color={Colors.gold} />
          <Text style={styles.badgeText}>{slide.badge}</Text>
        </View>

        {/* Title */}
        <Text style={styles.title}>{slide.title}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>{slide.subtitle}</Text>

        {/* Gold line */}
        <View style={styles.goldLine} />

        {/* Dots */}
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentSlide && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {/* Buttons */}
        <View style={styles.buttonsRow}>
          {currentSlide > 0 ? (
            <TouchableOpacity
              style={styles.prevBtn}
              onPress={() => setCurrentSlide((p) => p - 1)}
              activeOpacity={0.8}
            >
              <MaterialIcons name="arrow-forward" size={20} color={Colors.gold} />
            </TouchableOpacity>
          ) : <View style={{ width: 48 }} />}

          <TouchableOpacity style={styles.nextBtn} onPress={goNext} activeOpacity={0.85}>
            <LinearGradient
              colors={[Colors.gold, Colors.orange]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.nextBtnGradient}
            >
              <Text style={styles.nextBtnText}>
                {isLast ? 'ابدأ الطلب' : 'التالي'}
              </Text>
              <MaterialIcons name={isLast ? 'check' : 'arrow-back'} size={20} color="#000" />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#000', justifyContent: 'flex-end' },

  skipBtn: {
    position: 'absolute',
    left: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    zIndex: 10,
  },
  skipText: { fontSize: FontSize.sm, color: Colors.textMuted },

  logoWrap: {
    position: 'absolute',
    right: 20,
    alignItems: 'flex-end',
    zIndex: 10,
  },
  logo: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.extrabold,
    color: Colors.gold,
    letterSpacing: 1,
  },
  logoUnderline: {
    height: 2,
    width: '70%',
    backgroundColor: Colors.gold,
    borderRadius: 1,
    alignSelf: 'flex-end',
  },

  content: {
    paddingHorizontal: Spacing.lg,
    paddingTop: 24,
    gap: 14,
    alignItems: 'flex-end',
  },

  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(212,175,55,0.15)',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: 'rgba(212,175,55,0.3)',
  },
  badgeText: {
    fontSize: FontSize.xs,
    color: Colors.gold,
    fontWeight: FontWeight.semibold,
    writingDirection: 'rtl',
  },

  title: {
    fontSize: 30,
    fontWeight: FontWeight.extrabold,
    color: Colors.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 42,
  },

  subtitle: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    textAlign: 'right',
    writingDirection: 'rtl',
    lineHeight: 26,
  },

  goldLine: {
    height: 1,
    backgroundColor: Colors.goldMuted,
    width: '30%',
    alignSelf: 'flex-end',
    opacity: 0.5,
  },

  dots: {
    flexDirection: 'row',
    gap: 6,
    alignSelf: 'flex-end',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.darkBorderLight,
  },
  dotActive: {
    width: 22,
    backgroundColor: Colors.gold,
    borderRadius: 3,
  },

  buttonsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 4,
  },
  prevBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.goldMuted,
    backgroundColor: 'rgba(212,175,55,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextBtn: {
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
    ...Shadow.gold,
  },
  nextBtnGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 28,
    paddingVertical: 15,
  },
  nextBtnText: {
    color: '#000',
    fontSize: FontSize.base,
    fontWeight: FontWeight.extrabold,
    writingDirection: 'rtl',
  },
});
