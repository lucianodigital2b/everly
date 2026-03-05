import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Product } from '../../lib/mockData';

export interface UserPreferences {
  lactoseIntolerant: boolean;
  vegan: boolean;
  lowCarb: boolean;
  gutSensitive: boolean;
}

interface HealthState {
  savedProducts: Product[];
  preferences: UserPreferences;
  isPremium: boolean;

  saveProduct: (product: Product) => void;
  removeSavedProduct: (productId: string) => void;
  isProductSaved: (productId: string) => boolean;
  updatePreference: (key: keyof UserPreferences, value: boolean) => void;
  setIsPremium: (value: boolean) => void;
}

export const useHealthStore = create<HealthState>()(
  persist(
    (set, get) => ({
      savedProducts: [],
      preferences: {
        lactoseIntolerant: false,
        vegan: false,
        lowCarb: false,
        gutSensitive: false,
      },
      isPremium: false,

      saveProduct: (product) => {
        set((state) => ({
          savedProducts: state.savedProducts.some((p) => p.id === product.id)
            ? state.savedProducts
            : [...state.savedProducts, product],
        }));
      },

      removeSavedProduct: (productId) => {
        set((state) => ({
          savedProducts: state.savedProducts.filter((p) => p.id !== productId),
        }));
      },

      isProductSaved: (productId) => {
        return get().savedProducts.some((p) => p.id === productId);
      },

      updatePreference: (key, value) => {
        set((state) => ({
          preferences: { ...state.preferences, [key]: value },
        }));
      },

      setIsPremium: (value) => {
        set({ isPremium: value });
      },
    }),
    {
      name: 'health-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
