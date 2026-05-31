// =============================================
// Jaddidha - App Context
// Global state: settings, cart, data, onboarding
// =============================================
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  fetchTruckTypes, fetchCategories, fetchSettings,
  DbTruckType, DbCategory, CartItem,
} from '@/services/db';
import { AppConfig } from '@/constants/config';

// Onboarding shows every 7 days
const ONBOARDING_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const ONBOARDING_KEY = 'jaddidha_last_onboarding';

interface AppContextType {
  // Settings
  settings: Record<string, string>;
  whatsappNumber: string;
  loadingSettings: boolean;
  refreshSettings: () => Promise<void>;

  // Data
  truckTypes: DbTruckType[];
  categories: DbCategory[];
  loadingData: boolean;
  refreshData: () => Promise<void>;

  // Cart
  cart: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartCount: number;
  isInCart: (productId: string) => boolean;

  // Onboarding
  hasSeenOnboarding: boolean;
  onboardingChecked: boolean;
  completeOnboarding: () => void;
}

export const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [truckTypes, setTruckTypes] = useState<DbTruckType[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [cart, setCart] = useState<CartItem[]>([]);

  // Onboarding state
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(true); // default true = don't show
  const [onboardingChecked, setOnboardingChecked] = useState(false);

  const refreshSettings = useCallback(async () => {
    try {
      setLoadingSettings(true);
      const s = await fetchSettings();
      setSettings(s);
    } catch (e) {
      // use defaults
    } finally {
      setLoadingSettings(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    try {
      setLoadingData(true);
      const [trucks, cats] = await Promise.all([fetchTruckTypes(), fetchCategories()]);
      setTruckTypes(trucks);
      setCategories(cats);
    } catch (e) {
      // silent
    } finally {
      setLoadingData(false);
    }
  }, []);

  // Check if onboarding should be shown (every 7 days)
  const checkOnboarding = useCallback(async () => {
    try {
      const lastSeen = await AsyncStorage.getItem(ONBOARDING_KEY);
      if (!lastSeen) {
        // First time ever
        setHasSeenOnboarding(false);
      } else {
        const lastTime = parseInt(lastSeen, 10);
        const now = Date.now();
        const elapsed = now - lastTime;
        if (elapsed >= ONBOARDING_INTERVAL_MS) {
          // Been more than 7 days
          setHasSeenOnboarding(false);
        } else {
          setHasSeenOnboarding(true);
        }
      }
    } catch {
      setHasSeenOnboarding(false);
    } finally {
      setOnboardingChecked(true);
    }
  }, []);

  useEffect(() => {
    refreshSettings();
    refreshData();
    checkOnboarding();
  }, []);

  const whatsappNumber = settings.whatsapp_number || AppConfig.whatsappNumber;

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.productId === item.productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  }, []);

  const removeFromCart = useCallback((productId: string) => {
    setCart((prev) => prev.filter((i) => i.productId !== productId));
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  const isInCart = useCallback(
    (productId: string) => cart.some((i) => i.productId === productId),
    [cart]
  );

  const cartCount = cart.reduce((sum, i) => sum + i.quantity, 0);

  const completeOnboarding = useCallback(async () => {
    setHasSeenOnboarding(true);
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, Date.now().toString());
    } catch {
      // silent
    }
  }, []);

  return (
    <AppContext.Provider
      value={{
        settings,
        whatsappNumber,
        loadingSettings,
        refreshSettings,
        truckTypes,
        categories,
        loadingData,
        refreshData,
        cart,
        addToCart,
        removeFromCart,
        clearCart,
        cartCount,
        isInCart,
        hasSeenOnboarding,
        onboardingChecked,
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
