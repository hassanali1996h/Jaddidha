// Jaddidha - Luxury Truck Parts Theme
export const Colors = {
  // Base
  black: '#000000',
  darkBg: '#080808',
  darkCard: '#0F0F0F',
  darkSurface: '#151515',
  darkBorder: '#1E1E1E',
  darkBorderLight: '#2A2A2A',

  // Gold / Metallic
  gold: '#D4AF37',
  goldLight: '#F0D060',
  goldDark: '#B8960C',
  goldMuted: '#8B7118',

  // Orange Accent
  orange: '#E8820C',
  orangeLight: '#FF9A2E',
  orangeDark: '#C46A00',

  // Gradient stops
  gradientGold: ['#D4AF37', '#F0D060', '#D4AF37'],
  gradientDark: ['#000000', '#0F0F0F'],
  gradientCard: ['#151515', '#0A0A0A'],

  // Text
  textPrimary: '#FFFFFF',
  textSecondary: '#A0A0A0',
  textMuted: '#5A5A5A',
  textGold: '#D4AF37',

  // WhatsApp
  whatsapp: '#25D366',

  // Status
  success: '#22C55E',
  error: '#EF4444',
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 999,
};

export const FontSize = {
  xs: 11,
  sm: 13,
  base: 16,
  md: 18,
  lg: 20,
  xl: 24,
  xxl: 28,
  xxxl: 34,
  hero: 42,
};

export const FontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

export const Shadow = {
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  goldStrong: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 16,
  },
  orange: {
    shadowColor: '#E8820C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  dark: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
  },
};
