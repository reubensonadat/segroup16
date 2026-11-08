/**
 * Centralized Store Configuration & Business State Layer
 *
 * Provides a database-ready contract (StoreConfig & StoreConfigRepository)
 * separating business rules (bundle discounts, courier fees, thresholds, brand details)
 * from frontend UI components.
 *
 * Connecting a PostgreSQL / Supabase / REST API backend in the future requires
 * only swapping the StoreConfigRepository implementation.
 */

import { USD_TO_GHS } from './currency';

export type RunwayDisplayMode = 1 | 2 | 3;

export interface StoreConfig {
  // Brand & Public Profile
  brandName: string;
  brandTagline: string;
  instagramHandle: string;
  pickupAddress: string;
  momoNumber: string;
  momoAccountName: string;
  supportPhone: string;
  supportEmail: string;

  // Runway Presentation
  runwayDisplayMode: RunwayDisplayMode;

  // Bundle Discount Engine
  defaultBundleDiscountPercent: number; // e.g. 10% storewide default
  perLookBundleDiscounts: Record<number, number>; // Look ID (1..12) -> custom discount % override

  // Fulfillment & Courier Logistics
  chargeDeliveryFee: boolean; // true = courier fee applied, false = storewide free delivery
  deliveryFeeGhs: number; // Standard courier fee in GH₵ (e.g. 35 GH₵)
  freeDeliveryThresholdGhs: number; // Subtotal threshold for free delivery in GH₵ (e.g. 1200 GH₵, 0 = disabled)
  deliveryTurnaround: string; // e.g. "Same-day doorstep dispatch in Accra"
  pickupTurnaround: string; // e.g. "Ready for pickup in 2 hours"

  // Financial & Currency
  currencyCode: string; // "GHS"
  currencySymbol: string; // "GH₵"
  taxRatePercent: number; // 0 for tax-inclusive pricing
}

export interface ShippingCalculation {
  feeGhs: number;
  feeUsd: number;
  isFree: boolean;
  reason: string;
  freeDeliveryEligible: boolean;
  thresholdRemainingGhs: number;
}

export const DEFAULT_STORE_CONFIG: Readonly<StoreConfig> = Object.freeze({
  brandName: 'Around Clothing',
  brandTagline: 'Where Fashion Knows No Boundaries · Accra',
  instagramHandle: '@around_clothingg',
  pickupAddress: 'Oxford Street, Osu Atelier Hub, Accra',
  momoNumber: '024 555 0192',
  momoAccountName: 'Around Clothing Ltd',
  supportPhone: '+233 24 555 0192',
  supportEmail: 'concierge@aroundclothing.store',

  runwayDisplayMode: 3,

  defaultBundleDiscountPercent: 10,
  perLookBundleDiscounts: {},

  chargeDeliveryFee: true,
  deliveryFeeGhs: 35,
  freeDeliveryThresholdGhs: 1200,
  deliveryTurnaround: 'Same-day doorstep courier dispatch in Greater Accra',
  pickupTurnaround: 'Ready for pickup within 2 hours at Osu Flagship',

  currencyCode: 'GHS',
  currencySymbol: 'GH₵',
  taxRatePercent: 0,
});

export const STORE_CONFIG_STORAGE_KEY = 'runway-store-config-v1';

/**
 * Storage Repository Interface
 * Facilitates drop-in backend connectivity (PostgreSQL / Supabase / REST API).
 */
export interface StoreConfigRepository {
  getConfig(): StoreConfig;
  saveConfig(config: StoreConfig): void;
}

export class LocalStorageStoreConfigRepository implements StoreConfigRepository {
  private inMemory: StoreConfig;

  constructor() {
    this.inMemory = this.loadInitial();
  }

  private loadInitial(): StoreConfig {
    try {
      if (typeof localStorage === 'undefined') {
        return { ...DEFAULT_STORE_CONFIG };
      }
      const raw = localStorage.getItem(STORE_CONFIG_STORAGE_KEY);
      if (!raw) {
        return { ...DEFAULT_STORE_CONFIG };
      }
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STORE_CONFIG,
        ...parsed,
        perLookBundleDiscounts: parsed.perLookBundleDiscounts || {},
      };
    } catch {
      return { ...DEFAULT_STORE_CONFIG };
    }
  }

  getConfig(): StoreConfig {
    try {
      if (typeof localStorage === 'undefined') {
        return { ...this.inMemory };
      }
      const raw = localStorage.getItem(STORE_CONFIG_STORAGE_KEY);
      if (!raw) return { ...this.inMemory };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STORE_CONFIG,
        ...parsed,
        perLookBundleDiscounts: parsed.perLookBundleDiscounts || {},
      };
    } catch {
      return { ...this.inMemory };
    }
  }

  saveConfig(config: StoreConfig): void {
    this.inMemory = { ...config };
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(STORE_CONFIG_STORAGE_KEY, JSON.stringify(config));
      }
    } catch (e) {
      console.error('Failed to persist store config to localStorage', e);
    }
  }
}

// Global active repository instance
let activeRepository: StoreConfigRepository = new LocalStorageStoreConfigRepository();

/**
 * Replace active storage repository with a remote backend or database driver
 */
export function setStoreConfigRepository(repo: StoreConfigRepository): void {
  activeRepository = repo;
}

export function getStoreConfig(): StoreConfig {
  return activeRepository.getConfig();
}

/**
 * Update partial store configuration and dispatch change events
 */
