// =============================================
// Jaddidha - Push Notifications Service
// Supports: local + remote push to ALL users
// =============================================
import { Platform } from 'react-native';
import { getSupabaseClient } from '@/template';
import { FunctionsHttpError } from '@supabase/supabase-js';

const supabase = getSupabaseClient();

// Lazy-load expo-notifications to avoid crashes if plugin not configured
let Notifications: any = null;
let Device: any = null;

try {
  Notifications = require('expo-notifications');
  Device = require('expo-device');
  // Configure how notifications appear when app is in foreground
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
} catch (e) {
  console.warn('expo-notifications not available:', e);
}

export interface NotificationRecord {
  id?: string;
  title: string;
  body: string;
  schedule_at?: string | null;
  sent_at?: string | null;
  type?: string;
  is_active?: boolean;
  created_at?: string;
}

// ============================
// PERMISSIONS
// ============================
export async function requestNotificationPermission(): Promise<boolean> {
  try {
    if (!Notifications || !Device) return false;
    if (!Device.isDevice) return false;

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return false;

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('jaddidha', {
        name: 'جددها - إشعارات',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#D4AF37',
        sound: 'default',
      });
    }

    return true;
  } catch (e) {
    console.warn('requestNotificationPermission error:', e);
    return false;
  }
}

// ============================
// GET & REGISTER PUSH TOKEN
// Called once on app startup after permission granted
// Stores token in DB so admin can push to all users
// ============================
export async function registerPushToken(): Promise<string | null> {
  try {
    if (!Notifications || !Device) return null;
    if (!Device.isDevice) return null;

    // Get Expo push token
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: undefined, // Uses app.json projectId automatically
    });

    const token = tokenData?.data;
    if (!token) return null;

    // Save to database (upsert on token to avoid duplicates)
    await supabase
      .from('push_tokens')
      .upsert(
        {
          token,
          platform: Platform.OS,
          device_id: `${Platform.OS}_${Date.now()}`,
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'token' }
      );

    console.log('Push token registered:', token.slice(0, 20) + '...');
    return token;
  } catch (e) {
    console.warn('registerPushToken error:', e);
    return null;
  }
}

// ============================
// SEND TO ALL USERS (via Edge Function)
// This is the REAL push - reaches all users instantly
// even when the app is closed
// ============================
export async function sendPushToAllUsers(
  title: string,
  body: string,
  data?: Record<string, any>
): Promise<{ sent: number; failed: number; error?: string }> {
  try {
    const { data: result, error } = await supabase.functions.invoke('send-notifications', {
      body: { title, body, data: data || {} },
    });

    if (error) {
      let errorMessage = error.message;
      if (error instanceof FunctionsHttpError) {
        try {
          const text = await error.context?.text();
          errorMessage = text || errorMessage;
        } catch {}
      }
      console.error('sendPushToAllUsers error:', errorMessage);
      return { sent: 0, failed: 0, error: errorMessage };
    }

    return {
      sent: result?.sent || 0,
      failed: result?.failed || 0,
    };
  } catch (e: any) {
    console.error('sendPushToAllUsers exception:', e);
    return { sent: 0, failed: 0, error: e.message };
  }
}

// ============================
// SEND IMMEDIATE LOCAL NOTIFICATION
// (only on THIS device - for testing)
// ============================
export async function sendLocalNotification(title: string, body: string): Promise<string | null> {
  try {
    if (!Notifications) return null;
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { type: 'local' },
      },
      trigger: null,
    });
    return id;
  } catch (e) {
    console.error('sendLocalNotification error:', e);
    return null;
  }
}

// ============================
// SCHEDULE NOTIFICATION
// ============================
export async function scheduleNotification(
  title: string,
  body: string,
  scheduleAt: Date
): Promise<string | null> {
  try {
    if (!Notifications) return null;
    const secondsFromNow = Math.max(1, Math.floor((scheduleAt.getTime() - Date.now()) / 1000));
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: 'default',
        data: { type: 'scheduled' },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes
          ? Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL
          : 'timeInterval',
        seconds: secondsFromNow,
        repeats: false,
      },
    });
    return id;
  } catch (e) {
    console.error('scheduleNotification error:', e);
    return null;
  }
}

// ============================
// CANCEL ALL SCHEDULED
// ============================
export async function cancelAllNotifications(): Promise<void> {
  try {
    if (!Notifications) return;
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (e) {
    console.warn('cancelAllNotifications error:', e);
  }
}

// ============================
// CHECK & FIRE PENDING NOTIFICATIONS ON APP OPEN
// Fallback for users who already had notifications saved
// ============================
export async function checkAndFirePendingNotifications(): Promise<void> {
  try {
    if (!Notifications) return;

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('is_active', true)
      .is('sent_at', null)
      .order('created_at', { ascending: false })
      .limit(3);

    if (error || !data || data.length === 0) return;

    for (const notif of data) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: notif.title,
            body: notif.body,
            sound: 'default',
            data: { type: notif.type || 'general', id: notif.id },
          },
          trigger: null,
        });

        // Mark as sent
        await supabase
          .from('notifications')
          .update({ sent_at: new Date().toISOString() })
          .eq('id', notif.id);

      } catch (e) {
        console.warn('Failed to fire notification:', notif.id, e);
      }
    }
  } catch (e) {
    console.warn('checkAndFirePendingNotifications error:', e);
  }
}

// ============================
// DATABASE OPERATIONS
// ============================
export async function fetchNotifications(): Promise<NotificationRecord[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createNotification(notif: Omit<NotificationRecord, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('notifications')
    .insert(notif)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function deleteNotification(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ is_active: false })
    .eq('id', id);
  if (error) throw error;
}

export async function markNotificationSent(id: string) {
  const { error } = await supabase
    .from('notifications')
    .update({ sent_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
