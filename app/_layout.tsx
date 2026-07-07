import { AlertProvider } from '@/template';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppProvider } from '@/contexts/AppContext';
import { useEffect } from 'react';
import { requestNotificationPermission, checkAndFirePendingNotifications, registerPushToken } from '@/services/notifications';

export default function RootLayout() {
  useEffect(() => {
    // Request permission then check for any pending notifications from admin
    requestNotificationPermission().then((granted) => {
      if (granted) {
        // Register this device's push token so admin can reach ALL users
        registerPushToken();
        // Small delay to ensure app is fully loaded before firing notifications
        setTimeout(() => {
          checkAndFirePendingNotifications();
        }, 3000);
      }
    });
  }, []);

  return (
    <AlertProvider>
      <AppProvider>
        <SafeAreaProvider>
          <StatusBar style="light" backgroundColor="#000000" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: '#000000' },
              animation: 'slide_from_right',
            }}
          >
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, animation: 'fade' }} />
            <Stack.Screen name="categories" options={{ headerShown: false }} />
            <Stack.Screen name="products" options={{ headerShown: false }} />
            <Stack.Screen name="product-detail" options={{ headerShown: false }} />
            <Stack.Screen name="cart" options={{ headerShown: false }} />
            <Stack.Screen name="request-part" options={{ headerShown: false }} />
            <Stack.Screen name="admin" options={{ headerShown: false }} />
            <Stack.Screen name="admin/products" options={{ headerShown: false }} />
            <Stack.Screen name="admin/settings" options={{ headerShown: false }} />
            <Stack.Screen name="admin/requests" options={{ headerShown: false }} />
            <Stack.Screen name="privacy" options={{ headerShown: false }} />
            <Stack.Screen name="about" options={{ headerShown: false }} />
            <Stack.Screen name="admin/notifications" options={{ headerShown: false }} />
            <Stack.Screen name="admin/images" options={{ headerShown: false }} />
            <Stack.Screen name="admin/import" options={{ headerShown: false }} />
          </Stack>
        </SafeAreaProvider>
      </AppProvider>
    </AlertProvider>
  );
}
