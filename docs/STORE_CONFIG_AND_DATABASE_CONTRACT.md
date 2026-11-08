# Store Configuration & Backend Database Contract Specification

## Executive Summary
This architecture centralizes all business state variables (bundle discounts with per-look overrides, courier delivery fees and thresholds, brand identity, and runway presentation modes) into a unified, typed configuration layer ([`src/store-config.ts`](../src/store-config.ts)). 

Instead of scattered local variables, the frontend now interfaces through a database-ready contract (`StoreConfig` & `StoreConfigRepository`). When connecting to PostgreSQL, Supabase, Prisma, or a REST API backend, developers only need to implement `StoreConfigRepository` and call `setStoreConfigRepository(remoteRepo)`—zero UI components require modification.

---

## 1. Schema & Backend Contract (`StoreConfig`)

```typescript
export interface StoreConfig {
  // Brand & Public Atelier Profile
  brandName: string;
  brandTagline: string;
  instagramHandle: string;
  pickupAddress: string;
  momoNumber: string;
  momoAccountName: string;
  supportPhone: string;
  supportEmail: string;

  // 3D Runway Presentation Mode
  runwayDisplayMode: 1 | 2 | 3; // 1 = Single Hero, 2 = Duo Combo, 3 = Full Outfit

  // Look Bundle Discount Engine
  defaultBundleDiscountPercent: number; // e.g. 10% storewide default
  perLookBundleDiscounts: Record<number, number>; // Look ID (1..12) -> custom discount % override

  // Fulfillment & Courier Logistics
  chargeDeliveryFee: boolean; // true = courier fee applied, false = storewide free delivery
  deliveryFeeGhs: number; // Standard courier fee in GH₵ (e.g. 35 GH₵)
  freeDeliveryThresholdGhs: number; // Subtotal threshold for free delivery in GH₵ (e.g. 1,200 GH₵, 0 = disabled)
  deliveryTurnaround: string; // e.g. "Same-day doorstep courier dispatch in Greater Accra"
  pickupTurnaround: string; // e.g. "Ready for pickup within 2 hours at Osu Flagship"

  // Financial & Currency
  currencyCode: string; // "GHS"
  currencySymbol: string; // "GH₵"
  taxRatePercent: number; // 0 for tax-inclusive pricing
}
```

---

## 2. Plug-and-Play Database Repository Pattern

```mermaid
flowchart TD
    UI[Frontend Components\nRunway / Cart / Checkout / Admin] --> Accessor[store-config.ts\ngetStoreConfig / updateStoreConfig]
    Accessor --> RepoContract[<<interface>>\nStoreConfigRepository]
    RepoContract --> LocalRepo[LocalStorageStoreConfigRepository\n(Current Client State)]
    RepoContract -.-> DBRepo[Supabase / PostgreSQL / REST API\n(Future Backend Driver)]
```

### Future Database Implementation Example
```typescript
import { StoreConfig, StoreConfigRepository, setStoreConfigRepository } from './store-config';

export class SupabaseStoreConfigRepository implements StoreConfigRepository {
  private cachedConfig: StoreConfig;

  async loadFromDatabase(): Promise<StoreConfig> {
    const { data } = await supabase.from('store_config').select('*').single();
    this.cachedConfig = data;
    return data;
  }

  getConfig(): StoreConfig {
    return this.cachedConfig;
  }

  async saveConfig(config: StoreConfig): Promise<void> {
    this.cachedConfig = config;
    await supabase.from('store_config').upsert({ id: 'primary', ...config });
  }
}

// In main.tsx or entry point:
// setStoreConfigRepository(new SupabaseStoreConfigRepository());
```

---

## 3. Business Variable Capabilities

### 1. Bundle Discount Engine (Global & Per-Look Overrides)
- **Storewide Default Rate**: Configurable via Admin Desk (e.g., 10%).
- **Per-Look Overrides**: Merchants can configure custom discount rates for specific looks in the admin settings table (e.g., Look 01 = 15%, Look 03 = 20%, other looks = 10% default).
- **Cart Look Detection**: [`src/bundle-store.ts`](../src/bundle-store.ts) computes discounts dynamically per look using `getBundleDiscountForLook(lookId)`.

### 2. Delivery & Fulfillment Logistics Engine
- **Delivery Toggle**: `chargeDeliveryFee` allows merchant to switch between charging courier fees or offering promotional storewide free shipping.
- **Dynamic Courier Rates**: Standard Accra doorstep delivery fee (e.g., GH₵ 35.00).
- **Free Delivery Order Threshold**: Orders reaching or exceeding `freeDeliveryThresholdGhs` (e.g., GH₵ 1,200) automatically unlock free doorstep delivery.
- **Cart Progress Banner**: Displays a neo-brutalist banner showing how much more the customer needs to add to unlock free delivery.
- **Checkout Modal Reactivity**: Switching between **Doorstep Delivery** and **In-Store Pickup** recalculates shipping fee and total due in real time (Pickup = GH₵ 0.00).

---

## 4. Test Suite & Verification Results
- **28/28 Unit Tests Passing** (`npm test`):
  - `store config initializes with default business variables`
  - `updateStoreConfig updates partial fields and clamps numeric values`
  - `per-look bundle discounts fallback to global default unless overridden`
  - `calculateShippingFee handles pickup, toggle, and free threshold math`
  - `analyzeCartBundles applies per-look discount overrides when configured`
- **TypeScript**: `npx tsc --noEmit` clean (0 errors).
- **Vite Production Build**: `npm run build` succeeds in 688ms.
