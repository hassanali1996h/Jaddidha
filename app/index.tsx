import React, { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useApp } from '@/hooks/useApp';

export default function IndexRedirect() {
  const router = useRouter();
  const { hasSeenOnboarding, loadingData } = useApp();

  useEffect(() => {
    if (!loadingData) {
      if (hasSeenOnboarding) {
        router.replace('/(tabs)');
      } else {
        router.replace('/onboarding');
      }
    }
  }, [hasSeenOnboarding, loadingData]);

  return (
    <View style={{ flex: 1, backgroundColor: Colors.darkBg, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator color={Colors.gold} size="large" />
    </View>
  );
}
