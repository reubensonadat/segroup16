import { PRODUCTS, LOOKS, ProductItem, LookData } from './data';
import { toGhs } from './currency';

export type RunwayDisplayMode = 1 | 2 | 3;

export interface ManagedProduct {
  id: string;
  name: string;
  category: string;
  costPriceGhs: number; // Wholesale / tailoring / fabric cost
  sellingPriceGhs: number; // Retail selling price
  stockQuantity: number;
  image: string;
  sizes: string[];
  hasSizes?: boolean; // false for tech / one-size / no-size items
  specs?: Record<string, string>; // JSON blob for arbitrary technical / fashion specs
  description?: string;
  vendor: string;
  assignedLookId?: number; // Which runway look it belongs to (1 to 12)
}

export interface ManagedRunwayLook {
  id: number; // 1 to 12
  lookNum: string; // "01", "02", ...
  name: string;
  description: string;
  modelImage: string;
  mode?: RunwayDisplayMode; // 1 (Single Hero), 2 (Duo Combo), 3 (Full Outfit)
  topProductId: string; // Item 1 (always present)
  bottomProductId?: string; // Item 2 (present if mode >= 2)
  shoesProductId?: string; // Item 3 (present if mode === 3)
  activeOnRunway: boolean;
}

const PRODUCTS_STORAGE_KEY = 'runway-managed-products-v1';
const LOOKS_STORAGE_KEY = 'runway-managed-looks-v1';
const RUNWAY_MODE_STORAGE_KEY = 'runway-display-mode-v1';

let inMemoryRunwayMode: RunwayDisplayMode = 3;

export function getRunwayDisplayMode(): RunwayDisplayMode {
  try {
    if (typeof localStorage === 'undefined') {
      return inMemoryRunwayMode;
    }
    const val = localStorage.getItem(RUNWAY_MODE_STORAGE_KEY);
    if (val === '1' || val === '2' || val === '3') {
      return parseInt(val, 10) as RunwayDisplayMode;
    }
    return 3;
  } catch {
    return inMemoryRunwayMode;
  }
}

export function setRunwayDisplayMode(mode: RunwayDisplayMode): void {
  inMemoryRunwayMode = mode;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(RUNWAY_MODE_STORAGE_KEY, String(mode));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('runway:mode-updated', { detail: { mode } }));
      }
    }
  } catch (e) {
    console.error('Failed to save runway display mode', e);
  }
}

// Estimated realistic fashion production cost ratio (~40% of retail in Accra)
function estimateCostPrice(sellingPriceGhs: number): number {
  return Math.round(sellingPriceGhs * 0.42);
}

function buildInitialManagedProducts(): ManagedProduct[] {
  const result: ManagedProduct[] = [];
  for (const [id, prod] of Object.entries(PRODUCTS)) {
    const sellingGhs = toGhs(prod.price);
    const costGhs = estimateCostPrice(sellingGhs);
    result.push({
      id,
      name: prod.name,
      category: prod.type || 'Apparel',
      costPriceGhs: costGhs,
      sellingPriceGhs: sellingGhs,
      stockQuantity: 24, // demo stock
      image: prod.image,
      sizes: prod.sizes,
      vendor: prod.vendor,
    });
  }
  return result;
}

function buildInitialManagedLooks(): ManagedRunwayLook[] {
  return LOOKS.map((look) => ({
    id: look.index + 1,
    lookNum: look.lookNum,
    name: look.name,
    description: look.description,
    modelImage: look.model640,
    mode: 3 as RunwayDisplayMode,
    topProductId: look.items[0]?.productId || '',
    bottomProductId: look.items[1]?.productId || '',
    shoesProductId: look.items[2]?.productId || '',
    activeOnRunway: true,
  }));
}

let inMemoryProducts: ManagedProduct[] | null = null;
let inMemoryLooks: ManagedRunwayLook[] | null = null;