export function updateStoreConfig(patch: Partial<StoreConfig>): StoreConfig {
  const current = activeRepository.getConfig();
  const updated: StoreConfig = {
    ...current,
    ...patch,
    perLookBundleDiscounts: patch.perLookBundleDiscounts !== undefined
      ? { ...patch.perLookBundleDiscounts }
      : { ...current.perLookBundleDiscounts },
  };

  // Enforce reasonable numeric boundaries
  if (typeof updated.defaultBundleDiscountPercent === 'number') {
    updated.defaultBundleDiscountPercent = Math.max(0, Math.min(100, Math.round(updated.defaultBundleDiscountPercent)));
  }
  if (typeof updated.deliveryFeeGhs === 'number') {
    updated.deliveryFeeGhs = Math.max(0, Math.round(updated.deliveryFeeGhs * 100) / 100);
  }
  if (typeof updated.freeDeliveryThresholdGhs === 'number') {
    updated.freeDeliveryThresholdGhs = Math.max(0, Math.round(updated.freeDeliveryThresholdGhs * 100) / 100);
  }

  activeRepository.saveConfig(updated);

  // Dispatch reactive events for UI components
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('store:config-updated', { detail: updated }));
    if (patch.defaultBundleDiscountPercent !== undefined) {
      window.dispatchEvent(new CustomEvent('runway:discount-updated', { detail: { percent: updated.defaultBundleDiscountPercent } }));
    }
    if (patch.runwayDisplayMode !== undefined) {
      window.dispatchEvent(new CustomEvent('runway:mode-updated', { detail: { mode: updated.runwayDisplayMode } }));
    }
  }

  return updated;
}

/**
 * Reset configuration to default preset
 */
export function resetStoreConfig(): StoreConfig {
  activeRepository.saveConfig({ ...DEFAULT_STORE_CONFIG });
  if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
    window.dispatchEvent(new CustomEvent('store:config-updated', { detail: DEFAULT_STORE_CONFIG }));
    window.dispatchEvent(new CustomEvent('runway:discount-updated', { detail: { percent: DEFAULT_STORE_CONFIG.defaultBundleDiscountPercent } }));
    window.dispatchEvent(new CustomEvent('runway:mode-updated', { detail: { mode: DEFAULT_STORE_CONFIG.runwayDisplayMode } }));
  }
  return { ...DEFAULT_STORE_CONFIG };
}

/**
 * Get effective bundle discount for a specific runway look (1..12).
 * Returns look-specific override if configured, otherwise falls back to global default.
 */
export function getBundleDiscountForLook(lookId: number): number {
  const cfg = activeRepository.getConfig();
  const override = cfg.perLookBundleDiscounts?.[lookId];
  if (typeof override === 'number' && !isNaN(override) && override >= 0) {
    return Math.min(100, override);
  }
  return cfg.defaultBundleDiscountPercent;
}

/**
 * Configure or remove a bundle discount override for a specific runway look.
 * Pass percent=null to reset look to use global default.
 */
export function setBundleDiscountForLook(lookId: number, percent: number | null): StoreConfig {
  const cfg = activeRepository.getConfig();
  const nextOverrides = { ...cfg.perLookBundleDiscounts };

  if (percent === null || isNaN(percent) || percent < 0) {
    delete nextOverrides[lookId];
  } else {
    nextOverrides[lookId] = Math.max(0, Math.min(100, Math.round(percent)));
  }

  return updateStoreConfig({ perLookBundleDiscounts: nextOverrides });
}

/**
 * Calculates delivery/shipping fee based on fulfillment mode, store config, and order subtotal.
 *
 * Rules:
 * 1. Store Pickup is always complimentary (GH₵ 0.00).
 * 2. If chargeDeliveryFee is false, courier delivery is free (GH₵ 0.00).
 * 3. If order subtotal reaches or exceeds freeDeliveryThresholdGhs, courier delivery is free (GH₵ 0.00).
 * 4. Otherwise, deliveryFeeGhs is charged.
 */
export function calculateShippingFee(
  fulfillment: 'pickup' | 'delivery' = 'delivery',
  subtotalGhs = 0
): ShippingCalculation {
  const cfg = activeRepository.getConfig();

  if (fulfillment === 'pickup') {
    return {
      feeGhs: 0,
      feeUsd: 0,
      isFree: true,
      reason: 'Complimentary Boutique Flagship Collection',
      freeDeliveryEligible: false,
      thresholdRemainingGhs: 0,
    };
  }

  if (!cfg.chargeDeliveryFee) {
    return {
      feeGhs: 0,
      feeUsd: 0,
      isFree: true,
      reason: 'Storewide Free Delivery Promotional Drop',
      freeDeliveryEligible: true,
      thresholdRemainingGhs: 0,
    };
  }

  const threshold = cfg.freeDeliveryThresholdGhs;
  if (threshold > 0 && subtotalGhs >= threshold) {
    return {
      feeGhs: 0,
      feeUsd: 0,
      isFree: true,
      reason: `Free Delivery unlocked (Order reaches GH₵ ${threshold.toLocaleString()})`,
      freeDeliveryEligible: true,
      thresholdRemainingGhs: 0,
    };
  }

  const remaining = threshold > 0 ? Math.max(0, threshold - subtotalGhs) : 0;
  const feeGhs = cfg.deliveryFeeGhs;
  const feeUsd = feeGhs / USD_TO_GHS;

  return {
    feeGhs,
    feeUsd,
    isFree: false,
    reason: `Standard Doorstep Courier Dispatch (GH₵ ${feeGhs.toFixed(2)})`,
    freeDeliveryEligible: false,
    thresholdRemainingGhs: remaining,
  };
}
