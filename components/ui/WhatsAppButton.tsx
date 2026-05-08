import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Linking, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';
import { buildWhatsAppUrl } from '@/services/db';

interface WhatsAppButtonProps {
  message?: string;
  label?: string;
  size?: 'small' | 'medium' | 'large';
  variant?: 'solid' | 'outline';
  fullWidth?: boolean;
}

export function WhatsAppButton({
  message,
  label = 'اطلب عبر واتساب',
  size = 'medium',
  variant = 'solid',
  fullWidth = false,
}: WhatsAppButtonProps) {
  const { whatsappNumber, settings } = useApp();

  const handlePress = () => {
    const msg = message || settings.whatsapp_default_message || 'مرحبا، أريد الاستفسار عن قطع غيار أكتروس';
    Linking.openURL(buildWhatsAppUrl(whatsappNumber, msg));
  };

  const sizeStyles = {
    small: { paddingVertical: 8, paddingHorizontal: 14, iconSize: 16, fontSize: 13 },
    medium: { paddingVertical: 12, paddingHorizontal: 20, iconSize: 20, fontSize: 15 },
    large: { paddingVertical: 16, paddingHorizontal: 28, iconSize: 24, fontSize: 17 },
  };
  const s = sizeStyles[size];

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'solid' ? styles.solid : styles.outline,
        { paddingVertical: s.paddingVertical, paddingHorizontal: s.paddingHorizontal },
        fullWidth && styles.fullWidth,
      ]}
      onPress={handlePress}
      activeOpacity={0.8}
    >
      <MaterialIcons name="chat" size={s.iconSize} color="#fff" />
      <Text style={[styles.label, { fontSize: s.fontSize }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// Floating WhatsApp button
export function FloatingWhatsApp({ message }: { message?: string }) {
  const { whatsappNumber, settings } = useApp();

  const handlePress = () => {
    const msg = message || settings.whatsapp_default_message || 'مرحبا، أريد الاستفسار عن قطع غيار أكتروس';
    Linking.openURL(buildWhatsAppUrl(whatsappNumber, msg));
  };

  return (
    <TouchableOpacity style={styles.floating} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.floatingInner}>
        <MaterialIcons name="chat" size={28} color="#fff" />
      </View>
    </TouchableOpacity>
  );
}

// Cart FAB
export function CartFab() {
  const router = useRouter();
  const { cartCount } = useApp();

  return (
    <TouchableOpacity
      style={styles.cartFab}
      onPress={() => router.push('/cart')}
      activeOpacity={0.85}
    >
      <View style={styles.cartFabInner}>
        <MaterialIcons name="shopping-cart" size={24} color="#fff" />
        {cartCount > 0 ? (
          <View style={styles.cartBadge}>
            <Text style={styles.cartBadgeText}>{cartCount}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BorderRadius.full,
    gap: 8,
  },
  solid: {
    backgroundColor: Colors.whatsapp,
    ...Shadow.gold,
    shadowColor: Colors.whatsapp,
  },
  outline: {
    borderWidth: 1.5,
    borderColor: Colors.whatsapp,
    backgroundColor: 'transparent',
  },
  label: {
    color: '#fff',
    fontWeight: FontWeight.bold,
    textAlign: 'right',
  },
  fullWidth: { width: '100%' },

  // Floating WhatsApp
  floating: {
    position: 'absolute',
    bottom: 100,
    right: 20,
    zIndex: 999,
  },
  floatingInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.whatsapp,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.whatsapp,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 16,
    elevation: 12,
  },

  // Cart FAB
  cartFab: {
    position: 'absolute',
    bottom: 170,
    right: 20,
    zIndex: 999,
  },
  cartFabInner: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: Colors.darkCard,
    borderWidth: 1,
    borderColor: Colors.goldMuted,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  cartBadge: {
    position: 'absolute',
    top: -4,
    left: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: FontWeight.bold,
  },
});