export function getManagedProducts(): ManagedProduct[] {
  try {
    if (typeof localStorage === 'undefined') {
      if (!inMemoryProducts) inMemoryProducts = buildInitialManagedProducts();
      return inMemoryProducts;
    }
    const raw = localStorage.getItem(PRODUCTS_STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialManagedProducts();
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildInitialManagedProducts();
  } catch {
    return inMemoryProducts || buildInitialManagedProducts();
  }
}

export function saveManagedProducts(products: ManagedProduct[]): void {
  inMemoryProducts = products;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(products));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('runway:products-updated'));
      }
    }
  } catch (e) {
    console.error('Failed to save managed products', e);
  }
}

export interface ManagedProductPatch {
  name?: string;
  category?: string;
  costPriceGhs?: number;
  sellingPriceGhs?: number;
  stockQuantity?: number;
  image?: string;
  sizes?: string[];
  hasSizes?: boolean;
  specs?: Record<string, string>;
  description?: string;
  vendor?: string;
}

/**
 * Full product editor backing store — merges a partial patch into a managed
 * product (name, vendor, category, image, pricing, stock, sizes, specs) and persists.
 */
export function updateManagedProduct(productId: string, patch: ManagedProductPatch): boolean {
  const products = getManagedProducts();
  const target = products.find((p) => p.id === productId);
  if (!target) return false;

  if (patch.name !== undefined && patch.name.trim()) target.name = patch.name.trim();
  if (patch.category !== undefined && patch.category.trim()) target.category = patch.category.trim();
  if (patch.vendor !== undefined) target.vendor = patch.vendor.trim();
  if (patch.image !== undefined && patch.image.trim()) target.image = patch.image.trim();
  if (patch.costPriceGhs !== undefined) target.costPriceGhs = Math.max(0, patch.costPriceGhs);
  if (patch.sellingPriceGhs !== undefined) target.sellingPriceGhs = Math.max(0, patch.sellingPriceGhs);
  if (patch.stockQuantity !== undefined) target.stockQuantity = Math.max(0, Math.round(patch.stockQuantity));
  if (patch.sizes !== undefined) target.sizes = patch.sizes.map((s) => s.trim()).filter(Boolean);
  if (patch.hasSizes !== undefined) target.hasSizes = patch.hasSizes;
  if (patch.specs !== undefined) target.specs = patch.specs;
  if (patch.description !== undefined) target.description = patch.description.trim();

  saveManagedProducts(products);
  return true;
}

export function updateProductPricing(
  productId: string,
  costPriceGhs: number,
  sellingPriceGhs: number,
  stockQuantity?: number
): boolean {
  const products = getManagedProducts();
  const target = products.find((p) => p.id === productId);
  if (!target) return false;

  target.costPriceGhs = Math.max(0, costPriceGhs);
  target.sellingPriceGhs = Math.max(0, sellingPriceGhs);
  if (stockQuantity !== undefined) {
    target.stockQuantity = Math.max(0, stockQuantity);
  }

  saveManagedProducts(products);
  return true;
}

export function getManagedRunwayLooks(): ManagedRunwayLook[] {
  try {
    if (typeof localStorage === 'undefined') {
      if (!inMemoryLooks) inMemoryLooks = buildInitialManagedLooks();
      return inMemoryLooks;
    }
    const raw = localStorage.getItem(LOOKS_STORAGE_KEY);
    if (!raw) {
      const initial = buildInitialManagedLooks();
      localStorage.setItem(LOOKS_STORAGE_KEY, JSON.stringify(initial));
      return initial;
    }
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : buildInitialManagedLooks();
  } catch {
    return inMemoryLooks || buildInitialManagedLooks();
  }
}

export function saveManagedRunwayLooks(looks: ManagedRunwayLook[]): void {
  inMemoryLooks = looks;
  try {
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem(LOOKS_STORAGE_KEY, JSON.stringify(looks));
      if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
        window.dispatchEvent(new CustomEvent('runway:looks-updated'));
      }
    }
  } catch (e) {
    console.error('Failed to save managed looks', e);
  }
}

export function addOrUpdateRunwayLook(look: ManagedRunwayLook): void {
  const looks = getManagedRunwayLooks();
  const idx = looks.findIndex((l) => l.id === look.id);
  if (idx >= 0) {
    looks[idx] = look;
  } else {
    looks.push(look);
  }
  saveManagedRunwayLooks(looks);
}

