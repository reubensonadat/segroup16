import test from 'node:test';
import assert from 'node:assert/strict';
import {
  getStoreConfig,
  updateStoreConfig,
  resetStoreConfig,
  getBundleDiscountForLook,
  setBundleDiscountForLook,
  calculateShippingFee,
  DEFAULT_STORE_CONFIG,
} from './store-config';

test('store config initializes with default business variables', () => {
  resetStoreConfig();
  const cfg = getStoreConfig();
  assert.equal(cfg.brandName, DEFAULT_STORE_CONFIG.brandName);
  assert.equal(cfg.defaultBundleDiscountPercent, 10);
  assert.equal(cfg.chargeDeliveryFee, true);
  assert.equal(cfg.deliveryFeeGhs, 35);
  assert.equal(cfg.freeDeliveryThresholdGhs, 1200);
});

test('updateStoreConfig updates partial fields and clamps numeric values', () => {
  resetStoreConfig();
  const updated = updateStoreConfig({
    brandName: 'Around Studio Accra',
    deliveryFeeGhs: 50,
    freeDeliveryThresholdGhs: 1500,
    defaultBundleDiscountPercent: 120, // should clamp to 100
  });

  assert.equal(updated.brandName, 'Around Studio Accra');
  assert.equal(updated.deliveryFeeGhs, 50);
  assert.equal(updated.freeDeliveryThresholdGhs, 1500);
  assert.equal(updated.defaultBundleDiscountPercent, 100);
});

test('per-look bundle discounts fallback to global default unless overridden', () => {
  resetStoreConfig();
  updateStoreConfig({ defaultBundleDiscountPercent: 12 });

  // Without override, all looks return global default
  assert.equal(getBundleDiscountForLook(1), 12);
  assert.equal(getBundleDiscountForLook(2), 12);

  // Set override on Look 1 to 20%
  setBundleDiscountForLook(1, 20);
  assert.equal(getBundleDiscountForLook(1), 20);
  assert.equal(getBundleDiscountForLook(2), 12); // Look 2 still default

  // Set override on Look 3 to 15%
  setBundleDiscountForLook(3, 15);
  assert.equal(getBundleDiscountForLook(3), 15);

  // Clear override on Look 1 by passing null
  setBundleDiscountForLook(1, null);
  assert.equal(getBundleDiscountForLook(1), 12); // Back to global default
});

test('calculateShippingFee handles pickup, toggle, and free threshold math', () => {
  resetStoreConfig();
  updateStoreConfig({
    chargeDeliveryFee: true,
    deliveryFeeGhs: 35,
    freeDeliveryThresholdGhs: 1000,
  });

  // 1. Pickup is always complimentary
  const pickup = calculateShippingFee('pickup', 500);
  assert.equal(pickup.feeGhs, 0);
  assert.equal(pickup.isFree, true);

  // 2. Delivery under threshold charges standard fee and computes remaining
  const underThreshold = calculateShippingFee('delivery', 600);
  assert.equal(underThreshold.feeGhs, 35);
  assert.equal(underThreshold.isFree, false);
  assert.equal(underThreshold.thresholdRemainingGhs, 400);

  // 3. Delivery at or above threshold is free
  const atThreshold = calculateShippingFee('delivery', 1000);
  assert.equal(atThreshold.feeGhs, 0);
  assert.equal(atThreshold.isFree, true);
  assert.equal(atThreshold.thresholdRemainingGhs, 0);

  // 4. Delivery when chargeDeliveryFee is false is free storewide
  updateStoreConfig({ chargeDeliveryFee: false });
  const promoDrop = calculateShippingFee('delivery', 200);
  assert.equal(promoDrop.feeGhs, 0);
  assert.equal(promoDrop.isFree, true);
});
