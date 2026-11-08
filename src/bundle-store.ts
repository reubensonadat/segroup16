import { LOOKS, PRODUCTS, ProductItem, LookData } from './data';
import { StylingBagItem } from './runway-logic';
import { toGhs } from './currency';
import {
  getStoreConfig,
  updateStoreConfig,
  getBundleDiscountForLook,
  setBundleDiscountForLook,
  DEFAULT_STORE_CONFIG,
} from './store-config';

export { getBundleDiscountForLook, setBundleDiscountForLook };

export const DEFAULT_BUNDLE_DISCOUNT_PERCENT = DEFAULT_STORE_CONFIG.defaultBundleDiscountPercent;
const BUNDLE_STORAGE_KEY = 'runway-bundle-discount-rate-v1';

/**
 * Get the admin-configured Look Bundle discount percentage (e.g. 10 for 10%)
 */
export function getBundleDiscountPercent(): number {
  return getStoreConfig().defaultBundleDiscountPercent;
}

/**
 * Update the admin-configured Look Bundle discount percentage
 */
export function setBundleDiscountPercent(percent: number): void {
  const safePercent = Math.max(0, Math.min(100, Math.round(percent)));
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(BUNDLE_STORAGE_KEY, String(safePercent));
    }
  } catch {
    // fallback
  }
  updateStoreConfig({ defaultBundleDiscountPercent: safePercent });
}

export interface DetectedBundleItem {
  product: ProductItem;
  variantId: number;
  size: string;
  regularPriceGhs: number;
}

export interface DetectedBundle {
  lookIndex: number;
  lookNum: string;
  lookName: string;
  description: string;
  bundleCount: number;
  items: DetectedBundleItem[];
  regularTotalPerBundleGhs: number;
  totalRegularGhs: number;
  discountPercent: number;
  discountAmountGhs: number;
  discountedTotalGhs: number;
}

export interface CartBundleAnalysis {
  bundles: DetectedBundle[];
  totalBundleDiscountGhs: number;
  bundledVariantIds: Set<number>;
}

/**
 * Analyzes the customer's cart items against the 6 3D runway looks.
 * Maps 3-piece outfits (shirt + pants + shoes from the same look) into cohesive bundles
 * and computes the admin-configured discount.
 */
export function analyzeCartBundles(cartItems: StylingBagItem[]): CartBundleAnalysis {
  const detectedBundles: DetectedBundle[] = [];
  const bundledVariantIds = new Set<number>();

  if (cartItems.length === 0) {
    return {
      bundles: [],
      totalBundleDiscountGhs: 0,
      bundledVariantIds,
    };
  }

  // Create a fast lookup from variantId to { product, size, quantity }
  const variantMap = new Map<number, { product: ProductItem; size: string; quantity: number }>();
  for (const item of cartItems) {
    for (const prod of Object.values(PRODUCTS)) {
      const v = prod.variants.find((variant) => variant.id === item.id);
      if (v) {
        variantMap.set(item.id, {
          product: prod,
          size: v.o[0] || 'Default',
          quantity: item.quantity,
        });
        break;
      }
    }
  }

  // Check each of the looks
  for (const look of LOOKS) {
    const lookId = look.index + 1;
    const discountPercent = getBundleDiscountForLook(lookId);
    if (discountPercent <= 0) continue;

    const requiredProductIds = look.items.map((it) => it.productId);
    if (requiredProductIds.length < 3) continue;

    // Find cart entries matching each required product
    const matchingEntries: { productId: string; variantId: number; size: string; product: ProductItem; quantity: number }[] = [];

    for (const prodId of requiredProductIds) {
      for (const [variantId, info] of variantMap.entries()) {
        if (info.product.id === prodId && info.quantity > 0) {
          matchingEntries.push({
            productId: prodId,
            variantId,
            size: info.size,
            product: info.product,
            quantity: info.quantity,
          });
          break;
        }
      }
    }

    // Only a bundle if ALL 3 pieces of this look are in the cart
    if (matchingEntries.length === requiredProductIds.length) {
      const maxPossibleBundles = Math.min(...matchingEntries.map((e) => e.quantity));
      if (maxPossibleBundles > 0) {
        const bundleItems: DetectedBundleItem[] = matchingEntries.map((e) => {
          bundledVariantIds.add(e.variantId);
          return {
            product: e.product,
            variantId: e.variantId,
            size: e.size,
            regularPriceGhs: toGhs(e.product.price),
          };
        });

        const regularTotalPerBundleGhs = bundleItems.reduce((sum, item) => sum + item.regularPriceGhs, 0);
        const totalRegularGhs = regularTotalPerBundleGhs * maxPossibleBundles;
        const discountAmountGhs = Math.round(totalRegularGhs * (discountPercent / 100) * 100) / 100;
        const discountedTotalGhs = totalRegularGhs - discountAmountGhs;

        detectedBundles.push({
          lookIndex: look.index,
          lookNum: look.lookNum,
          lookName: look.name,
          description: look.description,
          bundleCount: maxPossibleBundles,
          items: bundleItems,
          regularTotalPerBundleGhs,
          totalRegularGhs,
          discountPercent,
          discountAmountGhs,
          discountedTotalGhs,
        });
      }
    }
  }

  const totalBundleDiscountGhs = detectedBundles.reduce((sum, b) => sum + b.discountAmountGhs, 0);

  return {
    bundles: detectedBundles,
    totalBundleDiscountGhs,
    bundledVariantIds,
  };
}