export interface GarmentConfigInput {
  name: string;
  category: string;
  costPriceGhs: number;
  sellingPriceGhs: number;
  sizes: string[];
  hasSizes?: boolean;
  specs?: Record<string, string>;
  image?: string;
}

export function configureLookWithGarments(params: {
  lookId: number;
  lookNum: string;
  name: string;
  description: string;
  modelImage: string;
  mode?: RunwayDisplayMode;
  top: GarmentConfigInput;
  bottom?: GarmentConfigInput;
  shoes?: GarmentConfigInput;
}): void {
  const products = getManagedProducts();
  const activeMode: RunwayDisplayMode = params.mode || getRunwayDisplayMode();
  const topId = `fit-${params.lookId}-shirt`;
  const bottomId = activeMode >= 2 ? `fit-${params.lookId}-pants` : '';
  const shoesId = activeMode === 3 ? `fit-${params.lookId}-shoes` : '';

  const upsert = (
    id: string,
    item: GarmentConfigInput,
    defaultImg: string
  ) => {
    if (!id) return;
    const existing = products.find((p) => p.id === id);
    const img = item.image && item.image.trim() ? item.image.trim() : defaultImg;
    if (existing) {
      existing.name = item.name;
      existing.category = item.category;
      existing.costPriceGhs = item.costPriceGhs;
      existing.sellingPriceGhs = item.sellingPriceGhs;
      existing.sizes = item.sizes;
      if (item.hasSizes !== undefined) existing.hasSizes = item.hasSizes;
      if (item.specs !== undefined) existing.specs = item.specs;
      if (item.image) existing.image = item.image;
      existing.assignedLookId = params.lookId;
    } else {
      products.push({
        id,
        name: item.name,
        category: item.category,
        costPriceGhs: item.costPriceGhs,
        sellingPriceGhs: item.sellingPriceGhs,
        stockQuantity: 24,
        image: img,
        sizes: item.sizes,
        hasSizes: item.hasSizes,
        specs: item.specs,
        vendor: 'Runway Atelier',
        assignedLookId: params.lookId,
      });
    }
  };

  const fallbackImg = `/assets/fit-${Math.min(6, Math.max(1, params.lookId))}-model.webp`;
  upsert(topId, params.top, fallbackImg);
  if (activeMode >= 2 && params.bottom) {
    upsert(bottomId, params.bottom, fallbackImg);
  }
  if (activeMode === 3 && params.shoes) {
    upsert(shoesId, params.shoes, fallbackImg);
  }
  saveManagedProducts(products);

  addOrUpdateRunwayLook({
    id: params.lookId,
    lookNum: params.lookNum,
    name: params.name,
    description: params.description,
    modelImage: params.modelImage || fallbackImg,
    mode: activeMode,
    topProductId: topId,
    bottomProductId: bottomId,
    shoesProductId: shoesId,
    activeOnRunway: true,
  });
}

/**
 * Calculates storewide financial metrics:
 * Total COGS, Gross Profit, and Average Profit Margin %
 */
export function getFinancialOverview(ordersTotalRevenueGhs: number) {
  const products = getManagedProducts();
  let totalCostSum = 0;
  let totalSellingSum = 0;

  products.forEach((p) => {
    totalCostSum += p.costPriceGhs;
    totalSellingSum += p.sellingPriceGhs;
  });

  const avgMarginPercent =
    totalSellingSum > 0
      ? Math.round(((totalSellingSum - totalCostSum) / totalSellingSum) * 1000) / 10
      : 55;

  const estimatedCogsGhs = Math.round(ordersTotalRevenueGhs * (1 - avgMarginPercent / 100));
  const estimatedNetProfitGhs = Math.max(0, ordersTotalRevenueGhs - estimatedCogsGhs);

  return {
    revenueGhs: ordersTotalRevenueGhs,
    cogsGhs: estimatedCogsGhs,
    netProfitGhs: estimatedNetProfitGhs,
    marginPercent: avgMarginPercent,
  };
}
