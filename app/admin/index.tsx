import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, FontWeight, Shadow } from '@/constants/theme';
import { AdminConfig } from '@/constants/config';
import { useAlert } from '@/template';

export default function AdminLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { showAlert } = useAlert();
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);

  const handleLogin = () => {
    if (password === AdminConfig.password) {
      router.push('/admin/products');
    } else {
      showAlert('كلمة المرور خاطئة', 'حاول مرة ثانية');
    }
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={['#000', '#080808']} style={styles.bg} />

      {/* Gold decorative line */}
      <View style={[styles.topGoldBar, { top: insets.top }]} />

      <View style={[styles.content, { paddingTop: insets.top + 60, paddingBottom: insets.bottom + 40 }]}>
        {/* Back */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-forward-ios" size={18} color={Colors.gold} />
          <Text style={styles.backText}>رجوع</Text>
        </TouchableOpacity>

        {/* Logo */}
        <View style={styles.logoWrap}>
          <View style={styles.logoCircle}>
            <MaterialIcons name="admin-panel-settings" size={44} color={Colors.gold} />
          </View>
          <Text style={styles.logoTitle}>لوحة التحكم</Text>
          <Text style={styles.logoSub}>جددها — إدارة المتجر</Text>
        </View>

        {/* Input */}
        <View style={styles.inputSection}>
          <Text style={styles.inputLabel}>كلمة المرور</Text>
          <View style={styles.inputWrap}>
            <TouchableOpacity onPress={() => setShowPass((p) => !p)}>
              <MaterialIcons name={showPass ? 'visibility-off' : 'visibility'} size={20} color={Colors.textMuted} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPass}
              placeholder="••••••••"
              placeholderTextColor={Colors.textMuted}
              textAlign="right"
              onSubmitEditing={handleLogin}
            />
          </View>
        </View>

        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
          <LinearGradient colors={[Colors.gold, Colors.orange]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.loginGradient}>
            <MaterialIcons name="lock-open" size={20} color="#000" />
            <Text style={styles.loginText}>دخول</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.darkBg },
  bg: { ...StyleSheet.absoluteFillObject },
  topGoldBar: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: Colors.gold, opacity: 0.6 },

  content: { flex: 1, paddingHorizontal: Spacing.lg, gap: 28 },

  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, alignSelf: 'flex-start' },
  backText: { fontSize: FontSize.sm, color: Colors.gold },

  logoWrap: { alignItems: 'center', gap: 10, marginTop: 20 },
  logoCircle: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: 'rgba(212,175,55,0.08)',
    borderWidth: 2, borderColor: Colors.goldMuted,
    alignItems: 'center', justifyContent: 'center',
    ...Shadow.gold,
  },
  logoTitle: { fontSize: FontSize.xxl, fontWeight: FontWeight.extrabold, color: Colors.textPrimary, writingDirection: 'rtl' },
  logoSub: { fontSize: FontSize.sm, color: Colors.textMuted, writingDirection: 'rtl' },

  inputSection: { gap: 10 },
  inputLabel: { fontSize: FontSize.base, fontWeight: FontWeight.semibold, color: Colors.textPrimary, textAlign: 'right', writingDirection: 'rtl' },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.darkCard,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.darkBorderLight,
    paddingHorizontal: 14,
    height: 54,
  },
  input: { flex: 1, color: Colors.textPrimary, fontSize: FontSize.base, writingDirection: 'rtl' },

  loginBtn: { borderRadius: BorderRadius.full, overflow: 'hidden', ...Shadow.gold },
  loginGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  loginText: { color: '#000', fontSize: FontSize.lg, fontWeight: FontWeight.extrabold, writingDirection: 'rtl' },
});
