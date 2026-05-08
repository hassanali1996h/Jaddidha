// =============================================
// Jaddidha - App Context
// Global state: settings, cart, data
// =============================================
import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import {
  fetchTruckTypes, fetchCategories, fetchSettings,
  DbTruckType, DbCategory, CartItem,
} from '@/services/db';
import { AppConfig } from '@/constants/config';

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
  const [hasSeenOnboarding, setHasSeenOnboarding] = useState(false);

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

  useEffect(() => {
    refreshSettings();
    refreshData();
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

  const completeOnboarding = useCallback(() => setHasSeenOnboarding(true), []);

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
        completeOnboarding,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}
